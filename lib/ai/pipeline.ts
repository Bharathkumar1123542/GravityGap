// lib/ai/pipeline.ts — full AI request pipeline with retry (spec-addendum §8.10)
// FR-AI-03, FR-AI-04, FR-AI-08, FR-AI-09; NFR-REL-03
import { callGemini } from "@/lib/ai/client";
import { validateResponse } from "@/lib/ai/validate";
import { isExtrapolationQuestion } from "@/lib/ai/extrapolation";
import { computeConfidence } from "@/lib/ai/confidence";
import { buildPayload } from "@/lib/ai/augment";
import type { AiResponse, Paragraph } from "@/lib/ai/response-schema";
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";

export type PipelineResult =
  | {
      status: "answered";
      answer: Paragraph[];
      extrapolation: boolean;
      confidence: string;
      retryRan: boolean;
    }
  | { status: "no_data"; no_data_reason: string | null }
  | { status: "out_of_scope" }
  | { status: "no_verified_answer" }
  | { status: "error"; httpStatus: 503 | 504; message: string };

export async function runPipeline(
  question: string,
  records: InvestigationRecord[],
  envs: EnvironmentProfile[]
): Promise<PipelineResult> {
  const { payload, sizeBytes } = buildPayload(records, envs);
  if (sizeBytes > 100 * 1024) {
    return { status: "error", httpStatus: 503, message: "Augmented payload exceeds 100 KB" };
  }

  const forceExtrapolation = isExtrapolationQuestion(question);

  // ── First attempt ────────────────────────────────────────────────────────
  const result1 = await callGemini(question, payload);
  if (!result1.ok) {
    return {
      status: "error",
      httpStatus: result1.error === "timeout" ? 504 : 503,
      message: result1.message,
    };
  }

  const r1: AiResponse = result1.data;
  if (forceExtrapolation) r1.extrapolation = true;

  if (r1.status === "no_data") {
    return { status: "no_data", no_data_reason: r1.no_data_reason };
  }
  if (r1.status === "out_of_scope") {
    return { status: "out_of_scope" };
  }

  const v1 = validateResponse(r1.answer, records, envs, r1.status);

  if (v1.removedCount === 0 && v1.validParagraphs.length > 0) {
    const confidence = computeConfidence(
      v1.validParagraphs, records, r1.extrapolation, false, false
    );
    return {
      status: "answered",
      answer: v1.validParagraphs,
      extrapolation: r1.extrapolation,
      confidence,
      retryRan: false,
    };
  }

  // ── Retry with errors appended ───────────────────────────────────────────
  const result2 = await callGemini(question, payload, v1.errors);
  if (!result2.ok) {
    // If we have some valid paragraphs from attempt 1, use them
    if (v1.validParagraphs.length > 0) {
      const confidence = computeConfidence(
        v1.validParagraphs, records, r1.extrapolation, false, v1.removedCount > 0
      );
      return {
        status: "answered",
        answer: v1.validParagraphs,
        extrapolation: r1.extrapolation,
        confidence,
        retryRan: true,
      };
    }
    return { status: "no_verified_answer" };
  }

  const r2: AiResponse = result2.data;
  if (forceExtrapolation) r2.extrapolation = true;

  if (r2.status === "no_data") {
    return { status: "no_data", no_data_reason: r2.no_data_reason };
  }
  if (r2.status === "out_of_scope") {
    return { status: "out_of_scope" };
  }

  const v2 = validateResponse(r2.answer, records, envs, r2.status);
  if (v2.validParagraphs.length === 0) {
    return { status: "no_verified_answer" };
  }

  const confidence = computeConfidence(
    v2.validParagraphs,
    records,
    r2.extrapolation,
    true,
    v2.removedCount > 0 || v1.removedCount > 0
  );
  return {
    status: "answered",
    answer: v2.validParagraphs,
    extrapolation: r2.extrapolation,
    confidence,
    retryRan: true,
  };
}
