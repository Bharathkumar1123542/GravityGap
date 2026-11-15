// Pure scoring functions for Flame in Freefall.
// FR-RNK-01, FR-RNK-02, FR-RNK-03; spec §5.2, §5.3, §5.4
// NO React / Next imports allowed in this file.

import { SCORING } from "@/config/scoring";
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";

// ── Primitive types ──────────────────────────────────────────────────────────

export type Range = { min: number; max: number };
export type Weights = Record<string, number>;

// ── Rounding helpers ─────────────────────────────────────────────────────────

/** Round to 2 decimal places (half-up). */
export const round2 = (x: number): number =>
  Math.round(Number((x * 100).toFixed(6))) / 100;

/** Round to nearest integer (half-up), used for the displayed score. */
export const roundScore = (x: number): number =>
  Math.round(Number(x.toFixed(6)));

function nullableRound2(x: number | null): number | null {
  return x === null ? null : round2(x);
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function findEnv(
  envs: EnvironmentProfile[],
  key: string
): EnvironmentProfile | undefined {
  return envs.find((e) => e.key === key);
}

/** Count non-null scoring field pairs for a record + environment set. */
function scoringFieldCount(
  r: InvestigationRecord,
  envs: EnvironmentProfile[],
  weights: Weights
): number {
  const enabledWithWeight = envs.filter(
    (e) => e.enabled && (weights[e.key] ?? 0) > 0
  );
  // We count distinct field types (o2, psi) that are non-null on the record,
  // regardless of environment (spec §5.3: "count of non-null pairs among o2 and pressure").
  let count = 0;
  if (r.o2_min_pct !== null && r.o2_max_pct !== null) count++;
  if (r.pressure_min_psi !== null && r.pressure_max_psi !== null) count++;
  // Only meaningful when there are envs we're scoring against
  return enabledWithWeight.length > 0 ? count : 0;
}

// ── Core fit functions ───────────────────────────────────────────────────────

/**
 * Linear fit of [test.min, test.max] against [target.min, target.max].
 * Returns 1.0 for full overlap, decays to 0 when gap >= tol.
 * spec §5.2
 */
export function rangeFit(test: Range, target: Range, tol: number): number {
  const gap = Math.max(0, target.min - test.max, test.min - target.max);
  return Math.max(0, 1 - gap / tol);
}

/** O₂ fit for a record against an environment. Returns null when any bound is missing. */
export function fitO2(
  r: InvestigationRecord,
  env: EnvironmentProfile
): number | null {
  if (
    r.o2_min_pct === null ||
    r.o2_max_pct === null ||
    env.o2_pct === null
  )
    return null;
  return rangeFit(
    { min: r.o2_min_pct, max: r.o2_max_pct },
    env.o2_pct,
    SCORING.o2_tolerance_pct
  );
}

/** Pressure fit for a record against an environment. Returns null when any bound is missing. */
export function fitPsi(
  r: InvestigationRecord,
  env: EnvironmentProfile
): number | null {
  if (
    r.pressure_min_psi === null ||
    r.pressure_max_psi === null ||
    env.pressure_psi === null
  )
    return null;
  return rangeFit(
    { min: r.pressure_min_psi, max: r.pressure_max_psi },
    env.pressure_psi,
    SCORING.psi_tolerance
  );
}

/**
 * Combined environment fit: average of whichever component fits are non-null.
 * Returns null only when BOTH components are null.
 */
export function envFit(
  r: InvestigationRecord,
  env: EnvironmentProfile
): number | null {
  const parts = [fitO2(r, env), fitPsi(r, env)].filter(
    (x): x is number => x !== null
  );
  return parts.length === 0
    ? null
    : parts.reduce((a, b) => a + b, 0) / parts.length;
}

// ── Breakdown row & relevance ────────────────────────────────────────────────

export type BreakdownRow = {
  env_key: string;
  label: string;
  weight: number;
  fit_o2: number | null;
  fit_psi: number | null;
  env_fit: number | null;
  counted: boolean;
};

export type Relevance = {
  score: number | null;
  rows: BreakdownRow[];
  weight_sum: number;
};

/**
 * Weighted relevance score for a record across all enabled environments.
 * spec §5.2 — FR-RNK-02
 */
export function relevance(
  r: InvestigationRecord,
  envs: EnvironmentProfile[],
  weights: Weights
): Relevance {
  const rows = envs
    .filter((e) => e.enabled)
    .map((e) => {
      const w = weights[e.key] ?? 0;
      const f = envFit(r, e);
      return {
        env_key: e.key,
        label: e.label,
        weight: w,
        fit_o2: fitO2(r, e),
        fit_psi: fitPsi(r, e),
        env_fit: f,
        counted: w > 0 && f !== null,
      };
    });

  const counted = rows.filter((x) => x.counted);
  const weight_sum = counted.reduce((a, x) => a + x.weight, 0);

  if (counted.length === 0) return { score: null, rows, weight_sum: 0 };

  const total = counted.reduce(
    (a, x) => a + x.weight * (x.env_fit as number),
    0
  );
  return { score: roundScore((100 * total) / weight_sum), rows, weight_sum };
}

// ── Convenience single-env fits (rounded to 2 dp) ───────────────────────────

/** fit_iss: envFit against the "iss" environment, rounded to 2 dp. */
export function fitIss(
  r: InvestigationRecord,
  envs: EnvironmentProfile[]
): number | null {
  const env = findEnv(envs, "iss");
  if (!env) return null;
  return nullableRound2(envFit(r, env));
}

/** fit_moon: envFit against the "moon_base" environment, rounded to 2 dp. */
export function fitMoon(
  r: InvestigationRecord,
  envs: EnvironmentProfile[]
): number | null {
  const env = findEnv(envs, "moon_base");
  if (!env) return null;
  return nullableRound2(envFit(r, env));
}

// ── Sort ─────────────────────────────────────────────────────────────────────

/**
 * Sort records for the Explorer view (spec §5.3 — FR-RNK-03):
 *   1. Scored (non-null score) before unscored.
 *   2. Integer score descending.
 *   3. Tie: higher scoring-field count first.
 *   4. Tie: name ascending (en locale, numeric).
 */
export function sortRecords(
  records: InvestigationRecord[],
  envs: EnvironmentProfile[],
  weights: Weights
): InvestigationRecord[] {
  const scored = records.map((r) => ({
    record: r,
    score: relevance(r, envs, weights).score,
    fieldCount: scoringFieldCount(r, envs, weights),
  }));

  return [...scored]
    .sort((a, b) => {
      // 1. Scored before unscored
      const aScored = a.score !== null ? 1 : 0;
      const bScored = b.score !== null ? 1 : 0;
      if (aScored !== bScored) return bScored - aScored;

      // 2. Score descending
      if (a.score !== null && b.score !== null && a.score !== b.score) {
        return b.score - a.score;
      }

      // 3. Scoring-field count descending
      if (a.fieldCount !== b.fieldCount) return b.fieldCount - a.fieldCount;

      // 4. Name ascending (en locale, numeric)
      return a.record.name.localeCompare(b.record.name, "en", {
        numeric: true,
      });
    })
    .map((x) => x.record);
}
