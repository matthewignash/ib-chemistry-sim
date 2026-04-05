# Phase 3: Data Layer Design

> **Date:** 2026-04-05
> **Goal:** Connect JSON data files to sims via fetch() with inline fallback, then expand data coverage.

---

## Problem

SimEngine has 8 well-structured JSON data files in `3-Resources/SimEngine/data/` but no sim actually loads them. All chemistry data (~1,450 lines across Core.js + individual sims) is hardcoded as JavaScript objects. Updates require editing each file separately.

## Approach: fetch() with Embedded Fallback

- Sims try `fetch()` for JSON files at startup
- On failure (file:// protocol, offline), fall back to existing inline data
- JSON files become the canonical single source of truth
- Existing hardcoded data stays as a safety net for local file use

---

## 1. SimEngine.Data Module

New module added to `SimEngine_Core.js` as MODULE 0 (lines 12-90, before STATE).

### API

| Method | Returns | Purpose |
|--------|---------|---------|
| `load(name)` | `Promise<data>` | Async fetch with fallback. Primary entry point. |
| `loadAll(names)` | `Promise<data[]>` | Parallel load multiple datasets. |
| `get(name)` | `data \| null` | Sync access to cached/fallback data. For Core.js modules. |
| `setBasePath(path)` | void | Override default `../../3-Resources/SimEngine/data/` |
| `registerFallback(name, data)` | void | Register inline data as fallback for a dataset. |

### Dataset Registry

| Name | File | Primary Consumers |
|------|------|-------------------|
| `elements` | elements.json | PeriodicTrends, ElectronConfig, Stoichiometry |
| `isotopes` | isotopes.json | NuclearAtom |
| `compounds_inorganic` | compounds_inorganic.json | IonicBonding |
| `compounds_organic` | compounds_organic.json | EnergyFromFuels |
| `ib_data_booklet` | ib_data_booklet.json | AcidBase, Electrochem, CovalentBonding, HessLaw, BornHaber |
| `spectroscopy` | spectroscopy_correlation.json | SpectroscopyLab, FunctionalGroups |
| `solubility_rules` | solubility_rules.json | QualitativeAnalysis |
| `equipment` | equipment.json | EquipmentTrainer, LabBuilder |
| `thermodynamic` | thermodynamic_data.json | EntropyGibbs, HessLaw (future) |
| `ghs_hazards` | ghs_hazards.json | LabBuilder safety info (future) |

### Load Behavior

```
load("elements")
  -> check _cache        -> hit? return cached
  -> check _pending      -> in-flight? return same Promise
  -> fetch(basePath + "elements.json")
     -> success? parse JSON, cache, return
     -> fail? check _fallback["elements"]
        -> found? return fallback (log warning)
        -> not found? reject with error
```

### Design Decisions

- **Inside Core.js, not separate file** — avoids adding a second `<script>` to 37 HTML files
- **Sync `get()` exists** because Core.js modules (Titration, Electrochem) initialize inside IIFEs that cannot await
- **No auto-merging** — the Data module is a cache/fetch layer only. IB booklet authority is enforced by convention + validate_ib_data.py
- **Page-lifetime cache** — no TTL, no invalidation. Students reload for fresh data.

---

## 2. Migration Strategy

### Phase 1: Foundation (zero behavior change)

1. Add `SimEngine.Data` module to Core.js (~80 lines)
2. Add `registerFallback()` calls after each module IIFE:
   - After Titration: register ACIDS, BASES, INDICATORS
   - After Electrochem: register HALF_CELLS, ELECTROLYTES
   - After VSEPR: register EN, MOLECULES
   - After Reaction: register REACTIONS

### Phase 2: Big-data sims

3. **PeriodicTrends** — 580 lines of ELEMENTS_DATA -> `elements.json`
4. **NuclearAtom** — 250 lines of ISOTOPE_DATA -> `isotopes.json`
5. **ElectronConfig** — 200 lines of elements -> `elements.json`

### Phase 3: Medium-data sims

6. **Stoichiometry** — ELEMENTS object + STOICH_REACTIONS -> `elements.json`
7. **CovalentBonding** — BONDS -> `ib_data_booklet.json` bond_enthalpies
8. **IonicBonding** — COMPOUNDS -> `compounds_inorganic.json`
9. **EnergyFromFuels** — FUELS -> `compounds_organic.json`

### Phase 4: Remaining data sims

10. **SpectroscopyLab** -> `spectroscopy_correlation.json`
11. **QualitativeAnalysis** -> `solubility_rules.json`
12. **EquipmentTrainer** -> `equipment.json`

### Phase 5: Core.js modules adopt richer data

13. Titration.init() checks `Data.get('ib_data_booklet')` for expanded acids/bases
14. Electrochem checks for richer half-cell data

### Per-Sim Migration Pattern (5-line wrapper)

```js
// Inline data stays as fallback
var ELEMENTS_DATA = [ /* ... existing data ... */ ];

// Try canonical JSON, then init
SimEngine.Data.load('elements').then(function(data) {
  ELEMENTS_DATA = data.elements;
}).catch(function(){}).then(function() {
  init();
});
```

### Sims Needing No Changes (~26)

Sims with no significant inline chemistry data (Index, IAScaffold, GraphTrainer, all virtual labs, MetallicBonding, StatesOfMatter, OrganicMechanisms, etc.) need no migration.

---

## 3. Data Expansion

### Enrich ib_data_booklet.json

Current: 230 lines (8 constants, 26 bond enthalpies, 24 half-cells, 5 specific heats, 8 Ka values)

**Add:**
- `acids_bases` section — expand from 6 acids / 4 bases to ~12 acids / 7 bases with full Ka/Kb arrays
- `enthalpies_formation` — ~20 common IB compounds (H2O, CO2, NH3, CH4, NaCl, MgO, etc.)
- `lattice_enthalpies` — cross-referenced from compounds_inorganic.json
- `indicators` — phenolphthalein, methyl orange, bromothymol blue, litmus with pH ranges and colors

### Generate Missing JSON Files

1. **thermodynamic_data.json** — run existing `nist_thermodynamic.py` script (~50 compounds, rate-limited NIST WebBook)
2. **ghs_hazards.json** — run existing `pubchem_ghs.py` script (~30 lab chemicals from PubChem API, requires manual safety review)

---

## 4. Sync & Validation

### New script: sync_fallbacks.py

- Compares JSON data against Core.js inline data
- Outputs diff report (which values match/differ)
- `--check` mode exits non-zero if critical diffs found
- Does NOT auto-edit Core.js

### Extend validate_ib_data.py

- Cross-reference Core.js inline data against JSON
- Check element count (118), isotope abundance sums (~100%)
- Verify all 10 JSON files exist (currently skips missing ones)

### Pre-Deploy Checklist

1. `python3 scripts/validate_ib_data.py --verbose` — all JSON valid + IB-aligned
2. `python3 scripts/sync_fallbacks.py --check` — fallbacks aligned
3. Test file:// — open 3 sims directly, verify data loads from fallback (console shows warnings)
4. Test http:// — `python3 -m http.server 8080`, verify fetch succeeds (no warnings)

---

## 5. Critical Files

| File | Change |
|------|--------|
| `3-Resources/SimEngine/SimEngine_Core.js` | Add Data module (~80 lines) + registerFallback calls |
| `3-Resources/SimEngine/data/ib_data_booklet.json` | Expand acids/bases, enthalpies, lattice enthalpies |
| `3-Resources/SimEngine/scripts/sync_fallbacks.py` | New script for alignment checking |
| `3-Resources/SimEngine/scripts/validate_ib_data.py` | Extend with cross-reference checks |
| `1-Projects/SimEngine/SimEngine_PeriodicTrends.html` | First sim migration (biggest data win) |
| `1-Projects/SimEngine/SimEngine_NuclearAtom.html` | Second migration |
| + 8 more sims | Per-sim 5-line wrapper pattern |

## 6. Risks

| Risk | Mitigation |
|------|-----------|
| fetch() fails on file:// | Entire design built around this — fallback handles it |
| JSON has bad value | validate_ib_data.py catches pre-deploy; fallback is known-good |
| Breaking existing sims | Phase 1 changes zero behavior; each sim migrated individually |
| Many fetch requests | Most sims need 1-2 datasets; loadAll runs in parallel; cached |
