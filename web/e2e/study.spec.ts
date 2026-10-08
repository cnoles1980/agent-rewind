import { test, expect } from "@playwright/test";

test("tester invitation, explicit feedback, retry identity, no automatic attachments and mobile layout", async ({
  page,
}) => {
  let signedIn = false;
  const posts: Record<string, unknown>[] = [];
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        study_supported: true,
        authenticated: signedIn,
        role: signedIn ? "tester" : null,
        study: signedIn ? { label: "Tester A", remaining_calls: 0 } : null,
      },
    }),
  );
  await page.route("**/api/session", (route) => {
    signedIn = true;
    return route.fulfill({ json: { role: "tester" } });
  });
  await page.route("**/api/study/feedback", (route) => {
    posts.push(route.request().postDataJSON());
    return posts.length === 1
      ? route.fulfill({
          status: 503,
          json: { detail: "Connection interrupted; try again" },
        })
      : route.fulfill({ status: 201, json: { saved: true } });
  });
  await page.goto("http://127.0.0.1:8766/");
  await page
    .getByLabel("Invitation code", { exact: true })
    .fill("synthetic-tester-invitation");
  await page
    .getByRole("button", { name: "Unlock AI analysis", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue to workspace" }).click();
  await page.getByRole("button", { name: "Feedback", exact: true }).click();
  await expect(
    page.getByText("0 analysis attempts remain", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("How useful was Rewind?").selectOption("4");
  await page
    .getByLabel("What worked, what was confusing, or what went wrong?")
    .fill("The policy was clear; compare controls were hard to find.");
  const send = page.getByRole("button", { name: "Send feedback", exact: true });
  await expect(send).toBeDisabled();
  await page.getByRole("checkbox", { name: "I reviewed this message" }).check();
  await send.click();
  await expect(page.getByRole("status")).toContainText(
    "Connection interrupted",
  );
  expect(posts).toHaveLength(1);
  expect(Object.keys(posts[0]).sort()).toEqual([
    "id",
    "message",
    "rating",
    "reviewed",
  ]);
  await send.click();
  await expect(page.getByRole("status")).toContainText("Feedback saved");
  expect(posts[1]).toEqual(posts[0]);
  await expect(
    page.getByLabel("What worked, what was confusing, or what went wrong?"),
  ).toHaveValue("");
  await expect(
    page.getByRole("checkbox", { name: "I reviewed this message" }),
  ).not.toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("owner reads inert feedback and revokes access without seeing raw codes", async ({
  page,
}) => {
  let revoked = 0;
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        study_supported: true,
        authenticated: true,
        role: "owner",
        study: null,
      },
    }),
  );
  await page.route("**/api/study", (route) =>
    route.fulfill({
      json: {
        group_reserved_cents: 25,
        invitations: [
          { id: "a".repeat(64), label: "Tester A", revoked, calls: 1 },
        ],
        feedback: [
          {
            id: "b".repeat(32),
            label: "Tester A",
            created: Date.now(),
            rating: 3,
            message: "<img src=x onerror=alert(1)> confusing toolbar",
          },
        ],
      },
    }),
  );
  await page.route("**/api/study/invitations/*", (route) => {
    expect(route.request().method()).toBe("DELETE");
    revoked = 1;
    return route.fulfill({ json: { revoked: true } });
  });
  await page.goto("http://127.0.0.1:8766/");
  await page.getByRole("button", { name: "Feedback", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Owner inbox" }),
  ).toBeVisible();
  await expect(page.locator(".study-message")).toContainText("<img");
  await expect(page.locator(".study-panel img")).toHaveCount(0);
  await page.getByRole("button", { name: "Revoke Tester A" }).click();
  await expect(
    page.getByRole("button", { name: "Revoke Tester A" }),
  ).toHaveCount(0);
  await expect(page.locator(".study-entry").first()).toContainText("Revoked");
  expect(revoked).toBe(1);
});

test("exhausted study allowance is visible in analysis and prevents sending", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/status", (route) =>
    route.fulfill({
      json: {
        study_supported: true,
        authenticated: true,
        role: "tester",
        analysis_available: true,
        model: "Nemotron",
        study: { label: "Tester A", remaining_calls: 0 },
      },
    }),
  );
  await page.route("**/api/analyses", (route) => {
    calls++;
    return route.abort();
  });
  await page.goto("http://127.0.0.1:8766/");
  await page
    .getByRole("button", { name: "Analyze with Nemotron", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await expect(
    page.getByText("0 analysis attempts remain", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Send to Nemotron",
      exact: true,
    }),
  ).toBeDisabled();
  expect(calls).toBe(0);
});
