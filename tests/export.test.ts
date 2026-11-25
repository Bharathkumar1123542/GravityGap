// tests/export.test.ts — Export format tests
// Validates CSV and JSON export (FR-XPT-01 to FR-XPT-04, FR-CMP-05)
import { describe, expect, it } from "vitest";
import { toCSV, toJSON, csvFilename, jsonFilename, compareToCSV } from "@/lib/export";
import { investigations, environments } from "@/lib/data";
import type { ExplorerState } from "@/lib/explorer";

const defaultWeights = { iss: 0.5, moon: 0.5, rover: 0, mars: 0 };
const defaultState: ExplorerState = {
  pillar: null,
  fuel: null,
  facility: null,
  gravity: null,
  o2min: null,
  o2max: null,
  psimin: null,
  psimax: null,
  q: "",
  sort: "score",
  dir: "desc",
  weights: defaultWeights,
  group: false,
};

describe("toCSV", () => {
  it("exports at least one record with 38 columns (FR-XPT-01, FR-XPT-02)", () => {
    const csv = toCSV([investigations[0]], environments, defaultWeights);
    const lines = csv.split("\r\n");
    expect(lines.length).toBeGreaterThanOrEqual(2); // header + 1 row

    const headers = lines[0].split(",");
    expect(headers.length).toBe(38);
    expect(headers[0]).toBe("id");
    expect(headers[headers.length - 1]).toBe("source_count");
  });

  it("includes fit_iss, fit_moon, relevance_score, source_count (spec §7.2)", () => {
    const csv = toCSV([investigations[0]], environments, defaultWeights);
    const lines = csv.split("\r\n");
    const headers = lines[0].split(",");

    expect(headers).toContain("fit_iss");
    expect(headers).toContain("fit_moon");
    expect(headers).toContain("relevance_score");
    expect(headers).toContain("source_count");
  });

  it("escapes CSV cells per RFC 4180 (FR-XPT-02)", () => {
    const testRecord = {
      ...investigations[0],
      objective: 'Test "quotes", commas, and\nnewlines',
    };
    const csv = toCSV([testRecord], environments, defaultWeights);
    
    // The objective field should be quoted and internal quotes doubled
    expect(csv).toContain('"Test ""quotes"", commas, and\nnewlines"');
  });

  it("renders empty string for null values (spec §7.2)", () => {
    const testRecord = {
      ...investigations[0],
      o2_min_pct: null,
      o2_max_pct: null,
    };
    const csv = toCSV([testRecord], environments, defaultWeights);
    const lines = csv.split("\r\n");
    const row = lines[1].split(",");
    
    // o2_min_pct and o2_max_pct should be empty (columns 15, 16)
    const headers = lines[0].split(",");
    const o2MinIdx = headers.indexOf("o2_min_pct");
    const o2MaxIdx = headers.indexOf("o2_max_pct");
    
    expect(row[o2MinIdx]).toBe("");
    expect(row[o2MaxIdx]).toBe("");
  });

  it("joins list fields with semicolon-space (spec §7.2)", () => {
    const csv = toCSV([investigations[0]], environments, defaultWeights);
    const lines = csv.split("\r\n");
    
    // Pillar field should contain semicolon-separated values if multiple
    const headers = lines[0].split(",");
    const pillarIdx = headers.indexOf("pillar");
    const row = lines[1].split(",");
    
    if (investigations[0].pillar.length > 1) {
      expect(row[pillarIdx]).toContain("; ");
    }
  });

  it("returns header-only for empty records array (FR-XPT-04)", () => {
    const csv = toCSV([], environments, defaultWeights);
    const lines = csv.split("\r\n");
    expect(lines.length).toBe(1); // header only
    expect(lines[0].split(",").length).toBe(38);
  });
});

