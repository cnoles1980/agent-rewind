"""One bounded, synthetic inference request; never executes generated code."""

import argparse
import asyncio
import json
import os
from pathlib import Path

from dotenv import dotenv_values

from agent_rewind.config import Settings
from agent_rewind.demo import complete, TOOLS
from agent_rewind.recorder import Recorder


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", type=Path, default=Path(".env"))
    args = parser.parse_args()
    key = os.getenv("NEBIUS_API_KEY") or dotenv_values(args.env_file).get("NEBIUS_API_KEY")
    if not key:
        raise SystemExit("Add NEBIUS_API_KEY to a local secret file first.")
    config = Settings(api_key=key)
    with Recorder(
        "synthetic-inference-probe",
        output=".local/probes",
        model=config.model,
        provider="Nebius Token Factory",
        secrets=[key],
    ) as tape:
        result = await tape.amodel_call(
            lambda **body: complete(config, **body),
            model=config.model,
            messages=[{"role": "user", "content": "Call read_policy for the shipping policy."}],
            tools=[TOOLS[1]],
            tool_choice={"type": "function", "function": {"name": "read_policy"}},
            max_tokens=256,
            temperature=0,
        )
    message = result["choices"][0]["message"]
    calls = message.get("tool_calls", [])
    print(
        json.dumps(
            {
                "model": result.get("model"),
                "tool_names": [c["function"]["name"] for c in calls],
                "reasoning_fields": [k for k in message if "reason" in k],
                "usage": result.get("usage"),
                "recording": str(tape.path),
                "successful_tool_call": any(c["function"]["name"] == "read_policy" for c in calls),
            },
            indent=2,
        )
    )
    if not calls:
        raise SystemExit("Inference responded but no tool call was returned.")


if __name__ == "__main__":
    asyncio.run(main())
