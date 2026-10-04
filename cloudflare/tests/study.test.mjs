import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

const origin = "https://rewind.test";
const ownerCode = "synthetic-owner-code",
  legacy = "synthetic-legacy-code",
  judge = "synthetic-judge-code";
const hash = (value) => createHash("sha256").update(value).digest("hex");
async function fixture() {
  const directory = mkdtempSync(join(tmpdir(), "rewind-study-"));
  let calls = 0;
  const options = {
    ...convertV4MiniflareOptions({
      name: "study-test",
      modules: true,
      scriptPath: "dist/index.js",
      compatibilityDate: "2026-10-03",
      compatibilityFlags: ["nodejs_compat"],
      durableObjects: Object.fromEntries(
        ["LEDGER", "ACCESS", "CLIPS"].map((name, i) => [
          name,
          {
            className: ["BudgetLedger", "AccessState", "ClipStore"][i],
            useSQLite: true,
          },
        ]),
      ),
      bindings: {
        ORIGIN: origin,
        MODEL: "nvidia/Nemotron-3_5-Lightning",
        ANALYSIS_ENABLED: "true",
        ANALYSIS_PRICES_VERIFIED: "true",
        NEBIUS_API_KEY: "synthetic-private-key",
        OWNER_CODE_HASH: hash(ownerCode),
        TESTER_CODE_HASH: hash(legacy),
        JUDGE_CODE_HASH: hash(judge),
        INITIAL_TESTER_CENTS: "925",
        INITIAL_JUDGE_CENTS: "0",
      },
      serviceBindings: { ASSETS: () => new Response("Rewind") },
      outboundService: async () => {
        calls++;
        return new Response("synthetic provider failure", { status: 500 });
      },
    }),
    resourcePersistencePath: directory,
    unsafeInspectDurableObjects: true,
  };
  let mf = new Miniflare(options);
  await mf.ready;
  const api = (path, method = "GET", body, cookie, headers = {}) =>
    mf.dispatchFetch(origin + "/api" + path, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const login = async (code) => {
    const r = await api("/session", "POST", { code });
    assert.equal(r.status, 200);
    return r.headers.get("set-cookie").split(";")[0];
  };
  const invite = async (cookie, label) => {
    const r = await api("/study/invitations", "POST", { label }, cookie);
    assert.equal(r.status, 201);
    return r.json();
  };
  return {
    api,
    login,
    invite,
    calls: () => calls,
    restart: async () => {
      await mf.dispose();
      mf = new Miniflare(options);
      await mf.ready;
    },
    close: async () => {
      await mf.dispose();
      rmSync(directory, { recursive: true, force: true });
    },
    storage: () =>
      mf.unsafeGetDurableObjectStorage("study-test", "BudgetLedger", {
        name: "rewind-hackathon-2026",
      }),
  };
}
const request = () => ({
  evidence:
    '```json\n{"event":"e1","evidence":{"output":"AssertionError: expected 0, actual 5"}}\n```',
  event_ids: ["e1"],
  reviewed: true,
  idempotency_key: randomUUID(),
});

test("three invitations share a persistent $5 cap; failed calls count and login cannot reset it", async () => {
  const f = await fixture();
  try {
    const owner = await f.login(ownerCode);
    const invitations = await Promise.all(
      ["A", "B", "C"].map((label) => f.invite(owner, label)),
    );
    const cookies = await Promise.all(invitations.map((i) => f.login(i.code)));
    const before = await (
      await f.api("/status", "GET", undefined, cookies[0])
    ).json();
    assert.equal(before.study.remaining_calls, 20);
    for (let i = 0; i < 19; i++)
      assert.equal(
        (await f.api("/analyses", "POST", request(), cookies[i % 3])).status,
        502,
      );
    const attempts = await Promise.all(
      cookies
        .slice(0, 2)
        .map((cookie) => f.api("/analyses", "POST", request(), cookie)),
    );
    assert.deepEqual(attempts.map((r) => r.status).sort(), [409, 502]);
    assert.equal(f.calls(), 20);
    await f.restart();
    const again = await f.login(invitations[0].code);
    assert.equal(
      (await f.api("/analyses", "POST", request(), again)).status,
      409,
    );
    const after = await (
      await f.api("/status", "GET", undefined, again)
    ).json();
    assert.equal(after.study.remaining_calls, 0);
    assert.deepEqual(after.budget_reserved_cents, { tester: 1425, judge: 0 });
    assert.equal(
      (await f.api("/analyses", "POST", request(), await f.login(judge)))
        .status,
      502,
    );
    assert.equal(
      (await f.api("/analyses", "POST", request(), await f.login(legacy)))
        .status,
      502,
    );
  } finally {
    await f.close();
  }
});

test("owner-only management, private feedback, redaction, idempotency, quota and revocation", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.api("/study")).status, 401);
    const owner = await f.login(ownerCode),
      oldTester = await f.login(legacy);
    assert.equal(
      (await f.api("/study", "GET", undefined, oldTester)).status,
      403,
    );
    assert.equal(
      (
        await f.api("/study/invitations", "POST", { label: "A" }, owner, {
          Origin: "https://hostile.test",
        })
      ).status,
      403,
    );
    const a = await f.invite(owner, "Tester A"),
      b = await f.invite(owner, "Tester B");
    const cookieA = await f.login(a.code),
      cookieB = await f.login(b.code);
    const feedback = {
      id: randomUUID(),
      rating: 4,
      message: "<img src=x onerror=alert(1)> API_KEY=synthetic-private-key",
      reviewed: true,
    };
    assert.equal(
      (
        await f.api(
          "/study/feedback",
          "POST",
          { ...feedback, reviewed: false },
          cookieA,
        )
      ).status,
      422,
    );
    assert.equal(
      (
        await f.api(
          "/study/feedback",
          "POST",
          { ...feedback, tape: "private" },
          cookieA,
        )
      ).status,
      422,
    );
    for (let i = 0; i < 2; i++)
      assert.equal(
        (await f.api("/study/feedback", "POST", feedback, cookieA)).status,
        201,
      );
    assert.equal(
      (await f.api("/study/feedback", "POST", feedback, cookieB)).status,
      409,
    );
    assert.equal(
      (await f.api("/study", "GET", undefined, cookieA)).status,
      403,
    );
    for (let i = 1; i < 10; i++)
      assert.equal(
        (
          await f.api(
            "/study/feedback",
            "POST",
            { ...feedback, id: randomUUID() },
            cookieA,
          )
        ).status,
        201,
      );
    assert.equal(
      (
        await f.api(
          "/study/feedback",
          "POST",
          { ...feedback, id: randomUUID() },
          cookieA,
        )
      ).status,
      409,
    );
    await f.restart();
    const overviewResponse = await f.api("/study", "GET", undefined, owner);
    assert.equal(overviewResponse.headers.get("cache-control"), "no-store");
    const overview = await overviewResponse.json();
    assert.equal(overview.feedback.length, 10);
    assert.doesNotMatch(
      JSON.stringify(overview),
      /synthetic-private-key|"hash"|"code"/,
    );
    assert.equal(overview.feedback[0].label, "Tester A");
    assert.equal(f.calls(), 0);
    assert.equal(
      (
        await f.api(
          "/study/feedback/" + feedback.id,
          "DELETE",
          undefined,
          owner,
        )
      ).status,
      200,
    );
    assert.equal(
      (await f.api("/study/feedback", "POST", feedback, cookieA)).status,
      409,
    );
    assert.equal(
      (
        await f.api(
          "/study/feedback",
          "POST",
          { ...feedback, id: randomUUID() },
          cookieA,
        )
      ).status,
      409,
    );
    const storage = await f.storage();
    const removed = await storage.exec(
      "SELECT message,rating,deleted FROM study_feedback WHERE id=?",
      feedback.id,
    );
    assert.equal(removed[0].message, "");
    assert.equal(removed[0].rating, 0);
    assert.equal(removed[0].deleted, 1);
    assert.equal(
      (await f.api("/study/invitations/" + a.id, "DELETE", undefined, cookieB))
        .status,
      403,
    );
    assert.equal(
      (await f.api("/study/invitations/" + a.id, "DELETE", undefined, owner))
        .status,
      200,
    );
    assert.equal(
      (await f.api("/session", "POST", { code: a.code })).status,
      401,
    );
    assert.equal(
      (
        await f.api(
          "/study/feedback",
          "POST",
          { ...feedback, id: randomUUID() },
          cookieA,
        )
      ).status,
      401,
    );
    assert.equal(
      (await f.api("/analyses", "POST", request(), cookieA)).status,
      401,
    );
    assert.equal(
      (
        await f.api(
          "/study/feedback/" + feedback.id,
          "DELETE",
          undefined,
          owner,
        )
      ).status,
      200,
    );
    assert.equal(
      (await (await f.api("/study", "GET", undefined, owner)).json()).feedback
        .length,
      9,
    );
  } finally {
    await f.close();
  }
});
