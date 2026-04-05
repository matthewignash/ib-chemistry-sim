# Acid-Base Titration Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an acid-base titration simulator with real-time pH curve, particle dissociation view, indicator color changes, and HL extensions (Henderson-Hasselbalch, derivative, polyprotic).

**Architecture:** New `SimEngine.Titration` module in `SimEngine_Core.js` handles all pH math, acid/base database, and curve precomputation. The HTML file `SimEngine_AcidBase.html` provides the UI: particle canvas, pH curve graph, controls, and data collection panel. The particle view uses simple sprite animation (not physics), with counts derived from the math engine.

**Tech Stack:** Vanilla JS, CSV via Blob + URL.createObjectURL, no external libraries.

**Design doc:** `docs/plans/2026-03-31-acidbase-design.md`

---

### Task 1: Titration Module -- Acid/Base Database + Init

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (append after DataCollector module, ~line 2028)

**Step 1: Add the Titration module scaffold with acid/base database**

Append to `SimEngine_Core.js` after the DataCollector module:

```javascript
// MODULE 7: TITRATION
// pH calculation engine for acid-base titrations.
// Precomputes full titration curves from acid/base
// properties, concentrations, and volumes.
SimEngine.Titration = (function () {

  // ── Acid/Base Database ────────────────────────

  var Kw = 1.0e-14;

  var ACIDS = {
    HCl:      { name: 'Hydrochloric acid', formula: 'HCl',      strong: true,  Ka: [Infinity],                   hl: false },
    H2SO4:    { name: 'Sulfuric acid',     formula: 'H\u2082SO\u2084', strong: true, Ka: [Infinity, 0.012],       hl: true  },
    HNO3:     { name: 'Nitric acid',       formula: 'HNO\u2083',  strong: true,  Ka: [Infinity],                   hl: false },
    CH3COOH:  { name: 'Acetic acid',       formula: 'CH\u2083COOH', strong: false, Ka: [1.8e-5],                  hl: false },
    H3PO4:    { name: 'Phosphoric acid',   formula: 'H\u2083PO\u2084', strong: false, Ka: [7.5e-3, 6.2e-8, 4.8e-13], hl: true },
    citric:   { name: 'Citric acid',       formula: 'C\u2086H\u2088O\u2087', strong: false, Ka: [7.4e-4, 1.7e-5, 4.0e-7], hl: true }
  };

  var BASES = {
    NaOH:   { name: 'Sodium hydroxide',  formula: 'NaOH',        strong: true,  Kb: Infinity,  hl: false },
    KOH:    { name: 'Potassium hydroxide', formula: 'KOH',       strong: true,  Kb: Infinity,  hl: false },
    NH3:    { name: 'Ammonia',            formula: 'NH\u2083',    strong: false, Kb: 1.8e-5,   hl: false },
    Na2CO3: { name: 'Sodium carbonate',   formula: 'Na\u2082CO\u2083', strong: false, Kb: 2.1e-4, hl: false }
  };

  var PRESETS = [
    { label: 'Strong acid / Strong base',   acidKey: 'HCl',     baseKey: 'NaOH',  acidConc: 0.10, baseConc: 0.10, acidVol: 25 },
    { label: 'Weak acid / Strong base',     acidKey: 'CH3COOH', baseKey: 'NaOH',  acidConc: 0.10, baseConc: 0.10, acidVol: 25 },
    { label: 'Strong acid / Weak base',     acidKey: 'HCl',     baseKey: 'NH3',   acidConc: 0.10, baseConc: 0.10, acidVol: 25 },
    { label: 'Weak acid / Weak base',       acidKey: 'CH3COOH', baseKey: 'NH3',   acidConc: 0.10, baseConc: 0.10, acidVol: 25 }
  ];

  var INDICATORS = {
    none:             { name: 'None',              pHLow: 0,   pHHigh: 14,  colorLow: null,      colorHigh: null     },
    phenolphthalein:  { name: 'Phenolphthalein',   pHLow: 8.2, pHHigh: 10.0, colorLow: '#F8FAFC', colorHigh: '#EC4899' },
    methylOrange:     { name: 'Methyl orange',     pHLow: 3.1, pHHigh: 4.4, colorLow: '#EF4444', colorHigh: '#EAB308' },
    bromothymolBlue:  { name: 'Bromothymol blue',  pHLow: 6.0, pHHigh: 7.6, colorLow: '#EAB308', colorHigh: '#3B82F6' }
  };

  // ── State ─────────────────────────────────────

  var _acid = null;       // acid object from ACIDS
  var _base = null;       // base object from BASES
  var _acidKey = '';
  var _baseKey = '';
  var _acidConc = 0.10;   // mol/L
  var _baseConc = 0.10;   // mol/L
  var _acidVol = 25;      // mL
  var _curve = [];        // precomputed [{volume, pH, pOH, hConc, ohConc, region, haConc, aConc}]
  var _maxVol = 50;       // mL max titrant

  // ── Init ──────────────────────────────────────

  function init(config) {
    _acidKey  = config.acidKey  || 'HCl';
    _baseKey  = config.baseKey  || 'NaOH';
    _acidConc = config.acidConc || 0.10;
    _baseConc = config.baseConc || 0.10;
    _acidVol  = config.acidVol  || 25;
    _acid = ACIDS[_acidKey];
    _base = BASES[_baseKey];
    _maxVol = (_acidConc * _acidVol / _baseConc) * 2.5; // 2.5x equivalence
    if (_maxVol < 10) _maxVol = 10;
    if (_maxVol > 100) _maxVol = 100;
    _curve = [];
    computeCurve();
  }

  return {
    ACIDS:      ACIDS,
    BASES:      BASES,
    PRESETS:    PRESETS,
    INDICATORS: INDICATORS,
    Kw:         Kw,
    init:       init
  };

})();
```

