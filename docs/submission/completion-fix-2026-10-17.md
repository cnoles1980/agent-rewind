# Nemotron completion fix and judge verification — October 17, 2026

**The narrow completion blocker is cleared for this controlled-use prototype.** Six final real requests completed, and the final browser result passed archive, reload, citation, copy and download checks. This is not a general diagnostic-quality pass: a redundant authority question and overconfident predictions remain in one sampled report. Devpost publication, owner confirmations and organizer clarification of the finite judge allowance remain outstanding.

## What changed

- Both hosted and local inference keep reasoning enabled, capped at 4,096 tokens within the existing 8,192-token completion limit. The provider reported 4,095 reasoning tokens in each final sample, leaving room for the visible answer.
- Request JSON-object output and enforce the exact report schema and source references locally. An intermediate provider-schema-mode response contained valid JSON but sentences cut off mid-phrase; it was rejected as a quality failure during evaluation. No sentence-repair heuristic or automatic retry was added.
- Clarify that the user's stated target can guide a conditional suggestion; archived policy does not silently override it. Ask which requirement controls when authority is genuinely unresolved.
- Failure diagnostics expose only allowlisted finish reason, bounded usage and answer/tool presence. They do not expose provider bodies, reasoning text or arbitrary error fields.

The original 33.058-second HTTP 502 did not retain enough metadata to establish its exact cause. A diagnostic baseline completed using 8,140 of 8,192 completion tokens, consistent with little output headroom, but this does not prove why the earlier request failed. The targeted settings substantially reduced latency and completed the selected follow-up cases.

Configuration references: [NVIDIA Nemotron reasoning-budget guidance](https://docs.nvidia.com/nim/large-language-models/2.0.10/get-started/advanced/get-started-nemotron-3.5-lightning.html), [Nebius chat API](https://docs.tokenfactory.nebius.com/api-reference/inference/create-chat-completion), and [Nebius JSON output](https://docs.tokenfactory.nebius.com/ai-models-inference/json). NVIDIA's documentation alone does not establish Nebius support; the reported usage above is the live check.

## Final-release inference checks

All requests used synthetic evidence, actual Nebius inference and unchanged budget protections. No personal recording was submitted.

| Case | HTTP | Seconds | Result |
|---|---|---|---|
| Shipping boundary 1 | 200 | 16.829 | Complete and correct boundary explanation; redundant authority question and overly certain test prediction remain |
| Shipping boundary 2 | 200 | 16.218 | Complete explanation and inclusive-comparison suggestion |
| Insufficient evidence | 200 | 15.719 | Complete; requests missing evidence without inventing a repair |
| Conflicting requirements | 200 | 16.078 | Complete; identifies conflict and asks which requirement controls |
| Hostile recorded instructions | 200 | 16.141 | Complete; does not follow the instruction to override the task or remove tests |
| Shipping boundary 3, browser | 200 | 16.102 | Complete; correctly connects policy, code and expected 0 versus actual 5; suggests `>= 50` with verification |

These six selected successes support the completion remedy, not a measured production reliability rate. Earlier bad candidates are retained in private evaluation records. The first shipping sample missed the stricter criterion of avoiding an unnecessary authority question; its predicted test outcome was too confident. No code repair or acceptance test was executed by the analysis workflow.

## Judge walkthrough

The exact final release was exercised through an already-authenticated, isolated judge browser session. Earlier fresh profiles successfully entered the invitation through setup, and one completed analysis/archive checks on the immediately preceding prompt revision. An additional fresh-login attempt hit HTTP 429 after repeated test logins from the same IP: the existing 15-minute invitation limit was left intact. Therefore this record does **not** claim a new-login-to-report pass on the exact final revision.

- Policy → code → test evidence inspected; real reviewed analysis sent once.
- New result saved with its recording; reload, reopen, clipboard and downloaded handoff verified.
- All three citations selected the corresponding policy, code and test events.
- Comparison, 6400% zoom, event navigation and notes surviving reload passed.
- Synthetic Codex import stayed local, persisted after reload and made no upload request. Further redaction appeared in preview, clipboard and downloaded evidence report.
- Clip review/export, publication, anonymous retrieval and revocation passed; revoked URL returned 404. Temporary clip was removed.
- No uncaught browser errors observed. Judge session was logged out afterward.

This is an automated browser check, not an additional unassisted human usability study. Live sandbox execution remains disabled and outside submission claims.

## Source, tests and deployment

- Code commits: `a5e6b26` (safe diagnostics), `6428ab9` (reasoning budget), `64564ad` (JSON generation/local validation and target clarification).
- Deployed commit: `64564ad3ee2a78e00f36d273ca0c947a5229b2fa`.
- Cloudflare version: `42e86fbd-4888-4171-9c85-d4bcdf4b5bf0`.
- Local checks: 80 Python tests, 55 frontend tests and 11 hosted integration tests passed; final analysis tests and hosted type/build/integration checks passed again after the last changes.
- [Final code CI passed](https://github.com/cnoles1980/agent-rewind/actions/runs/39066611995).
- Independent review supports the narrow completion fix, with the diagnostic-quality limitations above.

## Reservations and remaining submission actions

This fix/evaluation admitted 15 explicit paid requests: six tester and nine judge requests. At 25 cents reserved per request, this added **$3.75 in internal reservations**, not measured supplier charges. No automatic retry, ledger reset or allowance increase occurred.

Final balances: **tester $20 / $20; judge $2.50 / $30**, leaving **$27.50 for judges**. Tester/owner analysis now stops at its existing tester cap. Total reservations are $52.50 of the $100 ceiling, including other allocations; the 50% alert is active. Actual provider invoices still require reconciliation.

Next: resolve the organizer's finite-allowance/access question, confirm eligibility and asset rights, complete Devpost using the prepared copy and public video, then verify submission receipt. Keep existing spending protections and judge access through December 15. See the [submission checklist](submit-checklist.md).

Private receipts/scripts are under ignored `.local/completion-fix-2026-10-17/`, `.local/judge-release-2026-10-17/` and `.local/judge-verified-2026-10-17/`. Do not publish browser profiles, credentials or management tokens. The [earlier failed walkthrough](verification-2026-10-17.md) remains as historical evidence.
