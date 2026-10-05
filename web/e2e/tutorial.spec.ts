import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

test.use({ storageState: { cookies: [], origins: [] } });

test("guided investigation selects actual evidence and opens a reviewed report without paid requests", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Understand what went wrong. Bring evidence back to your agent.",
    }),
  ).toBeVisible();
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(r.url());
  });
  await page.getByRole("button", { name: "Try the guided example" }).click();
  const guide = page.getByRole("region", { name: "Guided investigation" });
  await expect(guide).toContainText("What did the agent read?");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".inspector")).toContainText("strictly above");
  await guide.getByRole("button", { name: "See the code change" }).click();
  await expect(page.locator(".inspector .diff-after")).toContainText(
    "subtotal > 50",
  );
  await guide.getByRole("button", { name: "See the failed check" }).click();
  await expect(page.locator(".inspector")).toContainText("acceptance_tests()");
  await expect(page.locator(".inspector")).toContainText('"actual": 5');
  await guide
    .getByRole("button", { name: "Compare the corrected run" })
    .click();
  await expect(page.locator(".paired-evidence")).toContainText("archived-v1");
  await expect(page.locator(".paired-evidence")).toContainText("current-v2");
  await guide
    .getByRole("button", { name: "Prepare a debugging report" })
    .click();
  await guide.getByRole("button", { name: "Open example report" }).click();
  await expect(page.getByRole("dialog")).toContainText("acceptance_tests");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await guide.getByRole("button", { name: "Previous step" }).click();
  await expect(page.locator(".paired-evidence")).toContainText("current-v2");
  await guide.getByRole("button", { name: "Finish guide & explore" }).click();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "First-use welcome" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Quick start", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Meet Agent Rewind" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try the guided example" }).click();
  await expect(guide).toContainText("Step 1 of 5");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Quick start", exact: true }),
  ).toHaveCSS("font-size", "12px");
  expect(writes).toEqual([]);
});

test("returning visitors see the new welcome and can find source setup directly", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("rewind.tutorial.dismissed.v1", "true"),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Open my own agent log" }).click();
  await expect(page.getByRole("dialog")).toContainText("Recording sources");
  await page
    .getByRole("button", { name: "First-use tutorial", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Guided investigation" }),
  ).toContainText("Step 1 of 5");
});

test("unavailable examples do not start a broken tour or block local import", async ({
  page,
}) => {
  await page.route("**/api/examples", (r) =>
    r.fulfill({ status: 503, json: { detail: "Examples unavailable" } }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Try the guided example" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Quick start", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Open my own agent log" }).click();
  await expect(page.getByRole("dialog")).toContainText("Recording sources");
});

test("welcome is skippable, shown once, and can be reopened or escaped", async ({
  page,
}) => {
  await page.goto("/");
  const welcome = page.getByRole("dialog", { name: "Meet Agent Rewind" });
  await expect(welcome).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const bounds = await welcome.boundingBox();
  expect(bounds!.width).toBeLessThanOrEqual(390);
  expect(bounds!.height).toBeLessThanOrEqual(844);
  await page.getByRole("button", { name: "Skip for now" }).click();
  await expect(welcome).toHaveCount(0);
  await expect(page.locator(".main .tutorial-welcome")).toHaveCount(0);
  await page.reload();
  await expect(welcome).toHaveCount(0);
  await page.getByRole("button", { name: "Quick start", exact: true }).click();
  await expect(welcome).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(welcome).toHaveCount(0);
  await page.getByRole("button", { name: "Quick start", exact: true }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await expect(welcome).toHaveCount(0);
});

test("a shared clip opens directly without the welcome popup", async ({
  page,
}) => {
  const tape = JSON.parse(readFileSync("../examples/stale.json", "utf8"));
  await page.route("**/api/clips/tutorial-share", (r) =>
    r.fulfill({ json: tape }),
  );
  await page.goto("/?clip=tutorial-share");
  await expect(
    page.getByRole("heading", { name: "checkout-flow" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Quick start", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Meet Agent Rewind" }),
  ).toBeVisible();
});