**Step 2: Verify**

In browser console: `SimEngine.Titration.ACIDS.HCl` returns the HCl object. `SimEngine.Titration.init({ acidKey: 'HCl', baseKey: 'NaOH' })` runs without error.

---

### Task 2: pH Calculation Engine -- Strong/Strong and Weak/Strong

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (Titration module, before the return statement)

**Step 1: Add pH calculation functions for monoprotic acids**

Inside the Titration IIFE, before the return statement, add:

```javascript
  // ── pH Calculation Helpers ────────────────────

  function _clampPH(pH) {
    return Math.max(0, Math.min(14, pH));
  }

  // Solve quadratic: x^2 + Ka*x - Ka*C = 0 for weak acid initial pH
  function _weakAcidPH(Ka, C) {
    if (C <= 0) return 7;
    var disc = Ka * Ka + 4 * Ka * C;
    var x = (-Ka + Math.sqrt(disc)) / 2;
    return _clampPH(-Math.log10(Math.max(x, 1e-15)));
  }

  // Solve for pH of a weak base with concentration C
  function _weakBasePH(Kb, C) {
    if (C <= 0) return 7;
    var disc = Kb * Kb + 4 * Kb * C;
    var x = (-Kb + Math.sqrt(disc)) / 2;
    var pOH = -Math.log10(Math.max(x, 1e-15));
    return _clampPH(14 - pOH);
  }

  // Henderson-Hasselbalch
  function _hendersonHasselbalch(pKa, concA, concHA) {
    if (concHA <= 0 || concA <= 0) return null;
    return pKa + Math.log10(concA / concHA);
  }

  // ── pH at a given volume of titrant ───────────

  function _pHAtVolume_SA_SB(vol) {
    // Strong acid titrated with strong base
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000; // in L

    if (molBase < molAcid - 1e-12) {
      // Before equivalence: excess H+
      var excessH = (molAcid - molBase) / totalVol;
      return { pH: _clampPH(-Math.log10(excessH)), region: vol < 0.5 ? 'initial' : 'pre-equiv' };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      // At equivalence
      return { pH: 7.0, region: 'equivalence' };
    } else {
      // After equivalence: excess OH-
      var excessOH = (molBase - molAcid) / totalVol;
      var pOH = -Math.log10(excessOH);
      return { pH: _clampPH(14 - pOH), region: 'excess' };
    }
  }

  function _pHAtVolume_WA_SB(vol) {
    // Weak acid titrated with strong base
    var Ka = _acid.Ka[0];
    var pKa = -Math.log10(Ka);
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (vol < 0.01) {
      // Initial: just the weak acid
      return { pH: _weakAcidPH(Ka, _acidConc), region: 'initial' };
    } else if (molBase < molAcid - 1e-12) {
      // Buffer region: Henderson-Hasselbalch
      var concHA = (molAcid - molBase) / totalVol;
      var concA  = molBase / totalVol;
      var pH = _hendersonHasselbalch(pKa, concA, concHA);
      // Determine if near half-equiv
      var halfEquivVol = molAcid / _baseConc * 1000 / 2;
      var region = (Math.abs(vol - halfEquivVol) < 0.5) ? 'half-equiv' : 'buffer';
      return { pH: _clampPH(pH), region: region };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      // At equivalence: hydrolysis of conjugate base
      var Cb = molAcid / totalVol; // concentration of A-
      var Kb = Kw / Ka;
      return { pH: _weakBasePH(Kb, Cb), region: 'equivalence' };
    } else {
      // After equivalence: excess OH-
      var excessOH = (molBase - molAcid) / totalVol;
      var pOH = -Math.log10(excessOH);
      return { pH: _clampPH(14 - pOH), region: 'excess' };
    }
  }

  function _pHAtVolume_SA_WB(vol) {
    // Strong acid in flask, weak base as titrant
    // Reframe: strong acid excess until neutralized, then weak base conjugate acid hydrolysis
    var Kb = _base.Kb;
    var Ka_conj = Kw / Kb; // Ka of conjugate acid
    var pKa_conj = -Math.log10(Ka_conj);
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (vol < 0.01) {
      // Initial: strong acid only
      return { pH: _clampPH(-Math.log10(_acidConc)), region: 'initial' };
    } else if (molBase < molAcid - 1e-12) {
      // Before equivalence: excess H+ (but also forming conjugate acid salt)
      var excessH = (molAcid - molBase) / totalVol;
      return { pH: _clampPH(-Math.log10(excessH)), region: 'pre-equiv' };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      // At equivalence: conjugate acid hydrolysis
      var Cconj = molBase / totalVol;
      return { pH: _weakAcidPH(Ka_conj, Cconj), region: 'equivalence' };
    } else {
      // After equivalence: buffer of weak base + conjugate acid
      var concB   = (molBase - molAcid) / totalVol;
      var concBH  = molAcid / totalVol;
      // pH = 14 - pKb - log(concBH/concB) = pKa_conj + log(concB/concBH)
      var pH = pKa_conj + Math.log10(concB / concBH);
      var halfEquivVol = molAcid / _baseConc * 1000;
      var pastHalf = (vol - halfEquivVol);
      var totalExcess = _maxVol - halfEquivVol;
      var region = (pastHalf > 0 && pastHalf < totalExcess * 0.5) ? 'buffer' : 'excess';
      return { pH: _clampPH(pH), region: region };
    }
  }

  function _pHAtVolume_WA_WB(vol) {
    // Weak acid in flask, weak base as titrant
    var Ka = _acid.Ka[0];
    var Kb = _base.Kb;
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (vol < 0.01) {
      return { pH: _weakAcidPH(Ka, _acidConc), region: 'initial' };
    } else if (molBase < molAcid - 1e-12) {
      // Buffer region
      var concHA = (molAcid - molBase) / totalVol;
      var concA  = molBase / totalVol;
      var pKa = -Math.log10(Ka);
      var pH = _hendersonHasselbalch(pKa, concA, concHA);
      return { pH: _clampPH(pH), region: 'buffer' };
    } else if (Math.abs(molBase - molAcid) < 1e-12) {
      // At equivalence: pH depends on both Ka and Kb
      // pH = 7 + (pKa - pKb) / 2  (approximate for dilute)
      var pKa = -Math.log10(Ka);
      var pKb = -Math.log10(Kb);
      var pH = 7 + (pKa - pKb) / 2;
      return { pH: _clampPH(pH), region: 'equivalence' };
    } else {
      // After equivalence: excess weak base
      var excessBase = (molBase - molAcid) / totalVol;
      return { pH: _weakBasePH(Kb, excessBase), region: 'excess' };
    }
  }
```

