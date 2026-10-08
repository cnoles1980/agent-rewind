import { useEffect, useState } from "react";
import AnalysisResultView from "./AnalysisResultView";
import { listAnalyses, removeAnalysis, type SavedAnalysis } from "./storage";

export default function SavedReports({
  runId,
  onSelect,
}: {
  runId: string;
  onSelect: (id: string) => boolean;
}) {
  const [reports, setReports] = useState<SavedAnalysis[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    let active = true;
    void listAnalyses(runId)
      .then((rows) => {
        if (active) {
          setReports(rows);
          setSelected(rows[0]?.id ?? "");
        }
      })
      .catch(() => {
        if (active)
          setMessage(
            "Could not load saved reports. Browser storage may be unavailable.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [runId]);
  const report = reports.find((row) => row.id === selected);
  return (
    <section aria-label="Saved reports">
      <p>
        Saved in this browser with this recording. Each report keeps the exact
        excerpt analyzed. Download reports to keep a backup; clearing browser
        data removes them.
      </p>
      {loading && <p role="status">Loading saved reports…</p>}
      {message && <p role="alert">{message}</p>}
      {!loading && !message && !reports.length && (
        <p>
          No saved reports yet. Completed Nemotron analyses will appear here.
        </p>
      )}
      {reports.length > 0 && (
        <label>
          Saved analysis
          <select
            value={selected}
            disabled={deleting}
            onChange={(e) => {
              setSelected(e.target.value);
              setConfirmDelete(false);
              setMessage("");
            }}
          >
            {reports.map((row, index) => (
              <option key={row.id} value={row.id}>
                {reports.length - index}. {row.anchorName} ·{" "}
                {new Date(row.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
        </label>
      )}
      {report && (
        <>
          <p className="callout">
            Historical analysis of {report.anchorName}. It does not update when
            the recording changes.
          </p>
          <AnalysisResultView
            key={report.id}
            result={report.result}
            report={report.report}
            onSelect={(id) => {
              if (!onSelect(id))
                setMessage(
                  "This event is no longer in the open recording. The saved report retains its original evidence.",
                );
            }}
          />
          {confirmDelete ? (
            <div className="modal-actions">
              <button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await removeAnalysis(report.id);
                    const remaining = reports.filter(
                      (row) => row.id !== report.id,
                    );
                    setReports(remaining);
                    setSelected(remaining[0]?.id ?? "");
                    setConfirmDelete(false);
                  } catch {
                    setMessage("Could not delete the report. Try again.");
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                Delete permanently
              </button>
              <button
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Keep report
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}>
              Delete saved report
            </button>
          )}
        </>
      )}
    </section>
  );
}
