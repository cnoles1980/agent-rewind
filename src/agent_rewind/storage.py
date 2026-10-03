import hashlib
import json
import secrets
import sqlite3
import time
from contextlib import contextmanager


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


class Store:
    def __init__(self, directory):
        directory.mkdir(parents=True, exist_ok=True)
        self.path = directory / "rewind.sqlite3"
        with self.db() as db:
            db.executescript("""
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, role TEXT NOT NULL, expires REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY, owner TEXT NOT NULL, role TEXT NOT NULL, variant TEXT NOT NULL,
                status TEXT NOT NULL, idem TEXT NOT NULL, created REAL NOT NULL, reservation INTEGER NOT NULL,
                operation TEXT, error TEXT, usage TEXT, UNIQUE(owner,idem));
            CREATE TABLE IF NOT EXISTS clips (
                token TEXT PRIMARY KEY, owner TEXT NOT NULL, manage TEXT NOT NULL, tape TEXT NOT NULL, created REAL NOT NULL);
            """)

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def rate_limit(self, key, limit, seconds):
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            now = time.time()
            db.execute("DELETE FROM attempts WHERE reset < ?", (now,))
            row = db.execute("SELECT * FROM attempts WHERE key=?", (key,)).fetchone()
            if row and row["count"] >= limit:
                return False
            db.execute(
                "INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
                (key, now + seconds),
            )
            return True

    def session(self, token):
        with self.db() as db:
            db.execute("DELETE FROM sessions WHERE expires < ?", (time.time(),))
            row = db.execute("SELECT * FROM sessions WHERE id=?", (digest(token),)).fetchone()
            return dict(row) if row else None

    def create_session(self, role):
        token = secrets.token_urlsafe(32)
        with self.db() as db:
            db.execute("INSERT INTO sessions VALUES(?,?,?)", (digest(token), role, time.time() + 7 * 86400))
        return token

    def job(self, job_id):
        with self.db() as db:
            row = db.execute("SELECT * FROM jobs WHERE id=?", (job_id,)).fetchone()
            return dict(row) if row else None

    def enqueue(self, owner, role, variant, idem, settings):
        from .schema import uid

        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            old = db.execute("SELECT * FROM jobs WHERE owner=? AND idem=?", (owner, idem)).fetchone()
            if old:
                if old["variant"] != variant:
                    raise ValueError("Idempotency key already used for a different variant")
                return old["id"]
            used = db.execute(
                "SELECT COALESCE(SUM(reservation),0) FROM jobs WHERE role=?", (role,)
            ).fetchone()[0]
            budget = settings.judge_budget_cents if role == "judge" else settings.test_budget_cents
            if used + settings.reserve_cents > budget:
                raise ValueError(
                    "Execution budget reserved. Contact the project owner; recordings remain available."
                )
            total = db.execute("SELECT COALESCE(SUM(reservation),0) FROM jobs").fetchone()[0]
            if total + settings.non_execution_cents + settings.reserve_cents > 10000:
                raise ValueError("Total $100 project budget reserved")
            if (
                db.execute("SELECT COUNT(*) FROM jobs WHERE status IN ('queued','running')").fetchone()[0]
                >= 5
            ):
                raise ValueError("Demo queue is full. Try again after the current run.")
            job_id = uid()
            db.execute(
                "INSERT INTO jobs(id,owner,role,variant,status,idem,created,reservation) VALUES(?,?,?,?,'queued',?,?,?)",
                (job_id, owner, role, variant, idem, time.time(), settings.reserve_cents),
            )
            return job_id

    def update_job(self, job_id, **values):
        if not set(values) <= {"status", "operation", "error", "usage"}:
            raise ValueError("Invalid job update")
        with self.db() as db:
            db.execute(
                "UPDATE jobs SET " + ",".join(k + "=?" for k in values) + " WHERE id=?",
                (*values.values(), job_id),
            )

    def next_job(self):
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            if db.execute("SELECT 1 FROM jobs WHERE status='running' LIMIT 1").fetchone():
                return None
            row = db.execute("SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1").fetchone()
            if row:
                db.execute("UPDATE jobs SET status='running' WHERE id=?", (row["id"],))
            return dict(row) if row else None

    def budget(self):
        with self.db() as db:
            rows = db.execute("SELECT role,SUM(reservation) AS total FROM jobs GROUP BY role").fetchall()
            return {r["role"]: r["total"] for r in rows}

    def put_clip(self, owner, tape):
        token, manage = secrets.token_urlsafe(24), secrets.token_urlsafe(32)
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            size = len(json.dumps(tape).encode())
            used = db.execute("SELECT COALESCE(SUM(length(CAST(tape AS BLOB))),0) FROM clips").fetchone()[0]
            if used + size > 128 * 1024 * 1024:
                raise ValueError("Hosted clip storage is full; export locally or revoke older clips")
            if db.execute("SELECT COUNT(*) FROM clips WHERE owner=?", (owner,)).fetchone()[0] >= 50:
                raise ValueError("Clip limit reached; revoke an older clip first")
            db.execute(
                "INSERT INTO clips VALUES(?,?,?,?,?)",
                (token, owner, digest(manage), json.dumps(tape), time.time()),
            )
        return token, manage
