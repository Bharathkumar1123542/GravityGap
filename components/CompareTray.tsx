"use client";
// components/CompareTray.tsx — Sticky compare tray
// spec §6.4 — FR-CMP-01
import { useRouter } from "next/navigation";
import { useCompare } from "@/components/CompareProvider";
import { investigations } from "@/lib/data";
import { COPY } from "@/lib/copy";

export function CompareTray() {
  const router = useRouter();
  const { ids, clear } = useCompare();

  if (ids.length === 0) return null;

  const records = ids
    .map((id) => investigations.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const handleCompare = () => {
    router.push(`/compare?ids=${ids.join(",")}`);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-surface-raised border-t-2 border-accent shadow-lg z-50"
      role="region"
      aria-label="Compare tray"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-text font-semibold">
            {ids.length} selected
          </span>
          <div className="flex flex-wrap gap-2">
            {records.map((r) => (
              <span
                key={r.id}
                className="px-3 py-1 bg-surface border border-border-strong rounded text-sm text-text"
              >
                {r.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCompare}
            disabled={ids.length < 2}
            className="px-4 py-2 bg-accent text-on-accent rounded font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Compare
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 bg-surface border border-border-strong rounded text-sm text-text hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-focus"
          >
            Clear
          </button>
        </div>
      </div>

      {ids.length >= 4 && (
        <div
          className="bg-warning-surface border-t border-warning px-4 sm:px-8 py-2 text-xs text-warning-text"
          role="alert"
        >
          {COPY["compare.max"]}
        </div>
      )}
    </div>
  );
}
