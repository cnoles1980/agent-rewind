import {
  digest,
  HttpError,
  json,
  randomToken,
  readJson,
  type AccessRole,
} from "./common";
import { redact } from "../../web/src/engine";

export type StudySession = { role: AccessRole; invitation?: string };

/** Explicit feedback only. No automatic tape, model-response or browser-state capture. */
export async function studyRoute(
  request: Request,
  env: Env,
  auth: StudySession,
) {
  const path = new URL(request.url).pathname;
  const store = env.LEDGER.getByName("rewind-hackathon-2026");
  if (path === "/api/study/feedback" && request.method === "POST") {
    if (!auth.invitation)
      throw new HttpError(
        403,
        "Use your individual tester invitation to send feedback",
      );
    const body = (await readJson(request, 16_000)) as Record<
      string,
      unknown
    > | null;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (key) => !["id", "rating", "message", "reviewed"].includes(key),
      ) ||
      typeof body.id !== "string" ||
      !/^[a-f0-9-]{32,36}$/.test(body.id) ||
      typeof body.rating !== "number" ||
      !Number.isInteger(body.rating) ||
      body.rating < 1 ||
      body.rating > 5 ||
      typeof body.message !== "string" ||
      !body.message.trim() ||
      body.message.length > 2000 ||
      body.reviewed !== true
    )
      throw new HttpError(
        422,
        "Review a feedback message of 1–2,000 characters and choose a rating",
      );
    const outcome = await store.submitStudyFeedback(
      body.id,
      auth.invitation,
      body.rating,
      redact(body.message.trim(), [env.NEBIUS_API_KEY]),
    );
    if (outcome !== "saved")
      throw new HttpError(
        outcome === "revoked" ? 403 : 409,
        "Feedback could not be saved: invitation unavailable, duplicate ID or feedback limit reached",
      );
    return json({ id: body.id, saved: true }, 201);
  }
  if (auth.role !== "owner")
    throw new HttpError(403, "Owner access is required");
  if (path === "/api/study" && request.method === "GET")
    return json(await store.studyOverview());
  if (path === "/api/study/invitations" && request.method === "POST") {
    const body = (await readJson(request, 1024)) as Record<
      string,
      unknown
    > | null;
    if (
      !body ||
      typeof body.label !== "string" ||
      !/^[A-Za-z0-9 -]{1,40}$/.test(body.label) ||
      Object.keys(body).length !== 1
    )
      throw new HttpError(422, "Use a short label such as Tester A");
    const id = randomToken(),
      code = randomToken();
    if (
      !(await store.createStudyInvitation(id, await digest(code), body.label))
    )
      throw new HttpError(409, "This study is limited to ten invitations");
    return json({ id, label: body.label, code }, 201);
  }
  const invitation = path.match(
    /^\/api\/study\/invitations\/([a-f0-9]{64})$/,
  )?.[1];
  if (invitation && request.method === "DELETE") {
    await store.revokeStudyInvitation(invitation);
    return json({ revoked: true });
  }
  const feedback = path.match(
    /^\/api\/study\/feedback\/([a-f0-9-]{32,36})$/,
  )?.[1];
  if (feedback && request.method === "DELETE") {
    await store.deleteStudyFeedback(feedback);
    return json({ deleted: true });
  }
  throw new HttpError(404, "Not found");
}
