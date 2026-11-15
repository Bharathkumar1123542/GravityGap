#!/usr/bin/env tsx
// scripts/validate-data.ts — Zod-validate all three data files and assert
// structural invariants. spec §4.2; FR-DAT-02.
//
// Usage: npx tsx scripts/validate-data.ts
// Exit 0 = clean; exit 1 = at least one violation.

import fs from "fs";
import path from "path";
import {
  RECORD_IDS,
  InvestigationsFileSchema,
  EnvironmentsFileSchema,
  EarthApplicationsFileSchema,
} from "@/lib/schema";

const ROOT = path.resolve(__dirname, "..");

let exitCode = 0;

function fail(file: string, recordId: string, message: string): void {
  console.error(`${file} ${recordId} ${message}`);
  exitCode = 1;
}

// ---------------------------------------------------------------------------
// 1. investigations.json
// ---------------------------------------------------------------------------
const investigationsPath = path.join(ROOT, "data", "investigations.json");
let rawInvestigations: unknown;
try {
  rawInvestigations = JSON.parse(fs.readFileSync(investigationsPath, "utf8"));
} catch (e) {
  fail("data/investigations.json", "(file)", `Failed to read or parse: ${String(e)}`);
  process.exit(1);
}

const investigationsResult = InvestigationsFileSchema.safeParse(rawInvestigations);
if (!investigationsResult.success) {
  for (const issue of investigationsResult.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    fail("data/investigations.json", path, issue.message);
  }
} else {
  const records = investigationsResult.data;

  // Assert exactly 13 ids matching RECORD_IDS (in any order first, then check order)
  const ids = records.map((r) => r.id);
  const expectedIds = [...RECORD_IDS];

  if (ids.length !== expectedIds.length) {
    fail(
      "data/investigations.json",
      "(ids)",
      `Expected exactly ${expectedIds.length} records, got ${ids.length}`,
    );
  } else {
    // Check each expected id is present
    for (const expected of expectedIds) {
      if (!ids.includes(expected)) {
        fail("data/investigations.json", "(ids)", `Missing required id: "${expected}"`);
      }
    }
    // Check no extra ids
    for (const id of ids) {
      if (!expectedIds.includes(id as (typeof RECORD_IDS)[number])) {
        fail("data/investigations.json", "(ids)", `Unexpected id: "${id}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2. environments.json
// ---------------------------------------------------------------------------
const environmentsPath = path.join(ROOT, "data", "environments.json");
let rawEnvironments: unknown;
try {
  rawEnvironments = JSON.parse(fs.readFileSync(environmentsPath, "utf8"));
} catch (e) {
  fail("data/environments.json", "(file)", `Failed to read or parse: ${String(e)}`);
  process.exit(1);
}

const environmentsResult = EnvironmentsFileSchema.safeParse(rawEnvironments);
if (!environmentsResult.success) {
  for (const issue of environmentsResult.error.issues) {
    const p = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    fail("data/environments.json", p, issue.message);
  }
} else {
  const envs = environmentsResult.data;
  const byKey = new Map(envs.map((e) => [e.key, e]));

  // Assert iss and moon_base are present and enabled
  for (const key of ["iss", "moon_base"] as const) {
    const env = byKey.get(key);
    if (!env) {
      fail("data/environments.json", key, `Required environment "${key}" is missing`);
    } else if (!env.enabled) {
      fail("data/environments.json", key, `Environment "${key}" must be enabled`);
    }
  }

  // Assert rover and mars are present and disabled
  for (const key of ["rover", "mars"] as const) {
    const env = byKey.get(key);
    if (!env) {
      fail("data/environments.json", key, `Required environment "${key}" is missing`);
    } else if (env.enabled) {
      fail("data/environments.json", key, `Environment "${key}" must be disabled`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. earth-applications.json
// ---------------------------------------------------------------------------
const earthPath = path.join(ROOT, "data", "earth-applications.json");
let rawEarth: unknown;
try {
  rawEarth = JSON.parse(fs.readFileSync(earthPath, "utf8"));
} catch (e) {
  fail("data/earth-applications.json", "(file)", `Failed to read or parse: ${String(e)}`);
  process.exit(1);
}

const earthResult = EarthApplicationsFileSchema.safeParse(rawEarth);
if (!earthResult.success) {
  for (const issue of earthResult.error.issues) {
    const p = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    fail("data/earth-applications.json", p, issue.message);
  }
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------
if (exitCode === 0) {
  console.log("data:validate PASS — all files valid");
}

process.exit(exitCode);
