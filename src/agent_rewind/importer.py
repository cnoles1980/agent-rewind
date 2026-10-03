"""Read one selected Codex rollout. Never discover history or contact a server."""

import json
from collections import Counter
from datetime import datetime
from pathlib import Path

from .redaction import Redactor
from .schema import Event, Run, Tape, uid
from .tapes import MAX_BYTES


def millis(value):
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp() * 1000
    except (AttributeError, TypeError, ValueError):
        return None


def import_codex(path: Path) -> Tape:
    if path.stat().st_size > MAX_BYTES:
        raise ValueError("Codex session exceeds 20 MB; select a smaller session")
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    raw, truncated = [], False
    for index, line in enumerate(lines):
        if not line.strip():
            continue
        try:
            record = json.loads(line)
            if not isinstance(record, dict):
                raise ValueError("Expected object")
            raw.append(record)
        except ValueError:
            if index == len(lines) - 1 and raw:
                truncated = True
            else:
                raise ValueError(f"Invalid Codex record at line {index + 1}") from None
    if not raw or not any(r.get("type") in ("session_meta", "response_item", "event_msg") for r in raw):
        raise ValueError("Not a supported Codex session recording")
    times = [millis(r.get("timestamp")) for r in raw]
    first = next((t for t in times if t is not None), None)
    run = Run(
        name="Imported Codex session",
        source="codex",
        status="incomplete",
        provider="OpenAI",
        started_at=next((r["timestamp"] for r in raw if millis(r.get("timestamp")) is not None), "Unknown"),
        capabilities={
            "context": "partial transcript; exact model request unavailable",
            "reasoning": "exposed summaries only",
            "memory": "not captured",
            "timing": "record timestamps; execution durations may be unavailable",
        },
        warnings=["Local session format adapter 0.1.0. Imported content is partial; review before sharing."],
    )
    redactor = Redactor(paths=True)
    events, seen, starts, skipped = [], set(), {}, Counter()
    # Response items are the source of truth where Codex also emits UI duplicates.
    response_ids = {
        p.get("call_id") or p.get("id")
        for r in raw
        if r.get("type") == "response_item" and isinstance((p := r.get("payload")), dict)
    }
    response_texts = {
        c.get("text")
        for r in raw
        if r.get("type") == "response_item" and isinstance(r.get("payload"), dict)
        for c in (r.get("payload", {}).get("content") or [])
        if isinstance(c, dict) and isinstance(c.get("text"), str)
    }

    def emit(kind, lane, name, record, **kwargs):
        stamp = record.get("timestamp")
        t = millis(stamp)
        elapsed = max(0, t - first) if t is not None and first is not None else None
        e = Event(
            run_id=run.id,
            seq=len(events),
            kind=kind,
            lane=lane,
            name=name[:200],
            timestamp=stamp or "Unknown",
            elapsed_ms=elapsed,
            provenance="imported",
            **redactor.clean(kwargs),
        )
        events.append(e)
        return e

    for record in raw:
        p = record.get("payload", {})
        if not isinstance(p, dict):
            skipped["invalid payload"] += 1
            continue
        typ = record.get("type")
        if typ == "session_meta":
            continue
        if typ == "turn_context":
            if isinstance(p.get("model"), str):
                run.model = p["model"][:200]
            continue
        if typ == "event_msg":
            if p.get("type") in ("task_complete", "task_completed"):
                run.status = "success"
            elif p.get("type") in ("turn_aborted", "task_failed"):
                run.status = "cancelled" if p["type"] == "turn_aborted" else "failed"
                emit(
                    "error",
                    "errors",
                    "Turn interrupted",
                    record,
                    status="failed",
                    data={"reason": p.get("reason", p["type"])},
                )
            elif p.get("type") == "task_started":
                run.status = "incomplete"
            elif p.get("type") == "item_completed":
                item = p.get("item", {})
                if not isinstance(item, dict):
                    continue
                if (item.get("call_id") or item.get("id")) in response_ids:
                    continue
                if item.get("type") in ("commandExecution", "command_execution", "mcpToolCall"):
                    identity = item.get("id") or uid()
                    # UI wrappers can describe the same raw calls with different IDs; avoid duplicate capture.
                    if response_ids - {None}:
                        skipped["unmatched UI tool representation (raw calls preferred)"] += 1
                        continue
                    emit(
                        "tool.end",
                        "tools",
                        item.get("tool", "Command execution"),
                        record,
                        span_id=identity,
                        status="unknown"
                        if item.get("exitCode") is None
                        else "failed"
                        if item["exitCode"]
                        else "success",
                        duration_ms=item.get("durationMs"),
                        data={
                            "input": item.get("command", item.get("arguments")),
                            "output": item.get("output"),
                            "capture": "completed item only",
                        },
                    )
            elif p.get("type") in ("user_message", "agent_message", "agent_reasoning"):
                text = p.get("message", p.get("text"))
                if isinstance(text, str) and text and text not in response_texts:
                    emit(
                        "message",
                        "model",
                        "Exposed reasoning summary"
                        if p["type"] == "agent_reasoning"
                        else "User prompt"
                        if p["type"] == "user_message"
                        else "Agent message",
                        record,
                        data={"text": text, "capture": "UI transcript, not full model context"},
                    )
            elif p.get("type") != "token_count":
                skipped["event_msg:" + str(p.get("type"))] += 1
            continue
        if typ != "response_item":
            if typ not in ("token_usage_record", "world_state"):
                skipped[str(typ)] += 1
            continue
        kind = p.get("type")
        ident = p.get("id") or p.get("call_id")
        key = (kind, ident) if ident else (kind, record.get("timestamp"), json.dumps(p, sort_keys=True))
        if key in seen:
            continue
        seen.add(key)
        if kind in ("function_call", "custom_tool_call"):
            span = p.get("call_id") or p.get("id") or uid()
            name = p.get("name", "Tool call")
            e = emit(
                "tool.start",
                "tools",
                name,
                record,
                span_id=span,
                status="running",
                data={"input": p.get("arguments", p.get("input"))},
            )
            starts[span] = e
        elif kind in ("function_call_output", "custom_tool_call_output"):
            span = p.get("call_id") or uid()
            start = starts.get(span)
            emit(
                "tool.end",
                "tools",
                start.name if start else "Tool output",
                record,
                span_id=span,
                status="unknown",
                data={"output": p.get("output"), "capture": "recorded result; execution status unknown"},
            )
        elif kind == "reasoning":
            summary = p.get("summary", [])
            if summary:
                emit("message", "model", "Exposed reasoning summary", record, data={"summary": summary})
        elif kind == "message" and p.get("role") in ("user", "assistant"):
            content = p.get("content", [])
            # Do not preserve embedded attachments, image data, or internal routing metadata.
            text = [
                c.get("text", "")
                for c in content
                if isinstance(c, dict) and c.get("type") in ("input_text", "output_text", "text")
            ]
            if text:
                emit(
                    "message",
                    "model",
                    "User prompt" if p["role"] == "user" else "Agent message",
                    record,
                    data={"role": p["role"], "text": "\n".join(text)},
                )
        else:
            skipped[str(kind)] += 1
        if len(events) > 10000:
            raise ValueError("Session exceeds 10,000 events")
    if truncated:
        run.status = "incomplete"
        run.warnings.append("Recovered a truncated final record.")
    if skipped:
        run.warnings.append("Skipped record types: " + ", ".join(f"{k} ({v})" for k, v in skipped.items()))
    run.duration_ms = max((e.elapsed_ms or 0 for e in events), default=0) if first is not None else None
    return Tape(run=run, events=events)
