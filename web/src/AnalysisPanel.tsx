import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import AnalysisResultView, { type Result } from "./AnalysisResultView";
import { saveAnalysis } from "./storage";
import type { Tape, Event } from "./engine";
import { prepareEvidence } from "./analysisEvidence";

type Status = {
  authenticated: boolean;
  analysis_available: boolean;
  analysis_blockers: string[];
  model: string;
  study?: { remaining_calls: number; label: string } | null;
};

export default function AnalysisPanel({
  report,
  tape,
  event,
  eventIds,
  reviewed,
  onSelect,
  onSubmitted,
}: {
  report: string;
  tape: Tape;
  event: Event;
  eventIds: string[];
  reviewed: boolean;
  onSelect: (id: string) => void;
  onSubmitted: () => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  const bytes = new TextEncoder().encode(report).length;
  const oversized = bytes > 48000;
  const evidenceProblem = useMemo(() => {
    if (oversized || !eventIds.length) return "";
    try {
      prepareEvidence(report, eventIds);
      return "";
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "Select captured evidence before analysis.";
    }
  }, [report, eventIds, oversized]);
  useEffect(() => {
    const controller = new AbortController();
    api<Status>("/status", { signal: controller.signal })
      .then(setStatus)
      .catch((e) => {
        if (!controller.signal.aborted) setMessage(e.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    setResult(null);
    setMessage("");
    setBusy(false);
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [report]);

  async function run() {
    if (
      !reviewed ||
      !status?.authenticated ||
      !status?.analysis_available ||
      status?.study?.remaining_calls === 0 ||
      oversized ||
      evidenceProblem ||
      !eventIds.length ||
      request.current
    )
      return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    onSubmitted();
    setMessage("");
    setResult(null);
    try {
      const response = await api<Result>("/analyses", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          evidence: report,
          event_ids: eventIds,
          reviewed: true,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      if (!controller.signal.aborted) {
        setResult(response);
        try {
          await saveAnalysis(tape, {
            id: crypto.randomUUID(),
            runId: tape.run.id,
            createdAt: new Date().toISOString(),
            anchorId: event.id,
            anchorName: event.name,
            report,
            result: response,
          });
          if (!controller.signal.aborted)
            setMessage(
              "Saved with this recording. Reopen it from Saved reports.",
            );
        } catch {
          if (!controller.signal.aborted)
            setMessage(
              "Could not save this report in your browser. Download the analysis before closing; browser storage may be full or unavailable.",
            );
        }
      }
    } catch (e) {
      if (!controller.signal.aborted) {
        setMessage(e instanceof Error ? e.message : "Analysis failed.");
      }
    } finally {
      if (!controller.signal.aborted)
        void api<Status>("/status")
          .then(setStatus)
          .catch(() => {});
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section className="analysis-panel" aria-label="Nemotron evidence analysis">
      <p id="analysis-send-notice">
        Send this excerpt to Nebius for one paid analysis. No tools run or code
        changes.
      </p>
      <details>
        <summary>Privacy and usage</summary>
        <p>
          The server stores request status, cost reservations and token counts,
          not the report or response. Nebius data policies apply.
        </p>
        <p className="muted">
          {status?.model ?? "NVIDIA Nemotron"} · {Math.ceil(bytes / 1000)} / 48
          KB
        </p>
      </details>
      {status?.authenticated === false && (
        <p className="callout">
          AI access is locked. Sign in through Settings &amp; sources → Manage
          invitation access, then reopen this report. Free export still works.
        </p>
      )}
      {status?.study && (
        <p role="status">
          {status.study.remaining_calls} analysis attempts remain for the
          testing group. Replay and feedback are free.
        </p>
      )}
      {status && !status.analysis_available && (
        <p className="callout">
          Analysis is not configured:{" "}
          {status.analysis_blockers?.join("; ") ||
            "Update the server to enable analysis"}
          . Self-hosters configure their Nebius key on the server. Local report
          export remains available.
        </p>
      )}
      {oversized && (
        <p role="alert">
          This excerpt exceeds 48 KB. Reduce preceding events in Settings or
          omit the linked context. Nothing has been sent.
        </p>
      )}
      {!eventIds.length && (
        <p role="alert">
          All event references were redacted. Keep at least one non-sensitive
          event reference to request cited analysis.
        </p>
      )}
      {evidenceProblem && <p role="alert">{evidenceProblem}</p>}
      <button
        className="primary"
        disabled={
          !reviewed ||
          busy ||
          oversized ||
          !!evidenceProblem ||
          !status?.authenticated ||
          !status?.analysis_available ||
          status?.study?.remaining_calls === 0 ||
          !eventIds.length
        }
        aria-describedby="analysis-send-notice"
        onClick={run}
      >
        {busy ? "Analyzing evidence…" : "Send to Nemotron"}
      </button>
      {busy && (
        <p role="status">
          Waiting for Nemotron (up to 60 seconds). Editing or closing this panel
          discards the response; the submitted call may still be billed.
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {result && (
        <AnalysisResultView
          result={result}
          report={report}
          onSelect={onSelect}
        />
      )}
    </section>
  );
}
