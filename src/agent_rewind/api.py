import asyncio
import contextlib
import hmac
import json
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field

from .config import settings
from .demo import run_demo
from .redaction import Redactor
from .sandbox import NebiusSandbox
from .schema import Tape
from .storage import Store, digest
from .tapes import read

ROOT = Path(__file__).resolve().parents[2]


class BodyLimit:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope.get("method") not in ("POST", "PUT", "PATCH", "DELETE"):
            return await self.app(scope, receive, send)
        limit = 2 * 1024 * 1024 if scope.get("path") == "/api/clips" else 8192
        chunks, size = [], 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            chunk = message.get("body", b"")
            size += len(chunk)
            if size > limit:
                return await JSONResponse({"detail": "Request is too large"}, status_code=413)(
                    scope, receive, send
                )
            chunks.append(chunk)
            if not message.get("more_body", False):
                break
        sent = False

        async def replay():
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": b"".join(chunks), "more_body": False}
            return await receive()

        await self.app(scope, replay, send)


class Credentials(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=12, max_length=200)


class DemoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenario: Literal["shipping-boundary"] = "shipping-boundary"
    variant: Literal["stale", "corrected"]
    idempotency_key: str = Field(min_length=8, max_length=100, pattern=r"^[a-zA-Z0-9_-]+$")


