import { test, expect } from "@playwright/test";

test("deep zoom centers the selected moment, preserves readable lanes, and fits back", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "read_policy()", exact: true }),
  ).toBeVisible();
  const timeline = page.locator(".timeline-scroll");
  await page.getByLabel("Timeline zoom").selectOption("64");
  await expect(page.getByLabel("Timeline zoom")).toHaveValue("64");
  const zoomed = await timeline.evaluate((el) => {
    const marker = el
      .querySelector(".timeline-playhead")!
      .getBoundingClientRect();
    const viewport = el.getBoundingClientRect();
    return {
      width: el.scrollWidth,
      viewport: el.clientWidth,
      scroll: el.scrollLeft,
      markerVisible: marker.x > viewport.x + 126 && marker.x < viewport.right,
      svgHeight: el.querySelector("svg")!.getBoundingClientRect().height,
    };
  });
  expect(zoomed.width).toBeGreaterThan(zoomed.viewport * 50);
  expect(zoomed.scroll).toBeGreaterThan(0);
  expect(zoomed.markerVisible).toBe(true);
  expect(zoomed.svgHeight).toBe(350);
  await page.getByRole("button", { name: "Next event", exact: true }).click();
  await expect(
    page.getByLabel("Timeline playhead", { exact: true }),
  ).toHaveValue("23500");
  await page.getByLabel("Timeline zoom").selectOption("1");
  expect(
    await timeline.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("observed differences precede the timeline and expand paired evidence on demand", async ({
  page,
}) => {
  await page.goto("/");
  const panel = page.getByRole("region", {
    name: "Observed differences",
    exact: true,
  });
  await expect(
    panel.getByRole("heading", { name: "Observed Differences" }),
  ).toBeVisible();
  await expect(panel).toContainText("5 evidence differences");
  expect((await panel.boundingBox())!.y).toBeLessThan(
    (await page.locator(".studio").boundingBox())!.y,
  );
  await expect(page.locator(".comparison-main")).toHaveCount(0);
  await panel
    .getByRole("button", { name: "Jump to first behavior difference" })
    .click();
  await expect(panel.locator(".paired-evidence")).toContainText("archived-v1");
  await expect(panel.locator(".paired-evidence")).toContainText("current-v2");
  await panel.getByRole("button", { name: "Hide A/B evidence" }).click();
  await expect(page.locator(".comparison-main")).toHaveCount(0);
});
