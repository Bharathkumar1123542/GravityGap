import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import { fitIss, fitMoon, relevance, type Weights } from "@/lib/scoring";
import { COPY } from "@/lib/copy";
import type { ExplorerState } from "@/lib/explorer";

// RFC 4180 CSV cell escaping
function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (
    s.includes(",") ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function toCSV(
  records: InvestigationRecord[],
  envs: EnvironmentProfile[],
  weights: Weights
): string {
  const headers = [
    "id",
    "name",
    "full_name",
    "pillar",
    "pillar_status",
    "facility",
    "facility_status",
    "hardware",
    "hardware_status",
    "objective",
    "objective_status",
    "fuels",
    "fuels_status",
    "diluents",
    "diluents_status",
    "o2_min_pct",
    "o2_max_pct",
    "o2_pct_status",
    "pressure_min_psi",
    "pressure_max_psi",
    "pressure_psi_status",
    "airflow_min",
    "airflow_max",
    "airflow_unit",
    "airflow_status",
    "gravity_regime",
    "gravity_regime_status",
    "variables_varied",
    "variables_varied_status",
    "sensors",
    "sensors_status",
    "sub_experiments",
    "psi_url",
    "last_curated_at",
    "fit_iss",
    "fit_moon",
    "relevance_score",
    "source_count",
  ];

  const rows = records.map((r) => {
    const fi = fitIss(r, envs);
    const fm = fitMoon(r, envs);
    const rel = relevance(r, envs, weights).score;
    return [
      r.id,
      r.name,
      r.full_name ?? "",
      r.pillar.join("; "),
      r.verification.pillar,
      r.facility,
      r.verification.facility,
      r.hardware.join("; "),
      r.verification.hardware,
      r.objective ?? "",
      r.verification.objective,
      r.fuels.map((f) => `${f.name} (${f.form})`).join("; "),
      r.verification.fuels,
      r.diluents.join("; "),
      r.verification.diluents,
      r.o2_min_pct,
      r.o2_max_pct,
      r.verification.o2_pct,
      r.pressure_min_psi,
      r.pressure_max_psi,
      r.verification.pressure_psi,
      r.airflow.min,
      r.airflow.max,
      r.airflow.unit ?? "",
      r.verification.airflow,
      r.gravity_regime.join("; "),
      r.verification.gravity_regime,
      r.variables_varied.join("; "),
      r.verification.variables_varied,
      r.sensors.join("; "),
      r.verification.sensors,
      r.sub_experiments.join("; "),
      r.psi_url ?? "",
      r.last_curated_at,
      fi !== null ? fi.toFixed(2) : "",
      fm !== null ? fm.toFixed(2) : "",
      rel !== null ? rel : "",
      r.sources.length,
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}

export function toJSON(
  records: InvestigationRecord[],
  envs: EnvironmentProfile[],
  weights: Weights,
  filters: ExplorerState
): string {
  const now = new Date().toISOString();
  const data = records.map((r) => ({
    ...r,
    fit_iss: fitIss(r, envs),
    fit_moon: fitMoon(r, envs),
    relevance_score: relevance(r, envs, weights).score,
  }));
  const out = {
    schema_version: "1.0",
    exported_at: now,
    filters: {
      pillar: filters.pillar,
      fuel: filters.fuel,
      facility: filters.facility,
      gravity: filters.gravity,
      o2min: filters.o2min,
      o2max: filters.o2max,
      psimin: filters.psimin,
      psimax: filters.psimax,
      q: filters.q,
    },
    weights,
    data_notice: COPY["export.data_notice"],
    records: data,
  };
  return JSON.stringify(out, null, 2);
}

export function csvFilename(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `flame-in-freefall_${ts}.csv`;
}

export function jsonFilename(): string {
  return csvFilename().replace(".csv", ".json");
}
