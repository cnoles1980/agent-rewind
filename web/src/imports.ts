/** Selected-file adapters only. No discovery, network requests, or agent execution. */
import {
  MAX_BYTES,
  parseTape,
  redact,
  validateTape,
  type Tape,
  type Event,
} from "./engine";

export type ImportSource =
  "auto" | "codex" | "claude-code" | "factory" | "n8n" | "custom";
type Obj = Record<string, any>;
const obj = (v: unknown): v is Obj =>
  !!v && typeof v === "object" && !Array.isArray(v);
const stamp = (v: unknown): number | null => {
  const n =
    typeof v === "string" ? Date.parse(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && Math.abs(n) <= 8.64e15 ? n : null;
};
const nonnegative = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
const textBlocks = (v: unknown): string =>
  typeof v === "string"
    ? v
    : Array.isArray(v)
      ? v
          .filter(obj)
          .filter((c) => ["text", "input_text", "output_text"].includes(c.type))
          .map((c) => (typeof c.text === "string" ? c.text : ""))
          .join("\n")
      : "";

function records(text: string): { rows: Obj[]; partial: boolean } {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  try {
    const value = JSON.parse(trimmed);
    if (obj(value)) return { rows: [value], partial: false };
    throw new Error("Select one recording, not an array of sessions.");
  } catch (e) {
    if (!(e instanceof SyntaxError)) throw e;
  }
  const lines = trimmed.split(/\r?\n/),
    rows: Obj[] = [];
  let partial = false;
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch {
      if (i === lines.length - 1 && rows.length) {
        partial = true;
        return;
      }
      throw new Error(`Invalid JSON at line ${i + 1}.`);
    }
    if (!obj(value)) throw new Error(`Expected an object at line ${i + 1}.`);
    rows.push(value);
  });
  return { rows, partial };
}

class Capture {
  tape: Tape;
  skipped = new Map<string, number>();
  constructor(source: Exclude<ImportSource, "auto">, rows: Obj[]) {
    const first =
      rows
        .map((r) => stamp(r.timestamp ?? r.startedAt))
        .find((t) => t !== null) ?? null;
    this.tape = {
      run: {
        record: "run",
        schema_version: 1,
        id: crypto.randomUUID(),
        name: `Imported ${source === "claude-code" ? "Claude Code" : source === "codex" ? "Codex" : source === "factory" ? "Factory" : source} run`,
        source,
        version: "browser-importer/0.2.0",
        started_at: first === null ? "Unknown" : new Date(first).toISOString(),
        model: null,
        provider: null,
        status: "incomplete",
        duration_ms: null,
        configuration: {},
        capabilities: {
          context: "Partial recording; exact model requests are unavailable",
          memory: "Not captured",
          timing: "Recorded timestamps only; absent timing stays unknown",
        },
        warnings: [
          "Imported locally with adapter 0.2.0. Partial capture; review before sharing.",
        ],
      },
      events: [],
      notes: [],
    };
  }
  skip(type: unknown) {
    const key = String(type ?? "unknown").slice(0, 80);
    this.skipped.set(key, (this.skipped.get(key) ?? 0) + 1);
  }
  emit(
    kind: Event["kind"],
    name: string,
    timestamp: unknown,
    data: Obj,
    extra: Partial<Event> = {},
  ) {
    if (this.tape.events.length >= 10000)
      throw new Error("Recording exceeds 10,000 events.");
    const t = stamp(timestamp),
      first = stamp(this.tape.run.started_at);
    const e: Event = {
      record: "event",
      id: crypto.randomUUID(),
      run_id: this.tape.run.id,
      seq: this.tape.events.length,
      kind,
      lane: kind.startsWith("tool")
        ? "tools"
        : kind === "error"
          ? "errors"
          : "model",
      name: String(name).slice(0, 200),
      timestamp: t === null ? "Unknown" : new Date(t).toISOString(),
      elapsed_ms: t === null || first === null ? null : Math.max(0, t - first),
      duration_ms: null,
      span_id: null,
      parent_id: null,
      snapshot_id: null,
      status: "unknown",
      provenance: "imported",
      partial: false,
      data,
      ...extra,
    };
    this.tape.events.push(e);
    return e;
  }
  finish(partial: boolean) {
    const t = this.tape;
    if (!t.events.length)
      throw new Error(
        "No supported events found. Check the selected source and file format.",
      );
    if (partial) {
      t.run.status = "incomplete";
      t.run.warnings.push("Recovered a truncated final JSONL record.");
    }
    if (this.skipped.size)
      t.run.warnings.push(
        "Omitted record types: " +
          [...this.skipped].map(([k, n]) => `${k} (${n})`).join(", "),
      );
    const timed = t.events.flatMap((e) =>
      e.elapsed_ms === null ? [] : [e.elapsed_ms],
    );
    t.run.duration_ms ??= timed.length ? Math.max(...timed) : null;
    return validateTape(redact(t));
  }
}

