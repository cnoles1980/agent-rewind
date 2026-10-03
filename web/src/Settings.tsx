import { useState } from "react";
import { FolderOpen, DownloadSimple } from "@phosphor-icons/react";
import { customTemplate, type ImportSource } from "./imports";
import { download } from "./engine";

export type Preferences = { speed: number; reportPreceding: number };
export const defaults: Preferences = { speed: 1, reportPreceding: 4 };
export function readPreferences(): Preferences {
  try {
    const p = JSON.parse(localStorage.getItem("rewind.preferences.v1") ?? "{}");
    return {
      speed: [0.5, 1, 2, 4].includes(p?.speed) ? p.speed : 1,
      reportPreceding: [0, 2, 4, 8, 10].includes(p?.reportPreceding)
        ? p.reportPreceding
        : 4,
    };
  } catch {
    return defaults;
  }
}

const sources: {
  id: ImportSource;
  name: string;
  support: string;
  detail: string;
  steps: string[];
  link?: string;
  command?: string;
}[] = [
  {
    id: "codex",
    name: "Codex",
    support: "Local session log",
    detail:
      "Imports prompts, agent messages, exposed summaries, and tool calls/results. Exact model context is unavailable.",
    steps: [
      "Find the session JSONL for the run you want. Default local location: ~/.codex/sessions/YYYY/MM/DD/ (Windows: %USERPROFILE%\\.codex\\sessions). A custom CODEX_HOME changes this location.",
      "Choose that one .jsonl file below. Conversion and redaction happen in this browser; no CLI conversion is required.",
      "Read Capture details after import. Unknown record types are reported; original logs are never modified.",
    ],
    command:
      "rewind import codex --file selected-session.jsonl --out tape.jsonl",
  },
  {
    id: "claude-code",
    name: "Claude Code",
    support: "Local transcript · beta",
    detail:
      "Imports text, exposed thinking, tool use, and text results. Internal transcript formats can change; attachments and subagent files are omitted.",
    steps: [
      "Locate one JSONL transcript in ~/.claude/projects/<project>/ (Windows: %USERPROFILE%\\.claude\\projects). CLAUDE_CONFIG_DIR may change the location.",
      "Choose the session’s .jsonl file. The plain-text /export output is not supported by this structured importer.",
      "Review omitted record types and capture limitations. Completion and exact context may be unknown.",
    ],
    link: "https://code.claude.com/docs/en/sessions#export-and-locate-session-data",
  },
  {
    id: "n8n",
    name: "n8n",
    support: "Execution JSON · beta",
    detail:
      "Imports recorded node attempts, JSON outputs, errors, and available timing. A downloaded workflow definition alone contains no run evidence.",
    steps: [
      "In your own n8n environment, retrieve one saved execution using GET /api/v1/executions/<id>?includeData=true, or your existing authenticated execution export.",
      "Save the response as JSON. It must contain data.resultData.runData. Keep the n8n API key in your own environment; do not paste it here.",
      "Choose that JSON file below. Binary data, workflow definitions, and credentials are omitted. Node inputs remain unknown unless explicitly recorded.",
    ],
    link: "https://docs.n8n.io/api/api-reference/",
  },
  {
    id: "factory",
    name: "Factory",
    support: "Result summary only",
    detail:
      "Opens the documented Droid JSON result. It does not contain the full tool timeline, so this is a summary viewer rather than a complete replay.",
    steps: [
      "For a future Droid CLI run, save its --output-format json output to a file. This command starts a new agent run and may incur provider charges; Rewind does not run it.",
      "Choose the result JSON using this Factory card. It must contain type: result and the result text.",
      "Full Factory session / JSON-RPC capture needs a separate adapter and is not implemented.",
    ],
    command:
      'droid exec --output-format json "summarize this repository" > factory-result.json',
    link: "https://docs.factory.com/droid-exec/overview",
  },
  {
    id: "custom",
    name: "Custom / Python",
    support: "Portable Rewind v1",
    detail:
      "Use the Python recorder, or write an adapter that converts your tool’s logs into the versioned tape format. No credentials or executable connector code belong in a tape.",
    steps: [
      "Download the template. Replace its sample run and events with your own sanitized captured data; generate unique IDs and increasing sequence numbers.",
      "Write tool.start before an operation and tool.end afterward with the same span_id. Use null for unknown timing; do not invent context or memory.",
      "Validate with rewind validate your-tape.jsonl, then open it here. The Python recorder can capture actual calls directly; pack its notes sidecar before importing.",
    ],
    command:
      'from agent_rewind import Recorder\n\nwith Recorder("my-agent", output="runs", capture="redacted") as tape:\n    result = tape.tool_call("my_tool", my_tool, arguments={"query": "example"})',
  },
];

