"""Export the Python analysis contract for the hosted Cloudflare adapter."""

import json
from pathlib import Path

from agent_rewind.analysis import SYSTEM, AnalysisRequest, AnalysisResult

target = Path(__file__).resolve().parents[1] / "cloudflare/src/analysis-contract.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(
    json.dumps(
        {
            "system": SYSTEM,
            "request": AnalysisRequest.model_json_schema(),
            "result": AnalysisResult.model_json_schema(),
        },
        indent=2,
    ) + "\n",
    encoding="utf-8",
)
