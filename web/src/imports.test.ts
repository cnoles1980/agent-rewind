import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { importRecording, customTemplate } from "./imports";
import { evidence, validateTape } from "./engine";
const codex = () =>
  readFileSync("../tests/fixtures/codex-sanitized.jsonl", "utf8");
const jsonl = (rows: unknown[]) =>
  rows.map((r) => JSON.stringify(r)).join("\n");
describe("private selected-file imports", () => {
  it("preserves older Codex UI-only commands without duplicating raw calls", () => {
    const ui = JSON.stringify({
      type: "event_msg",
      payload: {
        type: "item_completed",
        item: {
          type: "commandExecution",
          id: "ui1",
          command: "pytest",
          output: "1 failed",
          exitCode: 1,
        },
      },
    });
    const t = importRecording(ui);
    expect(t.events[0].status).toBe("failed");
    expect(t.events[0].data.input).toBe("pytest");
    expect(
      importRecording(codex() + ui).events.filter((e) => e.kind === "tool.end"),
    ).toHaveLength(1);
  });
  it("imports Codex directly, correlates calls, removes duplicate results and excludes metadata", () => {
    const t = importRecording(codex());
    expect(t.run.source).toBe("codex");
    expect(t.run.status).toBe("success");
    expect(t.events.filter((e) => e.kind === "tool.end")).toHaveLength(1);
    expect(evidence(t, t.events.at(-1)!).input).toContain("shipping.py");
    expect(JSON.stringify(t)).not.toMatch(
      /SYNTHETIC_ACCOUNT|SYNTHETIC_ENCRYPTED_PAYLOAD|private-project/,
    );
    expect(t.run.warnings.join()).toContain("future_record");
  });
  it("recovers a truncated final line and rejects malformed middle lines or nonobjects", () => {
    expect(importRecording(codex().trim() + '\n{"type":').run.status).toBe(
      "incomplete",
    );
    expect(() => importRecording(codex() + "broken\n{}")).toThrow(
      "Invalid JSON",
    );
    expect(() => importRecording(codex() + "null")).toThrow(
      "Expected an object",
    );
  });
  it("keeps repeated messages with different timestamps and deduplicates UI copies", () => {
    const message = {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: "again" }],
    };
    const t = importRecording(
      jsonl([
        {
          type: "response_item",
          timestamp: "2026-10-03T00:00:00Z",
          payload: message,
        },
        {
          type: "response_item",
          timestamp: "2026-10-03T00:00:01Z",
          payload: message,
        },
        {
          type: "event_msg",
          payload: { type: "user_message", message: "again" },
        },
      ]),
    );
    expect(t.events).toHaveLength(2);
  });
  it("imports Claude blocks and errors without signatures, attachments or invented timing", () => {
    const assistant = {
      type: "assistant",
      uuid: "a",
      message: {
        model: "fixture-claude",
        content: [
          {
            type: "thinking",
            thinking: "Check the boundary",
            signature: "PRIVATE_SIGNATURE",
          },
          {
            type: "tool_use",
            id: "call1",
            name: "Bash",
            input: { command: "pytest", api_key: "SECRET_VALUE" },
          },
          { type: "redacted_thinking", data: "OPAQUE_DATA" },
        ],
      },
    };
    const t = importRecording(
      jsonl([
        assistant,
        assistant,
        {
          type: "user",
          uuid: "b",
          message: {
            content: [
              {
                type: "tool_result",
                tool_use_id: "call1",
                is_error: true,
                content: [
                  { type: "text", text: "AssertionError: 5 != 0" },
                  { type: "image", source: { data: "IMAGE_BYTES" } },
                ],
              },
            ],
          },
        },
      ]),
    );
    expect(t.run.source).toBe("claude-code");
    expect(t.events.filter((e) => e.kind === "tool.start")).toHaveLength(1);
    expect(t.events.at(-1)?.status).toBe("failed");
    expect(t.events.at(-1)?.elapsed_ms).toBeNull();
    expect(t.events.at(-1)?.duration_ms).toBeNull();
    expect(t.run.status).toBe("incomplete");
    expect(t.run.duration_ms).toBeNull();
    expect(JSON.stringify(t)).not.toMatch(
      /PRIVATE_SIGNATURE|SECRET_VALUE|OPAQUE_DATA|IMAGE_BYTES/,
    );
  });
  it("imports n8n attempts in temporal order while omitting binary data and workflow credentials", () => {
    const t = importRecording(
      JSON.stringify({
        startedAt: "2026-10-03T00:00:00Z",
        status: "error",
        workflowData: {
          name: "Fixture workflow",
          credentials: "PRIVATE_CREDENTIAL",
        },
        data: {
          resultData: {
            runData: {
              A: [
                {
                  startTime: 1790985600000,
                  executionTime: 2000,
                  executionStatus: "success",
                  data: {
                    main: [
                      [
                        {
                          json: { value: 1 },
                          binary: { data: "BINARY_OUTPUT" },
                        },
                      ],
                    ],
                  },
                },
              ],
              B: [
                {
                  startTime: 1790985600100,
                  executionTime: 50,
                  error: { message: "Bad input" },
                  inputOverride: {
                    main: [
                      [
                        {
                          json: { secret: "SECRET_VALUE" },
                          binary: { data: "BINARY_INPUT" },
                        },
                      ],
                    ],
                  },
                },
                {
                  startTime: 1790985603000,
                  executionTime: 0,
                  executionStatus: "success",
                },
              ],
            },
          },
        },
      }),
    );
    expect(t.events.filter((e) => e.kind === "tool.end")).toHaveLength(3);
    expect(t.events.map((e) => e.elapsed_ms)).toEqual([
      0, 100, 150, 2000, 3000, 3000,
    ]);
    expect(
      t.events.find((e) => e.name === "B" && e.kind === "tool.end")?.status,
    ).toBe("failed");
    expect(JSON.stringify(t)).not.toMatch(
      /PRIVATE_CREDENTIAL|BINARY_OUTPUT|BINARY_INPUT|SECRET_VALUE/,
    );
  });
  it("rejects workflow definitions, malformed attempts and unknown sources clearly", () => {
    expect(() => importRecording('{"nodes":[]}', "n8n")).toThrow(
      "execution JSON",
    );
    expect(() =>
      importRecording('{"data":{"resultData":{"runData":{"A":null}}}}'),
    ).toThrow("Invalid execution attempts");
    expect(() => importRecording('{"unknown":true}')).toThrow(
      "Format not recognized",
    );
  });
  it("preserves unfinished n8n attempts without inventing a completed operation", () => {
    const t = importRecording(
      JSON.stringify({
        status: "running",
        data: {
          resultData: {
            runData: {
              Waiting: [
                { startTime: 1790985600000, executionStatus: "running" },
              ],
            },
          },
        },
      }),
    );
    expect(t.events).toHaveLength(1);
    expect(t.events[0].kind).toBe("tool.start");
    expect(t.run.status).toBe("incomplete");
  });
  it("requires an explicit vendor for ambiguous Factory result objects and labels capture gaps", () => {
    const json = JSON.stringify({
      type: "result",
      subtype: "success",
      is_error: false,
      duration_ms: 10,
      result: "Done",
    });
    expect(() => importRecording(json)).toThrow("explicit selection");
    const t = importRecording(json, "factory");
    expect(t.run.status).toBe("success");
    expect(t.events[0].elapsed_ms).toBeNull();
    expect(t.run.warnings.join()).toContain("Summary-only");
    expect(() => importRecording('{"type":"tool_call"}', "factory")).toThrow(
      "full session adapter",
    );
  });
  it("provides a valid custom template that can be reimported", () => {
    const t = customTemplate();
    expect(validateTape(t).events).toHaveLength(2);
    expect(importRecording(JSON.stringify(t), "custom").run.source).toBe(
      "custom",
    );
    expect(t.events.every((e) => e.provenance === "fixture")).toBe(true);
  });
  it("enforces the event limit before returning a tape", () => {
    const text = jsonl(
      Array.from({ length: 10001 }, (_, i) => ({
        type: "response_item",
        payload: {
          type: "message",
          id: String(i),
          role: "assistant",
          content: [{ type: "output_text", text: "test" }],
        },
      })),
    );
    expect(() => importRecording(text)).toThrow("10,000 events");
  });
});
