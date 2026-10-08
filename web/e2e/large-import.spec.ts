import { test, expect } from "@playwright/test";

test("production worker opens and persists a 24 MB Codex log without uploads", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [],
    writes: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8766");
  await expect(
    page.getByRole("heading", { name: "read_policy()", exact: true }),
  ).toBeVisible();
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(r.url());
  });
  const rows: unknown[] = [
    { type: "session_meta", timestamp: "2026-10-03T00:00:00Z", payload: {} },
    {
      type: "response_item",
      timestamp: "2026-10-03T00:00:00Z",
      payload: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Large synthetic import regression fixture",
          },
        ],
      },
    },
  ];
  // Retain meaningful large tool outputs, rather than padding discarded metadata.
  for (let i = 0; i < 128; i++) {
    rows.push({
      type: "response_item",
      payload: {
        type: "function_call",
        call_id: `call-${i}`,
        name: "read_file",
        arguments: JSON.stringify({ path: `fixture-${i}.txt` }),
      },
    });
    rows.push({
      type: "response_item",
      payload: {
        type: "function_call_output",
        call_id: `call-${i}`,
        output: `fixture-output-${i}:` + "x".repeat(192 * 1024),
      },
    });
  }
  const buffer = Buffer.from(rows.map((r) => JSON.stringify(r)).join("\n"));
  expect(buffer.byteLength).toBeGreaterThan(24 * 1024 * 1024);
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic-large.jsonl",
    mimeType: "application/jsonl",
    buffer,
  });
  await expect(
    page.getByRole("heading", { name: "Imported Codex run", exact: false }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("status")).toContainText(
    "Opened 257 events privately",
  );
  const retained = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open("agent-rewind");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const values = await new Promise<any[]>((resolve, reject) => {
      const req = db.transaction("tapes").objectStore("tapes").getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    const t = values.find((t) => t.run.source === "codex");
    return {
      events: t.events.length,
      last: t.events.at(-1).data.output.length,
    };
  });
  expect(retained).toEqual({
    events: 257,
    last: "fixture-output-127:".length + 192 * 1024,
  });
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test("import cancellation terminates the worker without saving a tape", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "read_policy()", exact: true }),
  ).toBeVisible();
  // Hold the worker entry script so the cancellation state is deterministic.
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/src/import.worker.ts*", async (route) => {
    await held;
    await route.abort().catch(() => {});
  });
  await page.locator("input[type=file]").setInputFiles({
    name: "cancel.jsonl",
    mimeType: "application/jsonl",
    buffer: Buffer.from(
      '{"type":"event_msg","payload":{"type":"agent_message","message":"Cancelled fixture"}}',
    ),
  });
  await page
    .getByRole("button", { name: "Cancel import", exact: true })
    .click();
  release();
  await expect(page.getByRole("status")).toContainText(
    "Import cancelled. No recording was saved.",
  );
  await page.reload();
  await page.getByRole("button", { name: "Manage local library" }).click();
  await expect(page.locator("dialog")).not.toContainText("Imported Codex run");
});
