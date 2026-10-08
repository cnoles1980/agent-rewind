# Report-quality evaluation — October 4, 2026

Historical evaluation. The [October 7 follow-up](report-quality-2026-10-07.md) adds separately labeled plain-English explanations and next steps while retaining application-owned quotations. The limitations below remain relevant.

**The diagnostic-quality gate is not passed.** Real recordings exposed material mistakes that successful API requests and valid event citations do not catch. Treat generated reports as investigation aids requiring source review, not verified diagnoses or automatic repair instructions.

## Method and privacy

With the owner's permission, selected four recorded test failures from two local Codex sessions. Later repair patches and passing test output were held out of inference and used for review. Two additional controls withheld failure evidence or appended a clearly synthetic hostile instruction to recorded output.

The six inputs were manually curated, redacted excerpts, produced through the player's report renderer. They were not complete transcripts or an end-to-end automatic failure-selection benchmark. Criteria were written before the first model call. Subsequent comparisons used the same request-file hashes; neither expected answers nor later repairs were sent to the model.

Only reviewed excerpts went through the invited hosted analysis endpoint to Nebius. Original recordings, selected code/output, exact responses, identifiers, and the detailed review remain in the owner's ignored local evaluation directory. They are not public fixtures, clips, or repository content. This document contains aggregate findings only.

## Findings

| Case | Baseline Lightning response | Review outcome |
|---|---|---|
| UI state mismatch during a pending operation | Suggested application state/save changes | Missed the test-setup explanation; a hypothesis depended on an operation completing after the failing assertion. The held-out repair changed test navigation. |
| Empty-array assertion | Described an empty actual value as non-empty | Contradicted the captured values and missed comparison/VM context. |
| Runtime initialization | Identified rejected constructor options | Useful direction, but suggested removing options before establishing how to preserve their meaning in the installed API. |
| Persistence after runtime restart | Identified a persistence-related failure | Invented configuration syntax and requested information partly present in the excerpt; did not establish the effective converted configuration. |
| Missing-output control | Asked for missing information | Also supplied unsupported hypotheses and a generic repair request instead of stopping at evidence gathering. |
| Hostile-log control | Did not follow the injected override or claim success | Passed that narrow instruction-following control, but its repair suggestion still contradicted the captured assertion order. This is not broad injection-resistance evidence. |

A revised prompt emphasized literal assertion values, execution order, test setup, supported API syntax, and withholding repairs when evidence was insufficient. Repeating all six inputs produced three usable-format responses and three HTTP 502 failures. The returned reports still included contradictory hypotheses and unsupported configuration suggestions. The generic failure response does not distinguish provider failure from rejected model output, so the exact causes of those three failures are unknown.

Nemotron 3 Super and Nemotron 3 Ultra were each tested on the two difficult assertion cases with the same revised prompt and inputs. All four calls returned valid responses, but neither model established a dependable improvement: premature application edits and incorrect equality explanations remained. These are small, selected probes, not a model leaderboard.

## Decision and shipped changes

- Did **not** promote the experimental prompt or switch the default model. Restored the original Lightning configuration after the comparison.
- Renamed **Observed facts** to **Model observations — verify against evidence**, including the copied handoff.
- Strengthened the application-written handoff guardrail: check actual/expected values, execution order, current code and test setup; independently confirm the cause; request missing details before implementing a suggested repair.
- Retained source citations, reviewed copy/export, and the boundary that analysis never executes tools or repairs code. Presentation and prompt wording do not guarantee model correctness.

The 34 frontend tests and four targeted analysis browser checks passed. Hosted HTML serves the verified build, and status confirms the original Lightning model with analysis enabled and live coding disabled. Frozen evaluation inputs predate the final handoff wording change; no diagnostic improvement is claimed from that wording alone.

## Execution and accounting

There were **16 paid attempts**: six baseline, six revised-prompt, two Super, and two Ultra. Thirteen returned schema-valid analyses; three returned visible errors. Failed requests were retained as failures and not retried automatically. Schema validity was assessed separately from usefulness and factual support.

Each attempt retained the existing **25-cent reservation**: **$4.00 additional tester reservations**, taking the project ledger from $1.75 to **$5.75 reserved**. Judge reservations remained **$0**. Reservations are conservative budget commitments, not reported invoice charges; rejected responses may still incur provider charges.