**Step 2: Add the unified getPHAtVolume dispatcher and computeCurve**

```javascript
  // ── Dispatcher ────────────────────────────────

  function _getPHAtVolume(vol) {
    var acidStrong = _acid.strong;
    var baseStrong = _base.strong;

    var result;
    if (acidStrong && baseStrong)       result = _pHAtVolume_SA_SB(vol);
    else if (!acidStrong && baseStrong) result = _pHAtVolume_WA_SB(vol);
    else if (acidStrong && !baseStrong) result = _pHAtVolume_SA_WB(vol);
    else                                result = _pHAtVolume_WA_WB(vol);

    // Enrich with derived quantities
    var pH = result.pH;
    var pOH = 14 - pH;
    var hConc = Math.pow(10, -pH);
    var ohConc = Math.pow(10, -pOH);

    // HA and A- concentrations (for weak acid cases)
    var haConc = 0;
    var aConc = 0;
    if (!_acid.strong) {
      var molAcid = _acidConc * _acidVol / 1000;
      var molBase = _baseConc * vol / 1000;
      var totalVol = (_acidVol + vol) / 1000;
      haConc = Math.max(0, (molAcid - molBase) / totalVol);
      aConc  = Math.min(molAcid, molBase) / totalVol;
    }

    return {
      volume:  vol,
      pH:      pH,
      pOH:     pOH,
      hConc:   hConc,
      ohConc:  ohConc,
      haConc:  haConc,
      aConc:   aConc,
      region:  result.region
    };
  }

  // ── Precompute full curve ─────────────────────

  function computeCurve() {
    _curve = [];
    var step = 0.1;
    for (var v = 0; v <= _maxVol + step / 2; v += step) {
      _curve.push(_getPHAtVolume(Math.round(v * 10) / 10));
    }
    return _curve;
  }

  function getCurve() {
    return _curve.slice();
  }

  function getPHAtVolume(vol) {
    return _getPHAtVolume(vol);
  }

  function getMaxVolume() {
    return _maxVol;
  }
```

**Step 3: Update the return statement to expose new methods**

```javascript
  return {
    ACIDS:          ACIDS,
    BASES:          BASES,
    PRESETS:        PRESETS,
    INDICATORS:     INDICATORS,
    Kw:             Kw,
    init:           init,
    computeCurve:   computeCurve,
    getCurve:       getCurve,
    getPHAtVolume:  getPHAtVolume,
    getMaxVolume:   getMaxVolume
  };
```

**Step 4: Verify**

In browser console:
```javascript
SimEngine.Titration.init({ acidKey: 'HCl', baseKey: 'NaOH', acidConc: 0.10, baseConc: 0.10, acidVol: 25 });
var pt = SimEngine.Titration.getPHAtVolume(0);
// Should return pH ~ 1.0 (strong acid 0.1M)

pt = SimEngine.Titration.getPHAtVolume(25);
// Should return pH = 7.0 (equivalence of SA/SB)

pt = SimEngine.Titration.getPHAtVolume(50);
// Should return pH ~ 13 (excess strong base)

SimEngine.Titration.init({ acidKey: 'CH3COOH', baseKey: 'NaOH', acidConc: 0.10, baseConc: 0.10, acidVol: 25 });
pt = SimEngine.Titration.getPHAtVolume(12.5);
// Should return pH ~ 4.74 (half-equivalence, pH = pKa)

pt = SimEngine.Titration.getPHAtVolume(25);
// Should return pH ~ 8.7 (equivalence of WA/SB, basic due to hydrolysis)
```

---

### Task 3: Equivalence Points, Half-Equivalence, Buffer Range, Derivative

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (Titration module)

**Step 1: Add analysis methods**

Inside the Titration IIFE, before the return statement:

```javascript
  // ── Analysis Methods ──────────────────────────

  function getEquivalencePoints() {
    // For monoprotic: one equivalence point
    // For polyprotic: one per proton (HL)
    var nProtons = _acid.Ka.length;
    var points = [];
    for (var p = 1; p <= nProtons; p++) {
      var eqVol = (_acidConc * _acidVol * p) / _baseConc;
      // Find pH at this volume from curve
      var pt = _getPHAtVolume(eqVol);
      points.push({ volume: eqVol, pH: pt.pH, proton: p });
    }
    return points;
  }

  function getHalfEquivalencePoints() {
    // Only meaningful for weak acid / strong base
    if (_acid.strong) return [];
    var nProtons = _acid.Ka.length;
    var points = [];
    for (var p = 0; p < nProtons; p++) {
      var eqVol = (_acidConc * _acidVol * (p + 1)) / _baseConc;
      var prevEqVol = p > 0 ? (_acidConc * _acidVol * p) / _baseConc : 0;
      var halfVol = (prevEqVol + eqVol) / 2;
      var pKa = -Math.log10(_acid.Ka[p]);
      points.push({ volume: halfVol, pH: pKa, pKa: pKa, proton: p + 1 });
    }
    return points;
  }

  function getBufferRange() {
    // Buffer region for WA/SB: from ~10% to ~90% of equivalence volume
    if (_acid.strong && _base.strong) return null;
    var eqVol = (_acidConc * _acidVol) / _baseConc;
    return { startVol: eqVol * 0.1, endVol: eqVol * 0.9 };
  }

  function getDerivative() {
    // First derivative dpH/dV from precomputed curve
    var deriv = [];
    for (var i = 1; i < _curve.length; i++) {
      var dV = _curve[i].volume - _curve[i - 1].volume;
      var dpH = _curve[i].pH - _curve[i - 1].pH;
      if (dV > 0) {
        deriv.push({
          volume: (_curve[i].volume + _curve[i - 1].volume) / 2,
          dPHdV: dpH / dV
        });
      }
    }
    return deriv;
  }

  function getHendersonHasselbalch(vol) {
    if (_acid.strong) return null;
    var Ka = _acid.Ka[0];
    var pKa = -Math.log10(Ka);
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    if (molBase >= molAcid) return null; // past equivalence
    var concHA = (molAcid - molBase) / totalVol;
    var concA  = molBase / totalVol;
    if (concHA <= 0 || concA <= 0) return null;

    var ratioLog = Math.log10(concA / concHA);
    return {
      pKa: pKa,
      concA: concA,
      concHA: concHA,
      ratioLog: ratioLog,
      pH: pKa + ratioLog
    };
  }
```

**Step 2: Add species counts for particle view**

```javascript
  // ── Species Counts for Particle View ──────────

  function getSpeciesCounts(vol, maxParticles) {
    maxParticles = maxParticles || 80;
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;
    var pt = _getPHAtVolume(vol);

    var HA = 0, Hplus = 0, Aminus = 0, OHminus = 0, water = 0, spectator = 0;

    if (_acid.strong) {
      // Strong acid: fully dissociated, no HA
      if (molBase < molAcid) {
        Hplus = molAcid - molBase;
        Aminus = molAcid;
        spectator = molBase;
      } else {
        Aminus = molAcid;
        OHminus = molBase - molAcid;
        spectator = molAcid;
        water = Math.min(molAcid, molBase);
      }
    } else {
      // Weak acid: equilibrium between HA and H+/A-
      var concHA = pt.haConc;
      var concA  = pt.aConc;
      HA = concHA * totalVol;
      Aminus = concA * totalVol;
      Hplus = pt.hConc * totalVol;
      OHminus = pt.ohConc * totalVol;
      spectator = Math.min(molBase, molAcid);
      water = Math.min(molAcid, molBase) - Aminus;
      if (water < 0) water = 0;
    }

    // Normalize to maxParticles
    var total = HA + Hplus + Aminus + OHminus + spectator;
    if (total <= 0) return { HA: 0, H: 0, A: 0, OH: 0, water: 0, spectator: 0 };
    var scale = maxParticles / total;

    return {
      HA:        Math.round(HA * scale),
      H:         Math.max(0, Math.round(Hplus * scale)),
      A:         Math.round(Aminus * scale),
      OH:        Math.max(0, Math.round(OHminus * scale)),
      water:     Math.round(Math.min(water * scale, 10)), // cap water flashes
      spectator: Math.round(spectator * scale * 0.3)      // subtle
    };
  }
```

**Step 3: Update the return statement**

```javascript
  return {
    ACIDS:                    ACIDS,
    BASES:                    BASES,
    PRESETS:                  PRESETS,
    INDICATORS:               INDICATORS,
    Kw:                       Kw,
    init:                     init,
    computeCurve:             computeCurve,
    getCurve:                 getCurve,
    getPHAtVolume:            getPHAtVolume,
    getMaxVolume:             getMaxVolume,
    getEquivalencePoints:     getEquivalencePoints,
    getHalfEquivalencePoints: getHalfEquivalencePoints,
    getBufferRange:           getBufferRange,
    getDerivative:            getDerivative,
    getHendersonHasselbalch:  getHendersonHasselbalch,
    getSpeciesCounts:         getSpeciesCounts
  };
```

**Step 4: Verify**

```javascript
SimEngine.Titration.init({ acidKey: 'CH3COOH', baseKey: 'NaOH', acidConc: 0.10, baseConc: 0.10, acidVol: 25 });
SimEngine.Titration.getEquivalencePoints();
// [{volume: 25, pH: ~8.7, proton: 1}]

SimEngine.Titration.getHalfEquivalencePoints();
// [{volume: 12.5, pH: ~4.74, pKa: 4.74, proton: 1}]

SimEngine.Titration.getBufferRange();
// {startVol: 2.5, endVol: 22.5}

SimEngine.Titration.getHendersonHasselbalch(12.5);
// {pKa: 4.74, concA: ~0.033, concHA: ~0.033, ratioLog: 0, pH: 4.74}

SimEngine.Titration.getSpeciesCounts(0, 80);
// {HA: ~high, H: ~small, A: ~small, OH: 0, water: 0, spectator: 0}

SimEngine.Titration.getDerivative().length;
// ~500 points
```

