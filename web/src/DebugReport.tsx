import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, DownloadSimple } from "@phosphor-icons/react";
import { debuggingReport, downloadText, reportEvents } from "./report";
import AnalysisPanel from "./AnalysisPanel";
import { clock, type Event, type Tape } from "./engine";

export default function DebugReport({
  tape,
  event,
  preceding,
  onSelect,
  onAccessChange,
}: {
  tape: Tape;
  event: Event;
  preceding: number;
  onSelect: (id: string) => void;
  onAccessChange: () => void;
}) {
  const analysisSection = useRef<HTMLDivElement>(null);
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
  function showAnalysis() {
    analysisSection.current?.scrollIntoView({ block: "start" });
    analysisSection.current?.focus({ preventScroll: true });
  }
  return (
    <div className="report-panel">
      <p>
        Review this event and up to {preceding} earlier events, then continue to
        analysis. You can also copy or download the report for free. Nothing is
        sent automatically.
      </p>
      <div className="callout">
        <strong>
          Evidence ends at {event.name} ·{" "}
          {event.elapsed_ms === null
            ? "time unknown"
            : clock(event.elapsed_ms, true)}
        </strong>
        <p>
          Later events are excluded. To include a failure, select it first. Need
          more earlier events? Adjust the report settings in Settings & sources.
        </p>
        <button onClick={showAnalysis}>View analysis options</button>
      </div>
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
      <label>
        Exact report preview
        <textarea
          aria-label="Debugging report preview"
          className="report-preview"
          readOnly
          value={report}
          rows={15}
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
      <div className="modal-actions">
        <button className="primary" disabled={!reviewed} onClick={showAnalysis}>
          Continue to analysis
        </button>
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
      <div ref={analysisSection} tabIndex={-1} aria-label="Analysis options">
        <AnalysisPanel
          report={report}
          eventIds={reportEvents(tape, event, preceding)
            .map((e) => e.id)
            .filter((id) => report.includes(JSON.stringify(id)))}
          reviewed={reviewed}
          onSelect={onSelect}
          onAccessChange={onAccessChange}
        />
      </div>
    </div>
  );
}
