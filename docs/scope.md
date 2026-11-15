# Flame in Freefall — Scope

| Field | Value |
|---|---|
| Document ID | FIF-SCOPE-001 |
| Version | 1.0 |
| Date | 2026-11-14 |
| Product | Flame in Freefall: Investigation Explorer and Relevance Ranker |
| Event | NASA Space Apps Challenge 2026, challenge "Flame in Freefall" (Microgravity Combustion and Fire Safety) |
| Product owner | Bharath |
| Build window | 48 hours |
| Source | `prd.md` input FIF-PRD-001 v1.0 (the report-derived PRD) |
| Companion documents | `prd.md` (what it does, how it looks), `spec.md` (how it is built, step by step), `checklist.md` (task list) |

**How to read this document.** It fixes the boundary: what ships, for whom, and what is cut. Any change to a boundary here requires the product owner to edit this file first, then the other three.

---

## 1. What it is

Flame in Freefall is a public, login-free web dashboard built on **13 hand-curated records** of NASA Physical Sciences Informatics (PSI) low-gravity combustion investigations, mostly flown on the International Space Station (ISS). It turns uneven PSI metadata into four things a user can act on:

1. **Cards and a table** that state each investigation's objective, fuels, oxygen %, pressure, airflow, variables varied and sensors, with a per-field verification label (`verified`, `unverified`, `not_available`).
2. **A transparent relevance ranking** of the 13 investigations against crew environments (ISS and Moon base), with adjustable weights and a visible formula for every score.
3. **A side-by-side compare view** for 2 to 4 investigations.
4. **A grounded AI question-and-answer layer** (Gemini, called server-side) that answers only from the curated records and cites the record behind every claim.

Users can also export the structured test conditions as CSV or JSON for predictive flammability models.

**One-sentence pitch.** "Which microgravity fire experiments actually matter for the atmosphere a crew will live in, and how sure can we be?"

## 2. Who it is for

| ID | Persona | Priority | Job to be done |
|---|---|---|---|
| P-1 | Combustion researcher | Primary | Find which investigations hold data for a flammability question and pull the conditions into an analysis |
| P-2 | Fire-safety engineer | Primary | Decide which results apply to a crew habitat or equipment design (station, Moon base, pressurized rover) |
| P-3 | Student | Primary | Learn what exists, what each experiment tested and why it matters (prevention, detection, suppression) |
| P-4 | Event judge | Secondary | Decide in minutes whether the product is valid, useful and honest |

## 3. The problem it solves

- PSI data is heterogeneous: text and numbers, plus large image and video sets.
- The schema differs between investigations, so oxygen %, airflow and sensors sit in different places or are missing.
- Relevance to future habitats is stated nowhere. The challenge statement gives Moon habitats at 30% oxygen or more and 10.2 psi or less, against 21% and 14.7 psi on Earth, and higher oxygen makes materials much more flammable.
- PSI holds **no partial-gravity combustion data**. Every lunar conclusion is an extrapolation and the product labels it as one.
- Nobody can compare investigations quickly or load their conditions into a model.

## 4. In scope (what ships)

Priority follows MoSCoW. Module IDs match `prd.md` and `spec.md`.

| Priority | Feature | Module | Release rule |
|---|---|---|---|
| Must | Curated data layer: 13 records, per-field verification status, build-time Zod validation | FR-DAT | Release blocker |
| Must | Investigation Explorer: table and cards, filters, search, sortable columns, detail pages, permanent partial-gravity banner | FR-EXP | Release blocker |
| Must | Relevance ranking: ISS and Moon base weight sliders, per-row breakdown, pure tested scoring function | FR-RNK | Release blocker |
| Must | Compare view for 2 to 4 investigations with "differs" markers | FR-CMP | Release blocker |
| Must | AI Q&A: schema-constrained, server-validated claims, citations, `no_data`, `out_of_scope`, rate limit | FR-AI-01 to 12 | Release blocker |
| Must | CSV and JSON export of the filtered set | FR-XPT | Release blocker |
| Must | Shared shell, About page, loading/empty/error states, 360 px to 1920 px layout | FR-UI | Release blocker |
| Should | Earth applications tab (mist extinguishers, smoke detection, firefighter gear) | FR-EAR | Built after all Musts pass |
| Should | Shareable URL state, rover and Mars sliders gated on reference values, compare export, `last_curated_at` display | FR-EXP-06, FR-RNK-07, FR-CMP-05, FR-DAT-07 | Built after all Musts pass |
| Could | Evidence trail (click a sentence, see record, field, value, status, source) | FR-AI-14 | Cut first, in the order of section 5.2 |
| Could | Server-computed confidence labels on AI answers | FR-AI-13 | Same |
| Could | Group-by-pillar view | FR-PIL | Same |
| Could | Coverage gap map (O2 % by pressure bins, gravity regime selector) | FR-COV | Same |

