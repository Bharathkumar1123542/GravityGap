// tests/data.test.ts — unit tests for the data layer. spec §4.1–§4.7.
import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  RECORD_IDS,
  VERIFIABLE_FIELDS,
  InvestigationsFileSchema,
  EnvironmentsFileSchema,
  EarthApplicationsFileSchema,
  type VerifiableField,
} from "@/lib/schema";

const ROOT = path.resolve(__dirname, "..");

function loadJson(relative: string): unknown {
  return JSON.parse(readFileSync(path.join(ROOT, relative), "utf8"));
}

const rawInvestigations = loadJson("data/investigations.json");
const rawEnvironments = loadJson("data/environments.json");
const rawEarth = loadJson("data/earth-applications.json");

describe("InvestigationsFileSchema", () => {
  it("parses data/investigations.json without errors", () => {
    expect(() => InvestigationsFileSchema.parse(rawInvestigations)).not.toThrow();
  });

  // FR-DAT-01: exactly 13 ids in RECORD_IDS order
  it("FR-DAT-01: contains exactly 13 records with ids matching RECORD_IDS in order", () => {
    const records = InvestigationsFileSchema.parse(rawInvestigations);
    expect(records).toHaveLength(RECORD_IDS.length);

    const ids = records.map((r) => r.id);
    // Every RECORD_ID must be present
    for (const expected of RECORD_IDS) {
      expect(ids).toContain(expected);
    }
    // No extra ids
    expect(ids.length).toBe(RECORD_IDS.length);
  });

  // FR-DAT-03: no record has a verified field with an empty sources array
  it("FR-DAT-03: no verified field exists when sources is empty", () => {
    const records = InvestigationsFileSchema.parse(rawInvestigations);
    for (const record of records) {
      if (record.sources.length === 0) {
        for (const field of VERIFIABLE_FIELDS) {
          const status = record.verification[field as VerifiableField];
          expect(
            status,
            `${record.id}.verification.${field} is "verified" but sources is empty`,
          ).not.toBe("verified");
        }
      }
    }
  });

  it("all 13 seed records have last_curated_at of 2026-11-14", () => {
    const records = InvestigationsFileSchema.parse(rawInvestigations);
    for (const record of records) {
      expect(record.last_curated_at, `${record.id}.last_curated_at`).toBe("2026-11-14");
    }
  });

  it("all seed records have gravity_regime of microgravity", () => {
    const records = InvestigationsFileSchema.parse(rawInvestigations);
    for (const record of records) {
      expect(record.gravity_regime, `${record.id}.gravity_regime`).toEqual(["microgravity"]);
    }
  });

  it("all seed records have empty sources array", () => {
    const records = InvestigationsFileSchema.parse(rawInvestigations);
    for (const record of records) {
      expect(record.sources, `${record.id}.sources`).toHaveLength(0);
    }
  });

  it("flex record has diluents CO2 and helium", () => {
    const records = InvestigationsFileSchema.parse(rawInvestigations);
    const flex = records.find((r) => r.id === "flex");
    expect(flex).toBeDefined();
    expect(flex!.diluents).toEqual(["CO2", "helium"]);
    expect(flex!.verification.diluents).toBe("unverified");
  });

  it("unassigned pillar records (flex-2, cfi, acme) have verification.pillar === not_available", () => {
    const records = InvestigationsFileSchema.parse(rawInvestigations);
    for (const id of ["flex-2", "cfi", "acme"] as const) {
      const rec = records.find((r) => r.id === id);
      expect(rec).toBeDefined();
      expect(rec!.pillar).toEqual(["unassigned"]);
      expect(rec!.verification.pillar).toBe("not_available");
    }
  });
});

