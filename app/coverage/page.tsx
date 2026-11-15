"use client";
// app/coverage/page.tsx — Coverage gap map
// spec §6.9 — FR-COV-01 to FR-COV-03
import { useState } from "react";
import { investigations } from "@/lib/data";
import { buildGrid, type GridOptions } from "@/lib/coverage";
import { COPY } from "@/lib/copy";

const O2_BINS = [
  { label: "0–20%", min: 0, max: 20 },
  { label: "20–25%", min: 20, max: 25 },
  { label: "25–30%", min: 25, max: 30 },
  { label: "30–40%", min: 30, max: 40 },
  { label: "40–60%", min: 40, max: 60 },
  { label: "60–100%", min: 60, max: 100 },
];

const PSI_BINS = [
  { label: "0–5", min: 0, max: 5 },
  { label: "5–10.2", min: 5, max: 10.2 },
  { label: "10.2–14.7", min: 10.2, max: 14.7 },
  { label: "14.7+", min: 14.7, max: Infinity },
];

export default function CoveragePage() {
  const [regime, setRegime] = useState<"microgravity" | "normal_gravity" | "partial_gravity">(
    "microgravity"
  );
  const [airflow, setAirflow] = useState<"has" | "no" | null>(null);

  const filters: GridOptions = { regime, airflow };
  const grid = buildGrid(investigations, filters);

  const excluded = investigations.filter(
    (r) => r.o2_min_pct === null || r.o2_max_pct === null || r.pressure_min_psi === null || r.pressure_max_psi === null
  ).length;

  const isPartialGravity = regime === "partial_gravity";

  return (
    <main id="main" className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold text-text mb-6">Coverage</h1>
      <p className="text-text leading-relaxed mb-6">
        How many investigations tested each combination of oxygen % and pressure?
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div>
          <label htmlFor="regime" className="block text-sm font-medium text-text mb-1">
            Gravity regime
          </label>
          <select
            id="regime"
            value={regime}
            onChange={(e) =>
              setRegime(e.target.value as typeof regime)
            }
            className="px-3 py-2 bg-surface-raised border border-border-strong rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="microgravity">Microgravity</option>
            <option value="normal_gravity">Normal gravity</option>
            <option value="partial_gravity">Partial gravity</option>
          </select>
        </div>

        <div>
          <label htmlFor="airflow" className="block text-sm font-medium text-text mb-1">
            Airflow
          </label>
          <select
            id="airflow"
            value={airflow === null ? "any" : airflow}
            onChange={(e) =>
              setAirflow(
                e.target.value === "any" ? null : (e.target.value as "has" | "no")
              )
            }
            className="px-3 py-2 bg-surface-raised border border-border-strong rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="any">Any</option>
            <option value="has">Has airflow data</option>
            <option value="no">No airflow data</option>
          </select>
        </div>
      </div>

      {excluded > 0 && (
        <p className="text-sm text-text-muted mb-4">
          {excluded} {excluded === 1 ? "record has" : "records have"} no O2 or
          pressure data and {excluded === 1 ? "is" : "are"} not shown.
        </p>
      )}

      {isPartialGravity && (
        <div
          className="bg-warning-surface border border-warning rounded-lg p-4 mb-6"
          role="alert"
        >
          <p className="text-warning-text">{COPY["coverage.partial_gravity"]}</p>
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-sm"
          role="table"
          aria-label="Coverage grid showing investigation count by oxygen percentage and pressure"
        >
          <thead>
            <tr>
              <th
                scope="col"
                className="border border-border p-2 bg-surface-raised text-text font-semibold"
              >
                O2 % \ Pressure (psi)
              </th>
              {PSI_BINS.map((bin) => (
                <th
                  key={bin.label}
                  scope="col"
                  className="border border-border p-2 bg-surface-raised text-text font-semibold"
                >
                  {bin.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {O2_BINS.map((o2Bin, oIdx) => (
              <tr key={o2Bin.label}>
                <th
                  scope="row"
                  className="border border-border p-2 bg-surface-raised text-text font-semibold"
                >
                  {o2Bin.label}
                </th>
                {PSI_BINS.map((psiBin, pIdx) => {
                  const count = grid[oIdx]?.[pIdx] ?? 0;
                  const isGap = count === 0;

                  return (
                    <td
                      key={psiBin.label}
                      className={`border border-border p-4 text-center font-mono text-text ${
                        isGap
                          ? "bg-surface bg-[repeating-linear-gradient(45deg,var(--surface),var(--surface)_10px,var(--surface-raised)_10px,var(--surface-raised)_20px)]"
                          : "bg-surface-raised"
                      }`}
                    >
                      {isGap ? (
                        <span className="text-text-muted flex flex-col items-center gap-1">
                          <span className="text-xs uppercase tracking-wider">gap</span>
                          <span aria-hidden="true">{'////'}</span>
                        </span>
                      ) : (
                        count
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-text-muted">
        <p>
          A record counts in a cell when its tested O2 and pressure ranges
          intersect the cell&rsquo;s bins.
        </p>
      </div>
    </main>
  );
}
