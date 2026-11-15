# Flame in Freefall — Spec Addendum

| Field | Value |
|---|---|
| Document ID | FIF-SPEC-ADDENDUM-001 |
| Version | 1.0 |
| Date | 2026-11-15 |
| Status | Approved (Stage 1 defaults accepted 2026-11-15) |
| Amends | FIF-SPEC-001 (spec.md) — adds Sections 7, 8 and S-step cross-reference notes |

---

## Section 7: Export format

### 7.1 Overview

`lib/export.ts` exports two pure functions: `toCSV(records, weights, filters)` and
`toJSON(records, weights, filters)`. Both are called in the browser with the current
filtered record array and weight map. No server call is made.

### 7.2 CSV column list — 38 columns

| # | Column name | Source |
|---|---|---|
| 1 | `id` | `record.id` |
| 2 | `name` | `record.name` |
| 3 | `full_name` | `record.full_name` (empty string when null) |
| 4 | `pillar` | `record.pillar.join("; ")` |
| 5 | `pillar_status` | `record.verification.pillar` |
| 6 | `facility` | `record.facility` |
| 7 | `facility_status` | `record.verification.facility` |
| 8 | `hardware` | `record.hardware.join("; ")` |
| 9 | `hardware_status` | `record.verification.hardware` |
| 10 | `objective` | `record.objective` (empty string when null) |
| 11 | `objective_status` | `record.verification.objective` |
| 12 | `fuels` | ``record.fuels.map(f => `${f.name} (${f.form})`).join("; ")`` |
| 13 | `fuels_status` | `record.verification.fuels` |
| 14 | `diluents` | `record.diluents.join("; ")` |
| 15 | `diluents_status` | `record.verification.diluents` |
| 16 | `o2_min_pct` | `record.o2_min_pct` (empty when null) |
| 17 | `o2_max_pct` | `record.o2_max_pct` (empty when null) |
| 18 | `o2_pct_status` | `record.verification.o2_pct` |
| 19 | `pressure_min_psi` | `record.pressure_min_psi` (empty when null) |
| 20 | `pressure_max_psi` | `record.pressure_max_psi` (empty when null) |
| 21 | `pressure_psi_status` | `record.verification.pressure_psi` |
| 22 | `airflow_min` | `record.airflow.min` (empty when null) |
| 23 | `airflow_max` | `record.airflow.max` (empty when null) |
| 24 | `airflow_unit` | `record.airflow.unit` (empty when null) |
| 25 | `airflow_status` | `record.verification.airflow` |
| 26 | `gravity_regime` | `record.gravity_regime.join("; ")` |
| 27 | `gravity_regime_status` | `record.verification.gravity_regime` |
| 28 | `variables_varied` | `record.variables_varied.join("; ")` |
| 29 | `variables_varied_status` | `record.verification.variables_varied` |
| 30 | `sensors` | `record.sensors.join("; ")` |
| 31 | `sensors_status` | `record.verification.sensors` |
| 32 | `sub_experiments` | `record.sub_experiments.join("; ")` |
| 33 | `psi_url` | `record.psi_url` (empty when null) |
| 34 | `last_curated_at` | `record.last_curated_at` |
| 35 | `fit_iss` | `fitIss(record, environments)` — two decimals; empty when null |
| 36 | `fit_moon` | `fitMoon(record, environments)` — two decimals; empty when null |
| 37 | `relevance_score` | `relevance(record, environments, weights).score` — integer or empty |
| 38 | `source_count` | `record.sources.length` |

**Encoding and format:** UTF-8, RFC 4180. Null values are empty strings. Array fields
use `"; "` as separator and are quoted when they contain commas. File names follow
FR-XPT-04: `flame-in-freefall_<YYYYMMDDHHmmss>.csv` (UTC).

### 7.3 JSON structure

```json
{
  "schema_version": "1.0",
  "exported_at": "<ISO 8601 UTC>",
  "filters": {
    "pillar": null,
    "fuel": null,
    "facility": null,
    "gravity": null,
    "o2min": null,
    "o2max": null,
    "psimin": null,
    "psimax": null,
    "q": ""
  },
  "weights": { "iss": 0.5, "moon_base": 0.5 },
  "data_notice": "<copy key export.data_notice>",
  "records": []
}
```

Each entry in `records` is the full record object augmented with `fit_iss`,
`fit_moon` and `relevance_score`.

---

## Section 8: AI specification

### 8.1 Gemini model and configuration

| Setting | Value |
|---|---|
| Model | `gemini-2.0-flash` (default; override with `GEMINI_MODEL` env var) |
| Output mode | `responseMimeType: "application/json"` with `responseSchema` from `z.toJSONSchema()` |
| Temperature | 0.0 |
| Max output tokens | 2 048 |
| Timeout | 25 s via `AbortController` |
| Retry | 1 time; validation errors appended to the user turn |

### 8.2 Augmented record payload (`lib/ai/augment.ts`)

Each record is serialized to a compact object with its stored fields plus two
computed values: `fit_iss` (from `fitIss`) and `fit_moon` (from `fitMoon`). These
are computed from **the same code path** as the Explorer (NFR-ACC-AI-02). The full
13-record array plus the enabled environment profiles is JSON-serialized and
size-checked against the 100 KB ceiling before the Gemini call. If the size exceeds
100 KB, the route returns HTTP 503.

### 8.3 Response schema (`lib/ai/response-schema.ts`)

