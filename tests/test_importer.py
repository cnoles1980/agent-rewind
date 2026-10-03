import json
import pytest
from pathlib import Path

from agent_rewind.importer import import_codex


def test_codex_calls_duplicates_missing_context_and_private_metadata(tmp_path):
    path = tmp_path / "session.jsonl"
    items = [
        {
            "type": "session_meta",
            "payload": {"creator_account_id": "PRIVATE_ACCOUNT", "cwd": "C:/Users/Corey"},
        },
        {"type": "turn_context", "payload": {"model": "gpt-test"}},
        {
            "type": "response_item",
            "timestamp": "2026-10-03T00:00:00Z",
            "payload": {"type": "custom_tool_call", "call_id": "c1", "name": "exec", "input": "test"},
        },
        {
            "type": "response_item",
            "timestamp": "2026-10-03T00:00:01Z",
            "payload": {"type": "custom_tool_call_output", "call_id": "c1", "output": "safe"},
        },
        {
            "type": "response_item",
            "payload": {"type": "reasoning", "id": "r1", "summary": [], "encrypted_content": "HIDDEN"},
        },
        {"type": "event_msg", "payload": {"type": "task_complete"}},
        {"type": "unknown_new_record", "payload": {"secret": "UNKNOWN_SECRET"}},
    ]
    items.insert(4, items[3])
    path.write_text("\n".join(json.dumps(x) for x in items))
    tape = import_codex(path)
    assert len(tape.events) == 2
    assert tape.events[1].span_id == "c1"
    assert tape.events[1].duration_ms is None
    assert tape.run.status == "success"
    assert "exact model request unavailable" in tape.run.capabilities["context"]
    assert "PRIVATE_ACCOUNT" not in tape.model_dump_json()
    assert "HIDDEN" not in tape.model_dump_json()
    assert "UNKNOWN_SECRET" not in tape.model_dump_json()
    assert any("unknown_new_record" in x for x in tape.run.warnings)


def test_unknown_timing_and_truncated_tail(tmp_path):
    path = tmp_path / "partial.jsonl"
    path.write_text(
        json.dumps(
            {
                "type": "response_item",
                "payload": {
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": "hello"}],
                },
            }
        )
        + '\n{"type":'
    )
    tape = import_codex(path)
    assert tape.events[0].elapsed_ms is None
    assert tape.run.duration_ms is None
    assert tape.run.status == "incomplete"


def test_rejects_non_session(tmp_path):
    path = tmp_path / "other.jsonl"
    path.write_text('{"type":"not_a_session"}')
    with pytest.raises(ValueError):
        import_codex(path)


def test_compatibility_fixture_and_repeated_messages(tmp_path):
    tape = import_codex(Path(__file__).parent / "fixtures" / "codex-sanitized.jsonl")
    assert len(tape.events) == 4
    assert "SYNTHETIC_ENCRYPTED" not in tape.model_dump_json()
    records = [
        {
            "type": "response_item",
            "timestamp": f"2026-10-03T00:00:0{i}Z",
            "payload": {
                "type": "message",
                "role": "user",
                "content": [{"type": "input_text", "text": "continue"}],
            },
        }
        for i in (1, 2)
    ]
    path = tmp_path / "repeat.jsonl"
    path.write_text("\n".join(json.dumps(r) for r in records))
    assert len(import_codex(path).events) == 2