## 5. What is cut

### 5.1 Won't have in this release

| Item | Reason |
|---|---|
| User accounts, login, saved sessions | Access model is public with no login |
| Multi-turn AI chat with memory | Each question is validated independently; keeps grounding checks simple |
| Live PSI sync or a PSI API client | Decision: hand-curated JSON only; PSI availability is uncertain (A-01) |
| Partial-gravity experimental data | Does not exist in PSI; shown as a gap, never filled |
| Video or image analysis, physics simulation, predictive-model training | The product exports data; it does not model |
| Rocket and propellant fire safety | Excluded by the challenge statement |
| Light theme, localization, native mobile app | Not required inside 48 hours |
| Per-experiment records for ACME's six experiments | One record per investigation; ACME lists its experiments in `sub_experiments` |
| Third-party analytics, cookies, browser storage | Privacy requirements NFR-PRV-01 and NFR-PRV-03 |

### 5.2 Scope-cut ladder

When a phase gate is missed, cut in this exact order and stop as soon as the gate can pass:

1. Coverage gap map (FR-COV)
2. Pillar views (FR-PIL)
3. Confidence labels (FR-AI-13)
4. Evidence trail (FR-AI-14)
5. Compare export (FR-CMP-05)
6. Rover and Mars slider gating test and documentation (FR-RNK-07)
7. URL state (FR-EXP-06)
8. Earth tab (FR-EAR)

Musts are never cut. If a Must is at risk, reduce curation depth by marking more fields `not_available`; never drop a record and never estimate a value.

## 6. Judging alignment

Weights are from the event's judging table. The "Build-order effect" column states how each criterion influences sequencing inside the cut ladder; it changes no priority.

| Criterion | Weight | How the product earns it | Evidence shown in the demo | Build-order effect |
|---|---|---|---|---|
| Problem significance and real-world impact | 20% | Crew fire safety in future habitats (30% O2 or more, 10.2 psi or less) versus the 21% O2, 14.7 psi most experiments used; Earth benefit tab | Banner, ISS versus Moon base re-ranking, Earth tab | Ranking (FR-RNK) is the first interactive feature built after the data layer |
| Innovation and uniqueness | 20% | Environment-weighted relevance score with visible math; verification labels on every field; claim-level evidence trail; the partial-gravity gap stated on every page | Score breakdown, `no_data` answer for lunar gravity, evidence panel | Phase 4 starts with the evidence trail |
| NASA / space-agency dataset utilization | 20% | All 13 records curated from NASA PSI, NTRS and NASA Science pages; every `verified` value carries a source title and URL; coverage map shows where PSI is thin | Detail page sources list, `data:report` output, coverage map if built | Curation (12 person-hours) starts at hour 0 and runs in parallel with the front end |
| Technical feasibility within hackathon duration | 15% | Static bundled data; only one server route (`/api/ask`); cut ladder; phase gates | Public Vercel URL and public repository inside 48 hours | Gates in section 7 are enforced |
| AI/ML and technological depth | 10% | Schema-constrained Gemini output, server-side claim validator with numeric-token check and one retry, deterministic extrapolation flag, server-computed confidence, golden-set evaluation (11 of 12 pass) | Golden-set run output, a rejected hallucination in a unit test | Validator is built and tested before the `/ask` UI |
| Prototype and demonstration potential | 10% | Working public deployment, six-route app, suggested-question chips, export file opened in Python | Demo script in section 10 | Demo rehearsal at hour 46 |
| Scalability and future potential | 5% | 60-record ceiling with no architecture change (NFR-SCL-02), retrieval step as the named next item, enabled flags for rover and Mars | About page "next steps" and README roadmap | Documentation only |

## 7. Timeline and gates

