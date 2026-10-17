# Agent Rewind — final Devpost copy

Prepared October 17, 2026. Corey selected **Best Apps and Agents**. Copy the project-story sections into Devpost; the field guide and private-access notes are instructions, not part of the public story. The current form's field names/limits have not been inspected.

## Field guide

- **Project name:** Agent Rewind
- **Tagline:** Understand an AI agent's mistake. Follow the evidence. Take a clearer report back to your coding agent.
- **Track:** Best Apps and Agents
- **Try it / demo URL:** https://agent-rewind.cnoles1980.workers.dev/
- **Source URL:** https://github.com/cnoles1980/agent-rewind
- **Video URL:** Add the public YouTube watch URL after upload; this is the only missing public link.
- **Built with:** NVIDIA Nemotron, Nebius Token Factory, React, TypeScript, Vite, Python, FastAPI, Pydantic, Cloudflare Workers, Cloudflare Durable Objects, IndexedDB.
- **Technology feedback:** Use the separate [technology feedback](technology-feedback.md) if the form has a dedicated question.
- **Team/eligibility/development dates:** Corey completes and confirms these from his own records. Do not infer them from Git timestamps.

---

## Inspiration

AI makes it easier to build software, but understanding an agent's mistake can still feel like detective work. The relevant instruction, tool response, code change, and failed test may be scattered across a long conversation.

I wanted a personal debugging workspace for people building with agents: a place to see the sequence, understand the evidence in plain English, and take a useful report back into the agent's chat. Agent Rewind focuses on that individual investigation workflow, with portable recordings and a visual timeline.

## What it does

Open a recorded run, find the moment that matters, and inspect what was captured. Scrub the timeline, search events, examine available context and code differences, add notes, and compare two runs. A Codex log can be opened directly in the browser without connecting an account. Selected-file adapters also support Claude Code, n8n execution JSON, Factory result JSON, and the portable Rewind format, with capture limitations made visible.

When the evidence needs interpretation, choose an excerpt, state what you expected, review what will be sent, and ask NVIDIA Nemotron to analyze it through Nebius Token Factory. The report leads with what happened and what to check next, with source links back to the captured evidence. Completed reports stay with the recording in that browser and can be reopened without another model call.

Copy or download the report and its supporting evidence for your coding agent. Export a reviewed clip, or publish a link using invited access. Import and replay run locally; analysis and clip publication are separate, explicit actions.

The demo follows a simple boundary mistake: shipping should be free at $50 or more, but a stale policy says strictly above $50. The recorded code follows that stricter rule, and the $50 check fails. Rewind brings the policy, code, test result, and Nemotron explanation together.

## How we built it

I built Agent Rewind with Codex assistance. React, TypeScript, and Vite power the timeline and inspector. IndexedDB stores imported recordings, notes, and completed analyses locally. A versioned JSONL format connects the Python recorder and importers to the player; the local API uses FastAPI and Pydantic.

The hosted application runs on Cloudflare Workers, with SQLite-backed Durable Objects for access, accounting, and published clips. Its server makes real runtime calls to `nvidia/Nemotron-3_5-Lightning` through Nebius Token Factory. The Nebius key stays server-side. Judges use a private invitation rather than supplying their own API key; self-hosters configure their own credentials.

Nemotron interprets the reviewed evidence and suggests a next check. Rewind validates source references and lets users inspect the quoted evidence. The model has no tools for changing code or executing repairs.

## Challenges we ran into

Making a report readable was not enough. Early feedback asked for a direct explanation of the mismatch and a useful next step, rather than a dense technical breakdown. I revised the report structure, simplified onboarding and access, made analysis easier to find, and saved reports beside their recordings.

Evidence quality also matters. A partial log cannot reveal context that was never captured, and a plausible model response can still be wrong. Evaluation exposed unsupported advice and incomplete responses, including a repeat of the complete shipping example during the final walkthrough. The interface preserves capture gaps and surfaces failures; users must verify suggestions against the actual project. Reliable completion remains an open issue.

## Accomplishments that we're proud of

The workflow connects local import, time-based investigation, real Nemotron analysis, source verification, comparison, and a reusable handoff in one workspace. Reports can be reopened without paying for another call. Public visitors can explore the debugger without a provider key, and the MIT-licensed source can be run locally.

## What we learned

People need both an explanation and a way to check it. A clear next step is useful; a source link makes it inspectable. Neither a citation nor valid structured output proves that a diagnosis is correct. The product needs to keep that distinction visible while making investigation easier.

## What's next for Agent Rewind

Improve analysis of incomplete or conflicting evidence, broaden compatibility fixtures for changing log formats, and test whether more first-time users can find a failure and understand the suggested next check without coaching.

The current release is a controlled-use prototype. Live sandbox coding execution remains deferred; it is not part of the hosted demo. Rewind does not reconstruct hidden reasoning, automatically prove root cause, post into other chats, or apply repairs.

## Demo and testing notes

The video uses labeled illustrative checkout recordings and a synthetic Codex import sample. The displayed Nemotron report is a saved response from an actual Nebius request. No live code repair or sandbox execution is claimed.

Judges can use the hosted app without installation or their own provider key, following the separately supplied private access instructions. Saved reports are browser-local; download them before clearing browser data. Hosted analysis has a finite protected allowance and request limits, whose compatibility with judge-access requirements still needs organizer clarification.

---

## Private testing field — do not put credentials in the public story

Use `JUDGE-ACCESS-PRIVATE.md` from the local submission package only in a field explicitly marked private for judges/organizers. If the form does not offer a private field, obtain a private delivery route from the organizer instead. No provider key belongs in Devpost.

The [remaining-action checklist](submit-checklist.md) records outstanding publication, owner confirmations, judge walkthrough and access-policy checks. Prepared text is not a claim that those steps have already been completed.