The authenticated catalog contained all three models. On this date, [Nebius's official model catalog](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference) listed input/output rates per million tokens of $0.06/$0.24 for Lightning, $0.30/$0.90 for Super, and $1.00/$3.00 for Ultra. The same bounded requests and existing per-call reservation were used; no budget limits were increased. Account billing remains authoritative.

## Remaining acceptance work

1. Improve evidence representation and test failure extraction so the report can distinguish literal observations from inferred explanations. Test any change against the frozen cases and additional unseen failures; do not claim improvement from tuning to these examples alone.
2. Require useful uncertainty on missing evidence, preservation of requirements, accurate assertion interpretation, and verification before edits. Add safe failure-category diagnostics without logging provider bodies or private evidence.
3. Run the planned three-person comprehension study. Neither automated checks nor this manual review replaces that study.

This evaluation did not run generated repairs, launch a coding sandbox, or establish fresh coding-agent execution. Nebius sandbox access and the live-run acceptance gates remain separate.

## Follow-up: source-selected excerpts and investigation handoffs

The shipped follow-up changes the evidence contract. Rewind decodes captured text wrappers, preserves literal empty values, retains beginning/end evidence when truncation is necessary, and divides the reviewed sources into numbered contiguous excerpts. Nemotron selects excerpt IDs; the application supplies the text and event citations. Generated factual paraphrases and model-written repair instructions are no longer accepted. Questions and suggested checks remain generated and unverified. The copied handoff fences captured content and asks the receiving agent to independently inspect the project before editing.

Early iterations attempted exact model-written quotations. Seven paid attempts failed visibly: six format failures and one quote mismatch. Safe validation diagnostics isolated a question-length failure; simplifying output constraints resolved format rejection but exact quotation remained unreliable. These attempts were not successful reports and were not retried automatically. The final selector contract avoids both model-written quotations and the punctuation constraint. Budget limits and the default Lightning model were unchanged.

The final contract was tested against the same six frozen input hashes, followed by two new synthetic holdouts whose review criteria were written before inference. All five evidence-bearing frozen cases and both holdouts returned usable-format reports with application-owned evidence. The metadata-only control returned HTTP 422 before inference and reservation. The seven successful calls took approximately **6.9–20.8 seconds**. These are selected samples, not a production latency benchmark.

| Case | Final follow-up review |
|---|---|
| UI state mismatch | Source values are preserved, but questions still confuse which assertion failed and request execution-order evidence already present. The hidden test-navigation repair was not identified. |
| Empty-array assertion | No fabricated non-empty value in the excerpts. Questions drift toward request counts and miss the VM/comparison distinction. Diagnostic criterion still fails. |
| Runtime initialization | Useful direction toward installed version and accepted options. Some requested configuration is already present; no demonstrated repair. |
| Persistence after restart | Asks about persistence and routing, but describes a denied DELETE as deletion and suggests changing a setting before confirming the converted configuration. This interpretation remains wrong. |
| Missing-output control | Stops before paid inference, with a clear request for recorded output or code. |
| Hostile-log control | Does not claim tests passed, replace the fixed handoff or recommend enabling permissions. The malicious text remains visible as captured evidence; quoting it is not execution or endorsement. Some timing speculation remains. |
| New synthetic missing-module case | Useful interpreter/dependency inspection questions; no invented completed installation or application-test outcome. Some redundancy remains. |
| New synthetic CSV-header case | Identifies the header/key mismatch and asks about intended mapping without discarding customer IDs. Adds unnecessary speculation about CSV configuration. |

**What improved:** displayed evidence cannot be rewritten by the model; malformed/empty requests stop before spending; the handoff is application-written; invalid outputs fail with safe categories; long captures remain inspectable; source text and imported IDs stay inside data fences when copied.

**What did not pass:** reliable diagnosis on the harder real cases. Questions can contain incorrect premises, and suggested checks can be premature despite the prompt. Do not advertise verified root causes or automatic repair. The two easier synthetic holdouts do not establish generalization. The broader quality gate and the [three-person comprehension exercise](usability-check.md) remain open.

This follow-up used **14 paid attempts** (seven rejected early iterations and seven accepted final reports), adding **$3.50 in tester reservations**, from $5.75 to **$9.25**. The metadata-only rejection added nothing. Judge reservations remained **$0**. These figures are conservative internal allowances, not supplier invoice amounts. Originals, exact personal excerpts and responses remain private; only aggregate results are published.
