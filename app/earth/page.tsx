"use client";
// app/earth/page.tsx — Earth applications
// spec §6.8 — FR-EAR-01, FR-EAR-02
import { useState } from "react";
import Link from "next/link";
import { earthApplications } from "@/lib/data";
import { COPY } from "@/lib/copy";

export default function EarthPage() {
  const [selected, setSelected] = useState(earthApplications[0]?.id || "");
  const current = earthApplications.find((app) => app.id === selected);

  if (earthApplications.length === 0) {
    return (
      <main id="main" className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <h1 className="text-3xl font-bold text-text mb-6">Earth Applications</h1>
        <p className="text-text-muted">No applications configured.</p>
      </main>
    );
  }

  const verifiedLinks = current?.links.filter((link) => link.verified) || [];

  return (
    <main id="main" className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <h1 className="text-3xl font-bold text-text mb-6">Earth Applications</h1>
      <p className="text-text leading-relaxed mb-8">
        Microgravity combustion research advances fire safety on Earth. These
        investigations contribute to improved extinguishers, smoke detection, and
        firefighter protective equipment.
      </p>

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-2 mb-8 border-b border-border"
        role="tablist"
      >
        {earthApplications.map((app) => (
          <button
            key={app.id}
            onClick={() => setSelected(app.id)}
            role="tab"
            aria-selected={selected === app.id}
            aria-controls={`panel-${app.id}`}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-focus ${
              selected === app.id
                ? "border-accent text-accent font-semibold"
                : "border-transparent text-text-muted hover:text-text hover:border-border"
            }`}
          >
            {app.title}
          </button>
        ))}
      </div>

      {/* Panel */}
      {current && (
        <div
          id={`panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${current.id}`}
        >
          {verifiedLinks.length === 0 ? (
            <p className="text-text-muted">{COPY["earth.no_link"]}</p>
          ) : (
            <div className="space-y-6">
              {verifiedLinks.map((link, i) => {
                const record = link.record_id; // This is the ID
                return (
                  <div
                    key={i}
                    className="bg-surface-raised rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <Link
                        href={`/investigations/${record}`}
                        className="text-accent hover:underline font-medium text-lg"
                      >
                        Investigation: {record}
                      </Link>
                    </div>
                    <p className="text-text leading-relaxed mb-3">
                      {link.rationale}
                    </p>
                    <a
                      href={link.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline text-sm inline-flex items-center gap-1"
                    >
                      <span>Source</span>
                      <span aria-hidden="true">→</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
