// app/about/page.tsx — About page with 8 sections
// spec §6.7 — FR-UI-04, FR-RNK-08
import { investigations, environments } from "@/lib/data";
import { SCORING } from "@/config/scoring";

export default function AboutPage() {
  return (
    <main id="main" className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold text-text mb-8">About</h1>

      <div className="space-y-12">
        {/* Purpose */}
        <section id="purpose">
          <h2 className="text-2xl font-semibold text-text mb-4">Purpose</h2>
          <p className="text-text leading-relaxed">
            Flame in Freefall ranks 13 hand-curated NASA Physical Sciences
            Informatics (PSI) low-gravity combustion investigations by relevance
            to crew environments. It helps combustion researchers, fire-safety
            engineers and students find which experiments matter for their work,
            see how test conditions compare, export structured data for models,
            and ask grounded questions through AI.
          </p>
        </section>

        {/* Pillars */}
        <section id="pillars">
          <h2 className="text-2xl font-semibold text-text mb-4">
            The Three Pillars
          </h2>
          <div className="space-y-4 text-text">
            <div>
              <h3 className="font-semibold text-accent mb-1">Prevention</h3>
              <p className="leading-relaxed">
                Understanding material flammability and ignition conditions to
                prevent fires from starting.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-accent mb-1">Detection</h3>
              <p className="leading-relaxed">
                Smoke, heat and combustion-product sensing to catch fires early.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-accent mb-1">Suppression</h3>
              <p className="leading-relaxed">
                Extinguishing methods and fire behavior under suppression.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-text-muted mb-1">Unassigned</h3>
              <p className="leading-relaxed text-text-muted">
                Investigations whose pillar is not yet determined from sources.
              </p>
            </div>
          </div>
        </section>

        {/* Provenance */}
        <section id="provenance">
          <h2 className="text-2xl font-semibold text-text mb-4">
            Data Provenance
          </h2>
          <p className="text-text leading-relaxed mb-4">
            Every record is curated by hand from NASA PSI pages, NTRS papers and
            NASA Science pages. Each field carries a verification status:
          </p>
          <ul className="space-y-2 text-text">
            <li className="flex items-start gap-2">
              <span className="text-status-verified font-bold">✓</span>
              <div>
                <span className="font-semibold">Verified:</span> Read from a
                cited source and checked by a second person.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-status-unverified font-bold">?</span>
              <div>
                <span className="font-semibold">Unverified:</span> Entered but
                not yet checked against a source.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-status-na font-bold">–</span>
              <div>
                <span className="font-semibold">Not available:</span> No source
                provides this value. Never estimated or inferred.
              </div>
            </li>
          </ul>
        </section>

        {/* Scoring */}
        <section id="scoring">
          <h2 className="text-2xl font-semibold text-text mb-4">
            How Scoring Works
          </h2>
          <p className="text-text leading-relaxed mb-4">
            Each investigation receives a relevance score (0 to 100) based on how
            close its tested conditions are to the environments you weight.
          </p>

          <div className="bg-surface-raised rounded-lg border border-border p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-text mb-2">Formula</h3>
              <div className="font-mono text-sm text-text space-y-1">
                <div>fit_o2 = 1 - (gap / {SCORING.o2_tolerance_pct}) ↦ [0, 1]</div>
                <div>fit_psi = 1 - (gap / {SCORING.psi_tolerance}) ↦ [0, 1]</div>
                <div>env_fit = mean of non-null components</div>
                <div>score = 100 × Σ(weight × env_fit) / Σ(weight)</div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-text mb-2">Tolerances</h3>
              <ul className="text-sm text-text space-y-1">
                <li>Oxygen: {SCORING.o2_tolerance_pct} percentage points</li>
                <li>Pressure: {SCORING.psi_tolerance} psi</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-text mb-2">
                Environment Reference Values
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-text">Environment</th>
                      <th className="text-left py-2 text-text">O2 %</th>
                      <th className="text-left py-2 text-text">Pressure (psi)</th>
                      <th className="text-left py-2 text-text">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {environments.map((env) => (
                      <tr key={env.key} className="border-b border-border">
                        <td className="py-2 text-text">{env.label}</td>
                        <td className="py-2 text-text font-mono">
                          {env.o2_pct
                            ? `${env.o2_pct.min}–${env.o2_pct.max}`
                            : "—"}
                        </td>
                        <td className="py-2 text-text font-mono">
                          {env.pressure_psi
                            ? `${env.pressure_psi.min}–${env.pressure_psi.max}`
                            : "—"}
                        </td>
                        <td className="py-2 text-text-muted text-xs">
                          {env.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-text-muted mt-2">
                ISS values are the Earth-normal baseline (A-05).
              </p>
            </div>
          </div>

          <p className="text-sm text-text-muted mt-4">
            Rover and Mars environments are locked because their reference values
            are not yet sourced (OQ-02).
          </p>
        </section>

        {/* Gap */}
        <section id="gap">
          <h2 className="text-2xl font-semibold text-text mb-4">
            The Partial-Gravity Gap
          </h2>
          <div className="bg-warning-surface border border-warning rounded-lg p-4">
            <p className="text-warning-text leading-relaxed">
              No partial-gravity combustion data exists in PSI. The records here
              cover microgravity and normal gravity only. Every statement about
              the Moon or Mars is an extrapolation from those two regimes and is
              labeled as such.
            </p>
          </div>
        </section>

        {/* AI */}
        <section id="ai">
          <h2 className="text-2xl font-semibold text-text mb-4">
            AI Grounding Rules
          </h2>
          <ul className="space-y-2 text-text">
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Answers use only the 13 curated records. No web search, no
                speculation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Every claim is checked against stored values. Paragraphs with
                wrong values are removed.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Verification labels come from stored data, never from the model.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Questions about partial gravity return &ldquo;no data&rdquo;. Moon and Mars
                statements are labeled extrapolations.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Questions are sent to Google&apos;s Gemini API and are not stored.
              </span>
            </li>
          </ul>
        </section>

        {/* Records */}
        <section id="records">
          <h2 className="text-2xl font-semibold text-text mb-4">
            Curated Records
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-text">Name</th>
                  <th className="text-left py-2 text-text">Last curated</th>
                </tr>
              </thead>
              <tbody>
                {investigations.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-2 text-text">{r.name}</td>
                    <td className="py-2 text-text-muted font-mono">
                      {r.last_curated_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Next steps */}
        <section id="next">
          <h2 className="text-2xl font-semibold text-text mb-4">
            Next Steps
          </h2>
          <p className="text-text leading-relaxed mb-4">
            Future potential (not in this release):
          </p>
          <ul className="space-y-2 text-text">
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Retrieval step replacing full-set prompting when the dataset
                grows beyond 60 records
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Per-experiment ACME records once curator capacity allows
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Rover and Mars profiles when reference values are supplied
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Live PSI sync if PSI exposes a stable API
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true">•</span>
              <span>
                Partial-gravity data when any source publishes it (the gap would
                be closed and labels removed)
              </span>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
