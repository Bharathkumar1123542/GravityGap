// Scoring constants — all tunable values live here (never inline).
// FR-RNK-01; spec §5.1
export const SCORING = {
  o2_tolerance_pct: 10,   // percentage points (gap beyond which fit_o2 = 0)
  psi_tolerance: 3.0,     // psi (gap beyond which fit_psi = 0)
  weight_min: 0,
  weight_max: 1,
  weight_step: 0.05,
  weight_default: 0.5,
} as const;
