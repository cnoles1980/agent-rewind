import contract from "./analysis-contract.json";
import type { AnalysisDraft } from "./draft.generated";
import type { AnalysisResult } from "./result.generated";
import type { PreparedEvidence } from "../../web/src/analysisEvidence";
import { evidenceExcerpts } from "../../web/src/analysisEvidence";
import { HttpError } from "./common";

export class AnalysisFailure extends HttpError {
  constructor(
    public code: keyof typeof contract.errors,
    diagnostic = "",
  ) {
    super(
      502,
      `[${code}] ${contract.errors[code]}${diagnostic ? ` (${diagnostic})` : ""} Reservation retained; no automatic retry.`,
    );
  }
}

export function evidenceMessage(prepared: PreparedEvidence): string {
  const sections = [`USER OBSERVATION (untrusted):\n${prepared.observation}`];
  evidenceExcerpts(prepared).forEach((excerpt) => {
    sections.push(
      `EXCERPT ${excerpt.id}\n${excerpt.text}\nEND EXCERPT ${excerpt.id}`,
    );
  });
  if (prepared.supporting_context.length)
    sections.push(
      `EXPLICITLY REVIEWED SUPPORTING CONTEXT (not a quotable source):\n${prepared.supporting_context.join("\n")}`,
    );
  return sections.join("\n\n");
}

export function acceptDraft(
  draft: AnalysisDraft,
  prepared: PreparedEvidence,
): AnalysisResult {
  const excerpts = evidenceExcerpts(prepared);
  function quoted(item: AnalysisDraft["quotes"][number]) {
    const source = excerpts[item.excerpt_id - 1];
    if (!source) throw new AnalysisFailure("evidence_mismatch");
    return { text: source.text, event_ids: [source.event_id] };
  }
  return {
    facts: draft.quotes.map(quoted),
    hypotheses: draft.questions.map((item) => {
      const finding = quoted(item);
      return {
        ...finding,
        text: `${item.question}\nUnknown: ${item.why_unknown}\nSupporting excerpt: ${finding.text}`,
      };
    }),
    missing_evidence: draft.missing_evidence,
    verification_steps: draft.verification_steps,
    repair_prompt: contract.handoff,
  };
}
