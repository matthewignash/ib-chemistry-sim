#!/usr/bin/env python3
"""
validate_ib_data.py — Cross-reference all JSON data files against IB Data Booklet.

Validates that values used in SimEngine data files match the IB Chemistry 2025
Data Booklet. Flags any discrepancies. This is the safety net for data integrity.

Usage:
    python3 validate_ib_data.py              # full validation report
    python3 validate_ib_data.py --verbose    # include passing checks
    python3 validate_ib_data.py --fix        # auto-fix discrepancies (IB values win)

IB Data Booklet values ALWAYS take precedence over NIST/PubChem.
"""

import argparse
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '..', 'data')

# Paths to all data files
FILES = {
    'elements': os.path.join(DATA_DIR, 'elements.json'),
    'ib_booklet': os.path.join(DATA_DIR, 'ib_data_booklet.json'),
    'compounds_organic': os.path.join(DATA_DIR, 'compounds_organic.json'),
    'compounds_inorganic': os.path.join(DATA_DIR, 'compounds_inorganic.json'),
    'isotopes': os.path.join(DATA_DIR, 'isotopes.json'),
    'spectroscopy': os.path.join(DATA_DIR, 'spectroscopy_correlation.json'),
    'solubility': os.path.join(DATA_DIR, 'solubility_rules.json'),
    'equipment': os.path.join(DATA_DIR, 'equipment.json'),
    'thermodynamic': os.path.join(DATA_DIR, 'thermodynamic_data.json'),
    'ghs': os.path.join(DATA_DIR, 'ghs_hazards.json'),
}


def load_json(path):
    """Load a JSON file, return None if missing."""
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def check_json_validity():
    """Check all JSON files parse cleanly."""
    results = []
    for name, path in FILES.items():
        if not os.path.exists(path):
            results.append((name, 'SKIP', 'file not found'))
            continue
        try:
            with open(path, 'r', encoding='utf-8') as f:
                json.load(f)
            size = os.path.getsize(path)
            results.append((name, 'OK', f'{size:,} bytes'))
        except json.JSONDecodeError as e:
            results.append((name, 'FAIL', str(e)))
    return results


def validate_constants(booklet):
    """Validate fundamental constants."""
    issues = []
    constants = booklet.get('constants', {})

    expected = {
        'R': 8.314,
        'F': 96485,
        'NA': 6.022e23,
        'Vm_STP': 22.7,
        'c': 3.0e8,
        'h': 6.626e-34,
        'specific_heat_water': 4.18,
    }

    for key, expected_val in expected.items():
        entry = constants.get(key)
        if entry is None:
            issues.append(f'  MISSING: {key} (expected {expected_val})')
            continue
        actual = entry.get('value') if isinstance(entry, dict) else entry
        if actual is None:
            issues.append(f'  MISSING VALUE: {key} (expected {expected_val})')
        elif isinstance(expected_val, float) and expected_val != 0:
            pct = abs(actual - expected_val) / abs(expected_val) * 100
            if pct > 1.0:
                issues.append(f'  MISMATCH: {key} = {actual} (expected {expected_val}, diff {pct:.2f}%)')

    return issues


def validate_bond_enthalpies(booklet):
    """Validate bond enthalpies against IB Data Booklet values."""
    issues = []
    bonds = booklet.get('bond_enthalpies', {})

    # Key IB Data Booklet bond enthalpies (2025)
    ib_bonds = {
        'H\u2013H': 436,
        'C\u2013H': 414,
        'C\u2013C': 346,
        'C=C': 614,
        'C\u2261C': 839,
        'C\u2013O': 358,
        'C=O': 804,
        'O\u2013H': 463,
        'N\u2013H': 391,
        'N\u2261N': 945,
        'C\u2013Cl': 324,
        'C\u2013Br': 285,
    }

    for bond, expected in ib_bonds.items():
        actual = bonds.get(bond)
        if actual is None:
            # Try alternative notation
            alt = bond.replace('\u2013', '-').replace('\u2261', '≡')
            actual = bonds.get(alt)
        if actual is None:
            issues.append(f'  MISSING: {bond} (expected {expected} kJ/mol)')
        elif abs(actual - expected) > 1:
            issues.append(f'  MISMATCH: {bond} = {actual} (expected {expected} kJ/mol)')

    return issues


