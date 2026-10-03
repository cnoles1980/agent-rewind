import validator from "./tape.validator.js";
import type {
  Tape as GeneratedTape,
  Run as GeneratedRun,
  Event as GeneratedEvent,
  Note as GeneratedNote,
} from "./tape.generated";

export type Run = Required<GeneratedRun>;
export type Event = Required<GeneratedEvent>;
export type Note = Required<GeneratedNote>;
export type Tape = Omit<GeneratedTape, "run" | "events" | "notes"> & {
  run: Run;
  events: Event[];
  notes: Note[];
};
export const MAX_BYTES = 100 * 1024 * 1024;
export function validateTape(value: unknown): Tape {
  if (!validator(value))
    throw new Error("Invalid tape: " + validator.errors?.[0]?.message);
  const t = value as Tape;
  if (!t.run.id || t.run.schema_version !== 1)
    throw new Error("A v1 run with an ID is required.");
  const ids = new Set<string>();
  let seq = -1;
  for (const e of t.events) {
    if (!e.id || ids.has(e.id) || e.seq <= seq || e.run_id !== t.run.id)
      throw new Error("Duplicate, unordered, or mismatched events.");
    ids.add(e.id);
    seq = e.seq;
    e.data ??= {};
    e.elapsed_ms ??= null;
    e.duration_ms ??= null;
  }
  if (t.notes.some((n) => n.run_id !== t.run.id))
    throw new Error("Annotation belongs to another run.");
  return t;
}
const sensitive =
  /^(authorization|proxy.authorization|cookie|set.cookie|.*api.?key|.*password|.*secret|access.?token|refresh.?token|token|encrypted_content|environment|env|creator_user_id|creator_account_id)$/i;
export function redact(value: unknown, phrases: string[] = [], depth = 0): any {
  if (depth > 35) return "[DEPTH LIMIT]";
  if (Array.isArray(value))
    return value.map((v) => redact(v, phrases, depth + 1));
  if (value && typeof value === "object") {
    const entries: [string, unknown][] = [];
    const used = new Set<string>();
    for (const [key, item] of Object.entries(value)) {
      const label = redactText(key, phrases);
      let unique = label;
      for (let suffix = 2; used.has(unique); suffix++)
        unique = `${label} (${suffix})`;
      used.add(unique);
      entries.push([
        unique,
        sensitive.test(key) ? "[REDACTED]" : redact(item, phrases, depth + 1),
      ]);
    }
    return Object.fromEntries(entries);
  }
  if (typeof value !== "string") return value;
  if (/^[\s]*[\[{]/.test(value)) {
    try {
      return JSON.stringify(redact(JSON.parse(value), phrases, depth + 1));
    } catch {
      /* plain text */
    }
  }
  return redactText(value, phrases);
}
function redactText(value: string, phrases: string[]) {
  let s = value
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "[REDACTED]")
    .replace(/\b(?:sk-|ghp_|github_pat_|hf_)[A-Za-z0-9_-]{12,}/g, "[REDACTED]")
    .replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      "[REDACTED]",
    )
    .replace(
      /(?:api[_-]?key|password|secret|access_token|authorization)\s*[:=]\s*[^\s,;"']+/gi,
      "[REDACTED]",
    )
    .replace(
      /[A-Za-z]:[\\/](?:Users|home)[\\/][^\s"'<>]+|\/(?:Users|home)\/[^\s"'<>]+/g,
      "[LOCAL PATH]",
    );
  for (const phrase of phrases.filter(Boolean))
    s = s.split(phrase).join("[REDACTED]");
  return s;
}
export function parseTape(text: string): Tape {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    throw new Error(
      "Local tape exceeds 100 MB. Export a smaller session or a reviewed clip.",
    );
  try {
    const json = JSON.parse(text);
    if (json.run) return validateTape(redact(json));
  } catch {
    /* JSONL next */
  }
  const lines = text.trimEnd().split(/\r?\n/);
  const records: any[] = [];
  let partial = false;
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    try {
      records.push(JSON.parse(line));
    } catch {
      if (i === lines.length - 1 && records.length) partial = true;
      else throw new Error(`Invalid JSON at line ${i + 1}`);
    }
  });
  if (records[0]?.record !== "run")
    throw new Error(
      "Open a Rewind tape. Convert Codex sessions with the local importer first.",
    );
  if (records.slice(1).some((r) => !["event", "note"].includes(r.record)))
    throw new Error("Unsupported tape record.");
  const result = redact({
    run: records[0],
    events: records.filter((r) => r.record === "event"),
    notes: records.filter((r) => r.record === "note"),
  });
  const last = result.events.findLast((e: any) => e.kind === "run.end");
  if (last?.elapsed_ms !== null && last?.elapsed_ms !== undefined)
    result.run.duration_ms = last.elapsed_ms;
  result.run.status = partial
    ? "incomplete"
    : (last?.data.status ??
      (result.run.status === "running" ? "incomplete" : result.run.status));
  if (partial)
    (result.run.warnings ??= []).push("Recovered a truncated final record.");
  return validateTape(result);
}
export const duration = (t: Tape) =>
  Math.max(
    t.run.duration_ms ?? 0,
    ...t.events.map((e) => e.elapsed_ms ?? 0),
    1,
  );
