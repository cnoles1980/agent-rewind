import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("settings imports Codex locally and prepares a reviewed, redacted debugging report", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Settings & sources", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("region", { name: "Codex import instructions" }),
  ).toContainText("no CLI conversion is required");
  await page.getByLabel("Default playback speed").selectOption("2");
  await page.getByLabel("Earlier events in reports").selectOption("2");
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(r.url());
  });
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Open Codex log" }).click();
  await (await chooser).setFiles("../tests/fixtures/codex-sanitized.jsonl");
  await expect(
    page.getByRole("heading", { name: "Imported Codex run", exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "read_file Tool result", exact: false })
    .click();
  await page
    .getByRole("button", { name: "Analyze with Nemotron", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Copy debugging report" }),
  ).toBeDisabled();
  await page
    .getByLabel("What happened, and what did you expect?")
    .fill("private-customer: shipping should be free.");
  await page.getByLabel("Text to hide").fill("private-customer");
  await expect(page.getByLabel("Debugging report preview")).not.toHaveValue(
    /private-customer/,
  );
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await page.getByRole("button", { name: "Copy debugging report" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Copied. Paste" }),
  ).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("read_file");
  expect(copied).not.toContain("private-customer");
  await page
    .getByLabel("What happened, and what did you expect?")
    .fill("Changed observation");
  await expect(
    page.getByRole("button", { name: "Copy debugging report" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  expect((await download).suggestedFilename()).toBe(
    "agent-rewind-debugging-report.md",
  );
  expect(writes).toEqual([]);
  await page.reload();
  await expect(page.getByLabel("Playback speed", { exact: true })).toHaveValue(
    "2",
  );
});

test("Factory requires source selection, new imports survive reload, and settings fit mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page
    .getByRole("button", { name: "Settings & sources", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Factory Result summary only" })
    .click();
  await expect(
    page.getByRole("region", { name: "Factory import instructions" }),
  ).toContainText("not implemented");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Open Factory result" }).click();
  await (
    await chooser
  ).setFiles({
    name: "result.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        type: "result",
        subtype: "success",
        is_error: false,
        result: "Synthetic result only",
        duration_ms: 10,
      }),
    ),
  });
  await expect(
    page.getByRole("heading", { name: "Imported Factory run", exact: false }),
  ).toBeVisible();
  // An API outage must not hide recordings already saved in this browser.
  await page.route("**/api/examples", (route) => route.abort());
  await page.reload();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page
    .getByRole("button", { name: "Settings & sources", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Custom / Python Portable Rewind v1" })
    .click();
  await expect(
    page.getByRole("button", { name: "Download tape template" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator("dialog")
      .evaluate((e) => e.scrollWidth <= e.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "Manage local recordings" }).click();
  await expect(page.locator("dialog")).toContainText("Imported Factory run");
});

test("new source imports remain browser-local and display explicit capture gaps", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "read_policy()", exact: true }),
  ).toBeVisible();
  const requests: string[] = [];
  // Loading the local worker's script/modules is allowed; recording data must
  // never cause an API request or a write to any endpoint.
  page.on("request", (r) => {
    if (r.method() !== "GET" || new URL(r.url()).pathname.startsWith("/api/"))
      requests.push(r.url());
  });
  const cases = [
    {
      name: "claude.jsonl",
      text: JSON.stringify({
        type: "assistant",
        uuid: "fixture-1",
        message: {
          content: [{ type: "text", text: "Synthetic Claude recording" }],
        },
      }),
      heading: "Imported Claude Code run",
    },
    {
      name: "n8n.json",
      text: JSON.stringify({
        status: "success",
        data: {
          resultData: {
            runData: { Test: [{ data: { main: [[{ json: { value: 1 } }]] } }] },
          },
        },
      }),
      heading: "Imported n8n run",
    },
  ];
  for (const entry of cases) {
    await page.locator("input[type=file]").setInputFiles({
      name: entry.name,
      mimeType: "application/json",
      buffer: Buffer.from(entry.text),
    });
    await expect(
      page.getByRole("heading", { name: entry.heading, exact: false }),
    ).toBeVisible();
    await expect(page.locator(".run-meta")).toContainText("Duration unknown");
  }
  expect(requests).toEqual([]);
});
