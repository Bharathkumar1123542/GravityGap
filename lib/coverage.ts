import type { InvestigationRecord } from "@/lib/schema";

export type Gravity = "microgravity" | "normal_gravity" | "partial_gravity";

export const O2_BINS = [
  { label: "0–20%", min: 0, max: 20, closed: false },
  { label: "20–25%", min: 20, max: 25, closed: false },
  { label: "25–30%", min: 25, max: 30, closed: false },
  { label: "30–40%", min: 30, max: 40, closed: false },
  { label: "40–60%", min: 40, max: 60, closed: false },
  { label: "60–100%", min: 60, max: 100, closed: true },
] as const;

export const PSI_BINS = [
  { label: "0–5", min: 0, max: 5, closed: false },
  { label: "5–10.2", min: 5, max: 10.2, closed: false },
  { label: "10.2–14.7", min: 10.2, max: 14.7, closed: false },
  { label: "14.7+", min: 14.7, max: Infinity, closed: true },
] as const;

function o2Intersects(
  lo: number,
  hi: number,
  bin: { min: number; max: number; closed: boolean }
): boolean {
  if (bin.closed) return lo <= bin.max && hi >= bin.min;
  return lo < bin.max && hi >= bin.min;
}

function psiIntersects(
  lo: number,
  hi: number,
  bin: { min: number; max: number; closed: boolean }
): boolean {
  if (bin.closed) return hi >= bin.min; // 14.7+ is always closed upward
  return lo < bin.max && hi >= bin.min;
}

export type GridOptions = {
  regime?: Gravity;
  airflow?: "has" | "no" | null;
};

export function buildGrid(
  records: InvestigationRecord[],
  options: GridOptions = {}
): number[][] {
  let filtered = records.filter(
    (r) =>
      r.o2_min_pct !== null &&
      r.o2_max_pct !== null &&
      r.pressure_min_psi !== null &&
      r.pressure_max_psi !== null
  );

  if (options.regime) {
    filtered = filtered.filter((r) =>
      r.gravity_regime.includes(options.regime!)
    );
  }
  if (options.airflow === "has") {
    filtered = filtered.filter(
      (r) => r.airflow.min !== null && r.airflow.max !== null
    );
  } else if (options.airflow === "no") {
    filtered = filtered.filter(
      (r) => r.airflow.min === null || r.airflow.max === null
    );
  }

  return O2_BINS.map((o2bin) =>
    PSI_BINS.map(
      (psibin) =>
        filtered.filter(
          (r) =>
            o2Intersects(r.o2_min_pct!, r.o2_max_pct!, o2bin) &&
            psiIntersects(r.pressure_min_psi!, r.pressure_max_psi!, psibin)
        ).length
    )
  );
}

export function noDataCount(records: InvestigationRecord[]): number {
  return records.filter(
    (r) =>
      r.o2_min_pct === null ||
      r.o2_max_pct === null ||
      r.pressure_min_psi === null ||
      r.pressure_max_psi === null
  ).length;
}
