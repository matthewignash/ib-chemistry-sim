# Electrochemistry Explorer Implementation Plan

> **Status: COMPLETE** — All 11 tasks implemented and verified 2026-04-01.

**Goal:** Build an electrochemistry simulation with drag-and-drop galvanic cell builder, electrolysis simulator, E° calculator practice tool, and HL extensions (Faraday's law, ΔG°).

**Architecture:** New `SimEngine.Electrochem` module in `SimEngine_Core.js` handles the half-cell database, E°cell calculations, electrolysis discharge rules, and Faraday's law. The HTML file `SimEngine_Electrochem.html` provides the UI: cell canvas with drag-and-drop assembly, animated electron flow / ion migration, mode toggle (Galvanic / Electrolysis), E° calculator panel, and data collection. The cell view uses semi-realistic 2D rendering with particle-level electrode animations.

**Tech Stack:** Vanilla JS, canvas 2D rendering, CSV via Blob + URL.createObjectURL, no external libraries.

**Design doc:** `docs/plans/2026-04-01-electrochemistry-design.md`

**Verification summary:**
- Galvanic: Zn/Cu (1.10V), Mg/Ag (3.17V) — correct E°cell, anode/cathode, cell notation
- Electrolysis: molten NaCl (Na/Cl₂), aqueous CuSO₄ inert (Cu/O₂), CuSO₄ Cu electrodes (Cu deposits/dissolves)
- E° Calculator: 24 half-cells, quiz mode with score tracking
- HL: ΔG° = -212.27 kJ (Zn/Cu), Faraday's law calculator
- Data collection: snapshot working
- No regressions on Gas Laws, Equilibrium, Acid-Base sims
- Responsive (mobile/desktop), print styles, keyboard shortcuts
- Post-build fix: salt bridge redrawn as inverted U-tube

---

### Task 1: Electrochem Module -- Half-Cell Database + E° Calculations

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (append after Titration module, ~line 2529)

**Step 1: Add the Electrochem module scaffold with half-cell database**

Append to `SimEngine_Core.js` after the Titration module closing `})();`:

```javascript
// ─────────────────────────────────────────────
// MODULE 8: ELECTROCHEM
// Half-cell database, E° calculations, electrolysis
// discharge rules, Faraday's law, and activity series.
// ─────────────────────────────────────────────
SimEngine.Electrochem = (function () {

  var F = 96485; // Faraday constant, C/mol

  // ── Half-Cell Database (IB Data Booklet) ────

  var HALF_CELLS = [
    { key: 'Li',    ion: 'Li\u207A',        metal: 'Li',  formula: 'Li\u207A/Li',
      halfReaction: 'Li\u207A + e\u207B \u2192 Li',
      E: -3.04, electrons: 1, state: 'solid', molarMass: 6.94,
      color: '#A855F7' },
    { key: 'K',     ion: 'K\u207A',         metal: 'K',   formula: 'K\u207A/K',
      halfReaction: 'K\u207A + e\u207B \u2192 K',
      E: -2.92, electrons: 1, state: 'solid', molarMass: 39.10,
      color: '#8B5CF6' },
    { key: 'Ca',    ion: 'Ca\u00B2\u207A',  metal: 'Ca',  formula: 'Ca\u00B2\u207A/Ca',
      halfReaction: 'Ca\u00B2\u207A + 2e\u207B \u2192 Ca',
      E: -2.87, electrons: 2, state: 'solid', molarMass: 40.08,
      color: '#F59E0B' },
    { key: 'Na',    ion: 'Na\u207A',        metal: 'Na',  formula: 'Na\u207A/Na',
      halfReaction: 'Na\u207A + e\u207B \u2192 Na',
      E: -2.71, electrons: 1, state: 'solid', molarMass: 22.99,
      color: '#F97316' },
    { key: 'Mg',    ion: 'Mg\u00B2\u207A',  metal: 'Mg',  formula: 'Mg\u00B2\u207A/Mg',
      halfReaction: 'Mg\u00B2\u207A + 2e\u207B \u2192 Mg',
      E: -2.37, electrons: 2, state: 'solid', molarMass: 24.31,
      color: '#84CC16' },
    { key: 'Al',    ion: 'Al\u00B3\u207A',  metal: 'Al',  formula: 'Al\u00B3\u207A/Al',
      halfReaction: 'Al\u00B3\u207A + 3e\u207B \u2192 Al',
      E: -1.66, electrons: 3, state: 'solid', molarMass: 26.98,
      color: '#CBD5E1' },
    { key: 'Mn',    ion: 'Mn\u00B2\u207A',  metal: 'Mn',  formula: 'Mn\u00B2\u207A/Mn',
      halfReaction: 'Mn\u00B2\u207A + 2e\u207B \u2192 Mn',
      E: -1.18, electrons: 2, state: 'solid', molarMass: 54.94,
      color: '#A78BFA' },
    { key: 'Zn',    ion: 'Zn\u00B2\u207A',  metal: 'Zn',  formula: 'Zn\u00B2\u207A/Zn',
      halfReaction: 'Zn\u00B2\u207A + 2e\u207B \u2192 Zn',
      E: -0.76, electrons: 2, state: 'solid', molarMass: 65.38,
      color: '#94A3B8' },
    { key: 'Fe',    ion: 'Fe\u00B2\u207A',  metal: 'Fe',  formula: 'Fe\u00B2\u207A/Fe',
      halfReaction: 'Fe\u00B2\u207A + 2e\u207B \u2192 Fe',
      E: -0.44, electrons: 2, state: 'solid', molarMass: 55.85,
      color: '#78716C' },
    { key: 'Co',    ion: 'Co\u00B2\u207A',  metal: 'Co',  formula: 'Co\u00B2\u207A/Co',
      halfReaction: 'Co\u00B2\u207A + 2e\u207B \u2192 Co',
      E: -0.28, electrons: 2, state: 'solid', molarMass: 58.93,
      color: '#6366F1' },
    { key: 'Ni',    ion: 'Ni\u00B2\u207A',  metal: 'Ni',  formula: 'Ni\u00B2\u207A/Ni',
      halfReaction: 'Ni\u00B2\u207A + 2e\u207B \u2192 Ni',
      E: -0.26, electrons: 2, state: 'solid', molarMass: 58.69,
      color: '#22C55E' },
    { key: 'Sn',    ion: 'Sn\u00B2\u207A',  metal: 'Sn',  formula: 'Sn\u00B2\u207A/Sn',
      halfReaction: 'Sn\u00B2\u207A + 2e\u207B \u2192 Sn',
      E: -0.14, electrons: 2, state: 'solid', molarMass: 118.71,
      color: '#9CA3AF' },
    { key: 'Pb',    ion: 'Pb\u00B2\u207A',  metal: 'Pb',  formula: 'Pb\u00B2\u207A/Pb',
      halfReaction: 'Pb\u00B2\u207A + 2e\u207B \u2192 Pb',
      E: -0.13, electrons: 2, state: 'solid', molarMass: 207.2,
      color: '#6B7280' },
    { key: 'H2',    ion: 'H\u207A',         metal: 'H\u2082', formula: 'H\u207A/H\u2082',
      halfReaction: '2H\u207A + 2e\u207B \u2192 H\u2082',
      E: 0.00, electrons: 2, state: 'gas', molarMass: 2.02,
      color: '#EF4444' },
    { key: 'Cu',    ion: 'Cu\u00B2\u207A',  metal: 'Cu',  formula: 'Cu\u00B2\u207A/Cu',
      halfReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu',
      E: +0.34, electrons: 2, state: 'solid', molarMass: 63.55,
      color: '#D97706' },
    { key: 'I2',    ion: 'I\u207B',         metal: 'I\u2082', formula: 'I\u2082/I\u207B',
      halfReaction: 'I\u2082 + 2e\u207B \u2192 2I\u207B',
      E: +0.54, electrons: 2, state: 'solid', molarMass: 253.81,
      color: '#7C3AED' },
    { key: 'Ag',    ion: 'Ag\u207A',        metal: 'Ag',  formula: 'Ag\u207A/Ag',
      halfReaction: 'Ag\u207A + e\u207B \u2192 Ag',
      E: +0.80, electrons: 1, state: 'solid', molarMass: 107.87,
      color: '#D1D5DB' },
    { key: 'Fe3',   ion: 'Fe\u00B3\u207A',  metal: 'Fe\u00B2\u207A', formula: 'Fe\u00B3\u207A/Fe\u00B2\u207A',
      halfReaction: 'Fe\u00B3\u207A + e\u207B \u2192 Fe\u00B2\u207A',
      E: +0.77, electrons: 1, state: 'aqueous', molarMass: 55.85,
      color: '#B45309' },
    { key: 'Br2',   ion: 'Br\u207B',        metal: 'Br\u2082', formula: 'Br\u2082/Br\u207B',
      halfReaction: 'Br\u2082 + 2e\u207B \u2192 2Br\u207B',
      E: +1.07, electrons: 2, state: 'liquid', molarMass: 159.81,
      color: '#B91C1C' },
    { key: 'Cr2O7', ion: 'Cr\u2082O\u2087\u00B2\u207B', metal: 'Cr\u00B3\u207A', formula: 'Cr\u2082O\u2087\u00B2\u207B/Cr\u00B3\u207A',
      halfReaction: 'Cr\u2082O\u2087\u00B2\u207B + 14H\u207A + 6e\u207B \u2192 2Cr\u00B3\u207A + 7H\u2082O',
      E: +1.33, electrons: 6, state: 'aqueous', molarMass: 52.00,
      color: '#EA580C' },
    { key: 'Cl2',   ion: 'Cl\u207B',        metal: 'Cl\u2082', formula: 'Cl\u2082/Cl\u207B',
      halfReaction: 'Cl\u2082 + 2e\u207B \u2192 2Cl\u207B',
      E: +1.36, electrons: 2, state: 'gas', molarMass: 70.91,
      color: '#10B981' },
    { key: 'MnO4',  ion: 'MnO\u2084\u207B', metal: 'Mn\u00B2\u207A', formula: 'MnO\u2084\u207B/Mn\u00B2\u207A',
      halfReaction: 'MnO\u2084\u207B + 8H\u207A + 5e\u207B \u2192 Mn\u00B2\u207A + 4H\u2082O',
      E: +1.51, electrons: 5, state: 'aqueous', molarMass: 54.94,
      color: '#7C3AED' },
    { key: 'Au',    ion: 'Au\u00B3\u207A',  metal: 'Au',  formula: 'Au\u00B3\u207A/Au',
      halfReaction: 'Au\u00B3\u207A + 3e\u207B \u2192 Au',
      E: +1.50, electrons: 3, state: 'solid', molarMass: 196.97,
      color: '#F59E0B' },
    { key: 'F2',    ion: 'F\u207B',         metal: 'F\u2082', formula: 'F\u2082/F\u207B',
      halfReaction: 'F\u2082 + 2e\u207B \u2192 2F\u207B',
      E: +2.87, electrons: 2, state: 'gas', molarMass: 38.00,
      color: '#FDE047' }
  ];

  // ── Lookup helper ────────────────────────────

  var _halfCellMap = {};
  for (var i = 0; i < HALF_CELLS.length; i++) {
    _halfCellMap[HALF_CELLS[i].key] = HALF_CELLS[i];
  }

  function getHalfCell(key) {
    return _halfCellMap[key] || null;
  }

  // ── E°cell Calculation ───────────────────────

  function calculateCell(keyA, keyB) {
    var a = getHalfCell(keyA);
    var b = getHalfCell(keyB);
    if (!a || !b) return null;

    var cathode, anode;
    if (a.E >= b.E) {
      cathode = a;
      anode = b;
    } else {
      cathode = b;
      anode = a;
    }

    var eCell = cathode.E - anode.E;

    // Balance electron transfer (LCM of both electron counts)
    var nCathode = cathode.electrons;
    var nAnode = anode.electrons;
    var lcm = (nCathode * nAnode) / _gcd(nCathode, nAnode);

    // Cell notation: anode | anode ion || cathode ion | cathode
    var cellNotation = anode.metal + '(' + (anode.state === 'aqueous' ? 'aq' : 's') + ') | ' +
                       anode.ion + '(aq) || ' +
                       cathode.ion + '(aq) | ' +
                       cathode.metal + '(' + (cathode.state === 'aqueous' ? 'aq' : cathode.state === 'gas' ? 'g' : 's') + ')';

    return {
      cathode:         cathode,
      anode:           anode,
      eCell:           Math.round(eCell * 100) / 100,
      spontaneous:     eCell > 0,
      cellNotation:    cellNotation,
      cathodeReaction: cathode.halfReaction,
      anodeReaction:   _reverseReaction(anode.halfReaction),
      electronTransfer: lcm
    };
  }

  function _gcd(a, b) {
    while (b) { var t = b; b = a % b; a = t; }
    return a;
  }

  function _reverseReaction(reaction) {
    var parts = reaction.split(' \u2192 ');
    if (parts.length === 2) return parts[1] + ' \u2192 ' + parts[0];
    return reaction;
  }

  // ── Activity Series ──────────────────────────

  function getActivitySeries() {
    // Only metals with solid state (exclude non-metal half-cells and aqueous-only)
    var metals = [];
    for (var i = 0; i < HALF_CELLS.length; i++) {
      var hc = HALF_CELLS[i];
      if (hc.state === 'solid') {
        metals.push({ key: hc.key, metal: hc.metal, E: hc.E, ion: hc.ion, color: hc.color });
      }
    }
    metals.sort(function (a, b) { return a.E - b.E; });
    return metals;
  }

  // ── Return ───────────────────────────────────

  return {
    F:                 F,
    HALF_CELLS:        HALF_CELLS,
    getHalfCell:       getHalfCell,
    calculateCell:     calculateCell,
    getActivitySeries: getActivitySeries
  };

})();
```

**Step 2: Verify in browser console**

Navigate to any sim page (e.g., Gas Laws), then in console:
```javascript
// Reload Core.js with cache bust
var s = document.createElement('script');
s.src = '/3-Resources/SimEngine/SimEngine_Core.js?' + Date.now();
document.head.appendChild(s);

// After load:
SimEngine.Electrochem.HALF_CELLS.length;
// Should return 24

var result = SimEngine.Electrochem.calculateCell('Zn', 'Cu');
// result.eCell should be 1.10
// result.anode.key should be 'Zn'
// result.cathode.key should be 'Cu'
// result.spontaneous should be true
// result.cellNotation should be 'Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)'

SimEngine.Electrochem.getActivitySeries().map(function(m) { return m.metal; });
// Should return metals sorted by E°: Li, K, Ca, Na, Mg, Al, Mn, Zn, Fe, Co, Ni, Sn, Pb, Cu, Ag, Au
```

---

### Task 2: Electrolysis Discharge Rules + Faraday's Law

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (Electrochem module, before `return` statement)

**Step 1: Add electrolysis preset database and discharge rule engine**

Inside the Electrochem IIFE, before the `return` statement:

```javascript
  // ── Electrolysis Presets ─────────────────────

  var ELECTROLYTES = [
    { key: 'NaCl_molten',   label: 'NaCl (molten)',            cation: 'Na', anion: 'Cl', state: 'molten', concentration: 'n/a', electrode: 'inert',
      cathodeProduct: 'Na(l)',   anodeProduct: 'Cl\u2082(g)',
      cathodeReaction: 'Na\u207A + e\u207B \u2192 Na(l)',
      anodeReaction:   '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    { key: 'PbBr2_molten',  label: 'PbBr\u2082 (molten)',     cation: 'Pb', anion: 'Br', state: 'molten', concentration: 'n/a', electrode: 'inert',
      cathodeProduct: 'Pb(l)',   anodeProduct: 'Br\u2082(l)',
      cathodeReaction: 'Pb\u00B2\u207A + 2e\u207B \u2192 Pb(l)',
      anodeReaction:   '2Br\u207B \u2192 Br\u2082(l) + 2e\u207B' },
    { key: 'CuCl2_aq',      label: 'CuCl\u2082 (aqueous)',    cation: 'Cu', anion: 'Cl', state: 'aqueous', concentration: 'moderate', electrode: 'inert',
      cathodeProduct: 'Cu(s)',   anodeProduct: 'Cl\u2082(g)',
      cathodeReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu(s)',
      anodeReaction:   '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    { key: 'CuSO4_aq',      label: 'CuSO\u2084 (aq, inert electrodes)', cation: 'Cu', anion: 'SO4', state: 'aqueous', concentration: 'moderate', electrode: 'inert',
      cathodeProduct: 'Cu(s)',   anodeProduct: 'O\u2082(g)',
      cathodeReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu(s)',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'NaCl_conc',     label: 'NaCl (aq, concentrated)', cation: 'Na', anion: 'Cl', state: 'aqueous', concentration: 'concentrated', electrode: 'inert',
      cathodeProduct: 'H\u2082(g)', anodeProduct: 'Cl\u2082(g)',
      cathodeReaction: '2H\u2082O + 2e\u207B \u2192 H\u2082(g) + 2OH\u207B',
      anodeReaction:   '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    { key: 'NaCl_dilute',   label: 'NaCl (aq, dilute)',       cation: 'Na', anion: 'Cl', state: 'aqueous', concentration: 'dilute', electrode: 'inert',
      cathodeProduct: 'H\u2082(g)', anodeProduct: 'O\u2082(g)',
      cathodeReaction: '2H\u2082O + 2e\u207B \u2192 H\u2082(g) + 2OH\u207B',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'H2SO4_dilute',  label: 'H\u2082SO\u2084 (aq, dilute)', cation: 'H', anion: 'SO4', state: 'aqueous', concentration: 'dilute', electrode: 'inert',
      cathodeProduct: 'H\u2082(g)', anodeProduct: 'O\u2082(g)',
      cathodeReaction: '2H\u207A + 2e\u207B \u2192 H\u2082(g)',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'AgNO3_aq',      label: 'AgNO\u2083 (aqueous)',    cation: 'Ag', anion: 'NO3', state: 'aqueous', concentration: 'moderate', electrode: 'inert',
      cathodeProduct: 'Ag(s)',   anodeProduct: 'O\u2082(g)',
      cathodeReaction: 'Ag\u207A + e\u207B \u2192 Ag(s)',
      anodeReaction:   '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    { key: 'CuSO4_Cu',      label: 'CuSO\u2084 (aq, Cu electrodes)', cation: 'Cu', anion: 'SO4', state: 'aqueous', concentration: 'moderate', electrode: 'Cu',
      cathodeProduct: 'Cu(s) deposits', anodeProduct: 'Cu(s) dissolves',
      cathodeReaction: 'Cu\u00B2\u207A + 2e\u207B \u2192 Cu(s)',
      anodeReaction:   'Cu(s) \u2192 Cu\u00B2\u207A + 2e\u207B' }
  ];

  // ── Discharge Rule Engine (teacher mode) ─────

  // Anion E° for oxidation (more negative = easier to oxidize at anode)
  var _anionData = {
    'F':   { E: +2.87, product: 'F\u2082(g)',  reaction: '2F\u207B \u2192 F\u2082(g) + 2e\u207B' },
    'Cl':  { E: +1.36, product: 'Cl\u2082(g)', reaction: '2Cl\u207B \u2192 Cl\u2082(g) + 2e\u207B' },
    'Br':  { E: +1.07, product: 'Br\u2082(l)', reaction: '2Br\u207B \u2192 Br\u2082(l) + 2e\u207B' },
    'I':   { E: +0.54, product: 'I\u2082(s)',  reaction: '2I\u207B \u2192 I\u2082(s) + 2e\u207B' },
    'OH':  { E: +0.40, product: 'O\u2082(g)',  reaction: '4OH\u207B \u2192 O\u2082(g) + 2H\u2082O + 4e\u207B' },
    'SO4': { E: +2.01, product: 'O\u2082(g)',  reaction: '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' },
    'NO3': { E: +2.01, product: 'O\u2082(g)',  reaction: '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B' }
  };

  function predictElectrolysis(config) {
    // config: { cation, anion, state, electrode, concentration }
    var cationHC = getHalfCell(config.cation);
    var anionInfo = _anionData[config.anion];
    if (!cationHC || !anionInfo) return null;

    var cathodeProduct, cathodeReaction, cathodeExplanation;
    var anodeProduct, anodeReaction, anodeExplanation;

    if (config.state === 'molten') {
      // Molten: straightforward — cation reduced, anion oxidized
      cathodeProduct = cationHC.metal;
      cathodeReaction = cationHC.halfReaction;
      cathodeExplanation = 'Molten: only ' + cationHC.ion + ' ions available for reduction.';
      anodeProduct = anionInfo.product;
      anodeReaction = anionInfo.reaction;
      anodeExplanation = 'Molten: only ' + config.anion + '\u207B ions available for oxidation.';
    } else {
      // Aqueous — cathode: compare cation E° vs H₂O
      if (cationHC.E >= -0.41) {
        // Cation has more positive E° than water reduction (-0.83V at pH 7, ~-0.41 effective)
        cathodeProduct = cationHC.metal + '(s)';
        cathodeReaction = cationHC.halfReaction;
        cathodeExplanation = cationHC.ion + ' has more positive E\u00B0 than H\u2082O, so it is preferentially discharged.';
      } else {
        cathodeProduct = 'H\u2082(g)';
        cathodeReaction = '2H\u2082O + 2e\u207B \u2192 H\u2082(g) + 2OH\u207B';
        cathodeExplanation = cationHC.ion + ' is too reactive (E\u00B0 too negative). Water is reduced instead.';
      }

      // Aqueous — anode: active electrode check first
      if (config.electrode && config.electrode !== 'inert') {
        var activeHC = getHalfCell(config.electrode);
        if (activeHC) {
          anodeProduct = activeHC.metal + '(s) dissolves';
          anodeReaction = activeHC.metal + '(s) \u2192 ' + activeHC.ion + '(aq) + ' + activeHC.electrons + 'e\u207B';
          anodeExplanation = 'Active ' + activeHC.metal + ' electrode dissolves in preference to anion oxidation.';
        }
      }

      if (!anodeProduct) {
        // Halide exception: concentrated halides discharged over OH⁻
        var isHalide = (config.anion === 'Cl' || config.anion === 'Br' || config.anion === 'I');
        if (isHalide && config.concentration !== 'dilute') {
          anodeProduct = anionInfo.product;
          anodeReaction = anionInfo.reaction;
          anodeExplanation = 'Halide ions (' + config.anion + '\u207B) are preferentially discharged (concentration/kinetic effect).';
        } else if (isHalide && config.concentration === 'dilute') {
          // Dilute halide — water oxidized
          anodeProduct = 'O\u2082(g)';
          anodeReaction = '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B';
          anodeExplanation = 'Dilute solution: water is oxidized in preference to dilute ' + config.anion + '\u207B.';
        } else {
          // Non-halide anion (SO4²⁻, NO3⁻) — water oxidized
          anodeProduct = 'O\u2082(g)';
          anodeReaction = '2H\u2082O \u2192 O\u2082(g) + 4H\u207A + 4e\u207B';
          anodeExplanation = config.anion + ' ions are not discharged. Water is oxidized instead.';
        }
      }
    }

    return {
      cathodeProduct:      cathodeProduct,
      anodeProduct:        anodeProduct,
      cathodeReaction:     cathodeReaction,
      anodeReaction:       anodeReaction,
      cathodeExplanation:  cathodeExplanation,
      anodeExplanation:    anodeExplanation
    };
  }

  // ── Faraday's Law (HL) ──────────────────────

  function faraday(current, timeSeconds, electrons, molarMass) {
    var charge = current * timeSeconds;
    var molesElectrons = charge / F;
    var molesProduct = molesElectrons / electrons;
    var massProduct = molesProduct * molarMass;
    return {
      charge:         Math.round(charge * 100) / 100,
      molesElectrons: molesElectrons,
      molesProduct:   molesProduct,
      massProduct:    Math.round(massProduct * 1000) / 1000
    };
  }

  // ── ΔG° Calculation (HL) ─────────────────────

  function deltaG(eCell, electronTransfer) {
    // ΔG° = -nFE°cell (in kJ/mol)
    var dG = -electronTransfer * F * eCell / 1000;
    return { deltaG: Math.round(dG * 100) / 100 };
  }
```

**Step 2: Update the return statement to expose new methods**

```javascript
  return {
    F:                   F,
    HALF_CELLS:          HALF_CELLS,
    ELECTROLYTES:        ELECTROLYTES,
    getHalfCell:         getHalfCell,
    calculateCell:       calculateCell,
    getActivitySeries:   getActivitySeries,
    predictElectrolysis: predictElectrolysis,
    faraday:             faraday,
    deltaG:              deltaG
  };
```

**Step 3: Verify in browser console**

```javascript
// Electrolysis presets
SimEngine.Electrochem.ELECTROLYTES.length;
// Should return 9

// Discharge rule engine
var r = SimEngine.Electrochem.predictElectrolysis({
  cation: 'Na', anion: 'Cl', state: 'aqueous', electrode: 'inert', concentration: 'concentrated'
});
// r.cathodeProduct should be 'H₂(g)' (Na too reactive)
// r.anodeProduct should be 'Cl₂(g)' (concentrated halide)

var r2 = SimEngine.Electrochem.predictElectrolysis({
  cation: 'Cu', anion: 'SO4', state: 'aqueous', electrode: 'Cu', concentration: 'moderate'
});
// r2.cathodeProduct should be 'Cu(s)' (Cu deposited)
// r2.anodeProduct should contain 'dissolves' (active Cu electrode)

// Faraday's law
var f = SimEngine.Electrochem.faraday(2.0, 3600, 2, 63.55);
// f.charge = 7200 C
// f.molesElectrons = 7200/96485 = 0.0746
// f.molesProduct = 0.0373
// f.massProduct ≈ 2.371 g

// Delta G
var dg = SimEngine.Electrochem.deltaG(1.10, 2);
// dg.deltaG ≈ -212.27 kJ/mol
```

---

### Task 3: HTML Scaffold -- Layout, CSS, Header, Canvases

**Files:**
- Create: `1-Projects/SimEngine/SimEngine_Electrochem.html`

**Step 1: Create the HTML file with all CSS and structure**

Create `SimEngine_Electrochem.html` with:

- All CSS from the style guide (same `:root` tokens, header, cards, sliders, buttons, toggles, info readout, HL panel, data panel, print, responsive — copy from `SimEngine_AcidBase.html`)
- Additional CSS for electrochemistry-specific elements:
  - `.mode-toggle-bar` — row with two mode buttons (Galvanic / Electrolysis), styled like tabs
  - `.mode-btn` — tab button; `.mode-btn.active` has teal background
  - `.cell-canvas-wrap` — wrapper for the cell canvas (same pattern as `.beaker-canvas-wrap`)
  - `.parts-tray` — horizontal row below canvas showing draggable parts
  - `.parts-tray-item` — individual draggable part with grab cursor, border, border-radius, padding
  - `.parts-tray-item.placed` — greyed out / hidden when already placed in cell
  - `.activity-series` — vertical list in control panel, small font, monospace E° values
  - `.activity-series-item` — single row; `.activity-series-item.highlight-anode` red border, `.highlight-cathode` blue border
  - `.ecalc-panel` — collapsible panel for E° calculator
  - `.ecalc-table` — scrollable half-cell table (max-height 300px)
  - `.ecalc-table tr.selected` — highlighted row (teal background, white text)
  - `.quiz-input` — number input for quiz mode answer
  - `.quiz-correct` — green text; `.quiz-incorrect` — red text
  - `.cell-notation` — monospace, centered, larger font for cell notation display
  - `.faraday-inputs` — grid row for current/time inputs in HL panel

- HTML structure:
  - Header: "Electrochemistry Explorer", subtitle "IB Chemistry SimEngine — Reactivity 3.2", SL/HL toggle, Teacher/Student toggle
  - Mode toggle bar: Galvanic Cell / Electrolysis buttons
  - sim-top-row: cell canvas card (left) + control panel card (right, 300px)
  - Cell canvas: `id="cellCanvas"`, 800x500 internal resolution
  - Parts tray (inside canvas card, below canvas): electrode A, electrode B, salt bridge placeholders
  - Control panel contents:
    - **Galvanic controls** (`id="galvanicControls"`):
      - Half-cell A dropdown (`id="halfCellA"`)
      - Half-cell B dropdown (`id="halfCellB"`)
      - Assemble button (`id="btnAssemble"`, class `sim-btn primary`)
      - Reset button (`id="btnReset"`, class `sim-btn`)
    - **Electrolysis controls** (`id="electrolysisControls"`, hidden by default):
      - Electrolyte dropdown (`id="electrolyteSelect"`) — student mode
      - Cation / Anion / State / Concentration / Electrode dropdowns — teacher mode (`id="eCation"`, `id="eAnion"`, `id="eState"`, `id="eConc"`, `id="eElectrode"`)
      - Start / Reset buttons
    - Activity series sidebar (`id="activitySeries"`)
    - Live readout section:
      - E°cell (`id="infoECell"`)
      - Anode (`id="infoAnode"`)
      - Cathode (`id="infoCathode"`)
      - Cell notation (`id="infoCellNotation"`)
      - Spontaneous (`id="infoSpontaneous"`)
      - Cathode product (`id="infoCathodeProduct"`) — electrolysis mode
      - Anode product (`id="infoAnodeProduct"`) — electrolysis mode
    - Data collection panel (same HTML structure as other sims)
  - E° Calculator panel (collapsible, `id="ecalcPanel"`):
    - Half-cell table (`id="ecalcTable"`)
    - Calculation display (`id="ecalcResult"`)
    - Quiz mode toggle (`id="quizToggle"`)
    - Quiz input + check button (`id="quizInput"`, `id="btnQuizCheck"`)
    - Score display (`id="quizScore"`)
  - HL panel: Faraday's law inputs (current, time, half-reaction) + live readout, ΔG° readout
  - Footer

- Script tag: `<script src="../../3-Resources/SimEngine/SimEngine_Core.js"></script>` before main `<script>` IIFE

**Step 2: Add the basic JavaScript IIFE scaffold**

Inside `<script>`, create the IIFE with:
- Canvas setup (HiDPI) for cell canvas
- State variables: `_mode` ('galvanic'/'electrolysis'), `_isTeacher`, `_isHL`, `_cellAssembled`, `_animating`, `_selectedA`, `_selectedB`
- Drag state: `_dragItem`, `_dragX`, `_dragY`, `_snapZones` array
- Mode toggle wiring
- Header toggle wiring (SL/HL, Teacher/Student)
- `SimEngine.Electrochem` init
- Activity series population
- `requestAnimationFrame` loop stub

**Step 3: Verify**

Page loads without errors. Header, mode toggle, cards, canvas, control panel, and E° calculator panel all visible. Activity series populated with metals.

---

### Task 4: Drag-and-Drop Cell Assembly

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html` (script section)

**Step 1: Implement snap zones and draggable parts**

Define snap zones on the canvas:
```javascript
var _snapZones = {
  electrodeLeft:  { x: 180, y: 250, w: 30, h: 160, occupied: false, item: null },
  electrodeRight: { x: 590, y: 250, w: 30, h: 160, occupied: false, item: null },
  saltBridge:     { x: 370, y: 140, w: 60, h: 200, occupied: false, item: null }
};
```

Define draggable parts (positioned in parts tray area below canvas):
```javascript
var _parts = [
  { id: 'electrodeA', label: 'Electrode A', type: 'electrode', placed: false, x: 100, y: 470, w: 60, h: 20 },
  { id: 'electrodeB', label: 'Electrode B', type: 'electrode', placed: false, x: 250, y: 470, w: 60, h: 20 },
  { id: 'saltBridge', label: 'Salt Bridge', type: 'bridge',    placed: false, x: 400, y: 470, w: 80, h: 20 }
];
```

**Step 2: Implement mouse/touch drag handlers**

- `mousedown`/`touchstart` on canvas: check if click hits a part in the tray (not yet placed). If so, set `_dragItem`.
- `mousemove`/`touchmove`: update `_dragItem` position to follow cursor.
- `mouseup`/`touchend`: check if `_dragItem` overlaps a valid snap zone. If yes, snap it into place, mark zone as occupied and part as placed. If no, return part to tray position.
- Electrodes can only snap to electrode zones. Salt bridge can only snap to bridge zone.

**Step 3: Implement cell assembly validation**

After each drop:
- Check if both electrode zones and salt bridge zone are occupied
- If all three occupied → `_cellAssembled = true`, wire auto-draws, call `startAnimation()`
- If incomplete → show which parts are missing

**Step 4: Implement reset**

Reset button: clear all snap zones, return all parts to tray, `_cellAssembled = false`, stop animation.

**Step 5: Verify**

- Parts appear in tray below canvas
- Can drag electrode into beaker position — snaps into place
- Dragging to wrong zone returns part to tray
- All three placed → cell assembles, wire appears
- Reset returns all parts

---

### Task 5: Cell Rendering -- Beakers, Electrodes, Wire, Voltmeter

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html` (script section)

**Step 1: Implement static cell drawing**

`drawCell()` function that renders on the cell canvas:

- **Beakers**: two trapezoid shapes (left and right), light blue fill, dark outline. Similar proportions to acid-base beaker but smaller (each ~200px wide, ~200px tall).
- **Electrodes**: vertical rectangles inside beakers when placed. Colored by half-cell metal color. Label below each (e.g., "Zn", "Cu").
- **Electrolyte**: light tinted fill in each beaker (color from ion). Label (e.g., "ZnSO₄(aq)").
- **Wire**: line across the top connecting the two electrodes, with a slight curve. Drawn only when cell assembled.
- **Voltmeter** (galvanic mode): circle on the wire midpoint with "V" label and E°cell reading.
- **Battery** (electrolysis mode): rectangle on the wire with "+" and "−" labels.
- **Salt bridge**: U-shaped tube between beakers when placed. Filled with light grey.
- **Parts tray**: draw parts as labeled rectangles below the canvas area when not placed.
- **Labels**: anode/cathode labels below each beaker ("Anode (oxidation)" / "Cathode (reduction)").

**Step 2: Implement mode-specific rendering**

- Galvanic: voltmeter on wire, "−" on anode side, "+" on cathode side
- Electrolysis: battery on wire, "+" on anode side, "−" on cathode side, no salt bridge needed (single beaker variant or two-beaker with membrane)

For electrolysis, simplify to a single beaker with two electrodes (more accurate to real apparatus):
- One wider beaker centered on canvas
- Two electrodes inside, left = cathode (−), right = anode (+)
- Battery/power supply on wire above
- No salt bridge

**Step 3: Verify**

- Galvanic: two beakers, electrodes, salt bridge, wire, voltmeter all render correctly
- Electrolysis: single beaker, two electrodes, battery on wire
- Mode toggle swaps between views
- Electrode colors match half-cell database

---

### Task 6: Cell Animation -- Electron Flow + Ion Migration + Electrode Events

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html` (script section)

**Step 1: Implement electron flow along wire**

- Array of electron dot objects: `{ x, y, progress }` where progress is 0-1 along the wire path
- Spawn new electron dots at anode end every few frames
- Move along wire path toward cathode end
- Remove when they reach the cathode
- Draw as small yellow circles (radius 2-3px)
- Speed proportional to |E°cell| (minimum speed so low-voltage cells still animate)

**Step 2: Implement anode dissolution animation**

At the anode electrode:
- Periodically (every ~60 frames), an atom sprite "detaches" from the electrode surface
- Atom starts as a small circle matching the electrode color
- Transitions to ion color as it drifts into solution
- Simultaneously, a small electron dot leaves the atom and joins the wire
- Electrode rectangle shrinks very slightly over time (visual mass loss)

**Step 3: Implement cathode deposition animation**

At the cathode electrode:
- Ions from solution approach the electrode surface
- When they reach the electrode, they "deposit" — change from ion color to metal color, become part of the electrode
- Electrode rectangle grows very slightly
- Electron dots arriving from wire are consumed

**Step 4: Implement ion migration in solution and salt bridge**

- Cations (positive) drift slowly toward cathode
- Anions (negative) drift slowly toward anode
- In galvanic mode: salt bridge ions also migrate (anions toward anode beaker, cations toward cathode beaker)
- Simple sprites with Brownian-like drift

**Step 5: Implement electrolysis-specific animations**

- Gas evolution: bubbles rise from electrode (small circles that float upward and fade)
- Metal deposition: same as galvanic cathode
- Active anode dissolving: same as galvanic anode dissolution
- Different bubble colors: H₂ = clear/white, O₂ = clear/white, Cl₂ = yellow-green tint

**Step 6: Animation loop**

`requestAnimationFrame` loop:
- Clear canvas
- Call `drawCell()` for static elements
- If `_cellAssembled` and `_animating`:
  - Update and draw electron dots
  - Update and draw ion sprites
  - Update and draw electrode events (dissolution/deposition)
  - Update and draw gas bubbles (electrolysis)

**Step 7: Verify**

- Galvanic Zn/Cu: electron dots flow Zn→Cu along wire. Zn atoms dissolve at anode. Cu²⁺ ions deposit at cathode. Salt bridge ions migrate.
- Electrolysis CuSO₄: electron dots flow from battery. Cu²⁺ deposits at cathode. O₂ bubbles at anode.
- Animation speed scales with E°cell
- Reset stops animation cleanly

---

### Task 7: Controls -- Dropdowns, Mode Toggle, Activity Series

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html` (script section)

**Step 1: Populate galvanic dropdowns**

- Half-cell A and B dropdowns: populated from `SimEngine.Electrochem.HALF_CELLS`. Show `formula` as option text. Group metals vs non-metals if desired, or just sort by E°.
- On change: update electrode labels in parts tray, update activity series highlights, recalculate E°cell preview (before assembly).

**Step 2: Wire galvanic assemble/reset**

- Assemble button: validates two different half-cells selected, then enables drag-and-drop (or auto-assembles in a simplified flow — place parts automatically with brief build animation, then start cell animation).
- Reset: clear cell, stop animation, reset parts.

**Step 3: Populate electrolysis controls**

- Student mode: electrolyte dropdown from `SimEngine.Electrochem.ELECTROLYTES`. On change, auto-build cell and start animation.
- Teacher mode: show cation dropdown (metals from HALF_CELLS), anion dropdown (Cl, Br, I, SO₄, NO₃, OH), state toggle (molten/aqueous), concentration (dilute/moderate/concentrated), electrode type (inert/active). On change, call `predictElectrolysis()` and update display.

**Step 4: Wire mode toggle**

- Galvanic button: show galvanic controls, hide electrolysis controls, reset cell to galvanic rendering
- Electrolysis button: show electrolysis controls, hide galvanic controls, switch to electrolysis rendering

**Step 5: Wire activity series sidebar**

- Populate from `getActivitySeries()`. Each row shows metal name and E° value.
- When half-cells are selected, highlight both in the sidebar:
  - Anode = red highlight, label "anode"
  - Cathode = blue highlight, label "cathode"
  - Arrow between them showing electron flow direction

**Step 6: Wire live readout**

- `updateDisplay()` master function called when cell configuration changes:
  - Call `calculateCell()` for galvanic, or use preset data for electrolysis
  - Update E°cell, anode, cathode, cell notation, spontaneous readouts
  - For electrolysis: also update cathode/anode product readouts
  - Update activity series highlights

**Step 7: Wire header toggles**

- SL/HL: toggle `body.classList` 'hl-active', show/hide HL panel, show/hide Faraday inputs
- Teacher/Student: toggle `body.classList` 'teacher-mode', show/hide teacher electrolysis controls, show/hide quiz mode in calculator

**Step 8: Verify**

- Galvanic: select Zn and Cu → activity series highlights both → E°cell shows 1.10V → assemble builds cell
- Electrolysis: select NaCl molten → cell builds automatically → shows Na at cathode, Cl₂ at anode
- Mode toggle swaps correctly
- Teacher mode shows free electrolyte configuration

---

### Task 8: E° Calculator Panel

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html` (script section)

**Step 1: Build the half-cell table**

- Collapsible panel (same pattern as data collection panel toggle)
- Scrollable table of all half-cells, sorted by E° (most negative at top)
- Columns: Half-reaction, E° (V)
- Click a row to select it. First click = half-cell A (highlighted teal). Second click = half-cell B (highlighted blue). Third click = reset selections.

**Step 2: Build the calculation display**

When two half-cells selected:
- Show cathode half-reaction (reduction)
- Show anode half-reaction (reversed, oxidation)
- Show: E°cell = E°cathode − E°anode = [value] − [value] = [result] V
- Show cell notation
- Show: Spontaneous? Yes/No

**Step 3: Implement quiz mode**

- Toggle checkbox "Quiz mode"
- When enabled: hide the E°cell result. Show an input field and "Check" button.
- Student enters their calculated E°cell.
- On check: compare to correct answer (±0.01 tolerance).
  - Correct: green checkmark, increment score
  - Incorrect: red X, show correct answer
- Score tracker: "Correct: 7 / 10"
- "New pair" button to randomly select two half-cells for practice

**Step 4: Verify**

- Table displays all ~24 half-cells sorted by E°
- Clicking two rows shows correct calculation
- Quiz mode hides answer, accepts input, checks correctly
- Score tracks across multiple attempts

---

### Task 9: HL Panel -- Faraday's Law + ΔG°

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html` (script section)

**Step 1: Wire Faraday's law calculator**

HL panel (purple border, hidden until HL toggled):
- Current input: number field (id="faradayCurrent"), 0.1-10.0 A, step 0.1
- Time input: number field (id="faradayTime") + unit dropdown (seconds/minutes/hours)
- Half-reaction display: auto-populated from current cell selection (electrons and molar mass)
- Live readout updating on any input change:
  - Q = I × t = ___ C
  - Moles of e⁻ = Q / F = ___
  - Moles of product = moles e⁻ / n = ___
  - Mass of product = moles × M = ___ g
- Format: scientific notation for small values, 3 decimal places for mass

**Step 2: Wire ΔG° readout**

- Only shown when a galvanic cell is assembled
- Display: ΔG° = −nFE°cell = −[n] × 96485 × [E°cell] = ___ kJ/mol
- With values substituted from current cell

**Step 3: Additional HL readouts**

- Minimum voltage for electrolysis: |E°cell| (shown in electrolysis mode)
- Standard conditions reminder: "Standard conditions: 298 K, 1 mol L⁻¹, 1 atm"

**Step 4: Verify**

- Faraday: enter 2.0 A, 3600 s, with Cu²⁺ (2e⁻, 63.55 g/mol) → mass ≈ 2.371 g
- ΔG° for Zn/Cu cell: −212.27 kJ/mol
- Values update live as inputs change
- Panel hidden in SL mode

---

### Task 10: Data Collection Wiring

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html` (script section)

**Step 1: Register variables**

```javascript
SimEngine.DataCollector.registerVariables([
  { key: 'halfCellA',     label: 'Half-cell A',      getter: function() { return _selectedA ? _selectedA.formula : ''; }, default: true },
  { key: 'halfCellB',     label: 'Half-cell B',      getter: function() { return _selectedB ? _selectedB.formula : ''; }, default: true },
  { key: 'eCell',         label: 'E\u00B0cell (V)',   getter: function() { return _currentResult ? _currentResult.eCell : 0; }, default: true },
  { key: 'anode',         label: 'Anode',             getter: function() { return _currentResult ? _currentResult.anode.metal : ''; } },
  { key: 'cathode',       label: 'Cathode',           getter: function() { return _currentResult ? _currentResult.cathode.metal : ''; } },
  { key: 'spontaneous',   label: 'Spontaneous',       getter: function() { return _currentResult ? (_currentResult.spontaneous ? 'Yes' : 'No') : ''; } },
  { key: 'charge',        label: 'Charge (C)',        getter: function() { return _faradayResult ? _faradayResult.charge : 0; }, hl: true },
  { key: 'molesElectrons',label: 'Moles e\u207B',    getter: function() { return _faradayResult ? _faradayResult.molesElectrons : 0; }, hl: true },
  { key: 'massProduct',   label: 'Mass product (g)', getter: function() { return _faradayResult ? _faradayResult.massProduct : 0; }, hl: true }
]);
```

**Step 2: Wire data panel UI**

Same HTML structure and event listeners as other sims:
- Panel toggle, variable checkboxes (use `v.default` for defaults), start/stop/snapshot/download/clear buttons
- Since this sim is configuration-driven, data collection is snapshot-only:
  - "Start Collection" repurposed as "Record" — takes a snapshot of current configuration
  - Snapshot button works normally
- Sweep section (teacher only): iterate through all pairs from a selected set of metals
  - Sweep dropdown: pick 4-6 metals from a multi-select or checkboxes
  - Run Sweep: calculates E°cell for all unique pairs, records each as a row
  - Auto-downloads CSV

**Step 3: Verify**

- Snapshot: click with Zn/Cu cell → row appears in table with E°cell = 1.10
- Change to Mg/Ag → snapshot → new row with E°cell = 3.17
- Download CSV has correct headers and data
- Sweep: select Zn, Cu, Fe, Ag → generates 6 pairs, downloads CSV

---

### Task 11: Polish -- Responsive, Print, Keyboard, Edge Cases

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Electrochem.html`

**Step 1: Responsive layout**

- 900px breakpoint: single column (cell canvas full width, controls below)
- 600px breakpoint: smaller padding, smaller header font
- Parts tray wraps on narrow screens
- E° calculator table gets horizontal scroll on narrow screens

**Step 2: Print styles**

- Hide: controls, parts tray, buttons, toggles, data panel, animation
- Show: cell diagram (static frame), readouts, HL panel, E° calculator result
- Page break before HL panel

**Step 3: Keyboard shortcuts**

Teacher mode:
- Space: assemble cell (or start electrolysis)
- R: reset
- G: switch to galvanic mode
- E: switch to electrolysis mode
- H: toggle HL
- T: toggle teacher/student

**Step 4: Edge cases**

- Cannot select same half-cell for both A and B (disable in dropdown or show error)
- E° calculator: selecting same half-cell twice shows E°cell = 0 with "no potential difference" message
- Quiz mode: input validation (numbers only, reasonable range -6 to +6)
- Electrolysis teacher mode: if invalid combination (e.g., molten + active electrode), show appropriate message
- Parts tray: double-click a placed part to return it to tray

**Step 5: Verify**

- Layout works at 1200px, 800px, 500px widths
- Print preview shows cell diagram and readouts
- Keyboard shortcuts work in teacher mode
- No console errors across all half-cell combinations and all electrolyte presets
- No regression: Gas Laws, Equilibrium, and Acid-Base still work after Core.js changes

---

## Verification Checklist

1. Galvanic Zn/Cu: E°cell = +1.10 V, Zn = anode, Cu = cathode, spontaneous
2. Galvanic Mg/Ag: E°cell = +3.17 V, correctly identified
3. Cell notation: `Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)` format correct
4. Activity series: metals ranked correctly, highlights update with selection
5. Drag-and-drop: electrode and salt bridge snap to correct zones
6. Animation: electron flow, ion migration, dissolution/deposition all visible
7. Electrolysis NaCl molten: Na at cathode, Cl₂ at anode
8. Electrolysis CuSO₄ aqueous: Cu deposits at cathode, O₂ at anode
9. Electrolysis NaCl concentrated vs dilute: Cl₂ vs O₂ at anode
10. Active electrode: CuSO₄ with Cu electrodes — Cu dissolves at anode, deposits at cathode
11. Teacher build-your-own: discharge rules produce correct products
12. E° calculator: table sorted, click two → correct calculation
13. Quiz mode: correct/incorrect feedback, score tracking
14. Faraday's law (HL): 2.0 A, 3600 s, Cu²⁺ → mass ≈ 2.371 g
15. ΔG° (HL): Zn/Cu → −212.27 kJ/mol
16. Data collection: snapshot, sweep all work
17. Mode toggle: galvanic ↔ electrolysis swaps correctly
18. Responsive: works at 1200px, 800px, 500px
19. No regression: Gas Laws, Equilibrium, Acid-Base still work

---

## Critical Files

| File | Path | Purpose |
|------|------|---------|
| SimEngine_Core.js | `3-Resources/SimEngine/SimEngine_Core.js` | Add Electrochem module |
| SimEngine_Electrochem.html | `1-Projects/SimEngine/SimEngine_Electrochem.html` | New deliverable |
| Design doc | `docs/plans/2026-04-01-electrochemistry-design.md` | Reference |