export default function Settings({
  preferences,
  onPreferences,
  onOpen,
  onLibrary,
  status,
  onDemo,
  onTutorial,
}: {
  preferences: Preferences;
  onPreferences: (p: Preferences) => void;
  onOpen: (source: ImportSource) => void;
  onLibrary: () => void;
  status: {
    authenticated?: boolean;
    live_available?: boolean;
    blockers?: string[];
    analysis_available?: boolean;
    analysis_blockers?: string[];
  } | null;
  onDemo: () => void;
  onTutorial: () => void;
}) {
  const [active, setActive] = useState<ImportSource>("codex");
  const source = sources.find((s) => s.id === active)!;
  return (
    <div className="settings-panel">
      <button onClick={onTutorial}>First-use tutorial</button>
      <p className="settings-intro">
        Bring a recording from your agent. Files are read and stored in this
        browser; no account connection is needed.
      </p>
      <h3>Recording sources</h3>
      <div className="source-picker" aria-label="Recording sources">
        {sources.map((s) => (
          <button
            key={s.id}
            aria-pressed={s.id === active}
            className={s.id === active ? "selected-button" : ""}
            onClick={() => setActive(s.id)}
          >
            {s.name}
            <small>{s.support}</small>
          </button>
        ))}
      </div>
      <section
        className="source-guide"
        aria-label={`${source.name} import instructions`}
      >
        <h3>
          {source.name}
          <span className="source-support">{source.support}</span>
        </h3>
        <p>{source.detail}</p>
        <div className="modal-actions">
          <button className="primary" onClick={() => onOpen(active)}>
            <FolderOpen />
            Open {source.name}{" "}
            {active === "factory"
              ? "result"
              : active === "custom"
                ? "tape"
                : "log"}
          </button>
          {active === "custom" && (
            <button onClick={() => download(customTemplate())}>
              <DownloadSimple />
              Download tape template
            </button>
          )}
          {source.link && (
            <a href={source.link} target="_blank" rel="noreferrer">
              Source documentation ↗
            </a>
          )}
        </div>
        <ol>
          {source.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {source.command && (
          <details>
            <summary>
              {active === "codex"
                ? "Optional local CLI conversion"
                : active === "custom"
                  ? "Python recorder example"
                  : "Example command (runs in your terminal)"}
            </summary>
            <pre>{source.command}</pre>
          </details>
        )}
      </section>
      <section className="settings-section">
        <h3>Playback & reports</h3>
        <div className="settings-fields">
          <label>
            Default playback speed
            <select
              value={preferences.speed}
              onChange={(e) =>
                onPreferences({ ...preferences, speed: Number(e.target.value) })
              }
            >
              {[0.5, 1, 2, 4].map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
          <label>
            Preceding events in debugging reports
            <select
              value={preferences.reportPreceding}
              onChange={(e) =>
                onPreferences({
                  ...preferences,
                  reportPreceding: Number(e.target.value),
                })
              }
            >
              {[0, 2, 4, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} events
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="muted">
          Preferences are saved on this device. Evidence reports are generated
          locally. Optional Nemotron analysis sends only your reviewed excerpt
          to Nebius.
        </p>
      </section>
      <section className="settings-section">
        <h3>Privacy & storage</h3>
        <p>
          100 MB / 10,000 events per local import. Shared clips are limited to 2
          MB. Export important tapes before clearing browser data. Redaction
          reduces risk but cannot identify every private detail.
        </p>
        <button onClick={onLibrary}>Manage local recordings</button>
      </section>
      <section className="settings-section">
        <h3>Hosted demo access</h3>
        <p>
          {status?.analysis_available
            ? "Nemotron evidence analysis is configured."
            : "Nemotron evidence analysis is unavailable."}
          {status?.analysis_blockers?.length
            ? " " + status.analysis_blockers.join("; ") + "."
            : ""}{" "}
          Open Debug report on a selected event to review evidence and request
          analysis.
        </p>
        <p>
          {status?.authenticated
            ? "Invitation session is active."
            : "No invitation session is active."}{" "}
          {status?.live_available
            ? "Live execution is configured."
            : "Live execution is unavailable."}
        </p>
        {status?.blockers?.length ? (
          <ul>
            {status.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : null}
        <p className="muted">
          Inference and sandbox secrets are configured on the server. Personal
          agent imports need no API key.
        </p>
        <button onClick={onDemo}>Manage invitation access</button>
      </section>
    </div>
  );
}
