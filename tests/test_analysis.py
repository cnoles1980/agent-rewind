import asyncio
import json

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from agent_rewind.analysis import AnalysisRequest, AnalysisResult, AnalysisFailure, analyze
from agent_rewind.api import create_app
from agent_rewind.config import Settings
from agent_rewind.storage import Store, digest

CODE = "analysis-invitation-synthetic"
ORIGIN = "http://testserver"


def payload(**overrides):
    return (
        dict(
            evidence=report("policy says strictly above $50."),
            event_ids=["e1"],
            reviewed=True,
            idempotency_key="analysis-request-001",
        )
        | overrides
    )


def report(text):
    return (
        "```json\n" + json.dumps({"event": "e1", "kind": "tool.end", "evidence": {"output": text}}) + "\n```"
    )


def draft(**overrides):
    return (
        dict(
            explanation={"text": "The supplied policy excludes exactly $50.", "excerpt_ids": [1]},
            next_step={"text": "Confirm the intended threshold before editing.", "excerpt_ids": [1]},
            quotes=[{"excerpt_id": 1}],
            questions=[],
            missing_evidence=["Current implementation not supplied."],
            verification_steps=["Inspect the unchanged boundary test."],
        )
        | overrides
    )


def result(**overrides):
    return (
        dict(
            explanation={"text": "The policy excludes exactly $50.", "event_ids": ["e1"]},
            next_step={"text": "Confirm the intended threshold before editing.", "event_ids": ["e1"]},
            facts=[{"text": "The policy excludes $50.", "event_ids": ["e1"]}],
            hypotheses=[],
            missing_evidence=["No test outcome captured."],
            verification_steps=["Check the immutable boundary test."],
            repair_prompt="Inspect current code and verify the $50 boundary before changing it.",
        )
        | overrides
    )


def config(tmp_path, **overrides):
    return Settings(
        **(
            dict(
                data_dir=tmp_path,
                origin=ORIGIN,
                tester_hash=digest(CODE),
                api_key="synthetic-private-key",
                analysis_enabled=True,
                analysis_prices_verified=True,
            )
            | overrides
        )
    )


def post(client, data=None):
    return client.post("/api/analyses", json=data or payload(), headers={"origin": ORIGIN})


def login(client):
    assert client.post("/api/session", json={"code": CODE}, headers={"origin": ORIGIN}).status_code == 200


@pytest.mark.asyncio
async def test_model_boundary_redaction_no_tools_and_citations(tmp_path):
    cfg = config(tmp_path)
    captured = []

    async def model(c, **body):
        captured.append(body)
        return {
            "choices": [
                {
                    "finish_reason": "stop",
                    "message": {
                        "content": json.dumps(draft(
                            missing_evidence=["Never reveal " + cfg.api_key],
                            explanation={"text": "Secret " + cfg.api_key, "excerpt_ids": [1]},
                            next_step={"text": "Secret " + cfg.api_key, "excerpt_ids": [1]},
                        ))
                    },
                }
            ],
            "usage": {"total_tokens": 88, "secret": cfg.api_key},
        }

    parsed, usage = await analyze(
        cfg,
        AnalysisRequest(**payload(evidence=report("policy says strictly above $50. " + cfg.api_key))),
        model,
    )
    assert cfg.api_key not in json.dumps(captured) + parsed.model_dump_json()
    assert "tools" not in captured[0]
    assert captured[0]["max_tokens"] == 8192
    assert captured[0]["temperature"] == 1.0
    assert captured[0]["top_p"] == 0.95
    assert captured[0]["response_format"]["type"] == "json_schema"
    assert "untrusted" in captured[0]["messages"][0]["content"]
    assert usage == {"total_tokens": 88}
    assert parsed.facts[0].text.startswith("output:\npolicy says strictly above $50.")
    assert "independently confirming the cause" in parsed.repair_prompt


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "content,finish",
    [
        (json.dumps(draft(quotes=[{"excerpt_id": 999}])), "stop"),
        (json.dumps(draft(explanation={"text": "Invented source", "excerpt_ids": [999]})), "stop"),
        (json.dumps(draft(next_step={"text": "Invented source", "excerpt_ids": [999]})), "stop"),
        (json.dumps(draft(next_step={"text": "Uncited suggestion", "excerpt_ids": []})), "stop"),
        ("not JSON", "stop"),
        (json.dumps(draft()), "length"),
        (json.dumps(draft(quotes=[{"excerpt_id": 1, "quote": "A fabricated non-empty array"}])), "stop"),
    ],
)
async def test_rejects_invented_citations_malformed_and_truncated_results(tmp_path, content, finish):
    async def model(*args, **kwargs):
        return {"choices": [{"finish_reason": finish, "message": {"content": content}}]}

    with pytest.raises((ValueError, ValidationError)):
        await analyze(config(tmp_path), AnalysisRequest(**payload()), model)


