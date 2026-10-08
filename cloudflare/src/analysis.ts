import contract from "./analysis-contract.json";
import {
  validateRequest,
  validateResult,
  validateDraft,
} from "./analysis.validator.js";
import type { AnalysisRequest } from "./request.generated";
import type { AnalysisResult } from "./result.generated";
import type { AnalysisDraft } from "./draft.generated";
import { prepareEvidence } from "../../web/src/analysisEvidence";
import { acceptDraft, AnalysisFailure, evidenceMessage } from "./analysisDraft";
import { redact } from "../../web/src/engine";
import { bytes, HttpError, readJson } from "./common";

export function analysisRequest(
  value: unknown,
  apiKey: string,
): AnalysisRequest {
  if (!validateRequest(value))
    throw new HttpError(422, "Invalid reviewed analysis request");
  const body = value as AnalysisRequest;
  if (
    bytes(body.evidence).length > 48_000 ||
    body.event_ids.some((id) => !id || id.length > 200) ||
    new Set(body.event_ids).size !== body.event_ids.length
  )
    throw new HttpError(422, "Evidence or event references exceed limits");
  try {
    prepareEvidence(body.evidence, body.event_ids, (value) =>
      redact(value, [apiKey]),
    );
  } catch (error) {
    throw new HttpError(
      422,
      error instanceof Error ? error.message : "Invalid reviewed evidence",
    );
  }
  return body;
}

export async function analyze(env: Env, body: AnalysisRequest) {
  try {
    const prepared = prepareEvidence(body.evidence, body.event_ids, (value) =>
      redact(value, [env.NEBIUS_API_KEY]),
    );
    const response = await fetch(
      "https://api.tokenfactory.nebius.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.NEBIUS_API_KEY}`,
        },
        signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({
          model: env.MODEL,
          max_tokens: 6144,
          temperature: 0.2,
          messages: [
            { role: "system", content: contract.system },
            {
              role: "user",
              content: evidenceMessage(prepared),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "evidence_analysis",
              strict: true,
              schema: contract.draft,
            },
          },
        }),
      },
    );
    if (!response.ok) {
      await response.body?.cancel();
      throw new AnalysisFailure("provider");
    }
    const raw = (await readJson(response, 1024 * 1024)) as {
      choices?: {
        finish_reason?: string;
        message?: { tool_calls?: unknown; content?: unknown };
      }[];
      usage?: Record<string, unknown>;
    };
    const choice = raw?.choices?.[0];
    if (
      choice?.finish_reason !== "stop" ||
      choice.message?.tool_calls ||
      typeof choice.message?.content !== "string"
    )
      throw new AnalysisFailure("incomplete");
    let content = choice.message.content.trim();
    if (content.startsWith("```json\n") && content.endsWith("```"))
      content = content.slice(8, -3).trim();
    let result: unknown;
    try {
      result = JSON.parse(content);
    } catch {
      throw new AnalysisFailure("format", "JSON decoding");
    }
    if (!validateDraft(result)) {
      // Fixed schema keywords only: never return provider text, paths or values.
      const failure = (
        validateDraft as typeof validateDraft & {
          errors?: { keyword: string; schemaPath: string }[];
        }
      ).errors?.[0];
      const keyword = failure?.keyword;
      const safe = [
        "required",
        "additionalProperties",
        "type",
        "pattern",
        "minLength",
        "maxLength",
        "minItems",
        "maxItems",
      ].find((name) => name === keyword);
      const field = ["excerpt_id", "question", "why_unknown"].find((name) =>
        failure?.schemaPath.includes(`/properties/${name}/`),
      );
      throw new AnalysisFailure(
        "format",
        `draft schema${field ? `: ${field}` : ""}${safe ? `: ${safe}` : ""}`,
      );
    }
    const analysis: AnalysisResult = acceptDraft(
      result as AnalysisDraft,
      prepared,
    );
    if (!validateResult(analysis))
      throw new AnalysisFailure("format", "result schema");
    const findings = [
      analysis.explanation,
      analysis.next_step,
      ...analysis.facts,
      ...analysis.hypotheses,
    ];
    if (
      analysis.missing_evidence
        .concat(analysis.verification_steps)
        .some((s) => !s || s.length > 2000) ||
      findings.some((f) =>
        f.event_ids.some((id) => !body.event_ids.includes(id)),
      )
    )
      throw new AnalysisFailure("evidence_mismatch");
    for (const finding of findings)
      finding.text = redact(finding.text, [env.NEBIUS_API_KEY]);
    analysis.missing_evidence = redact(analysis.missing_evidence, [
      env.NEBIUS_API_KEY,
    ]);
    analysis.verification_steps = redact(analysis.verification_steps, [
      env.NEBIUS_API_KEY,
    ]);
    analysis.repair_prompt = redact(analysis.repair_prompt, [
      env.NEBIUS_API_KEY,
    ]);
    const usage: Record<string, number> = {};
    for (const key of ["prompt_tokens", "completion_tokens", "total_tokens"]) {
      const n = raw.usage?.[key];
      if (
        typeof n === "number" &&
        Number.isInteger(n) &&
        n >= 0 &&
        n <= 1_000_000
      )
        usage[key] = n;
    }
    return {
      analysis,
      usage,
      model: env.MODEL,
      provider: "Nebius Token Factory",
    };
  } catch (error) {
    if (error instanceof AnalysisFailure) throw error;
    if (
      error instanceof DOMException &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      throw new HttpError(504, "Analysis timed out; review before retrying");
    throw new AnalysisFailure("provider");
  }
}
