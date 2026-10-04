import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  captureText,
  prepareEvidence,
  evidenceExcerpts,
} from "./analysisEvidence";
import { debuggingReport } from "./report";
import { validateTape, visibleEvents, redact } from "./engine";
const cases = JSON.parse(
  readFileSync("../tests/fixtures/analysis-evidence.json", "utf8"),
);
describe("reviewed evidence parity", () => {
  for (const row of JSON.parse(
    readFileSync("../tests/fixtures/analysis-excerpts.json", "utf8"),
  ))
    it(row.name, () => {
      const content = "x".repeat(row.prefix_length) + row.suffix;
      const excerpts = evidenceExcerpts({
        observation: "",
        supporting_context: [],
        sources: [{ event_id: "evt", content }],
      });
      expect(excerpts.map((item) => Array.from(item.text).length)).toEqual(
        row.lengths,
      );
      expect(excerpts.map((item) => item.text).join("")).toBe(content);
      expect(excerpts.every((item) => !/[\uD800-\uDFFF]/u.test(item.text))).toBe(true);
    });
  it("does not split surrogate pairs at capture truncation boundaries", () => {
    const content = captureText(
      "x".repeat(7999) + "😀" + "y".repeat(20000) + "😀" + "z".repeat(7998),
    );
    expect(!/[\uD800-\uDFFF]/u.test(content)).toBe(true);
    expect(content).toContain("TRUNCATED");
  });
  for (const row of cases)
    it(row.name, () => {
      const blocks = structuredClone(row.blocks);
      if (row.generated_input_length)
        blocks[0].evidence.input = "x".repeat(row.generated_input_length);
      const fence = "`".repeat(row.fence ?? 3);
      const report =
        blocks
          .map(
            (block: unknown) =>
              `${fence}json\n${JSON.stringify(block)}\n${fence}`,
          )
          .join("\n\n") + (row.suffix ?? "");
      if (row.error)
        expect(() => prepareEvidence(report, row.ids)).toThrow(row.error);
      else {
        const result = prepareEvidence(
          report,
          row.ids,
          row.clean ? redact : undefined,
        );
        expect(result.sources).toHaveLength(1);
        if (row.content !== undefined)
          expect(result.sources[0].content).toBe(row.content);
        for (const fragment of row.contains ?? [])
          expect(result.sources[0].content).toContain(fragment);
      }
    });
  it("bounds truncation with one character remaining", () => {
    const text = captureText(["x".repeat(15999), "y".repeat(100000)]);
    expect(text.length).toBeLessThan(16100);
    expect(text).toContain("TRUNCATED");
  });
  it("preserves source text and ownership across bounded excerpt slices", () => {
    const content =
      "header\n" + "x".repeat(1000) + "\nactual: []\nexpected: []";
    const excerpts = evidenceExcerpts({
      observation: "",
      supporting_context: [],
      sources: [
        { event_id: "first", content },
        { event_id: "second", content: "[]" },
      ],
    });
    expect(
      excerpts.every((item) => item.text.length > 0 && item.text.length <= 800),
    ).toBe(true);
    expect(
      excerpts
        .filter((item) => item.event_id === "first")
        .map((item) => item.text)
        .join(""),
    ).toBe(content);
    expect(excerpts.at(-1)).toEqual({ id: 3, event_id: "second", text: "[]" });
  });
  it("retains valid redacted JSON and failure tail when a report event is large", () => {
    const tape = validateTape(
      JSON.parse(readFileSync("../examples/stale.json", "utf8")),
    );
    const event = visibleEvents(tape).at(-1)!;
    event.name = "customer-private";
    event.data = {
      input: "x".repeat(24000),
      output: "AssertionError\nactual: 9\nexpected: 8",
    };
    const report = debuggingReport(tape, event, {
      preceding: 0,
      includeContext: false,
      phrases: ["customer-private"],
      observation: "Failure",
    });
    expect(report).not.toContain("customer-private");
    const result = prepareEvidence(report, [event.id]);
    expect(result.sources[0].content).toContain("expected: 8");
    expect(result.sources[0].content).toContain("TRUNCATED");
  });
});
