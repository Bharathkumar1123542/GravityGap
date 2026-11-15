#!/usr/bin/env tsx
// scripts/data-report.ts — curation report. spec §4.6; FR-DAT-07; O-1.
//
// Usage: npx tsx scripts/data-report.ts
// Exit 0 = clean; exit 1 = unsourced verified fields or payload over 100 KB.

import fs from "fs";
import path from "path";
import {
  RECORD_IDS,
  VERIFIABLE_FIELDS,
  InvestigationsFileSchema,
  EnvironmentsFileSchema,
  type InvestigationRecord,
  type VerifiableField,
} from "@/lib/schema";

const ROOT = path.resolve(__dirname, "..");

let exitCode = 0;

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
const rawInvestigations = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "investigations.json"), "utf8"),
);
const rawEnvironments = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "environments.json"), "utf8"),
);

const investigations = InvestigationsFileSchema.parse(rawInvestigations);
const environments = EnvironmentsFileSchema.parse(rawEnvironments);

// ---------------------------------------------------------------------------
// Per-record table
// ---------------------------------------------------------------------------
const FIELD_COUNT = VERIFIABLE_FIELDS.length; // 12
const TOTAL_FIELDS = RECORD_IDS.length * FIELD_COUNT; // 156

type StatusCounts = { verified: number; unverified: number; not_available: number };

function countStatuses(record: InvestigationRecord): StatusCounts {
  const counts: StatusCounts = { verified: 0, unverified: 0, not_available: 0 };
  for (const field of VERIFIABLE_FIELDS) {
    const status = record.verification[field as VerifiableField];
    counts[status]++;
  }
  return counts;
}

console.log("\n=== Curation Report ===\n");
console.log(
  `${"ID".padEnd(14)} ${"verified".padStart(8)} ${"unverified".padStart(10)} ${"not_avail".padStart(10)}`,
);
console.log("-".repeat(46));

const totals: StatusCounts = { verified: 0, unverified: 0, not_available: 0 };
const recordMap = new Map(investigations.map((r) => [r.id, r]));

for (const id of RECORD_IDS) {
  const record = recordMap.get(id);
  if (!record) {
    console.log(`${id.padEnd(14)} (missing)`);
    continue;
  }
  const counts = countStatuses(record);
  totals.verified += counts.verified;
  totals.unverified += counts.unverified;
  totals.not_available += counts.not_available;
  console.log(
    `${id.padEnd(14)} ${String(counts.verified).padStart(8)} ${String(counts.unverified).padStart(10)} ${String(counts.not_available).padStart(10)}`,
  );
}

console.log("-".repeat(46));
console.log(
  `${"TOTAL".padEnd(14)} ${String(totals.verified).padStart(8)} ${String(totals.unverified).padStart(10)} ${String(totals.not_available).padStart(10)}`,
);
console.log(
  `${"(%)".padEnd(14)} ${((totals.verified / TOTAL_FIELDS) * 100).toFixed(1).padStart(7)}% ${((totals.unverified / TOTAL_FIELDS) * 100).toFixed(1).padStart(9)}% ${((totals.not_available / TOTAL_FIELDS) * 100).toFixed(1).padStart(9)}%`,
);

// ---------------------------------------------------------------------------
// Verified target
// ---------------------------------------------------------------------------
const VERIFIED_TARGET = 110; // 70% of 156
const pct = ((totals.verified / TOTAL_FIELDS) * 100).toFixed(1);
if (totals.verified >= VERIFIED_TARGET) {
  console.log(`\nVerified target: PASS (${pct}% ≥ 70%)`);
} else {
  console.log(`\nVerified target: WARN verified below 70% (${pct}%)`);
}

// ---------------------------------------------------------------------------
// Unsourced verified fields (rule 6 — also caught by Zod, but reported here)
// ---------------------------------------------------------------------------
const unsourced: string[] = [];
for (const record of investigations) {
  if (record.sources.length === 0) {
    for (const field of VERIFIABLE_FIELDS) {
      if (record.verification[field as VerifiableField] === "verified") {
        unsourced.push(`  ${record.id}.${field}`);
      }
    }
  }
}

if (unsourced.length > 0) {
  console.log("\nUnsourced verified fields (exit 1):");
  for (const line of unsourced) {
    console.log(line);
  }
  exitCode = 1;
} else {
  console.log("\nUnsourced verified fields: none");
}

// ---------------------------------------------------------------------------
// Partial-gravity records
// ---------------------------------------------------------------------------
const partialGravityRecords = investigations.filter((r) =>
  r.gravity_regime.includes("partial_gravity"),
);
if (partialGravityRecords.length > 0) {
  console.log("\nPartial-gravity records (manual review required):");
  for (const r of partialGravityRecords) {
    console.log(`  ${r.id}`);
  }
} else {
  console.log("\nPartial-gravity records: none");
}

// ---------------------------------------------------------------------------
// Payload size check — JSON.stringify of augmented records + environments
// < 100 KB (NFR-SCL-02)
// ---------------------------------------------------------------------------
const payloadJson = JSON.stringify({ investigations, environments });
const payloadKb = Buffer.byteLength(payloadJson, "utf8") / 1024;
const payloadKbStr = payloadKb.toFixed(1);

if (payloadKb >= 100) {
  console.log(`\nPayload size: ${payloadKbStr} KB — FAIL (exceeds 100 KB limit)`);
  exitCode = 1;
} else {
  console.log(`\nPayload size: ${payloadKbStr} KB — OK (< 100 KB)`);
}

process.exit(exitCode);