---

### Task 4: Polyprotic Acid Support (HL)

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (Titration module)

**Step 1: Add polyprotic pH calculation**

Inside the Titration IIFE, add a new function for polyprotic acids:

```javascript
  // ── Polyprotic Acid Titration (HL) ────────────

  function _pHAtVolume_polyprotic_SB(vol) {
    // Polyprotic weak acid titrated with strong base
    // Uses sequential proton loss: Ka1, Ka2, Ka3...
    var Kas = _acid.Ka;
    var nProtons = Kas.length;
    var molAcid = _acidConc * _acidVol / 1000;
    var molBase = _baseConc * vol / 1000;
    var totalVol = (_acidVol + vol) / 1000;

    // Determine which equivalence region we're in
    var eqMols = []; // cumulative moles of base at each equivalence
    for (var p = 0; p < nProtons; p++) {
      eqMols.push(molAcid * (p + 1));
    }

    if (vol < 0.01) {
      // Initial: just the polyprotic acid with Ka1
      return { pH: _weakAcidPH(Kas[0], _acidConc), region: 'initial' };
    }

    // Find which proton we're neutralizing
    var protonIndex = 0;
    for (var p = 0; p < nProtons; p++) {
      if (molBase < eqMols[p] + 1e-12) {
        protonIndex = p;
        break;
      }
      if (p === nProtons - 1) {
        protonIndex = nProtons; // past all equivalences
      }
    }

    if (protonIndex >= nProtons) {
      // Past all equivalence points: excess OH-
      var excessOH = (molBase - eqMols[nProtons - 1]) / totalVol;
      if (excessOH < 1e-12) {
        // Exactly at last equivalence
        var Kb = Kw / Kas[nProtons - 1];
        var Cb = molAcid / totalVol;
        return { pH: _weakBasePH(Kb, Cb), region: 'equivalence' };
      }
      var pOH = -Math.log10(excessOH);
      return { pH: _clampPH(14 - pOH), region: 'excess' };
    }

    // Check if at an equivalence point
    if (Math.abs(molBase - eqMols[protonIndex]) < 1e-12) {
      // At equivalence point for proton (protonIndex + 1)
      // pH from amphiprotic species: pH = (pKa_n + pKa_n+1) / 2
      if (protonIndex < nProtons - 1) {
        var pKa1 = -Math.log10(Kas[protonIndex]);
        var pKa2 = -Math.log10(Kas[protonIndex + 1]);
        return { pH: _clampPH((pKa1 + pKa2) / 2), region: 'equivalence' };
      } else {
        // Last equivalence: hydrolysis
        var Kb = Kw / Kas[protonIndex];
        var Cb = molAcid / totalVol;
        return { pH: _weakBasePH(Kb, Cb), region: 'equivalence' };
      }
    }

    // In buffer region for current proton
    var prevEqMol = protonIndex > 0 ? eqMols[protonIndex - 1] : 0;
    var molesThisProton = molBase - prevEqMol;
    var Ka = Kas[protonIndex];
    var pKa = -Math.log10(Ka);
    var concAcidForm = (molAcid - molesThisProton) / totalVol;
    var concBaseForm = molesThisProton / totalVol;

    if (concAcidForm <= 0 || concBaseForm <= 0) {
      return { pH: _weakAcidPH(Ka, _acidConc), region: 'buffer' };
    }

    var pH = _hendersonHasselbalch(pKa, concBaseForm, concAcidForm);
    // Check if near half-equivalence
    var halfMol = (prevEqMol + eqMols[protonIndex]) / 2;
    var isHalf = Math.abs(molBase - halfMol) < molAcid * 0.02;
    return { pH: _clampPH(pH), region: isHalf ? 'half-equiv' : 'buffer' };
  }
```

**Step 2: Update the dispatcher to use polyprotic for multi-Ka acids**

Update `_getPHAtVolume` dispatcher:

```javascript
  function _getPHAtVolume(vol) {
    var acidStrong = _acid.strong;
    var baseStrong = _base.strong;
    var isPolyprotic = _acid.Ka.length > 1;

    var result;
    if (isPolyprotic && baseStrong) {
      result = _pHAtVolume_polyprotic_SB(vol);
    } else if (acidStrong && baseStrong) {
      result = _pHAtVolume_SA_SB(vol);
    } else if (!acidStrong && baseStrong) {
      result = _pHAtVolume_WA_SB(vol);
    } else if (acidStrong && !baseStrong) {
      result = _pHAtVolume_SA_WB(vol);
    } else {
      result = _pHAtVolume_WA_WB(vol);
    }

    // Enrich with derived quantities (same as before)
    var pH = result.pH;
    var pOH = 14 - pH;
    var hConc = Math.pow(10, -pH);
    var ohConc = Math.pow(10, -pOH);

    var haConc = 0;
    var aConc = 0;
    if (!_acid.strong) {
      var molAcid = _acidConc * _acidVol / 1000;
      var molBase = _baseConc * vol / 1000;
      var totalVol = (_acidVol + vol) / 1000;
      haConc = Math.max(0, (molAcid - Math.min(molBase, molAcid)) / totalVol);
      aConc  = Math.min(molAcid, molBase) / totalVol;
    }

    return {
      volume:  vol,
      pH:      pH,
      pOH:     pOH,
      hConc:   hConc,
      ohConc:  ohConc,
      haConc:  haConc,
      aConc:   aConc,
      region:  result.region
    };
  }
```

