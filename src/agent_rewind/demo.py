"""Bounded coding-agent scenario. All generated code executes remotely."""

import ast
import asyncio
import json

import httpx

from .recorder import Recorder
from .sandbox import NebiusSandbox

INITIAL_SOURCE = "def shipping_fee(subtotal):\n    return 5\n"
POLICIES = {
    "stale": "Shipping costs $5. Shipping is free for subtotals strictly above $50. Policy version: archived-v1.",
    "corrected": "Shipping costs $5. Shipping is free for subtotals of $50 or more (inclusive). Policy version: current-v2.",
}


def tool(name, description, properties):
    return {
        "type": "function",
        "function": {
            "name": name,
            "description": description,
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": list(properties),
                "additionalProperties": False,
            },
        },
    }


TOOLS = [
    tool(
        "read_file",
        "Read the implementation file shipping.py",
        {"path": {"type": "string", "enum": ["shipping.py"]}},
    ),
    tool(
        "read_policy",
        "Fetch the shipping business policy",
        {"policy": {"type": "string", "enum": ["shipping"]}},
    ),
    tool(
        "apply_patch",
        "Replace shipping.py with a single pure shipping_fee(subtotal) function using comparisons and numeric returns. No imports, calls, or loops.",
        {"path": {"type": "string", "enum": ["shipping.py"]}, "content": {"type": "string"}},
    ),
    tool("run_tests", "Run the visible shipping test suite", {}),
]


def validate_source(source):
    if not isinstance(source, str) or len(source) > 10000:
        raise ValueError("Implementation must be at most 10,000 characters")
    tree = ast.parse(source)
    allowed = (
        ast.Module,
        ast.FunctionDef,
        ast.arguments,
        ast.arg,
        ast.Return,
        ast.If,
        ast.IfExp,
        ast.Compare,
        ast.Gt,
        ast.GtE,
        ast.Lt,
        ast.LtE,
        ast.Eq,
        ast.NotEq,
        ast.Name,
        ast.Load,
        ast.Constant,
        ast.BoolOp,
        ast.And,
        ast.Or,
        ast.UnaryOp,
        ast.USub,
        ast.Not,
    )
    if len(tree.body) != 1 or not isinstance(tree.body[0], ast.FunctionDef):
        raise ValueError("Provide exactly one shipping_fee function")
    f = tree.body[0]
    if (
        f.name != "shipping_fee"
        or f.decorator_list
        or len(f.args.args) != 1
        or f.args.args[0].arg != "subtotal"
    ):
        raise ValueError("Function must be shipping_fee(subtotal)")
    if f.args.defaults or f.args.kwonlyargs or f.args.posonlyargs or f.args.vararg or f.args.kwarg:
        raise ValueError("Default and extra arguments are not supported")
    for node in ast.walk(tree):
        if not isinstance(node, allowed):
            raise ValueError("Use only a pure comparison function with numeric returns")
        if isinstance(node, ast.Name) and node.id != "subtotal":
            raise ValueError("Only the subtotal variable is available")
        if isinstance(node, ast.Constant) and (
            type(node.value) not in (int, float) or abs(node.value) > 1_000_000
        ):
            raise ValueError("Only bounded numeric constants are supported")


async def complete(config, **body):
    async with httpx.AsyncClient(timeout=60, follow_redirects=False) as client:
        async with client.stream(
            "POST",
            "https://api.tokenfactory.nebius.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {config.api_key}"},
            json=body,
        ) as response:
            if response.status_code != 200:
                raise RuntimeError(f"Nebius inference returned HTTP {response.status_code}")
            chunks, size = [], 0
            async for chunk in response.aiter_bytes():
                size += len(chunk)
                if size > 1_000_000:
                    raise RuntimeError("Nebius response exceeded capture limit")
                chunks.append(chunk)
            return json.loads(b"".join(chunks))


