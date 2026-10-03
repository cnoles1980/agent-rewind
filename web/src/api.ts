export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const r = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
  });
  const result = await r.json();
  if (!r.ok)
    throw new Error(
      typeof result.detail === "string"
        ? result.detail
        : "Request failed; check the input.",
    );
  return result;
}
