import { test, expect } from "@playwright/test";

test("first-use guide is local, dismissible, and discoverable again in settings", async ({
  page,
}) => {
  await page.goto("/");
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") writes.push(r.url());
  });
  await page.getByRole("button", { name: "Start tutorial" }).click();
  await expect(
    page.getByRole("heading", { name: "Start with the example", exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 5; i++)
    await page.getByRole("button", { name: "Next step" }).click();
  await expect(
    page.getByRole("heading", { name: "Share only reviewed evidence" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Dismiss welcome" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start tutorial" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Settings & sources", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "First-use tutorial", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Start with the example", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(writes).toEqual([]);
});
