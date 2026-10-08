# Recording sources and debugging handoff

All imports below read **one file selected by the user**, with a 100 MB / 10,000-event ceiling. They run in the browser, sanitize before IndexedDB persistence, and never upload the recording. They never scan a directory, resume a chat, or execute the original tools. This is a prototype import surface, not a live account connector. Browser adapters are versioned `browser-importer/0.2.0`; the original Python Codex CLI adapter remains `0.1.0`.

## Larger local recordings

Local files up to 100 MB are supported; the original 20 MB ceiling was too restrictive for a 22.4 MB user log. File reading, parsing, conversion, validation, and redaction now run in a dedicated worker. The UI shows read progress, conversion and save phases. Cancel terminates the worker before persistence; the brief IndexedDB save phase cannot be cancelled. Oversized files are rejected before reading, with their size and the current limit in the error. No content is silently truncated to fit.

A worker keeps conversion off the UI thread; this is not unlimited or constant-memory streaming. JSON parsing still materializes the file in worker memory, and transferring/saving a large tape has a cost. The 100 MB file and 10,000-event limits remain protective bounds. The synthetic 24 MB retained-output case is verified; the 100 MB ceiling is not a performance guarantee on every device. Storage quota failures give recovery instructions. Public clip publication remains capped at 2 MB.

## Supported files

| Source | How to obtain the file | Captured / unavailable |
|---|---|---|
| Codex | Choose one local session JSONL under the configured CODEX_HOME sessions directory; default `~/.codex/sessions/YYYY/MM/DD/`. Windows default: `%USERPROFILE%\.codex\sessions`. Use **Settings & sources → Codex → Open Codex log**. | Messages, exposed summaries, correlated tool calls/results; older UI-only completed commands when no raw calls exist. No account metadata, encrypted payloads, or reconstructed model context. |
| Claude Code (beta) | Choose one transcript JSONL under `~/.claude/projects/<project>/` (Windows: `%USERPROFILE%\.claude\projects`). Configuration can change this location. | Text, exposed thinking, tool-use/result text. Signatures, attachments, sibling tool-result files, subagent files, and exact model context omitted. Run completion is not inferred. `/export` plain text is not supported. |
| n8n (beta) | Save one authenticated `GET /api/v1/executions/<id>?includeData=true` response using your own n8n environment. Keep the API key there. | Requires parsed `data.resultData.runData`. Node attempts, main JSON output, errors, timestamps and explicit duration. Inputs only from recorded `inputOverride`; no inferred inputs. Binary data, workflow configuration/credentials, model requests omitted. Workflow-definition downloads and serialized internal database exports are unsupported. |
| Factory | Explicitly choose **Factory** in Settings, then open a Droid `--output-format json` result file. | **Summary only**: result text, reported outcome/duration. No detailed tools or prompts. Full session/JSON-RPC adapter is not implemented. Ambiguous result objects are never auto-labeled as Factory. |
| Custom / Python | Use `Recorder`, or download the template in Settings and write an adapter producing a Rewind v1 tape. | Only what your recorder explicitly captured. Validate before importing. Use `rewind pack` to include a Python recorder's notes sidecar. |

Factory's example command starts a **new** agent invocation when the user runs it in their own terminal; it is not an export of an existing interactive chat and may incur provider charges:

```text
droid exec --output-format json "summarize this repository" > factory-result.json
```

Default directories and the Codex fixture were established from the existing local setup. Other adapters use synthetic compatibility fixtures matching the documented structures; **real user export compatibility remains to be checked**. Provider formats can change. Unsupported records are counted in Capture details. Truncated final JSONL lines are recovered with an incomplete warning; malformed middle lines are rejected. Missing timestamps, execution durations, and context remain unknown.

## Build a custom adapter

1. Download the sample tape from **Settings & sources → Custom / Python**. The sample is explicitly illustrative, not a real recording.
2. Generate a unique run ID. Set `source` to `custom` and identify your adapter/version in `configuration`. Use only sanitized data and label capture capabilities honestly.
3. Write a `run` header followed by one JSON object per line. Every event needs a unique ID, the same `run_id`, and an increasing `seq`.
4. Emit `tool.start` before invoking a tool and `tool.end` afterward, sharing a `span_id`. Record failures; preserve unfinished starts. Use `null` for unknown `elapsed_ms`/`duration_ms`. Use provenance `captured` for direct observations or `imported` for converted logs.
5. Only add context or memory events when actually captured. Do not treat transcripts as exact model requests. Never embed credentials, environment dumps, binary attachments, or executable connector code.
6. Validate with `rewind validate your-tape.jsonl` and open the file in Rewind. The Pydantic contract is `src/agent_rewind/schema.py`; its generated browser schema is `web/src/tape.schema.json`.

For Python applications, prefer explicit `Recorder.model_call` and `Recorder.tool_call` wrappers from the README. This observes your loop without replacing its agent framework.

## Debugging report behavior

Select a consequential event and click **Analyze with Nemotron**. Add your expected behavior. The report ends at that event and includes the configured number of preceding visible events (default four), observed tool inputs/results/errors, event IDs and timing, provenance, and capture limitations. It excludes full model/context payloads unless the event has a linked snapshot and you explicitly include it. It does not automatically include unrelated annotations or the entire recording.

Per-block previews are capped at 16,000 characters with an explicit truncation marker. Additional redaction applies to both the evidence and your observation. Review is required before copying or downloading and is reset when content changes. Markdown fences contain captured text; the receiving agent is told to treat it as untrusted evidence. This reduces prompt-injection confusion but does not make arbitrary log contents trustworthy. Review remains necessary.

The report is assembled locally without another model or API charge. Paste it into the agent's original chat, ask it to inspect the current project and verify the proposed correction, then record a fresh run and compare. Automatic chat posting, execution, and repair remain outside this release.

An additional **Analyze selected evidence** action sends that reviewed excerpt to Nemotron through Nebius, with separate explicit consent and invited access. It returns cited findings and a repair prompt. This optional model call is budgeted and distinct from local report export; see [analysis behavior and setup](analysis.md).

## Source references (checked October 3, 2026)

- [Claude Code session storage and exports](https://code.claude.com/docs/en/sessions#export-and-locate-session-data) — internal transcript formats can change; structured capture differs from rendered `/export` text.
- [Factory Droid Exec output formats](https://docs.factory.com/droid-exec/overview) — documented JSON result and separate JSON-RPC integration surface.
- [n8n public API](https://docs.n8n.io/api/api-reference/) and [n8n task-data interfaces](https://github.com/n8n-io/n8n/blob/master/packages/workflow/src/interfaces.ts) — execution data, node timing, `inputOverride`, and recorded outputs.
