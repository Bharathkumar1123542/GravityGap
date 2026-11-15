import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import type { Weights } from "@/lib/scoring";

export type Pillar = "prevention" | "detection" | "suppression" | "unassigned";
export type FuelForm = "solid" | "liquid_droplet" | "gas" | "dust" | "other";
export type Facility = "CIR" | "MSG" | "other" | "not_stated";
export type Gravity = "microgravity" | "normal_gravity" | "partial_gravity";

export type ExplorerState = {
  q: string;
  pillar: Pillar | null;
  fuel: FuelForm | null;
  facility: Facility | null;
  gravity: Gravity | null;
  o2min: number | null;
  o2max: number | null;
  psimin: number | null;
  psimax: number | null;
  weights: Weights;
  sort: "name" | "pillar" | "fuel" | "o2" | "psi" | "gravity" | "score";
  dir: "asc" | "desc";
  group: boolean;
};

export function defaultState(envs: EnvironmentProfile[]): ExplorerState {
  const weights: Weights = {};
  envs.filter((e) => e.enabled).forEach((e) => {
    weights[e.key] = 0.5;
  });
  return {
    q: "",
    pillar: null,
    fuel: null,
    facility: null,
    gravity: null,
    o2min: null,
    o2max: null,
    psimin: null,
    psimax: null,
    weights,
    sort: "score",
    dir: "desc",
    group: false,
  };
}

export function parseState(
  search: URLSearchParams,
  envs: EnvironmentProfile[]
): ExplorerState {
  const state = defaultState(envs);
  const PILLARS: Pillar[] = [
    "prevention",
    "detection",
    "suppression",
    "unassigned",
  ];
  const FUELS: FuelForm[] = [
    "solid",
    "liquid_droplet",
    "gas",
    "dust",
    "other",
  ];
  const FACILITIES: Facility[] = ["CIR", "MSG", "other", "not_stated"];
  const GRAVITIES: Gravity[] = [
    "microgravity",
    "normal_gravity",
    "partial_gravity",
  ];
  const SORTS = [
    "name",
    "pillar",
    "fuel",
    "o2",
    "psi",
    "gravity",
    "score",
  ] as const;

  const q = search.get("q");
  if (q !== null) state.q = q;

  const pillar = search.get("pillar");
  if (pillar && PILLARS.includes(pillar as Pillar))
    state.pillar = pillar as Pillar;

  const fuel = search.get("fuel");
  if (fuel && FUELS.includes(fuel as FuelForm)) state.fuel = fuel as FuelForm;

  const facility = search.get("facility");
  if (facility && FACILITIES.includes(facility as Facility))
    state.facility = facility as Facility;

  const gravity = search.get("gravity");
  if (gravity && GRAVITIES.includes(gravity as Gravity))
    state.gravity = gravity as Gravity;

  const o2min = search.get("o2min");
  if (o2min !== null && !isNaN(Number(o2min))) state.o2min = Number(o2min);

  const o2max = search.get("o2max");
  if (o2max !== null && !isNaN(Number(o2max))) state.o2max = Number(o2max);

  const psimin = search.get("psimin");
  if (psimin !== null && !isNaN(Number(psimin)))
    state.psimin = Number(psimin);

  const psimax = search.get("psimax");
  if (psimax !== null && !isNaN(Number(psimax)))
    state.psimax = Number(psimax);

  envs.filter((e) => e.enabled).forEach((e) => {
    const val = search.get(`w_${e.key}`);
    if (val !== null) {
      const n = Number(val);
      if (!isNaN(n) && n >= 0 && n <= 1) {
        // round to nearest step
        state.weights[e.key] = Math.round(n / 0.05) * 0.05;
      }
    }
  });

  const sort = search.get("sort");
  if (sort && SORTS.includes(sort as (typeof SORTS)[number]))
    state.sort = sort as (typeof SORTS)[number];

  const dir = search.get("dir");
  if (dir === "asc" || dir === "desc") state.dir = dir;

  state.group = search.get("group") === "pillar";

  return state;
}

export function serializeState(
  state: ExplorerState,
  envs: EnvironmentProfile[]
): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.pillar) params.set("pillar", state.pillar);
  if (state.fuel) params.set("fuel", state.fuel);
  if (state.facility) params.set("facility", state.facility);
  if (state.gravity) params.set("gravity", state.gravity);
  if (state.o2min !== null) params.set("o2min", String(state.o2min));
  if (state.o2max !== null) params.set("o2max", String(state.o2max));
  if (state.psimin !== null) params.set("psimin", String(state.psimin));
  if (state.psimax !== null) params.set("psimax", String(state.psimax));

  envs.filter((e) => e.enabled).forEach((e) => {
    if ((state.weights[e.key] ?? 0.5) !== 0.5)
      params.set(`w_${e.key}`, String(state.weights[e.key]));
  });

  if (state.sort !== "score") params.set("sort", state.sort);
  const defaultDir = state.sort === "score" ? "desc" : "asc";
  if (state.dir !== defaultDir) params.set("dir", state.dir);
  if (state.group) params.set("group", "pillar");

  return params.toString();
}

export function filterRecords(
  records: InvestigationRecord[],
  state: ExplorerState
): InvestigationRecord[] {
  return records.filter((r) => {
    if (state.pillar && !r.pillar.includes(state.pillar)) return false;
    if (state.fuel && !r.fuels.some((f) => f.form === state.fuel)) return false;
    if (state.facility && r.facility !== state.facility) return false;
    if (state.gravity && !r.gravity_regime.includes(state.gravity))
      return false;

    // O2 range intersection
    if (state.o2min !== null || state.o2max !== null) {
      if (r.o2_min_pct === null || r.o2_max_pct === null) return false;
      const qmin = state.o2min ?? -Infinity;
      const qmax = state.o2max ?? Infinity;
      if (r.o2_max_pct < qmin || r.o2_min_pct > qmax) return false;
    }

    // Pressure range intersection
    if (state.psimin !== null || state.psimax !== null) {
      if (r.pressure_min_psi === null || r.pressure_max_psi === null)
        return false;
      const qmin = state.psimin ?? -Infinity;
      const qmax = state.psimax ?? Infinity;
      if (r.pressure_max_psi < qmin || r.pressure_min_psi > qmax) return false;
    }

    // Text search
    if (state.q) {
      const q = state.q.trim().toLowerCase();
      const name = r.name.toLowerCase();
      const obj = (r.objective ?? "").toLowerCase();
      const sensors = r.sensors.map((s) => s.toLowerCase()).join(" ");
      if (!name.includes(q) && !obj.includes(q) && !sensors.includes(q))
        return false;
    }

    return true;
  });
}
