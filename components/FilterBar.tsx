"use client";
// components/FilterBar.tsx — Filters and search for Explorer
// spec §6.4 — FR-EXP-02, FR-EXP-06
import type { ExplorerState, Pillar, FuelForm, Facility, Gravity } from "@/lib/explorer";

type Props = {
  state: ExplorerState;
  count: number;
  total: number;
  onChange: (updates: Partial<ExplorerState>) => void;
};

export function FilterBar({ state, count, total, onChange }: Props) {
  const resetFilters = () => {
    onChange({
      q: "",
      pillar: null,
      fuel: null,
      facility: null,
      gravity: null,
      o2min: null,
      o2max: null,
      psimin: null,
      psimax: null,
      group: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <input
          type="text"
          id="search"
          placeholder="Search investigations..."
          value={state.q}
          onChange={(e) => onChange({ q: e.target.value })}
          className="w-full px-4 py-2 bg-surface-raised border border-border-strong rounded text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-focus"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={state.pillar ?? ""}
          onChange={(e) => onChange({ pillar: (e.target.value || null) as Pillar | null })}
          className="px-3 py-2 bg-surface-raised border border-border-strong rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus"
        >
          <option value="">All pillars</option>
          <option value="prevention">Prevention</option>
          <option value="detection">Detection</option>
          <option value="suppression">Suppression</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <select
          value={state.fuel ?? ""}
          onChange={(e) => onChange({ fuel: (e.target.value || null) as FuelForm | null })}
          className="px-3 py-2 bg-surface-raised border border-border-strong rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus"
        >
          <option value="">All fuels</option>
          <option value="solid">Solid</option>
          <option value="liquid_droplet">Liquid droplet</option>
          <option value="gas">Gas</option>
          <option value="dust">Dust</option>
          <option value="other">Other</option>
        </select>

        <select
          value={state.facility ?? ""}
          onChange={(e) => onChange({ facility: (e.target.value || null) as Facility | null })}
          className="px-3 py-2 bg-surface-raised border border-border-strong rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus"
        >
          <option value="">All facilities</option>
          <option value="CIR">CIR</option>
          <option value="MSG">MSG</option>
          <option value="other">Other</option>
          <option value="not_stated">Not stated</option>
        </select>

        <select
          value={state.gravity ?? ""}
          onChange={(e) => onChange({ gravity: (e.target.value || null) as Gravity | null })}
          className="px-3 py-2 bg-surface-raised border border-border-strong rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus"
        >
          <option value="">All gravity</option>
          <option value="microgravity">Microgravity</option>
          <option value="normal_gravity">Normal gravity</option>
          <option value="partial_gravity">Partial gravity</option>
        </select>

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-surface border border-border-strong rounded text-sm text-text hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-focus"
        >
          Reset filters
        </button>

        <div className="ml-auto text-sm text-text-muted" aria-live="polite">
          {count} of {total} shown
        </div>
      </div>
    </div>
  );
}
