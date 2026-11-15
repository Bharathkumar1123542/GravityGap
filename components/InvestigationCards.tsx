"use client";
// components/InvestigationCards.tsx — Mobile card view
// spec §6.4 — FR-EXP-01
import Link from "next/link";
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import type { Weights } from "@/lib/scoring";
import { relevance } from "@/lib/scoring";
import PillarChip from "@/components/PillarChip";
import { COPY } from "@/lib/copy";

type Props = {
  records: InvestigationRecord[];
  environments: EnvironmentProfile[];
  weights: Weights;
  allZero: boolean;
};

export function InvestigationCards({
  records,
  environments,
  weights,
  allZero,
}: Props) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        {COPY["explorer.empty"]}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((r) => {
        const score = allZero ? null : relevance(r, environments, weights).score;
        const fuelForms = r.fuels.length > 0
          ? [...new Set(r.fuels.map((f) => f.form))].join(", ")
          : "not available";
        
        const o2Display =
          r.o2_min_pct !== null && r.o2_max_pct !== null
            ? `${r.o2_min_pct}–${r.o2_max_pct}%`
            : "not available";
        
        const psiDisplay =
          r.pressure_min_psi !== null && r.pressure_max_psi !== null
            ? `${r.pressure_min_psi}–${r.pressure_max_psi} psi`
            : "not available";

        return (
          <div
            key={r.id}
            className="bg-surface-raised border border-border rounded-md p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <Link
                href={`/investigations/${r.id}`}
                className="text-accent hover:underline font-medium text-lg"
              >
                {r.name}
              </Link>
              {!allZero && (
                <div className="text-lg font-mono text-text ml-4">
                  {score !== null ? score : "Unscored"}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-text-muted">Pillar: </span>
                <div className="inline-flex flex-wrap gap-1 mt-1">
                  {r.pillar.map((p) => (
                    <PillarChip key={p} pillar={p} />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-text-muted">Fuel: </span>
                <span className="text-text">{fuelForms}</span>
              </div>

              <div>
                <span className="text-text-muted">O2: </span>
                <span className="text-text font-mono">{o2Display}</span>
              </div>

              <div>
                <span className="text-text-muted">Pressure: </span>
                <span className="text-text font-mono">{psiDisplay}</span>
              </div>

              <div>
                <span className="text-text-muted">Gravity: </span>
                <span className="text-text">{r.gravity_regime.join(", ")}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
