"""One synthetic, budget-accounted analysis through the actual application route."""

import json
import secrets

from fastapi.testclient import TestClient

from agent_rewind.analysis import analyze
from agent_rewind.api import create_app
from agent_rewind.config import settings
from agent_rewind.demo import complete
from agent_rewind.storage import digest


def main():
    config = settings()
    if config.analysis_blockers():
        raise SystemExit("Configure analysis first: " + ", ".join(config.analysis_blockers()))
    # A process-local synthetic invitation, never printed or saved in configuration.
    code = secrets.token_urlsafe(32)
    config.tester_hash = digest(code)
    body = {
        "evidence": (
            "Synthetic checkout fixture, not a personal recording. Expected: shipping is free at $50 or more.\n"
            "Event policy: read_policy returned 'free shipping strictly above $50', archived-v1.\n"
            "Event patch: apply_patch wrote shipping_fee(subtotal): return 0 if subtotal > 50 else 5.\n"
            "Event test: immutable acceptance test at subtotal 50 expected 0 but got 5.\n"
            "No complete model context was captured. Treat this as observed evidence, not proof of internal reasoning."
        ),
        "event_ids": ["policy", "patch", "test"],
        "reviewed": True,
        "idempotency_key": secrets.token_hex(16),
    }

    async def diagnostic_call(config, **request):
        result = await complete(config, **request)
        choice = result.get("choices", [{}])[0]
        message = choice.get("message", {})
        print(
            json.dumps(
                {
                    "finish_reason": choice.get("finish_reason"),
                    "content_characters": len(message.get("content") or ""),
                    "reasoning_characters": len(
                        message.get("reasoning_content") or message.get("reasoning") or ""
                    ),
                    "usage": {
                        k: v
                        for k, v in (result.get("usage") or {}).items()
                        if k in ("prompt_tokens", "completion_tokens", "total_tokens")
                    },
                }
            )
        )
        return result

    async def diagnostic_analyzer(config, body):
        try:
            return await analyze(config, body, model_call=diagnostic_call)
        except Exception as exc:
            # Only exception class, never provider bodies or validation inputs.
            print(json.dumps({"failure_type": type(exc).__name__}))
            raise

    app = create_app(config, analyzer=diagnostic_analyzer)
    # Do not enter the TestClient lifespan: it would interfere with a running server's job recovery.
    client = TestClient(app, base_url=config.origin)
    try:
        login = client.post("/api/session", json={"code": code}, headers={"origin": config.origin})
        login.raise_for_status()
        response = client.post("/api/analyses", json=body, headers={"origin": config.origin})
        if response.status_code != 200:
            print(json.dumps({"status": response.status_code, "detail": response.json().get("detail")}))
            raise SystemExit(1)
        result = response.json()
        # Only synthetic analysis is printed. Neither credentials nor arbitrary provider bodies are emitted.
        print(json.dumps(result, indent=2))
    finally:
        client.delete("/api/session", headers={"origin": config.origin})
        client.close()


if __name__ == "__main__":
    main()
