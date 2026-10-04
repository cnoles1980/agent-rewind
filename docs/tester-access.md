# Hosted tester access and feedback

The first study has a **shared $5 reservation cap**, equivalent to at most **20 analysis attempts across all individual tester invitations**. Calls also obey the existing $20 tester and $100 overall ceilings. The protected $30 judge allowance is separate. Failed or interrupted provider calls retain 25-cent reservations; no automatic retry or invoice reconciliation occurs. Replay, imports, evidence-only reports and feedback do not consume analysis reservations.

## For Corey

The private invitation kit is saved locally in `.local/tester-kit/`, which is ignored by Git. Send `Tester-A.txt`, `Tester-B.txt` and `Tester-C.txt` separately to the corresponding people. Each message contains only that person's code. Never send `OWNER-READ-ME.md` or the credentials JSON to testers or publish them. This repository contains no usable codes.

Open the hosted app, click **Feedback**, enter your separate owner invitation from the private instructions, and choose **Unlock feedback access**. The **Owner inbox** shows feedback, each tester's use and a **Revoke** button. Revocation immediately blocks new authenticated requests from that invitation, including already signed-in sessions. A provider call already admitted can finish and keeps its reservation. Revoke the codes when testing is over. Signing out ends only the current browser session; it does not revoke the invitation.

Click **Refresh feedback** to check new messages. There are no email notifications or automatic chat messages. Codex can read the inbox when you ask it to check feedback. Feedback can be deleted from this private inbox; it is not published as GitHub issues. Keep a private copy only if needed, and remove feedback when the study no longer needs it.

## For testers

1. Open [Agent Rewind](https://agent-rewind.cnoles1980.workers.dev/) on a laptop or desktop. No installation, API key or provider account is required.
2. Click **Feedback**, enter your private invitation, then **Unlock feedback access**. Close the dialog to explore. You can also sign in through Settings & sources → Manage invitation access.
3. Use the bundled examples first. Personal logs are optional and stay in your browser until you explicitly request analysis or publish a clip.
4. To try Nemotron, select an event, open **Debug report**, describe expected behavior, review the excerpt, and consent to sending it. Try one analysis initially so everyone gets a turn. Remaining attempts are shared across the group and shown in the analysis panel.
5. Click **Feedback** to rate the experience and explain what you tried, expected and observed. Review the text and choose **Send feedback**. Wait for **Feedback saved**. Feedback still works when the analysis allowance is used.

Fresh coding runs remain unavailable until the sandbox gate is completed. Model questions are unverified leads. Rewind does not apply fixes or send anything to your coding-agent chat automatically.

## Privacy and implementation boundaries

Feedback submission includes only a random deduplication ID, a 1–5 rating, up to 2,000 characters and review confirmation. The server adds the invitation label and submission time. No tape, report, screenshot, page URL or browser history is attached automatically; feedback is not sent to Nebius. Known-key redaction is additional protection, not a substitute for reviewing your text. Do not include keys, invitation codes or private project material.

The owner alone can read the inbox or manage invitations. Individual invitations are stored as hashes, linked to expiring sessions; the shared budget and revocation state persist across sessions and server restarts. Study admission is serialized with the existing budget ledger. Relogging, changing devices, revoking or creating codes never resets the cap. The study supports at most ten invitations and ten submissions per invitation. Deleting feedback clears its message and rating but retains a minimal receipt so retries cannot restore deleted content or reset the quota. Generated codes are returned once; if a creation request has an ambiguous outcome, inspect the owner inbox before creating a replacement, then revoke the unusable code.

This small hosted study is implemented in the Cloudflare adapter. The Python/local API continues to provide its existing local features; it does not expose an owner inbox or hosted study invitations. Existing development and judge codes remain separate from individual study invitations.

Owner setup uses an independent high-entropy secret code; only its SHA-256 hash is supplied as the `OWNER_CODE_HASH` Worker secret. It is never placed in a frontend variable, URL or public source. Use the existing HTTPS origin and CSRF checks for all study mutations.
