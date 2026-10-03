import asyncio
import json

import pytest

from agent_rewind import Recorder
from agent_rewind.redaction import Redactor
from agent_rewind.tapes import loads, read


@pytest.mark.parametrize("run_id", ["../escaped", "nested/file", "C:\\outside", ".", ""])
def test_run_id_cannot_escape_output_directory(tmp_path, run_id):
    with pytest.raises(ValueError, match="run_id"):
        Recorder("unsafe filename", tmp_path / "runs", run_id=run_id)
    assert list(tmp_path.rglob("*.jsonl")) == []


async def test_cancellation_without_message_records_failure(tmp_path):
    async def cancel():
        raise asyncio.CancelledError()

    with pytest.raises(asyncio.CancelledError):
        async with Recorder("cancelled", tmp_path) as tape:
            await tape.atool_call("cancel", cancel, arguments={})
    loaded = read(tape.path)
    assert loaded.run.status == "failed"
    end = next(e for e in loaded.events if e.kind == "tool.end")
    assert end.status == "failed"
    assert end.data["error"] == "CancelledError"


def test_registered_secrets_are_redacted_in_labels_keys_and_notes(tmp_path):
    secret = "private-customer-seeded-42"
    with Recorder(secret, tmp_path, model=secret, provider=secret, secrets=[secret]) as tape:
        tape.tool_call(secret, lambda: {secret: {"nested": secret}}, arguments={})
        tape.memory_write(secret, "memory value")
        tape.annotate("note", event_id=secret)
    assert secret not in tape.path.read_text()
    assert secret not in tape.path.with_suffix(".notes.json").read_text()
    encoded = Redactor(secrets=[secret]).clean(json.dumps({secret: "value"}))
    assert secret not in encoded
    # Redacting two property names must not silently drop either captured value.
    assert len(Redactor(secrets=[secret, "other-customer"]).clean({secret: 1, "other-customer": 2})) == 2


def test_exception_without_message_is_a_failed_span(tmp_path):
    def fail():
        raise ValueError()

    with pytest.raises(ValueError):
        with Recorder("empty failure", tmp_path) as tape:
            tape.tool_call("fail", fail, arguments={})
    loaded = read(tape.path)
    assert loaded.run.status == "failed"
    assert next(e for e in loaded.events if e.kind == "tool.end").status == "failed"
    assert any(e.kind == "error" and e.data["error"] for e in loaded.events)


def test_recording_preserves_actual_context_and_redacts_before_disk(tmp_path):
    secret = "private-credential-seeded-42"

    def model(**kw):
        return {
            "choices": [{"message": {"content": "done", "encrypted_content": "never-store-me"}}],
            "usage": {"prompt_tokens": 3, "completion_tokens": 2},
            "echo": secret,
        }

    with Recorder("test", tmp_path, secrets=[secret]) as tape:
        result = tape.model_call(
            model, model="nvidia/test", messages=[{"role": "user", "content": secret}], api_key=secret
        )
        tape.tool_call(
            "fetch", lambda **kw: {"token": secret}, arguments={"password": secret}, call_id="call1"
        )
        tape.context_snapshot([{"role": "user", "content": secret}])
        tape.annotate("Safe annotation")
    disk = tape.path.read_text()
    assert secret not in disk and "never-store-me" not in disk
    assert result["echo"] == secret  # recording must not alter the agent's actual response
    loaded = read(tape.path)
    assert loaded.run.status == "success"
    assert len([e for e in loaded.events if e.kind == "context"]) == 1
    assert len(loaded.notes) == 1
    assert loaded.events[0].data["messages"][0]["content"] == "[REDACTED]"


def test_exception_is_recorded_and_propagated(tmp_path):
    with pytest.raises(ValueError, match="broken"):
        with Recorder("failure", tmp_path) as tape:

            def broken():
                raise ValueError("broken")

            tape.tool_call("broken", broken, arguments={})
    loaded = read(tape.path)
    assert loaded.run.status == "failed"
    assert any(e.kind == "error" for e in loaded.events)
    assert loaded.events[0].kind == "tool.start"


async def test_async_wrappers(tmp_path):
    async def result(**kw):
        return {"ok": True}

    async with Recorder("async", tmp_path) as tape:
        assert await tape.amodel_call(result, messages=[]) == {"ok": True}
        await tape.atool_call("tool", result, arguments={})
        await tape.amemory_write("step", "done")
        await tape.aannotate("Done")
    assert read(tape.path).run.status == "success"


def test_truncated_last_record_is_not_success(tmp_path):
    with Recorder("partial", tmp_path) as tape:
        tape.memory_write("key", 1)
    text = tape.path.read_text()
    loaded = loads(text + '{"record":')
    assert loaded.run.status == "incomplete"
    assert loaded.run.warnings
    with pytest.raises(ValueError):
        loads(text.splitlines()[0] + "\n{bad}\n" + text.splitlines()[1])


def test_redaction_inside_json_strings_and_paths():
    value = Redactor(paths=True).clean(
        {
            "arguments": json.dumps({"api_key": "secret"}),
            "text": "Bearer abc.def.123 password=hello C:\\Users\\corey\\private.txt",
        }
    )
    assert "secret" not in str(value) and "hello" not in str(value) and "corey" not in str(value)


def test_io_failure_does_not_mask_agent_exception(tmp_path):
    with pytest.warns(RuntimeWarning), pytest.raises(ValueError, match="actual tool error"):
        with Recorder("disk", tmp_path) as tape:

            class BrokenFile:
                def write(self, value):
                    raise OSError("disk full")

                def close(self):
                    raise OSError("close failed")

            tape._file.close()
            tape._file = BrokenFile()

            def fail():
                raise ValueError("actual tool error")

            with pytest.warns(RuntimeWarning):
                tape.tool_call("fail", fail, arguments={})