Hours count from the start of the 48-hour window.

| Phase | Hours | Deliverables | Gate (must pass to continue) |
|---|---|---|---|
| 0 Setup | 0–4 | Repo, Next.js app on Vercel, Zod schema, Gemini model chosen, environment variables, PSI and NTRS reachability confirmed, curation started | Deployed hello page; one Gemini call returns schema-valid JSON |
| 1 Core | 4–20 | All 13 records curated, Explorer, detail pages, filters, ranking with breakdown, About page, gap banner | FR-DAT, FR-EXP (Must), FR-RNK (Must) acceptance pass |
| 2 Interpret and export | 20–32 | Compare view, AI route with validator, rate limiting, `/ask` UI, CSV and JSON export | FR-CMP, FR-AI (Must), FR-XPT acceptance pass; golden set at least 11 of 12 |
| 3 Should | 32–40 | Earth tab, URL state, compare export, rover and Mars gating, accessibility pass | FR-EAR, FR-EXP-06, FR-CMP-05 acceptance; NFR-A11Y checks |
| 4 Could | 40–46 | In order: evidence trail, confidence labels, pillar views, coverage gap map | Each item passes its own acceptance or is cut |
| 5 Freeze | 46–48 | Feature freeze, README, license, deployment check, submission | Release checklist in `checklist.md` signed |

## 8. Effort and team

Planning budget for Musts and Shoulds: **43 person-hours** = data curation 12 + front end 16 + AI route and validator 8 + testing 4 + documentation and submission 3.

| Team size | Elapsed time for 43 person-hours | Consequence |
|---|---|---|
| 1 | 43 h | Fits 48 h only with no slack. Apply the cut ladder from the Phase 2 gate; do not start Could items |
| 2 | 21.5 h | Fits with a full Phase 4 |
| 3 | 14.3 h | Fits; add a second curator for the second-person `verified` check |
| 4 | 10.8 h | Fits; assign roles below |

Roles (one person may hold several): **Curator** (data and source checks), **Front end** (Explorer, Compare, Ask UI, export), **AI and backend** (`/api/ask`, validator, rate limit), **Test and docs** (unit tests, golden set, README, submission). Team size is open question OQ-06; the product owner answers it at hour 0.

## 9. Success metrics

| ID | Objective | Target at release | Measured by |
|---|---|---|---|
| O-1 | Trustworthy dataset | 13 records; 100% of the 156 verifiable fields (13 records × 12 fields) carry a status; 0 estimated values; at least 70% of fields `verified` (110 or more of 156) | `npm run data:report` (the 70% line reports PASS or WARN; see `spec.md` step S-12) |
| O-2 | Transparent ranking | 100% of displayed scores have an expandable breakdown | Manual check of all 13 rows |
| O-3 | Grounded AI | Golden set: at least 11 of 12 questions pass; 0 answers contain a numeric value absent from the cited records | `npm run golden` plus manual review |
| O-4 | Serves modelers | CSV and JSON exports of any filtered set load in Python (`pandas.read_csv`, `json.load`) | `tests/export-python/check.py` |
| O-5 | Gap stated openly | Partial-gravity banner on 100% of pages; G5 and G6 return `no_data` | Manual check |
| O-6 | Ships in the window | Public Vercel URL and public GitHub repository within 48 hours | URL and repository reachable |

## 10. Demo plan (3 minutes)

| Time | Action | Proves |
|---|---|---|
| 0:00–0:20 | Open `/`; read the banner aloud; state the pitch | Problem significance, honesty about the data gap |
| 0:20–1:00 | Drag the ISS slider to 0.00; table re-sorts; expand the top row to show weights, fits and formula | Innovation, transparency |
| 1:00–1:30 | Tick BASS and BASS-II; open Compare; point to "differs" and "Variables varied within the investigation" | Dataset utilization, usefulness |
| 1:30–2:30 | `/ask`: click the G7 chip; show citation chips and the Extrapolation label; click a sentence to open the evidence panel (if built); then ask G6 and show the fixed `no_data` text | AI depth, grounding, honesty |
| 2:30–2:50 | Click Export CSV; open the file; point at the `_status` columns | Serves modelers |
| 2:50–3:00 | Show the Earth tab and the repository URL | Impact, open source |

