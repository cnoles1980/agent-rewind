/** Decode known text wrappers; retain bounded head/tail across all fields. */
export function captureText(value: unknown, limit = 16000): string {
  let buffer = "",
    head = "",
    tail = "",
    truncated = false,
    nodes = 0,
    omitted = false;
  const half = Math.max(1, Math.floor(limit / 2));
  function append(text: string) {
    const part = text + "\n";
    if (!truncated && buffer.length + part.length <= limit) {
      buffer += part;
      return;
    }
    if (!truncated) {
      head = (buffer + part.slice(0, half)).slice(0, half);
      // Do not leave half an emoji at a truncation boundary.
      if (/[\uD800-\uDBFF]$/.test(head)) head = head.slice(0, -1);
      tail = buffer.slice(-half);
      truncated = true;
    }
    tail = part.length >= half ? part.slice(-half) : (tail + part).slice(-half);
    if (/^[\uDC00-\uDFFF]/.test(tail)) tail = tail.slice(1);
  }
  function visit(item: unknown, depth: number) {
    if (++nodes > 2048 || depth > 10) {
      if (!omitted) append("[TRUNCATED: nested or extra data omitted]");
      omitted = true;
      return;
    }
    if (item === undefined || (item === null && depth === 0)) return;
    if (typeof item === "string") {
      if (item.length < 64000 && /^[\[{]/.test(item.trim())) {
        try {
          const decoded = JSON.parse(item);
          visit(decoded, depth + 1);
          return;
        } catch {
          /* Literal text. */
        }
      }
      append(item || '""');
    } else if (Array.isArray(item)) {
      if (!item.length) append("[]");
      for (const child of item) {
        visit(child, depth + 1);
        if (nodes > 2048) break;
      }
    } else if (item !== null && typeof item === "object") {
      const object = item as Record<string, unknown>;
      const keys = Object.keys(object);
      if (
        object.type === "text" &&
        typeof object.text === "string" &&
        keys.every((key) => key === "text" || key === "type")
      ) {
        visit(object.text, depth + 1);
        return;
      }
      if (!keys.length && depth > 0) append("{}");
      for (const key of keys) {
        if (depth === 0 && key === "capture") continue;
        append(`${key}:`);
        visit(object[key], depth + 1);
        if (nodes > 2048) break;
      }
    } else {
      append(JSON.stringify(item));
    }
  }
  visit(value, 0);
  return (
    truncated ? head + "\n[TRUNCATED: middle omitted]\n" + tail : buffer
  ).trim();
}
export type EvidenceSource = {
  event_id: string;
  content: string;
};
export type PreparedEvidence = {
  observation: string;
  sources: EvidenceSource[];
  supporting_context: string[];
};
/** Number contiguous source slices; the model selects but cannot rewrite them. */
export function evidenceExcerpts(prepared: PreparedEvidence) {
  const excerpts: { id: number; event_id: string; text: string }[] = [];
  for (const source of prepared.sources) {
    const characters = Array.from(source.content);
    let start = 0;
    while (start < characters.length) {
      let end = Math.min(start + 800, characters.length);
      if (end < characters.length) {
        const newline = characters.lastIndexOf("\n", end - 1);
        if (newline > start + 400) end = newline + 1;
      }
      excerpts.push({
        id: excerpts.length + 1,
        event_id: source.event_id,
        text: characters.slice(start, end).join(""),
      });
      start = end;
    }
  }
  return excerpts;
}
export const EVIDENCE_REQUIRED =
  "Select recorded output or code before analysis. Metadata alone cannot support an investigation. No model call was made.";
const MALFORMED =
  "A reviewed JSON block is truncated or malformed. Generate a new report before analysis.";
function reviewedBlocks(
  report: string,
): { block: unknown; supporting: boolean }[] {
  const blocks: { block: unknown; supporting: boolean }[] = [];
  let fence = "",
    lines: string[] = [],
    previous = "",
    supporting = false;
  for (const line of report.split(/\r?\n/)) {
    if (fence) {
      if (line.trimEnd() === fence) {
        try {
          blocks.push({ block: JSON.parse(lines.join("\n")), supporting });
        } catch {
          throw new Error(MALFORMED);
        }
        fence = "";
        lines = [];
      } else lines.push(line);
    } else {
      const opening = /^(`{3,})json[ \t]*$/.exec(line);
      if (opening) {
        fence = opening[1];
        supporting = previous === "## Explicitly included supporting context";
      }
    }
    if (line.trim()) previous = line.trimEnd();
  }
  if (fence) throw new Error(MALFORMED);
  return blocks;
}
/** An unfinished final block invalidates the entire request. */
export function prepareEvidence(
  report: string,
  ids: string[],
  clean: (value: unknown) => unknown = (value) => value,
): PreparedEvidence {
  const sources: EvidenceSource[] = [],
    supporting_context: string[] = [];
  let observation = "Expected behavior was not provided.";
  const seen = new Set<string>();
  for (const { block: value, supporting } of reviewedBlocks(report)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const block = value as Record<string, unknown>;
    if (typeof block.observation === "string")
      observation = String(clean(block.observation));
    if (typeof block.event === "string" && ids.includes(block.event)) {
      if (seen.has(block.event))
        throw new Error("Duplicate event evidence; generate a new report.");
      seen.add(block.event);
      const content = captureText(clean(block.evidence));
      if (content)
        sources.push({
          event_id: block.event,
          content,
        });
    } else if (supporting) {
      const text = captureText(clean(block));
      if (text) supporting_context.push(text);
    }
  }
  if (!sources.length) throw new Error(EVIDENCE_REQUIRED);
  return { observation, sources, supporting_context };
}
