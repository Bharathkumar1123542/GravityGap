// lib/ai/confidence.ts — server-computed confidence label (spec-addendum §8.6)
// FR-AI-13 (Could); precedence: Low > Medium > High
import type { Paragraph } from "@/lib/ai/response-schema";
import type { InvestigationRecord } from "@/lib/schema";

export type Confidence = "High" | "Medium" | "Low";

export function computeConfidence(
  paragraphs: Paragraph[],
  records: InvestigationRecord[],
  extrapolation: boolean,
  retryRan: boolean,
  paragraphsRemoved: boolean
): Confidence {
  // Low takes precedence over everything
  if (extrapolation || retryRan || paragraphsRemoved) return "Low";

  // Check for any unverified claim
  const hasUnverified = paragraphs.some((p) =>
    p.claims.some((claim) => {
      const record = records.find((r) => r.id === claim.record_id);
      if (!record) return true;
      const status = (record.verification as Record<string, string>)[claim.field];
      return status === "unverified";
    })
  );

  if (hasUnverified) return "Medium";
  return "High";
}