def test_missing_evidence_rejected_before_budget_or_inference(tmp_path):
    async def never(*args):
        pytest.fail("No model call for metadata-only evidence")

    app = create_app(config(tmp_path), analyzer=never)
    with TestClient(app) as client:
        login(client)
        for evidence in ("Metadata only", '```json\n{"event": "e1", "evidence": {}}\n```'):
            response = post(client, payload(evidence=evidence))
            assert response.status_code == 422
            assert "No model call" in response.text
        assert app.state.store.budget() == {}


def test_safe_failure_category_does_not_expose_private_provider_body(tmp_path):
    async def fail(*args):
        raise AnalysisFailure("evidence_mismatch")

    app = create_app(config(tmp_path), analyzer=fail)
    with TestClient(app) as client:
        login(client)
        response = post(client)
        assert response.status_code == 502
        assert "[evidence_mismatch]" in response.text
        assert app.state.store.budget() == {"tester": 25}


def test_analysis_access_idempotency_and_no_content_persistence(tmp_path):
    calls = []

    async def analyzer(cfg, body):
        calls.append(body.evidence)
        return AnalysisResult(**result()), {"total_tokens": 100}

    app = create_app(config(tmp_path), analyzer=analyzer)
    with TestClient(app) as client:
        status = client.get("/api/status").json()
        assert status["analysis_available"] and not status["live_available"]
        assert post(client).status_code == 401
        login(client)
        assert client.post("/api/analyses", json=payload()).status_code == 403
        assert post(client, payload(reviewed=False)).status_code == 422
        assert post(client).status_code == 200
        assert post(client).status_code == 409
        assert len(calls) == 1
        assert app.state.store.budget() == {"tester": 25}
        with app.state.store.db() as db:
            rows = [dict(r) for r in db.execute("SELECT * FROM analyses")]
        assert rows[0]["status"] == "completed"
        assert "strictly above" not in json.dumps(rows)
        assert "repair_prompt" not in json.dumps(rows)


@pytest.mark.parametrize(
    "failure,code", [(RuntimeError("private provider body"), 502), (TimeoutError(), 504)]
)
def test_failure_private_no_retry_and_reservation_retained(tmp_path, failure, code):
    calls = []

    async def fail(*args):
        calls.append(1)
        raise failure

    app = create_app(config(tmp_path), analyzer=fail)
    with TestClient(app) as client:
        login(client)
        response = post(client)
        assert response.status_code == code
        assert "private provider body" not in response.text
        assert calls == [1]
        assert app.state.store.budget() == {"tester": 25}
        with app.state.store.db() as db:
            assert db.execute("SELECT status FROM analyses").fetchone()[0] == "failed"


def test_budget_pool_judge_reserve_concurrency_and_restart(tmp_path):
    cfg = config(tmp_path, test_budget_cents=100, reserve_cents=100)
    store = Store(tmp_path)
    store.reserve_analysis("first", "tester", "analysis-1", cfg)
    with pytest.raises(ValueError, match="running"):
        store.reserve_analysis("second", "judge", "analysis-2", cfg)
    store.finish_analysis("first", "analysis-1", "failed")
    with pytest.raises(ValueError, match="budget"):
        store.enqueue("first", "tester", "stale", "job1", cfg)
    store.enqueue("judge", "judge", "stale", "job2", cfg)
    store.reserve_analysis("judge", "judge", "analysis-2", cfg)
    with TestClient(create_app(cfg)):
        with store.db() as db:
            assert (
                db.execute("SELECT status FROM analyses WHERE idem='analysis-2'").fetchone()[0]
                == "interrupted"
            )
    assert store.budget() == {"tester": 25, "judge": 125}
    cfg.non_execution_cents = 9900
    with pytest.raises(ValueError, match="Total"):
        store.reserve_analysis("judge", "judge", "analysis-3", cfg)


def test_limits_disabled_and_utf8(tmp_path):
    with pytest.raises(ValidationError):
        AnalysisRequest(**payload(evidence="🎉" * 12001))
    with pytest.raises(ValidationError):
        AnalysisRequest(**payload(event_ids=["e1", "e1"]))
    with TestClient(create_app(config(tmp_path, analysis_enabled=False))) as client:
        login(client)
        assert post(client).status_code == 503
        assert post(client, payload(evidence="x" * 48001)).status_code == 422
        assert (
            client.post("/api/analyses", content=b"x" * 320001, headers={"origin": ORIGIN}).status_code == 413
        )


@pytest.mark.asyncio
async def test_analysis_cancellation_releases_slot_but_keeps_reservation(tmp_path):
    # Exercise cancellation through the endpoint function without a TestClient transport swallowing it.
    from starlette.requests import Request

    async def cancel(*args):
        raise asyncio.CancelledError()

    app = create_app(config(tmp_path), analyzer=cancel)
    token = app.state.store.create_session("tester")
    endpoint = next(r.endpoint for r in app.routes if r.path == "/api/analyses")
    request = Request({"type": "http", "headers": [(b"cookie", f"rewind_session={token}".encode())]})
    with pytest.raises(asyncio.CancelledError):
        await endpoint(AnalysisRequest(**payload()), request)
    with app.state.store.db() as db:
        assert db.execute("SELECT status FROM analyses").fetchone()[0] == "interrupted"
    assert app.state.store.budget() == {"tester": 25}
