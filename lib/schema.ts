// lib/schema.ts — single source of truth for Zod schemas and inferred types.
// spec §4.1, §4.2, §4.4, §4.5
import { z } from "zod";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const RECORD_IDS = [
  "bass",
  "bass-ii",
  "saffire-i",
  "saffire-ii",
  "saffire-iii",
  "same",
  "same-r",
  "daft",
  "daft-2",
  "flex",
  "flex-2",
  "cfi",
  "acme",
] as const;

export type RecordId = (typeof RECORD_IDS)[number];

export const VERIFIABLE_FIELDS = [
  "pillar",
  "facility",
  "hardware",
  "objective",
  "fuels",
  "diluents",
  "o2_pct",
  "pressure_psi",
  "airflow",
  "gravity_regime",
  "variables_varied",
  "sensors",
] as const;

export type VerifiableField = (typeof VERIFIABLE_FIELDS)[number];

// ---------------------------------------------------------------------------
// Primitive schemas
// ---------------------------------------------------------------------------

export const VerificationSchema = z.enum(["verified", "unverified", "not_available"]);
export type Verification = z.infer<typeof VerificationSchema>;

const nonNeg = z.number().finite().min(0);
const text = z.string().trim().min(1);

export const FuelSchema = z
  .object({
    name: text,
    form: z.enum(["solid", "liquid_droplet", "gas", "dust", "other"]),
  })
  .strict();

export type Fuel = z.infer<typeof FuelSchema>;

export const SourceSchema = z
  .object({
    title: text,
    url: z.string().url(),
    kind: z.enum(["psi", "ntrs", "nasa_page", "paper", "other"]),
  })
  .strict();

export type Source = z.infer<typeof SourceSchema>;

// ---------------------------------------------------------------------------
// Validation rules — spec §4.2
// ---------------------------------------------------------------------------

