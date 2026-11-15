# Flame in Freefall — Build Checklist

| Field | Value |
|---|---|
| Document ID | FIF-CHECKLIST-001 |
| Version | 1.0 |
| Date | 2026-11-14 |
| Product | Flame in Freefall: Investigation Explorer and Relevance Ranker |
| Product owner | Bharath |
| Team | 2 people (OQ-06 answered) |
| Companion documents | `scope.md` (boundary), `prd.md` (requirements), `spec.md` (build detail) |

## How to use this list

- One line is one task and one commit. Tick `[x]` only when the check in the line passes.
- **Owner A** = Data and AI (Curator, AI and backend). **Owner B** = Front end and QA (Front end, Test and docs). This is the default split for two people: about 20 h for A and 23 h for B against the 43 person-hours in `scope.md` section 8. Swap names freely, but keep the rule that the person who did not curate a record checks its `verified` values.
- References: `FR-` and `NFR-` IDs are in `prd.md`; `§` is a section of `spec.md`; `S-nn` is a spec step number (only the numbers named in the spec text appear here).
- A gate must be fully ticked before the next phase starts. If a gate slips, cut in the `scope.md` section 5.2 order. Musts are never cut; mark fields `not_available` instead of dropping a record or estimating a value.

---

## Phase 0 — Setup (hours 0–4)

**Decisions**
- [x] OQ-06: team size is 2
- [x] OQ-04: Gemini model id chosen and API key ready
- [ ] A: record the model id in the Vercel environment variables and the README setup section (OQ-04)
- [ ] A: confirm PSI, NTRS and NASA Science pages are readable; note the working URL paths (OQ-01, A-01; hour 2)
- [ ] B: find the official Space Apps submission and judging requirements (OQ-07; hour 4)

**Build**
- [ ] B: create the public GitHub repository; Next.js App Router, TypeScript `strict`, Tailwind; exact versions pinned; `.nvmrc` on Node 22 or later (§2)
- [ ] B: Vitest, ESLint, `typecheck`, the npm scripts and GitHub Actions CI with audit and gitleaks (§2; NFR-QLT-01)
- [ ] B: deploy a hello page to Vercel from `main`; confirm function duration of at least 30 s (A-03, R-11)
- [ ] B: map the design tokens to `tailwind.config.ts`; system font stack; base layout (`prd.md` section 5.2, 5.3)
- [ ] A: `lib/schema.ts` Zod schema and validation rules (§4.1, §4.2)
- [ ] A: seed `data/investigations.json` (13 ids), `data/environments.json`, `data/earth-applications.json` (§4.3–§4.5)
- [ ] A: `scripts/validate-data.ts` wired to `prebuild`; an invalid enum value makes `npm run build` fail (FR-DAT-01, FR-DAT-02, FR-DAT-06)
- [ ] A: Gemini key and Upstash Redis (Vercel Marketplace) set as environment variables only; nothing committed (NFR-SEC-01)
- [ ] A: `scripts/gemini-smoke.ts`: one call returns schema-valid JSON

**Gate 0**
- [ ] Hello page is live on the Vercel URL
- [ ] Smoke script passes
- [ ] Curation of the first record has started

---

## Phase 1 — Core (hours 4–20)

**Data (A, in parallel with the front end)**
- [ ] A: curate all 13 records, 45-minute time-box each; status on every field; `objective` of 400 characters or fewer; run `npm run data:validate` and commit per record (§4.6; FR-DAT-03, FR-DAT-04)
- [ ] A: golden-critical fields: `flex` diluents CO2 and helium (G3); fuel forms where a source states them (G1); O2 and pressure pairs where a source states them (G7, G10) (§4.3)
- [ ] A: settle the pillar for Saffire, FLEX-2, CFI and ACME from sources, or keep the defaults (OQ-09)
- [ ] A: start `docs/curation-checklist.md`: each unit conversion, each source, one tick line per `verified` value (§4.6)
- [ ] A: `scripts/data-report.ts`: per-record counts, 70% PASS or WARN line, unsourced values exit 1, payload size under 100 KB (S-12; O-1, NFR-SCL-02)
- [ ] A: `lib/data.ts` loader (§4.7)

**Scoring and shell (B)**
- [ ] B: `config/scoring.ts` and pure `lib/scoring.ts` (§5.1–§5.3)
- [ ] B: worked-example fixture and unit tests, 90% lines or higher on `lib/scoring.ts` (§5.4, §5.5; FR-RNK-09)
- [ ] B: root layout, Header, Footer (`footer.disclaimer`), permanent Banner (`banner.gap`, `role="note"`), skip link, 404 page (FR-UI-01, FR-EXP-04; §6.10)
- [ ] B: `lib/copy.ts` with every fixed string from `prd.md` section 6, plus a copy test

