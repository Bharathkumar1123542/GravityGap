// lib/ai/extrapolation.ts — keyword-forced extrapolation flag (spec-addendum §8.7)
// FR-AI-08
import { EXTRAPOLATION_KEYWORDS } from "@/config/extrapolation-keywords";

export function isExtrapolationQuestion(question: string): boolean {
  const lower = question.toLowerCase();
  return EXTRAPOLATION_KEYWORDS.some((kw) => lower.includes(kw));
}