function recordRules(
  r: {
    o2_min_pct: number | null;
    o2_max_pct: number | null;
    pressure_min_psi: number | null;
    pressure_max_psi: number | null;
    airflow: { min: number | null; max: number | null; unit: string | null };
    pillar: string[];
    facility: string;
    hardware: string[];
    objective: string | null;
    fuels: unknown[];
    diluents: string[];
    gravity_regime: string[];
    variables_varied: string[];
    sensors: string[];
    sources: unknown[];
    verification: Record<string, string>;
  },
  ctx: z.RefinementCtx,
): void {
  // Rule 1: o2 pair — both null or both non-null; when both non-null, min <= max
  const o2BothNull = r.o2_min_pct === null && r.o2_max_pct === null;
  const o2BothNonNull = r.o2_min_pct !== null && r.o2_max_pct !== null;
  if (!o2BothNull && !o2BothNonNull) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "o2 pair: both must be null or both non-null",
    });
  } else if (o2BothNonNull && (r.o2_min_pct as number) > (r.o2_max_pct as number)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "o2 pair: min must be <= max",
    });
  }

  // Rule 2: pressure pair — same rule
  const pBothNull = r.pressure_min_psi === null && r.pressure_max_psi === null;
  const pBothNonNull = r.pressure_min_psi !== null && r.pressure_max_psi !== null;
  if (!pBothNull && !pBothNonNull) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "pressure pair: both must be null or both non-null",
    });
  } else if (pBothNonNull && (r.pressure_min_psi as number) > (r.pressure_max_psi as number)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "pressure pair: min must be <= max",
    });
  }

  // Rule 3: airflow min/max follow rule 1; unit non-null exactly when bounds non-null
  const afBothNull = r.airflow.min === null && r.airflow.max === null;
  const afBothNonNull = r.airflow.min !== null && r.airflow.max !== null;
  if (!afBothNull && !afBothNonNull) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "airflow: min and max must both be null or both non-null",
    });
  } else if (afBothNonNull && (r.airflow.min as number) > (r.airflow.max as number)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "airflow: min must be <= max",
    });
  }
  const boundsNonNull = afBothNonNull;
  if (boundsNonNull && r.airflow.unit === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "airflow: unit must be non-null when bounds are non-null",
    });
  }
  if (!boundsNonNull && r.airflow.unit !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "airflow: unit must be null when bounds are null",
    });
  }

  // Rules 4 & 5 & 6: status consistency checks for all verifiable fields
  type FieldSpec = {
    field: VerifiableField;
    getValue: () => unknown;
  };

  const fieldSpecs: FieldSpec[] = [
    { field: "pillar", getValue: () => r.pillar },
    { field: "facility", getValue: () => r.facility },
    { field: "hardware", getValue: () => r.hardware },
    { field: "objective", getValue: () => r.objective },
    { field: "fuels", getValue: () => r.fuels },
    { field: "diluents", getValue: () => r.diluents },
    // o2_pct and pressure_psi are virtual — their status covers the pair
    { field: "o2_pct", getValue: () => r.o2_min_pct },
    { field: "pressure_psi", getValue: () => r.pressure_min_psi },
    { field: "airflow", getValue: () => r.airflow.min },
    { field: "gravity_regime", getValue: () => r.gravity_regime },
    { field: "variables_varied", getValue: () => r.variables_varied },
    { field: "sensors", getValue: () => r.sensors },
  ];

  for (const { field, getValue } of fieldSpecs) {
    const status = r.verification[field];
    const value = getValue();

    // Rule 4: not_available requires null, [], "not_stated" (facility), or ["unassigned"] (pillar)
    if (status === "not_available") {
      let valid = false;
      if (value === null) {
        valid = true;
      } else if (Array.isArray(value) && value.length === 0) {
        valid = true;
      } else if (field === "facility" && value === "not_stated") {
        valid = true;
      } else if (field === "pillar" && Array.isArray(value) && value.length === 1 && value[0] === "unassigned") {
        valid = true;
      }
      if (!valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `status ${field}: not_available requires null, empty array, not_stated (facility) or ["unassigned"] (pillar)`,
        });
      }
    }

    // Rule 5: verified/unverified requires non-null, non-empty value
    if (status === "verified" || status === "unverified") {
      let hasValue = false;
      if (value === null) {
        hasValue = false;
      } else if (Array.isArray(value) && value.length === 0) {
        hasValue = false;
      } else {
        hasValue = true;
      }
      if (!hasValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `status ${field}: ${status} requires a non-null, non-empty value`,
        });
      }
    }

    // Rule 6: verified requires sources.length >= 1
    if (status === "verified" && r.sources.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `verified without source: field "${field}" is verified but sources is empty`,
      });
    }
  }

  // Rule 7: pillar containing "unassigned" must equal ["unassigned"] exactly
  if (r.pillar.includes("unassigned")) {
    if (!(r.pillar.length === 1 && r.pillar[0] === "unassigned")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'pillar: "unassigned" must be the only entry — pillar must equal ["unassigned"]',
      });
    }
  }

  // Rule 8: gravity_regime containing "partial_gravity" requires verification === "verified"
  if (r.gravity_regime.includes("partial_gravity") && r.verification.gravity_regime !== "verified") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'partial gravity: gravity_regime containing "partial_gravity" requires verification.gravity_regime === "verified"',
    });
  }
}

// ---------------------------------------------------------------------------
// Record schema
// ---------------------------------------------------------------------------

