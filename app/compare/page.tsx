"use client";
// app/compare/page.tsx — Compare view
<<<<<<< HEAD
// spec §6.5 — FR-CMP-01 to FR-CMP-04
=======
// spec §6.5 — FR-CMP-01 to FR-CMP-05
>>>>>>> origin/main
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { parseCompareIds } from "@/lib/compare";
<<<<<<< HEAD
=======
import { compareToCSV, compareCSVFilename } from "@/lib/export";
>>>>>>> origin/main
import StatusBadge from "@/components/StatusBadge";
import PillarChip from "@/components/PillarChip";
import { COPY } from "@/lib/copy";

function CompareContent() {
  const searchParams = useSearchParams();
  const { valid, unknown } = parseCompareIds(searchParams);

  // Messages
  const messages: string[] = [];
  if (unknown.length > 0) {
    messages.push(...unknown.map((id) => `${COPY["compare.unknown_id"]} ${id}`));
  }
  if (valid.length < 2) {
    messages.push(COPY["compare.min"]);
  }

  if (messages.length > 0) {
    return (
      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <h1 className="text-2xl font-bold text-text mb-6">Compare</h1>
        <div className="space-y-2" role="alert" aria-live="polite">
          {messages.map((msg, i) => (
            <p key={i} className="text-danger">
              {msg}
            </p>
          ))}
        </div>
        <Link href="/" className="text-accent hover:underline mt-4 inline-block">
          ← Back to Explorer
        </Link>
      </main>
    );
  }

  // Take first 4 if more provided
  const records = valid.slice(0, 4);
  if (valid.length > 4) {
    // Show max message but continue with first 4
  }

<<<<<<< HEAD
=======
  const handleExportCSV = () => {
    const csv = compareToCSV(records);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = compareCSVFilename();

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

>>>>>>> origin/main
  return (
    <main id="main" className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">
          Compare ({records.length})
        </h1>
        <div className="flex gap-3">
<<<<<<< HEAD
=======
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-accent text-on-accent rounded text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-focus"
          >
            Export CSV
          </button>
>>>>>>> origin/main
          <Link
            href="/"
            className="px-4 py-2 bg-surface-raised border border-border-strong rounded text-sm text-text hover:bg-surface"
          >
            Clear
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-raised border-b-2 border-border">
              <th className="text-left p-3 text-text font-semibold sticky left-0 bg-surface-raised">
                Field
              </th>
              {records.map((r) => (
                <th key={r.id} className="text-left p-3 text-text font-semibold">
                  <Link
                    href={`/investigations/${r.id}`}
                    className="text-accent hover:underline"
                  >
                    {r.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <CompareRow
              label="Full name"
              values={records.map((r) => r.full_name || "not available")}
              statuses={null}
            />
            <CompareRow
              label="Pillar"
              values={records.map((r) => (
                <div key={r.id} className="flex flex-wrap gap-1">
                  {r.pillar.map((p) => (
                    <PillarChip key={p} pillar={p} />
                  ))}
                </div>
              ))}
              statuses={records.map((r) => r.verification.pillar)}
            />
            <CompareRow
              label="Facility"
              values={records.map((r) => r.facility)}
              statuses={records.map((r) => r.verification.facility)}
            />
            <CompareRow
              label="Objective"
              values={records.map((r) => r.objective || "not available")}
              statuses={records.map((r) => r.verification.objective)}
            />
            <CompareRow
              label="Fuels"
              values={records.map((r) =>
                r.fuels.length > 0
                  ? r.fuels.map((f) => `${f.name} (${f.form})`).join(", ")
                  : "not available",
              )}
              statuses={records.map((r) => r.verification.fuels)}
            />
            <CompareRow
              label="Oxygen % (min–max)"
              values={records.map((r) =>
                r.o2_min_pct !== null && r.o2_max_pct !== null
                  ? `${r.o2_min_pct}–${r.o2_max_pct}`
                  : "not available",
              )}
              statuses={records.map((r) => r.verification.o2_pct)}
              mono
            />
            <CompareRow
              label="Pressure (psi)"
              values={records.map((r) =>
                r.pressure_min_psi !== null && r.pressure_max_psi !== null
                  ? `${r.pressure_min_psi}–${r.pressure_max_psi}`
                  : "not available",
              )}
              statuses={records.map((r) => r.verification.pressure_psi)}
              mono
            />
            <CompareRow
              label="Variables varied within the investigation"
              values={records.map((r) =>
                r.variables_varied.length > 0
                  ? r.variables_varied.join(", ")
                  : "not available",
              )}
              statuses={records.map((r) => r.verification.variables_varied)}
            />
            <CompareRow
              label="Last curated"
              values={records.map((r) => r.last_curated_at)}
              statuses={null}
              mono
            />
          </tbody>
        </table>
      </div>
    </main>
  );
}

function CompareRow({
  label,
  values,
  statuses,
  mono = false,
}: {
  label: string;
  values: (string | React.ReactNode)[];
  statuses: ("verified" | "unverified" | "not_available")[] | null;
  mono?: boolean;
}) {
  // Check if values differ (normalize for comparison)
  const normalized = values.map((v) =>
    typeof v === "string" ? v : JSON.stringify(v),
  );
  const differs = new Set(normalized).size > 1;

  return (
    <tr
      className={`border-b border-border ${differs ? "border-l-4 border-l-differs" : ""}`}
    >
      <td className="p-3 text-text font-medium sticky left-0 bg-surface-raised">
        {label}
        {differs && (
          <span className="ml-2 text-xs text-differs" aria-label="Values differ">
            differs ⇄
          </span>
        )}
      </td>
      {values.map((value, i) => (
        <td key={i} className={`p-3 text-text ${mono ? "font-mono" : ""}`}>
          {typeof value === "string" ? value : value}
          {statuses && statuses[i] && (
            <div className="mt-1">
              <StatusBadge status={statuses[i]} />
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <p className="text-text-muted">Loading comparison...</p>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
