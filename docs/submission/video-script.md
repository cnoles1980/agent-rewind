# Agent Rewind — video script and recording instructions

**Target:** 2 minutes 40 seconds. **Audience:** a judge who has never seen Rewind. **One takeaway:** follow an agent mistake through recorded evidence, ask Nemotron to explain it, then bring a reviewable handoff back to the coding agent.

## Before recording — about 10 minutes

1. Open the [hosted app](https://agent-rewind.cnoles1980.workers.dev/) in your recording browser. Close other Rewind tabs and refresh. Enter your private invitation before starting the capture. If the session is already signed in, leave it alone. Keep the code, your `.env`, inbox and private files off-screen.
2. Maximize the browser. Make the policy/code/test text readable in the resulting video; record a ten-second sample and watch it at normal size. A 1920×1080 recording is a useful target if your screen supports it. Close unrelated tabs and silence notifications.
3. Open **Settings & sources**. Set **Earlier events in reports** to **10 events**, then close Settings. Without this, the default excerpt can omit the earlier policy or code change.
4. Select **checkout-flow — Example · stale**. Clear search. Keep the visible illustrative-example label. Use the event list rather than trying to hit tiny timeline blocks.
5. Locate these three events: **read_policy** at **00:22**, **apply_patch** at **00:44**, and **acceptance_tests** at **01:20**. You will show them in that order. The Diff tab is useful for the patch.
6. Keep the observation text below ready to paste. Do not submit repeated analyses just to rehearse mouse movements. Capture one actual request/result; later shots can reuse its Saved reports entry, labeled as saved.
7. For the optional import shot, use the public synthetic compatibility file `tests/fixtures/codex-sanitized.jsonl`, not a personal chat. It is an import demonstration, not proof of an actual Codex run. It deliberately includes a duplicate and unknown record; Capture details will disclose limitations.

**Observation to paste:**

> This illustrative checkout example requires free shipping at an order subtotal of $50 or more. The $50 acceptance check expected 0 but recorded 5. Explain the mismatch in plain English and suggest what to verify before editing. Preserve the requirement and acceptance test.

## Timed script

Read the narration naturally. The time windows include pauses for the screen actions. Do not read button names twice or narrate every click.

### 0:00–0:15 — The problem

**Show:** Rewind workspace with the stale example selected. Leave the example label visible. Briefly move the playhead, then pause.

**Say:**

“When a coding agent makes a mistake, the answer is often buried in a long conversation. Agent Rewind turns that history into a timeline, so I can find the evidence and take a useful explanation back to my agent.”

### 0:15–0:43 — The consequential evidence

**Show:** Click **read_policy 00:22**. Hold on “strictly above $50.” Click **apply_patch 00:44**, then **Diff**. Hold on `subtotal > 50`. Click **acceptance_tests 01:20**, then **Event**. Hold on expected `0`, actual `5`.

**Say:**

“This is a labeled, illustrative checkout example. Shipping should be free at fifty dollars or more. But the returned policy says strictly above fifty. The code follows that rule, and the boundary check charges five dollars at exactly fifty. Rewind lets me inspect each step without executing the tools again.”

### 0:43–1:03 — A real Nebius request

**Show:** With **acceptance_tests** selected, open **Analyze with Nemotron**. Paste the observation. Briefly show that the preview contains the policy, patch and test. Check the privacy-review box and click **Send to Nemotron once**.

**Say:**

“Now I select the failure, state what I expected, and review exactly what will leave my browser. This button makes a real request to NVIDIA Nemotron through Nebius Token Factory. It sends this excerpt, not my entire recording.”

**Edit:** Keep footage of the actual click and waiting indicator. If you cut waiting time, add the caption **“Waiting time shortened”**. Preserve the real result of that request. Do not imply a previous result arrived from a new click.

### 1:03–1:35 — Explanation and next step

**Show:** Scroll to **What happened** and **What to try next**. Pause long enough to read the main mismatch. Click the test citation to return to the failed assertion, then reopen **Saved reports**.

**Say if the response supports it:**

“Nemotron explains the mismatch: greater than fifty excludes exactly fifty. It suggests checking the implementation against the inclusive requirement, then rerunning the boundary test. The source buttons take me back to the recorded evidence. This is an interpretation to verify—not proof that the cause is settled, and not an automatic repair.”

**Accuracy rule:** Read your actual response before narrating this segment. If it says something different or incorrect, do not read the expected conclusion over it. Use the fallback below or stop and investigate.

### 1:35–1:54 — Keep the investigation

**Show:** Close and reopen **Saved reports**. Select the completed entry, expand **Exact analysis handoff to copy or download**, then click **Download analysis**. You can show Copy instead if you are comfortable replacing your clipboard.

**Say:**

“The completed analysis stays with this tape in my browser, including the exact evidence it used. I can reopen it without another model call, or take the report back to my coding agent to verify the suggestion against the actual project.”

### 1:54–2:14 — Compare and share

**Show:** Close the archive. Choose **First behavior difference** under **Observed Differences**; show the two policy responses. Open **Clip & share**, set **Start (seconds): 18** and **End (seconds): 81**, leave context unchecked, show the complete preview, check the clip-review box, and **Export clip**. Publishing a link is optional; do not use a personal recording.

**Say:**

“I can compare the corrected example, inspect what changed, and export a reviewed clip. Differences point me to evidence; they do not automatically prove a root cause. Reports and clips let another person inspect the same facts.”

### 2:14–2:31 — Bring your own recording

**Show:** **Settings & sources → Codex → Open Codex log**. Select the synthetic compatibility file prepared above. Show the imported timeline and **Capture details**. Cut out the file picker if it reveals local folders; caption **“Synthetic import sample.”**

**Say:**

“You can also open a Codex log locally. This small synthetic sample demonstrates the importer. Capture details make gaps explicit, including unavailable model context. Import and replay stay in the browser; requesting AI analysis or publishing a clip is a separate action.”

### 2:31–2:40 — Close

**Show:** The app and a simple end card containing the hosted URL and GitHub URL. No invitation codes.

**Say:**

“Agent Rewind is open source: a personal debugger for understanding recorded agent runs. Same agents. Clearer stories.”

## How to record and assemble it

Use your familiar recorder if you already have one. On Windows 11, **Windows + Shift + R** opens Snipping Tool recording: select the browser area, Start, then Stop. Save the capture; **Edit in Clipchamp** opens the editor. Record a microphone test first, or add narration separately. [Microsoft recording instructions](https://support.microsoft.com/en-us/windows/apps/use-snipping-tool-to-capture-screenshots)

Capture the seven sections separately if easier. Leave a little silence at each end so edits are simple. Record the real inference segment once, keep its original footage, then record narration after reviewing the result. Trim pauses, not evidence. Add captions if useful, especially **“Illustrative example”**, **“Live Nemotron analysis”**, **“Waiting time shortened”**, and **“Saved analysis”** at the appropriate moments.

Do not shrink the whole screen to fit every panel. Let the inspector and report text fill the relevant shot. Avoid background music and unnecessary animated titles. Watch the exported file once with sound and once muted to check readability.

## If the live request fails or takes too long

Do not repeatedly click Send. Incomplete/provider failures retain their reservation. A saved result is a legitimate fallback if explicitly labeled: **“Previously captured Nemotron analysis.”** Say: “Here is a saved result from a real Nebius request.” Use the actual saved report; do not manufacture a result or present it as the outcome of the failed request. Keep a brief, truthful limitation in the submission text. The private kit includes the real rehearsal report as a backup; Markdown cannot be imported as a Saved reports entry.

If you have no successful saved response in your recording browser, pause and ask for help. The archive is browser-local, so a report created in Codex's in-app browser will not appear automatically in Chrome or Edge. Changing browsers or clearing storage can lose it. Download important reports separately.

## Final review before uploading

- The exported video is about 2:40 and strictly under three minutes, with readable text and audible narration.
- The example and synthetic import are labeled; no live coding, sandbox completion, automatic fix or hidden reasoning is claimed.
- The actual result matches the spoken explanation. No API keys, invitation codes, private paths/chats or management credentials appear.
- Add the public app and GitHub links to the description. Review asset permissions and publish the reviewed video publicly on YouTube, then test it signed out. [Official submission rules](https://nebiusglobalaihackathon.devpost.com/rules)
