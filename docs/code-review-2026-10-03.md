# Code quality and simplification review — October 3, 2026

Verdict: **confirmed findings fixed and locally verified**. This approves the focused changes for the controlled prototype; it does not establish production readiness or replace the outstanding hosted/sandbox acceptance checks.

Applied the requested code-review-and-quality and code-simplification skills. Reviewed tests first, then privacy boundaries, recorder failure handling, temporal evidence, clipping, inference, and accounting. An independent reviewer using a different model reviewed the backend and the final changes without access to personal recordings or credentials.

## Findings resolved

| Severity | Finding and consequence | Resolution / evidence |
|---|---|---|
| P1 | Object property names bypassed redaction, including JSON embedded in strings. Sensitive text could survive in a tape, report, or model request. | Python and browser redactors clean names as well as values. Colliding redacted names preserve both values. Regression tests cover configured secrets, nested JSON, and collisions. |
| P1 | A live poll could replace evidence after a clip was marked reviewed. | Clip approval is tied to the exact source tape object. A browser regression verifies new evidence clears approval and disables export/publication. |
| P2 | Recorder run/model/provider/tool labels and annotation anchors bypassed configured-secret redaction. | Sanitization now covers those fields before persistence; seeded-secret tests inspect tape and note files. |
| P2 | SDK callers could place a custom run ID outside the output directory using path components. | Recorder IDs must contain 1–120 ASCII letters, numbers, underscores, or hyphens. Five invalid-path/empty-ID cases are rejected before writing. Portable imported IDs retain their existing contract. |
| P2 | Exceptions with an empty message could appear as successful spans. | Failure detection checks exception presence and records the exception class when its message is empty. Sync errors and async cancellation are tested. |
| P2 | A forward snapshot reference could show context from after the selected event. | Canonical context lookup enforces recorded sequence and available elapsed time; playback and clip support use that lookup. Regression tests reject future evidence. |
| P2 | An unrelated completion without a span ID could hide an unfinished start without a span ID. | Only identified completions suppress matching starts. Regression test preserves unfinished activity. |
| P2 | Comparison ignored changed error details when both calls failed. | Error content participates in observed output differences. Regression test distinguishes the two failures. |
| P2 | Re-clipping could erase an existing partial marker or turn unknown supporting-context time into zero. | Preserve partial markers and unknown elapsed time; regression covers re-clipping. |

Fixes are isolated in commit `c3673de`. The initial regression set reproduced failures before the fixes. No personal recording was inspected, uploaded, or published for this review.

## Behavior-preserving simplification

Commit `7bd5a5d` contains only structural changes:

- Shared Nebius transport now lives in `inference.py`. Analysis no longer imports the coding scenario or its sandbox dependency merely to make an inference request. Timeout, response-size limit, redirect handling, error messages, and request behavior are unchanged.
- One reservation query supplies display, coding-job admission, and analysis admission. It runs inside each caller's existing SQLite transaction. Role limits, total ceiling, error ordering, and reservation retention are unchanged; existing concurrency and budget tests pass.

No dependencies or features were added. No uncertain dead code was deleted. Imports and references were checked after extraction.

## Verification

- **49 pytest**, **34 Vitest**, and **17 Playwright** tests pass: **100 total**.
- Ruff, TypeScript, production Vite build, and Git whitespace checks pass.
- The browser suite covers reviewed sharing/revocation, local imports without uploads, inference consent/citations, error paths, HTML rendered as text, large import cancellation, zoom, and comparison.
- Latest 1,000-event scrub paint measurements: **31.7, 33.5, 33.3 ms** on the development machine, below the 100 ms target.
- Independent final review found no concrete remaining blocker in the changes and independently ran recorder/engine regressions.
- npm audit and pip-audit of frozen runtime dependencies report no known vulnerabilities at review time. No dependency upgrades were needed. The existing Starlette test-client deprecation warning remains a maintenance item.
- A known-key scan of 114 workspace/bundle/log files and 152 historical Git blobs found **zero matches** for the dedicated Nebius key. This is a targeted check, not proof that arbitrary confidential data can never be present. `.env` and runtime stores remain ignored.
- No paid model requests were made. The local API was restarted after confirming no running jobs or analyses; health and analysis availability were checked without inference.

## Follow-up work and boundaries

- **Maintainability — owner: Codex, before the next substantial player feature.** `App.tsx` still combines many established player/dialog responsibilities. Extract a cohesive inspector or clip dialog when changing that flow, preserving the browser tests. A broad UI rewrite was excluded from this focused safety pass.
- **Deployment — owner: Corey with Codex.** Verify HTTPS cookies, hosted credentials/access, provider billing, and operational recovery before public judge use. Real sandbox execution remains a separate unverified gate. See `verification.md` and `deployment.md`.
- **Diagnostic quality — owner: Corey with Codex.** Test reviewed real failures and importer compatibility. Citations identify evidence; they do not establish that the model's explanation is correct.

The five review axes were addressed: correctness through failure/temporal regressions; readability through focused helpers; architecture through inference decoupling; security through privacy/access/consent checks; performance through bounded imports and browser timing. Remaining product and deployment acceptance gaps are recorded rather than inferred from passing local tests.
