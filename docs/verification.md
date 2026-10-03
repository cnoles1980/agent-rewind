# Verification record — October 3, 2026

Status: **local implementation verified; live sandbox and hosting blocked on external configuration**. This is not yet a submission-ready hosted demo.

## Passed locally

| Check | Evidence |
|---|---|
| Python recorder, import, API, isolated runner contracts | 29 pytest tests passing |
| Context/time integrity, reuse of deduplicated snapshots, partial clips, redaction, tool alignment | 29 Vitest tests passing |
| Browser investigation and security flows | 10 Playwright end-to-end tests passing |
| 1,000-event scrubbing | Latest measured paint intervals: 29.7, 33.1, 32.9 ms on this Windows development machine; threshold 100 ms |
| Personal tape privacy | Browser test observed no non-GET requests while importing, searching, selecting and playing a synthetic personal tape |
| Clip lifecycle | Production bundle: invitation login, reviewed publication, a separate anonymous browser reading the clip, UI revocation, then HTTP 404 |
| Production CSP | Full app and clip flow work without `unsafe-eval`; schema validator compiled ahead of time |
| Injection | Synthetic HTML in a run name renders as inert text; no DOM image created |
| Ownership and CSRF | Cross-session job access denied; mutation without allowed Origin denied; invitation throttling and size limits checked |
| Recorder failures | Interrupted spans, original exceptions, failed persistence and close errors remain visible without masking the original tool error |
| Runner failures | Provider errors, malformed arguments, cancellation/cleanup and eight-call cap covered with explicit test doubles |
| Independent outcome | A separate immutable acceptance call determines status; stale/corrected variants are not assigned predetermined badges |
| Import CLI | Checked-in synthetic Codex compatibility fixture imported and validated; four retained events, duplicate removed, unknown record reported |
| Clean Python setup | New isolated environment installed from frozen lock with no development dependencies; CLI validation succeeded |
| Clean frontend setup | Fresh dependency directory installed from npm lock and production build succeeded |
| Lint/type/build | Ruff, TypeScript and Vite checks pass |
| Dependency audits | npm audit: zero reported vulnerabilities; pip-audit on locked runtime dependencies: none known at check time |

Pytest reports one upstream Starlette deprecation warning about its httpx-backed test client. It does not affect the production runtime; test-client migration should be considered with the next dependency update.

## Settings, source importers, and reports

- Added direct browser Codex import, Claude Code transcript and n8n execution adapters, explicit Factory summary-only import, and a downloadable custom tape template. Synthetic fixtures cover correlations, deduplication, unknown timing, malformed/truncated data, unfinished attempts, private metadata/attachments, and event limits. Real Claude/n8n/Factory user exports remain an acceptance gap.
- Browser tests cover Settings on mobile, preference persistence, source selection, reviewed report copy/download, redaction of both observations and evidence, review invalidation after edits, and zero requests during Claude/n8n imports. The Codex/report flow emits no mutation requests.
- An API-restart check exposed an existing startup bug: failed example loading also hid IndexedDB tapes. Startup now handles local storage and example retrieval independently; a regression test blocks the examples endpoint and still opens the saved local recording.
- Manual browser inspection confirmed discoverable Settings actions and readable Codex instructions/report preview. Screenshot: `docs/screenshots/settings-sources.jpg`.
- Security review found no unresolved material issue in this change. Files remain local; no provider keys, live chat connections, automatic posting, or repair execution were introduced. Reports explicitly distinguish evidence from diagnosis and require review. Prototype-grade: provider format drift and unrecognized private data remain risks.

## Large-file import follow-up

A reported 22.4 MB log exceeded the original arbitrary 20 MB ceiling. Local browser and Python limits are now 100 MB; hosted clips stay 2 MB. The browser imports in a worker with progress, termination-based cancellation, explicit errors, and no silent truncation.

- Production CSP browser test imports a synthetic 24 MB Codex JSONL file, retains all 128 large tool outputs (257 events), verifies IndexedDB persistence, observes no non-GET requests, and checks for browser errors. Entire test completed in approximately three seconds on the development machine.
- A held worker startup test cancels the import, reloads, and confirms no tape was saved. Unit tests reject files above 100 MB before reading or starting a worker.
- Python regression test imports a retained 23 MB output and validates its portable export round-trip.
- Actual user log contents were not inspected or uploaded. Format compatibility and the remaining 10,000-event limit may still affect that specific file. The worker bounds memory with a file limit but still materializes JSON; it does not establish unlimited-scale performance.

## Real provider evidence

A **single synthetic inference request** to `nvidia/Nemotron-3_5-Lightning` through Nebius returned `read_policy`, `reasoning` and `reasoning_content` fields, and reported usage of **298 prompt + 35 completion = 333 tokens**, including 11 reasoning tokens. The local probe tape is ignored by Git. The probe did not execute a tool or generated code, and is not counted as a successful coding-agent run.

The sandbox read-only probe returned HTTP 400 for a missing project header. A Sandbox-enabled project/image and cancellation/isolation/billing checks are still needed. No provider-wide capability conclusion is drawn from this error.

## Unverified / remaining gates

- Real Nebius sandbox execution, image/isolated-network behavior, cancellation, timeout, cleanup and restart recovery against the actual service.
- Full fresh Nemotron coding runs and independently executed acceptance tests for both variants.
- Verified supplier pricing and the per-run worst-case reservation; actual hosting checkout cost and budget reconciliation.
- Render deployment, GitHub Actions execution, external HTTPS/session behavior and judge access from a clean remote browser.
- Public source/video/Devpost publication after Corey's review; registration/eligibility confirmation.
- Review of a real personal recording and clip before publication; three-user comprehension study; narrated video.
- Continued operation, backups and budget through December 15.

The checked-in examples are intentionally synthetic. Backend test doubles and locally hosted production-bundle tests do not establish real cloud execution or deployment.
