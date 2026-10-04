import { timingSafeEqual } from "node:crypto";
export type Role = "tester" | "judge";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const bytes = (value: string) => new TextEncoder().encode(value);
export const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
export async function digest(value: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes(value))),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
}
export function equalHash(a: string, b: string) {
  return (
    /^[a-f0-9]{64}$/.test(a) &&
    /^[a-f0-9]{64}$/.test(b) &&
    timingSafeEqual(bytes(a), bytes(b))
  );
}
export const json = (value: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(value, { status, headers });

// Bound actual streamed bytes, not just the caller-controlled Content-Length header.
export async function readJson(
  message: Request | Response,
  limit: number,
): Promise<unknown> {
  if (Number(message.headers.get("content-length")) > limit)
    throw new HttpError(413, "Content exceeds the size limit");
  if (!message.body) throw new HttpError(400, "A JSON body is required");
  const reader = message.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit)
        throw new HttpError(413, "Content exceeds the size limit");
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel();
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(all));
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}
