"""Generate clearly labeled synthetic recordings for offline UI exploration."""

import json
from pathlib import Path

from agent_rewind.demo import INITIAL_SOURCE, POLICIES
from agent_rewind.schema import Event, Note, Run, Tape

root = Path(__file__).resolve().parents[1]


def generate(variant):
    failed = variant == "stale"
    run = Run(
        id=f"example-{variant}",
        name="checkout-flow",
        source="example",
        model="Nemotron 3.5 Lightning",
        provider="Illustrative fixture",
        started_at="2026-10-03T19:14:00Z",
        duration_ms=82000 if failed else 88000,
        status="failed" if failed else "success",
        capabilities={
            "context": "illustrative request snapshots",
            "reasoning": "not captured",
            "memory": "not captured",
            "timing": "illustrative",
        },
        configuration={"variant": variant, "scenario": "shipping-boundary", "fault_injection": failed},
        warnings=[
            "Illustrative example, not a live model recording. Check Demo access & status for fresh-run availability."
        ],
    )
    events = []

    def emit(kind, lane, name, t, **kw):
        event = Event(
            id=f"{run.id}-e{len(events)}",
            run_id=run.id,
            seq=len(events),
            kind=kind,
            lane=lane,
            name=name,
            elapsed_ms=t,
            timestamp=f"2026-10-03T19:{14 + int(t / 60000):02}:{int(t / 1000) % 60:02}Z",
            provenance="fixture",
            **kw,
        )
        events.append(event)
        return event

    history = [
        {"role": "user", "content": "Implement shipping according to the business policy and run tests."}
    ]

    def model(index, start, end, content):
        snap = f"snapshot-{index}"
        emit(
            "context",
            "context",
            "Context snapshot",
            start,
            snapshot_id=snap,
            data={
                "messages": list(history),
                "completeness": "illustrative request",
                "tools": ["read_file", "read_policy", "apply_patch", "run_tests"],
            },
        )
        emit(
            "model.start",
            "model",
            "Nemotron 3.5 Lightning",
            start + 200,
            span_id=f"model-{index}",
            snapshot_id=snap,
            status="running",
            data={"input": {"messages": list(history), "model": "nvidia/Nemotron-3_5-Lightning"}},
        )
        emit(
            "model.end",
            "model",
            "Model response",
            end,
            span_id=f"model-{index}",
            snapshot_id=snap,
            duration_ms=end - start - 200,
            data={
                "output": {
                    "content": content,
                    "usage": {"prompt_tokens": 380 + index * 220, "completion_tokens": 90 + index * 25},
                }
            },
        )
        history.append({"role": "assistant", "content": content})

    def call(name, index, start, end, arguments, result):
        emit(
            "tool.start",
            "tools",
            name,
            start,
            span_id=f"tool-{index}",
            status="running",
            data={"input": arguments},
        )
        e = emit(
            "tool.end",
            "tools",
            name,
            end,
            span_id=f"tool-{index}",
            duration_ms=end - start,
            data={"output": result},
        )
        history.append({"role": "tool", "name": name, "content": json.dumps(result)})
        return e

    model(0, 0, 6500, "Read the implementation and shipping policy.")
    call("read_file", 0, 7000, 9500, {"path": "shipping.py"}, {"content": INITIAL_SOURCE})
    model(1, 11000, 17500, "Retrieve the business rule before editing.")
    policy = call("read_policy", 1, 18000, 22000, {"policy": "shipping"}, {"policy": POLICIES[variant]})
    model(2, 23500, 37500, "Apply the threshold from the retrieved policy.")
    source = (
        "def shipping_fee(subtotal):\n    return 0 if subtotal " + (">" if failed else ">=") + " 50 else 5\n"
    )
    call(
        "apply_patch",
        2,
        39000,
        44000,
        {"path": "shipping.py", "content": source},
        {"path": "shipping.py", "before": INITIAL_SOURCE, "after": source},
    )
    model(3, 45500, 53000, "Run the available tests.")
    call(
        "run_tests",
        3,
        54500,
        61000,
        {},
        {
            "passed": True,
            "tests": [
                {"subtotal": 49, "expected": 5, "actual": 5, "passed": True},
                {"subtotal": 51, "expected": 0, "actual": 0, "passed": True},
            ],
        },
    )
    model(4, 63000, 70000, "Visible tests pass. The independent acceptance check follows.")
    result = {
        "passed": not failed,
        "tests": [{"subtotal": 50, "expected": 0, "actual": 5 if failed else 0, "passed": not failed}],
    }
    call("acceptance_tests", 4, 73000, 80000, {"acceptance": True}, result)
    if failed:
        emit("error", "errors", "Boundary regression", 80500, status="failed", data=result)
    emit("run.end", "model", "Run finished", run.duration_ms, data={"status": run.status})
    tape = Tape(
        run=run,
        events=events,
        notes=[
            Note(
                id=f"note-{variant}",
                run_id=run.id,
                elapsed_ms=22000,
                event_id=policy.id,
                text="The returned policy changes the boundary behavior. Compare this response with the corrected run.",
            )
        ],
    )
    (root / "examples").mkdir(exist_ok=True)
    (root / "examples" / f"{variant}.json").write_text(tape.model_dump_json(indent=2), encoding="utf-8")


if __name__ == "__main__":
    for variant in ("stale", "corrected"):
        generate(variant)
