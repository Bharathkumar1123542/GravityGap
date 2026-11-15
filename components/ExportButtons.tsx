"use client";
// components/ExportButtons.tsx — CSV and JSON export buttons
// spec §7 — FR-XPT-01
import type { InvestigationRecord, EnvironmentProfile } from "@/lib/schema";
import type { ExplorerState } from "@/lib/explorer";
import { toCSV, toJSON } from "@/lib/export";
import { COPY } from "@/lib/copy";

type Props = {
  records: InvestigationRecord[];
  state: ExplorerState;
  environments: EnvironmentProfile[];
};

export function ExportButtons({ records, state, environments }: Props) {
  const disabled = records.length === 0;

  const handleCSV = () => {
    const csv = toCSV(records, environments, state.weights);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0].replace("T", "-");
    const filename = `flame-in-freefall_${timestamp}.csv`;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleJSON = () => {
    const json = toJSON(records, environments, state.weights, state);
    const blob = new Blob([JSON.stringify(JSON.parse(json), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, "").split(".")[0].replace("T", "-");
    const filename = `flame-in-freefall_${timestamp}.json`;
    
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleCSV}
        disabled={disabled}
        title={disabled ? COPY["export.empty"] : undefined}
        className="px-4 py-2 bg-surface-raised border border-border-strong rounded text-sm text-text hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Export CSV
      </button>
      <button
        onClick={handleJSON}
        disabled={disabled}
        title={disabled ? COPY["export.empty"] : undefined}
        className="px-4 py-2 bg-surface-raised border border-border-strong rounded text-sm text-text hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-focus"
      >
        Export JSON
      </button>
    </div>
  );
}