function codex(c: Capture, rows: Obj[]) {
  c.tape.run.provider = "OpenAI";
  const starts = new Map<string, Event>(),
    seen = new Set<string>();
  const hasRawTools = rows.some(
    (r) =>
      r.type === "response_item" &&
      obj(r.payload) &&
      ["function_call", "custom_tool_call"].includes(r.payload.type),
  );
  const rawTexts = new Set(
    rows
      .filter((r) => r.type === "response_item")
      .flatMap((r) => {
        const p = r.payload;
        return obj(p) && Array.isArray(p.content)
          ? p.content.filter(obj).map((x) => x.text)
          : [];
      }),
  );
  for (const r of rows) {
    const p = obj(r.payload) ? r.payload : {};
    if (r.type === "session_meta") continue;
    if (r.type === "turn_context") {
      if (typeof p.model === "string") c.tape.run.model = p.model.slice(0, 200);
      continue;
    }
    if (r.type === "event_msg") {
      if (["task_complete", "task_completed"].includes(p.type))
        c.tape.run.status = "success";
      else if (p.type === "task_started") c.tape.run.status = "incomplete";
      else if (["turn_aborted", "task_failed"].includes(p.type)) {
        c.tape.run.status = p.type === "turn_aborted" ? "cancelled" : "failed";
        c.emit(
          "error",
          "Turn interrupted",
          r.timestamp,
          { reason: p.reason ?? p.type },
          { status: "failed" },
        );
      } else if (
        ["user_message", "agent_message", "agent_reasoning"].includes(p.type)
      ) {
        const text = p.message ?? p.text;
        if (typeof text === "string" && text && !rawTexts.has(text))
          c.emit(
            "message",
            p.type === "agent_reasoning"
              ? "Exposed reasoning summary"
              : p.type === "user_message"
                ? "User prompt"
                : "Agent message",
            r.timestamp,
            { text },
          );
      } else if (
        p.type === "item_completed" &&
        obj(p.item) &&
        ["commandExecution", "command_execution", "mcpToolCall"].includes(
          p.item.type,
        )
      ) {
        if (hasRawTools) {
          c.skip("UI tool wrapper (raw calls preferred)");
          continue;
        }
        const item = p.item,
          identity =
            typeof (item.call_id ?? item.id) === "string"
              ? (item.call_id ?? item.id)
              : null;
        const key = JSON.stringify([
          "ui-tool",
          identity ?? [r.timestamp, item],
        ]);
        if (seen.has(key)) continue;
        seen.add(key);
        c.emit(
          "tool.end",
          item.tool ?? "Command execution",
          r.timestamp,
          {
            input: item.command ?? item.arguments ?? null,
            output: item.output ?? null,
            capture: "Completed UI item only",
          },
          {
            span_id: identity,
            duration_ms: nonnegative(item.durationMs),
            status:
              typeof item.exitCode === "number"
                ? item.exitCode === 0
                  ? "success"
                  : "failed"
                : "unknown",
          },
        );
      } else if (p.type !== "token_count") c.skip(`event_msg:${p.type}`);
      continue;
    }
    if (r.type !== "response_item") {
      c.skip(r.type);
      continue;
    }
    const key = JSON.stringify([p.type, p.id ?? p.call_id ?? [r.timestamp, p]]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (["function_call", "custom_tool_call"].includes(p.type)) {
      const span =
        typeof (p.call_id ?? p.id) === "string"
          ? (p.call_id ?? p.id)
          : crypto.randomUUID();
      starts.set(
        span,
        c.emit(
          "tool.start",
          p.name ?? "Tool call",
          r.timestamp,
          { input: p.arguments ?? p.input },
          { span_id: span, status: "running" },
        ),
      );
    } else if (
      ["function_call_output", "custom_tool_call_output"].includes(p.type)
    ) {
      const span =
        typeof p.call_id === "string" ? p.call_id : crypto.randomUUID();
      c.emit(
        "tool.end",
        starts.get(span)?.name ?? "Tool output",
        r.timestamp,
        {
          output: p.output,
          capture: "Recorded result; execution status unknown",
        },
        { span_id: span },
      );
    } else if (p.type === "reasoning") {
      const summary = textBlocks(
        Array.isArray(p.summary)
          ? p.summary.filter(obj).map((x: Obj) => ({ ...x, type: "text" }))
          : [],
      );
      if (summary)
        c.emit("message", "Exposed reasoning summary", r.timestamp, {
          summary,
        });
    } else if (p.type === "message" && ["user", "assistant"].includes(p.role)) {
      const text = textBlocks(p.content);
      if (text)
        c.emit(
          "message",
          p.role === "user" ? "User prompt" : "Agent message",
          r.timestamp,
          { role: p.role, text },
        );
    } else c.skip(p.type);
  }
}

function claude(c: Capture, rows: Obj[]) {
  c.tape.run.provider = "Anthropic";
  const starts = new Map<string, Event>(),
    seen = new Set<string>();
  for (const r of rows) {
    if (!["user", "assistant"].includes(r.type) || !obj(r.message)) {
      c.skip(r.type);
      continue;
    }
    // UUID identifies a transcript entry. A streamed message ID can recur with new blocks.
    const key =
      typeof r.uuid === "string"
        ? r.uuid
        : JSON.stringify([r.timestamp, r.message]);
    if (seen.has(key)) continue;
    seen.add(key);
    const m = r.message;
    if (typeof m.model === "string") c.tape.run.model = m.model.slice(0, 200);
    const content =
      typeof m.content === "string"
        ? [{ type: "text", text: m.content }]
        : Array.isArray(m.content)
          ? m.content
          : [];
    for (const b of content.filter(obj)) {
      if (b.type === "text" && typeof b.text === "string")
        c.emit(
          "message",
          r.type === "user" ? "User prompt" : "Agent message",
          r.timestamp,
          { text: b.text, role: r.type },
        );
      else if (b.type === "thinking" && typeof b.thinking === "string")
        c.emit("message", "Provider-exposed thinking", r.timestamp, {
          summary: b.thinking,
          capture: "Exposed transcript text; signatures omitted",
        });
      else if (b.type === "tool_use" && typeof b.id === "string") {
        if (!starts.has(b.id))
          starts.set(
            b.id,
            c.emit(
              "tool.start",
              b.name ?? "Tool call",
              r.timestamp,
              { input: b.input },
              { span_id: b.id, status: "running" },
            ),
          );
      } else if (
        b.type === "tool_result" &&
        typeof b.tool_use_id === "string"
      ) {
        const dedup = `result:${b.tool_use_id}`;
        if (seen.has(dedup)) continue;
        seen.add(dedup);
        c.emit(
          "tool.end",
          starts.get(b.tool_use_id)?.name ?? "Tool output",
          r.timestamp,
          {
            output: textBlocks(b.content) || null,
            capture: "Text output only; attachments omitted",
          },
          {
            span_id: b.tool_use_id,
            status:
              b.is_error === true
                ? "failed"
                : b.is_error === false
                  ? "success"
                  : "unknown",
          },
        );
      } else c.skip(`content:${b.type}`);
    }
  }
  c.tape.run.warnings.push(
    "Transcript may omit subagents, external tool-result files, attachments, or completion. Run outcome is unknown.",
  );
}

function n8n(c: Capture, r: Obj) {
  const result = r.data?.resultData,
    runData = result?.runData;
  if (!obj(runData))
    throw new Error(
      "Select execution JSON with data.resultData.runData (includeData=true). A workflow definition is not an execution.",
    );
  c.tape.run.provider = "n8n";
  if (typeof r.workflowData?.name === "string")
    c.tape.run.name = r.workflowData.name.slice(0, 200);
  c.tape.run.status =
    r.status === "success"
      ? "success"
      : ["error", "crashed"].includes(r.status)
        ? "failed"
        : r.status === "canceled"
          ? "cancelled"
          : "incomplete";
  const steps = Object.entries(runData)
    .flatMap(([name, attempts]) => {
      if (!Array.isArray(attempts))
        throw new Error(`Invalid execution attempts for node ${name}.`);
      return attempts.map((s, index) => {
        if (!obj(s))
          throw new Error(`Invalid execution data for node ${name}.`);
        return { name, index, s };
      });
    })
    .sort(
      (a, b) =>
        (stamp(a.s.startTime) ?? Infinity) - (stamp(b.s.startTime) ?? Infinity),
    );
  const jsonItems = (value: unknown) =>
    Array.isArray(value)
      ? value.map((branch) =>
          Array.isArray(branch)
            ? branch.filter(obj).map((item) => ({ json: item.json ?? null }))
            : null,
        )
      : null;
  for (const { name, index, s } of steps) {
    const start = stamp(s.startTime),
      duration = nonnegative(s.executionTime),
      span = crypto.randomUUID();
    c.emit(
      "tool.start",
      name,
      start,
      {
        input: jsonItems(s.inputOverride?.main),
        capture: "Node input unavailable unless inputOverride was recorded",
        attempt: index,
      },
      { span_id: span, status: "running" },
    );
    const status = s.error
      ? "failed"
      : s.executionStatus === "success"
        ? "success"
        : s.executionStatus === "error"
          ? "failed"
          : "unknown";
    // Preserve JSON item data only; binary attachments, credentials, and workflow definitions are excluded.
    const main = jsonItems(s.data?.main);
    if (
      s.executionStatus === "running" ||
      (!s.error && main === null && duration === null && status === "unknown")
    ) {
      c.skip("unfinished node attempt (start preserved)");
      continue;
    }
    c.emit(
      "tool.end",
      name,
      start === null || duration === null ? null : start + duration,
      { output: main, error: s.error ?? null, attempt: index },
      { span_id: span, status, duration_ms: duration },
    );
  }
  if (result.error)
    c.emit(
      "error",
      "Workflow error",
      r.stoppedAt,
      { error: result.error },
      { status: "failed" },
    );
  c.tape.events.sort(
    (a, b) =>
      (stamp(a.timestamp) ?? Infinity) - (stamp(b.timestamp) ?? Infinity),
  );
  c.tape.events.forEach((e, i) => {
    e.seq = i;
  });
  c.tape.run.warnings.push(
    "Node execution data only. Model prompts, binary data, credentials, and workflow configuration are not imported. Missing node inputs remain unknown.",
  );
}

function factory(c: Capture, rows: Obj[]) {
  if (
    rows.length !== 1 ||
    rows[0].type !== "result" ||
    typeof rows[0].result !== "string"
  )
    throw new Error(
      "Factory currently supports droid exec --output-format json result files only; a full session adapter is not available.",
    );
  const r = rows[0];
  c.tape.run.provider = "Factory";
  c.tape.run.status =
    r.is_error === true
      ? "failed"
      : r.is_error === false && r.subtype === "success"
        ? "success"
        : "incomplete";
  c.tape.run.duration_ms = nonnegative(r.duration_ms);
  c.emit(
    r.is_error === true ? "error" : "message",
    "Factory result summary",
    null,
    { text: r.result, reported_turns: r.num_turns ?? null },
    { status: r.is_error === true ? "failed" : "unknown" },
  );
  c.tape.run.warnings.push(
    "Summary-only import. Tool calls, code changes, exact prompts, and event timing were not captured. This is not a full session replay.",
  );
}

export function importRecording(
  text: string,
  requested: ImportSource = "auto",
): Tape {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    throw new Error(
      "Local recording exceeds 100 MB. Export a smaller session or a reviewed clip.",
    );
  const { rows, partial } = records(text);
  if (rows[0]?.record === "run" || rows[0]?.run)
    return parseTape(text.replace(/^\uFEFF/, ""));
  let source = requested;
  if (source === "auto") {
    if (
      rows.some((r) =>
        ["session_meta", "response_item", "event_msg"].includes(r.type),
      )
    )
      source = "codex";
    else if (
      rows.some((r) => ["assistant", "user"].includes(r.type) && obj(r.message))
    )
      source = "claude-code";
    else if (obj(rows[0]?.data?.resultData)) source = "n8n";
    // A result object is shared by several vendors; never guess its producer.
    else
      throw new Error(
        "Format not recognized. Choose a source in Settings & sources. Factory requires explicit selection; custom imports use Rewind v1 tapes.",
      );
  }
  if (source === "custom")
    throw new Error(
      "Custom recordings must follow the Rewind v1 tape template.",
    );
  const c = new Capture(source, rows);
  if (source === "codex") codex(c, rows);
  else if (source === "claude-code") claude(c, rows);
  else if (source === "n8n") {
    if (rows.length !== 1)
      throw new Error("Select one n8n execution JSON object.");
    n8n(c, rows[0]);
  } else factory(c, rows);
  return c.finish(partial);
}

export function customTemplate(): Tape {
  const c = new Capture("custom", [{ timestamp: "2026-10-03T12:00:00Z" }]);
  c.tape.run.name = "Custom adapter template";
  c.tape.run.configuration = {
    adapter: "Replace with your adapter name and version",
  };
  c.emit(
    "tool.start",
    "your_tool",
    "2026-10-03T12:00:00Z",
    { input: { example: "Replace with sanitized captured arguments" } },
    { span_id: "example-call", status: "running", provenance: "fixture" },
  );
  c.emit(
    "tool.end",
    "your_tool",
    "2026-10-03T12:00:01Z",
    { output: "Replace with sanitized captured result" },
    {
      span_id: "example-call",
      status: "success",
      duration_ms: 1000,
      provenance: "fixture",
    },
  );
  c.tape.run.warnings = [
    "Illustrative adapter template, not a real run. Replace sample events before use.",
  ];
  return c.finish(false);
}
