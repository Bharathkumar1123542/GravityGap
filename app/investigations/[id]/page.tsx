// app/investigations/[id]/page.tsx — Investigation detail page
// spec §6.6 — FR-EXP-03, FR-DAT-07
import { notFound } from "next/navigation";
import Link from "next/link";
import { investigations, enabledEnvironments } from "@/lib/data";
import { RECORD_IDS } from "@/lib/schema";
import { fitIss, fitMoon } from "@/lib/scoring";
import StatusBadge from "@/components/StatusBadge";
import PillarChip from "@/components/PillarChip";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return RECORD_IDS.map((id) => ({ id }));
}

export const dynamicParams = false;

export default async function InvestigationDetailPage({ params }: Props) {
  const { id } = await params;
  const record = investigations.find((r) => r.id === id);

  if (!record) {
    notFound();
  }

  const iss = fitIss(record, enabledEnvironments);
  const moon = fitMoon(record, enabledEnvironments);

  return (
    <main id="main" className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-accent hover:underline inline-flex items-center gap-2 mb-4"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Explorer</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">{record.name}</h1>
            {record.full_name && (
              <p className="text-lg text-text-muted">{record.full_name}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {record.pillar.map((p) => (
              <PillarChip key={p} pillar={p} />
            ))}
            <span className="text-sm text-text-muted ml-2">
              Facility: {record.facility}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-surface-raised rounded-lg border border-border p-6 space-y-6">
        <DetailRow
          label="Objective"
          value={record.objective || "not available"}
          status={record.verification.objective}
        />

        <DetailRow
          label="Fuels"
          value={
            record.fuels.length > 0
              ? record.fuels.map((f) => `${f.name} (${f.form})`).join(", ")
              : "not available"
          }
          status={record.verification.fuels}
        />

        <DetailRow
          label="Diluents"
          value={
            record.diluents.length > 0
              ? record.diluents.join(", ")
              : "not available"
          }
          status={record.verification.diluents}
        />

        <DetailRow
          label="Oxygen % (min–max)"
          value={
            record.o2_min_pct !== null && record.o2_max_pct !== null
              ? `${record.o2_min_pct}–${record.o2_max_pct}`
              : "not available"
          }
          status={record.verification.o2_pct}
          mono
        />

        <DetailRow
          label="Pressure (psi)"
          value={
            record.pressure_min_psi !== null && record.pressure_max_psi !== null
              ? `${record.pressure_min_psi}–${record.pressure_max_psi}`
              : "not available"
          }
          status={record.verification.pressure_psi}
          mono
        />

        <DetailRow
          label="Airflow"
          value={
            record.airflow.min !== null &&
            record.airflow.max !== null &&
            record.airflow.unit !== null
              ? `${record.airflow.min}–${record.airflow.max} ${record.airflow.unit}`
              : "not available"
          }
          status={record.verification.airflow}
          mono
        />

        <DetailRow
          label="Gravity regime"
          value={record.gravity_regime.join(", ")}
          status={record.verification.gravity_regime}
        />

        <DetailRow
          label="Variables varied"
          value={
            record.variables_varied.length > 0
              ? record.variables_varied.join(", ")
              : "not available"
          }
          status={record.verification.variables_varied}
        />

        <DetailRow
          label="Sensors"
          value={
            record.sensors.length > 0
              ? record.sensors.join(", ")
              : "not available"
          }
          status={record.verification.sensors}
        />

        {record.hardware.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h2 className="text-sm font-semibold text-text mb-2">Hardware</h2>
            <ul className="list-disc list-inside text-sm text-text space-y-1">
              {record.hardware.map((hw, i) => (
                <li key={i}>{hw}</li>
              ))}
            </ul>
          </div>
        )}

        {record.sub_experiments.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h2 className="text-sm font-semibold text-text mb-2">
              Sub-experiments
            </h2>
            <ul className="list-disc list-inside text-sm text-text space-y-1">
              {record.sub_experiments.map((exp, i) => (
                <li key={i}>{exp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Fit */}
      <div className="mt-6 bg-surface-raised rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-text-muted">Fit ISS:</span>{" "}
            <span className="font-mono text-text">
              {iss !== null ? iss.toFixed(2) : "n/a"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Fit Moon base:</span>{" "}
            <span className="font-mono text-text">
              {moon !== null ? moon.toFixed(2) : "n/a"}
            </span>
            {moon !== null && (
              <span className="text-xs text-warning-text bg-warning-surface px-2 py-0.5 rounded border border-warning">
                extrapolation
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Curation date */}
      <div className="mt-4 text-sm text-text-muted">
        Last curated: {record.last_curated_at}
      </div>

      {/* Sources */}
      {record.sources.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-text mb-3">Sources</h2>
          <ol className="space-y-2">
            {record.sources.map((source, i) => (
              <li key={i} className="text-sm">
                <span className="text-text-muted">[{i + 1}]</span>{" "}
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {source.title}
                </a>{" "}
                <span className="text-text-muted">({source.kind})</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {record.psi_url && (
        <div className="mt-4">
          <a
            href={record.psi_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-sm"
          >
            View on NASA PSI →
          </a>
        </div>
      )}
    </main>
  );
}

function DetailRow({
  label,
  value,
  status,
  mono = false,
}: {
  label: string;
  value: string;
  status: "verified" | "unverified" | "not_available";
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <dt className="text-sm font-semibold text-text">{label}</dt>
      <dd className={`sm:col-span-2 text-sm text-text ${mono ? "font-mono" : ""}`}>
        <div className="flex items-start gap-3">
          <span className="flex-1">{value}</span>
          <StatusBadge status={status} />
        </div>
      </dd>
    </div>
  );
}
