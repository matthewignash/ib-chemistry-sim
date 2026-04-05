#!/usr/bin/env python3
"""
pubchem_elements.py — Augment elements.json with PubChem Periodic Table data.

Downloads the PubChem periodic table CSV and compares against the existing
elements.json. Reports gaps and optionally writes augmented data.

Usage:
    python3 pubchem_elements.py                  # dry-run: show diff report
    python3 pubchem_elements.py --write          # write augmented elements.json
    python3 pubchem_elements.py --cache pubchem_pt.csv  # use cached CSV file

Data source: PubChem Periodic Table (public domain, US Government work)
https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV
"""

import argparse
import csv
import io
import json
import os
import sys
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
ELEMENTS_PATH = os.path.join(DATA_DIR, 'elements.json')
PUBCHEM_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/CSV'
IB_BOOKLET_PATH = os.path.join(DATA_DIR, 'ib_data_booklet.json')

# Fields already in elements.json
EXISTING_FIELDS = {
    'z', 'sym', 'name', 'mass', 'group', 'period', 'block', 'cat',
    'en', 'radius', 'ie1', 'ea', 'mp', 'bp', 'density',
    'ionicRadius', 'metalChar', 'config', 'configShort', 'oxStates'
}

# PubChem CSV column -> our field name mapping (for potential new fields)
PUBCHEM_MAP = {
    'AtomicNumber': 'z',
    'Symbol': 'sym',
    'Name': 'name',
    'AtomicMass': 'mass',
    'ElectronConfiguration': 'config',
    'Electronegativity': 'en',
    'AtomicRadius': 'radius',
    'IonizationEnergy': 'ie1',
    'ElectronAffinity': 'ea',
    'MeltingPoint': 'mp',
    'BoilingPoint': 'bp',
    'Density': 'density',
    'YearDiscovered': 'yearDiscovered',
    'StandardState': 'standardState',
    'GroupBlock': 'groupBlock',
    'CPKHexColor': 'cpkColor',
    'VanDerWaalsRadius': 'vdwRadius',
    'CovalentRadius': 'covalentRadius',
    'OxidationStates': 'oxStates',
}

# Fields we might want to add (not already in elements.json)
NEW_CANDIDATE_FIELDS = {
    'yearDiscovered', 'standardState', 'cpkColor',
    'vdwRadius', 'covalentRadius'
}


