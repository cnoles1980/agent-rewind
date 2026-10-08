# Agent Rewind — judge walkthrough

**Open:** https://agent-rewind.cnoles1980.workers.dev/

Use a desktop/laptop browser. No installation, provider account or API key is required. The invitation code is supplied separately in the private testing instructions, not in this public file.

1. Enter your invitation during welcome/session setup and choose **Unlock AI analysis**. If you already skipped setup, use **Settings & sources → Manage invitation access**. Choose **Try an example**, or skip the tour.
2. In **Recent runs**, choose **checkout-flow — Example · stale**. These bundled recordings are labeled illustrative examples, not recordings of live sandbox execution.
3. Select **read_policy** at **00:22**, **apply_patch** at **00:44**, then **acceptance_tests** at **01:20**. Inspect the returned policy, code and failing $50 check. The intended requirement is free shipping at $50 or more.
4. In **Settings & sources**, set **Earlier events in reports** to **10 events**. Close Settings, select **acceptance_tests** again, and choose **Analyze with Nemotron**. State: “Shipping must be free at $50 or more, but the $50 check expected 0 and recorded 5.” Review the excerpt, check the privacy-review box, and choose **Send to Nemotron** once.
5. Inspect **What happened**, **What to try next**, and the source buttons. Suggestions require verification; Rewind has not repaired or tested anything. Close the dialog, open **Saved reports**, and reopen the analysis. It remains attached to this recording in this browser, including after reload.
6. Use **First behavior difference** under **Observed Differences** to compare the two policy responses. Choose **Clip & share** to review a bounded excerpt; export locally or publish the reviewed synthetic clip. Published clips can be revoked under **Shared clips** using the same browser.
7. Optionally import one of your own logs through **Settings & sources**. It stays local until you explicitly request analysis or publish a clip. No personal log is needed to evaluate the app. Send judge questions or feedback through the submission's entrant contact; the in-app Feedback form is for individually invited usability testers.

**If something fails:** allow up to 60 seconds for analysis. The app reports incomplete/provider failures and does not retry automatically. Reopening a saved report, importing and replaying do not call a model. For expired access, re-enter the private invitation. If an allowance or service error blocks testing, contact the entrant through the submission; do not obtain or send a provider key. A finite protected judge allowance and request limits remain enabled pending organizer clarification.

**Privacy:** completed reports are browser-local. Download them separately before clearing browser data or removing a recording. Tape exports and shared clips do not include analysis archives. This release does not support launching fresh sandbox coding runs.
