import { test, expect } from "@playwright/test";

const publicStatus = {
  authenticated: false,
  analysis_available: true,
  analysis_blockers: [],
  study_supported: true,
  live_available: false,
  blockers: [],
};

test("slow status still offers setup after welcome is skipped", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.removeItem("rewind.welcome.seen.v1"),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/status", async (route) => {
    await gate;
    await route.fulfill({ json: publicStatus });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip for now" }).click();
  release();
  await expect(
    page.getByRole("dialog", { name: "Set up AI access" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Invitation code", { exact: true }),
  ).toBeVisible();
});

test("session setup accepts a code, handles errors, and remembers access without paid calls", async ({
  page,
}) => {
  let signedIn = false;
  let attempts = 0;
  let paid = 0;
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { ...publicStatus, authenticated: signedIn } }),
  );
  await page.route("**/api/session", (r) => {
    attempts++;
    if (attempts === 1)
      return r.fulfill({
        status: 401,
        json: { detail: "Invalid invitation code" },
      });
    signedIn = true;
    return r.fulfill({ json: { authenticated: true } });
  });
  await page.route("**/api/analyses", (r) => {
    paid++;
    return r.abort();
  });
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Set up AI access" }),
  ).toBeVisible();
  await page
    .getByLabel("Invitation code", { exact: true })
    .fill("synthetic-owner-code");
  await page.getByRole("button", { name: "Unlock AI analysis" }).click();
  await expect(page.getByRole("alert")).toHaveText("Invalid invitation code");
  await page.getByRole("button", { name: "Unlock AI analysis" }).click();
  await page.getByRole("button", { name: "Continue to workspace" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Analyze with Nemotron", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Analyze with Nemotron", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Invitation code", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await expect(
    page.getByRole("button", { name: "Send to Nemotron", exact: true }),
  ).toBeEnabled();
  expect(paid).toBe(0);
});

test("skipping setup preserves free use; analysis has only an access reminder", async ({
  page,
}) => {
  await page.route("**/api/status", (r) => r.fulfill({ json: publicStatus }));
  await page.goto("/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Continue without a code" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Analyze with Nemotron", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Analyze with Nemotron", exact: true })
    .click();
  await expect(page.getByText(/AI access is locked/)).toBeVisible();
  await expect(page.getByLabel("Invitation code", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await expect(
    page.getByRole("button", { name: "Copy debugging report" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Send to Nemotron", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("first-use welcome includes code entry without a second prompt", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.removeItem("rewind.welcome.seen.v1"),
  );
  await page.route("**/api/status", (r) => r.fulfill({ json: publicStatus }));
  await page.goto("/");
  await expect(
    page.getByRole("dialog", { name: "Meet Agent Rewind" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Invitation code", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try an example" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Guided investigation" }),
  ).toBeVisible();
});

test("an expired session disables analysis and points to setup without submitting", async ({
  page,
}) => {
  let signedIn = true;
  await page.route("**/api/status", (r) =>
    r.fulfill({ json: { ...publicStatus, authenticated: signedIn } }),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Settings & sources", exact: true })
    .click();
  await expect(
    page.getByText("You’re signed in.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  signedIn = false;
  await page
    .getByRole("button", { name: "Analyze with Nemotron", exact: true })
    .click();
  await expect(page.getByText(/AI access is locked/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send to Nemotron", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "Settings & sources", exact: true })
    .click();
  await page.getByRole("button", { name: "Manage invitation access" }).click();
  await expect(
    page.getByLabel("Invitation code", { exact: true }),
  ).toBeVisible();
});
