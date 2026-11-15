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

/**
 * Export compare view as CSV (FR-CMP-05)
 * One column per investigation, rows for each field
 */
export function compareToCSV(records: InvestigationRecord[]): string {
  if (records.length === 0) return "";

  // Header: Field, Investigation 1, Investigation 2, ...
  const headers = ["Field", ...records.map((r) => r.name)];

  // Build rows for each field
  const rows: string[][] = [];

  // Full name
  rows.push([
    "Full name",
    ...records.map((r) => r.full_name ?? "not available"),
  ]);

  // Pillar
  rows.push([
    "Pillar",
    ...records.map((r) => r.pillar.join("; ")),
  ]);

  // Facility
  rows.push([
    "Facility",
    ...records.map((r) => r.facility),
  ]);

  // Hardware
  rows.push([
    "Hardware",
    ...records.map((r) => r.hardware.join("; ")),
  ]);

  // Objective
  rows.push([
    "Objective",
    ...records.map((r) => r.objective ?? "not available"),
  ]);

  // Fuels
  rows.push([
    "Fuels",
    ...records.map((r) =>
      r.fuels.length > 0
        ? r.fuels.map((f) => `${f.name} (${f.form})`).join("; ")
        : "not available"
    ),
  ]);

  // Diluents
  rows.push([
    "Diluents",
    ...records.map((r) =>
      r.diluents.length > 0 ? r.diluents.join("; ") : "not available"
    ),
  ]);

  // Oxygen %
  rows.push([
    "Oxygen % (min-max)",
    ...records.map((r) =>
      r.o2_min_pct !== null && r.o2_max_pct !== null
        ? `${r.o2_min_pct}-${r.o2_max_pct}`
        : "not available"
    ),
  ]);

  // Pressure
  rows.push([
    "Pressure psi (min-max)",
    ...records.map((r) =>
      r.pressure_min_psi !== null && r.pressure_max_psi !== null
        ? `${r.pressure_min_psi}-${r.pressure_max_psi}`
        : "not available"
    ),
  ]);

  // Airflow
  rows.push([
    "Airflow",
    ...records.map((r) =>
      r.airflow.min !== null && r.airflow.max !== null && r.airflow.unit !== null
        ? `${r.airflow.min}-${r.airflow.max} ${r.airflow.unit}`
        : "not available"
    ),
  ]);

  // Gravity regime
  rows.push([
    "Gravity regime",
    ...records.map((r) => r.gravity_regime.join("; ")),
  ]);

  // Variables varied
  rows.push([
    "Variables varied",
    ...records.map((r) =>
      r.variables_varied.length > 0
        ? r.variables_varied.join("; ")
        : "not available"
    ),
  ]);

  // Sensors
  rows.push([
    "Sensors",
    ...records.map((r) =>
      r.sensors.length > 0 ? r.sensors.join("; ") : "not available"
    ),
  ]);

  // Sub-experiments
  rows.push([
    "Sub-experiments",
    ...records.map((r) =>
      r.sub_experiments.length > 0
        ? r.sub_experiments.join("; ")
        : "not available"
    ),
  ]);

  // PSI URL
  rows.push([
    "PSI URL",
    ...records.map((r) => r.psi_url ?? "not available"),
  ]);

  // Sources count
  rows.push([
    "Sources count",
    ...records.map((r) => r.sources.length.toString()),
  ]);

  // Last curated
  rows.push([
    "Last curated",
    ...records.map((r) => r.last_curated_at),
  ]);

  // Construct CSV
  const csvRows = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];

  return csvRows.join("\r\n");
}

export function compareCSVFilename(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `flame-in-freefall_compare_${ts}.csv`;
}
