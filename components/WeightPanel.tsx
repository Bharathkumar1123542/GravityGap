"use client";
// components/WeightPanel.tsx — Environment weight sliders
// spec §6.4 — FR-RNK-01, FR-RNK-02, FR-RNK-04
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { EnvironmentProfile } from "@/lib/schema";
import type { Weights } from "@/lib/scoring";
import { SCORING } from "@/config/scoring";
import { COPY } from "@/lib/copy";

type Props = {
  environments: EnvironmentProfile[];
  weights: Weights;
  allZero: boolean;
};

export function WeightPanel({ environments, weights, allZero }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateWeight = (key: string, value: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 0.5) {
      params.delete(`w_${key}`);
    } else {
      params.set(`w_${key}`, value.toFixed(2));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const resetWeights = () => {
    const params = new URLSearchParams(searchParams.toString());
    environments.forEach((e) => params.delete(`w_${e.key}`));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const moonWeight = weights.moon_base ?? 0;

  return (
    <div className="bg-surface-raised rounded-md p-4 border border-border-strong">
      <h2 className="text-lg font-semibold mb-4 text-text">
        Environment Weights
      </h2>

      <div className="space-y-6 mb-6">
        {environments.map((env) => {
          const w = weights[env.key] ?? SCORING.weight_default;
          return (
            <div key={env.key}>
              <label htmlFor={`weight-${env.key}`} className="block text-sm font-medium text-text mb-1">
                {env.label}
              </label>
              <input
                type="range"
                id={`weight-${env.key}`}
                min={SCORING.weight_min}
                max={SCORING.weight_max}
                step={SCORING.weight_step}
                value={w}
                onChange={(e) => updateWeight(env.key, Number(e.target.value))}
                className="w-full"
                aria-valuenow={w}
                aria-valuemin={SCORING.weight_min}
                aria-valuemax={SCORING.weight_max}
              />
              <div className="text-xs text-text-muted mt-1 font-mono">
                {w.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={resetWeights}
        className="w-full px-3 py-2 bg-surface border border-border-strong rounded text-sm text-text hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2 focus:ring-offset-surface"
      >
        Reset weights
      </button>

      <div className="mt-6 text-sm text-text-muted space-y-2">
        <p>Score = weighted mean of per-environment fit.</p>
        <a
          href="/about#scoring"
          className="text-accent hover:underline inline-block"
        >
          How scoring works
        </a>
      </div>

      {allZero && (
        <div
          className="mt-4 p-3 bg-warning-surface border border-warning rounded text-sm text-warning-text"
          role="alert"
        >
          {COPY["rank.zero_weights"]}
        </div>
      )}

      {moonWeight > 0 && (
        <div
          className="mt-4 p-3 bg-warning-surface border border-warning rounded text-sm text-warning-text flex items-start gap-2"
          role="note"
        >
          <span aria-label="Warning" className="flex-shrink-0">⚠</span>
          <span>{COPY["badge.extrapolation_rank"]}</span>
        </div>
      )}
    </div>
  );
}