def create_app(config=None, runner=run_demo):
    config = config or settings()
    if config.origin.startswith("https://") and not config.secure_cookies:
        raise ValueError("Set REWIND_SECURE_COOKIES=true for an HTTPS deployment")
    store = Store(config.data_dir)
    active = {}

    async def worker():
        while True:
            if config.blockers():
                await asyncio.sleep(1)
                continue
            job = store.next_job()
            if not job:
                await asyncio.sleep(0.3)
                continue
            task = asyncio.create_task(runner(config, store, job))
            active[job["id"]] = task
            try:
                await task
            except asyncio.CancelledError:
                if asyncio.current_task().cancelling():
                    raise
            except Exception:
                store.update_job(job["id"], status="failed", error="Execution worker stopped unexpectedly")
            finally:
                active.pop(job["id"], None)

    @asynccontextmanager
    async def lifespan(app):
        with store.db() as db:
            interrupted = [dict(r) for r in db.execute("SELECT * FROM jobs WHERE status='running'")]
        for job in interrupted:
            if job["operation"] and config.api_key and config.project:
                sandbox = NebiusSandbox(config)
                sandbox.operation = job["operation"]
                await sandbox.close()
            store.update_job(
                job["id"], status="failed", error="Server restarted; recording may be incomplete"
            )
        task = asyncio.create_task(worker())
        yield
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task

    app = FastAPI(title="Agent Rewind", lifespan=lifespan, docs_url=None, redoc_url=None)
    app.state.store = store
    app.state.config = config
    app.add_middleware(BodyLimit)

    @app.middleware("http")
    async def security(request, call_next):
        if request.method in ("POST", "DELETE", "PATCH", "PUT"):
            if request.headers.get("origin") != config.origin:
                return JSONResponse({"detail": "Origin is not allowed"}, status_code=403)
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
        )
        if request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store"
        return response

    def authenticate(request):
        session = store.session(request.cookies.get("rewind_session", ""))
        if not session:
            raise HTTPException(401, "Enter an invitation code to continue")
        return session

    def own_job(request, job_id):
        session = authenticate(request)
        job = store.job(job_id)
        if not job or not hmac.compare_digest(job["owner"], session["id"]):
            raise HTTPException(404, "Run not found")
        return job

    @app.get("/api/health")
    def health():
        return {"status": "ok", "version": "0.1.0"}

    @app.get("/api/status")
    def status(request: Request):
        session = store.session(request.cookies.get("rewind_session", ""))
        reserved = sum(store.budget().values()) + config.non_execution_cents
        return {
            "live_available": not config.blockers(),
            "blockers": config.blockers(),
            "authenticated": bool(session),
            "role": session["role"] if session else None,
            "model": config.model,
            "budget_reserved_cents": store.budget() if session else None,
            "total_reserved_cents": reserved if session else None,
            "budget_alert": next((n for n in (90, 75, 50) if reserved >= n * 100), None) if session else None,
        }

    @app.post("/api/session")
    def login(body: Credentials, request: Request, response: Response):
        ip = request.client.host if request.client else "unknown"
        if not store.rate_limit("login:" + digest(ip), 10, 900):
            raise HTTPException(429, "Too many attempts; try again in 15 minutes")
        hashed = digest(body.code)
        role = None
        for candidate, expected in (("judge", config.judge_hash), ("tester", config.tester_hash)):
            if expected and hmac.compare_digest(hashed, expected):
                role = candidate
        if not role:
            raise HTTPException(401, "Invitation code is not valid")
        token = store.create_session(role)
        response.set_cookie(
            "rewind_session",
            token,
            httponly=True,
            secure=config.secure_cookies,
            samesite="strict",
            max_age=7 * 86400,
            path="/",
        )
        return {"role": role}

    @app.delete("/api/session")
    def logout(request: Request, response: Response):
        with store.db() as db:
            db.execute(
                "DELETE FROM sessions WHERE id=?", (digest(request.cookies.get("rewind_session", "")),)
            )
        response.delete_cookie("rewind_session", path="/")
        return {"logged_out": True}

    @app.post("/api/demo-runs", status_code=202)
    def start(body: DemoRequest, request: Request):
        session = authenticate(request)
        if config.blockers():
            raise HTTPException(503, "Live execution needs configuration: " + ", ".join(config.blockers()))
        if not store.rate_limit("run:" + session["id"], 10, 3600):
            raise HTTPException(429, "Launch limit reached; try later")
        try:
            job_id = store.enqueue(session["id"], session["role"], body.variant, body.idempotency_key, config)
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from None
        return {"id": job_id, "status": store.job(job_id)["status"]}

    @app.get("/api/demo-runs")
    def recent(request: Request):
        session = authenticate(request)
        with store.db() as db:
            return [
                dict(r)
                for r in db.execute(
                    "SELECT id,variant,status,created FROM jobs WHERE owner=? ORDER BY created DESC LIMIT 30",
                    (session["id"],),
                )
            ]

    @app.get("/api/demo-runs/{job_id}")
    def get_run(job_id: str, request: Request):
        job = own_job(request, job_id)
        path = config.data_dir / "runs" / (job["id"] + ".jsonl")
        tape = read(path) if path.exists() else None
        if tape:
            tape.run.status = job["status"] if job["status"] != "queued" else "running"
        return {
            "id": job["id"],
            "status": job["status"],
            "error": job["error"],
            "tape": tape.model_dump() if tape else None,
        }

    @app.post("/api/demo-runs/{job_id}/cancel")
    async def cancel(job_id: str, request: Request):
        job = own_job(request, job_id)
        if job["status"] == "queued":
            store.update_job(job_id, status="cancelled")
        elif job_id in active:
            active[job_id].cancel()
        return {"requested": True}

    @app.get("/api/examples")
    def example_list():
        return [json.loads(p.read_text(encoding="utf-8")) for p in sorted((ROOT / "examples").glob("*.json"))]

    @app.post("/api/clips", status_code=201)
    def publish(body: Tape, request: Request):
        session = authenticate(request)
        if body.run.source != "clip" or not body.run.configuration.get("reviewed"):
            raise HTTPException(422, "Review the clip before publishing")
        clean = Tape.model_validate(Redactor(secrets=[config.api_key], paths=True).clean(body.model_dump()))
        if len(clean.model_dump_json().encode()) > 2 * 1024 * 1024:
            raise HTTPException(413, "Clip exceeds 2 MB")
        try:
            token, manage = store.put_clip(session["id"], clean.model_dump())
        except ValueError as exc:
            raise HTTPException(409, str(exc)) from None
        return {"token": token, "manage_token": manage, "url": config.origin + "/?clip=" + token}

    @app.get("/api/clips/{token}")
    def clip(token: str):
        if not re.fullmatch(r"[\w-]{32}", token):
            raise HTTPException(404, "Clip not found or revoked")
        with store.db() as db:
            row = db.execute("SELECT tape FROM clips WHERE token=?", (token,)).fetchone()
        if not row:
            raise HTTPException(404, "Clip not found or revoked")
        return json.loads(row["tape"])

    @app.delete("/api/clips/{token}")
    def revoke(token: str, request: Request):
        credential = request.headers.get("x-clip-management", "")
        with store.db() as db:
            row = db.execute("SELECT manage FROM clips WHERE token=?", (token,)).fetchone()
            if not row or not hmac.compare_digest(digest(credential), row["manage"]):
                raise HTTPException(404, "Clip not found")
            db.execute("DELETE FROM clips WHERE token=?", (token,))
        return {"revoked": True}

    dist = ROOT / "web" / "dist"
    if dist.exists():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")
        if (dist / "licenses").exists():
            app.mount("/licenses", StaticFiles(directory=dist / "licenses"), name="licenses")

        @app.get("/")
        def index():
            return FileResponse(dist / "index.html")

    return app


app = create_app()
