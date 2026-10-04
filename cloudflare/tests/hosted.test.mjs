import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const hash = (s) => createHash("sha256").update(s).digest("hex");
const origin = "https://rewind.test",
  tester = "synthetic-tester-invitation",
  judge = "synthetic-judge-invitation";
const persistence = mkdtempSync(join(tmpdir(), "rewind-worker-"));
let mf,
  calls = 0,
  lastRequest,
  providerMode = "ok",
  release;
const result = {
  facts: [{ text: "The policy says above $50.", event_ids: ["e1"] }],
  hypotheses: [],
  missing_evidence: ["The current implementation was not supplied."],
  verification_steps: ["Run the unchanged boundary test."],
  repair_prompt: "Inspect the shipping boundary and test a minimal correction.",
};
function options() {
  const converted = convertV4MiniflareOptions({
    name: "agent-rewind-test",
    modules: true,
    scriptPath: "dist/index.js",
    compatibilityDate: "2026-10-03",
    compatibilityFlags: ["nodejs_compat"],
    durableObjects: Object.fromEntries(
      [
        ["LEDGER", "BudgetLedger"],
        ["ACCESS", "AccessState"],
        ["CLIPS", "ClipStore"],
      ].map(([key, className]) => [key, { className, useSQLite: true }]),
    ),
    durableObjectsPersist: persistence,
    bindings: {
      ORIGIN: origin,
      MODEL: "nvidia/Nemotron-3_5-Lightning",
      ANALYSIS_ENABLED: "true",
      ANALYSIS_PRICES_VERIFIED: "true",
      NEBIUS_API_KEY: "synthetic-server-secret-12345",
      TESTER_CODE_HASH: hash(tester),
      JUDGE_CODE_HASH: hash(judge),
      INITIAL_TESTER_CENTS: "175",
      INITIAL_JUDGE_CENTS: "0",
    },
    serviceBindings: {
      ASSETS: () =>
        new Response("<html>Rewind</html>", {
          headers: { "Content-Type": "text/html" },
        }),
    },
    outboundService: async (request) => {
      assert.equal(
        request.url,
        "https://api.tokenfactory.nebius.com/v1/chat/completions",
      );
      calls++;
      lastRequest = await request.json();
      if (providerMode === "hold")
        await new Promise((resolve) => {
          release = resolve;
        });
      if (providerMode === "failure")
        return new Response("secret provider error", { status: 500 });
      const answer = structuredClone(result);
      if (providerMode === "bad-citation")
        answer.facts[0].event_ids = ["not-reviewed"];
      return Response.json({
        choices: [
          {
            finish_reason: "stop",
            message: { content: JSON.stringify(answer) },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          forbidden: "private",
        },
      });
    },
  });
  return { ...converted, resourcePersistencePath: persistence, unsafeInspectDurableObjects: true };
}
const api = (path, method = "GET", body, cookie, extra = {}) =>
  mf.dispatchFetch(origin + "/api" + path, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
async function login(code = tester) {
  const response = await api("/session", "POST", { code });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  return cookie.split(";")[0];
}
const analysis = (key) => ({
  evidence:
    "e1: Policy says free shipping above $50. expected behavior: free at $50. api_key=synthetic-secret-value",
  event_ids: ["e1"],
  reviewed: true,
  idempotency_key: key,
});
before(async () => {
  mf = new Miniflare(options());
  await mf.ready;
});
after(async () => {
  await mf?.dispose();
  rmSync(persistence, { recursive: true, force: true });
});

test("public access, exact origin, session isolation, and honest live execution gate", async () => {
  const status = await (await api("/status")).json();
  assert.equal(status.authenticated, false);
  assert.equal(status.budget_reserved_cents, null);
  assert.equal(status.live_available, false);
  assert.equal(
    (await api("/analyses", "POST", analysis("unauthorized"))).status,
    401,
  );
  assert.equal(
    (
      await api("/session", "POST", { code: tester }, undefined, {
        Origin: "https://hostile.test",
      })
    ).status,
    403,
  );
  const cookie = await login();
  assert.equal(
    (await (await api("/status", "GET", undefined, cookie)).json()).role,
    "tester",
  );
  assert.equal((await api("/demo-runs", "POST", {}, cookie)).status, 503);
  assert.equal(
    (await api("/demo-runs/foreign", "GET", undefined, cookie)).status,
    404,
  );
  await api("/session", "DELETE", undefined, cookie);
  assert.equal(
    (await (await api("/status", "GET", undefined, cookie)).json())
      .authenticated,
    false,
  );
});
test("analysis validates, redacts, rejects replay, and reserves prior spending", async () => {
  const cookie = await login();
  const before = await (await api("/status", "GET", undefined, cookie)).json();
  assert.equal(before.budget_reserved_cents.tester, 175);
  assert.equal(
    (
      await api(
        "/analyses",
        "POST",
        { ...analysis("bad-review"), reviewed: false },
        cookie,
      )
    ).status,
    422,
  );
  const r = await api("/analyses", "POST", analysis("first-analysis"), cookie);
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).analysis, result);
  assert.doesNotMatch(JSON.stringify(lastRequest), /synthetic-secret-value/);
  const charged = calls;
  assert.equal(
    (await api("/analyses", "POST", analysis("first-analysis"), cookie)).status,
    409,
  );
  assert.equal(calls, charged);
  const status = await (await api("/status", "GET", undefined, cookie)).json();
  assert.equal(status.budget_reserved_cents.tester, 200);
  assert.equal(status.total_reserved_cents, 3200);
});
test("concurrent sessions cannot admit two model calls", async () => {
  const a = await login(),
    b = await login();
  providerMode = "hold";
  const pending = api("/analyses", "POST", analysis("concurrent-first"), a);
  for (let i = 0; !release && i < 100; i++)
    await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(release);
  try {
    assert.equal(
      (await api("/analyses", "POST", analysis("concurrent-second"), b)).status,
      409,
    );
  } finally {
    release();
    release = undefined;
    providerMode = "ok";
  }
  assert.equal((await pending).status, 200);
});
test("provider errors and fabricated citations fail safely with reservations retained", async () => {
  const cookie = await login();
  for (const mode of ["failure", "bad-citation"]) {
    providerMode = mode;
    const response = await api(
      "/analyses",
      "POST",
      analysis("provider-" + mode),
      cookie,
    );
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /secret provider error/);
  }
  providerMode = "ok";
  const status = await (await api("/status", "GET", undefined, cookie)).json();
  assert.equal(status.budget_reserved_cents.tester, 275);
});
test("reviewed clip publication, redaction, persistence, anonymous read, and revocation", async () => {
  const cookie = await login(),
    tape = JSON.parse(readFileSync("../examples/stale.json", "utf8"));
  assert.equal((await api("/clips", "POST", tape, cookie)).status, 422);
  tape.run.source = "clip";
  tape.run.configuration.reviewed = true;
  tape.run.configuration.api_key = "seeded-private-key";
  // Exercise chunking with inert hostile text and a payload larger than one storage value.
  tape.events[0].data.payload =
    "<script>alert(1)</script>" + "x".repeat(160_000);
  const response = await api("/clips", "POST", tape, cookie);
  assert.equal(response.status, 201);
  const shared = await response.json();
  assert.equal(
    (await api("/clips/" + shared.token, "DELETE", undefined, cookie)).status,
    404,
  );
  await mf.dispose();
  mf = new Miniflare(options());
  await mf.ready;
  const saved = await api("/clips/" + shared.token);
  assert.equal(saved.status, 200);
  assert.match(saved.headers.get("content-type"), /application\/json/);
  assert.equal(saved.headers.get("cache-control"), "no-store");
  const content = await saved.text();
  assert.doesNotMatch(content, /seeded-private-key/);
  assert.match(content, /<script>/);
  const status = await (await api("/status", "GET", undefined, cookie)).json();
  assert.equal(status.budget_reserved_cents.tester, 275);
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await api("/clips/" + shared.token, "DELETE", undefined, undefined, {
          "x-clip-management": shared.manage_token,
        })
      ).status,
      200,
    );
  assert.equal((await api("/clips/" + shared.token)).status, 404);
});
test("bounded malformed input and login throttling", async () => {
  const cookie = await login(judge);
  assert.equal(
    (
      await api(
        "/analyses",
        "POST",
        { ...analysis("too-big-evidence"), evidence: "é".repeat(30_000) },
        cookie,
      )
    ).status,
    422,
  );
  assert.equal(
    (await api("/clips", "POST", { huge: "x".repeat(2 * 1024 * 1024) }, cookie))
      .status,
    413,
  );
  for (let i = 0; i < 10; i++)
    await api("/session", "POST", { code: "invalid-invitation" }, undefined, {
      "CF-Connecting-IP": "192.0.2.2",
    });
  assert.equal(
    (
      await api("/session", "POST", { code: tester }, undefined, {
        "CF-Connecting-IP": "192.0.2.2",
      })
    ).status,
    429,
  );
});

