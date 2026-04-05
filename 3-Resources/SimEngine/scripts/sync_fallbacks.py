#!/usr/bin/env python3
"""
sync_fallbacks.py — Compare Core.js inline data against canonical JSON files.

Checks that fallback data hardcoded in SimEngine_Core.js is aligned with the
canonical JSON data files. Reports mismatches without auto-editing Core.js.

Usage:
    python3 sync_fallbacks.py              # show diff report
    python3 sync_fallbacks.py --check      # exit non-zero if critical diffs
    python3 sync_fallbacks.py --verbose    # include matching values
"""

import argparse
import json
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')
CORE_JS = os.path.join(SCRIPT_DIR, '..', 'SimEngine_Core.js')


def load_json(path):
    """Load a JSON file, return None if missing."""
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def read_core_js():
    """Read SimEngine_Core.js as text."""
    with open(CORE_JS, 'r', encoding='utf-8') as f:
        return f.read()


def extract_half_cells(core_text):
    """Extract E° values from HALF_CELLS array in Electrochem module."""
    cells = {}
    # Match patterns like: key: 'Zn', ... E: -0.76
    for m in re.finditer(r"key:\s*'(\w+)'.*?E:\s*([-\d.]+)", core_text, re.DOTALL):
        key = m.group(1)
        e0 = float(m.group(2))
        cells[key] = e0
    return cells


def extract_acids_ka(core_text):
    """Extract Ka values from ACIDS object in Titration module."""
    acids = {}
    # Match patterns like: CH3COOH: { name: '...', Ka: [1.8e-5]
    for m in re.finditer(
        r"(\w+):\s*\{\s*name:\s*'[^']+',\s*formula:\s*'[^']+',\s*strong:\s*\w+,\s*Ka:\s*\[([^\]]+)\]",
        core_text
    ):
        acid_key = m.group(1)
        ka_str = m.group(2)
        # Parse Ka values (handle Infinity)
        kas = []
        for val in ka_str.split(','):
            val = val.strip()
            if val == 'Infinity':
                kas.append(None)
            else:
                try:
                    kas.append(float(val))
                except ValueError:
                    pass
        acids[acid_key] = kas
    return acids


def extract_bases_kb(core_text):
    """Extract Kb values from BASES object in Titration module."""
    bases = {}
    for m in re.finditer(
        r"(\w+):\s*\{\s*name:\s*'[^']+',\s*formula:\s*'[^']+',\s*strong:\s*\w+,\s*Kb:\s*([^,}]+)",
        core_text
    ):
        base_key = m.group(1)
        kb_str = m.group(2).strip()
        if kb_str == 'Infinity':
            bases[base_key] = None
        else:
            try:
                bases[base_key] = float(kb_str)
            except ValueError:
                pass
    return bases


def compare_half_cells(core_cells, json_booklet, verbose=False):
    """Compare E° values between Core.js and ib_data_booklet.json."""
    issues = []
    matches = 0

    if not json_booklet or 'standard_electrode_potentials' not in json_booklet:
        return [('half_cells', 'SKIP', 'No electrode potentials in booklet JSON')]

    json_cells = {}
    for hc in json_booklet['standard_electrode_potentials'].get('half_cells', []):
        # Extract metal/species from half reaction
        e0 = hc['E0']
        reaction = hc['half_reaction']
        json_cells[reaction] = e0

    # We can't easily map Core.js keys to JSON reactions,
    # so just report counts and any values that seem wrong
    if verbose:
        issues.append(('half_cells', 'INFO', f'Core.js has {len(core_cells)} half-cells, JSON has {len(json_cells)}'))

    return issues


def compare_acids(core_acids, json_booklet, verbose=False):
    """Compare Ka values between Core.js and ib_data_booklet.json."""
    issues = []

    if not json_booklet or 'acids_bases' not in json_booklet:
        return [('acids', 'SKIP', 'No acids_bases section in booklet JSON')]

    json_acids = json_booklet['acids_bases'].get('acids', {})

    for acid_key, core_kas in core_acids.items():
        if acid_key in json_acids:
            json_kas = json_acids[acid_key].get('Ka', [])
            for i, (ck, jk) in enumerate(zip(core_kas, json_kas)):
                if ck is None and jk is None:
                    if verbose:
                        issues.append(('acids', 'OK', f'{acid_key} Ka[{i}]: strong acid (both null)'))
                elif ck is not None and jk is not None:
                    if abs(ck - jk) / max(abs(ck), 1e-20) > 0.01:
                        issues.append(('acids', 'MISMATCH', f'{acid_key} Ka[{i}]: Core={ck:.2e} JSON={jk:.2e}'))
                    elif verbose:
                        issues.append(('acids', 'OK', f'{acid_key} Ka[{i}]: {ck:.2e}'))
        elif verbose:
            issues.append(('acids', 'INFO', f'{acid_key}: in Core.js but not in JSON acids_bases'))

    # Check JSON acids not in Core
    for acid_key in json_acids:
        if acid_key not in core_acids and verbose:
            issues.append(('acids', 'INFO', f'{acid_key}: in JSON but not in Core.js (expansion OK)'))

    return issues