export const clock = (ms: number, detail = false) => {
  const s = Math.max(0, ms) / 1000;
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}${
    detail
      ? "." +
        Math.floor(ms % 1000)
          .toString()
          .padStart(3, "0")
      : ""
  }`;
};
export function atTime(t: Tape, time: number) {
  let boundary: Event | undefined;
  for (const e of t.events) {
    if (
      (e.kind === "context" || (e.kind === "model.start" && e.snapshot_id)) &&
      e.elapsed_ms !== null &&
      e.elapsed_ms <= time &&
      e.elapsed_ms >= (boundary?.elapsed_ms ?? -1)
    )
      boundary = e;
  }
  // A later model call can reuse an earlier deduplicated snapshot.
  return boundary?.kind === "model.start"
    ? contextForEvent(t, boundary)
    : boundary;
}
export function visibleEvents(t: Tape) {
  const ended = new Set(
    t.events
      .filter((e) => e.kind.endsWith(".end") && e.span_id)
      .map((e) => e.span_id),
  );
  return t.events.filter(
    (e) =>
      e.kind !== "run.end" &&
      (!e.kind.endsWith(".start") || !ended.has(e.span_id)),
  );
}
export function startOf(t: Tape, e: Event) {
  return e.span_id
    ? t.events.find((x) => x.span_id === e.span_id && x.kind.endsWith(".start"))
    : undefined;
}
export function evidence(t: Tape, e: Event, time = Infinity) {
  const start = startOf(t, e);
  const finished = e.elapsed_ms === null || e.elapsed_ms <= time;
  return {
    input: start?.data.input ?? e.data.input,
    output: finished ? e.data.output : undefined,
    error: finished ? e.data.error : undefined,
  };
}
export function contextForEvent(t: Tape, e: Event) {
  const snapshot = e.snapshot_id ?? startOf(t, e)?.snapshot_id;
  return snapshot
    ? t.events.find(
        (x) =>
          x.kind === "context" &&
          x.snapshot_id === snapshot &&
          x.seq <= e.seq &&
          (x.elapsed_ms === null ||
            e.elapsed_ms === null ||
            x.elapsed_ms <= e.elapsed_ms),
      )
    : undefined;
}
export function normalize(value: unknown): unknown {
  if (typeof value === "string" && /^[\s]*[\[{]/.test(value)) {
    try {
      return normalize(JSON.parse(value));
    } catch {
      /* preserve plain text */
    }
  }
  // Only known metadata keys are volatile; business fields (including IDs) remain meaningful.
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([k]) =>
            ![
              "timestamp",
              "duration_ms",
              "request_id",
              "tool_call_id",
              "call_id",
              "span_id",
              "snapshot_id",
            ].includes(k),
        )
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [
          k,
          normalize(
            k === "tool_calls" && Array.isArray(v)
              ? v.map((call) => {
                  if (call && typeof call === "object") {
                    const { id, ...fields } = call;
                    return fields;
                  }
                  return call;
                })
              : v,
          ),
        ]),
    );
  return value;
}
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
export type Difference = {
  a?: Event;
  b?: Event;
  type: "input" | "behavior";
  message: string;
};
export function compare(a: Tape, b: Tape): Difference[] {
  const left = a.events.filter((e) => e.kind === "tool.end"),
    right = b.events.filter((e) => e.kind === "tool.end");
  if (left.length * right.length > 1_000_000)
    throw new Error("Compare up to 1,000 tool calls per recording.");
  const signature = (t: Tape, e: Event) =>
    e.name + JSON.stringify(normalize(evidence(t, e).input));
  const aa = left.map((e) => signature(a, e)),
    bb = right.map((e) => signature(b, e));
  const matrix = Array.from(
    { length: left.length + 1 },
    () => new Uint16Array(right.length + 1),
  );
  for (let i = left.length - 1; i >= 0; i--)
    for (let j = right.length - 1; j >= 0; j--)
      matrix[i][j] =
        aa[i] === bb[j]
          ? 1 + matrix[i + 1][j + 1]
          : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  const diffs: Difference[] = [];
  let i = 0,
    j = 0;
  const check = (x: Event, y: Event) => {
    const ax = evidence(a, x),
      by = evidence(b, y);
    const ac = contextForEvent(a, x),
      bc = contextForEvent(b, y);
    if (ac && bc && !equal(ac.data, bc.data))
      diffs.push({
        a: x,
        b: y,
        type: "input",
        message: `${x.name}: captured context changed`,
      });
    if (!equal(ax.input, by.input))
      diffs.push({
        a: x,
        b: y,
        type: "input",
        message: `${x.name}: arguments changed`,
      });
    if (
      !equal(ax.output, by.output) ||
      !equal(ax.error, by.error) ||
      x.status !== y.status
    )
      diffs.push({
        a: x,
        b: y,
        type: "behavior",
        message: `${x.name}: result changed`,
      });
  };
  while (i < left.length && j < right.length) {
    if (aa[i] === bb[j]) {
      check(left[i++], right[j++]);
    } else if (
      left[i].name === right[j].name &&
      matrix[i][j] === matrix[i + 1][j + 1]
    ) {
      check(left[i++], right[j++]);
    } else if (matrix[i + 1][j] >= matrix[i][j + 1])
      diffs.push({
        a: left[i++],
        type: "behavior",
        message: "Tool call absent from Run B",
      });
    else
      diffs.push({
        b: right[j++],
        type: "behavior",
        message: "Additional tool call in Run B",
      });
  }
  while (i < left.length)
    diffs.push({
      a: left[i++],
      type: "behavior",
      message: "Tool call absent from Run B",
    });
  while (j < right.length)
    diffs.push({
      b: right[j++],
      type: "behavior",
      message: "Additional tool call in Run B",
    });
  const contextsA = a.events.filter((e) => e.kind === "context"),
    contextsB = b.events.filter((e) => e.kind === "context");
  for (let n = 0; n < Math.min(contextsA.length, contextsB.length); n++)
    if (!equal(contextsA[n].data, contextsB[n].data)) {
      diffs.push({
        a: contextsA[n],
        b: contextsB[n],
        type: "input",
        message: "Captured context changed",
      });
      break;
    }
  return diffs.sort(
    (x, y) =>
      Math.min(x.a?.elapsed_ms ?? Infinity, x.b?.elapsed_ms ?? Infinity) -
      Math.min(y.a?.elapsed_ms ?? Infinity, y.b?.elapsed_ms ?? Infinity),
  );
}
export function clipTape(
  t: Tape,
  from: number,
  to: number,
  includeContext = false,
  phrases: string[] = [],
  reviewed = false,
): Tape {
  if (
    !Number.isFinite(from) ||
    !Number.isFinite(to) ||
    from < 0 ||
    to <= from ||
    to > duration(t)
  )
    throw new Error("Choose a valid clip range.");
  const id = crypto.randomUUID();
  const overlapping = new Set(
    t.events
      .filter(
        (e) =>
          e.kind.endsWith(".start") &&
          e.elapsed_ms !== null &&
          e.elapsed_ms < to &&
          (t.events.find(
            (x) => x.span_id === e.span_id && x.kind.endsWith(".end"),
          )?.elapsed_ms ?? Infinity) > from,
      )
      .map((e) => e.span_id),
  );
  let events = t.events.filter(
    (e) =>
      e.kind !== "run.end" &&
      e.elapsed_ms !== null &&
      ((e.elapsed_ms >= from && e.elapsed_ms <= to) ||
        (e.kind.endsWith(".start") && overlapping.has(e.span_id))),
  );
  if (!includeContext) events = events.filter((e) => e.kind !== "context");
  else {
    const preceding = atTime(t, from);
    const support = events
      .map((e) => contextForEvent(t, e))
      .filter((e): e is Event => !!e);
    if (preceding) support.push(preceding);
    events = [...new Set([...support, ...events])].sort(
      (a, b) => a.seq - b.seq,
    );
  }
  const clipped = events.map((e, seq) => {
    const result = structuredClone(e);
    result.run_id = id;
    result.seq = seq;
    result.partial =
      e.partial ||
      e.elapsed_ms === null ||
      (e.elapsed_ms ?? 0) < from ||
      (e.kind.endsWith(".start") &&
        !events.some(
          (x) => x.kind.endsWith(".end") && x.span_id === e.span_id,
        ));
    result.elapsed_ms =
      e.elapsed_ms === null ? null : Math.max(0, e.elapsed_ms - from);
    if (
      result.duration_ms !== null &&
      (result.elapsed_ms === null || result.duration_ms > result.elapsed_ms)
    ) {
      result.duration_ms = null;
      result.partial = true;
    }
    if (!includeContext) {
      result.snapshot_id = null;
      if (e.kind === "model.start")
        result.data = {
          input: {
            capture:
              "Model request omitted from clip; include context to review it.",
          },
        };
    }
    return result;
  });
  const run: Run = {
    ...t.run,
    id,
    source: "clip",
    name: t.run.name + " / clip",
    status: "incomplete",
    duration_ms: to - from,
    configuration: {
      reviewed,
      range_start_ms: from,
      range_end_ms: to,
      includes_context: includeContext,
    },
    warnings: [
      "Excerpt only. Events outside this range are not included.",
      ...(includeContext
        ? ["Context can contain earlier messages. Review the complete export."]
        : []),
    ],
    capabilities: {
      ...t.run.capabilities,
      context: includeContext ? "included, review earlier messages" : "omitted",
    },
  };
  return validateTape(
    redact(
      {
        run,
        events: clipped,
        notes: t.notes
          .filter((n) => n.elapsed_ms >= from && n.elapsed_ms <= to)
          .map((n) => ({ ...n, run_id: id, elapsed_ms: n.elapsed_ms - from })),
      },
      phrases,
    ),
  );
}
export function download(t: Tape) {
  const lines =
    [t.run, ...t.events, ...t.notes].map((r) => JSON.stringify(r)).join("\n") +
    "\n";
  const url = URL.createObjectURL(
    new Blob([lines], { type: "application/x-ndjson" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "agent-rewind-" + t.run.id + ".jsonl";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