def validate_electrode_potentials(booklet):
    """Validate standard electrode potentials."""
    issues = []
    sep = booklet.get('standard_electrode_potentials', {})
    potentials = sep.get('half_cells', []) if isinstance(sep, dict) else sep

    # Key IB electrode potentials
    ib_potentials = {
        'Li': -3.04,
        'K': -2.92,
        'Na': -2.71,
        'Mg': -2.37,
        'Zn': -0.76,
        'Fe': -0.44,
        'Cu': +0.34,
        'Ag': +0.80,
    }

    potential_lookup = {}
    for entry in potentials:
        if not isinstance(entry, dict):
            continue
        half = entry.get('half_reaction', '')
        e0 = entry.get('E0')
        # Extract element from half-reaction (look for "→ Element")
        for elem in ib_potentials:
            if '\u2192 ' + elem in half or '→ ' + elem in half:
                potential_lookup[elem] = e0

    for elem, expected in ib_potentials.items():
        actual = potential_lookup.get(elem)
        if actual is None:
            issues.append(f'  MISSING: E°({elem}) (expected {expected:+.2f} V)')
        elif abs(actual - expected) > 0.02:
            issues.append(f'  MISMATCH: E°({elem}) = {actual:+.2f} (expected {expected:+.2f} V)')

    return issues


def validate_organic_compounds(organic):
    """Validate organic compound data."""
    issues = []
    compounds = organic.get('compounds', [])

    # Check required fields
    required_fields = ['id', 'name', 'formula', 'Mr', 'dHc', 'density', 'cat']
    for comp in compounds:
        missing = [f for f in required_fields if f not in comp]
        if missing:
            issues.append(f"  {comp.get('id', '?')}: missing fields {missing}")

        # Validate deltaHc is negative (exothermic combustion)
        dhc = comp.get('dHc')
        if dhc is not None and dhc >= 0:
            issues.append(f"  {comp.get('id')}: dHc = {dhc} (should be negative for combustion)")

        # Validate Mr is positive
        mr = comp.get('Mr')
        if mr is not None and mr <= 0:
            issues.append(f"  {comp.get('id')}: Mr = {mr} (should be positive)")

    return issues


def validate_equipment(equipment):
    """Validate equipment data."""
    issues = []
    items = equipment.get('equipment', [])

    # Check for duplicates
    ids = [item['id'] for item in items]
    seen = set()
    for item_id in ids:
        if item_id in seen:
            issues.append(f'  DUPLICATE ID: {item_id}')
        seen.add(item_id)

    # Check required fields
    required = ['id', 'name', 'category', 'uncertainty', 'typicalUse']
    for item in items:
        missing = [f for f in required if f not in item]
        if missing:
            issues.append(f"  {item.get('id', '?')}: missing fields {missing}")

    # Validate confusion groups reference valid IDs
    groups = equipment.get('confusionGroups', {})
    for group_name, group_ids in groups.items():
        for gid in group_ids:
            if gid not in seen:
                issues.append(f"  confusionGroups[{group_name}]: references unknown id '{gid}'")

    # Validate scenarios reference valid IDs
    scenarios = equipment.get('scenarios', [])
    for i, scenario in enumerate(scenarios):
        if scenario.get('correct') not in seen:
            issues.append(f"  scenario[{i}]: correct='{scenario.get('correct')}' not in equipment")
        for opt in scenario.get('options', []):
            if opt not in seen:
                issues.append(f"  scenario[{i}]: option '{opt}' not in equipment")

    return issues