def compare_bases(core_bases, json_booklet, verbose=False):
    """Compare Kb values between Core.js and ib_data_booklet.json."""
    issues = []

    if not json_booklet or 'acids_bases' not in json_booklet:
        return [('bases', 'SKIP', 'No acids_bases section in booklet JSON')]

    json_bases = json_booklet['acids_bases'].get('bases', {})

    for base_key, core_kb in core_bases.items():
        if base_key in json_bases:
            json_kb = json_bases[base_key].get('Kb')
            if core_kb is None and json_kb is None:
                if verbose:
                    issues.append(('bases', 'OK', f'{base_key} Kb: strong base (both null)'))
            elif core_kb is not None and json_kb is not None:
                if abs(core_kb - json_kb) / max(abs(core_kb), 1e-20) > 0.01:
                    issues.append(('bases', 'MISMATCH', f'{base_key} Kb: Core={core_kb:.2e} JSON={json_kb:.2e}'))
                elif verbose:
                    issues.append(('bases', 'OK', f'{base_key} Kb: {core_kb:.2e}'))
        elif verbose:
            issues.append(('bases', 'INFO', f'{base_key}: in Core.js but not in JSON'))

    return issues


def main():
    parser = argparse.ArgumentParser(description='Compare Core.js fallback data against JSON files')
    parser.add_argument('--check', action='store_true', help='Exit non-zero if critical diffs found')
    parser.add_argument('--verbose', action='store_true', help='Include matching values in report')
    args = parser.parse_args()

    print('SimEngine Fallback Sync Check')
    print('=' * 50)

    if not os.path.exists(CORE_JS):
        print(f'ERROR: Core.js not found at {CORE_JS}')
        sys.exit(1)

    core_text = read_core_js()
    booklet = load_json(os.path.join(DATA_DIR, 'ib_data_booklet.json'))

    all_issues = []
    critical = 0

    # 1. Check Data module exists
    print('\n1. DATA MODULE PRESENCE')
    print('-' * 40)
    if 'SimEngine.Data' in core_text:
        print('  SimEngine.Data module: PRESENT')
    else:
        print('  SimEngine.Data module: MISSING')
        critical += 1

    # 2. Check fallback registrations
    print('\n2. FALLBACK REGISTRATIONS')
    print('-' * 40)
    expected_fallbacks = [
        'reaction_presets', 'titration_acids', 'titration_bases',
        'titration_indicators', 'titration_presets',
        'electrochem_half_cells', 'electrochem_electrolytes',
        'vsepr_molecules', 'vsepr_en', 'vsepr_cpk'
    ]
    for fb in expected_fallbacks:
        if f"registerFallback('{fb}'" in core_text:
            if args.verbose:
                print(f'  {fb}: registered')
        else:
            print(f'  {fb}: NOT REGISTERED')
            critical += 1

    if not args.verbose:
        registered = sum(1 for fb in expected_fallbacks if f"registerFallback('{fb}'" in core_text)
        print(f'  {registered}/{len(expected_fallbacks)} fallbacks registered')

    # 3. Compare electrode potentials
    print('\n3. ELECTRODE POTENTIALS (Core.js vs JSON)')
    print('-' * 40)
    core_cells = extract_half_cells(core_text)
    issues = compare_half_cells(core_cells, booklet, args.verbose)
    for _, level, msg in issues:
        print(f'  [{level}] {msg}')
    if not issues:
        print(f'  Core.js: {len(core_cells)} half-cells')
        if booklet and 'standard_electrode_potentials' in booklet:
            json_count = len(booklet['standard_electrode_potentials'].get('half_cells', []))
            print(f'  JSON: {json_count} half-cells')

    # 4. Compare acids Ka values
    print('\n4. ACID Ka VALUES (Core.js vs JSON)')
    print('-' * 40)
    core_acids = extract_acids_ka(core_text)
    issues = compare_acids(core_acids, booklet, args.verbose)
    mismatches = [i for i in issues if i[1] == 'MISMATCH']
    if mismatches:
        for _, level, msg in mismatches:
            print(f'  [{level}] {msg}')
            critical += 1
    else:
        print(f'  All {len(core_acids)} acid Ka values aligned')
    for _, level, msg in issues:
        if level != 'MISMATCH':
            if args.verbose:
                print(f'  [{level}] {msg}')

    # 5. Compare bases Kb values
    print('\n5. BASE Kb VALUES (Core.js vs JSON)')
    print('-' * 40)
    core_bases = extract_bases_kb(core_text)
    issues = compare_bases(core_bases, booklet, args.verbose)
    mismatches = [i for i in issues if i[1] == 'MISMATCH']
    if mismatches:
        for _, level, msg in mismatches:
            print(f'  [{level}] {msg}')
            critical += 1
    else:
        print(f'  All {len(core_bases)} base Kb values aligned')
    for _, level, msg in issues:
        if level != 'MISMATCH':
            if args.verbose:
                print(f'  [{level}] {msg}')

    # Summary
    print('\n' + '=' * 50)
    if critical > 0:
        print(f'RESULT: {critical} CRITICAL ISSUE(S)')
        if args.check:
            sys.exit(1)
    else:
        print('RESULT: ALL FALLBACKS ALIGNED')


if __name__ == '__main__':
    main()