**Explorer (B)**
- [ ] B: `lib/explorer.ts`: `filterRecords`, sort, `parseState`, `serializeState`, with unit tests (S-07; §6.2, §6.3)
- [ ] B: table from 768 px, cards below 768 px, all seven fields, sortable headers, default sort score descending then name (FR-EXP-01, FR-EXP-07; §6.4)
- [ ] B: filter bar, text search, Reset filters, live count within 100 ms (FR-EXP-02)
- [ ] B: StatusBadge and PillarChip, icon plus text, never color alone (FR-EXP-05)
- [ ] B: WeightPanel with ISS and Moon base sliders, Reset weights, locked rows for rover and Mars (FR-RNK-01, FR-RNK-02)
- [ ] B: ScoreBreakdown, zero-weights message, extrapolation badge, Unscored rows last (FR-RNK-03 to FR-RNK-06)
- [ ] B: `/investigations/[id]` with `generateStaticParams`, every field and badge, sources list, Fit line, `last_curated_at`, add-to-compare button (FR-EXP-03, FR-DAT-07, NFR-LEG-01; §6.6)
- [ ] B: `/about` with eight anchors, formula, tolerances and reference values (FR-RNK-08, FR-UI-04; §6.7)
- [ ] B: loading, empty and error states on every data view (FR-UI-02)

**Gate 1**
- [ ] FR-DAT, FR-EXP (Must) and FR-RNK (Must) acceptance criteria pass
- [ ] All 13 detail pages render; unknown id returns the 404 page
- [ ] Network panel shows no request to any `nasa.gov` host (FR-DAT-05)
- [ ] Slider and filter changes finish within 100 ms with no network request (FR-RNK-02, NFR-PRF-03)
- [ ] `npm run data:report` exits 0

---

## Phase 2 — Interpret and export (hours 20–32)

**Decisions**
- [ ] A: OQ-03 (ISS atmosphere) and OQ-08 (tolerances, rate limits, bins) confirmed or left at defaults (hour 20)

**Compare (B)**
- [ ] B: `lib/compare.ts` (`parseCompareIds`), CompareProvider and sticky tray, fifth add refused with `compare.max` (FR-CMP-01, FR-CMP-04; §6.5)
- [ ] B: `/compare` table: one column per record, "differs" marker, "Variables varied within the investigation" row (FR-CMP-02, FR-CMP-03)

**AI route (A)**
- [ ] A: `lib/ai/augment.ts`: `fit_iss` and `fit_moon` from the same code path as the Explorer (FR-AI-02, NFR-ACC-AI-02; §8.2)
- [ ] A: `response-schema.ts` generated from Zod and `system-prompt.ts` (record fields are data, not instructions) (FR-AI-03, NFR-SEC-04; §8.3)
- [ ] A: `validate.ts`: claim validator and numeric-token check; 90% lines or higher (FR-AI-04, NFR-ACC-AI-01, NFR-QLT-02; §8.5)
- [ ] A: `extrapolation.ts` and `config/extrapolation-keywords.ts`; server forces `extrapolation: true` on a keyword match (FR-AI-08)
- [ ] A: `client.ts` with 25 s timeout; `pipeline.ts` with one retry and `no_verified_answer`; status mapping 504, 503 and 200 (FR-AI-03, FR-AI-04, FR-AI-09, NFR-REL-03)
- [ ] A: `lib/server/ratelimit.ts` (10 per minute, 60 per day from environment variables), `ip.ts` salted hash, `log.ts` without question or answer text; fail closed with 503 (FR-AI-11, NFR-SEC-07, NFR-PRV-02)
- [ ] A: `app/api/ask/route.ts`: Node runtime, `maxDuration`, Zod body of 5 to 500 characters, 400 on any other body (FR-AI-02, NFR-SEC-03)
- [ ] A: tests: pipeline with a mocked provider (wrong value removed, retry issued), route tests, rejected-hallucination test
- [ ] A: security headers in the Next.js config (NFR-SEC-06)

**Ask UI (B)**
- [ ] B: `/ask`: AskForm, four chips (G1, G3, G7, G8), `ask.gemini_notice`, controls disabled while pending, `ask.length` error (FR-AI-01, FR-AI-10, FR-AI-12)
- [ ] B: AnswerView: plain text only, citation chips, `badge.extrapolation_answer`, fixed `no_data` and `out_of_scope` texts, `ai.unavailable`, `ai.rate_limited` with seconds (FR-AI-05 to FR-AI-09, FR-AI-11, NFR-SEC-05)

**Export (B)**
- [ ] B: `lib/export.ts`: CSV (RFC 4180, `_status` columns, 38 columns) and JSON (six keys), file names in UTC; Export buttons disabled when the list is empty (FR-XPT-01 to FR-XPT-04; §7.2)
- [ ] B: `docs/export-format.md` and `tests/export-python/check.py`; `npm run test:export` passes (O-4)

**Golden set (A)**
- [ ] A: `scripts/golden.ts` for G1 to G12 with computed oracles (S-20; `prd.md` section 10)
- [ ] A: run the set 3 times; 5xx rate below 2% excluding quota errors (NFR-REL-02); save screenshots to `docs/demo/`