async def run_demo(config, store, job, sandbox_factory=NebiusSandbox, model_call=complete):
    source = INITIAL_SOURCE
    usage = {"prompt_tokens": 0, "completion_tokens": 0}
    sandbox = sandbox_factory(config, lambda op: store.update_job(job["id"], operation=op))
    messages = [
        {
            "role": "system",
            "content": "You are a coding agent. Read shipping.py and the shipping policy, implement the policy exactly, then run tests. Use only provided tools. Never invent a test result. The file must contain only shipping_fee(subtotal), using numeric comparisons and returns. No imports, calls, loops, or annotations.",
        },
        {
            "role": "user",
            "content": "Implement the shipping fee according to the retrieved business policy. Test the implementation and report the result.",
        },
    ]
    with Recorder(
        "checkout-flow / " + job["variant"],
        output=config.data_dir / "runs",
        source="demo",
        model=config.model,
        provider="Nebius Token Factory",
        secrets=[config.api_key],
        run_id=job["id"],
        configuration={
            "scenario": "shipping-boundary",
            "variant": job["variant"],
            "fault_injection": job["variant"] == "stale",
            "max_model_calls": 8,
        },
    ) as tape:
        try:
            async with asyncio.timeout(300):
                for _ in range(8):
                    if len(json.dumps(messages).encode()) > 64000:
                        raise RuntimeError("Demo context limit reached")
                    response = await tape.amodel_call(
                        lambda **body: model_call(config, **body),
                        model=config.model,
                        messages=messages,
                        tools=TOOLS,
                        max_tokens=2048,
                        temperature=0,
                    )
                    for k in usage:
                        usage[k] += int(response.get("usage", {}).get(k, 0))
                    message = response["choices"][0]["message"]
                    # Forward only protocol fields. Reasoning remains recorded in the response.
                    messages.append(
                        {k: message[k] for k in ("role", "content", "tool_calls") if k in message}
                    )
                    calls = message.get("tool_calls") or []
                    if not calls:
                        break
                    if len(calls) > 8:
                        raise RuntimeError("Too many tool calls in a model response")
                    for call in calls:
                        name = call["function"]["name"]

                        async def invoke(**arguments):  # noqa: B023 - awaited before advancing this loop
                            nonlocal source
                            if name == "read_file" and arguments == {"path": "shipping.py"}:  # noqa: B023
                                return {"path": "shipping.py", "content": source}
                            if name == "read_policy" and arguments == {"policy": "shipping"}:  # noqa: B023
                                return {"policy": POLICIES[job["variant"]]}
                            if (
                                name == "apply_patch"  # noqa: B023 - awaited before loop advances
                                and set(arguments) == {"path", "content"}
                                and arguments["path"] == "shipping.py"
                            ):  # noqa: B023
                                validate_source(arguments["content"])
                                before = source
                                source = arguments["content"]
                                return {"path": "shipping.py", "before": before, "after": source}
                            if name == "run_tests" and not arguments:  # noqa: B023
                                return await sandbox.evaluate(source)
                            raise ValueError("Tool or arguments are not allowed in this fixture")

                        try:
                            args = json.loads(call["function"].get("arguments", "{}"))
                            if not isinstance(args, dict):
                                raise ValueError("Tool arguments must be an object")
                            result = await tape.atool_call(name, invoke, arguments=args, call_id=call["id"])
                        except (ValueError, SyntaxError) as exc:
                            result = {"error": str(exc)}
                            tape.emit("error", "errors", "Invalid tool request", status="failed", data=result)
                        messages.append(
                            {"role": "tool", "tool_call_id": call["id"], "content": json.dumps(result)}
                        )
                # Acceptance is outside the agent loop and starts in another disposable VM.
                validate_source(source)
                result = await tape.atool_call(
                    "acceptance_tests", sandbox.evaluate, arguments={"source": source, "acceptance": True}
                )
                passed = result.get("passed") is True
                if not passed:
                    tape.emit("error", "errors", "Boundary regression", status="failed", data=result)
                status = "success" if passed else "failed"
                tape.finish(status)
                store.update_job(
                    job["id"],
                    status="incomplete" if tape.recording_failed else status,
                    error="Recording could not be persisted completely" if tape.recording_failed else None,
                    usage=json.dumps(usage),
                )
        except asyncio.CancelledError:
            tape.finish("cancelled")
            store.update_job(job["id"], status="cancelled", usage=json.dumps(usage))
            raise
        except Exception as exc:
            # Do not return SDK exception bodies, which may contain credentials or provider internals.
            error = (
                str(exc)
                if isinstance(exc, (RuntimeError, ValueError, TimeoutError))
                else "Demo provider operation failed"
            )
            error = tape.redactor.clean(error)[:500] or "Demo exceeded its time limit"
            tape.emit("error", "errors", "Run stopped", status="failed", data={"error": error})
            tape.finish("failed")
            store.update_job(job["id"], status="failed", error=error, usage=json.dumps(usage))
        finally:
            await asyncio.shield(sandbox.close())
