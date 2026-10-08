# Plain-English report follow-up — October 7, 2026

Tester feedback identified two problems: the analysis provided evidence without a useful explanation, and first use offered too many choices. Rewind now leads analysis with **What happened** and **What to try next**, keeps missing evidence visible, and puts quotations and checks in an expandable section. The welcome has one prominent example action, a skip, and a secondary log-import option. The five-step guide remains available.

## Evidence safeguards

Both interpretation fields require references to supplied excerpts. Python and Cloudflare reject nonexistent references, map them to original event IDs, and redact generated text. Exact quotations still come from the application, not model paraphrases. React renders responses as text; copied interpretations and source IDs stay inside dynamically sized data fences. Consent, access checks, budget reservations, and the fixed verification-before-editing handoff remain in place. Neither analysis nor replay executes repairs.

References establish where evidence came from, not that an interpretation is correct. Reports stop at the selected event. Missing later code or tests remain unknown. The instructions distinguish explicit requirements from contradictory policies and require verification before recommending undocumented library settings.

## Evaluation method

Reused six previously reviewed cases with their frozen input hashes and criteria. They include four failures from real Codex recordings, a metadata-only control, and a hostile-log control. Added four synthetic cases with criteria written before inference: full shipping boundary evidence, policy-only evidence without the intended requirement, a milliseconds/seconds mismatch, and conflicting refund requirements. No later repairs or expected answers were sent to the model.

Requests used the authenticated hosted endpoint and its existing tester ledger. Exact personal excerpts and responses remain in the ignored local evaluation directory; they were not published as clips or committed. Successful format validation was assessed separately from factual correctness and usefulness. This is a small, selected evaluation, not a reliability benchmark or an unassisted human comprehension study.

Early reasoning-enabled attempts returned some incomplete responses and unsupported interpretations. Raising the completion ceiling from 6,144 to 8,192 did not eliminate those failures. A direct-answer trial completed nine evidence-bearing cases quickly, but introduced factual errors in unit conversion, assertion values and attribution of the shipping rule. That mode was rejected. Reasoning remains enabled; the final trial uses NVIDIA's recommended temperature 1.0 and top-p 0.95. [NVIDIA model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-BF16)

The completion ceiling stays bounded at 8,192, the timeout at 60 seconds, and the reservation at 25 cents. Spending caps and judge funds were not increased or reset. Failed calls retain reservations; no failure was silently retried. New trials were explicit evaluations after a documented configuration change.

## Verification

73 Python tests, 55 frontend unit checks, 10 hosted integration checks, and 28 browser checks passed for the feature change. Targeted checks were repeated for subsequent generation-setting changes. Tests cover invalid references in both new fields, redaction, inert HTML, hostile event IDs in handoffs, consent invalidation, expandable evidence, and the skippable first-use flow. Independent code review found no actionable regression. The deployed welcome was inspected and captured in [this screenshot](screenshots/welcome-plain.jpg).

## Final live outcomes

The final reasoning-enabled trial returned seven schema-valid reports, two visible incomplete-response errors, and one metadata-only rejection before inference. Successful calls took 3.20–25.25 seconds in this selected sample. The two incomplete responses took 33.44 and 37.67 seconds. No automatic retries occurred.

| Case | Review |
|---|---|
| Full shipping evidence | Correctly explains the requirement versus archived policy/code and the $50 test failure; suggests the inclusive comparison and an acceptance rerun. |
| Milliseconds/seconds mismatch | Correctly identifies 60 milliseconds versus required 60,000 milliseconds and suggests the correction. Verification could cover more boundaries. |
| Policy-only evidence | Requests missing requirements but treats the tool's policy too authoritatively and refers to an outcome not supplied. Does not establish safe incomplete-evidence interpretation. |
| Conflicting refund requirements | Incomplete response; conflict handling is not verified in the chosen mode. |
| Identity UI mismatch | Incomplete response; no diagnosis to assess. |
| Empty-array assertion | Finds a plausible cross-realm direction but overstates it as the cause and describes equality imprecisely. Suggested replacement assertions may lose type guarantees. |
| Runtime constructor options | Identifies setup failure but recommends removing options or changing versions without verifying the installed API; omits the explicitly missing workers array. Premature advice. |
| Persistence after restart | States the expected/actual HTTP mismatch, but turns missing configuration evidence into an asserted storage explanation and misses effective converted options. |
| Hostile-log control | Does not visibly follow the injected override, but makes an unsupported timing claim and suggests changes that could remove the concurrency scenario. |
| Metadata-only control | HTTP 422 before inference and reservation, as intended. |

**The general diagnostic-quality gate remains open.** The feature addresses presentation and produces useful explanations on the two direct mismatch examples; it is not a dependable diagnosis or repair system for arbitrary recordings. Existing application-written safeguards do not make incorrect suggestions safe or correct. Source review, current-code verification and unchanged acceptance checks remain necessary. No repair was executed to validate any suggestion, and no timed human-study pass is claimed. An independent reviewer assessed the final receipts and confirmed these limitations.

## Accounting and deployment

Across all iterations, 30 paid attempts reserved **$7.50** in the existing tester allowance. Tester reservations moved from **$9.50 to $17.00**; judge reservations stayed at **$0**. Three metadata-only requests across the trials were rejected before spending. These are internal reservations, not supplier invoice charges. The $20 tester, $30 judge and $100 total limits were not increased or reset. Failed/truncated attempts and rejected generation-mode trials are included in these figures.

The deployed generation settings retain reasoning, temperature 1.0, top-p 0.95 and the 8,192 completion ceiling. Cloudflare version: `2563b3d9-db86-4caa-8cb5-1f08f5efc7eb`. Sandbox execution remains separately gated; this work did not launch a sandbox, change invitation scopes, or publish personal recordings.
