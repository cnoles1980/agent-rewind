import pytest
from fastapi.testclient import TestClient

from agent_rewind.api import create_app
from agent_rewind.config import Settings
from agent_rewind.schema import Run, Tape
from agent_rewind.storage import digest

CODE = "test-invitation-only-0123456789"
ORIGIN = "http://testserver"


@pytest.fixture
def app(tmp_path):
    cfg = Settings(
        data_dir=tmp_path, origin=ORIGIN, tester_hash=digest(CODE), judge_hash=digest(CODE + "judge")
    )
    return create_app(cfg)


def login(client, code=CODE):
    return client.post("/api/session", json={"code": code}, headers={"origin": ORIGIN})


def test_server_key_never_reaches_public_or_invited_status(tmp_path):
    key = "synthetic-nebius-credential-never-send-to-browser"
    cfg = Settings(data_dir=tmp_path, origin=ORIGIN, api_key=key, judge_hash=digest(CODE))
    with TestClient(create_app(cfg)) as client:
        public_status = client.get("/api/status")
        assert public_status.status_code == 200
        assert key not in public_status.text
        denied = client.post(
            "/api/demo-runs",
            json={"variant": "stale", "idempotency_key": "public-denied-123"},
            headers={"origin": ORIGIN},
        )
        assert denied.status_code == 401
        assert key not in denied.text
        result = login(client)
        assert result.status_code == 200
        assert key not in result.text
        invited_status = client.get("/api/status")
        assert invited_status.json()["authenticated"] is True
        assert key not in invited_status.text
        assert "api_key" not in invited_status.json()


def test_session_csrf_and_cookie(app):
    with TestClient(app) as client:
        assert client.post("/api/session", json={"code": CODE}).status_code == 403
        result = login(client)
        assert result.status_code == 200
        assert "HttpOnly" in result.headers["set-cookie"]
        assert "SameSite=strict" in result.headers["set-cookie"]
        assert client.get("/api/status").json()["authenticated"] is True
        assert (
            client.post(
                "/api/demo-runs",
                json={"variant": "stale", "idempotency_key": "test-idem-123"},
                headers={"origin": ORIGIN},
            ).status_code
            == 503
        )
        assert client.delete("/api/session", headers={"origin": ORIGIN}).status_code == 200
        assert client.get("/api/status").json()["authenticated"] is False


def test_clip_review_auth_revocation_and_redaction(app):
    tape = Tape(
        run=Run(
            name="Safe clip",
            source="clip",
            status="incomplete",
            configuration={"reviewed": True, "api_key": "SEEDED_SECRET"},
        ),
        events=[],
    )
    with TestClient(app) as client:
        assert (
            client.post("/api/clips", json=tape.model_dump(), headers={"origin": ORIGIN}).status_code == 401
        )
        login(client)
        body = client.post("/api/clips", json=tape.model_dump(), headers={"origin": ORIGIN}).json()
        token = body["token"]
        result = client.get("/api/clips/" + token)
        assert result.status_code == 200 and "SEEDED_SECRET" not in result.text
        assert result.headers["cache-control"] == "no-store"
        assert client.delete("/api/clips/" + token, headers={"origin": ORIGIN}).status_code == 404
        assert (
            client.delete(
                "/api/clips/" + token, headers={"origin": ORIGIN, "x-clip-management": body["manage_token"]}
            ).status_code
            == 200
        )
        assert client.get("/api/clips/" + token).status_code == 404


def test_limits_and_cross_session_ownership(app):
    with TestClient(app) as first, TestClient(app) as second:
        login(first)
        login(second)
        session = app.state.store.session(first.cookies.get("rewind_session"))
        cfg = app.state.config
        cfg.test_budget_cents = 100
        job = app.state.store.enqueue(session["id"], "tester", "stale", "first-123", cfg)
        assert job == app.state.store.enqueue(session["id"], "tester", "stale", "first-123", cfg)
        with pytest.raises(ValueError, match="budget"):
            app.state.store.enqueue(session["id"], "tester", "stale", "next-123", cfg)
        assert first.get("/api/demo-runs/" + job).status_code == 200
        assert second.get("/api/demo-runs/" + job).status_code == 404
        oversized = first.post(
            "/api/clips",
            content=b"x" * (2 * 1024 * 1024 + 1),
            headers={"origin": ORIGIN, "content-type": "application/json"},
        )
        assert oversized.status_code == 413


def test_budget_judge_reserve_is_separate(app):
    cfg = app.state.config
    cfg.test_budget_cents = 100
    store = app.state.store
    store.enqueue("owner", "tester", "stale", "first-123", cfg)
    store.enqueue("judge", "judge", "stale", "first-123", cfg)
    assert store.budget() == {"tester": 100, "judge": 100}


def test_login_throttled(app):
    with TestClient(app) as client:
        for _ in range(10):
            assert login(client, "wrong-code-12345").status_code == 401
        assert login(client).status_code == 429
