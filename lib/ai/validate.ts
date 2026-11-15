// lib/ai/validate.ts — claim validator and numeric-token check (spec-addendum §8.5)
// FR-AI-04; NFR-ACC-AI-01; NFR-QLT-02 — 90% line coverage required
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import type { Paragraph } from "@/lib/ai/response-schema";

/** Collect numeric tokens the environment reference values allow in answer text. */
function envRefNumbers(envs: EnvironmentProfile[]): Set<string> {
  const nums = new Set<string>();
  for (const env of envs) {
    if (env.o2_pct) {
      nums.add(String(env.o2_pct.min));
      nums.add(String(env.o2_pct.max));
    }
    if (env.pressure_psi) {
      nums.add(String(env.pressure_psi.min));
      nums.add(String(env.pressure_psi.max));
    }
  }
  return nums;
}

/** Extract the stored value for a verifiable field as a string. */
function getFieldValue(r: InvestigationRecord, field: string): string | null {
  const v = (r as Record<string, unknown>)[field];
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return (v as unknown[]).join(", ");
  return String(v);
}

export type ValidationError = {
  type: "no_record" | "value_mismatch" | "numeric_token" | "no_claims";
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

/**
 * Validate a single paragraph against the stored records.
 * Rules applied in order per spec-addendum §8.5:
 *   1. Record exists
 *   2. Field value match (case-insensitive string; numeric exact after normalization)
 *   3. Numeric token check on paragraph.text
 *   4. No claims when answered → invalid
 */
export function validateParagraph(
  paragraph: Paragraph,
  records: InvestigationRecord[],
  envs: EnvironmentProfile[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // Rule 4: answered paragraphs need at least one claim
  if (paragraph.claims.length === 0) {
    errors.push({ type: "no_claims", message: "Paragraph has no claims" });
    return { valid: false, errors };
  }

  // Collect allowed numeric tokens: start from env ref values
  const allowedNums = new Set<string>(envRefNumbers(envs));

  for (const claim of paragraph.claims) {
    // Rule 1: record must exist
    const record = records.find((r) => r.id === claim.record_id);
    if (!record) {
      errors.push({
        type: "no_record",
        message: `Record not found: ${claim.record_id}`,
      });
      continue;
    }

    // Rule 2: field value must match stored value
    const stored = getFieldValue(record, claim.field);
    if (stored !== null) {
      const normalizedStored = stored.trim().toLowerCase();
      const normalizedClaim = claim.value.trim().toLowerCase();
      if (normalizedStored !== normalizedClaim) {
        // Allow numeric equality (e.g., "21.0" vs "21")
        const sNum = Number(stored);
        const cNum = Number(claim.value);
        if (!isNaN(sNum) && !isNaN(cNum) && sNum === cNum) {
          // numeric match — OK
        } else {
          errors.push({
            type: "value_mismatch",
            message: `Claim value mismatch for ${claim.record_id}.${claim.field}: stored="${stored}" claimed="${claim.value}"`,
          });
          continue;
        }
      }
    }

    // Add all numeric tokens from the claim value to the allowed set
    const nums = claim.value.match(/\b\d+\.?\d*\b/g) ?? [];
    nums.forEach((n) => allowedNums.add(n));
    // Also add the whole value
    allowedNums.add(claim.value.trim());
  }

  // Rule 3: every numeric token in paragraph.text must be in allowedNums
  const textNums = paragraph.text.match(/\b\d+\.?\d*\b/g) ?? [];
  for (const num of textNums) {
    if (!allowedNums.has(num)) {
      errors.push({
        type: "numeric_token",
        message: `Numeric token "${num}" in paragraph text is not from claims or environment reference values`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Validate all paragraphs; return valid ones, removed count, and error messages. */
export function validateResponse(
  paragraphs: Paragraph[],
  records: InvestigationRecord[],
  envs: EnvironmentProfile[],
  status: "answered" | "no_data" | "out_of_scope"
): {
  validParagraphs: Paragraph[];
  removedCount: number;
  errors: string[];
} {
  if (status !== "answered") {
    return { validParagraphs: [], removedCount: 0, errors: [] };
  }

  const validParagraphs: Paragraph[] = [];
  const errors: string[] = [];

  for (const p of paragraphs) {
    const result = validateParagraph(p, records, envs);
    if (result.valid) {
      validParagraphs.push(p);
    } else {
      errors.push(...result.errors.map((e) => e.message));
    }
  }

  return {
    validParagraphs,
    removedCount: paragraphs.length - validParagraphs.length,
    errors,
  };
}