describe("EnvironmentsFileSchema", () => {
  it("parses data/environments.json without errors", () => {
    expect(() => EnvironmentsFileSchema.parse(rawEnvironments)).not.toThrow();
  });

  // FR-DAT-06: iss and moon_base enabled; rover and mars disabled
  it("FR-DAT-06: iss and moon_base are enabled; rover and mars are disabled", () => {
    const envs = EnvironmentsFileSchema.parse(rawEnvironments);
    const byKey = new Map(envs.map((e) => [e.key, e]));

    const iss = byKey.get("iss");
    const moon = byKey.get("moon_base");
    const rover = byKey.get("rover");
    const mars = byKey.get("mars");

    expect(iss, "iss environment missing").toBeDefined();
    expect(moon, "moon_base environment missing").toBeDefined();
    expect(rover, "rover environment missing").toBeDefined();
    expect(mars, "mars environment missing").toBeDefined();

    expect(iss!.enabled, "iss should be enabled").toBe(true);
    expect(moon!.enabled, "moon_base should be enabled").toBe(true);
    expect(rover!.enabled, "rover should be disabled").toBe(false);
    expect(mars!.enabled, "mars should be disabled").toBe(false);
  });

  it("iss has correct o2_pct and pressure_psi values", () => {
    const envs = EnvironmentsFileSchema.parse(rawEnvironments);
    const iss = envs.find((e) => e.key === "iss");
    expect(iss!.o2_pct).toEqual({ min: 21, max: 21 });
    expect(iss!.pressure_psi).toEqual({ min: 14.7, max: 14.7 });
  });

  it("moon_base has correct o2_pct and pressure_psi values", () => {
    const envs = EnvironmentsFileSchema.parse(rawEnvironments);
    const moon = envs.find((e) => e.key === "moon_base");
    expect(moon!.o2_pct).toEqual({ min: 30, max: 100 });
    expect(moon!.pressure_psi).toEqual({ min: 0, max: 10.2 });
  });

  it("rover and mars have null o2_pct and pressure_psi", () => {
    const envs = EnvironmentsFileSchema.parse(rawEnvironments);
    const rover = envs.find((e) => e.key === "rover");
    const mars = envs.find((e) => e.key === "mars");
    expect(rover!.o2_pct).toBeNull();
    expect(rover!.pressure_psi).toBeNull();
    expect(mars!.o2_pct).toBeNull();
    expect(mars!.pressure_psi).toBeNull();
  });
});

describe("EarthApplicationsFileSchema", () => {
  it("parses data/earth-applications.json without errors", () => {
    expect(() => EarthApplicationsFileSchema.parse(rawEarth)).not.toThrow();
  });

  it("contains exactly 3 earth applications with correct ids", () => {
    const apps = EarthApplicationsFileSchema.parse(rawEarth);
    expect(apps).toHaveLength(3);
    const ids = apps.map((a) => a.id);
    expect(ids).toContain("fine-water-mist");
    expect(ids).toContain("smoke-detection");
    expect(ids).toContain("firefighter-gear");
  });

  it("all earth applications have empty links arrays in seed", () => {
    const apps = EarthApplicationsFileSchema.parse(rawEarth);
    for (const app of apps) {
      expect(app.links, `${app.id}.links`).toHaveLength(0);
    }
  });
});

// Validation rules — schema-level
describe("RecordSchema validation rules", () => {
  it("rule 1: rejects o2 pair with only min set", () => {
    const badRecord = JSON.parse(readFileSync(path.join(ROOT, "data/investigations.json"), "utf8"));
    badRecord[0].o2_min_pct = 21;
    badRecord[0].o2_max_pct = null;
    const result = InvestigationsFileSchema.safeParse(badRecord);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.startsWith("o2 pair:"))).toBe(true);
    }
  });

  it("rule 2: rejects pressure pair with only max set", () => {
    const badRecord = JSON.parse(readFileSync(path.join(ROOT, "data/investigations.json"), "utf8"));
    badRecord[0].pressure_min_psi = null;
    badRecord[0].pressure_max_psi = 14.7;
    const result = InvestigationsFileSchema.safeParse(badRecord);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.startsWith("pressure pair:"))).toBe(true);
    }
  });

  it("rule 7: rejects pillar with unassigned mixed with other values", () => {
    const badRecord = JSON.parse(readFileSync(path.join(ROOT, "data/investigations.json"), "utf8"));
    // find acme (pillar unassigned)
    const acme = badRecord.find((r: { id: string }) => r.id === "acme");
    acme.pillar = ["unassigned", "prevention"];
    const result = InvestigationsFileSchema.safeParse(badRecord);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.startsWith("pillar:"))).toBe(true);
    }
  });

  it("rule 9: rejects duplicate ids", () => {
    const badRecords = JSON.parse(
      readFileSync(path.join(ROOT, "data/investigations.json"), "utf8"),
    );
    // duplicate first record
    badRecords.push({ ...badRecords[0] });
    const result = InvestigationsFileSchema.safeParse(badRecords);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages.some((m) => m.startsWith("duplicate id:"))).toBe(true);
    }
  });
});
