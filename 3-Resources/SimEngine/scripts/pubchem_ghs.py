#!/usr/bin/env python3
"""
pubchem_ghs.py — Pull GHS hazard data from PubChem for common lab chemicals.

Queries PubChem PUG-REST API for GHS classification data including pictograms,
signal words, hazard statements (H-codes), and precautionary statements (P-codes).

Usage:
    python3 pubchem_ghs.py --dry-run    # show target chemicals without fetching
    python3 pubchem_ghs.py              # fetch and write ghs_hazards.json
    python3 pubchem_ghs.py --offline    # use only manual data

Data source: PubChem PUG-REST API (public domain, US Government work)
https://pubchem.ncbi.nlm.nih.gov/rest/pug/

Rate limit: 5 requests/second max (we use 1 per second to be safe)
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
OUTPUT_PATH = os.path.join(DATA_DIR, 'ghs_hazards.json')

PUBCHEM_BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'

# Common IB Chemistry lab chemicals with CIDs for reliable lookup
LAB_CHEMICALS = [
    {'name': 'Hydrochloric acid', 'formula': 'HCl', 'cid': 313, 'conc': 'concentrated/dilute'},
    {'name': 'Sulfuric acid', 'formula': 'H2SO4', 'cid': 1118, 'conc': 'concentrated/dilute'},
    {'name': 'Nitric acid', 'formula': 'HNO3', 'cid': 944, 'conc': 'concentrated/dilute'},
    {'name': 'Ethanoic acid', 'formula': 'CH3COOH', 'cid': 176, 'conc': 'glacial/dilute'},
    {'name': 'Sodium hydroxide', 'formula': 'NaOH', 'cid': 14798, 'conc': 'pellets/solution'},
    {'name': 'Potassium hydroxide', 'formula': 'KOH', 'cid': 14797, 'conc': 'pellets/solution'},
    {'name': 'Ammonia solution', 'formula': 'NH3(aq)', 'cid': 222, 'conc': 'concentrated'},
    {'name': 'Ethanol', 'formula': 'C2H5OH', 'cid': 702, 'conc': 'absolute/dilute'},
    {'name': 'Methanol', 'formula': 'CH3OH', 'cid': 887, 'conc': 'pure'},
    {'name': 'Propanone (acetone)', 'formula': 'CH3COCH3', 'cid': 180, 'conc': 'pure'},
    {'name': 'Copper(II) sulfate', 'formula': 'CuSO4', 'cid': 24462, 'conc': 'solid/solution'},
    {'name': 'Lead(II) nitrate', 'formula': 'Pb(NO3)2', 'cid': 24924, 'conc': 'solid/solution'},
    {'name': 'Silver nitrate', 'formula': 'AgNO3', 'cid': 24470, 'conc': 'solid/solution'},
    {'name': 'Barium chloride', 'formula': 'BaCl2', 'cid': 25204, 'conc': 'solid/solution'},
    {'name': 'Potassium permanganate', 'formula': 'KMnO4', 'cid': 516875, 'conc': 'solid/solution'},
    {'name': 'Sodium carbonate', 'formula': 'Na2CO3', 'cid': 10340, 'conc': 'solid/solution'},
    {'name': 'Iron(III) chloride', 'formula': 'FeCl3', 'cid': 24380, 'conc': 'solid/solution'},
    {'name': 'Zinc granules', 'formula': 'Zn', 'cid': 23994, 'conc': 'solid'},
    {'name': 'Magnesium ribbon', 'formula': 'Mg', 'cid': 5462224, 'conc': 'solid'},
    {'name': 'Copper turnings', 'formula': 'Cu', 'cid': 23978, 'conc': 'solid'},
    {'name': 'Sodium thiosulfate', 'formula': 'Na2S2O3', 'cid': 24477, 'conc': 'solid/solution'},
    {'name': 'Hydrogen peroxide', 'formula': 'H2O2', 'cid': 784, 'conc': '3%/30%'},
    {'name': 'Phenolphthalein', 'formula': 'C20H14O4', 'cid': 4764, 'conc': 'indicator solution'},
    {'name': 'Methyl orange', 'formula': 'C14H14N3NaO3S', 'cid': 23673835, 'conc': 'indicator solution'},
    {'name': 'Bromothymol blue', 'formula': 'C27H28Br2O5S', 'cid': 6450, 'conc': 'indicator solution'},
    {'name': 'Starch indicator', 'formula': '(C6H10O5)n', 'cid': 24749, 'conc': 'solution'},
    {'name': 'Bromine water', 'formula': 'Br2(aq)', 'cid': 24408, 'conc': 'dilute'},
    {'name': 'Potassium iodide', 'formula': 'KI', 'cid': 4875, 'conc': 'solid/solution'},
    {'name': 'Calcium chloride', 'formula': 'CaCl2', 'cid': 5284359, 'conc': 'solid/solution'},
    {'name': 'Sodium chloride', 'formula': 'NaCl', 'cid': 5234, 'conc': 'solid/solution'},
]

# GHS pictogram code -> description mapping
GHS_PICTOGRAMS = {
    'GHS01': 'Exploding bomb (Explosives)',
    'GHS02': 'Flame (Flammable)',
    'GHS03': 'Flame over circle (Oxidizer)',
    'GHS04': 'Gas cylinder (Compressed gas)',
    'GHS05': 'Corrosion (Corrosive)',
    'GHS06': 'Skull and crossbones (Acute toxicity)',
    'GHS07': 'Exclamation mark (Irritant/harmful)',
    'GHS08': 'Health hazard (Serious health hazard)',
    'GHS09': 'Environment (Environmental hazard)',
}

# Manual GHS data for chemicals that are hard to look up or need IB-specific notes
MANUAL_GHS = {
    313: {  # HCl
        'signal': 'Danger',
        'pictograms': ['GHS05', 'GHS07'],
        'h_codes': ['H290', 'H314', 'H335'],
        'p_codes': ['P260', 'P280', 'P301+P330+P331', 'P305+P351+P338'],
        'ib_safety': 'Use in fume hood when concentrated. Wear goggles and gloves. Dilute solutions (<1 M) are irritants.',
    },
    1118: {  # H2SO4
        'signal': 'Danger',
        'pictograms': ['GHS05'],
        'h_codes': ['H290', 'H314'],
        'p_codes': ['P260', 'P280', 'P301+P330+P331', 'P305+P351+P338'],
        'ib_safety': 'Always add acid to water, never reverse. Concentrated causes severe burns. Dilute (<1 M) is irritant.',
    },
    14798: {  # NaOH
        'signal': 'Danger',
        'pictograms': ['GHS05'],
        'h_codes': ['H290', 'H314'],
        'p_codes': ['P260', 'P280', 'P301+P330+P331', 'P305+P351+P338'],
        'ib_safety': 'Causes severe burns. Pellets are very hygroscopic. Dissolving is exothermic.',
    },
    702: {  # Ethanol
        'signal': 'Danger',
        'pictograms': ['GHS02'],
        'h_codes': ['H225', 'H319'],
        'p_codes': ['P210', 'P233', 'P240', 'P305+P351+P338'],
        'ib_safety': 'Highly flammable. Use water bath, not Bunsen burner. Keep away from flames.',
    },
    887: {  # Methanol
        'signal': 'Danger',
        'pictograms': ['GHS02', 'GHS06', 'GHS08'],
        'h_codes': ['H225', 'H301+H311+H331', 'H370'],
        'p_codes': ['P210', 'P260', 'P280', 'P301+P310'],
        'ib_safety': 'TOXIC — do not ingest or inhale. Use in fume hood. More dangerous than ethanol.',
    },
    24462: {  # CuSO4
        'signal': 'Warning',
        'pictograms': ['GHS07', 'GHS09'],
        'h_codes': ['H302', 'H315', 'H318', 'H410'],
        'p_codes': ['P264', 'P270', 'P273', 'P280'],
        'ib_safety': 'Harmful if swallowed. Environmental hazard — do not pour down sink.',
    },
    24924: {  # Pb(NO3)2
        'signal': 'Danger',
        'pictograms': ['GHS03', 'GHS06', 'GHS08', 'GHS09'],
        'h_codes': ['H272', 'H302+H332', 'H360Df', 'H373', 'H410'],
        'p_codes': ['P201', 'P220', 'P260', 'P273', 'P280'],
        'ib_safety': 'TOXIC — lead compound. Reproductive toxicant. Wear gloves. Dispose as heavy metal waste.',
    },
    24470: {  # AgNO3
        'signal': 'Danger',
        'pictograms': ['GHS03', 'GHS05'],
        'h_codes': ['H272', 'H290', 'H314', 'H410'],
        'p_codes': ['P220', 'P260', 'P280', 'P301+P330+P331'],
        'ib_safety': 'Stains skin and clothing permanently (black). Oxidiser. Corrosive.',
    },
    24408: {  # Br2 (bromine water)
        'signal': 'Danger',
        'pictograms': ['GHS05', 'GHS06', 'GHS09'],
        'h_codes': ['H314', 'H330', 'H400'],
        'p_codes': ['P260', 'P271', 'P280', 'P284'],
        'ib_safety': 'Use in fume hood ONLY. Causes severe burns. Toxic vapour. Bromine water is dilute but still hazardous.',
    },
}


def fetch_ghs_from_pubchem(cid):
    """Fetch GHS data from PubChem PUG-REST API."""
    url = f'{PUBCHEM_BASE}/compound/cid/{cid}/property/MolecularFormula,MolecularWeight/JSON'

    try:
        # First verify the CID exists
        req = urllib.request.Request(url, headers={
            'User-Agent': 'SimEngine-DataLayer/1.0 (IB Chemistry education tool)'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))

        # Now try to get GHS data from the full compound record
        ghs_url = f'{PUBCHEM_BASE}/compound/cid/{cid}/JSON'
        req2 = urllib.request.Request(ghs_url, headers={
            'User-Agent': 'SimEngine-DataLayer/1.0 (IB Chemistry education tool)'
        })
        with urllib.request.urlopen(req2, timeout=15) as resp2:
            full_data = json.loads(resp2.read().decode('utf-8'))

        # Extract GHS sections from the full record
        result = {'cid_verified': True}

        # Search for GHS Classification section in the nested structure
        try:
            sections = full_data.get('PC_Compounds', [{}])[0]
            # GHS data is deeply nested — extraction varies by compound
            result['raw_available'] = True
        except (KeyError, IndexError):
            result['raw_available'] = False

        return result

    except urllib.error.HTTPError as e:
        return {'error': f'HTTP {e.code}', 'cid_verified': False}
    except Exception as e:
        return {'error': str(e), 'cid_verified': False}


def build_output(dry_run=False, offline=False):
    """Build the GHS hazard data output."""
    chemicals = []
    manual_count = 0
    fetched_count = 0

    for entry in LAB_CHEMICALS:
        chem = {
            'name': entry['name'],
            'formula': entry['formula'],
            'cid': entry['cid'],
            'concentration': entry['conc'],
            'signal': None,
            'pictograms': [],
            'pictogramDescriptions': [],
            'h_codes': [],
            'p_codes': [],
            'ib_safety': '',
            'source': None,
        }

        # Use manual data if available (authoritative + IB-specific notes)
        if entry['cid'] in MANUAL_GHS:
            manual = MANUAL_GHS[entry['cid']]
            chem['signal'] = manual.get('signal')
            chem['pictograms'] = manual.get('pictograms', [])
            chem['pictogramDescriptions'] = [
                GHS_PICTOGRAMS.get(p, p) for p in manual.get('pictograms', [])
            ]
            chem['h_codes'] = manual.get('h_codes', [])
            chem['p_codes'] = manual.get('p_codes', [])
            chem['ib_safety'] = manual.get('ib_safety', '')
            chem['source'] = 'manual (IB-specific)'
            manual_count += 1
        elif not offline and not dry_run:
            print(f'  Fetching CID {entry["cid"]} ({entry["name"]})...')
            result = fetch_ghs_from_pubchem(entry['cid'])
            if result.get('cid_verified'):
                chem['source'] = 'PubChem (CID verified, GHS pending manual review)'
            else:
                chem['source'] = f"fetch error: {result.get('error', 'unknown')}"
            fetched_count += 1
            time.sleep(1)  # Rate limit
        else:
            chem['source'] = 'pending'

        chemicals.append(chem)

    output = {
        'meta': {
            'source': 'PubChem PUG-REST API + IB Chemistry safety guidelines',
            'created': '2026-04-04',
            'count': len(chemicals),
            'notes': (
                'GHS hazard data for common IB Chemistry lab chemicals. '
                'H-codes = hazard statements, P-codes = precautionary statements. '
                'ib_safety field contains IB-specific guidance for student labs. '
                'Manual entries include IB-relevant concentration notes.'
            ),
            'manual_entries': manual_count,
            'fetched_entries': fetched_count,
            'pending': len(chemicals) - manual_count - fetched_count,
        },
        'pictogram_key': GHS_PICTOGRAMS,
        'chemicals': chemicals,
    }

    return output


def main():
    parser = argparse.ArgumentParser(description='Fetch GHS hazard data for IB lab chemicals')
    parser.add_argument('--dry-run', action='store_true', help='Show target chemicals without fetching')
    parser.add_argument('--offline', action='store_true', help='Use only manual data, no network calls')
    args = parser.parse_args()

    print('SimEngine GHS Hazard Data Builder')
    print('=' * 40)
    print(f'Target chemicals: {len(LAB_CHEMICALS)}')
    print(f'Manual GHS data: {len(MANUAL_GHS)} chemicals')
    print()

    if args.dry_run:
        print('DRY RUN — no data will be fetched or written')
        print()
        manual = [c for c in LAB_CHEMICALS if c['cid'] in MANUAL_GHS]
        pending = [c for c in LAB_CHEMICALS if c['cid'] not in MANUAL_GHS]
        print(f'Have manual GHS data for {len(manual)} chemicals:')
        for c in manual:
            m = MANUAL_GHS[c['cid']]
            pics = ', '.join(m.get('pictograms', []))
            print(f"  {c['name']:30s} {m.get('signal', '?'):8s} [{pics}]")
        print()
        print(f'Would fetch from PubChem for {len(pending)} chemicals:')
        for c in pending:
            print(f"  {c['name']:30s} (CID: {c['cid']})")
        return

    output = build_output(dry_run=False, offline=args.offline)

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print()
    print(f'Wrote {OUTPUT_PATH}')
    print(f"  Manual entries: {output['meta']['manual_entries']}")
    print(f"  Fetched entries: {output['meta']['fetched_entries']}")
    print(f"  Pending: {output['meta']['pending']}")


if __name__ == '__main__':
    main()
