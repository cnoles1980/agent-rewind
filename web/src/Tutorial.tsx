import { useEffect, useRef, type ReactNode } from "react";

export const tutorialSteps = [
  {
    title: "What did the agent read?",
    tool: "read_policy",
    tab: "Event",
    text: "Shipping should be free at $50 or more. Output shows the agent received an outdated rule: strictly above $50. This example deliberately injects that stale policy.",
    next: "See the code change",
  },
  {
    title: "What did it change?",
    tool: "apply_patch",
    tab: "Diff",
    text: "Diff shows the code changed to > 50. An order of exactly $50 still pays shipping, matching the stale policy.",
    next: "See the failed check",
  },
  {
    title: "What actually went wrong?",
    tool: "acceptance_tests",
    tab: "Event",
    text: "Output shows the failure: a $50 order should have a $0 shipping fee, but it has a $5 fee. The test ran and failed.",
    next: "Compare the corrected run",
  },
  {
    title: "What changed in the corrected run?",
    tool: "read_policy",
    tab: "Event",
    text: "Compare the two policy responses. The current rule includes exactly $50. Differences show what changed; they alone do not prove the cause.",
    next: "Prepare a debugging report",
  },
  {
    title: "Take the evidence back to your agent",
    tool: "acceptance_tests",
    tab: "Event",
    text: "Review a report of the failed check, then copy it to your agent’s chat. Invited users can also request Nemotron suggestions. Rewind never sends messages or fixes code automatically.",
    next: "",
  },
] as const;

const welcomeKey = "rewind.welcome.seen.v1";

export function shouldShowWelcome() {
  // Shared links open directly on the evidence their sender chose.
  if (new URLSearchParams(location.search).has("clip")) return false;
  try {
    return localStorage.getItem(welcomeKey) !== "true";
  } catch {
    return true;
  }
}

export function rememberWelcome() {
  try {
    localStorage.setItem(welcomeKey, "true");
  } catch {
    /* The popup can still be skipped when browser storage is blocked. */
  }
}

export function TutorialPrompt({
  onOpen,
  onImport,
  onSkip,
  ready,
  access,
}: {
  onOpen: () => void;
  onImport: () => void;
  onSkip: () => void;
  ready: boolean;
  access?: ReactNode;
}) {
  return (
    <section className="tutorial-welcome" aria-label="First-use welcome">
      <p className="welcome-eyebrow">Agent Rewind</p>
      <h2>Find where your AI agent went wrong.</h2>
      <p>
        Follow a recorded run, understand the mistake, and take a useful report
        back to your agent.
      </p>
      <p className="muted">
        Start with a 3-minute example. No account or API key needed.
      </p>
      {access}
      <div className="welcome-actions">
        <button className="primary" disabled={!ready} onClick={onOpen}>
          Try an example
        </button>
        <button onClick={onSkip}>Skip for now</button>
      </div>
      <div className="welcome-actions welcome-alternatives">
        <button className="text-button" onClick={onImport}>
          Open my own agent log
        </button>
      </div>
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
          Guided example · Step {index + 1} of {tutorialSteps.length} · Example,
          no live execution
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
