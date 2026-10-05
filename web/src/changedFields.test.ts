import { expect, it } from "vitest";
import { changedFields, previewValue } from "./changedFields";

it("focuses on changed output fields while ignoring declared volatile metadata", () => {
  expect(
    changedFields(
      { output: '{"policy":"above $50","request_id":"a","id":1}' },
      { output: { policy: "at least $50", request_id: "b", id: 2 } },
    ).fields,
  ).toEqual([
    { path: "/output/id", a: 1, b: 2 },
    { path: "/output/policy", a: "above $50", b: "at least $50" },
  ]);
});

it("distinguishes missing fields, nulls, empty arrays, and unmatched events", () => {
  const diff = changedFields({ output: null, error: [] }, { output: [] });
  expect(diff.fields).toEqual([
    { path: "/error", a: [], b: undefined },
    { path: "/output", a: null, b: [] },
  ]);
  expect(previewValue(null)).toBe("null");
  expect(previewValue(undefined)).toBe("Not captured");
  expect(changedFields(undefined, { name: "run_tests" }).fields).toEqual([
    { path: "/", a: undefined, b: { name: "run_tests" } },
  ]);
});

it("escapes field names and bounds long previews and large changes", () => {
  expect(changedFields({ "a/b~": 1 }, { "a/b~": 2 }).fields[0].path).toBe(
    "/a~1b~0",
  );
  const diff = changedFields(Array(100).fill(1), Array(100).fill(2));
  expect(diff.fields).toHaveLength(30);
  expect(diff.limited).toBe(true);
  expect(previewValue("x".repeat(10000))).toContain("Preview shortened");
});
