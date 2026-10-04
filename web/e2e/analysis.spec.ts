import { test, expect } from "@playwright/test";

test("redacted event references never leave in analysis metadata", async ({
  page,
}) => {
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  let sent = 0;
  await page.route("**/api/analyses", (r) => {
    sent++;
    return r.abort();
  });
  await page.goto("http://127.0.0.1:8766/");
  await page.getByRole("button", { name: "Debug report", exact: true }).click();
  const preview = await page
    .getByLabel("Debugging report preview")
    .inputValue();
  const ids = [...preview.matchAll(/"event": "([^"]+)"/g)].map((m) => m[1]);
  expect(ids.length).toBeGreaterThan(0);
  await page.getByLabel("Additional text to redact").fill(ids.join("\n"));
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await page
    .getByRole("checkbox", { name: "Send this reviewed excerpt" })
    .check();
  await expect(
    page.getByRole("button", {
      name: "Analyze selected evidence",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText(
    "All event references were redacted",
  );
  expect(sent).toBe(0);
});

test("editing during inference discards the old response", async ({ page }) => {
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received!: () => void;
  const started = new Promise<void>((resolve) => {
    received = resolve;
  });
  await page.route("**/api/analyses", async (r) => {
    received();
    await gate;
    await r
      .fulfill({ json: response(r.request().postDataJSON().event_ids.at(-1)) })
      .catch(() => {});
  });
  await page.goto("http://127.0.0.1:8766/");
  await page.getByRole("button", { name: "Debug report", exact: true }).click();
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await page
    .getByRole("checkbox", { name: "Send this reviewed excerpt" })
    .check();
  await page
    .getByRole("button", { name: "Analyze selected evidence", exact: true })
    .click();
  await started;
  await page
    .getByLabel("What happened, and what did you expect?")
    .fill("New evidence interpretation");
  release();
  await expect(
    page.getByRole("button", {
      name: "Analyze selected evidence",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Observed facts", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Send this reviewed excerpt" }),
  ).not.toBeChecked();
});

const status = {
  authenticated: true,
  analysis_available: true,
  analysis_blockers: [],
  model: "nvidia/Nemotron-3_5-Lightning",
  live_available: false,
  blockers: [],
};
function response(id: string) {
  return {
    model: status.model,
    provider: "Nebius Token Factory",
    usage: { total_tokens: 100 },
    analysis: {
      facts: [
        {
          text: "The policy says strictly above $50. <img src=x onerror=alert(1)>",
          event_ids: [id],
        },
      ],
      hypotheses: [
        {
          text: "The boundary may be excluded; this is not proven.",
          event_ids: [id],
        },
      ],
      missing_evidence: [
        "The selected excerpt does not show the later acceptance test.",
      ],
      verification_steps: ["Inspect the immutable $50 assertion."],
      repair_prompt:
        "Check current code and test the $50 boundary. Change only what the evidence supports.",
    },
  };
}

test("reviewed Nemotron excerpt, safe cited findings, handoff, and event navigation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  const requests: any[] = [];
  await page.route("**/api/analyses", async (route) => {
    const body = route.request().postDataJSON();
    requests.push(body);
    await route.fulfill({ json: response(body.event_ids.at(-1)) });
  });
  await page.goto("http://127.0.0.1:8766/");
  await page.getByRole("button", { name: "Debug report", exact: true }).click();
  await page
    .getByLabel("What happened, and what did you expect?")
    .fill("customer-private expected free shipping");
  await page.getByLabel("Additional text to redact").fill("customer-private");
  const analyze = page.getByRole("button", {
    name: "Analyze selected evidence",
    exact: true,
  });
  await expect(analyze).toBeDisabled();
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await expect(analyze).toBeDisabled();
  expect(requests).toHaveLength(0);
  await page
    .getByRole("checkbox", { name: "Send this reviewed excerpt" })
    .check();
  const preview = await page
    .getByLabel("Debugging report preview")
    .inputValue();
  await analyze.click();
  await expect(
    page.getByRole("heading", { name: "Observed facts", exact: true }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  await expect(analyze).toBeDisabled();
  await expect(
    page.getByRole("checkbox", { name: "Send this reviewed excerpt" }),
  ).not.toBeChecked();
  expect(requests[0].evidence).toBe(preview);
  expect(JSON.stringify(requests[0])).not.toContain("customer-private");
  expect(requests[0].reviewed).toBe(true);
  await expect(page.locator(".analysis-results img")).toHaveCount(0);
  const copy = page.getByRole("button", {
    name: "Copy analysis & repair prompt",
  });
  await expect(copy).toBeDisabled();
  await page.getByRole("checkbox", { name: "I reviewed the analysis" }).check();
  await copy.click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "not proven causes",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "Do not weaken tests",
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download analysis", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "agent-rewind-nemotron-analysis.md",
  );
  await page
    .getByRole("button", {
      name: `View event ${requests[0].event_ids.at(-1)}`,
      exact: true,
    })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".inspector")).toContainText("read_policy");
});

test("editing evidence clears consent and earlier analysis; failed calls do not retry", async ({
  page,
}) => {
  await page.route("**/api/status", (r) => r.fulfill({ json: status }));
  let count = 0;
  await page.route("**/api/analyses", async (route) => {
    count++;
    if (count === 1)
      await route.fulfill({
        json: response(route.request().postDataJSON().event_ids.at(-1)),
      });
    else
      await route.fulfill({
        status: 502,
        json: { detail: "Nemotron could not return a valid, cited analysis." },
      });
  });
  await page.goto("http://127.0.0.1:8766/");
  await page.getByRole("button", { name: "Debug report", exact: true }).click();
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await page
    .getByRole("checkbox", { name: "Send this reviewed excerpt" })
    .check();
  await page
    .getByRole("button", { name: "Analyze selected evidence", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Observed facts", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("What happened, and what did you expect?")
    .fill("Changed expected behavior");
  await expect(
    page.getByRole("heading", { name: "Observed facts", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("checkbox", { name: "Send this reviewed excerpt" }),
  ).not.toBeChecked();
  await page.getByRole("checkbox", { name: "I reviewed this report" }).check();
  await page
    .getByRole("checkbox", { name: "Send this reviewed excerpt" })
    .check();
  await page
    .getByRole("button", { name: "Analyze selected evidence", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "valid, cited analysis" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Analyze selected evidence",
      exact: true,
    }),
  ).toBeDisabled();
  expect(count).toBe(2);
});