```ts
import { z } from "zod";
import { RECORD_IDS, VERIFIABLE_FIELDS } from "@/lib/schema";

const ClaimSchema = z.object({
  record_id: z.enum(RECORD_IDS),
  field:     z.enum(VERIFIABLE_FIELDS),
  value:     z.string(),
});

const ParagraphSchema = z.object({
  text:   z.string().min(1).max(2000),
  claims: z.array(ClaimSchema).min(1),
});

export const AiResponseSchema = z.object({
  status:         z.enum(["answered", "no_data", "out_of_scope"]),
  no_data_reason: z.enum(["partial_gravity", "not_in_dataset"]).nullable(),
  answer:         z.array(ParagraphSchema),
  extrapolation:  z.boolean(),
});
export type AiResponse = z.infer<typeof AiResponseSchema>;
```

The model's output is constrained to `answered`, `no_data` and `out_of_scope`. The
server adds `no_verified_answer` only after validation fails. `z.toJSONSchema()`
produces the JSON schema object passed to Gemini.

### 8.4 System prompt (`lib/ai/system-prompt.ts`)

The fixed system instruction (stored verbatim in this file, never inlined elsewhere):

1. States that the assistant answers only from the provided investigation records.
2. Explicitly labels record fields as **data** — not instructions (NFR-SEC-04).
3. Lists the response format and status rules.
4. Forbids numeric values not present in the records.
5. States no web access, no tools, no speculation.
6. Instructs: questions about partial-gravity combustion return `no_data` with
   `partial_gravity`; off-topic questions return `out_of_scope`.

### 8.5 Claim validator (`lib/ai/validate.ts`)

Pure function: `validateParagraph(paragraph, records, envRefValues): ValidationResult`.

Rules applied to each paragraph in this order:

1. **Record exists:** every `claim.record_id` resolves to a record.
2. **Field value match:** `claim.value` matches the stored field value within
   tolerance — numbers: exact match after `String(value)` normalization; strings:
   case-insensitive after trim.
3. **Numeric token check:** every numeric token (regex `/\b\d+\.?\d*\b/g`) in
   `paragraph.text` must appear in one of: `paragraph.claims[*].value`, or the
   environment reference values (ISS and Moon base O2 and pressure ranges).
4. **Claim presence:** when `status === "answered"` a paragraph with zero claims
   is invalid.

If any rule fails: remove the paragraph; append the failure reason to the retry
user turn. After retry: re-run validation; if no valid paragraph remains, the
route returns HTTP 200 with `status: "no_verified_answer"`.

### 8.6 Confidence label (`lib/ai/confidence.ts`, Could — FR-AI-13)

Server-computed only. Precedence (highest wins):
- **Low:** `extrapolation === true`, or the retry ran, or any paragraph was removed.
- **Medium:** at least one claim cites an `unverified` field and `extrapolation` is false.
- **High:** all claims cite `verified` fields and `extrapolation` is false.

### 8.7 Extrapolation detection (`lib/ai/extrapolation.ts`)

`config/extrapolation-keywords.ts` exports a `readonly string[]` of lowercase
keywords. The server lowercases the question and checks for any substring match.
If matched, `extrapolation: true` is forced regardless of model output (FR-AI-08).

### 8.8 Rate limiting (`lib/server/ratelimit.ts`)

Two Upstash `Ratelimit` sliding-window instances:
- Per-minute: `RATE_PER_MINUTE` env var (default 10).
- Per-day: `RATE_PER_DAY` env var (default 60).

Both are checked before the Gemini call. If the Upstash store is unreachable, fail
closed: return HTTP 503 and show `ai.unavailable` (NFR-SEC-07).

### 8.9 Logging (`lib/server/log.ts`)

Logs per request to `console.log` (captured by Vercel): `request_id` (UUID v4),
`timestamp` (ISO 8601), `ip_hash` (salted SHA-256 of the first `x-forwarded-for`
address), `http_status`, `latency_ms`, `input_tokens`, `output_tokens`. Never logs
question text, answer text or any model content (NFR-PRV-02).

### 8.10 Route handler (`app/api/ask/route.ts`)

```
export const runtime = "nodejs";
export const maxDuration = 30;        // confirm A-03

POST handler:
1. Parse and Zod-validate body: exactly one "question" string, strip control
   characters, 5–500 chars after strip; 400 on any failure (NFR-SEC-03).
2. Extract IP via lib/server/ip.ts; check both rate limits; 429 + Retry-After on
   excess (FR-AI-11).
3. Build augmented payload (augment.ts); size-check.
4. Call Gemini with 25 s timeout (client.ts).
   - Timeout  → HTTP 504, ui shows ai.unavailable
   - Quota/5xx → HTTP 503, ui shows ai.unavailable
5. Validate response schema (AiResponseSchema.safeParse).
6. Force extrapolation flag (extrapolation.ts).
7. Validate every paragraph (validate.ts).
8. If paragraphs removed: retry once with errors appended.
9. If no valid paragraph remains after retry: return
   { status: "no_verified_answer" } with HTTP 200.
10. Log (log.ts). Return validated response.
```

---

## S-step cross-reference notes

| Step | Description | Phase | Spec section |
|---|---|---|---|
| S-07 | `lib/explorer.ts`: `filterRecords`, sort, `parseState`, `serializeState`, unit tests | 1 | §6.2, §6.3 |
| S-12 | `scripts/data-report.ts`: per-record counts, 70% check, unsourced exit-1, payload size | 1 | §4.6 |
| S-20 | `scripts/golden.ts`: G1–G12 with computed oracles | 2 | prd §10 |
| S-21 | URL state wiring (`parseState`/`serializeState` → history.replaceState, 200 ms debounce) | 3 | §6.2 |
| S-22 | Earth-application links with source URLs, `verified: true` after reading source | 3 | §4.5 |
