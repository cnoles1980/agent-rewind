# Three-person investigation check

Goal: at least two of three people identify the bad policy response and its downstream effect within two minutes, without coaching. Allow 5–10 minutes per person. This is still an outstanding human acceptance check; automated browser tests do not count.

## Prepare

Use the [hosted app](https://agent-rewind.cnoles1980.workers.dev/) in a fresh browser profile. Use the bundled examples, which are labeled illustrative recordings. No invitation, personal logs or paid calls are needed for the timed task. Do not demonstrate the answer first. Record notes with each person's agreement; names and recordings need not be published.

## Read this task aloud, then start the timer

> “An agent changed a checkout function, and a test failed. The requirement is free shipping when the subtotal is $50 or more. Use Agent Rewind to find the recorded information that might explain the failure. Show me the relevant evidence and what happened afterward.”

Stop the timer when the person can show both the archived policy and the resulting boundary-test failure. Let them navigate independently; note hesitation, mistaken interpretations and requests for help. If they ask for coaching, record it and let them continue, but do not count that attempt as an unassisted pass.

## Facilitator's answer guide — keep out of the participant's view

The stale example's `read_policy` result says shipping is free strictly **above** $50. Its recorded change excludes exactly $50. The immutable boundary check expects free shipping at $50 and fails. The corrected example has the current rule and a different outcome. These are recorded examples, not fresh sandbox runs; comparison reveals differences, not a proven general root cause.

After the timed task, ask the person to compare the runs and create an evidence-only debugging handoff. Ask: “What would you send back to your coding agent? What would it still need to check?” Verify they understand that replay and copying a report do not execute a fix.

## Optional invited analysis check

Use a separate tester invitation supplied privately by Corey. Have the participant review the selected excerpt and explicitly consent to one Nemotron call. Ask them to distinguish captured excerpts from model questions, follow a citation, and explain why a suggested explanation still needs verification. Budget one 25-cent reservation per participant; do not use the judge allowance. Never put invitation codes in this document, screenshots or public notes.

## Record results

| Participant | Time | Found policy | Found code/test consequence | Needed coaching | Understood model uncertainty | Main obstacle |
|---|---|---|---|---|---|---|
| A | | | | | | |
| B | | | | | | |
| C | | | | | | |

Corey needs to recruit three people and capture these results. Codex can then address the observed obstacles and update the acceptance record. Keep results pending until actual people complete the exercise.
