import { useEffect, useState } from "react";
import { api } from "./api";

type Status = {
  role: string | null;
  study: { label: string; remaining_calls: number } | null;
};
type Overview = {
  group_reserved_cents: number;
  invitations: { id: string; label: string; revoked: number; calls: number }[];
  feedback: {
    id: string;
    label: string;
    created: number;
    rating: number;
    message: string;
  }[];
};

export default function StudyPanel({
  onAccessChange,
  onStart,
}: {
  onAccessChange: () => void;
  onStart?: () => void;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [submission, setSubmission] = useState(() => crypto.randomUUID());
  async function refresh() {
    const current = await api<Status>("/status");
    setStatus(current);
    setOverview(
      current.role === "owner" ? await api<Overview>("/study") : null,
    );
  }
  useEffect(() => {
    void refresh().catch((error) => setNotice(error.message));
  }, []);
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setNotice("");
    try {
      await action();
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Request failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="study-panel">
      {status && !status.study && status.role !== "owner" && (
        <p>
          {status.role ? (
            <>
              You’re signed in. To leave study feedback, switch to your
              individual tester code below.
            </>
          ) : (
            <>
              <strong>Have an invitation?</strong> Enter it for AI analysis and
              private feedback. Examples need no code or setup.
            </>
          )}
        </p>
      )}
      <p>
        Only your rating, message and tester label go to the project owner. No
        recordings or other attachments are sent. Feedback makes no model call.
      </p>
      {notice && <p role="status">{notice}</p>}
      {status?.role && (
        <button
          disabled={busy}
          onClick={() =>
            void act(async () => {
              await api("/session", { method: "DELETE" });
              await refresh();
              onAccessChange();
            })
          }
        >
          Sign out of invited access
        </button>
      )}
      {!status && <p>Loading access…</p>}
      {status && !status.study && status.role !== "owner" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              await api("/session", {
                method: "POST",
                body: JSON.stringify({ code }),
              });
              setCode("");
              await refresh();
              onAccessChange();
            });
          }}
        >
          <label>
            Private tester or owner invitation
            <input
              type="password"
              autoComplete="off"
              maxLength={200}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <button disabled={busy || code.length < 12}>
            Unlock invited access
          </button>
          <p>
            Use the individual code the project owner sent you. Examples and
            local reports work without a code.
          </p>
        </form>
      )}
      {status?.study && onStart && (
        <div className="callout">
          <p>
            Access is ready. Start with the example, then return to Feedback to
            tell us how it went.
          </p>
          <button className="primary" onClick={onStart}>
            Start guided example
          </button>
        </div>
      )}
      {status?.study && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void act(async () => {
              await api("/study/feedback", {
                method: "POST",
                body: JSON.stringify({
                  id: submission,
                  rating: Number(rating),
                  message,
                  reviewed,
                }),
              });
              setMessage("");
              setRating("");
              setReviewed(false);
              setSubmission(crypto.randomUUID());
              setNotice(
                "Feedback saved. The project owner can read it in the owner inbox. Thank you!",
              );
            });
          }}
        >
          <p>
            <strong>{status.study.label}</strong> ·{" "}
            {status.study.remaining_calls} analysis attempts remain for the
            whole testing group. Feedback and replay remain available when the
            allowance is used.
          </p>
          <label>
            How useful was Rewind?
            <select
              required
              value={rating}
              disabled={busy}
              onChange={(event) => {
                setRating(event.target.value);
                setReviewed(false);
                setSubmission(crypto.randomUUID());
              }}
            >
              <option value="">Choose a rating</option>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} —{" "}
                  {value === 1
                    ? "Not useful"
                    : value === 5
                      ? "Very useful"
                      : [
                          "",
                          "",
                          "Slightly useful",
                          "Somewhat useful",
                          "Useful",
                        ][value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            What worked, what was confusing, or what went wrong?
            <textarea
              required
              rows={7}
              maxLength={2000}
              value={message}
              disabled={busy}
              onChange={(event) => {
                setMessage(event.target.value);
                setReviewed(false);
                setSubmission(crypto.randomUUID());
              }}
            />
          </label>
          <p className="muted">
            Include what you tried, what you expected, and what happened. Please
            omit passwords, invitation codes and private project content. You
            can submit up to ten messages.
          </p>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={reviewed}
              disabled={busy}
              onChange={(event) => setReviewed(event.target.checked)}
            />
            I reviewed this message and agree to send it to the project owner.
          </label>
          <button
            className="primary"
            disabled={busy || !reviewed || !rating || !message.trim()}
          >
            {busy ? "Sending…" : "Send feedback"}
          </button>
        </form>
      )}
      {overview && (
        <>
          <h3>Owner inbox</h3>
          <p>
            ${(overview.group_reserved_cents / 100).toFixed(2)} of the group's
            $5 allowance reserved. These are internal reservations, not invoice
            charges.
          </p>
          <button disabled={busy} onClick={() => void act(refresh)}>
            Refresh feedback
          </button>
          <h4>Tester access</h4>
          {overview.invitations.map((invite) => (
            <div className="study-entry" key={invite.id}>
              <strong>{invite.label}</strong> · {invite.calls} attempts ·{" "}
              {invite.revoked ? "Revoked" : "Active"}
              {!invite.revoked && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await api(`/study/invitations/${invite.id}`, {
                        method: "DELETE",
                      });
                      await refresh();
                    })
                  }
                >
                  Revoke {invite.label}
                </button>
              )}
            </div>
          ))}
          <h4>Feedback ({overview.feedback.length})</h4>
          {!overview.feedback.length && (
            <p>
              No feedback yet. Messages will appear here after testers submit
              them.
            </p>
          )}
          {overview.feedback.map((item) => (
            <article className="study-entry" key={item.id}>
              <strong>
                {item.label} · {item.rating}/5
              </strong>
              <p className="muted">{new Date(item.created).toLocaleString()}</p>
              <p className="study-message">{item.message}</p>
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm("Permanently delete this feedback message?")
                  )
                    void act(async () => {
                      await api(`/study/feedback/${item.id}`, {
                        method: "DELETE",
                      });
                      await refresh();
                    });
                }}
              >
                Delete feedback from {item.label}
              </button>
            </article>
          ))}
          <p className="muted">
            This inbox does not send email notifications. Open it or ask Codex
            to check it. Keep your owner invitation private.
          </p>
        </>
      )}
    </div>
  );
}
