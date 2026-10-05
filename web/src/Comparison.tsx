import { useMemo, useState } from "react";
import { changedFields, previewValue } from "./changedFields";
import { CaretRight, GitBranch } from "@phosphor-icons/react";
import {
  clock,
  duration,
  evidence,
  contextForEvent,
  visibleEvents,
  type Tape,
  type Difference,
} from "./engine";

function recordedEvidence(
  t: Tape,
  e: Difference["a"],
): Record<string, unknown> | undefined {
  if (!e) return undefined;
  const context = contextForEvent(t, e);
  return {
    name: e.name,
    status: e.status,
    ...(e.kind === "context" ? { context: e.data } : evidence(t, e)),
    ...(context ? { model_context: context.data } : {}),
  };
}

function PairedEvidence({
  a,
  b,
  difference,
}: {
  a: Tape;
  b: Tape;
  difference: Difference;
}) {
  const [showFull, setShowFull] = useState(false);
  const records = useMemo(
    () => [
      recordedEvidence(a, difference.a),
      recordedEvidence(b, difference.b),
    ],
    [a, b, difference],
  );
  const summary = useMemo(() => {
    const focused = records.map((record) => {
      if (!record) return undefined;
      const { name, status, input, output, error, context, model_context } =
        record;
      return difference.type === "behavior"
        ? { name, status, output, error }
        : { input, context, model_context };
    });
    return changedFields(focused[0], focused[1]);
  }, [records, difference.type]);
  return (
    <div className="paired-evidence">
      <h3>{difference.message}</h3>
      <div className="changed-fields">
        {summary.fields.map((field) => (
          <section key={field.path} className="changed-field">
            <h4>{field.path}</h4>
            <div>
              {[field.a, field.b].map((value, i) => (
                <div key={i}>
                  <b>Run {i ? "B" : "A"}</b>
                  <pre>{previewValue(value)}</pre>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      {summary.limited && (
        <p>Showing a limited preview. Expand full evidence for all fields.</p>
      )}
      <div className="paired-times">
        {[difference.a, difference.b].map((event, i) => (
          <section key={i}>
            <b>Run {i ? "B" : "A"}</b>
            <p>
              {event ? (
                <>
                  {event.elapsed_ms === null
                    ? "Time unknown"
                    : clock(event.elapsed_ms, true)}
                  <br />
                  {event.timestamp ?? "Timestamp not captured"}
                </>
              ) : (
                "No paired event"
              )}
            </p>
          </section>
        ))}
      </div>
      <details onToggle={(e) => setShowFull(e.currentTarget.open)}>
        <summary>Full recorded evidence</summary>
        {showFull && (
          <div className="full-evidence">
            {records.map((value, i) => (
              <section key={i}>
                <b>Run {i ? "B" : "A"}</b>
                <pre>
                  {JSON.stringify(
                    value
                      ? {
                          ...value,
                          elapsed_ms: (i ? difference.b : difference.a)
                            ?.elapsed_ms,
                          timestamp: (i ? difference.b : difference.a)
                            ?.timestamp,
                        }
                      : { capture: "No paired event" },
                    null,
                    2,
                  )}
                </pre>
              </section>
            ))}
          </div>
        )}
      </details>
    </div>
  );
}

function Track({
  tape,
  time,
  onSeek,
}: {
  tape: Tape;
  time: number;
  onSeek: (time: number) => void;
}) {
  const total = duration(tape);
  return (
    <div
      className="mini-tape"
      role="slider"
      aria-label={"Comparison playhead " + tape.run.id}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(time, total)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(total, time + 1000));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, time - 1000));
      }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(((e.clientX - r.left) / r.width) * total);
      }}
    >
      {visibleEvents(tape)
        .filter((e) => e.elapsed_ms !== null)
        .map((e) => (
          <span
            key={e.id}
            className={"mini-event lane-" + e.lane}
            style={{ left: `${((e.elapsed_ms ?? 0) / total) * 100}%` }}
          />
        ))}
      <i style={{ left: `${Math.min(100, (time / total) * 100)}%` }} />
    </div>
  );
}
export default function Comparison({
  a,
  b,
  tapes,
  time,
  timeB,
  differences,
  error,
  onChoose,
  onSeek,
  onSeekB,
  onJump,
  initialDifference,
}: {
  a: Tape;
  b?: Tape;
  tapes: Tape[];
  time: number;
  timeB: number;
  differences: Difference[];
  error: string;
  onChoose: (id: string) => void;
  onSeek: (time: number) => void;
  onSeekB: (time: number) => void;
  onJump: (d: Difference) => void;
  initialDifference?: Difference;
}) {
  const [index, setIndex] = useState<number | null>(
    initialDifference ? differences.indexOf(initialDifference) : null,
  );
  const [expanded, setExpanded] = useState(!!initialDifference);
  const selected = index === null ? undefined : differences[index];
  const jump = (d: Difference | undefined) => {
    if (d) {
      setIndex(differences.indexOf(d));
      setExpanded(true);
      onJump(d);
    }
  };
  return (
    <section className="comparison" aria-label="Observed differences">
      {expanded && (
        <div className="comparison-main" id="comparison-evidence">
          <div className="section-bar">
            <div>
              <h2>Side-by-side playback</h2>
              <p>
                Playback shares a clock. Paired events show their recorded
                times.
              </p>
            </div>
            <select
              aria-label="Compare with run"
              value={b?.run.id ?? ""}
              onChange={(e) => onChoose(e.target.value)}
            >
              {tapes
                .filter((t) => t.run.id !== a.run.id)
                .map((t) => (
                  <option key={t.run.id} value={t.run.id}>
                    {t.run.name} ·{" "}
                    {String(t.run.configuration.variant ?? t.run.source)}
                  </option>
                ))}
            </select>
          </div>
          <div className="comparison-row">
            <b>
              Run A<small>{a.run.status}</small>
            </b>
            <Track tape={a} time={time} onSeek={onSeek} />
            <span>{clock(time, true)}</span>
          </div>
          {b && (
            <div className="comparison-row">
              <b>
                Run B<small>{b.run.status}</small>
              </b>
              <Track tape={b} time={timeB} onSeek={onSeekB} />
              <span>{clock(timeB, true)}</span>
            </div>
          )}
          {selected && b && (
            <PairedEvidence key={index} a={a} b={b} difference={selected} />
          )}
        </div>
      )}
      <div className="divergence">
        <div className="eyebrow">
          <GitBranch />
          <h2>Observed Differences</h2>
        </div>
        {error ? (
          <p role="alert">{error}</p>
        ) : (
          <>
            <h3>
              {differences.length
                ? `${differences.length} ${differences.length === 1 ? "difference" : "differences"}`
                : "No observed differences"}
            </h3>
            <p>
              Compared with{" "}
              <b>
                {b
                  ? `${b.run.name} · ${String(b.run.configuration.variant ?? b.run.source)}`
                  : "no second run selected"}
              </b>
              . Differences alone do not prove the cause.
            </p>
            <button
              onClick={() =>
                jump(differences.find((d) => d.type === "behavior"))
              }
              disabled={!differences.some((d) => d.type === "behavior")}
            >
              First behavior difference <CaretRight />
            </button>
            <button
              className="text-button"
              onClick={() => jump(differences.find((d) => d.type === "input"))}
              disabled={!differences.some((d) => d.type === "input")}
            >
              First input difference <CaretRight />
            </button>
            <select
              aria-label="Inspect a difference"
              value={index ?? ""}
              onChange={(e) => jump(differences[Number(e.target.value)])}
            >
              <option value="" disabled>
                Choose a difference…
              </option>
              {differences.map((d, i) => (
                <option key={i} value={i}>
                  {d.message}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          className="comparison-toggle"
          aria-expanded={expanded}
          aria-controls="comparison-evidence"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Hide comparison" : "Show comparison"}
        </button>
      </div>
    </section>
  );
}
