import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  atTime,
  clipTape,
  compare,
  evidence,
  parseTape,
  validateTape,
  visibleEvents,
  normalize,
} from "./engine";
const fixture = () =>
  validateTape(JSON.parse(readFileSync("../examples/stale.json", "utf8")));
describe("recording integrity", () => {
  it("resolves reused context snapshots at the current model boundary", () => {
    const t = fixture(),
      first = t.events.find((e) => e.kind === "context")!;
    const model = {
      ...structuredClone(t.events.find((e) => e.kind === "model.start")!),
      id: "reused",
      span_id: "reused",
      seq: 100,
      elapsed_ms: 90000,
      snapshot_id: first.snapshot_id,
    };
    t.events.push(model);
    t.run.duration_ms = 100000;
    expect(atTime(t, 91000)?.id).toBe(first.id);
    const clip = clipTape(t, 80000, 95000, true);
    expect(
      clip.events.some(
        (e) => e.snapshot_id === first.snapshot_id && e.kind === "context",
      ),
    ).toBe(true);
  });
  it("never uses later context for an earlier playhead", () => {
    const t = fixture();
    expect(atTime(t, 22000)?.elapsed_ms).toBe(11000);
    const test = t.events.find(
      (e) => e.name === "run_tests" && e.kind === "tool.end",
    )!;
    expect(evidence(t, test, 22000).output).toBeUndefined();
  });
  it("keeps interrupted starts and unknown-timing outputs inspectable", () => {
    const t = fixture();
    t.events = t.events.slice(0, 2);
    expect(visibleEvents(t).some((e) => e.kind === "model.start")).toBe(true);
    const e = fixture().events.find((e) => e.kind === "tool.end")!;
    e.elapsed_ms = null;
    expect(evidence(fixture(), e, 0).output).toEqual(e.data.output);
  });
  it("recovers only a truncated final JSONL record", () => {
    const t = fixture(),
      lines = [t.run, ...t.events].map((x) => JSON.stringify(x));
    expect(parseTape(lines.join("\n") + '\n{"bad"').run.status).toBe(
      "incomplete",
    );
    expect(() => parseTape(lines[0] + "\nbad\n" + lines[1])).toThrow("line 2");
  });
  it("rejects duplicates and cross-run records", () => {
    const t = fixture();
    t.events[1].id = t.events[0].id;
    expect(() => validateTape(t)).toThrow();
    const u = fixture();
    u.events[0].run_id = "other";
    expect(() => validateTape(u)).toThrow();
  });
});
describe("comparison", () => {
  it("normalizes JSON arguments and provider call IDs while preserving business IDs", () => {
    expect(normalize('{"b":2,"a":1}')).toEqual(normalize({ a: 1, b: 2 }));
    expect(
      normalize({
        tool_calls: [{ id: "generated-a", function: { name: "read" } }],
        tool_call_id: "a",
      }),
    ).toEqual(
      normalize({
        tool_calls: [{ id: "generated-b", function: { name: "read" } }],
        tool_call_id: "b",
      }),
    );
    expect(normalize({ id: "product-a" })).not.toEqual(
      normalize({ id: "product-b" }),
    );
  });
  it("aligns an inserted repeated tool name before the matching original call", () => {
    const a = fixture(),
      b = fixture();
    const start = b.events.find(
      (e) => e.kind === "tool.start" && e.name === "read_policy",
    )!;
    const end = b.events.find(
      (e) => e.kind === "tool.end" && e.name === "read_policy",
    )!;
    const at = b.events.indexOf(start);
    b.events.splice(
      at,
      0,
      {
        ...structuredClone(start),
        id: "insert-start",
        span_id: "extra",
        data: { input: { policy: "other" } },
      },
      { ...structuredClone(end), id: "insert-end", span_id: "extra" },
    );
    const diffs = compare(a, b);
    expect(diffs.filter((d) => d.type === "behavior")).toHaveLength(1);
    expect(diffs[0].message).toBe("Additional tool call in Run B");
  });
  it("ignores timing drift but preserves inserted calls and changed outputs", () => {
    const a = fixture(),
      b = fixture();
    for (const e of b.events) if (e.elapsed_ms !== null) e.elapsed_ms += 500;
    expect(compare(a, b)).toEqual([]);
    const e = b.events.find(
      (e) => e.name === "read_policy" && e.kind === "tool.end",
    )!;
    e.data.output = { policy: "changed" };
    expect(
      compare(a, b).some((d) => d.message === "read_policy: result changed"),
    ).toBe(true);
    const extra = structuredClone(e);
    extra.id = "insert";
    extra.span_id = "insert";
    extra.name = "extra_tool";
    extra.seq = 100;
    b.events.push(extra);
    expect(
      compare(a, b).some((d) => d.message === "Additional tool call in Run B"),
    ).toBe(true);
  });
  it("does not normalize away business identifiers", () => {
    const a = fixture(),
      b = fixture();
    b.events.find((e) => e.kind === "tool.start")!.data.input = {
      id: "business-123",
    };
    expect(compare(a, b).some((d) => d.type === "input")).toBe(true);
  });
});
describe("clip privacy", () => {
  it("excludes the original tape, earlier context and future outcomes", () => {
    const a = fixture(),
      clip = clipTape(a, 18000, 30000, false, [], true);
    expect(clip.events.some((e) => e.kind === "context")).toBe(false);
    expect(clip.events.some((e) => e.name === "apply_patch")).toBe(false);
    expect(clip.events.some((e) => e.kind === "model.start" && e.partial)).toBe(
      true,
    );
    expect(JSON.stringify(clip)).not.toContain("messages");
    expect(clip.events.every((e) => e.elapsed_ms! <= 12000)).toBe(true);
  });
  it("includes supporting context only when explicitly selected and redacts nested secrets", () => {
    const a = fixture();
    a.events.find((e) => e.kind === "context")!.data.api_key = "private-value";
    const clip = clipTape(a, 0, 30000, true, ["archived-v1"], true);
    expect(JSON.stringify(clip)).not.toContain("private-value");
    expect(JSON.stringify(clip)).not.toContain("archived-v1");
    expect(clip.events.some((e) => e.kind === "context")).toBe(true);
  });
  it("bounds malformed ranges and 10,000 event limit", () => {
    expect(() => clipTape(fixture(), NaN, 1000)).toThrow();
    expect(() => clipTape(fixture(), 1000, 0)).toThrow();
    const a = fixture();
    a.events = Array(10001).fill(a.events[0]);
    expect(() => validateTape(a)).toThrow();
  });
});
