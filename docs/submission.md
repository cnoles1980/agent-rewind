# Submission and demo checklist

Target: **Coding and Agentic Engineering**, Nebius × NVIDIA hackathon. Planned submission October 29; official deadline October 30, 2026 at noon Central. Maintain judge access through December 15. Recheck the [official rules](https://nebiusglobalaihackathon.devpost.com/rules) immediately before submission.

## Honest project claim

Agent Rewind is a personal debugger for understanding recorded agent runs. Its focus is a time-centered investigation flow and portable local recordings: select the evidence, inspect the context, compare another run, then share a reviewed excerpt.

Do not claim invention of session replay, deterministic LLM re-execution, universal framework support, access to hidden reasoning, or automatic root-cause proof. Related products include [Langfuse sessions](https://langfuse.com/docs/observability/features/sessions) and [LangSmith trajectories](https://www.langchain.com/blog/langsmith-trajectories-tracing).

The live coding agent must genuinely use NVIDIA Nemotron through Nebius. The inference probe demonstrates connectivity only. The submission demo needs real code edits and independently checked outcomes in an isolated sandbox. Show saved recordings only with their provenance visible.

## Owner actions and gates

Nemotron evidence analysis is now part of the debugger itself: select a bounded excerpt, review it, send it to Nemotron through Nebius, inspect cited findings, and hand a reviewed repair prompt to the coding agent. This makes runtime inference useful for imported recordings as well as the hosted coding experiment. Do not imply generated analysis is a verified diagnosis. Demonstrate this flow in the video, shortening the introductory and importer segments to stay below three minutes. Genuine coding runs and hosted judge access remain separate release gates.

- [ ] Corey confirms registration and personal eligibility.
- [ ] By October 5: Nebius access, execution/cancellation/network isolation, image and actual prices verified; fallback decision documented if needed.
- [ ] Real stale and corrected runs are inspectable; results are not forced to fit the script.
- [ ] Three testers attempt the task without coaching; at least two identify the bad policy and downstream consequence within two minutes.
- [ ] Corey reviews one personal recording and one clip before either becomes public.
- [ ] Clean checkout setup and actual hosted judge access pass; no private recordings or keys in public source.
- [ ] October 23 feature freeze; October 24–28 bug fixes, licensing/asset review, screenshots and narrated video.
- [ ] Public MIT repository, live HTTPS demo, technology feedback, public YouTube video under three minutes, and private judge instructions are complete.
- [ ] October 29: Corey reviews the finished artifacts, publishes the repository/video/Devpost entry, and checks every public link and judge credential in a fresh browser.
- [ ] Access, budget reserve, backups and recovery remain available through December 15.

## Approximately 2:40 narration and screen sequence

**0:00–0:15 — Problem.** “An agent changed the code. The tests failed. Which piece of evidence sent it in the wrong direction? Agent Rewind lets me inspect the run in time.” Show the white timeline workspace.

**0:15–0:40 — Genuine run.** Launch the invited Nemotron scenario. Identify the deliberately injected stale policy. Show recorded model and tool spans; do not pretend the recording is a live stream if it is saved.

**0:40–1:15 — Consequential moment.** Select `read_policy`, read the strictly-above-$50 rule, inspect the next captured model request, open `apply_patch` Diff, then select the independently recorded $50 assertion. If the outcome differs from the expected regression, describe what actually happened.

**1:15–1:55 — Corrected comparison.** Launch or open a genuinely recorded current-policy run. Jump between input and behavioral differences. Show both policy results and both code/test outcomes. Explain that observed divergence is evidence, not automatic proof of cause.

**1:55–2:15 — Portable personal tapes.** Run the local Codex importer on a deliberately reviewed example. Open the resulting tape and show the partial-context label and browser-local library. No full personal history upload.

**2:15–2:35 — Evidence clip.** Add a note, select the meaningful range, inspect the complete clip preview, redact a synthetic private phrase, and create/revoke a share link. Keep invitation codes and management credentials off-screen.

**2:35–2:40 — Close.** “Same agents. Clearer stories.” Show project and public repository links.

## Usability task

Without instruction beyond the UI: “Find what changed between the two checkout runs and show the evidence that explains the $50 result.” Record time to locate policy, whether the tester inspects model context/code/tests, incorrect conclusions, and questions. Do not count coached success. This study has not been conducted yet.

## Technology feedback draft — observed only

Nebius Token Factory accepted `nvidia/Nemotron-3_5-Lightning` with forced tool selection and returned a `read_policy` call, exposed reasoning fields, and token usage. The synthetic probe used 298 prompt and 35 completion tokens. The sandbox endpoint required project configuration; the initial missing-project error was clear, but account access, cancellation behavior and pricing remain to be evaluated. Replace this draft with actual integration findings after the live provider gate.