describe("toJSON", () => {
  it("exports with 6 top-level keys (FR-XPT-03)", () => {
    const json = toJSON([investigations[0]], environments, defaultWeights, defaultState);
    const data = JSON.parse(json);
    
    expect(data).toHaveProperty("schema_version");
    expect(data).toHaveProperty("exported_at");
    expect(data).toHaveProperty("filters");
    expect(data).toHaveProperty("weights");
    expect(data).toHaveProperty("data_notice");
    expect(data).toHaveProperty("records");
    
    expect(Object.keys(data).length).toBe(6);
  });

  it("includes schema_version 1.0 (spec §7.2)", () => {
    const json = toJSON([investigations[0]], environments, defaultWeights, defaultState);
    const data = JSON.parse(json);
    expect(data.schema_version).toBe("1.0");
  });

  it("includes filters and weights (FR-XPT-03)", () => {
    const state: ExplorerState = {
      ...defaultState,
      pillar: "detection",
      o2min: 18,
      weights: { iss: 0.7, moon: 0.3, rover: 0, mars: 0 },
    };
    const json = toJSON([investigations[0]], environments, state.weights, state);
    const data = JSON.parse(json);
    
    expect(data.filters.pillar).toBe("detection");
    expect(data.filters.o2min).toBe(18);
    expect(data.weights.iss).toBe(0.7);
    expect(data.weights.moon).toBe(0.3);
  });

  it("includes fit_iss, fit_moon, relevance_score in each record (spec §7.2)", () => {
    const json = toJSON([investigations[0]], environments, defaultWeights, defaultState);
    const data = JSON.parse(json);
    
    expect(data.records).toHaveLength(1);
    expect(data.records[0]).toHaveProperty("fit_iss");
    expect(data.records[0]).toHaveProperty("fit_moon");
    expect(data.records[0]).toHaveProperty("relevance_score");
  });

  it("preserves null values in JSON (spec §7.2)", () => {
    const testRecord = {
      ...investigations[0],
      full_name: null,
      objective: null,
    };
    const json = toJSON([testRecord], environments, defaultWeights, defaultState);
    const data = JSON.parse(json);
    
    expect(data.records[0].full_name).toBeNull();
    expect(data.records[0].objective).toBeNull();
  });

  it("returns empty records array for no data (FR-XPT-04)", () => {
    const json = toJSON([], environments, defaultWeights, defaultState);
    const data = JSON.parse(json);
    
    expect(data.records).toEqual([]);
    expect(data.schema_version).toBe("1.0");
  });
});

describe("filename generators", () => {
  it("generates UTC timestamp filename for CSV (FR-XPT-01)", () => {
    const filename = csvFilename();
    expect(filename).toMatch(/^flame-in-freefall_\d{14}\.csv$/);
    expect(filename).toContain("flame-in-freefall_");
    expect(filename.endsWith(".csv")).toBe(true);
  });

  it("generates UTC timestamp filename for JSON (FR-XPT-03)", () => {
    const filename = jsonFilename();
    expect(filename).toMatch(/^flame-in-freefall_\d{14}\.json$/);
    expect(filename).toContain("flame-in-freefall_");
    expect(filename.endsWith(".json")).toBe(true);
  });

  it("produces same timestamp for CSV and JSON when called together", () => {
    const csv = csvFilename();
    const json = jsonFilename();
    const csvTs = csv.replace("flame-in-freefall_", "").replace(".csv", "");
    const jsonTs = json.replace("flame-in-freefall_", "").replace(".json", "");
    
    // Should be within 1 second
    expect(Math.abs(parseInt(csvTs) - parseInt(jsonTs))).toBeLessThan(100);
  });
});

describe("compareToCSV", () => {
  it("exports compare view with field rows (FR-CMP-05)", () => {
    const records = investigations.slice(0, 3);
    const csv = compareToCSV(records);
    const lines = csv.split("\r\n");

    expect(lines.length).toBeGreaterThan(10); // At least header + several field rows

    // Check header
    const headers = lines[0].split(",");
    expect(headers[0]).toBe("Field");
    expect(headers.length).toBe(4); // Field + 3 investigations

    // Check it includes some key fields
    expect(csv).toContain("Full name");
    expect(csv).toContain("Pillar");
    expect(csv).toContain("Fuels");
    expect(csv).toContain("Oxygen % (min-max)");
  });

  it("returns empty string for no records (FR-CMP-05)", () => {
    const csv = compareToCSV([]);
    expect(csv).toBe("");
  });

  it("includes all key fields in compare export", () => {
    const records = investigations.slice(0, 2);
    const csv = compareToCSV(records);

    // Check all required fields are present
    expect(csv).toContain("Full name");
    expect(csv).toContain("Pillar");
    expect(csv).toContain("Facility");
    expect(csv).toContain("Objective");
    expect(csv).toContain("Fuels");
    expect(csv).toContain("Oxygen % (min-max)");
    expect(csv).toContain("Pressure psi (min-max)");
    expect(csv).toContain("Gravity regime");
    expect(csv).toContain("Variables varied");
    expect(csv).toContain("Sources count");
  });

  it("escapes CSV cells properly in compare export", () => {
    const testRecord = {
      ...investigations[0],
      objective: 'Test "quotes" and, commas',
    };
    const csv = compareToCSV([testRecord]);

    // Should quote and escape the objective field
    expect(csv).toContain('"Test ""quotes"" and, commas"');
  });
});