**Step 3: Verify**

```javascript
SimEngine.Titration.init({ acidKey: 'H3PO4', baseKey: 'NaOH', acidConc: 0.10, baseConc: 0.10, acidVol: 25 });
SimEngine.Titration.getEquivalencePoints();
// Should return 3 equivalence points at 25, 50, 75 mL

SimEngine.Titration.getHalfEquivalencePoints();
// Should return 3 half-equivalence points

var curve = SimEngine.Titration.getCurve();
// Should show 3 steep rises in pH
```

---

### Task 5: HTML Scaffold -- Layout, CSS, Header, Canvas

**Files:**
- Create: `1-Projects/SimEngine/SimEngine_AcidBase.html`

**Step 1: Create the HTML file with CSS and basic structure**

Create `SimEngine_AcidBase.html` with:
- All CSS from the style guide (same `:root` tokens, header, cards, sliders, buttons, toggles, info readout, graph canvas, HL panel, data panel, print, responsive)
- Additional CSS for titration-specific elements:
  - `.titration-btns` — row of Add Drop / Stream / Reset buttons
  - `.ph-readout` — large pH display (font-size 2rem, Fira Code, teal color)
  - `.volume-readout` — volume display next to pH
  - `.region-badge` — small colored badge showing current region name
  - `.beaker-canvas-wrap` — wrapper for the particle beaker canvas
  - `.indicator-legend` — small color key for indicator

- HTML structure:
  - Header: "Acid-Base Titration Explorer", subtitle "IB Chemistry SimEngine -- Reactivity 3.1", SL/HL toggle, Teacher/Student toggle
  - sim-top-row: particle canvas card (left) + control panel card (right, 300px)
  - Full-width pH curve graph card
  - HL panel card
  - Footer

- Particle canvas: `id="beakerCanvas"`, 400x400 internal resolution
- pH graph canvas: `id="phCurveCanvas"`, full width
- Control panel contents:
  - Preset dropdown (`id="presetSelect"`)
  - Acid dropdown (`id="acidSelect"`) + concentration input (`id="acidConc"`)
  - Base dropdown (`id="baseSelect"`) + concentration input (`id="baseConc"`)
  - Indicator dropdown (`id="indicatorSelect"`)
  - pH readout (`id="phReadout"`) + volume readout (`id="volReadout"`)
  - Region badge (`id="regionBadge"`)
  - Titration buttons: Add Drop (`id="btnAddDrop"`), Stream (`id="btnStream"`), Reset (`id="btnReset"`)
  - Info readout section: equivalence volume, current region
  - Data collection panel (same HTML structure as Gas Laws / Equilibrium)

- HL panel: Ka, Kb, pKa, [H+], [OH-], Henderson-Hasselbalch readout

- Script tag loading `SimEngine_Core.js`

**Step 2: Add the basic JavaScript IIFE scaffold**

Inside `<script>`, create the IIFE with:
- Canvas setup (HiDPI) for beaker canvas and pH curve canvas
- DEFAULTS object
- State initialization
- Titration module init with first preset

**Step 3: Verify**

Page loads without errors. Header, cards, and canvas placeholders visible. `SimEngine.Titration.getCurve()` returns data.

---

### Task 6: Controls -- Dropdowns, Presets, Concentrations, Buttons

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_AcidBase.html` (script section)

**Step 1: Build controls dynamically**

- Preset dropdown: populated from `SimEngine.Titration.PRESETS`. On change, sets acid/base/concentration fields and calls `SimEngine.Titration.init()`.
- Acid dropdown: populated from `SimEngine.Titration.ACIDS`. In student mode, only non-HL acids. In teacher mode, all acids.
- Base dropdown: populated from `SimEngine.Titration.BASES`.
- Concentration inputs: In student mode, display as read-only text showing the preset value. In teacher mode, number inputs (0.01-2.0, step 0.01).
- Indicator dropdown: populated from `SimEngine.Titration.INDICATORS`.

**Step 2: Wire titration action buttons**

- `btnAddDrop`: adds 0.5 mL to current volume. Updates `_currentVol`, calls `updateDisplay()`.
- `btnStream`: on mousedown/touchstart, starts an interval adding 0.1 mL every 50ms (~2 mL/sec). On mouseup/touchend, clears interval.
- `btnReset`: sets `_currentVol = 0`, clears graph points, calls `updateDisplay()`.

**Step 3: Wire volume slider (teacher mode)**

- In teacher mode: show a volume slider (0 to maxVol, step 0.1). On input, set `_currentVol` and call `updateDisplay()`.
- In student mode: hide slider, show drop buttons.

**Step 4: Wire header toggles**

- SL/HL toggle: shows/hides HL panel, HL acids in dropdown, derivative toggle, indicator overlay.
- Teacher/Student toggle: switches between drop buttons and slider, read-only vs editable concentrations, preset-only vs full dropdowns.

**Step 5: Verify**

Preset dropdown changes acid/base selections. Add Drop increments volume. Stream adds continuously while held. Reset returns to 0. Teacher mode shows slider and concentration inputs.

---

### Task 7: pH Curve Graph -- Rendering, Annotations, HL Derivative

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_AcidBase.html` (script section)

**Step 1: Create the pH curve graph**

Use `SimEngine.Graph.create()` for the pH curve:
- x-axis: Volume added (mL), range 0 to maxVol
- y-axis: pH, range 0 to 14 (fixed, no auto-scale)
- Series: 'curve' (teal, lineWidth 2.5)

