# Nemotron in the debugging workflow

Select an event → **Debug report** → describe expected behavior → review/redact the exact excerpt → check the privacy review and the separate Nebius-send consent → **Analyze selected evidence**.

The hosted server calls NVIDIA Nemotron through Nebius Token Factory. The result separates observed facts, hypotheses, missing evidence, verification steps, and a suggested repair prompt. Facts and hypotheses must cite IDs from the submitted excerpt. Click a citation to return to its recorded event. A valid citation establishes only that the event exists, not that the model interpreted it correctly.

After reviewing the generated response and its source excerpt, copy or download the analysis handoff for the coding agent that owns your project. Rewind does not post into chats, execute proposed commands, or apply fixes. Local evidence-only report export remains free of model calls.

## Privacy and failure behavior

- Opening/importing a tape never uploads it. Analysis uploads only the previewed excerpt plus its listed event IDs, consent flag, and random request ID. This includes the user's observation. Linked context is excluded unless explicitly selected; it can contain earlier private messages.
- Existing browser redaction runs before preview. The server applies additional credential/path filtering before inference. Review is essential: private business details are not automatically recognizable.
- Rewind keeps the excerpt and generated response in memory only. SQLite retains session/request identifiers, role, time, outcome, worst-case reservation, and reported token counts. Nebius receives the excerpt; its own data-handling terms apply. Review hosting/proxy logging settings before deployment so request/response bodies are not captured there.
- Editing the excerpt invalidates review, send consent, and previous analysis. Editing/closing during a request discards the local response but does not promise that a submitted provider call is unbilled. The server stops waiting after 60 seconds. A remote provider may finish an already accepted call.
- One analysis at a time, ten admissions/attempts per session per hour, 48,000 UTF-8 evidence bytes, at most 11 event references, and 6,144 maximum completion tokens (including reasoning). Schema-constrained output is requested. The HTTP envelope ceiling is 320,000 bytes to allow JSON escaping. Oversized excerpts require the user to reduce the selection; no extra silent truncation is introduced.
- Invalid/truncated output or references outside the excerpt fail visibly. No automatic retry or tool execution occurs. A repeated idempotency key is rejected without another provider call. Failed/interrupted calls keep their reservations because billing may already have occurred. After restart, running analysis metadata is marked interrupted; content cannot be recovered.
- Generated suggestions remain untrusted. They can be wrong or influenced by hostile log text despite the system instruction. React renders them as inert text. Review the complete handoff before copying and verify proposed changes against the actual project.

## Configure analysis without a sandbox

These settings below apply to the Python/local API. The active Cloudflare deployment has a [separate setup guide](../cloudflare/README.md), including its Worker secrets and enable flags. Use only one active paid ledger for the same budget.

1. Put a dedicated `NEBIUS_API_KEY` in the ignored root `.env` or hosting secret settings. Keep `NEBIUS_MODEL=nvidia/Nemotron-3_5-Lightning`. Never use a `VITE_` variable or put a key in chat, source, or browser Settings.
2. Confirm public-endpoint pricing for that model. On October 3, 2026, [Nebius's Nemotron catalog](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference) lists $0.06 per million input tokens and $0.24 per million output tokens. Account-specific billing, taxes, minimums, or future prices still need verification before hosted launch.
3. Set `REWIND_ANALYSIS_RESERVATION_CENTS` to a verified conservative per-request allowance. The default **25 cents** is a reservation, not a displayed charge estimate. It covers a wide margin over the published token rates for this bounded request. Include system/schema messages, JSON encoding overhead, and reasoning/output usage. Reservations share the existing $20 tester and $30 judge allocations with coding runs, and the $100 total ceiling. Never increase the ceiling automatically.
4. Set `REWIND_ANALYSIS_PRICES_VERIFIED=true` after verifying the allowance, then `REWIND_ANALYSIS_ENABLED=true`. Restart the API. Sandbox project/image and `REWIND_LIVE_ENABLED` are not required for analysis.
5. Configure invitation hashes using the existing setup. Enter the local invitation from `.local/local-invitations.txt` in the analysis panel, or use a separate hosted judge code. Self-hosters supply their own server key and invitation; public visitors cannot spend the host's inference budget.
6. Run `uv run python scripts/probe_analysis.py` for one synthetic, budget-accounted real request. Success prints facts/hypotheses with valid references, verification steps, a repair prompt, and actual token usage. It submits no personal tape. Then test the browser workflow with an illustrative example.

Before submission, verify diagnosis quality on a genuine captured failure, clear ambiguity on insufficient evidence, adversarial recorded instructions, hosted access, latency, and provider billing. A synthetic probe and mocked browser tests do not establish real-world diagnostic accuracy.
