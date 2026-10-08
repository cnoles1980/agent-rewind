# Devpost copy — review before publication

**Project:** Agent Rewind

**Tagline:** Find the evidence behind an AI agent mistake—and take a clearer report back to your coding agent.

**Track:** Coding and Agentic Engineering

**Demo:** https://agent-rewind.cnoles1980.workers.dev/

**Source:** https://github.com/cnoles1980/agent-rewind

**Video:** Add the reviewed public YouTube URL after recording. Do not submit with this placeholder.

## Inspiration

AI-assisted builders can produce working software quickly, but understanding a failed agent run is a different skill. The relevant policy, code change and test result may be separated by a long conversation. I wanted a personal workspace that makes that evidence easier to follow—and easier to bring back into the coding agent's chat.

Agent Rewind does not claim to invent tracing or session replay. Its focus is a time-centered investigation experience, portable recordings, and a reviewed debugging handoff for an individual builder.

## What it does

Open a recording, select the consequential event, and inspect the captured inputs, outputs, context and code differences. Compare runs to see changed inputs or behavior. Add notes and export or publish a reviewed clip.

When the evidence needs interpretation, select a bounded excerpt, state the expected behavior, review the data, and send it to NVIDIA Nemotron through Nebius Token Factory. The response leads with what happened and what to try next, with links back to captured evidence. Completed analyses are saved with their recording in the same browser and can be reopened without another model call.

Importing and replay do not upload the recording or execute its tools. Requested analysis sends only the reviewed excerpt; clip publication sends the reviewed clip. The handoff can be copied or downloaded for the user's coding agent. Rewind does not automatically post to chats or apply repairs.

## How we built it

The player uses React, TypeScript and Vite, with a custom timeline and an accessible event list. IndexedDB stores local recordings, annotations and completed analyses. A versioned recording format connects the Python recorder and supported importers to the player.

The hosted application runs on Cloudflare Workers. Its server calls `nvidia/Nemotron-3_5-Lightning` through Nebius Token Factory; the provider key stays server-side. Invitations, exact-origin mutation checks and persistent budget admission protect paid analysis. SQLite-backed Durable Objects retain access/accounting metadata and published clips; the hosted analysis endpoint does not retain the submitted excerpt or generated report.

Nemotron is part of the investigation workflow: it interprets the selected evidence and proposes a next step. Rewind validates evidence references and renders captured quotations alongside the interpretation. A citation establishes its source, not the truth of the model's explanation. The model receives no repair tools.

## Challenges

The hardest problem was usefulness without false certainty. Tester feedback asked for plain-English conclusions rather than a dense breakdown. We changed the report to lead with an explanation and next step, then made quotations and checks expandable.

Real evaluation still exposed unsupported advice and incomplete responses on ambiguous cases. A complete shipping-boundary example produced a useful explanation during rehearsal; three harder controls returned visible incomplete-response errors. The prototype does not claim reliable automatic diagnosis. Users must verify suggestions against current requirements, code and tests.

Privacy also shaped the architecture: local imports, explicitly reviewed excerpts, pre-write redaction, bounded uploads and separate reviewed clips. Redaction can miss private business information, so review remains necessary.

## What we're proud of

A newcomer can follow the policy-to-code-to-test evidence trail without reading an entire raw log. The same workspace connects timeline navigation, comparison, real Nemotron analysis, and a saved handoff. The public source can be installed without a provider key for local investigation; self-hosters supply their own server-side key for analysis.

## What we learned

Readable structure is not enough: users need a concrete explanation and a clear next check. We also learned to separate successful software behavior from model correctness. Valid JSON and matching citations do not make a diagnosis true. Recording limitations and uncertainty have to remain visible.

## What's next

Improve incomplete-evidence handling and report reliability, and test comprehension with more builders. A sandbox coding-run experiment remains in the repository as a deferred prototype; it is not offered by the hosted submission or represented as verified execution.

## Testing and limitations

Use the hosted application and the private judge instructions. Judges need an invitation, not their own API key. The bundled checkout examples and optional Codex compatibility sample are labeled illustrative/synthetic data; the report analysis shown in the rehearsal is a real Nebius request. Saved analyses are browser-local and require separate downloads for backup. A finite protected inference allowance and request limits remain in place; organizer clarification about judge access is still pending.

## Before pasting this draft

- Add the public video URL and confirm every statement matches its footage.
- Confirm registration, eligibility, team details and any requested development dates yourself.
- Put the judge credential only in private testing instructions.
- Include the separate [technology feedback](technology-feedback.md).
- Resolve the access question; do not silently remove the limitation or claim organizer approval.
