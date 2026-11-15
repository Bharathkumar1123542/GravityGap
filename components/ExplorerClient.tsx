"use client";
// components/ExplorerClient.tsx — Main Explorer UI
// spec §6.1, §6.2, §6.4 — FR-EXP-01, FR-EXP-02, FR-EXP-06, FR-RNK-01, FR-RNK-02
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useCallback, useRef, useState } from "react";
import { investigations, enabledEnvironments } from "@/lib/data";
import {
  parseState,
  filterRecords,
  serializeState,
  type ExplorerState,
} from "@/lib/explorer";
import { sortRecords } from "@/lib/scoring";
import { WeightPanel } from "@/components/WeightPanel";
import { FilterBar } from "@/components/FilterBar";
import { InvestigationTable } from "@/components/InvestigationTable";
import { InvestigationCards } from "@/components/InvestigationCards";
import { ExportButtons } from "@/components/ExportButtons";

const DEBOUNCE_MS = 200; // FR-EXP-06

export function ExplorerClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<ExplorerState>(() =>
    parseState(searchParams, enabledEnvironments)
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced URL update (200ms, FR-EXP-06)
  const updateURL = useCallback(
    (newState: ExplorerState) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const qs = serializeState(newState, enabledEnvironments);
        router.replace(`/?${qs}`, { scroll: false });
      }, DEBOUNCE_MS);
    },
    [router]
  );

  // Update state and URL
  const updateState = useCallback(
    (updates: Partial<ExplorerState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        updateURL(newState);
        return newState;
      });
    },
    [updateURL]
  );

  // Sync state with URL on mount and when searchParams change
  useEffect(() => {
    const urlState = parseState(searchParams, enabledEnvironments);
    setState(urlState);
  }, [searchParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const filtered = filterRecords(investigations, state);
  const sorted = sortRecords(filtered, enabledEnvironments, state.weights);

  // Check if all weights are zero
  const allZero = enabledEnvironments.every((e) => (state.weights[e.key] ?? 0) === 0);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Weights panel */}
        <aside className="lg:w-64 flex-shrink-0">
          <WeightPanel
            environments={enabledEnvironments}
            weights={state.weights}
            allZero={allZero}
            onWeightChange={(weights) => updateState({ weights })}
            onReset={() => {
              const defaultWeights = Object.fromEntries(
                enabledEnvironments.map((e) => [e.key, 0.5])
              );
              updateState({ weights: defaultWeights });
            }}
          />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <FilterBar
            state={state}
            count={sorted.length}
            total={investigations.length}
            onChange={updateState}
          />

          <div className="mt-6 space-y-4">
            <ExportButtons
              records={sorted}
              state={state}
              environments={enabledEnvironments}
            />

            {/* Desktop table (768px+) */}
            <div className="hidden md:block">
              <InvestigationTable
                records={sorted}
                environments={enabledEnvironments}
                weights={state.weights}
                allZero={allZero}
                sort={state.sort}
                dir={state.dir}
                onSortChange={(sort, dir) => updateState({ sort: sort as ExplorerState["sort"], dir })}
              />
            </div>

            {/* Mobile cards (< 768px) */}
            <div className="md:hidden">
              <InvestigationCards
                records={sorted}
                environments={enabledEnvironments}
                weights={state.weights}
                allZero={allZero}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
