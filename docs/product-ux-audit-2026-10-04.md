# Live product / UX audit — October 4, 2026

**Verdict: ready for focused tester sessions; submission readiness remains conditional.** The welcome now explains the product clearly and the recorded evidence is inspectable. The largest remaining product risk is whether a newcomer can assemble a useful handoff, not whether the timeline looks finished.

Target user: an individual builder investigating a recorded agent mistake, then taking evidence back to the agent's working chat. The core value is a portable, time-centered evidence trail. This audit does not establish competitive uniqueness or market demand.

## Scope and method

Applied Product Design Audit, Product Manager Advisor, and Product Spec Critic to the [hosted product](https://agent-rewind.cnoles1980.workers.dev/). Refreshed the existing desktop browser to the current release, inspected eleven states, saved and visually checked the screenshots below, checked a 390 × 844 viewport, and exercised keyboard dialog dismissal. The initial browser already had invited access; anonymous invitation entry and a first-ever account session were not independently exercised in this live audit. Quick start reproduced the welcome.

Screenshots 01–11 are current audit evidence from the pre-fix release. Screenshot 12 records the subsequent fix verification. Only bundled illustrative recordings are shown. No personal log was imported, clip published, feedback submitted, paid analysis requested, or sandbox launched. Authenticated feedback was inspected only as an access screen; no private feedback was read. Automated local checks are reported separately from live observations.

## Priority findings and decisions

| Priority | Finding / evidence | Smallest useful response | Status |
|---|---|---|---|
| High | Report opened at the policy contains that moment and preceding events, but excludes the later patch and failure (step 5). A user can send a well-formed but diagnostically incomplete excerpt. | Put the end event/time and exclusion rule above the preview. Explain selecting the failure and increasing preceding events. Longer term, support explicit evidence selection after measuring the need. | Boundary guidance shipped; richer selection remains a recommendation. |
| High | The top-level New demo run action suggests a working path, but launch is disabled (step 8). Example copy also promises a genuine run. | Name the entry Demo access & status while unavailable; retain truthful blockers and do not substitute playback for execution. | Shipped. Sandbox remains blocked. |
| High | The welcome guide gives away the policy answer (step 10), while the study claims unassisted discovery. | Measure first-impression understanding, then skip the guide for the timed task. Treat guided completions as assisted. | Study protocol corrected; human results pending. |
| Medium | Nemotron controls are below a tall report preview (step 5). The core model interaction is easy to overlook. | Add an explicit jump to analysis options; keep privacy review and separate paid-call consent intact. | Shipped. |
| Medium | A/B evidence is legible JSON, but finding the changed phrase requires reading repeated metadata and scrolling (step 4). | Add a compact changed-fields view with original evidence expandable. Keep input and behavior differences separate; never label a root cause automatically. | Recommended next product improvement. |
| Medium | Feedback asks an already signed-in visitor for an invitation without explaining that study feedback needs a different credential (step 9). | Explain existing hosted access versus individual study access. | Shipped; no auth permissions changed. |
| Medium | At phone width, controls fit but the sidebar disappears and the comparison occupies most of the first screen (step 11). | Add a compact run/library selector for narrow widths, then test investigation on a real phone. | Recommended; desktop remains the primary demo surface. |
| Medium | Escape dismissed the report but the accessibility tree reported focus on the page rather than the opener. | Close the native dialog on cleanup and restore its opener's focus. | Shipped and covered by a browser regression check. |
| Low | Open tape is internal terminology next to Open a recording elsewhere (step 2). | Use Open recording on the toolbar. | Shipped. |

## Illustrated walkthrough

### 1. Welcome — healthy, comprehension still unproven

![Welcome](audits/2026-10-04/01-welcome.jpg)

Clear purpose, a no-setup example, skip, own-log action, and a way to reopen the introduction. Close has a visible focus indicator. The welcome is concise enough to read; actual understanding requires humans. This existing invited session does not prove anonymous onboarding behavior.

### 2. Investigation workspace — usable, moderately dense

![Workspace](audits/2026-10-04/02-workspace.jpg)

Run status, provenance, comparison, report and clip actions are visible. Observed Differences is prominent. At this desktop height, some output and lower lanes require scrolling. Text is substantially more readable than a dense developer console, but no formal contrast measurement or screen-reader conformance audit was performed. The example/live-run wording and Open tape label were corrected after capture.

### 3. Failed test — healthy evidence, nested scrolling

![Failed acceptance result](audits/2026-10-04/03-test-result.jpg)

Selecting acceptance_tests shows Failed and explicitly says the tests failed according to captured output. Status is conveyed in text as well as color. The exact expected/actual values remain available in Output. Multiple scrollable regions add effort; a small structured assertion summary would be useful if it can preserve the recorded values faithfully.

### 4. Paired comparison — useful, reading-heavy

![Comparison](audits/2026-10-04/04-comparison.jpg)

Jump to first behavior difference selects the paired policy evidence and shows both actual times. The interface correctly avoids equating a difference with root cause. JSON includes repeated fields, with the important policy text below the first viewport. A changed-fields summary is the clearest remaining UX improvement. No additional comparison algorithm correctness claim is made from this screenshot.

### 5. Report preparation — meaningful friction, partly fixed

![Report before fixes](audits/2026-10-04/05-debug-report.jpg)

Observation, optional supporting context, extra redactions and an exact preview provide useful control. Copy/export and analysis are review-gated. The selected policy excerpt omits the subsequent failure, and the analysis controls are below the initial viewport. The new boundary callout and analysis jump address discoverability without sending data. No generated output was evaluated in this live audit.

### 6. Recording sources — healthy instructions, discovery still manual

![Sources](audits/2026-10-04/06-sources.jpg)

Sources disclose beta and summary-only limitations and explain browser-local import. Codex has a direct open action and Windows/default path guidance. Finding the correct session file still requires manual navigation. Source choices appear as checkboxes in the accessibility tree despite behaving like a single selection; consider radio semantics. Actual import/network privacy verification belongs to the automated suite, not this screenshot.

### 7. Clip review — clear privacy boundary, technical preview

![Clip review](audits/2026-10-04/07-clip-review.jpg)

Range fields, context opt-in, additional redaction, exact export preview, and explicit review are clear. Share text explains invited publication and unlisted access. The preview is technically dense; an event-name summary could aid review without replacing the full payload. Export, publication and revocation were not performed on the live deployment during this audit.

### 8. Hosted run access — blocked, truthfully explained

![Demo access](audits/2026-10-04/08-demo-access.jpg)

Disabled launch and named sandbox/integration blockers are honest. The former toolbar label overpromised availability; now it points to access/status. Analysis and local replay are separate from execution. No sandbox access or actual execution was established here.

### 9. Feedback access — confusing role transition, fixed copy

![Feedback access](audits/2026-10-04/09-feedback.jpg)

The screen clearly explains which feedback data would be saved and that no log is attached. However, Sign out plus Enter invitation looked contradictory in this non-study invited session. New copy explains that individual study access is needed. No invitation, feedback body or personal identifier appears in the screenshot; submission itself was not exercised.

### 10. Guided example — useful activation, not an unassisted test

![Guided example](audits/2026-10-04/10-guided-example.jpg)

Five explicit steps select real example evidence, explain the fault injection, and offer early exit. Heading focus supports keyboard orientation. The guidance tells users the answer, which is appropriate for onboarding but contaminates an unassisted comprehension measurement. The panel adds height; Show evidence is important at shorter viewports.

### 11. Phone-width workspace — fits, long path to evidence

![Phone-width workspace](audits/2026-10-04/11-mobile-workspace.jpg)

Controls wrap within the viewport and text remains readable. The comparison card and header consume nearly the first screen; recent runs and Shared clips are no longer in the visible navigation because the sidebar is hidden. A compact mobile navigation surface should precede a mobile-first claim. This is one emulated viewport, not a physical-device or comprehensive accessibility test. The viewport override was reset.

## Product and submission decisions

Keep the promise narrow: **inspect what happened, select the evidence, and take a reviewed handoff back to your coding agent**. Do not add more importers, team features, or automatic repairs before validating this loop. The concrete differentiation to demonstrate is time-centered investigation plus portable recordings; the audit does not prove alternatives lack those features.

The [official rules](https://nebiusglobalaihackathon.devpost.com/rules), checked October 4, require a working application using Nebius runtime inference or cloud compute and an NVIDIA open model. A public licensed repository with setup instructions, working demo, public YouTube demonstration under three minutes, track selection and technology feedback are required. Deadline: October 30 at noon Central. Judging ends December 15. The rules permit private credentials but require free, unrestricted judge access through judging. Clarify whether finite judge quotas comply; do not remove cost controls or raise limits automatically. Design, implementation, impact and idea quality are equally weighted.

Interpretation: runtime Nemotron analysis makes the model part of the core workflow; a missing sandbox is not itself a universal rule failure. It is a blocker for the fresh coding-run feature and its promised demonstration. Coding and Agentic Engineering is the intended track, subject to organizer interpretation and final submission review. Do not claim fresh code execution while it is unavailable.

Separate evidence record: the existing [report-quality evaluation](report-quality-2026-10-04.md) reports incorrect premises in generated questions even after source-owned excerpts improved factual presentation. That prior evaluation is a readiness input, not fresh screenshot evidence. The diagnostic-quality gate remains open. Do not market verified diagnoses or automatic repair.

Before submission:

1. Record three unassisted sessions with the corrected [study protocol](usability-check.md). Success target remains two of three identifying the policy and downstream consequence within two minutes. Separately ask what the product does before any coaching. Do not infer success from attractive screenshots or passing automated tests.
2. Evaluate useful, correctly grounded investigation questions on unseen real failures; distinguish valid formatting and exact quotes from useful diagnosis.
3. Resolve sandbox execution or explicitly narrow the final submission and video to supported workflows. Keep live versus illustrative provenance visible.
4. Verify fresh judge login, supported paid analysis, remaining allowance, and recovery access before publishing submission instructions. Clarify judge quota requirements with organizers; this audit sends no outreach.
5. Finish the public video, technology feedback, asset/license review and final link/access checks. Personal eligibility and registration remain owner confirmations, not inferred facts.

## Verification and limits

The scoped changes passed 52 frontend unit tests, a production build and 28 local browser tests, including report consent, keyboard focus restoration, import privacy, responsive controls and clip authorization/revocation. No backend API, secret, permission, model, provider, or budget configuration was changed. Known-secret scan found no configured keys, invitation codes/hashes or project identifier in the scanned public files, built assets and Git history. This is not a full security audit.

Screenshots and automated checks do not establish human comprehension, formal WCAG compliance, real sandbox execution, or report diagnostic reliability.

### 12. Deployed fixes — verified

![Report after fixes](audits/2026-10-04/12-report-improved.jpg)

Code commit: `621a601` (Clarify report scope and hosted access after UX audit). Cloudflare version: `560fdbbc-c3e5-453d-96e2-9ac24d2d2f22`. Reloaded the hosted app and verified Open recording, Demo access & status, updated example provenance text, the evidence-end callout, the analysis shortcut and revised signed-in feedback explanation. The shortcut focused Analysis options without a model call; Escape returned focus to Debug report. Existing analysis enable/pricing flags were preserved; sandbox launch remains unavailable. No automatic repair or broader capability was added.