**Gate 2**
- [ ] FR-CMP, FR-AI (Must) and FR-XPT acceptance criteria pass
- [ ] Golden set at least 11 of 12; 0 numeric values outside cited records (O-3)
- [ ] G5 and G6 return `no_data`; G11 and G12 return `out_of_scope` with no system text leaked
- [ ] With the Gemini key blanked, `/` and `/compare` work and `/ask` shows `ai.unavailable` (NFR-REL-01)

---

## Phase 3 — Should (hours 32–40)

- [ ] A: OQ-02: reference O2 and pressure for rover and Mars, or leave both locked (hour 32)
- [ ] A: add Earth-application links with source URLs; set `verified: true` only after reading the source (S-22; FR-EAR-02)
- [ ] B: `/earth` with three application tabs and `earth.no_link` fallback (FR-EAR-01, FR-EAR-02; §6.8)
- [ ] B: URL state: filters, sort and weights restored from the query string, 200 ms debounced write (S-21; FR-EXP-06; §6.2)
- [ ] B: compare export as CSV in the FR-XPT-02 format (FR-CMP-05)
- [ ] B: rover and Mars sliders appear when `enabled` flips to `true`; fixture test (FR-RNK-07)
- [ ] B: Axe 0 violations on Explorer, detail, compare, ask and export; keyboard walkthrough; contrast check (NFR-A11Y-01 to NFR-A11Y-03)
- [ ] B: Lighthouse mobile Performance 90 or higher; initial JavaScript for `/` at 200 KB gzip or less; `autocannon` 100 connections for 30 s (NFR-PRF-01, NFR-PRF-02, NFR-SCL-01)
- [ ] B: second-person check of every `verified` value in A's records against its source URL; fix mismatches; tick each line in `docs/curation-checklist.md` (R-03)
- [ ] A: OQ-10: NASA media-use policy checked; no NASA logo anywhere (hour 40; NFR-LEG-01)

**Gate 3**
- [ ] FR-EAR, FR-EXP-06 and FR-CMP-05 acceptance criteria pass
- [ ] NFR-A11Y checks pass
- [ ] Second-person check complete; `data:report` re-run and exits 0

---

## Phase 4 — Could (hours 40–46)

Build in this order. An item that cannot pass its own acceptance criterion in its slot is cut, not carried (`scope.md` section 5.2).

- [ ] A: evidence trail: click a sentence, open the panel with record, field, stored value, status, sources and Open record link (FR-AI-14)
- [ ] A: server-computed confidence labels, precedence Low, Medium, High (FR-AI-13)
- [ ] B: group-by-pillar toggle with collapsible groups (FR-PIL-01)
- [ ] B: `/coverage` grid with regime selector, airflow filter, "gap" hatch and screen-reader table (FR-COV-01 to FR-COV-03, NFR-A11Y-04; §6.9)

**Gate 4**
- [ ] Each built item passes its own acceptance criterion, or is cut and its nav link and About text are removed

---

## Phase 5 — Freeze and release (hours 46–48)

- [ ] Feature freeze; no new code except fixes
- [ ] B: README with setup, environment variables, curation workflow and deployment; `docs/export-format.md` present (NFR-QLT-03)
- [ ] B: license file (MIT unless the product owner changes it; OQ-05; hour 44)
- [ ] A+B: demo rehearsal against the 3-minute plan in `scope.md` section 10, with the Gemini-down fallback ready (hour 46)

**Release checklist (the product owner signs this list)**
- [ ] Every Must acceptance criterion in `prd.md` passes
- [ ] `npm run build`, `npm test`, `npm run lint`, `npm run typecheck` and `npm run data:report` all exit 0
- [ ] `npm audit --omit=dev` shows no critical or high findings (NFR-SEC-08)
- [ ] Golden set at least 11 of 12, 0 numeric values outside cited records (O-3)
- [ ] Gemini key restricted to the Generative Language API in Google's console; screenshot saved (NFR-SEC-02)
- [ ] Key string absent from the client bundle and responses; gitleaks clean (NFR-SEC-01, FR-AI-02)
- [ ] Production `/api/ask` over 20 timed requests: p50 at 8 s or less, p95 at 15 s or less (NFR-PRF-04)
- [ ] Banner present on `/`, `/investigations/[id]`, `/compare`, `/ask`, `/earth`, `/about`, `/coverage`, for every route that was built (FR-EXP-04, O-5)
- [ ] Storage panel empty, no cookies, no third-party scripts (NFR-PRV-01, NFR-PRV-03)
- [ ] Footer disclaimer present, no NASA logo, every record page and export shows source titles and URLs (NFR-LEG-01)
- [ ] Product owner confirms no estimated, interpolated or inferred values in the data (FR-DAT-04)
- [ ] Public Vercel URL and public repository both reachable (O-6)
- [ ] Submission sent per the OQ-07 requirements
