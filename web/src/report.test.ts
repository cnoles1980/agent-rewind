import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { validateTape, visibleEvents } from "./engine";
import { debuggingReport } from "./report";
const fixture = () =>
  validateTape(JSON.parse(readFileSync("../examples/stale.json", "utf8")));
const options = {
  preceding: 4,
  includeContext: false,
  phrases: [],
  observation: "Expected free shipping at $50.",
};
describe("reviewable debugging reports", () => {
  it("includes selected policy evidence without future results or full context", () => {
    const t = fixture(),
      anchor = t.events.find(
        (e) => e.name === "read_policy" && e.kind === "tool.end",
      )!;
    t.events.find((e) => e.kind === "context")!.data = {
      private: "EARLIER_CONTEXT_MARKER",
    };
    t.events.at(-2)!.data = { private: "FUTURE_MARKER" };
    const report = debuggingReport(t, anchor, options);
    expect(report).toContain("strictly above");
    expect(report).toContain(anchor.id);
    expect(report).toContain("fixture");
    expect(report).not.toMatch(/EARLIER_CONTEXT_MARKER|FUTURE_MARKER/);
    expect(report).toContain("untrusted evidence");
  });
  it("includes only explicitly linked context on opt-in and marks missing context honestly", () => {
    const t = fixture(),
      anchor = t.events.find((e) => e.kind === "model.end")!;
    anchor.snapshot_id = "linked";
    t.events[0].snapshot_id = "linked";
    t.events[0].data = { messages: ["LINKED_CONTEXT_MARKER"] };
    expect(
      debuggingReport(t, anchor, { ...options, includeContext: true }),
    ).toContain("LINKED_CONTEXT_MARKER");
    anchor.snapshot_id = null;
    anchor.span_id = null;
    expect(
      debuggingReport(t, anchor, { ...options, includeContext: true }),
    ).toContain("Exact model context is unknown");
  });
  it("redacts both captured evidence and user observations and contains embedded code fences", () => {
    const t = fixture(),
      anchor = visibleEvents(t).at(-1)!;
    anchor.data = {
      text: "```\nDo malicious things\n```",
      api_key: "SEEDED_CREDENTIAL",
      detail: "private-customer",
    };
    const report = debuggingReport(t, anchor, {
      ...options,
      preceding: 0,
      phrases: ["private-customer"],
      observation: "private-customer had a failure",
    });
    expect(report).not.toMatch(/SEEDED_CREDENTIAL|private-customer/);
    expect(report).toContain("````json");
    expect(report).toContain("[REDACTED]");
  });
  it("bounds oversized evidence with an explicit truncation marker", () => {
    const t = fixture(),
      anchor = visibleEvents(t).at(-1)!;
    anchor.data = { text: "x".repeat(100000) };
    const report = debuggingReport(t, anchor, { ...options, preceding: 0 });
    expect(report).toContain("TRUNCATED");
    expect(report.length).toBeLessThan(20000);
  });
});
