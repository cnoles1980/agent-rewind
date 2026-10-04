"""Export the Python analysis contract for the hosted Cloudflare adapter."""

import json
from pathlib import Path

from agent_rewind.analysis import (
    SYSTEM,
    HANDOFF,
    ERROR_MESSAGES,
    AnalysisRequest,
    AnalysisResult,
    AnalysisDraft,
)

target = Path(__file__).resolve().parents[1] / "cloudflare/src/analysis-contract.json"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(
    json.dumps(
        {
            "system": SYSTEM,
            "handoff": HANDOFF,
            "errors": ERROR_MESSAGES,
            "draft": AnalysisDraft.model_json_schema(),
            "request": AnalysisRequest.model_json_schema(),
            "result": AnalysisResult.model_json_schema(),
        },
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)
