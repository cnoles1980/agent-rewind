"""The versioned tape contract. JSON Schema is also used by the browser."""

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field, model_validator


def uid() -> str:
    return str(uuid4())


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Run(StrictModel):
    record: Literal["run"] = "run"
    schema_version: Literal[1] = 1
    id: str = Field(default_factory=uid, min_length=1, max_length=120)
    name: str = Field(max_length=200)
    source: Literal["python", "codex", "demo", "example", "clip"] = "python"
    version: str = "0.1.0"
    started_at: str = Field(default_factory=now)
    model: str | None = None
    provider: str | None = None
    status: Literal["running", "success", "failed", "cancelled", "incomplete"] = "running"
    duration_ms: float | None = Field(default=None, ge=0)
    capabilities: dict[str, str] = Field(default_factory=dict)
    configuration: dict[str, Any] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)


class Event(StrictModel):
    record: Literal["event"] = "event"
    id: str = Field(default_factory=uid, min_length=1, max_length=120)
    run_id: str = Field(min_length=1, max_length=120)
    seq: int = Field(ge=0)
    kind: Literal[
        "model.start",
        "model.end",
        "tool.start",
        "tool.end",
        "context",
        "memory",
        "error",
        "message",
        "run.end",
    ]
    lane: Literal["model", "tools", "context", "memory", "errors"]
    name: str = Field(max_length=200)
    timestamp: str = Field(default_factory=now)
    elapsed_ms: float | None = Field(default=None, ge=0)
    duration_ms: float | None = Field(default=None, ge=0)
    span_id: str | None = None
    parent_id: str | None = None
    snapshot_id: str | None = None
    status: Literal["running", "success", "failed", "cancelled", "unknown"] = "success"
    provenance: Literal["captured", "imported", "fixture", "derived"] = "captured"
    partial: bool = False
    data: dict[str, Any] = Field(default_factory=dict)


class Note(StrictModel):
    record: Literal["note"] = "note"
    id: str = Field(default_factory=uid, min_length=1, max_length=120)
    run_id: str
    event_id: str | None = None
    elapsed_ms: float = Field(ge=0)
    text: str = Field(min_length=1, max_length=2000)
    created_at: str = Field(default_factory=now)
    updated_at: str = Field(default_factory=now)


class Tape(StrictModel):
    run: Run
    events: list[Event] = Field(max_length=10000)
    notes: list[Note] = Field(default_factory=list, max_length=1000)

    @model_validator(mode="after")
    def validate_links(self):
        if any(e.run_id != self.run.id for e in self.events) or any(
            n.run_id != self.run.id for n in self.notes
        ):
            raise ValueError("Tape contains records from another run")
        ids = [e.id for e in self.events]
        if len(set(ids)) != len(ids):
            raise ValueError("Duplicate event IDs")
        seq = [e.seq for e in self.events]
        if seq != sorted(set(seq)):
            raise ValueError("Event sequence must be unique and ordered")
        return self
