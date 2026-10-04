import { analysisRequest, analyze } from "./analysis";
import {
  bytes,
  digest,
  equalHash,
  HttpError,
  json,
  randomToken,
  readJson,
  type Role,
} from "./common";
import { redact, validateTape } from "../../web/src/engine";
import corrected from "../../examples/corrected.json";
import stale from "../../examples/stale.json";
export { AccessState, BudgetLedger, ClipStore } from "./storage";

const LIVE_BLOCKERS = [
  "Nebius sandbox beta approval is pending",
  "Hosted sandbox runner integration and real execution verification are still required",
];
const COOKIE = "rewind_session";
const ledger = (env: Env) => env.LEDGER.getByName("rewind-hackathon-2026");
function analysisBlockers(env: Env) {
  return [
    !env.NEBIUS_API_KEY && "Dedicated Nebius key",
    String(env.ANALYSIS_ENABLED) !== "true" && "Nemotron analysis enabled",
    String(env.ANALYSIS_PRICES_VERIFIED) !== "true" &&
      "Verified analysis pricing",
    (!env.MODEL.toLowerCase().startsWith("nvidia/") ||
      !env.MODEL.toLowerCase().includes("nemotron")) &&
      "NVIDIA Nemotron model",
  ].filter((s): s is string => typeof s === "string");
}
async function session(request: Request, env: Env) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const owner = await digest(token);
  const value = await env.ACCESS.getByName(`session:${owner}`).session();
  return value ? { owner, role: value.role } : null;
}
async function requireSession(request: Request, env: Env) {
  const value = await session(request, env);
  if (!value)
    throw new HttpError(401, "Enter an invitation code in Settings first");
  return value;
}
async function route(request: Request, env: Env) {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  if (!path.startsWith("/api/")) {
    if (!["GET", "HEAD"].includes(method))
      throw new HttpError(405, "Method not allowed");
    return env.ASSETS.fetch(request);
  }
  if (
    !["GET", "HEAD"].includes(method) &&
    request.headers.get("origin") !== env.ORIGIN
  )
    throw new HttpError(403, "Origin is not allowed");
  if (method === "GET" && path === "/api/health")
    return json({ status: "ok", version: "0.1.0", host: "cloudflare" });
  if (method === "GET" && path === "/api/examples")
    return json([corrected, stale]);
  if (method === "GET" && path === "/api/status") {
    const auth = await session(request, env),
      blockers = analysisBlockers(env);
    const budget = auth ? await ledger(env).budget() : null;
    const total = budget ? budget.tester + budget.judge + 3000 : null;
    return json({
      live_available: false,
      blockers: LIVE_BLOCKERS,
      analysis_available: blockers.length === 0,
      analysis_blockers: blockers,
      authenticated: !!auth,
      role: auth?.role ?? null,
      model: env.MODEL,
      budget_reserved_cents: budget,
      total_reserved_cents: total,
      budget_alert:
        total === null
          ? null
          : ([90, 75, 50].find((n) => total >= n * 100) ?? null),
    });
  }
  if (path === "/api/session" && method === "POST") {
    const ip = await digest(
      request.headers.get("CF-Connecting-IP") ?? "unknown",
    );
    if (!(await env.ACCESS.getByName(`login:${ip}`).rate(10, 900)))
      throw new HttpError(
        429,
        "Too many invitation attempts; try again in 15 minutes",
      );
    const body = await readJson(request, 8192);
    if (
      !body ||
      typeof body !== "object" ||
      !("code" in body) ||
      typeof body.code !== "string" ||
      Object.keys(body).length !== 1 ||
      body.code.length < 12 ||
      body.code.length > 200
    )
      throw new HttpError(422, "Invalid invitation code");
    const hash = await digest(body.code);
    // Evaluate both comparisons, regardless of which role matches.
    const tester = equalHash(hash, env.TESTER_CODE_HASH ?? ""),
      judge = equalHash(hash, env.JUDGE_CODE_HASH ?? "");
    const role: Role | null = judge ? "judge" : tester ? "tester" : null;
    if (!role) throw new HttpError(401, "Invalid invitation code");
    const token = randomToken(),
      owner = await digest(token);
    await env.ACCESS.getByName(`session:${owner}`).create(role);
    return json({ role }, 200, {
      "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`,
    });
  }
  if (path === "/api/session" && method === "DELETE") {
    const auth = await session(request, env);
    if (auth) await env.ACCESS.getByName(`session:${auth.owner}`).revoke();
    return json({ ok: true }, 200, {
      "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
    });
  }
  if (path === "/api/analyses" && method === "POST") {
    const auth = await requireSession(request, env);
    if (analysisBlockers(env).length)
      throw new HttpError(503, "Hosted analysis is not configured");
    const body = analysisRequest(
      await readJson(request, 320_000),
      env.NEBIUS_API_KEY,
    );
    if (!(await env.ACCESS.getByName(`session:${auth.owner}`).rate(10, 3600)))
      throw new HttpError(429, "Analysis limit reached; try again in an hour");
    const store = ledger(env),
      problem = await store.reserve(
        auth.owner,
        auth.role,
        body.idempotency_key,
      );
    if (problem) throw new HttpError(409, problem);
    try {
      const result = await analyze(env, body);
      await store.finish(
        auth.owner,
        body.idempotency_key,
        "complete",
        result.usage,
      );
      console.log(
        JSON.stringify({ event: "analysis_complete", role: auth.role }),
      );
      return json(result);
    } catch (error) {
      await store.finish(auth.owner, body.idempotency_key, "failed");
      console.warn(
        JSON.stringify({ event: "analysis_failed", role: auth.role }),
      );
      throw error;
    }
  }
  if (path === "/api/demo-runs" || path.startsWith("/api/demo-runs/")) {
    await requireSession(request, env);
    if (path === "/api/demo-runs" && method === "GET") return json([]);
    if (path === "/api/demo-runs" && method === "POST")
      throw new HttpError(503, LIVE_BLOCKERS.join(". "));
    throw new HttpError(404, "Run not found");
  }
  if (path === "/api/clips" && method === "POST") {
    const auth = await requireSession(request, env);
    const body = await readJson(request, 2 * 1024 * 1024);
    let tape;
    try {
      tape = validateTape(redact(body, [env.NEBIUS_API_KEY]));
    } catch {
      throw new HttpError(422, "Invalid clip tape");
    }
    if (tape.run.source !== "clip" || tape.run.configuration.reviewed !== true)
      throw new HttpError(422, "Review the selected clip before publishing");
    const encoded = JSON.stringify(tape),
      size = bytes(encoded).length;
    if (size > 2 * 1024 * 1024) throw new HttpError(413, "Clip exceeds 2 MB");
    const token = randomToken(),
      manage = randomToken(),
      store = ledger(env);
    if (!(await store.reserveClip(token, auth.owner, size)))
      throw new HttpError(
        409,
        "Hosted clip limit reached; revoke older clips or export locally",
      );
    // Retain quota after an ambiguous storage failure; never blindly retry a publish.
    await env.CLIPS.getByName(token).publish(encoded, await digest(manage));
    return json(
      { token, manage_token: manage, url: `${env.ORIGIN}/?clip=${token}` },
      201,
    );
  }
  const clip = path.match(/^\/api\/clips\/([a-f0-9]{64})$/)?.[1];
  if (clip && method === "GET") {
    const tape = await env.CLIPS.getByName(clip).read();
    if (!tape) throw new HttpError(404, "Clip not found");
    return new Response(tape, {
      headers: { "Content-Type": "application/json" },
    });
  }
  if (clip && method === "DELETE") {
    const manage = request.headers.get("x-clip-management") ?? "";
    if (
      !/^[a-f0-9]{64}$/.test(manage) ||
      !(await env.CLIPS.getByName(clip).revoke(await digest(manage)))
    )
      throw new HttpError(404, "Clip not found");
    await ledger(env).releaseClip(clip);
    return json({ ok: true });
  }
  throw new HttpError(404, "Not found");
}
export default {
  async fetch(request, env) {
    let response: Response;
    try {
      response = await route(request, env);
    } catch (error) {
      const known = error instanceof HttpError;
      if (!known) console.error(JSON.stringify({ event: "request_failed" }));
      response = json(
        { detail: known ? error.message : "Service temporarily unavailable" },
        known ? error.status : 503,
      );
    }
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("X-Frame-Options", "DENY");
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    if (new URL(request.url).pathname.startsWith("/api/"))
      headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<Env>;