**Step 2: Implement curve rendering**

- `updateGraph()` function:
  - In student mode (drop-by-drop): add points to the series up to `_currentVol`. Each drop adds a new point.
  - In teacher mode (slider): clear and redraw the full precomputed curve, plus a dot marker at `_currentVol`.

**Step 3: Add region annotations**

After `graph.draw()`, draw directly on the graph's canvas context:
- Calculate pixel coordinates for region boundaries using the graph's axis mapping
- Draw semi-transparent colored rectangles for each region:
  - Initial: light blue (`rgba(59,130,246,0.08)`)
  - Buffer: light green (`rgba(5,150,105,0.08)`)
  - Excess: light orange (`rgba(217,119,6,0.08)`)
- Draw vertical dashed line at each equivalence point (red, labeled with volume and pH)
- Region labels as small text at top of each zone

**Step 4: Add HL derivative overlay**

When HL enabled and derivative toggle is on:
- Add second series 'derivative' (purple, lineWidth 1.5)
- Plot `getDerivative()` data
- Use a secondary y-axis scale (auto-scaled to derivative max)

**Step 5: Add HL indicator range overlay**

When an indicator is selected and HL is enabled:
- Draw a horizontal band on the pH axis at the indicator's transition range
- Color the band with a gradient from colorLow to colorHigh
- Small label with indicator name

**Step 6: Verify**

- SA/SB: S-shaped curve with steep rise at equivalence (pH 7)
- WA/SB: curve starts higher (~2.9), gradual buffer region, steep rise to ~8.7 at equivalence
- Equivalence point marked correctly
- Regions color-coded
- HL derivative shows spike at equivalence
- Indicator band visible in HL mode

---

### Task 8: Particle View -- Beaker Canvas with Sprite Animation

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_AcidBase.html` (script section)

**Step 1: Implement particle sprite system**

Create a simple particle manager (inside the IIFE, not a Core module):
- Array of particle objects: `{ x, y, vx, vy, type, alpha, life }`
- Types: 'HA' (acid molecule), 'H' (H+ ion), 'A' (conjugate base), 'OH' (OH-), 'water' (flash), 'spectator'
- Colors: HA = `#64748B` (grey), H = `#EF4444` (red), A = `#3B82F6` (blue), OH = `#60A5FA` (light blue), water = `#0D9488` (teal flash), spectator = `#CBD5E1` (light grey)
- Sizes: H and OH = 3px radius, HA = 5px, A = 4px, spectator = 3px, water = 6px (briefly)

**Step 2: Implement Brownian motion + annihilation**

- Each frame: nudge each particle by small random velocity (Brownian motion)
- Keep particles within beaker bounds (rectangular, with rounded bottom)
- When an H+ and OH- particle overlap (distance < sum of radii): remove both, spawn a 'water' particle with `life = 30` frames that fades out
- Water particles shrink and fade over their lifetime, then are removed

**Step 3: Implement particle count sync**

- `syncParticles(vol)` function:
  - Call `SimEngine.Titration.getSpeciesCounts(vol, 80)`
  - Compare current particle counts by type to target counts
  - Add missing particles at random positions (OH- particles appear at top of beaker)
  - Remove excess particles randomly
  - Called whenever volume changes (each drop)

**Step 4: Implement beaker rendering**

- Draw beaker outline: trapezoid shape (wider at top)
- Fill with indicator color based on current pH and selected indicator:
  - Interpolate between colorLow and colorHigh across the indicator's pH range
  - Below pHLow: solid colorLow. Above pHHigh: solid colorHigh. Between: linear interpolation.
- Draw particles on top
- Draw legend (same pattern as Equilibrium)

**Step 5: Animation loop**

- `requestAnimationFrame` loop for the beaker canvas only
- Each frame: update Brownian motion, check annihilation, render beaker + particles
- This runs independently of the titration volume (particles drift continuously)

**Step 6: Verify**

- At vol=0 with weak acid: see mix of HA and H+/A- particles
- At vol=0 with strong acid: see only H+ and A- (no HA)
- Adding drops: OH- appear at top, drift down, annihilate with H+
- Near equivalence: very few H+ left, mostly A-
- Past equivalence: OH- particles accumulate
- Flask color changes with indicator selection

---

### Task 9: Info Panel, HL Panel, Henderson-Hasselbalch

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_AcidBase.html` (script section)

**Step 1: Wire info readout**

- `updateDisplay()` master function called on every volume change:
  - Get pH at current volume from `SimEngine.Titration.getPHAtVolume(_currentVol)`
  - Update pH readout (large text)
  - Update volume readout
  - Update region badge (text + color based on region)
  - Update equivalence volume display
  - Call `updateGraph()`
  - Call `syncParticles(_currentVol)`

**Step 2: Wire HL panel readouts**

When HL enabled, `updateDisplay()` also updates:
- Ka value (from acid database, formatted as scientific notation)
- Kb = Kw/Ka
- pKa and pKb
- [H+] and [OH-] at current volume
- Henderson-Hasselbalch: only shown when in buffer region. Display: `pH = pKa + log([A-]/[HA])` with actual values substituted. Use `getHendersonHasselbalch(_currentVol)`.

**Step 3: Verify**

- pH readout matches graph
- Region badge changes as volume increases: initial -> buffer -> equivalence -> excess
- HL panel shows Ka, pKa, [H+], [OH-]
- H-H equation appears in buffer region, disappears past equivalence
- H-H shows pH = pKa = 4.74 at half-equivalence for acetic acid

---

### Task 10: Data Collection Wiring

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_AcidBase.html` (script section)