def download_pubchem_csv(cache_path=None):
    """Download PubChem periodic table CSV or load from cache."""
    if cache_path and os.path.exists(cache_path):
        print(f'Loading cached CSV from {cache_path}')
        with open(cache_path, 'r', encoding='utf-8') as f:
            return f.read()

    print(f'Downloading PubChem periodic table from {PUBCHEM_URL}...')
    try:
        req = urllib.request.Request(PUBCHEM_URL, headers={
            'User-Agent': 'SimEngine-DataLayer/1.0 (IB Chemistry education tool)'
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read().decode('utf-8')
    except Exception as e:
        print(f'ERROR: Failed to download PubChem data: {e}')
        print('Use --cache <file> to load from a local CSV file instead.')
        sys.exit(1)

    if cache_path:
        with open(cache_path, 'w', encoding='utf-8') as f:
            f.write(data)
        print(f'Cached CSV to {cache_path}')

    return data


def parse_pubchem_csv(csv_text):
    """Parse PubChem CSV into list of dicts keyed by atomic number."""
    reader = csv.DictReader(io.StringIO(csv_text))
    elements = {}
    for row in reader:
        z = int(row.get('AtomicNumber', 0))
        if z == 0:
            continue
        parsed = {}
        for csv_col, our_field in PUBCHEM_MAP.items():
            val = row.get(csv_col, '').strip()
            if val:
                parsed[our_field] = val
        elements[z] = parsed
    return elements


def load_elements_json():
    """Load existing elements.json."""
    with open(ELEMENTS_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_ib_booklet():
    """Load IB data booklet for cross-reference."""
    if not os.path.exists(IB_BOOKLET_PATH):
        return None
    with open(IB_BOOKLET_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def compare_values(our_val, pubchem_val, field):
    """Compare a value from our data vs PubChem. Returns (match, detail)."""
    if our_val is None or pubchem_val is None:
        return True, 'skip (null)'

    try:
        our_num = float(our_val)
        pub_num = float(pubchem_val)
        # Allow 1% tolerance for floating point
        if our_num == 0 and pub_num == 0:
            return True, 'both zero'
        if our_num != 0:
            pct_diff = abs(our_num - pub_num) / abs(our_num) * 100
            if pct_diff < 1.0:
                return True, f'match (diff {pct_diff:.3f}%)'
            else:
                return False, f'MISMATCH: ours={our_val}, pubchem={pubchem_val} (diff {pct_diff:.1f}%)'
    except (ValueError, TypeError):
        # String comparison
        if str(our_val).strip() == str(pubchem_val).strip():
            return True, 'exact match'
        return False, f'MISMATCH: ours="{our_val}", pubchem="{pubchem_val}"'

    return True, 'ok'


def generate_report(our_data, pubchem_data, ib_booklet):
    """Generate comparison report."""
    elements = our_data.get('elements', [])
    report_lines = []
    mismatches = []
    gaps = []
    new_fields_available = {}

    report_lines.append('=' * 60)
    report_lines.append('PubChem vs elements.json Comparison Report')
    report_lines.append('=' * 60)
    report_lines.append(f'Our elements: {len(elements)}')
    report_lines.append(f'PubChem elements: {len(pubchem_data)}')
    report_lines.append('')

    for elem in elements:
        z = elem.get('z')
        pub = pubchem_data.get(z)
        if not pub:
            gaps.append(f'  Z={z} ({elem.get("sym")}) — not in PubChem CSV')
            continue

        # Check existing fields for value mismatches
        for field in ['mass', 'en', 'ie1', 'ea', 'mp', 'bp', 'density']:
            our_val = elem.get(field)
            pub_field = field
            pub_val = pub.get(pub_field)
            if pub_val is not None and our_val is not None:
                match, detail = compare_values(our_val, pub_val, field)
                if not match:
                    mismatches.append(f'  Z={z} {elem.get("sym")}: {field} — {detail}')

        # Check for new fields we could add
        for new_field in NEW_CANDIDATE_FIELDS:
            if new_field not in elem and new_field in pub:
                if new_field not in new_fields_available:
                    new_fields_available[new_field] = 0
                new_fields_available[new_field] += 1

    # Report sections
    if mismatches:
        report_lines.append(f'VALUE MISMATCHES ({len(mismatches)}):')
        report_lines.extend(mismatches)
        report_lines.append('')
        report_lines.append('NOTE: IB Data Booklet values take precedence over PubChem.')
        report_lines.append('Check mismatches against ib_data_booklet.json before updating.')
    else:
        report_lines.append('No value mismatches found.')

    report_lines.append('')

    if gaps:
        report_lines.append(f'GAPS ({len(gaps)}):')
        report_lines.extend(gaps)
    else:
        report_lines.append('No gaps — all elements found in PubChem.')

    report_lines.append('')

    if new_fields_available:
        report_lines.append('NEW FIELDS AVAILABLE FROM PUBCHEM:')
        for field, count in sorted(new_fields_available.items()):
            report_lines.append(f'  {field}: available for {count}/{len(elements)} elements')
    else:
        report_lines.append('No new fields available from PubChem.')

    report_lines.append('')
    report_lines.append('=' * 60)

    return '\n'.join(report_lines), mismatches, new_fields_available


def augment_elements(our_data, pubchem_data):
    """Add new fields from PubChem to elements.json data."""
    elements = our_data.get('elements', [])
    added = 0

    for elem in elements:
        z = elem.get('z')
        pub = pubchem_data.get(z)
        if not pub:
            continue

        for new_field in NEW_CANDIDATE_FIELDS:
            if new_field not in elem and new_field in pub:
                elem[new_field] = pub[new_field]
                added += 1

    our_data['meta']['updated'] = '2026-04-04'
    our_data['meta']['notes'] += ' Augmented with PubChem Periodic Table data.'
    return added


def main():
    parser = argparse.ArgumentParser(description='Augment elements.json with PubChem data')
    parser.add_argument('--write', action='store_true', help='Write augmented data (default: dry-run)')
    parser.add_argument('--cache', type=str, default=None, help='Path to cached PubChem CSV')
    args = parser.parse_args()

    # Load our data
    print(f'Loading elements.json from {ELEMENTS_PATH}')
    our_data = load_elements_json()
    ib_booklet = load_ib_booklet()

    # Download/load PubChem data
    csv_text = download_pubchem_csv(args.cache)
    pubchem_data = parse_pubchem_csv(csv_text)

    # Generate report
    report, mismatches, new_fields = generate_report(our_data, pubchem_data, ib_booklet)
    print(report)

    if args.write and new_fields:
        added = augment_elements(our_data, pubchem_data)
        with open(ELEMENTS_PATH, 'w', encoding='utf-8') as f:
            json.dump(our_data, f, indent=2, ensure_ascii=False)
        print(f'Wrote augmented elements.json ({added} new field values added)')
    elif args.write:
        print('No new fields to add. File unchanged.')
    else:
        print('Dry run complete. Use --write to apply changes.')


if __name__ == '__main__':
    main()
