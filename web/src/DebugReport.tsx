import { useEffect, useMemo, useState } from "react";
import { Copy, DownloadSimple } from "@phosphor-icons/react";
import { debuggingReport, downloadText, reportEvents } from "./report";
import AnalysisPanel from "./AnalysisPanel";
import { clock, type Event, type Tape } from "./engine";
export default function DebugReport({
  tape,
  event,
  preceding,
  onSelect,
}: {
  tape: Tape;
  event: Event;
  preceding: number;
  onSelect: (id: string) => void;
}) {
  const [observation, setObservation] = useState(""),
    [phrases, setPhrases] = useState("");
  const [includeContext, setIncludeContext] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [message, setMessage] = useState("");
  const report = useMemo(
    () =>
      debuggingReport(tape, event, {
        observation,
        preceding,
        phrases: phrases.split("\n"),
        includeContext,
      }),
    [tape, event, observation, preceding, phrases, includeContext],
  );
  // Live recordings can update while a report is open. Approval never carries
  // over to changed evidence, including changes initiated outside this form.
  useEffect(() => {
    setReviewed(false);
    setMessage("");
  }, [report]);
  function changed() {
    setReviewed(false);
    setMessage("");
  }
  return (
    <div className="report-panel">
      <p>
        Explain the problem, review the excerpt, then send it for AI analysis.
      </p>
      <p className="callout">
        <strong>
          Evidence ends at {event.name} ·{" "}
          {event.elapsed_ms === null
            ? "time unknown"
            : clock(event.elapsed_ms, true)}
        </strong>
        <br />
        Includes up to {preceding} earlier events. Select the failure to include
        its result.
      </p>
      <label>
        What happened, and what did you expect?
        <textarea
          rows={3}
          maxLength={4000}
          value={observation}
          onChange={(e) => {
            changed();
            setObservation(e.target.value);
          }}
          placeholder="At exactly $50, shipping should be free, but the boundary test failed."
        />
      </label>
      <details>
        <summary>Context and redaction (optional)</summary>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={includeContext}
            onChange={(e) => {
              changed();
              setIncludeContext(e.target.checked);
            }}
          />
          Include this event’s recorded context
        </label>
        {includeContext && (
          <p className="callout">
            Context may include earlier messages and private data. Review it
            before sharing.
          </p>
        )}
        <label>
          Text to hide (one phrase per line)
          <textarea
            rows={2}
            value={phrases}
            maxLength={4000}
            onChange={(e) => {
              changed();
              setPhrases(e.target.value);
            }}
          />
        </label>
      </details>
      <label>
        Excerpt to review
        <textarea
          aria-label="Debugging report preview"
          className="report-preview"
          readOnly
          value={report}
          rows={8}
        />
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />
        I reviewed this report for private data.
      </label>
      <div aria-label="Analysis options">
        <AnalysisPanel
          report={report}
          tape={tape}
          event={event}
          eventIds={reportEvents(tape, event, preceding)
            .map((e) => e.id)
            .filter((id) => report.includes(JSON.stringify(id)))}
          reviewed={reviewed}
          onSelect={onSelect}
          onSubmitted={() => setReviewed(false)}
        />
      </div>
      <div className="modal-actions">
        <button
          disabled={!reviewed}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(report);
              setMessage(
                "Copied. Paste this into your agent’s chat and review its proposed fix.",
              );
            } catch {
              setMessage(
                "Clipboard access was denied. Download Markdown or select the preview text instead.",
              );
            }
          }}
        >
          <Copy />
          Copy debugging report
        </button>
        <button
          disabled={!reviewed}
          onClick={() =>
            downloadText(report, "agent-rewind-debugging-report.md")
          }
        >
          <DownloadSimple />
          Download Markdown
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
