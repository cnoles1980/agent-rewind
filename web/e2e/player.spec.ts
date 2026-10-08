import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test("report navigation keeps evidence review and restores keyboard focus", async ({
  page,
}) => {
  await page.goto("/");
  let analysisCalls = 0;
  await page.route("**/api/analyses", (route) => {
    analysisCalls++;
    return route.abort();
  });
  const opener = page.getByRole("button", {
    name: "Analyze with Nemotron",
    exact: true,
  });
  await opener.click();
  await expect(page.getByText(/Evidence ends at read_policy/)).toBeVisible();
  const continueButton = page.getByRole("button", {
    name: "Continue to analysis",
    exact: true,
  });
  await expect(continueButton).toBeDisabled();
  await page.getByRole("button", { name: "View analysis options" }).click();
  await expect(
    page.getByRole("heading", { name: "Analyze with Nemotron", level: 3 }),
  ).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Analyze selected evidence" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await expect(
    page.getByRole("button", { name: "Copy debugging report", exact: true }),
  ).toBeEnabled();
  await continueButton.click();
  await expect(
    page.getByLabel("Analysis options", { exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Analyze with Nemotron", level: 3 }),
  ).toBeInViewport();
  expect(analysisCalls).toBe(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("new live evidence invalidates clip review before export or sharing", async ({
  page,
}) => {
  const tape = JSON.parse(readFileSync("../examples/stale.json", "utf8"));
  tape.run.name = "Updating live fixture";
  let updated = false;
  let initial = true;
  await page.route("**/api/status", (r) =>
    r.fulfill({
      json: { authenticated: true, live_available: false, blockers: [] },
    }),
  );
  await page.route("**/api/demo-runs", (r) =>
    r.fulfill({ json: [{ id: "review-update", status: "running" }] }),
  );
  await page.route("**/api/demo-runs/review-update", (r) => {
    // No fresh tape until the test simulates new evidence, avoiding a timing race.
    const includeTape = initial || updated;
    initial = false;
    return r.fulfill({
      json: { status: "running", ...(includeTape ? { tape } : {}) },
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Updating live fixture" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clip & share" }).click();
  const review = page.getByRole("checkbox", { name: "I reviewed" });
  await review.check();
  await expect(page.getByRole("button", { name: "Export clip" })).toBeEnabled();
  tape.events.find((e: any) => e.kind === "tool.end").data.output =
    "New evidence arrived after review";
  updated = true;
  await expect(review).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Export clip" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Create share" }),
  ).toBeDisabled();
});
test("investigates policy evidence, paired differences, notes, and a reviewed clip", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "read_policy()", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".inspector")).toContainText("strictly above");
  await page.getByRole("button", { name: "First behavior difference" }).click();
  await expect(page.locator(".paired-evidence")).toContainText("archived-v1");
  await expect(page.locator(".paired-evidence")).toContainText("current-v2");
  await page.getByRole("button", { name: "Add a note", exact: true }).click();
  await page
    .getByRole("textbox", { name: "What should you remember?" })
    .fill("Check the threshold boundary");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.locator(".notes-at-event")).toContainText(
    "Check the threshold boundary",
  );
  await page.getByRole("button", { name: "Edit note" }).last().click();
  await page
    .getByRole("textbox", { name: "What should you remember?" })
    .fill("Threshold confirmed");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.locator(".notes-at-event")).toContainText(
    "Threshold confirmed",
  );
  await page.getByRole("button", { name: "Clip & share" }).click();
  await expect(
    page.getByRole("button", { name: "Export clip" }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "I reviewed" }).check();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export clip" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.jsonl$/);
});
test("personal import, search and replay make no upload or execution request; HTML stays inert", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "read_policy()", exact: true }),
  ).toBeVisible();
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(r.url());
  });
  const tape = JSON.parse(readFileSync("../examples/stale.json", "utf8"));
  tape.run.id = "private-local";
  tape.run.source = "python";
  tape.run.name = "<img src=x onerror=alert(1)>";
  for (const e of tape.events) e.run_id = tape.run.id;
  for (const n of tape.notes) n.run_id = tape.run.id;
  await page.locator("input[type=file]").setInputFiles({
    name: "private.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(tape)),
  });
  await expect(
    page.getByRole("heading", {
      name: "<img src=x onerror=alert(1)>",
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.locator("h1 img")).toHaveCount(0);
  await page.getByLabel("Search this run").fill("read_policy");
  await expect(page.locator(".event-row")).toHaveCount(6);
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await page
    .getByRole("button", { name: "Play recording", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pause playback", exact: true })
    .click();
  expect(writes).toEqual([]);
  await page.reload();
  await expect(page.locator(".recent")).toContainText([
    "<img src=x onerror=alert(1)>",
  ]);
});
test("1,000-event selection and scrubbing stay responsive", async ({
  page,
}) => {
  const tape = JSON.parse(readFileSync("../examples/stale.json", "utf8")),
    base = tape.events.find((e: any) => e.kind === "message") ?? tape.events[0];
  tape.run.id = "performance";
  tape.run.name = "Performance fixture";
  tape.run.duration_ms = 100000;
  tape.notes = [];
  tape.events = Array.from({ length: 1000 }, (_, i) => ({
    ...base,
    id: "p" + i,
    run_id: "performance",
    seq: i,
    elapsed_ms: i * 100,
    kind: "message",
    lane: "model",
    name: "Event " + i,
    data: { content: "Synthetic performance fixture" },
  }));
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({
    name: "1000.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(tape)),
  });
  await expect(
    page.getByRole("heading", { name: "Performance fixture", exact: false }),
  ).toBeVisible();
  const samples = await page.evaluate(async () => {
    const input = document.querySelector(
      'input[aria-label="Timeline playhead"]',
    ) as HTMLInputElement;
    const samples: number[] = [];
    for (const value of [25000, 50000, 75000]) {
      const start = performance.now();
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, String(value));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      samples.push(performance.now() - start);
    }
    return samples;
  });
  console.log("1,000-event scrub paint times (ms):", samples);
  expect(Math.max(...samples)).toBeLessThan(100);
});
test("mobile viewport keeps controls within the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open recording", exact: true }),
  ).toBeVisible();
  const workspace = page.getByRole("button", {
    name: "Workspace",
    exact: true,
  });
  await workspace.click();
  await expect(
    page.getByRole("button", { name: "Settings & sources", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "checkout-flow Example · corrected",
      exact: true,
    })
    .click();
  await expect(workspace).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".run-meta")).toContainText("success");
  await workspace.click();
  await page.getByRole("button", { name: "Quick start", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(workspace).toHaveAttribute("aria-expanded", "false");
  await expect(workspace).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
