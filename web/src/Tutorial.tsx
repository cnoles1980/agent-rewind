import { useState } from "react";

const steps = [
  {
    title: "Start with the example",
    text: "The checkout example is an illustrative recording. Shipping should be free at $50 or more, but an injected stale policy says strictly above $50. You can explore it without an API key.",
    action:
      "Close this guide and select checkout-flow with Example · stale in Recent runs. Select read_policy() in the Tools lane.",
    expected:
      "The inspector shows the archived policy. Replaying a recording never runs code or calls a model.",
  },
  {
    title: "Follow the evidence",
    text: "Select a tool event to inspect its input and output. Move to the code change, then the acceptance test. Use search, previous/next event, or the timeline. Zoom reaches 6,400% for long recordings.",
    action:
      "Find the test for a subtotal of 50. Open State for captured context, Raw for sanitized data, or Diff for a captured code change.",
    expected:
      "The recorded boundary test fails. Missing context or timing stays unknown; the player does not invent it.",
  },
  {
    title: "Compare the corrected run",
    text: "Observed Differences sits above the timeline. Compare matches recorded calls and shows changed inputs, outputs, errors, and context.",
    action:
      "Choose Jump to first behavior difference, then read both sides of the policy result. Expand A/B playback to inspect the paired recordings.",
    expected:
      "The current policy includes $50. A difference is observed evidence, not automatic proof of root cause.",
  },
  {
    title: "Open your own recording",
    text: "Choose Settings & sources for source-specific instructions, then Open Codex log or another supported source. These are file imports, not live account connections.",
    action:
      "For Codex, select one session JSONL from ~/.codex/sessions (Windows: %USERPROFILE%\\.codex\\sessions). Review Capture details after import.",
    expected:
      "Up to 100 MB / 10,000 events is read in this browser without an upload. Export important recordings before clearing browser storage.",
  },
  {
    title: "Prepare a debugging handoff",
    text: "Select the consequential event and choose Debug report. Describe what happened and what you expected. Review the exact excerpt and redact additional private text before copying it into your agent’s chat.",
    action:
      "For optional Nemotron analysis, enter your invitation code, review the excerpt, and explicitly consent to send it. Review the returned suggestions before copying the handoff.",
    expected:
      "Evidence-only reports need no key. Analysis sends only the reviewed excerpt to Nebius and uses the server’s key/budget. Self-hosters supply their own key. No repair or chat message is sent automatically.",
  },
  {
    title: "Share only reviewed evidence",
    text: "Choose Clip & share, select a time range, and inspect the full preview. Supporting context can contain earlier messages, so it is excluded by default.",
    action:
      "Redact private information and check the review box. Export a local clip, or publish with invited access. Use Shared clips to revoke a published link.",
    expected:
      "Anyone with an unlisted link can read it. A fresh coding demo is a separate action under New demo run, and is unavailable until sandbox checks pass. Judges use their private invitation; they do not need an API key.",
  },
];

export function TutorialPrompt({ onOpen }: { onOpen: () => void }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("rewind.tutorial.dismissed.v1") === "true";
    } catch {
      return false;
    }
  });
  if (dismissed) return null;
  return (
    <section className="tutorial-welcome" aria-label="First-use welcome">
      <div>
        <strong>New to Agent Rewind?</strong>
        <p>
          Follow a recorded failure from policy to code to test. No key needed.
        </p>
      </div>
      <button className="primary" onClick={onOpen}>
        Start tutorial
      </button>
      <button
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem("rewind.tutorial.dismissed.v1", "true");
          } catch {
            /* Still dismiss for this visit. */
          }
        }}
      >
        Dismiss welcome
      </button>
    </section>
  );
}

export default function Tutorial() {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  return (
    <div className="tutorial-guide">
      <p className="muted">
        Step {index + 1} of {steps.length} · Reopen anytime from Settings &
        sources.
      </p>
      <div aria-live="polite" aria-atomic="true">
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <h4>Try it</h4>
        <p>{step.action}</p>
        <h4>What to expect</h4>
        <p>{step.expected}</p>
      </div>
      <div className="modal-actions">
        <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Previous step
        </button>
        <button
          className="primary"
          disabled={index === steps.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Next step
        </button>
      </div>
      {index === steps.length - 1 && (
        <p>
          Close this guide to explore. Importing, replaying, and reading this
          tutorial never launch paid execution.
        </p>
      )}
    </div>
  );
}
