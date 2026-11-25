# Flame in Freefall — Export Format Specification

| Field | Value |
|---|---|
| Document ID | FIF-EXPORT-001 |
| Version | 1.0 |
| Date | 2026-11-15 |
| Related Requirements | FR-XPT-01 to FR-XPT-04 |

## Overview

Flame in Freefall exports filtered investigation data in two formats:
- **CSV** (RFC 4180) — 38 columns for spreadsheet analysis
- **JSON** — structured format with metadata and filters

Both formats include computed fit scores and relevance rankings.

## CSV Format

### Specification
- **Encoding:** UTF-8 with BOM
- **Line ending:** CRLF (`\r\n`)
- **Delimiter:** Comma (`,`)
- **Escaping:** RFC 4180 — fields containing `,`, `"`, `\n`, or `\r` are quoted; internal `"` is escaped as `""`
- **Empty values:** Missing data renders as empty string
- **List separators:** Multi-value fields use `; ` (semicolon-space)

### Columns (38 total)

| # | Column | Type | Description | Example |
|---|---|---|---|---|
| 1 | id | string | Unique investigation identifier | `bass-ii` |
| 2 | name | string | Display name | `BASS-II` |
| 3 | full_name | string | Full official name | `Burning and Suppression of Solids - II` |
| 4 | pillar | list | Combustion pillars (semicolon-separated) | `ignition; flame spread` |
| 5 | pillar_status | status | Verification status | `verified` |
| 6 | facility | string | ISS facility name | `MSG` |
| 7 | facility_status | status | Verification status | `verified` |
| 8 | hardware | list | Hardware/chamber names | `CIR; 2-inch chamber` |
| 9 | hardware_status | status | Verification status | `verified` |
| 10 | objective | string | Science objective (≤400 chars) | `Measure flame spread...` |
| 11 | objective_status | status | Verification status | `verified` |
| 12 | fuels | list | Fuels with form in parens | `PMMA (solid); Cotton (solid)` |
| 13 | fuels_status | status | Verification status | `verified` |
| 14 | diluents | list | Diluent gases | `nitrogen; carbon dioxide` |
| 15 | diluents_status | status | Verification status | `verified` |
| 16 | o2_min_pct | number | Min O2 percentage tested | `18.0` |
| 17 | o2_max_pct | number | Max O2 percentage tested | `35.0` |
| 18 | o2_pct_status | status | Verification status | `verified` |
| 19 | pressure_min_psi | number | Min pressure tested (psi) | `10.2` |
| 20 | pressure_max_psi | number | Max pressure tested (psi) | `14.7` |
| 21 | pressure_psi_status | status | Verification status | `verified` |
| 22 | airflow_min | number | Min airflow velocity | `5.0` |
| 23 | airflow_max | number | Max airflow velocity | `20.0` |
| 24 | airflow_unit | string | Airflow unit | `cm/s` |
| 25 | airflow_status | status | Verification status | `unverified` |
| 26 | gravity_regime | list | Gravity regimes tested | `microgravity; normal_gravity` |
| 27 | gravity_regime_status | status | Verification status | `verified` |
| 28 | variables_varied | list | Variables varied within investigation | `oxygen concentration; pressure` |
| 29 | variables_varied_status | status | Verification status | `verified` |
| 30 | sensors | list | Sensor types used | `video camera; thermocouple` |
| 31 | sensors_status | status | Verification status | `unverified` |
| 32 | sub_experiments | list | Sub-experiment identifiers | `BASS-IIA; BASS-IIB` |
| 33 | psi_url | string | NASA PSI page URL | `https://psi.nasa.gov/...` |
| 34 | last_curated_at | ISO8601 | Last curation timestamp | `2026-11-14T22:30:00Z` |
| 35 | fit_iss | number | ISS environment fit (0.0–1.0) | `0.95` |
| 36 | fit_moon | number | Moon base environment fit (0.0–1.0) | `0.50` |
| 37 | relevance_score | number | Weighted relevance score (0–100) | `75.2` |
| 38 | source_count | integer | Number of sources cited | `3` |

### Status Values
- `verified` — At least one source confirms this value
- `unverified` — Value present but not source-verified
- `not_available` — No data available for this field

### File Naming
Format: `flame-in-freefall_YYYYMMDDHHmmss.csv` (UTC timestamp)

Example: `flame-in-freefall_20261115133045.csv`

## JSON Format