test("tester budget exhaustion preserves judge allowance and crash reservations", async () => {
  const storage = await mf.unsafeGetDurableObjectStorage(
    "agent-rewind-test", "BudgetLedger", { name: "rewind-hackathon-2026" },
  );
  await storage.exec("UPDATE baseline SET cents=1975-(SELECT COUNT(*)*25 FROM analyses WHERE role='tester') WHERE role='tester'");
  const cookie = await login();
  assert.equal((await api("/analyses", "POST", analysis("last-tester-slot"), cookie)).status, 200);
  const count = calls;
  assert.equal((await api("/analyses", "POST", analysis("exhausted-budget"), cookie)).status, 409);
  assert.equal(calls, count);
  await storage.exec("INSERT INTO analyses VALUES('interrupted-owner','crashed-request','judge','running',?,NULL)", Date.now() - 100_000);
  const judgeCookie = await login(judge);
  assert.equal((await api("/analyses", "POST", analysis("judge-after-crash"), judgeCookie)).status, 200);
  const status = await (await api("/status", "GET", undefined, judgeCookie)).json();
  assert.equal(status.budget_reserved_cents.tester, 2000);
  assert.equal(status.budget_reserved_cents.judge, 50);
  assert.equal(status.budget_alert, 50);
  const rows = await storage.exec("SELECT * FROM analyses");
  assert.equal(rows.find(r => r.idem === "crashed-request").status, "interrupted");
  assert.doesNotMatch(JSON.stringify(rows), /synthetic-secret-value|policy says|repair_prompt|shipping/);
});
