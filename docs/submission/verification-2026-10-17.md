# Final judge walkthrough — October 17, 2026 Central

**Result: not ready for technical sign-off.** The real Nemotron request failed on the complete, documented shipping example. The surrounding investigation, import and sharing workflows passed. Corey can continue uploading the approved video, but this result needs resolution before submission.

## Method and results

Used a new, isolated desktop Chromium profile against the actual hosted service, then retained that profile for reload/persistence checks. Entered the existing judge invitation through the setup UI. No mocked network responses, saved analysis substitution, personal recordings or sandbox execution were used. This is an automated browser walkthrough, not another human usability study.

| Check | Observed result |
|---|---|
| Judge access | UI login succeeded; server identified the judge role and enabled analysis. Logout succeeded and status became unauthenticated. |
| Policy → code → test | Inspected the stale policy, `subtotal > 50` code change, and the immutable example check reporting expected 0 versus actual 5. |
| Reviewed real analysis | Set ten earlier events, supplied the inclusive requirement, verified policy/test evidence in the preview, checked privacy review and sent once. **HTTP 502 incomplete after 33.058 seconds.** |
| Failure handling | Error shown; no automatic retry and no failed result in Saved reports. No new completed report exists. |
| Report archive/citations | **Not reverified with a new successful result.** October 7 success remains historical; this test cannot establish current end-to-end success. |
| A/B comparison | First behavior difference selected the archived/current policy evidence. |
| Timeline | 6400% zoom produced the expected scrollable timeline; event navigation and return to Fit worked without mutation requests. |
| Notes | Added a synthetic note, reloaded, selected its timeline marker and found the note in the inspector. |
| Codex import | Opened the synthetic compatibility fixture through Settings. Import produced no upload request; the recording remained in Recent runs after reload and reopened successfully. |
| Local report | Reviewed redaction removed a seeded phrase from preview, clipboard and downloaded Markdown. No analysis request was sent for the import. |
| Clips | Review gate enforced; exported a 20–25 second clip containing three event records, published it, opened it in a separate anonymous context, revoked it through the UI, and confirmed HTTP 404 afterward. |
| Browser errors | No uncaught page errors observed in the main walkthrough scripts. |
| Source CI | GitHub Actions for `120dacb` completed successfully. |

Two initial persistence assertions were corrected in the test harness: an SVG title is not visible note text, and reload restores the example selection rather than automatically selecting the imported recording. Selecting the note marker/imported run verified both persisted. These were not classified as storage defects.

## Inference finding

The app reported: “Nemotron did not finish its response. Select a smaller excerpt before a new request. Reservation retained; no automatic retry.” The complete shipping case therefore cannot be described as consistently successful based on the earlier rehearsal.

The deployed request uses an 8,192-token completion ceiling and a 60-second timeout. Its incomplete category covers a non-`stop` finish reason, unexpected tool calls, or a missing string answer. The surfaced result does not distinguish those conditions; this is **not proof of a timeout, token exhaustion, missing evidence, or a provider outage**. No model setting, budget limit or deployment was changed during this walkthrough.

Next technical work: retain only safe response metadata (finish reason, usage, answer presence and response shape) for failed calls, determine which condition occurs, and test a targeted remedy with explicit bounded evaluation. Keep reasoning-quality checks: the earlier direct-answer trial reduced latency but introduced factual mistakes. Do not add blind retries, hide failures, or raise spending limits to make a demonstration pass. After a fix, repeat the documented judge request, inspect answer quality, then verify archive/reload/citation/download using that new result.

## Accounting and private evidence

Exactly one paid analysis request was admitted. Judge reservations increased from **$0 to $0.25 of $30**; tester reservations stayed **$18.50 of $20**. These are conservative internal reservations, not measured supplier charges. The temporary clip was revoked and the judge session logged out. No allowance was reset or increased.

Sanitized receipts, screenshots, exported synthetic clip/report and test scripts are in ignored `.local/submission-2026-10-17/`. The browser profile is private because it contains local storage and session history; do not publish that folder. No credentials or share-management tokens are included in this public record.

The public YouTube URL, Devpost publication, owner confirmations and organizer clarification about finite judge allowances remain separate open steps. Fresh sandbox execution remains deferred.
