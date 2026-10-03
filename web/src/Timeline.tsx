import { memo } from "react";
import {
  Brain,
  Wrench,
  Stack,
  Database,
  Warning,
  NotePencil,
} from "@phosphor-icons/react";
import {
  clock,
  duration,
  startOf,
  visibleEvents,
  type Tape,
  type Event,
} from "./engine";
const lanes = [
  { key: "model", label: "Model", Icon: Brain },
  { key: "tools", label: "Tools", Icon: Wrench },
  { key: "context", label: "Context", Icon: Stack },
  { key: "memory", label: "Memory", Icon: Database },
  { key: "errors", label: "Errors", Icon: Warning },
  { key: "notes", label: "Notes", Icon: NotePencil },
];
const Tracks = memo(function Tracks({
  tape,
  onSelect,
  onSeek,
  zoom,
}: {
  tape: Tape;
  onSelect: (e: Event) => void;
  onSeek: (t: number) => void;
  zoom: number;
}) {
  const total = duration(tape),
    width = 820 * zoom,
    label = 126,
    chart = width - label - 12,
    events = visibleEvents(tape),
    x = (ms: number) => label + (ms / total) * chart;
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => {
        const at = (total * i) / 6;
        return (
          <g key={i}>
            <line x1={x(at)} x2={x(at)} y1={39} y2={340} stroke="#e3eaf0" />
            <text x={x(at)} y={23} textAnchor="middle" className="ruler">
              {clock(at)}
            </text>
          </g>
        );
      })}
      {lanes.map(({ key, label: caption, Icon }, i) => {
        const y = 40 + i * 49,
          list = events.filter((e) => e.lane === key);
        return (
          <g key={key} className={"lane lane-" + key}>
            <rect
              x={0}
              y={y}
              width={width}
              height={40}
              rx={5}
              className="lane-fill"
            />
            <foreignObject x={11} y={y + 10} width={23} height={20}>
              <Icon size={20} />
            </foreignObject>
            <text x={43} y={y + 17} className="lane-label">
              {caption}
            </text>
            <text x={43} y={y + 31} className="lane-count">
              {key === "notes"
                ? `${tape.notes.length} notes`
                : list.length
                  ? `${list.length} events`
                  : "Not captured"}
            </text>
            {list.map((e) => {
              const end = e.elapsed_ms;
              if (end === null) return null;
              const start = startOf(tape, e);
              const from = start?.elapsed_ms ?? end;
              const span = Math.max(8, ((end - from) / total) * chart);
              return (
                <g
                  key={e.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${caption}: ${e.name} at ${clock(end)}`}
                  onClick={() => onSelect(e)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      onSelect(e);
                    }
                  }}
                  className="event-target"
                >
                  <title>
                    {e.name} · {clock(end, true)}
                  </title>
                  <rect
                    x={x(from)}
                    y={y + 10}
                    width={span}
                    height={20}
                    rx={3}
                    className="event-block"
                  />
                </g>
              );
            })}
            {key === "notes" &&
              tape.notes.map((n) => (
                <g
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  aria-label={"Note: " + n.text}
                  onClick={() => onSeek(n.elapsed_ms)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter") onSeek(n.elapsed_ms);
                  }}
                >
                  <rect
                    x={x(n.elapsed_ms) - 3}
                    y={y + 11}
                    width={7}
                    height={20}
                    rx={2}
                    fill="#8796a7"
                  />
                  <title>{n.text}</title>
                </g>
              ))}
          </g>
        );
      })}
    </>
  );
});
export default function Timeline({
  tape,
  time,
  selected,
  onSelect,
  onSeek,
  zoom,
}: {
  tape: Tape;
  time: number;
  selected: string;
  onSelect: (e: Event) => void;
  onSeek: (t: number) => void;
  zoom: number;
}) {
  const total = duration(tape),
    width = 820 * zoom,
    chart = width - 138,
    x = (ms: number) => 126 + (ms / total) * chart;
  const e = tape.events.find((e) => e.id === selected),
    start = e ? startOf(tape, e) : undefined;
  const from = start?.elapsed_ms ?? e?.elapsed_ms ?? 0,
    y = 40 + lanes.findIndex((l) => l.key === e?.lane) * 49;
  return (
    <div className="timeline-scroll">
      <svg
        className="timeline"
        width={width}
        height={350}
        viewBox={`0 0 ${width} 350`}
        role="img"
        aria-label="Recorded events on a shared timeline"
      >
        <Tracks tape={tape} zoom={zoom} onSelect={onSelect} onSeek={onSeek} />
        {e && e.elapsed_ms !== null && (
          <rect
            x={x(from) - 3}
            y={y + 7}
            width={Math.max(8, ((e.elapsed_ms - from) / total) * chart) + 6}
            height={26}
            rx={5}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className={"lane-" + e.lane}
            pointerEvents="none"
          />
        )}
        <line
          x1={x(time)}
          x2={x(time)}
          y1={34}
          y2={342}
          stroke="#038ccd"
          strokeWidth={1.5}
        />
        <circle cx={x(time)} cy={36} r={4} fill="#038ccd" />
      </svg>
    </div>
  );
}