**Demo fallback.** If Gemini is down, ask any question to show the FR-AI-09 message, state that Explorer, Compare and Export are unaffected, and show the golden-run screenshots saved in `docs/demo/`.

## 11. Locked decisions (product-owner interview, 2026-11-14)

| Topic | Decision |
|---|---|
| Data source | Hand-curated JSON only; no live PSI pull |
| Dataset size | 13 records: BASS, BASS-II, Saffire-I, Saffire-II, Saffire-III, SAME, SAME-R, DAFT, DAFT-2, FLEX, FLEX-2, CFI, ACME |
| AI provider | Gemini API, called server-side |
| Stack and hosting | Next.js (App Router, TypeScript strict) on Vercel |
| Access model | Public, no login, per-IP rate limit on the AI endpoint |
| Wireframes | ASCII wireframes in `prd.md`; no external prototype |

## 12. Constraints and assumptions

| ID | Assumption | If false |
|---|---|---|
| A-01 | PSI, NTRS and NASA Science pages are readable by the curator during the window | Affected fields become `not_available`; the 45-minute-per-record time-box holds |
| A-02 | A Gemini API key is obtainable from Google AI Studio and its quota covers golden-set runs and judging traffic | AI layer shows the FR-AI-09 message; the rest still works |
| A-03 | The Vercel plan allows a function duration of at least 30 s | Lower `maxDuration` and the Gemini abort to the plan limit and re-measure NFR-PRF-04 |
| A-04 | The augmented record set for 13 records is under 100 KB (about 7,000 tokens) | Replace full-set prompting with the retrieval step named in NFR-SCL-02 |
| A-05 | The ISS cabin atmosphere equals the Earth-normal baseline (21% O2, 14.7 psi) | Edit `data/environments.json`; no code change |
| A-06 | Visitors use a browser with JavaScript enabled | Not supported |

## 13. Top risks

| ID | Risk | Mitigation |
|---|---|---|
| R-01 | AI states a number no record holds | Full-record grounding, claim validator, numeric-token check, one retry, `no_verified_answer` fallback, golden set |
| R-02 | PSI unreachable or metadata uneven; curation overruns | Phase 0 access check, 45-minute time-box per record, `not_available` instead of guessing |
| R-03 | A curation error enters a `verified` field | Second-person check of every `verified` value against its source URL before release |
| R-05 | Overclaiming for the Moon | Permanent banner, Extrapolation badge, keyword-forced `extrapolation` flag, fixed `no_data` text |
| R-06 | Scope creep into video analysis or simulation | Won't list (section 5.1) and cut ladder (section 5.2) |
| R-07 | Gemini quota, latency or outage during judging | Rate limits, 25 s timeout, graceful degradation, non-AI routes independent |
| R-08 | Public AI endpoint abused to drain quota | Per-IP limits, fail-closed limiter, 500-character cap, key restricted in Google's console |
| R-10 | Team too small for 43 person-hours | Answer OQ-06 at hour 0; apply the cut ladder at each gate |

The full register (R-01 to R-13) is in `prd.md` section 9.

## 14. Future potential (not in this release)

| Item | Trigger | Architecture impact |
|---|---|---|
| Retrieval step replacing full-set prompting | More than 60 records or an augmented set above 100 KB | New work item; validator and schema unchanged |
| Per-experiment ACME records | Curator capacity after release | Data change only; add ids to the Zod list |
| Rover and Mars profiles | Reference values supplied (OQ-02) | Edit `data/environments.json`; set `enabled: true` |
| Live PSI sync | PSI exposes a stable API | New ingestion script; runtime remains static |
| Partial-gravity data | Any source publishes it | Add `partial_gravity` records with cited sources; remove the gap labels only after the data exists |

## 15. Definition of done

The release ships when all of the following hold:

1. Every Must requirement in `prd.md` passes its acceptance criterion.
2. Phase 2 gate passed: golden set at least 11 of 12 and 0 numeric values outside cited records.
3. `npm run build`, `npm test`, `npm run lint` and `tsc --noEmit` pass; `npm run data:report` exits 0.
4. The production URL meets NFR-PRF-01 (Lighthouse mobile Performance 90 or higher) and NFR-A11Y-01 (Axe 0 violations on core flows).
5. The public repository holds the README, `docs/export-format.md` and the license file.
6. The product owner signs the release checklist in `checklist.md`.
