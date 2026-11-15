// lib/ai/augment.ts — build the prompt payload (spec-addendum §8.2)
// FR-AI-02; NFR-ACC-AI-02
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import { fitIss, fitMoon } from "@/lib/scoring";

export type AugmentedRecord = InvestigationRecord & {
  fit_iss: number | null;
  fit_moon: number | null;
};

export function augmentRecords(
  records: InvestigationRecord[],
  envs: EnvironmentProfile[]
): AugmentedRecord[] {
  return records.map((r) => ({
    ...r,
    fit_iss: fitIss(r, envs),
    fit_moon: fitMoon(r, envs),
  }));
}

export function buildPayload(
  records: InvestigationRecord[],
  envs: EnvironmentProfile[]
): { payload: string; sizeBytes: number } {
  const augmented = augmentRecords(records, envs);
  const enabled = envs.filter((e) => e.enabled);
  const payload = JSON.stringify({ records: augmented, environments: enabled });
  const sizeBytes = Buffer.byteLength(payload, "utf8");
  return { payload, sizeBytes };
}