**Step 1: Register variables**

```javascript
SimEngine.DataCollector.registerVariables([
  { key: 'volume', label: 'Volume added (mL)', getter: function() { return _currentVol; }, default: true },
  { key: 'pH', label: 'pH', getter: function() { return SimEngine.Titration.getPHAtVolume(_currentVol).pH; }, default: true },
  { key: 'pOH', label: 'pOH', getter: function() { return 14 - SimEngine.Titration.getPHAtVolume(_currentVol).pH; }, default: true },
  { key: 'hConc', label: '[H+] (mol/L)', getter: function() { return SimEngine.Titration.getPHAtVolume(_currentVol).hConc; } },
  { key: 'ohConc', label: '[OH-] (mol/L)', getter: function() { return SimEngine.Titration.getPHAtVolume(_currentVol).ohConc; } },
  { key: 'haConc', label: '[HA] (mol/L)', getter: function() { return SimEngine.Titration.getPHAtVolume(_currentVol).haConc; }, hl: true },
  { key: 'aConc', label: '[A-] (mol/L)', getter: function() { return SimEngine.Titration.getPHAtVolume(_currentVol).aConc; }, hl: true }
]);
```

**Step 2: Adapt data collection for volume-driven sim**

Since this sim has no animation tick for data collection, adapt:
- **Auto-collect mode**: When "Start Collection" is clicked, set a flag `_autoCollect = true`. Each time a drop is added, call `SimEngine.DataCollector.recordSnapshot()` automatically. When volume reaches max or user clicks stop, set `_autoCollect = false`.
- **Snapshot**: works as normal.
- **Sweep** (teacher): call `SimEngine.DataCollector.tick()` isn't applicable. Instead, implement a custom sweep that iterates volume from sweepFrom to sweepTo in N steps, recording at each.

Override the Start Collection button behavior:
- Instead of calling `startRun()`, set `_autoCollect = true` and show progress.
- Each drop increments a counter. When counter reaches target point count (or volume exceeds maxVol), stop and show complete.

**Step 3: Wire data panel UI**

Same HTML structure and event listeners as Gas Laws / Equilibrium:
- Panel toggle, variable checkboxes, start/stop/snapshot/download/clear buttons
- Sweep section (teacher only): sweep volume from 0 to maxVol in N steps
- Sweep implementation: loop through volumes, call `getPHAtVolume` at each step, record row directly

**Step 4: Verify**

- Auto-collect: start collection, add 10 drops, download CSV has 10 rows
- Snapshot: click at any volume, row appears in table
- Sweep: teacher mode, sweep 0-50 mL in 20 steps, auto-download CSV with 20 rows

---

### Task 11: Polish -- Responsive, Print, Keyboard, Edge Cases

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_AcidBase.html`

**Step 1: Responsive layout**

- 900px breakpoint: single column (beaker canvas full width, controls below)
- 600px breakpoint: smaller padding, smaller header font

**Step 2: Print styles**

- Hide: controls, buttons, toggles, data panel
- Show: pH curve graph, particle canvas (static frame), HL readouts
- Page break before HL panel

**Step 3: Keyboard shortcuts**

Wire `SimEngine.Controls.initKeyboard()` for teacher mode:
- Space: add drop (or toggle stream)
- R: reset titration
- H: toggle HL
- T: toggle teacher/student

**Step 4: Edge cases**

- Volume cannot go below 0 or above maxVol
- Concentration inputs clamped to 0.01-2.0
- If acid = base = 0 concentration, show pH 7 flat line
- Polyprotic acids: maxVol extends to cover all equivalence points

**Step 5: Verify**

- Layout works at 1200px, 800px, 500px widths
- Print preview shows graph and canvas
- Keyboard shortcuts work in teacher mode
- No console errors across all 4 presets and all acid/base combinations

---

## Verification Checklist

1. SA/SB titration: S-curve, equivalence at pH 7, symmetric
2. WA/SB titration: starts at ~2.9, buffer region, equivalence at ~8.7
3. SA/WB titration: starts at ~1, equivalence at ~5.3
4. WA/WB titration: starts at ~2.9, equivalence near 7
5. Polyprotic (HL): H3PO4 shows 3 equivalence points
6. Half-equivalence: pH = pKa marked correctly for weak acids
7. Henderson-Hasselbalch: displayed in buffer region with correct values
8. Derivative curve (HL): spike at each equivalence point
9. Indicator overlay (HL): band on pH axis at correct range
10. Flask color: changes through indicator transition as pH crosses range
11. Particle view: correct species at each stage, annihilation animation works
12. Drop-by-drop: curve builds point by point
13. Slider (teacher): full curve with volume marker
14. Data collection: auto-collect per drop, snapshot, sweep all work
15. Presets: all 4 load correctly with correct parameters
16. Teacher mode: free concentrations, full acid/base list, slider, sweep
17. Student mode: presets only, drop buttons, no sweep
18. Responsive: works at 1200px, 800px, 500px
19. No regression: Gas Laws and Equilibrium still work

---

## Critical Files

| File | Path | Purpose |
|------|------|---------|
| SimEngine_Core.js | `3-Resources/SimEngine/SimEngine_Core.js` | Add Titration module |
| SimEngine_AcidBase.html | `1-Projects/SimEngine/SimEngine_AcidBase.html` | New deliverable |
| Design doc | `docs/plans/2026-03-31-acidbase-design.md` | Reference |
