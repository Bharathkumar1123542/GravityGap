"use client";
// components/InvestigationTable.tsx — Desktop table view
// spec §6.4 — FR-EXP-01, FR-EXP-07
import Link from "next/link";
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import type { Weights } from "@/lib/scoring";
import { relevance } from "@/lib/scoring";
import PillarChip from "@/components/PillarChip";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { useCompare } from "@/components/CompareProvider";
import { COPY } from "@/lib/copy";

type Props = {
  records: InvestigationRecord[];
  environments: EnvironmentProfile[];
  weights: Weights;
  allZero: boolean;
  sort: string;
  dir: "asc" | "desc";
};

export function InvestigationTable({
  records,
  environments,
  weights,
  allZero,
}: Props) {
  const { ids, add, remove } = useCompare();

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        {COPY["explorer.empty"]}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-surface-raised border-b border-border">
            <th className="px-4 py-3 w-12">
              <span className="sr-only">Compare</span>
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">
              Pillar
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">
              Fuel
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">
              O2 %
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">
              Pressure (psi)
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-text">
              Gravity
            </th>
            {!allZero && (
              <th className="px-4 py-3 text-right text-sm font-semibold text-text">
                Score
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const score = allZero ? null : relevance(r, environments, weights).score;
            const fuelForms = r.fuels.length > 0
              ? [...new Set(r.fuels.map((f) => f.form))].join(", ")
              : "not available";
            
            const o2Display =
              r.o2_min_pct !== null && r.o2_max_pct !== null
                ? `${r.o2_min_pct}–${r.o2_max_pct}`
                : "not available";
            
            const psiDisplay =
              r.pressure_min_psi !== null && r.pressure_max_psi !== null
                ? `${r.pressure_min_psi}–${r.pressure_max_psi}`
                : "not available";

            return (
              <>
                <tr key={r.id} className="border-b border-border hover:bg-surface-raised">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={ids.includes(r.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const result = add(r.id);
                        if (!result.ok && result.message) {
                          alert(result.message);
                        }
                      } else {
                        remove(r.id);
                      }
                    }}
                    className="w-4 h-4 rounded border-border-strong focus:ring-2 focus:ring-focus"
                    aria-label={`Compare ${r.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/investigations/${r.id}`}
                    className="text-accent hover:underline font-medium"
                  >
                    {r.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.pillar.map((p) => (
                      <PillarChip key={p} pillar={p} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-text">{fuelForms}</td>
                <td className="px-4 py-3 text-sm text-text font-mono">{o2Display}</td>
                <td className="px-4 py-3 text-sm text-text font-mono">{psiDisplay}</td>
                <td className="px-4 py-3 text-sm text-text">
                  {r.gravity_regime.join(", ")}
                </td>
                {!allZero && (
                  <td className="px-4 py-3 text-right text-sm text-text font-mono">
                    {score !== null ? score : "Unscored"}
                  </td>
                )}
              </tr>
              <tr className="border-b border-border">
                <td></td>
                <td colSpan={!allZero ? 7 : 6} className="px-4 py-3">
                  <ScoreBreakdown
                    record={r}
                    environments={environments}
                    weights={weights}
                    score={score}
                  />
                </td>
              </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