export const RecordSchema = z
  .object({
    id: z.enum(RECORD_IDS),
    name: text,
    full_name: text.nullable(),
    pillar: z.array(z.enum(["prevention", "detection", "suppression", "unassigned"])).min(1),
    facility: z.enum(["CIR", "MSG", "other", "not_stated"]),
    hardware: z.array(text),
    objective: z.string().trim().min(1).max(400).nullable(),
    fuels: z.array(FuelSchema),
    diluents: z.array(text),
    o2_min_pct: z.number().min(0).max(100).nullable(),
    o2_max_pct: z.number().min(0).max(100).nullable(),
    pressure_min_psi: nonNeg.nullable(),
    pressure_max_psi: nonNeg.nullable(),
    airflow: z.object({ min: nonNeg.nullable(), max: nonNeg.nullable(), unit: text.nullable() }).strict(),
    gravity_regime: z.array(z.enum(["microgravity", "normal_gravity", "partial_gravity"])),
    variables_varied: z.array(text),
    sensors: z.array(text),
    sub_experiments: z.array(text),
    psi_url: z.string().url().nullable(),
    sources: z.array(SourceSchema),
    verification: z
      .object(
        Object.fromEntries(VERIFIABLE_FIELDS.map((f) => [f, VerificationSchema])) as Record<
          VerifiableField,
          typeof VerificationSchema
        >,
      )
      .strict(),
    last_curated_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict()
  .superRefine(recordRules);

export type InvestigationRecord = z.infer<typeof RecordSchema>;

// uniqueIds: rule 9
function uniqueIds(arr: { id: string }[], ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  for (const record of arr) {
    if (seen.has(record.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `duplicate id: "${record.id}"`,
      });
    }
    seen.add(record.id);
  }
}

export const InvestigationsFileSchema = z.array(RecordSchema).superRefine(uniqueIds);
export type InvestigationsFile = z.infer<typeof InvestigationsFileSchema>;

// ---------------------------------------------------------------------------
// Environment schema — spec §4.4
// ---------------------------------------------------------------------------

const RangeSchema = z.object({ min: z.number(), max: z.number() }).strict();

export const EnvironmentSchema = z
  .object({
    key: z.enum(["iss", "moon_base", "rover", "mars"]),
    label: text,
    enabled: z.boolean(),
    o2_pct: RangeSchema.nullable(),
    pressure_psi: RangeSchema.nullable(),
    source: text,
  })
  .strict()
  .superRefine((env, ctx) => {
    // o2_pct min <= max
    if (env.o2_pct !== null && env.o2_pct.min > env.o2_pct.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "o2_pct: min must be <= max" });
    }
    // pressure_psi min <= max
    if (env.pressure_psi !== null && env.pressure_psi.min > env.pressure_psi.max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "pressure_psi: min must be <= max" });
    }
    // enabled: true requires at least one of o2_pct and pressure_psi non-null
    if (env.enabled && env.o2_pct === null && env.pressure_psi === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "enabled environment must have at least one of o2_pct or pressure_psi non-null",
      });
    }
  });

export type EnvironmentProfile = z.infer<typeof EnvironmentSchema>;

export const EnvironmentsFileSchema = z.array(EnvironmentSchema).superRefine((envs, ctx) => {
  // unique keys
  const seen = new Set<string>();
  for (const env of envs) {
    if (seen.has(env.key)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate environment key: "${env.key}"` });
    }
    seen.add(env.key);
  }
});

export type EnvironmentsFile = z.infer<typeof EnvironmentsFileSchema>;

// ---------------------------------------------------------------------------
// Earth applications schema — spec §4.5
// ---------------------------------------------------------------------------

export const EarthAppLinkSchema = z
  .object({
    record_id: z.enum(RECORD_IDS),
    rationale: z.string().trim().min(1).max(200),
    source_url: z.string().url(),
    verified: z.boolean(),
  })
  .strict();

export type EarthAppLink = z.infer<typeof EarthAppLinkSchema>;

export const EarthApplicationSchema = z
  .object({
    id: text,
    title: text,
    links: z.array(EarthAppLinkSchema),
  })
  .strict();

export type EarthApplication = z.infer<typeof EarthApplicationSchema>;

export const EarthApplicationsFileSchema = z.array(EarthApplicationSchema);
export type EarthApplicationsFile = z.infer<typeof EarthApplicationsFileSchema>;