### Structure
```json
{
  "schema_version": "1.0",
  "exported_at": "2026-11-15T13:30:45.123Z",
  "filters": {
    "pillar": ["ignition"],
    "fuel": ["solid"],
    "facility": [],
    "gravity": ["microgravity"],
    "o2min": null,
    "o2max": null,
    "psimin": null,
    "psimax": null,
    "q": ""
  },
  "weights": {
    "iss": 0.5,
    "moon": 0.5,
    "rover": 0,
    "mars": 0
  },
  "data_notice": "NASA PSI investigation data. Not for operational spacecraft use. Moon and Mars results are extrapolations.",
  "records": [
    {
      "id": "bass-ii",
      "name": "BASS-II",
      "full_name": "Burning and Suppression of Solids - II",
      "pillar": ["ignition", "flame spread"],
      "facility": "MSG",
      "hardware": ["CIR", "2-inch chamber"],
      "objective": "Measure flame spread rates...",
      "fuels": [
        { "name": "PMMA", "form": "solid" },
        { "name": "Cotton", "form": "solid" }
      ],
      "diluents": ["nitrogen"],
      "o2_min_pct": 18.0,
      "o2_max_pct": 35.0,
      "pressure_min_psi": 10.2,
      "pressure_max_psi": 14.7,
      "airflow": {
        "min": 5.0,
        "max": 20.0,
        "unit": "cm/s"
      },
      "gravity_regime": ["microgravity"],
      "variables_varied": ["oxygen concentration", "pressure"],
      "sensors": ["video camera", "thermocouple"],
      "sub_experiments": [],
      "psi_url": "https://psi.nasa.gov/investigations/bass-ii",
      "sources": [
        {
          "title": "BASS-II Investigation Summary",
          "url": "https://psi.nasa.gov/...",
          "type": "psi_page"
        }
      ],
      "verification": {
        "pillar": "verified",
        "facility": "verified",
        "hardware": "verified",
        "objective": "verified",
        "fuels": "verified",
        "diluents": "verified",
        "o2_pct": "verified",
        "pressure_psi": "verified",
        "airflow": "unverified",
        "gravity_regime": "verified",
        "variables_varied": "verified",
        "sensors": "unverified"
      },
      "last_curated_at": "2026-11-14T22:30:00Z",
      "fit_iss": 0.95,
      "fit_moon": 0.50,
      "relevance_score": 75.2
    }
  ]
}
```

### Top-Level Fields

| Field | Type | Description |
|---|---|---|
| schema_version | string | Export schema version (`1.0`) |
| exported_at | ISO8601 | Export timestamp (UTC) |
| filters | object | Active filters when exported |
| weights | object | Environment weights (0.0–1.0) |
| data_notice | string | Legal/usage notice |
| records | array | Investigation records with computed scores |

### File Naming
Format: `flame-in-freefall_YYYYMMDDHHmmss.json` (UTC timestamp)

Example: `flame-in-freefall_20261115133045.json`

## Usage Examples

### Loading CSV in Python
```python
import pandas as pd

df = pd.read_csv('flame-in-freefall_20261115133045.csv')
print(f"Loaded {len(df)} investigations")

# Filter to ISS-relevant (fit >= 0.8)
iss_relevant = df[df['fit_iss'] >= 0.8]
print(f"{len(iss_relevant)} are ISS-relevant")

# Group by pillar
by_pillar = df.groupby('pillar').size()
print(by_pillar)
```

### Loading JSON in Python
```python
import json

with open('flame-in-freefall_20261115133045.json', 'r') as f:
    export = json.load(f)

print(f"Schema version: {export['schema_version']}")
print(f"Exported at: {export['exported_at']}")
print(f"Active filters: {export['filters']}")
print(f"Record count: {len(export['records'])}")

# Extract scores
scores = [(r['name'], r['relevance_score']) for r in export['records']]
scores.sort(key=lambda x: x[1] or 0, reverse=True)
for name, score in scores[:5]:
    print(f"{name}: {score}")
```

### Loading in Excel
1. Open Excel
2. Data → Get Data → From File → From Text/CSV
3. Select the exported CSV file
4. Excel auto-detects UTF-8 encoding and comma delimiter
5. Click "Load"

## Validation

The repository includes a Python validation script at `tests/export-python/check.py`:

```bash
npm run test:export
```

This script:
1. Exports test data to CSV and JSON
2. Loads both formats in Python
3. Verifies column count (CSV: 38 columns)
4. Verifies required JSON keys (6 top-level keys)
5. Checks data type consistency
6. Validates that `fit_iss`, `fit_moon`, and `relevance_score` are computed
7. Exits 0 on success, 1 on failure

## Notes

1. **Null handling:** Empty CSV cells and JSON `null` both represent missing data
2. **Floating-point precision:** Fit scores use 2 decimal places in CSV, full precision in JSON
3. **List encoding:** CSV uses `; ` (semicolon-space), JSON uses native arrays
4. **Status fields:** CSV includes `_status` suffix columns; JSON nests them under `verification`
5. **Computed fields:** `fit_iss`, `fit_moon`, and `relevance_score` are calculated at export time using current weights
6. **Filters:** JSON records active filters; CSV does not
7. **Sources:** Full source list only in JSON; CSV shows source count
8. **Browser downloads:** Files download immediately with UTC timestamp in filename

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-11-15 | Initial specification |
