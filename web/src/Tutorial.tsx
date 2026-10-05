import { useEffect, useRef, useState } from "react";

export const tutorialSteps = [
  {
    title: "What did the agent read?",
    tool: "read_policy",
    tab: "Event",
    text: "The task says shipping is free at $50 or more. Look at Output in the event details: the policy the agent received says strictly above $50. That outdated policy was deliberately injected into this example.",
    next: "See the code change",
  },
  {
    title: "What did it change?",
    tool: "apply_patch",
    tab: "Diff",
    text: "The Diff tab shows the recorded code change. The new rule uses > 50 (greater than $50), which leaves an order of exactly $50 paying shipping. You can trace the change back to the policy response.",
    next: "See the failed check",
  },
  {
    title: "What actually went wrong?",
    tool: "acceptance_tests",
    tab: "Event",
    text: "Look at Output: for a $50 order, the expected shipping fee is 0, but the actual fee is 5. The tool finished successfully; the test inside its result failed. Rewind lets you inspect that distinction.",
    next: "Compare the corrected run",
  },
  {
    title: "What changed in the corrected run?",
    tool: "read_policy",
    tab: "Event",
    text: "The paired evidence compares the two policy responses: archived-v1 and current-v2. The corrected policy includes the $50 boundary. These are observed differences; a comparison alone does not prove a root cause.",
    next: "Prepare a debugging report",
  },
  {
    title: "Take the evidence back to your agent",
    tool: "acceptance_tests",
    tab: "Event",
    text: "Open a report with the failed check, describe the expected behavior, and review the excerpt. Copy it into your coding agent’s chat to help investigate. Optional Nemotron analysis can suggest checks after you review and consent; it needs invited access. Rewind never sends a message or fixes code automatically.",
    next: "",
  },
] as const;

export function TutorialPrompt({
  onOpen,
  onImport,
  onAccess,
  ready,
}: {
  onOpen: () => void;
  onImport: () => void;
  onAccess?: () => void;
  ready: boolean;
}) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("rewind.tutorial.dismissed.v2") === "true";
    } catch {
      return false;
    }
  });
  if (dismissed) return null;
  return (
    <section className="tutorial-welcome" aria-label="First-use welcome">
      <div>
        <p className="welcome-eyebrow">A debugger for recorded AI agent runs</p>
        <h2>Understand what went wrong. Bring evidence back to your agent.</h2>
        <p>
          Open a recording, inspect what the agent saw and did, then prepare a
          debugging report to paste into its chat.
        </p>
        <div className="welcome-actions">
          <button className="primary" disabled={!ready} onClick={onOpen}>
            Try the guided example · 3 min
          </button>
          <button onClick={onImport}>Open my own agent log</button>
          {onAccess && (
            <button onClick={onAccess}>Enter invitation code</button>
          )}
        </div>
        <p className="muted">
          No setup, account or key needed for the example. Your own log opens
          locally in this browser. Invitations unlock hosted analysis and tester
          feedback.
        </p>
      </div>
      <button
        className="text-button"
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem("rewind.tutorial.dismissed.v2", "true");
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

export default function Tutorial({
  index,
  onStep,
  onEvidence,
  onClose,
  onReport,
  onImport,
  onFeedback,
}: {
  index: number;
  onStep: (index: number) => void;
  onEvidence: () => void;
  onClose: () => void;
  onReport: () => void;
  onImport: () => void;
  onFeedback?: () => void;
}) {
  const step = tutorialSteps[index];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest("section")?.scrollIntoView({ block: "nearest" });
  }, [index]);
  return (
    <section className="tutorial-guide" aria-label="Guided investigation">
      <div aria-live="polite" aria-atomic="true">
        <p className="muted">
          Guided example · Step {index + 1} of {tutorialSteps.length} ·
          Illustrative recording, no live execution
        </p>
        <h2 ref={heading} tabIndex={-1}>
          {step.title}
        </h2>
        <p>{step.text}</p>
      </div>
      <div className="welcome-actions">
        <button disabled={index === 0} onClick={() => onStep(index - 1)}>
          Previous step
        </button>
        <button onClick={onEvidence}>Show evidence</button>
        {index < tutorialSteps.length - 1 ? (
          <button className="primary" onClick={() => onStep(index + 1)}>
            {step.next}
          </button>
        ) : (
          <>
            <button className="primary" onClick={onReport}>
              Open example report
            </button>
            <button onClick={onImport}>Open my own agent log</button>
            {onFeedback && <button onClick={onFeedback}>Give feedback</button>}
          </>
        )}
        <button className="text-button" onClick={onClose}>
          Finish guide & explore
        </button>
      </div>
    </section>
  );
}
