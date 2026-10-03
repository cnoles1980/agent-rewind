import asyncio
import json

import pytest

from agent_rewind.config import Settings
from agent_rewind.demo import run_demo
from agent_rewind.storage import Store
from agent_rewind.tapes import read


class SandboxDouble:
    instances = []

    def __init__(self, config, on_operation):
        self.closed = False
        self.calls = []
        self.instances.append(self)

    async def evaluate(self, source, acceptance=False):
        # A test double, never an implementation of local agent execution.
        self.calls.append((source, acceptance))
        return {
            "passed": not acceptance or ">=" in source,
            "tests": [{"subtotal": 50, "passed": ">=" in source}],
        }

    async def close(self):
        self.closed = True


def setup(tmp_path, variant):
    config = Settings(data_dir=tmp_path)
    store = Store(tmp_path)
    job_id = store.enqueue("test-owner", "tester", variant, "test-123", config)
    return config, store, store.job(job_id)


@pytest.mark.parametrize(
    "variant,operator,status", [("stale", ">", "failed"), ("corrected", ">=", "success")]
)
async def test_actual_result_controls_status_and_acceptance_is_separate(tmp_path, variant, operator, status):
    cfg, store, job = setup(tmp_path, variant)
    calls = 0

    async def model(config, **body):
        nonlocal calls
        calls += 1
        tool_calls = (
            []
            if calls > 1
            else [
                {
                    "id": "patch-1",
                    "type": "function",
                    "function": {
                        "name": "apply_patch",
                        "arguments": json.dumps(
                            {
                                "path": "shipping.py",
                                "content": f"def shipping_fee(subtotal):\n    return 0 if subtotal {operator} 50 else 5\n",
                            }
                        ),
                    },
                }
            ]
        )
        return {
            "choices": [{"message": {"role": "assistant", "content": None, "tool_calls": tool_calls}}],
            "usage": {"prompt_tokens": 10, "completion_tokens": 20},
        }

    await run_demo(cfg, store, job, SandboxDouble, model)
    assert store.job(job["id"])["status"] == status
    sandbox = SandboxDouble.instances[-1]
    assert sandbox.closed and sandbox.calls[-1][1] is True
    tape = read(tmp_path / "runs" / f"{job['id']}.jsonl")
    assert tape.run.status == status
    assert any(e.name == "apply_patch" and e.kind == "tool.end" for e in tape.events)
    patch = next(e for e in tape.events if e.name == "apply_patch" and e.kind == "tool.end")
    assert patch.parent_id and patch.snapshot_id
    assert json.loads(store.job(job["id"])["usage"])["prompt_tokens"] == 20


async def test_malformed_arguments_and_provider_failure_remain_inspectable(tmp_path):
    cfg, store, job = setup(tmp_path, "stale")
    calls = 0

    async def model(config, **body):
        nonlocal calls
        calls += 1
        if calls > 1:
            raise RuntimeError("provider unavailable")
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "tool_calls": [
                            {"id": "bad", "function": {"name": "read_file", "arguments": "broken json"}}
                        ],
                    }
                }
            ]
        }

    await run_demo(cfg, store, job, SandboxDouble, model)
    tape = read(tmp_path / "runs" / f"{job['id']}.jsonl")
    assert tape.run.status == "failed" and SandboxDouble.instances[-1].closed
    assert any(e.name == "Invalid tool request" for e in tape.events)
    assert any("provider unavailable" in str(e.data) for e in tape.events)


async def test_cancel_records_and_closes_sandbox(tmp_path):
    cfg, store, job = setup(tmp_path, "stale")
    started = asyncio.Event()

    async def model(config, **body):
        started.set()
        await asyncio.Event().wait()

    task = asyncio.create_task(run_demo(cfg, store, job, SandboxDouble, model))
    await started.wait()
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert store.job(job["id"])["status"] == "cancelled"
    assert SandboxDouble.instances[-1].closed
    assert read(tmp_path / "runs" / f"{job['id']}.jsonl").run.status == "cancelled"


async def test_eight_model_calls_is_a_hard_limit(tmp_path):
    cfg, store, job = setup(tmp_path, "stale")
    calls = 0

    async def model(config, **body):
        nonlocal calls
        calls += 1
        return {
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "tool_calls": [
                            {
                                "id": str(calls),
                                "function": {"name": "read_policy", "arguments": '{"policy":"shipping"}'},
                            }
                        ],
                    }
                }
            ]
        }

    await run_demo(cfg, store, job, SandboxDouble, model)
    assert calls == 8


def test_only_one_job_claimed_and_total_budget_enforced(tmp_path):
    cfg, store, job = setup(tmp_path, "stale")
    store.enqueue("test-owner", "tester", "corrected", "second-123", cfg)
    assert store.next_job()["id"] == job["id"]
    assert store.next_job() is None
    cfg.non_execution_cents = 9900
    with pytest.raises(ValueError, match="Total"):
        store.enqueue("test-owner", "tester", "stale", "third-123", cfg)
