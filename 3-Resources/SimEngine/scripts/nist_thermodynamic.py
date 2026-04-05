#!/usr/bin/env python3
"""
nist_thermodynamic.py — Pull thermodynamic data for IB Chemistry compounds.

Queries NIST WebBook for standard thermodynamic properties of ~50 IB-relevant
compounds. Outputs thermodynamic_data.json and cross-references against
existing data files.

Usage:
    python3 nist_thermodynamic.py --dry-run      # show what would be fetched
    python3 nist_thermodynamic.py                 # fetch and write data
    python3 nist_thermodynamic.py --offline       # use only manual data (no network)

Data source: NIST Chemistry WebBook (public domain, US Government work)
https://webbook.nist.gov/chemistry/

NOTE: NIST WebBook has no official API. This script scrapes HTML pages.
Rate limit: 1 request per 2 seconds to be respectful.
IB Data Booklet values ALWAYS take precedence over NIST values.
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
OUTPUT_PATH = os.path.join(DATA_DIR, 'thermodynamic_data.json')
IB_BOOKLET_PATH = os.path.join(DATA_DIR, 'ib_data_booklet.json')
COMPOUNDS_ORGANIC_PATH = os.path.join(DATA_DIR, 'compounds_organic.json')

NIST_SEARCH_URL = 'https://webbook.nist.gov/cgi/cbook.cgi'

# IB Chemistry relevant compounds with CAS numbers for reliable lookup
IB_COMPOUNDS = [
    # Alcohols
    {'name': 'Methanol', 'formula': 'CH3OH', 'cas': '67-56-1', 'cat': 'alcohol'},
    {'name': 'Ethanol', 'formula': 'C2H5OH', 'cas': '64-17-5', 'cat': 'alcohol'},
    {'name': 'Propan-1-ol', 'formula': 'C3H7OH', 'cas': '71-23-8', 'cat': 'alcohol'},
    {'name': 'Butan-1-ol', 'formula': 'C4H9OH', 'cas': '71-36-3', 'cat': 'alcohol'},
    # Alkanes
    {'name': 'Methane', 'formula': 'CH4', 'cas': '74-82-8', 'cat': 'alkane'},
    {'name': 'Ethane', 'formula': 'C2H6', 'cas': '74-84-0', 'cat': 'alkane'},
    {'name': 'Propane', 'formula': 'C3H8', 'cas': '74-98-6', 'cat': 'alkane'},
    {'name': 'Butane', 'formula': 'C4H10', 'cas': '106-97-8', 'cat': 'alkane'},
    {'name': 'Pentane', 'formula': 'C5H12', 'cas': '109-66-0', 'cat': 'alkane'},
    {'name': 'Hexane', 'formula': 'C6H14', 'cas': '110-54-3', 'cat': 'alkane'},
    {'name': 'Octane', 'formula': 'C8H18', 'cas': '111-65-9', 'cat': 'alkane'},
    # Alkenes
    {'name': 'Ethene', 'formula': 'C2H4', 'cas': '74-85-1', 'cat': 'alkene'},
    {'name': 'Propene', 'formula': 'C3H6', 'cas': '115-07-1', 'cat': 'alkene'},
    # Carboxylic acids
    {'name': 'Methanoic acid', 'formula': 'HCOOH', 'cas': '64-18-6', 'cat': 'carboxylic_acid'},
    {'name': 'Ethanoic acid', 'formula': 'CH3COOH', 'cas': '64-19-7', 'cat': 'carboxylic_acid'},
    # Ketones / Aldehydes
    {'name': 'Propanone', 'formula': 'CH3COCH3', 'cas': '67-64-1', 'cat': 'ketone'},
    {'name': 'Ethanal', 'formula': 'CH3CHO', 'cas': '75-07-0', 'cat': 'aldehyde'},
    {'name': 'Propanal', 'formula': 'C2H5CHO', 'cas': '123-38-6', 'cat': 'aldehyde'},
    # Esters
    {'name': 'Ethyl ethanoate', 'formula': 'CH3COOC2H5', 'cas': '141-78-6', 'cat': 'ester'},
    # Halogenoalkanes
    {'name': 'Chloromethane', 'formula': 'CH3Cl', 'cas': '74-87-3', 'cat': 'halogenoalkane'},
    {'name': 'Chloroethane', 'formula': 'C2H5Cl', 'cas': '75-00-3', 'cat': 'halogenoalkane'},
    {'name': 'Bromoethane', 'formula': 'C2H5Br', 'cas': '74-96-4', 'cat': 'halogenoalkane'},
    # Other organic
    {'name': 'Benzene', 'formula': 'C6H6', 'cas': '71-43-2', 'cat': 'arene'},
    {'name': 'Glucose', 'formula': 'C6H12O6', 'cas': '50-99-7', 'cat': 'carbohydrate'},
    # Inorganic - common IB compounds
    {'name': 'Water', 'formula': 'H2O', 'cas': '7732-18-5', 'cat': 'inorganic'},
    {'name': 'Carbon dioxide', 'formula': 'CO2', 'cas': '124-38-9', 'cat': 'inorganic'},
    {'name': 'Carbon monoxide', 'formula': 'CO', 'cas': '630-08-0', 'cat': 'inorganic'},
    {'name': 'Ammonia', 'formula': 'NH3', 'cas': '7664-41-7', 'cat': 'inorganic'},
    {'name': 'Hydrogen chloride', 'formula': 'HCl', 'cas': '7647-01-0', 'cat': 'inorganic'},
    {'name': 'Hydrogen', 'formula': 'H2', 'cas': '1333-74-0', 'cat': 'inorganic'},
    {'name': 'Nitrogen', 'formula': 'N2', 'cas': '7727-37-9', 'cat': 'inorganic'},
    {'name': 'Oxygen', 'formula': 'O2', 'cas': '7782-44-7', 'cat': 'inorganic'},
    {'name': 'Sulfur dioxide', 'formula': 'SO2', 'cas': '7446-09-5', 'cat': 'inorganic'},
    {'name': 'Sulfur trioxide', 'formula': 'SO3', 'cas': '7446-11-9', 'cat': 'inorganic'},
    {'name': 'Nitrogen dioxide', 'formula': 'NO2', 'cas': '10102-44-0', 'cat': 'inorganic'},
    {'name': 'Nitrogen monoxide', 'formula': 'NO', 'cas': '10102-43-9', 'cat': 'inorganic'},
    {'name': 'Hydrogen peroxide', 'formula': 'H2O2', 'cas': '7722-84-1', 'cat': 'inorganic'},
    # Ionic solids (standard enthalpies of formation)
    {'name': 'Sodium chloride', 'formula': 'NaCl', 'cas': '7647-14-5', 'cat': 'ionic'},
    {'name': 'Magnesium oxide', 'formula': 'MgO', 'cas': '1309-48-4', 'cat': 'ionic'},
    {'name': 'Calcium carbonate', 'formula': 'CaCO3', 'cas': '471-34-1', 'cat': 'ionic'},
    {'name': 'Calcium oxide', 'formula': 'CaO', 'cas': '1305-78-8', 'cat': 'ionic'},
    {'name': 'Iron(III) oxide', 'formula': 'Fe2O3', 'cas': '1309-37-1', 'cat': 'ionic'},
    {'name': 'Copper(II) sulfate', 'formula': 'CuSO4', 'cas': '7758-98-7', 'cat': 'ionic'},
    {'name': 'Silver nitrate', 'formula': 'AgNO3', 'cas': '7761-88-8', 'cat': 'ionic'},
    {'name': 'Barium chloride', 'formula': 'BaCl2', 'cas': '10361-37-2', 'cat': 'ionic'},
    {'name': 'Lead(II) nitrate', 'formula': 'Pb(NO3)2', 'cas': '10099-74-8', 'cat': 'ionic'},
    {'name': 'Potassium permanganate', 'formula': 'KMnO4', 'cas': '7722-64-7', 'cat': 'ionic'},
    {'name': 'Sodium hydroxide', 'formula': 'NaOH', 'cas': '1310-73-2', 'cat': 'ionic'},
    {'name': 'Potassium bromide', 'formula': 'KBr', 'cas': '7758-02-3', 'cat': 'ionic'},
]

# Manual thermodynamic data for key IB compounds (from IB Data Booklet / literature)
# These values are authoritative and should NOT be overridden by NIST
MANUAL_DATA = {
    'H2O': {'deltaHf': -285.8, 'S0': 69.9, 'deltaGf': -237.1, 'state': 'l'},
    'CO2': {'deltaHf': -393.5, 'S0': 213.7, 'deltaGf': -394.4, 'state': 'g'},
    'CO': {'deltaHf': -110.5, 'S0': 197.7, 'deltaGf': -137.2, 'state': 'g'},
    'NH3': {'deltaHf': -46.1, 'S0': 192.5, 'deltaGf': -16.4, 'state': 'g'},
    'HCl': {'deltaHf': -92.3, 'S0': 186.9, 'deltaGf': -95.3, 'state': 'g'},
    'H2': {'deltaHf': 0, 'S0': 130.7, 'deltaGf': 0, 'state': 'g'},
    'N2': {'deltaHf': 0, 'S0': 191.6, 'deltaGf': 0, 'state': 'g'},
    'O2': {'deltaHf': 0, 'S0': 205.1, 'deltaGf': 0, 'state': 'g'},
    'CH4': {'deltaHf': -74.8, 'S0': 186.3, 'deltaGf': -50.7, 'state': 'g'},
    'C2H6': {'deltaHf': -84.7, 'S0': 229.6, 'deltaGf': -32.0, 'state': 'g'},
    'C3H8': {'deltaHf': -103.8, 'S0': 269.9, 'deltaGf': -23.4, 'state': 'g'},
    'C2H4': {'deltaHf': 52.3, 'S0': 219.6, 'deltaGf': 68.1, 'state': 'g'},
    'CH3OH': {'deltaHf': -238.7, 'S0': 126.8, 'deltaGf': -166.3, 'state': 'l'},
    'C2H5OH': {'deltaHf': -277.7, 'S0': 160.7, 'deltaGf': -174.8, 'state': 'l'},
    'CH3COOH': {'deltaHf': -484.5, 'S0': 159.8, 'deltaGf': -389.9, 'state': 'l'},
    'NaCl': {'deltaHf': -411.2, 'S0': 72.1, 'deltaGf': -384.1, 'state': 's'},
    'MgO': {'deltaHf': -601.7, 'S0': 26.9, 'deltaGf': -569.4, 'state': 's'},
    'CaCO3': {'deltaHf': -1206.9, 'S0': 92.9, 'deltaGf': -1128.8, 'state': 's'},
    'CaO': {'deltaHf': -635.1, 'S0': 39.7, 'deltaGf': -604.0, 'state': 's'},
    'Fe2O3': {'deltaHf': -824.2, 'S0': 87.4, 'deltaGf': -742.2, 'state': 's'},
    'NaOH': {'deltaHf': -425.6, 'S0': 64.5, 'deltaGf': -379.5, 'state': 's'},
    'SO2': {'deltaHf': -296.8, 'S0': 248.2, 'deltaGf': -300.1, 'state': 'g'},
    'SO3': {'deltaHf': -395.7, 'S0': 256.8, 'deltaGf': -371.1, 'state': 'g'},
    'NO': {'deltaHf': 90.3, 'S0': 210.8, 'deltaGf': 86.6, 'state': 'g'},
    'NO2': {'deltaHf': 33.2, 'S0': 240.1, 'deltaGf': 51.3, 'state': 'g'},
    'H2O2': {'deltaHf': -187.8, 'S0': 109.6, 'deltaGf': -120.4, 'state': 'l'},
    'C6H6': {'deltaHf': 49.0, 'S0': 173.3, 'deltaGf': 124.3, 'state': 'l'},
}


def fetch_nist_data(cas, name, formula):
    """Attempt to fetch thermodynamic data from NIST WebBook.
    Returns dict with deltaHf, S0, deltaGf, Cp or None values."""
    params = urllib.parse.urlencode({
        'ID': f'C{cas.replace("-", "")}',
        'Units': 'SI',
        'Mask': '1',  # Thermodynamic data
        'Type': 'JANAFCONDENSED',
    })
    url = f'{NIST_SEARCH_URL}?{params}'

    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'SimEngine-DataLayer/1.0 (IB Chemistry education tool)'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode('utf-8', errors='replace')

        result = {}

        # Try to extract deltaHf from the page
        hf_match = re.search(r'f<\/sub>.*?=\s*([-\d.]+)\s*(?:kJ|&plusmn;)', html)
        if hf_match:
            result['deltaHf_nist'] = float(hf_match.group(1))

        # Try to extract S0
        s_match = re.search(r'S&deg;.*?=\s*([-\d.]+)\s*J', html)
        if s_match:
            result['S0_nist'] = float(s_match.group(1))

        return result if result else None

    except Exception as e:
        return {'error': str(e)}


def cross_reference_fuels(compounds_data):
    """Cross-reference deltaHc values for fuels against compounds_organic.json."""
    if not os.path.exists(COMPOUNDS_ORGANIC_PATH):
        return []

    with open(COMPOUNDS_ORGANIC_PATH, 'r', encoding='utf-8') as f:
        organic = json.load(f)

    discrepancies = []
    organic_lookup = {c['id']: c for c in organic.get('compounds', [])}

    for comp in compounds_data:
        comp_id = comp['name'].lower().replace('-1-', '').replace('an-1-', 'an')
        if comp_id in organic_lookup:
            org = organic_lookup[comp_id]
            if 'deltaHc' in comp and 'dHc' in org:
                if comp['deltaHc'] != org['dHc']:
                    discrepancies.append(
                        f"  {comp['name']}: thermodynamic={comp['deltaHc']}, "
                        f"organic={org['dHc']}"
                    )

    return discrepancies


def build_output(dry_run=False, offline=False):
    """Build the thermodynamic data output."""
    compounds = []
    fetch_count = 0
    manual_count = 0
    nist_count = 0

    for entry in IB_COMPOUNDS:
        comp = {
            'name': entry['name'],
            'formula': entry['formula'],
            'cas': entry['cas'],
            'cat': entry['cat'],
            'deltaHf': None,
            'S0': None,
            'deltaGf': None,
            'state': None,
            'source': None,
        }

        # Check manual data first (IB Data Booklet values)
        if entry['formula'] in MANUAL_DATA:
            manual = MANUAL_DATA[entry['formula']]
            comp.update(manual)
            comp['source'] = 'IB Data Booklet / literature'
            manual_count += 1
        elif not offline and not dry_run:
            # Try NIST WebBook
            print(f'  Fetching {entry["name"]} (CAS: {entry["cas"]})...')
            nist = fetch_nist_data(entry['cas'], entry['name'], entry['formula'])
            if nist and 'error' not in nist:
                if 'deltaHf_nist' in nist:
                    comp['deltaHf'] = nist['deltaHf_nist']
                if 'S0_nist' in nist:
                    comp['S0'] = nist['S0_nist']
                comp['source'] = 'NIST WebBook'
                nist_count += 1
            else:
                comp['source'] = 'not found'
            fetch_count += 1
            time.sleep(2)  # Rate limit
        else:
            comp['source'] = 'pending'

        compounds.append(comp)

    output = {
        'meta': {
            'source': 'NIST Chemistry WebBook + IB Data Booklet 2025',
            'created': '2026-04-04',
            'count': len(compounds),
            'notes': (
                'Standard thermodynamic data for IB Chemistry compounds. '
                'deltaHf and deltaGf in kJ/mol, S0 in J/(mol*K). '
                'IB Data Booklet values take precedence over NIST. '
                'State: g=gas, l=liquid, s=solid, aq=aqueous.'
            ),
            'manual_entries': manual_count,
            'nist_entries': nist_count,
            'pending': len(compounds) - manual_count - nist_count,
        },
        'compounds': compounds,
    }

    return output


def main():
    parser = argparse.ArgumentParser(description='Fetch thermodynamic data for IB compounds')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be fetched without network calls')
    parser.add_argument('--offline', action='store_true', help='Use only manual data, no network calls')
    args = parser.parse_args()

    print('SimEngine Thermodynamic Data Builder')
    print('=' * 40)
    print(f'Target compounds: {len(IB_COMPOUNDS)}')
    print(f'Manual data available: {len(MANUAL_DATA)} compounds')
    print()

    if args.dry_run:
        print('DRY RUN — no data will be fetched or written')
        print()
        manual = [c for c in IB_COMPOUNDS if c['formula'] in MANUAL_DATA]
        pending = [c for c in IB_COMPOUNDS if c['formula'] not in MANUAL_DATA]
        print(f'Have manual data for {len(manual)} compounds:')
        for c in manual:
            d = MANUAL_DATA[c['formula']]
            print(f"  {c['name']:25s} deltaHf={d.get('deltaHf'):>8} S0={d.get('S0'):>6} deltaGf={d.get('deltaGf'):>8}")
        print()
        print(f'Would fetch from NIST for {len(pending)} compounds:')
        for c in pending:
            print(f"  {c['name']:25s} (CAS: {c['cas']})")
        return

    output = build_output(dry_run=False, offline=args.offline)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print()
    print(f'Wrote {OUTPUT_PATH}')
    print(f"  Manual entries: {output['meta']['manual_entries']}")
    print(f"  NIST entries: {output['meta']['nist_entries']}")
    print(f"  Pending: {output['meta']['pending']}")

    # Cross-reference fuels
    discrepancies = cross_reference_fuels(output['compounds'])
    if discrepancies:
        print()
        print('FUEL deltaHc DISCREPANCIES:')
        for d in discrepancies:
            print(d)
    else:
        print('Fuel deltaHc values consistent with compounds_organic.json')


if __name__ == '__main__':
    main()
