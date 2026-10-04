import { test, expect } from "@playwright/test";

test("production CSP, invitation, clip publication, anonymous reading and UI revocation", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await page.goto("http://127.0.0.1:8766");
  expect(response?.headers()["content-security-policy"]).not.toContain(
    "unsafe-eval",
  );
  await expect(
    page.getByRole("heading", { name: "read_policy()", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New demo run" }).click();
  await page
    .getByLabel("Invitation code")
    .fill("synthetic-browser-test-credential");
  await page.getByRole("button", { name: "Unlock invited features" }).click();
  await expect(
    page.getByRole("button", { name: "Launch fresh run" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Clip & share" }).click();
  await page.getByRole("checkbox", { name: "I reviewed" }).check();
  await page.getByRole("button", { name: "Create share link" }).click();
  const link = page.getByRole("link", { name: "Open shared clip" });
  await expect(link).toBeVisible();
  const url = (await link.getAttribute("href"))!;
  const guest = await browser.newContext();
  const guestPage = await guest.newPage();
  await guestPage.goto(url);
  await expect(
    guestPage.getByRole("heading", { name: /checkout-flow \/ clip/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Shared clips", exact: true }).click();
  await page.getByRole("button", { name: "Revoke" }).last().click();
  await expect(
    page.getByText("No clips have been shared from this browser."),
  ).toBeVisible();
  const token = new URL(url).searchParams.get("clip");
  expect(
    (
      await guestPage.request.get("http://127.0.0.1:8766/api/clips/" + token)
    ).status(),
  ).toBe(404);
  expect(errors).toEqual([]);
  await guest.close();
});
