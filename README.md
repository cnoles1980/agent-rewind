# Agent Rewind

**Record a run. Find the consequential moment. Compare the evidence.**

A personal debugger for recorded agent runs: a Python recorder, local Codex importer, browser-local timeline player, paired comparison, annotations, and reviewed clips. Built for the Nebius × NVIDIA hackathon's Coding and Agentic Engineering track.

This is a controlled-use hackathon prototype. The offline examples are **illustrative fixtures**, clearly labeled in the UI. They are not evidence of live model execution. A real Nebius Nemotron tool-call probe has passed; a full coding run in a real sandbox and the Render deployment remain release gates. See [verification status](docs/verification.md).

## Run locally

Requires Python 3.12, [uv](https://docs.astral.sh/uv/getting-started/installation/), and Node.js 24 LTS. The source is a separate project and has no dependency on Agent Bridge.

From the repository root:

```powershell
uv sync --frozen
npm --prefix web ci
uv run python scripts/setup_local.py
npm --prefix web run build
```

The setup script creates an ignored `.env` and `.local/local-invitations.txt`. Open that file yourself to get a local invitation code. Existing `.env` settings are never overwritten. Live execution stays disabled.

On Windows:

```powershell
powershell -File scripts/start.ps1
```

Open **http://127.0.0.1:5173**. You should see the stale-policy example, its timeline, and the policy evidence in the inspector. The app runs locally even without an inference key. Process IDs and logs are under `.local`; stop only those listed processes when finished.

Alternatively, run these in two terminals (Windows, macOS, or Linux):

```text
uv run uvicorn agent_rewind.api:app --host 127.0.0.1 --port 8765
npm --prefix web run dev -- --host 127.0.0.1 --port 5173
```

The frontend uses a same-origin API proxy. Changing the frontend address requires changing `REWIND_ORIGIN` and restarting the API. For production preview at port 8765, set `REWIND_ORIGIN=http://127.0.0.1:8765`, build the frontend, and start only the API.

## Investigate a run

1. Open a `.jsonl` or `.json` Rewind tape. The browser validates and redacts it locally, then saves it in IndexedDB; importing makes no upload request.
2. Scrub or select an event. The inspector shows captured input/output, state available at that time, sanitized raw data, and captured code before/after. Space plays/pauses; arrow keys move between timed events.
3. Use search across captured event content. Large logs are paginated; the timeline retains all events. Unknown timestamps, context gaps, and unfinished spans remain explicit.
4. Compare another run. Shared elapsed time and paired jumps are separate modes. Inspect both sides of any detected difference. A difference is not an automatically established root cause.
5. Add or edit notes. Notes are browser-local sidecar data; execution events do not change.
6. Select a clip range. Context and model requests are omitted by default. If included, review earlier messages too. Add extra redaction phrases, read the complete preview, and check the review box before exporting or publishing.

Invited sessions may publish an unlisted clip. Anyone with its link can read it. A separate management credential, saved only in the publishing browser, revokes it from **Shared clips**. Clearing browser storage loses that credential; keep important exports and do not treat unlisted links as private access control.

## Python recorder

The recorder observes your loop; it is not an agent framework. SDK clients with `model_dump()` responses and plain dictionaries are supported. Exceptions are recorded and re-raised; capture failures produce visible warnings.

```python
from agent_rewind import Recorder

with Recorder("checkout-fix", output="runs", model=model_id,
              provider="Nebius Token Factory", secrets=[api_key]) as tape:
    response = tape.model_call(
        client.chat.completions.create,
        model=model_id,
        messages=messages,
        tools=tool_definitions,
    )
    result = tape.tool_call(
        "read_policy", read_policy,
        arguments={"policy": "shipping"}, call_id=tool_call.id,
    )
    tape.memory_write("last_policy_version", "current-v2")
    tape.annotate("Check the $50 boundary.")
```

Async methods: `amodel_call`, `atool_call`, `acontext_snapshot`, `amemory_write`, `aannotate`. Async context management is supported. Explicit `context_snapshot(messages, tools, state)` adds application state; uncaptured state is unknown. Full sanitized model-request snapshots are deduplicated by content hash. Execution JSONL is append-only; Python annotations use a `.notes.json` sidecar. Before opening a Python recording with annotations in the browser, combine them into a new portable file:

```text
uv run rewind pack --file runs/<run-id>.jsonl --out portable-tape.jsonl
```

Browser-created notes are included by the browser's export. Merely selecting the original Python JSONL file does not give the browser access to its separate notes sidecar.

Never pass authorization headers or environment dumps as application state. Pass known sensitive values using `secrets` and field names using `sensitive_keys`; redaction is a risk reduction measure, not a guarantee. Provider-exposed reasoning is labeled; encrypted payloads are redacted.

## Import one Codex recording

```text
uv run rewind import codex --file <selected-session.jsonl> --out <new-tape.jsonl>
uv run rewind validate <new-tape.jsonl>
```

Then choose **Open tape** in the browser. The importer reads only your selected file, never searches your chat history, and makes no network request. Existing output files are not overwritten. It correlates tool IDs, removes known duplicate representations, strips account metadata/local home paths, preserves exposed summaries, and reports unsupported records and truncated captures. It does **not** reconstruct the full model prompt. The isolated 0.1.0 adapter is covered by compatibility fixtures; Codex's local format may change.

## Live invited demo

See [deployment and provider setup](docs/deployment.md). The four agent tools are `read_file`, `read_policy`, `apply_patch`, and `run_tests`. Only a small, pure `shipping_fee(subtotal)` function can be edited. The server never executes generated Python; each evaluation uses a disposable remote Nebius sandbox with networking disabled and no credentials. An independent immutable acceptance harness tests exactly $50 after the agent finishes.

The stale variant deliberately supplies an archived policy. Its badge follows the actual acceptance result, even if the model behaves differently from the intended story. Replay never invokes the model or executes a tool. A fresh run requires an explicit launch.

## Verify changes

```text
uv run ruff check src tests scripts
uv run pytest -q
npm --prefix web test
npm --prefix web run build
```

Browser tests, from `web`:

```text
npx playwright install chromium
npm run test:e2e
```

Playwright can start the API and Vite itself. Local tests reuse servers on the configured ports; CI starts clean processes. The browser suite checks notes/clip review, comparisons, no-upload imports, HTML escaping, small-screen layout, and 1,000-event scrub latency. Provider doubles verify limits and cancellation without spending money; they do not replace real-provider acceptance.

Schema changes start in `src/agent_rewind/schema.py`:

```text
uv run rewind schema --out web/src/tape.schema.json
npm --prefix web exec -- json2ts -i web/src/tape.schema.json -o web/src/tape.generated.ts
```

The JSON Schema validates in the browser; generated TypeScript describes the same contract. `npm run generate:validator` (also run before builds/tests) compiles a standalone validator so the browser does not need unsafe dynamic code evaluation. Commit the schema, TypeScript and generated validator with schema changes. This follows [Ajv's standalone validation approach](https://ajv.js.org/standalone.html).

## Project map

- `src/agent_rewind`: schema, recorder, importer, FastAPI, SQLite job queue, bounded agent loop, remote sandbox adapter.
- `web/src`: timeline, event list, inspector, comparison, clip logic, local IndexedDB library.
- `examples`: visibly labeled synthetic examples; regenerated with `uv run python scripts/create_examples.py`.
- `tests`, `web/e2e`: backend, privacy, cancellation, comparison, and browser checks.
- `render.yaml`: one paid service, one process, persistent disk; live execution disabled initially.
- `docs`: provider gates, budget, security limitations, submission checklist, narration draft, verification.

MIT licensed. Third-party dependencies retain their licenses; see [notices](docs/third-party.md). No personal recordings, keys, or original private design files belong in the public repository.
