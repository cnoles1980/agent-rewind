import { useState } from "react";
import { api } from "./api";

const offeredKey = "rewind.access.offered.v1";
export function accessWasOffered() {
  if (new URLSearchParams(location.search).has("clip")) return true;
  try {
    return sessionStorage.getItem(offeredKey) === "true";
  } catch {
    return false;
  }
}
export function rememberAccessOffer() {
  try {
    sessionStorage.setItem(offeredKey, "true");
  } catch {
    /* The in-memory guard still prevents repeated prompts. */
  }
}

export default function AccessSetup({
  authenticated,
  onAccessChange,
}: {
  authenticated: boolean;
  onAccessChange: () => Promise<unknown>;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (authenticated)
    return (
      <p role="status">
        You’re signed in. Analysis uses your invitation’s allowance.
      </p>
    );
  return (
    <form
      className="access-setup"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy || code.length < 12) return;
        setBusy(true);
        setError("");
        try {
          await api("/session", {
            method: "POST",
            body: JSON.stringify({ code }),
          });
          setCode("");
          await onAccessChange();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not sign in. Try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        Have an invitation? Enter your code for AI analysis. Examples and local
        reports are free without one.
      </p>
      <label>
        Invitation code
        <input
          type="password"
          autoComplete="off"
          maxLength={200}
          required
          minLength={12}
          value={code}
          disabled={busy}
          onChange={(event) => setCode(event.target.value)}
        />
      </label>
      <button className="primary" disabled={busy || code.length < 12}>
        {busy ? "Signing in…" : "Unlock AI analysis"}
      </button>
      <p className="muted">
        Use your owner, tester or judge code. Your Nebius API key belongs on the
        server.
      </p>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