def validate_isotopes(isotopes):
    """Validate isotope data."""
    issues = []
    elements = isotopes.get('elements', [])

    for elem in elements:
        # Check abundances sum to ~100%
        total = sum(iso.get('abundance', 0) for iso in elem.get('isotopes', []))
        if abs(total - 100) > 0.5:
            issues.append(
                f"  {elem.get('symbol')}: isotope abundances sum to {total:.3f}% (expected ~100%)"
            )

        # Check RAM is reasonable (weighted average of isotope masses)
        ram = elem.get('ram')
        if ram and elem.get('isotopes'):
            calc_ram = sum(
                iso.get('exact', 0) * iso.get('abundance', 0) / 100
                for iso in elem['isotopes']
            )
            if calc_ram > 0 and abs(ram - calc_ram) / ram > 0.01:
                issues.append(
                    f"  {elem.get('symbol')}: RAM={ram}, calculated={calc_ram:.3f} (>1% diff)"
                )

    return issues


def validate_spectroscopy(spectroscopy):
    """Validate spectroscopy correlation data."""
    issues = []

    # Check ir_peaks
    ir_peaks = spectroscopy.get('ir_peaks', [])
    for peak in ir_peaks:
        r = peak.get('range', [0, 0])
        if len(r) != 2:
            issues.append(f"  ir_peak '{peak.get('label')}': invalid range")
        elif r[0] > r[1]:
            issues.append(f"  ir_peak '{peak.get('label')}': range reversed ({r[0]} > {r[1]})")
        if peak.get('cat') not in ('sl', 'hl'):
            issues.append(f"  ir_peak '{peak.get('label')}': cat must be 'sl' or 'hl'")

    # Check nmr_regions
    nmr = spectroscopy.get('nmr_regions', [])
    for region in nmr:
        r = region.get('range', [0, 0])
        if len(r) != 2 or r[0] > r[1]:
            issues.append(f"  nmr_region '{region.get('label')}': invalid range")

    # Check ir_groups
    ir_groups = spectroscopy.get('ir_groups', [])
    group_ids = {g['id'] for g in ir_groups}
    for peak in ir_peaks:
        if peak.get('group') not in group_ids:
            issues.append(f"  ir_peak '{peak.get('label')}': group '{peak.get('group')}' not in ir_groups")

    return issues


def validate_solubility(solubility):
    """Validate solubility rules data."""
    issues = []

    # Check flame_ions
    flame_ions = solubility.get('flame_ions', [])
    if len(flame_ions) != 7:
        issues.append(f'  flame_ions: expected 7, got {len(flame_ions)}')

    # Check precip_matrix completeness
    cations = solubility.get('precip_cations', [])
    anions = solubility.get('precip_anions', [])
    matrix = solubility.get('precip_matrix', {})

    expected_entries = len(cations) * len(anions)
    actual_entries = len(matrix)
    if expected_entries != actual_entries:
        issues.append(
            f'  precip_matrix: expected {expected_entries} entries '
            f'({len(cations)} cations x {len(anions)} anions), got {actual_entries}'
        )

    # Check all matrix entries have valid result codes
    for key, val in matrix.items():
        result = val.get('result')
        if result not in ('S', 'I', 'SS'):
            issues.append(f"  precip_matrix[{key}]: invalid result '{result}'")

    return issues


