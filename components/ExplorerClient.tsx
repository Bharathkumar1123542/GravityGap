"use client";
// components/ExplorerClient.tsx — Main Explorer UI
// spec §6.1, §6.2, §6.4 — FR-EXP-01, FR-EXP-02, FR-RNK-01, FR-RNK-02
import { useSearchParams } from "next/navigation";
import { investigations, enabledEnvironments } from "@/lib/data";
import {
  parseState,
  filterRecords,
} from "@/lib/explorer";
import { sortRecords } from "@/lib/scoring";
import { WeightPanel } from "@/components/WeightPanel";
import { FilterBar } from "@/components/FilterBar";
import { InvestigationTable } from "@/components/InvestigationTable";
import { InvestigationCards } from "@/components/InvestigationCards";
import { ExportButtons } from "@/components/ExportButtons";

export function ExplorerClient() {
  const searchParams = useSearchParams();
  const state = parseState(searchParams, enabledEnvironments);

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
          />
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <FilterBar
            state={state}
            count={sorted.length}
            total={investigations.length}
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
