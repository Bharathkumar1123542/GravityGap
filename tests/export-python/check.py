#!/usr/bin/env python3
"""
Export format validator for Flame in Freefall.
Verifies CSV and JSON exports match specification.
"""
import sys
import csv
import json
from pathlib import Path
from typing import Any

def check_csv(csv_path: Path) -> tuple[bool, str]:
    """Validate CSV export format."""
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
            if len(rows) == 0:
                return False, "CSV has no data rows"
            
            # Check column count (38 expected)
            headers = reader.fieldnames
            if len(headers) != 38:
                return False, f"CSV has {len(headers)} columns, expected 38"
            
            # Check required columns exist
            required = [
                'id', 'name', 'full_name', 'pillar', 'pillar_status',
                'facility', 'facility_status', 'hardware', 'hardware_status',
                'objective', 'objective_status', 'fuels', 'fuels_status',
                'diluents', 'diluents_status', 'o2_min_pct', 'o2_max_pct',
                'o2_pct_status', 'pressure_min_psi', 'pressure_max_psi',
                'pressure_psi_status', 'airflow_min', 'airflow_max',
                'airflow_unit', 'airflow_status', 'gravity_regime',
                'gravity_regime_status', 'variables_varied',
                'variables_varied_status', 'sensors', 'sensors_status',
                'sub_experiments', 'psi_url', 'last_curated_at',
                'fit_iss', 'fit_moon', 'relevance_score', 'source_count'
            ]
            
            missing = [col for col in required if col not in headers]
            if missing:
                return False, f"CSV missing columns: {', '.join(missing)}"
            
            # Verify at least one row has a non-empty id
            if not any(row.get('id', '').strip() for row in rows):
                return False, "CSV has no valid investigation IDs"
            
            # Check that computed fields exist
            first = rows[0]
            if 'fit_iss' not in first:
                return False, "CSV missing fit_iss column"
            if 'fit_moon' not in first:
                return False, "CSV missing fit_moon column"
            if 'relevance_score' not in first:
                return False, "CSV missing relevance_score column"
            
            return True, f"CSV valid: {len(rows)} records, 38 columns"
            
    except Exception as e:
        return False, f"CSV validation error: {str(e)}"

def check_json(json_path: Path) -> tuple[bool, str]:
    """Validate JSON export format."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check top-level keys (6 expected)
        required_keys = [
            'schema_version', 'exported_at', 'filters',
            'weights', 'data_notice', 'records'
        ]
        missing = [k for k in required_keys if k not in data]
        if missing:
            return False, f"JSON missing keys: {', '.join(missing)}"
        
        # Check schema version
        if data['schema_version'] != '1.0':
            return False, f"JSON schema_version is {data['schema_version']}, expected 1.0"
        
        # Check records is an array
        if not isinstance(data['records'], list):
            return False, "JSON records is not an array"
        
        if len(data['records']) == 0:
            return False, "JSON has no records"
        
        # Check first record structure
        rec = data['records'][0]
        rec_required = [
            'id', 'name', 'pillar', 'facility', 'fuels',
            'verification', 'fit_iss', 'fit_moon', 'relevance_score'
        ]
        rec_missing = [k for k in rec_required if k not in rec]
        if rec_missing:
            return False, f"JSON record missing keys: {', '.join(rec_missing)}"
        
        # Check verification is an object
        if not isinstance(rec['verification'], dict):
            return False, "JSON record verification is not an object"
        
        # Check computed fields
        if 'fit_iss' not in rec:
            return False, "JSON record missing fit_iss"
        if 'fit_moon' not in rec:
            return False, "JSON record missing fit_moon"
        if 'relevance_score' not in rec:
            return False, "JSON record missing relevance_score"
        
        return True, f"JSON valid: {len(data['records'])} records, schema 1.0"
        
    except json.JSONDecodeError as e:
        return False, f"JSON parse error: {str(e)}"
    except Exception as e:
        return False, f"JSON validation error: {str(e)}"

def main():
    """Run export validation."""
    if len(sys.argv) < 3:
        print("Usage: check.py <csv_path> <json_path>", file=sys.stderr)
        sys.exit(1)
    
    csv_path = Path(sys.argv[1])
    json_path = Path(sys.argv[2])
    
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    
    if not json_path.exists():
        print(f"Error: JSON file not found: {json_path}", file=sys.stderr)
        sys.exit(1)
    
    print("Validating export formats...")
    print()
    
    # Check CSV
    csv_ok, csv_msg = check_csv(csv_path)
    print(f"CSV: {'✓' if csv_ok else '✗'} {csv_msg}")
    
    # Check JSON
    json_ok, json_msg = check_json(json_path)
    print(f"JSON: {'✓' if json_ok else '✗'} {json_msg}")
    
    print()
    if csv_ok and json_ok:
        print("Export validation passed")
        sys.exit(0)
    else:
        print("Export validation failed", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
