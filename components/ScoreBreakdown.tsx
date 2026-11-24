"use client";
// components/ScoreBreakdown.tsx — Expandable score breakdown
// spec §6.4 — FR-RNK-03
import { useState } from "react";
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import type { Weights } from "@/lib/scoring";
import { relevance } from "@/lib/scoring";

type Props = {
  record: InvestigationRecord;
  environments: EnvironmentProfile[];
  weights: Weights;
  score: number | null;
};

export function ScoreBreakdown({ record, environments, weights, score }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { rows, weight_sum } = relevance(record, environments, weights);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-focus rounded"
        aria-expanded={expanded}
      >
        <span aria-hidden="true">{expanded ? "▼" : "▶"}</span>
        <span>Show breakdown</span>
      </button>

      {expanded && (
        <div className="mt-3 p-4 bg-surface rounded border border-border text-sm space-y-3">
          {rows.map((row) => {
            const fit_o2_str = row.fit_o2 !== null ? row.fit_o2.toFixed(2) : "n/a";
            const fit_psi_str = row.fit_psi !== null ? row.fit_psi.toFixed(2) : "n/a";
            const env_fit_str = row.env_fit !== null ? row.env_fit.toFixed(2) : "n/a";

            return (
              <div key={row.env_key} className="space-y-1">
                <div className="font-semibold text-text">
                  {row.label} (weight {row.weight.toFixed(2)})
                </div>
                <div className="font-mono text-text-muted text-xs space-y-0.5">
                  <div>fit_o2: {fit_o2_str}</div>
                  <div>fit_psi: {fit_psi_str}</div>
                  <div>env_fit: {env_fit_str}</div>
                </div>
                {!row.counted && (
                  <div className="text-xs text-text-muted italic">
                    {row.weight === 0
                      ? "not counted (weight 0)"
                      : "not counted (no data)"}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-3 border-t border-border">
            <div className="font-mono text-xs text-text">
              Score = 100 × (
              {rows
                .filter((r) => r.counted)
                .map((r) => `${r.weight.toFixed(2)} × ${r.env_fit!.toFixed(2)}`)
                .join(" + ")}
              ) / {weight_sum.toFixed(2)}
            </div>
            <div className="font-mono text-xs text-text mt-1">
              = <span className="font-semibold">{score !== null ? score : "n/a"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