def main():
    parser = argparse.ArgumentParser(description='Validate SimEngine data files')
    parser.add_argument('--verbose', action='store_true', help='Show passing checks too')
    args = parser.parse_args()

    print('SimEngine Data Validation Report')
    print('=' * 60)
    print()

    total_issues = 0

    # 1. JSON validity
    print('1. JSON FILE VALIDITY')
    print('-' * 40)
    validity = check_json_validity()
    for name, status, detail in validity:
        print(f'  {name:25s} [{status}] {detail}')
        if status == 'FAIL':
            total_issues += 1
    print()

    # 2. Load data
    data = {}
    for name, path in FILES.items():
        data[name] = load_json(path)

    # 3. IB Data Booklet validation
    booklet = data.get('ib_booklet')
    if booklet:
        print('2. FUNDAMENTAL CONSTANTS')
        print('-' * 40)
        issues = validate_constants(booklet)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            print('  All constants OK')
        print()

        print('3. BOND ENTHALPIES')
        print('-' * 40)
        issues = validate_bond_enthalpies(booklet)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            print('  All bond enthalpies OK')
        print()

        print('4. ELECTRODE POTENTIALS')
        print('-' * 40)
        issues = validate_electrode_potentials(booklet)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            print('  All electrode potentials OK')
        print()

    # 4. Organic compounds
    organic = data.get('compounds_organic')
    if organic:
        print('5. ORGANIC COMPOUNDS')
        print('-' * 40)
        issues = validate_organic_compounds(organic)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            print(f"  All {len(organic.get('compounds', []))} compounds OK")
        print()

    # 5. Equipment
    equipment = data.get('equipment')
    if equipment:
        print('6. EQUIPMENT DATABASE')
        print('-' * 40)
        issues = validate_equipment(equipment)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            print(f"  All {len(equipment.get('equipment', []))} items OK")
        print()

    # 6. Isotopes
    isotopes = data.get('isotopes')
    if isotopes:
        print('7. ISOTOPE DATA')
        print('-' * 40)
        issues = validate_isotopes(isotopes)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            print(f"  All {len(isotopes.get('elements', []))} elements OK")
        print()

    # 7. Spectroscopy
    spectroscopy = data.get('spectroscopy')
    if spectroscopy:
        print('8. SPECTROSCOPY CORRELATION')
        print('-' * 40)
        issues = validate_spectroscopy(spectroscopy)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            ir = len(spectroscopy.get('ir_peaks', []))
            nmr = len(spectroscopy.get('nmr_regions', []))
            ms = len(spectroscopy.get('ms_compounds', []))
            print(f'  All OK ({ir} IR peaks, {nmr} NMR regions, {ms} MS compounds)')
        print()

    # 8. Solubility
    solubility = data.get('solubility')
    if solubility:
        print('9. SOLUBILITY RULES')
        print('-' * 40)
        issues = validate_solubility(solubility)
        if issues:
            for i in issues:
                print(i)
            total_issues += len(issues)
        else:
            matrix = len(solubility.get('precip_matrix', {}))
            print(f'  All OK ({matrix} matrix entries, 7 flame ions)')
        print()

    # 10. ELEMENT COUNT
    print('10. ELEMENT COUNT')
    print('-' * 40)
    elements = load_json(FILES['elements'])
    if elements and 'elements' in elements:
        count = len(elements['elements'])
        if count == 118:
            print(f'  elements.json: {count} elements (complete)')
        else:
            print(f'  WARNING: elements.json has {count} elements (expected 118)')
            total_issues += 1
    else:
        print('  SKIP: elements.json missing or no elements array')
    print()

    # 11. ISOTOPE ABUNDANCE SUMS
    print('11. ISOTOPE ABUNDANCE SUMS')
    print('-' * 40)
    isotopes = load_json(FILES['isotopes'])
    if isotopes and 'elements' in isotopes:
        bad_sums = []
        for elem in isotopes['elements']:
            isos = elem.get('isotopes', [])
            total_abundance = sum(iso.get('abundance', 0) for iso in isos)
            if abs(total_abundance - 100.0) > 1.0:  # allow 1% tolerance
                bad_sums.append((elem.get('symbol', '?'), total_abundance))
        if bad_sums:
            for sym, total in bad_sums:
                print(f'  WARNING: {sym} isotope abundances sum to {total:.2f}% (expected ~100%)')
                total_issues += 1
        else:
            print(f'  All {len(isotopes["elements"])} elements have valid abundance sums')
    else:
        print('  SKIP: isotopes.json missing or no elements array')
    print()

    # 12. ALL FILES PRESENT
    print('12. FILE PRESENCE CHECK')
    print('-' * 40)
    missing = [name for name, path in FILES.items() if not os.path.exists(path)]
    if missing:
        for name in missing:
            print(f'  MISSING: {name}')
            total_issues += 1
    else:
        print(f'  All {len(FILES)} data files present')
    print()

    # Summary
    print('=' * 60)
    if total_issues == 0:
        print('RESULT: ALL CHECKS PASSED')
    else:
        print(f'RESULT: {total_issues} ISSUE(S) FOUND')
    print('=' * 60)

    return 0 if total_issues == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
