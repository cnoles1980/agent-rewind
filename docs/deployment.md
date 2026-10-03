# Deployment and provider gates

## Current external blockers

The implementation is ready for configuration, but hosted/live acceptance is **not verified**. Corey needs to provide a dedicated Nebius key, a Sandbox-enabled project, a verified Python image, confirmed prices, and Render access/billing. Do not paste keys into chat. Put them in local `.env` or the Render secret settings.

The one selected adapter candidate is Nebius Sandboxes. The read-only sandbox check returned **HTTP 400: missing Project header**; it did not establish whether this account has beta access. A synthetic inference request succeeded with Nemotron 3.5 Lightning, tool calling, reasoning fields and usage reporting. No generated code was executed by that probe.

## 1. Verify Nebius execution by October 5

1. Confirm beta access with Nebius and obtain the sandbox project identifier. Set `NEBIUS_PROJECT_ID` and a dedicated `NEBIUS_API_KEY`.
2. Select a supported Python image and set `NEBIUS_SANDBOX_IMAGE`. Verify that `/usr/local/bin/python -I -` exists in it. Do not guess an image name or use an untrusted image.
3. Verify a disposable operation with `networking.enabled=false`, empty environment, `preserve_env=false`, a 20-second remote deadline, 16 MB writable layer limit, and truncated output.
4. Verify cancellation by operation ID, automatic disposal, and restart recovery. The adapter persists operation IDs. An ambiguous spawn is never blindly retried; the remote deadline bounds it even if the response ID is lost.
5. Record the supplier's actual prices and minimum charges. Set a per-run worst-case reservation, then `REWIND_PRICES_VERIFIED=true`. Only after all checks pass set `REWIND_LIVE_ENABLED=true` and restart the API.
6. Launch both variants through the app and inspect real model/tool spans, code changes, visible tests, and independent acceptance results. Cancel a running test and restart during another disposable test; verify cleanup and recorded failure state.

If Nebius access or cost is unsuitable, trigger the agreed E2B Hobby fallback and replace the execution adapter. E2B has deliberately not been implemented alongside an unverified provider. If neither is provisioned, the live demo remains blocked; playback does not satisfy that gate.

Sources: [Nebius sandbox overview](https://docs.tokenfactory.nebius.com/sandboxes/overview), [official client](https://github.com/nebius/contree-sdk), [E2B pricing](https://e2b.dev/pricing).

## 2. Verify the budget

Cash ceiling: **$100 through December 15**, excluding confirmed credits. Allocations: hosting/disk $30; testing $20; judge execution $30; contingency $20. No automatic top-ups.

`REWIND_RUN_RESERVATION_CENTS=100` is a **provisional safety reservation, not a supplier quote**. Verify it covers eight model calls, up to 64,000 bytes of context per call, up to 2,048 output tokens per call, sandbox minimum charges, and the five-minute deadline. A response can contain eight tool calls, so a conservative bound is 64 agent tool operations plus one acceptance operation. Include retries at the infrastructure level if the supplier bills them. The client itself does not retry ambiguous operations.

Each admitted job retains its full worst-case reservation, even if cancelled or inexpensive. Actual model token usage is recorded separately. This intentionally overcounts rather than undercounts. Tester reservations cannot consume the $30 judge allocation. The SQLite admission transaction also enforces the $100 total ceiling.

`REWIND_NON_EXECUTION_CENTS` starts at 3000 for hosting commitments. Update it to cover actual non-job spend plus remaining hosting/disk commitments and out-of-app probes. Never double-count application jobs already reserved. The app shows budget notices at 50%, 75%, and 90%; thresholds survive restart because reservations live in SQLite. These are in-app notices, not email alerts.

Before checkout, compare Render's final price, tax, and disk charges with the $30 allocation. [Render pricing](https://render.com/pricing) is a reference, not a quote for this account. Preserve the contingency and judge reserve; do not automatically increase settings to admit more jobs.

## 3. Deploy one service

1. Review the source and publish the repository under MIT. The local repository is not automatically made public by this implementation.
2. Connect that repository to Render using `render.yaml`. It requests a paid Starter service and a 1 GB persistent disk at `/var/data`. Approve billing yourself within the agreed ceiling.
3. Set `REWIND_ORIGIN` to the exact final HTTPS origin (no trailing slash). Keep `REWIND_SECURE_COOKIES=true` and **one worker**. Do not scale horizontally with this queue/SQLite design.
4. Generate separate high-entropy tester/judge invitation codes. Store their SHA-256 hashes as `REWIND_TESTER_CODE_HASH` and `REWIND_JUDGE_CODE_HASH`. Keep plaintext judge credentials in the private testing instructions, never README or source. `setup_local.py` demonstrates code/hash generation; use different codes for production.
5. Set the provider secret fields. Start with live execution off; validate the provider gate first. The build uses frozen Python and npm locks, and serves `web/dist` from FastAPI.
6. Check `/api/health`, open a public example in an incognito browser, then enter a tester code. Verify a real job, cancellation, cross-session denial, reviewed clip publication, anonymous link access, and revocation.
7. Restart the service. Confirm saved clips and recordings survive, running jobs are marked interrupted, and no remote operation is left beyond its deadline. Verify the disk can hold the expected job tapes before enabling additional runs.

Judge sessions expire after seven days; judges can re-enter their invitation code. Keep the code valid and the deployment funded through December 15. No judge-owned API key is required.

## Recovery

- Disable new execution by setting `REWIND_LIVE_ENABLED=false` and restarting. Examples and existing clips remain readable.
- Back up the persistent disk and SQLite consistently using SQLite's backup API or the hosting backup facility. Never copy only a live `.sqlite3` file while ignoring its WAL. Backups contain clip content and must remain private.
- After a restart, the application attempts cancellation for persisted active operation IDs and marks interrupted jobs failed. If provider cancellation itself is unavailable, inspect the saved operation ID in the private database and confirm its remote hard deadline.
- Restore the disk backup to the same `REWIND_DATA_DIR`; restore secret settings separately. Check health, clips and session behavior before reopening execution.
- To revoke an invitation after exposure, change its hash and remove existing sessions associated with that role during maintenance. Changing the code alone does not immediately expire already-issued cookies.

The Render blueprint and CI configuration still require first-run validation in their actual services. Local verification is not a deployment result.
