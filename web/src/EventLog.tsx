import { memo, useMemo, useState } from "react";
import {
  MagnifyingGlass,
  Code,
  Warning,
  Circle,
  CaretRight,
  X,
} from "@phosphor-icons/react";
import { clock, type Event } from "./engine";
export default memo(function EventLog({
  events,
  selected,
  query,
  onQuery,
  onSelect,
}: {
  events: Event[];
  selected: string;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (e: Event) => void;
}) {
  const [page, setPage] = useState(0);
  const filtered = useMemo(
    () =>
      events.filter((e) =>
        (e.name + " " + JSON.stringify(e.data))
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [events, query],
  );
  const size = 25,
    current = Math.min(
      page,
      Math.max(0, Math.ceil(filtered.length / size) - 1),
    );
  return (
    <div className="event-section">
      <div className="section-bar">
        <h2>
          Event log <span>{filtered.length}</span>
        </h2>
        <label className="search">
          <MagnifyingGlass />
          <input
            placeholder="Search in this run…"
            aria-label="Search this run"
            value={query}
            onChange={(e) => {
              setPage(0);
              onQuery(e.target.value);
            }}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => onQuery("")}>
              <X />
            </button>
          )}
        </label>
      </div>
      <div className="event-list" role="list">
        {filtered.slice(current * size, (current + 1) * size).map((e) => (
          <div role="listitem" key={e.id}>
            <button
              className={"event-row " + (e.id === selected ? "active" : "")}
              onClick={() => onSelect(e)}
            >
              <span className={"event-kind lane-" + e.lane}>
                {e.lane === "tools" ? (
                  <Code />
                ) : e.lane === "errors" ? (
                  <Warning />
                ) : (
                  <Circle />
                )}
              </span>
              <span className="event-name">
                {e.name}
                <small>
                  {e.kind.endsWith("start")
                    ? "Unfinished operation"
                    : e.kind === "tool.end"
                      ? "Tool result"
                      : e.kind === "context"
                        ? "Recorded context"
                        : "Captured activity"}
                </small>
              </span>
              <span className="event-time">
                {e.elapsed_ms === null ? "Unknown" : clock(e.elapsed_ms, true)}
              </span>
              <CaretRight />
            </button>
          </div>
        ))}
      </div>
      {filtered.length > size && (
        <div className="log-pagination">
          <button disabled={!current} onClick={() => setPage(current - 1)}>
            Previous 25
          </button>
          <span>
            {current * size + 1}–
            {Math.min((current + 1) * size, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <button
            disabled={(current + 1) * size >= filtered.length}
            onClick={() => setPage(current + 1)}
          >
            Next 25
          </button>
        </div>
      )}
    </div>
  );
});
