# Equilibrium Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a combined Dynamic Equilibrium + Le Chatelier simulation with particle visualization, real-time graphs, and HL extensions.

**Architecture:** New `SimEngine.Reaction` module added to `SimEngine_Core.js` (line 962+) handles reaction particles, rate calculations, and equilibrium logic. `SimEngine_Equilibrium.html` wires it together with existing State, Graph, and Controls modules. SL mode uses color-change model; HL mode adds collision-reaction model.

**Tech Stack:** Vanilla JS, Canvas 2D, SimEngine_Core.js modules (State, Graph, Controls), same style guide as Gas Laws (Inter/Fira Code/Caveat, CSS variables, HiDPI canvas).

**Design doc:** `docs/plans/2026-03-31-equilibrium-design.md`

---

### Task 1: Reaction Database + Module Scaffold

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (append after line 961)

**Step 1: Add the Reaction module scaffold with reaction database**

Append to `SimEngine_Core.js` after the Controls module closing line (961):

```javascript
// ─────────────────────────────────────────────
// MODULE 5: REACTION
// Reaction particle system for equilibrium,
// acid-base, and rate simulations.
// ─────────────────────────────────────────────
SimEngine.Reaction = (function () {

  // ── Constants ──
  var R_GAS = 8.314;        // J/(mol*K)
  var K_SIM = 0.02;         // simulation Boltzmann constant (same as Particles)
  var MAX_PARTICLES = 400;
  var RATE_SMOOTH_FRAMES = 60;

  // ── Reaction database ──
  var REACTIONS = {
    'N2O4_NO2': {
      equation: 'N\u2082O\u2084 \u21CC 2NO\u2082',
      Kc_298: 4.6e-3,
      dH: 57200,        // J/mol, endothermic
      dn: 1,            // delta n(gas) = 2 - 1
      Ea_f: 55000,      // J/mol forward activation energy
      Ea_r: 0,          // placeholder — derived from dH
      phase: 'gas',
      stoich: { reactants: [{ name: 'N\u2082O\u2084', coeff: 1 }], products: [{ name: 'NO\u2082', coeff: 2 }] },
      colors: { reactants: ['#CBD5E1'], products: ['#92400E'] },  // pale gray, brown
      labels: { reactants: ['N\u2082O\u2084'], products: ['NO\u2082'] }
    },
    'haber': {
      equation: 'N\u2082 + 3H\u2082 \u21CC 2NH\u2083',
      Kc_298: 6.0e5,
      dH: -92200,       // exothermic
      dn: -2,           // 2 - 4
      Ea_f: 230000,
      Ea_r: 0,
      phase: 'gas',
      stoich: { reactants: [{ name: 'N\u2082', coeff: 1 }, { name: 'H\u2082', coeff: 3 }], products: [{ name: 'NH\u2083', coeff: 2 }] },
      colors: { reactants: ['#3B82F6', '#94A3B8'], products: ['#059669'] },  // blue, grey, green
      labels: { reactants: ['N\u2082', 'H\u2082'], products: ['NH\u2083'] }
    },
    'cobalt': {
      equation: 'Co(H\u2082O)\u2086\u00B2\u207A \u21CC CoCl\u2084\u00B2\u207B',
      Kc_298: 1.0e-2,
      dH: 50000,        // endothermic
      dn: 0,            // aqueous
      Ea_f: 60000,
      Ea_r: 0,
      phase: 'aqueous',
      stoich: { reactants: [{ name: 'Co(H\u2082O)\u2086\u00B2\u207A', coeff: 1 }], products: [{ name: 'CoCl\u2084\u00B2\u207B', coeff: 1 }] },
      colors: { reactants: ['#EC4899'], products: ['#2563EB'] },  // pink, blue
      labels: { reactants: ['Co(H\u2082O)\u2086\u00B2\u207A'], products: ['CoCl\u2084\u00B2\u207B'] }
    },
    'thiocyanate': {
      equation: 'Fe\u00B3\u207A + SCN\u207B \u21CC FeSCN\u00B2\u207A',
      Kc_298: 1.4e2,
      dH: -1500,        // slightly exothermic
      dn: 0,            // aqueous
      Ea_f: 30000,
      Ea_r: 0,
      phase: 'aqueous',
      stoich: { reactants: [{ name: 'Fe\u00B3\u207A', coeff: 1 }, { name: 'SCN\u207B', coeff: 1 }], products: [{ name: 'FeSCN\u00B2\u207A', coeff: 1 }] },
      colors: { reactants: ['#EAB308', '#CBD5E1'], products: ['#DC2626'] },  // yellow, colorless, red
      labels: { reactants: ['Fe\u00B3\u207A', 'SCN\u207B'], products: ['FeSCN\u00B2\u207A'] }
    }
  };

  // Derive Ea_r from Ea_f and dH for each reaction
  Object.keys(REACTIONS).forEach(function (key) {
    var r = REACTIONS[key];
    r.Ea_r = r.Ea_f - r.dH;  // endothermic: Ea_r < Ea_f; exothermic: Ea_r > Ea_f
  });

  // ── Internal state ──
  var _reaction = null;       // current reaction key
  var _reactionData = null;   // current reaction object
  var _mode = 'color-change'; // 'color-change' or 'collision'
  var _bounds = { left: 0, top: 0, right: 840, bottom: 420 };
  var _T = 298;               // temperature in K
  var _totalParticles = 200;

  // Particle arrays (Structure-of-Arrays)
  var _x, _y, _vx, _vy;
  var _species;   // Int8Array: index into flat species list for this reaction
  var _n = 0;     // active particle count

  // Species list built from reaction data: [{name, coeff, side, color}]
  var _speciesList = [];

  // Rate tracking
  var _forwardEvents = 0;
  var _reverseEvents = 0;
  var _forwardBuffer = [];
  var _reverseBuffer = [];
  var _bufferIndex = 0;
  var _bufferFull = false;

  // Rate constants at current T
  var _kf = 0;
  var _kr = 0;

  return {
    REACTIONS: REACTIONS
  };

})();
```

**Step 2: Verify the scaffold loads**

Open browser console at `http://localhost:8765/1-Projects/SimEngine/SimEngine_GasLaws.html` and run:
```javascript
console.log(Object.keys(SimEngine.Reaction.REACTIONS));
// Expected: ['N2O4_NO2', 'haber', 'cobalt', 'thiocyanate']
```

---

### Task 2: Particle Initialization + Basic Motion

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (expand Reaction module)

**Step 1: Add init() and particle motion**

Inside the Reaction IIFE, after the internal state variables and before the `return` statement, add:

```javascript
  // ── Helpers ──
  function gaussRandom() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function mbSpeed(T, mass) {
    // 2D Maxwell-Boltzmann speed
    return Math.abs(gaussRandom()) * Math.sqrt(K_SIM * T / (mass || 1));
  }

  // ── Build species list from reaction data ──
  function buildSpeciesList(rxn) {
    var list = [];
    rxn.stoich.reactants.forEach(function (s, i) {
      list.push({ name: s.name, coeff: s.coeff, side: 'reactant', color: rxn.colors.reactants[i] || '#64748B' });
    });
    rxn.stoich.products.forEach(function (s, i) {
      list.push({ name: s.name, coeff: s.coeff, side: 'product', color: rxn.colors.products[i] || '#64748B' });
    });
    return list;
  }

  // ── Compute rate constants at temperature T ──
  function computeRateConstants(rxn, T) {
    // Arrhenius: k(T) = A * exp(-Ea / RT)
    // We define k at 298K from Kc, then scale with T
    // k_f(298) / k_r(298) = Kc(298)
    // Choose k_f(298) = 0.01 as base, k_r(298) = k_f(298) / Kc(298)
    var kf_298 = 0.01;
    var kr_298 = kf_298 / rxn.Kc_298;

    // Arrhenius scaling from 298K to T
    var kf = kf_298 * Math.exp(-rxn.Ea_f / R_GAS * (1 / T - 1 / 298));
    var kr = kr_298 * Math.exp(-rxn.Ea_r / R_GAS * (1 / T - 1 / 298));

    return { kf: kf, kr: kr };
  }

  // ── Init ──
  function init(config) {
    _reaction = config.reactionKey || 'N2O4_NO2';
    _reactionData = REACTIONS[_reaction];
    _totalParticles = config.particleCount || 200;
    _T = config.temperature || 298;
    _mode = config.mode || 'color-change';

    if (config.bounds) {
      _bounds = { left: config.bounds.left, top: config.bounds.top, right: config.bounds.right, bottom: config.bounds.bottom };
    }

    _speciesList = buildSpeciesList(_reactionData);

    // Allocate arrays
    _x = new Float64Array(MAX_PARTICLES);
    _y = new Float64Array(MAX_PARTICLES);
    _vx = new Float64Array(MAX_PARTICLES);
    _vy = new Float64Array(MAX_PARTICLES);
    _species = new Int8Array(MAX_PARTICLES);

    // Compute equilibrium distribution
    // For color-change model: distribute particles according to Kc
    // At equilibrium, [products]^p / [reactants]^r = Kc
    // For simplicity: fraction of products = Kc / (1 + Kc) for 1:1 stoich
    // For non-1:1, use a reasonable approximation
    var Kc = _reactionData.Kc_298;
    var totalReactantCoeff = 0;
    var totalProductCoeff = 0;
    _reactionData.stoich.reactants.forEach(function (s) { totalReactantCoeff += s.coeff; });
    _reactionData.stoich.products.forEach(function (s) { totalProductCoeff += s.coeff; });

    // Approximate equilibrium fraction of product particles
    var Keff = Math.pow(Kc, 1 / totalProductCoeff);
    var prodFrac = Keff / (1 + Keff);
    prodFrac = Math.max(0.05, Math.min(0.95, prodFrac));  // clamp

    var nProducts = Math.round(_totalParticles * prodFrac);
    var nReactants = _totalParticles - nProducts;

    _n = _totalParticles;

    // Place particles randomly
    var w = _bounds.right - _bounds.left;
    var h = _bounds.bottom - _bounds.top;

    for (var i = 0; i < _n; i++) {
      _x[i] = _bounds.left + 10 + Math.random() * (w - 20);
      _y[i] = _bounds.top + 10 + Math.random() * (h - 20);

      var angle = Math.random() * 2 * Math.PI;
      var speed = mbSpeed(_T, 1);
      _vx[i] = speed * Math.cos(angle);
      _vy[i] = speed * Math.sin(angle);

      // Assign species
      if (i < nReactants) {
        // Distribute among reactant species proportionally to coefficients
        var rIdx = 0;
        var cumCoeff = 0;
        var frac = i / nReactants;
        for (var s = 0; s < _reactionData.stoich.reactants.length; s++) {
          cumCoeff += _reactionData.stoich.reactants[s].coeff / totalReactantCoeff;
          if (frac < cumCoeff) { rIdx = s; break; }
        }
        _species[i] = rIdx;  // index into _speciesList (reactants come first)
      } else {
        // Distribute among product species
        var pIdx = 0;
        var cumCoeff2 = 0;
        var frac2 = (i - nReactants) / Math.max(nProducts, 1);
        for (var s2 = 0; s2 < _reactionData.stoich.products.length; s2++) {
          cumCoeff2 += _reactionData.stoich.products[s2].coeff / totalProductCoeff;
          if (frac2 < cumCoeff2) { pIdx = s2; break; }
        }
        _species[i] = _reactionData.stoich.reactants.length + pIdx;
      }
    }

    // Compute rate constants
    var rates = computeRateConstants(_reactionData, _T);
    _kf = rates.kf;
    _kr = rates.kr;

    // Reset rate tracking
    _forwardEvents = 0;
    _reverseEvents = 0;
    _forwardBuffer = new Array(RATE_SMOOTH_FRAMES).fill(0);
    _reverseBuffer = new Array(RATE_SMOOTH_FRAMES).fill(0);
    _bufferIndex = 0;
    _bufferFull = false;
  }

  // ── Step: move particles + wall collisions ──
  function step(dt) {
    dt = dt || 1;
    var radius = 4;

    for (var i = 0; i < _n; i++) {
      // Move
      _x[i] += _vx[i] * dt;
      _y[i] += _vy[i] * dt;

      // Wall collisions (elastic)
      if (_x[i] - radius < _bounds.left) {
        _x[i] = _bounds.left + radius;
        _vx[i] = Math.abs(_vx[i]);
      } else if (_x[i] + radius > _bounds.right) {
        _x[i] = _bounds.right - radius;
        _vx[i] = -Math.abs(_vx[i]);
      }
      if (_y[i] - radius < _bounds.top) {
        _y[i] = _bounds.top + radius;
        _vy[i] = Math.abs(_vy[i]);
      } else if (_y[i] + radius > _bounds.bottom) {
        _y[i] = _bounds.bottom - radius;
        _vy[i] = -Math.abs(_vy[i]);
      }
    }

    // Process reactions (color-change model)
    if (_mode === 'color-change') {
      stepColorChange(dt);
    } else {
      stepCollisionReaction(dt);
    }

    // Record rates
    _forwardBuffer[_bufferIndex] = _forwardEvents;
    _reverseBuffer[_bufferIndex] = _reverseEvents;
    _bufferIndex = (_bufferIndex + 1) % RATE_SMOOTH_FRAMES;
    if (_bufferIndex === 0) _bufferFull = true;
    _forwardEvents = 0;
    _reverseEvents = 0;
  }

  // ── Color-change reaction model (SL) ──
  function stepColorChange(dt) {
    var nReactantSpecies = _reactionData.stoich.reactants.length;

    // Count current species
    var reactantCount = 0;
    var productCount = 0;
    for (var i = 0; i < _n; i++) {
      if (_species[i] < nReactantSpecies) reactantCount++;
      else productCount++;
    }

    // Reaction probabilities per particle per frame
    var vol = (_bounds.right - _bounds.left) * (_bounds.bottom - _bounds.top);
    var concR = reactantCount / vol;
    var concP = productCount / vol;

    // Scale probabilities so system converges
    var pForward = _kf * concR * 1000;   // scaling factor for visible rate
    var pReverse = _kr * concP * 1000;

    // Clamp probabilities
    pForward = Math.min(pForward, 0.05);
    pReverse = Math.min(pReverse, 0.05);

    for (var i = 0; i < _n; i++) {
      if (_species[i] < nReactantSpecies) {
        // Reactant: chance to become product
        if (Math.random() < pForward) {
          // Switch to a random product species
          var pIdx = nReactantSpecies + Math.floor(Math.random() * _reactionData.stoich.products.length);
          _species[i] = pIdx;
          _forwardEvents++;
        }
      } else {
        // Product: chance to become reactant
        if (Math.random() < pReverse) {
          var rIdx = Math.floor(Math.random() * nReactantSpecies);
          _species[i] = rIdx;
          _reverseEvents++;
        }
      }
    }
  }

  // ── Collision-reaction model (HL) — placeholder ──
  function stepCollisionReaction(dt) {
    // Will be implemented in Task 9 (HL extensions)
    // For now, fall back to color-change
    stepColorChange(dt);
  }

  // ── Render ──
  function render(ctx) {
    var radius = 4;
    for (var i = 0; i < _n; i++) {
      var sp = _speciesList[_species[i]];
      ctx.beginPath();
      ctx.arc(_x[i], _y[i], radius, 0, 2 * Math.PI);
      ctx.fillStyle = sp ? sp.color : '#64748B';
      ctx.fill();
    }
  }
```

**Step 2: Update the return statement to expose init, step, render**

Replace the existing `return { REACTIONS: REACTIONS };` with:

```javascript
  return {
    REACTIONS: REACTIONS,
    init: init,
    step: step,
    render: render
  };
```

**Step 3: Verify particles move**

Open a test page or console. After calling `SimEngine.Reaction.init({reactionKey:'N2O4_NO2', particleCount:200, bounds:{left:0,top:0,right:840,bottom:420}, temperature:298})`, call `step(1)` and verify particle positions change. Call `render(ctx)` on a canvas context and verify colored dots appear.

---

### Task 3: HTML Scaffold + CSS + Canvas Setup

**Files:**
- Create: `1-Projects/SimEngine/SimEngine_Equilibrium.html`

**Step 1: Create the HTML file with full layout**

Create `SimEngine_Equilibrium.html` with:
- Same CSS variable set and style guide imports as Gas Laws
- Header with "Equilibrium Explorer" title
- sim-top-row: particle canvas (840x420) + control panel
- sim-graph-row: concentration graph canvas + rate graph canvas
- HL panel (hidden by default)
- Footer
- Script tag loading `../../3-Resources/SimEngine/SimEngine_Core.js`
- Initialization script that calls `SimEngine.Reaction.init()` and starts animation loop

Use the exact same CSS patterns from `SimEngine_GasLaws.html` (lines 7-250 approximately) with these changes:
- Title: "Equilibrium Explorer"
- Control panel: reaction dropdown, temperature slider, volume slider, perturbation buttons, Q vs K readout
- No "moles" or "species" slider — replaced by perturbation buttons and reaction dropdown

**Step 2: Verify the page loads**

Navigate to `http://localhost:8765/1-Projects/SimEngine/SimEngine_Equilibrium.html` and confirm:
- Header renders with correct gradient
- Canvas shows colored particles bouncing
- Control panel has reaction dropdown, T slider, V slider
- Perturbation buttons are visible
- Two graph canvases render (empty initially)

---

### Task 4: Controls Wiring + State Integration

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html` (script section)

**Step 1: Wire controls to State**

In the initialization script:

```javascript
// Default state
SimEngine.State.reset({
  playing: true,
  temperature: 298,
  volume: 2.0,
  reaction: 'N2O4_NO2',
  hlEnabled: false,
  mode: 'teacher',
  speed: 1
});

// Build controls using SimEngine.Controls
var controls = document.getElementById('controls-container');

controls.appendChild(SimEngine.Controls.createDropdown({
  key: 'reaction',
  label: 'Reaction',
  options: [
    { value: 'N2O4_NO2', text: 'N\u2082O\u2084 \u21CC 2NO\u2082' },
    { value: 'haber', text: 'N\u2082 + 3H\u2082 \u21CC 2NH\u2083' },
    { value: 'cobalt', text: 'Co(H\u2082O)\u2086\u00B2\u207A \u21CC CoCl\u2084\u00B2\u207B' },
    { value: 'thiocyanate', text: 'Fe\u00B3\u207A + SCN\u207B \u21CC FeSCN\u00B2\u207A' }
  ]
}));

controls.appendChild(SimEngine.Controls.createSlider({
  key: 'temperature', label: 'Temperature', min: 200, max: 800, step: 10, unit: 'K'
}));

controls.appendChild(SimEngine.Controls.createSlider({
  key: 'volume', label: 'Volume', min: 0.5, max: 5.0, step: 0.1, unit: 'L'
}));
```

**Step 2: Wire State change handlers**

```javascript
SimEngine.State.on('reaction', function (data) {
  // Re-init with new reaction
  SimEngine.Reaction.init({
    reactionKey: data.value,
    particleCount: 200,
    bounds: getCurrentBounds(),
    temperature: SimEngine.State.get('temperature')
  });
  clearGraphs();
});

SimEngine.State.on('temperature', function (data) {
  SimEngine.Reaction.setTemperature(data.value);
});

SimEngine.State.on('volume', function (data) {
  SimEngine.Reaction.setVolume(data.value);
});
```

**Step 3: Wire perturbation buttons**

```javascript
// Perturbation buttons (not State-bound, direct action)
function addPerturbButton(id, label, type) {
  var btn = SimEngine.Controls.createButton({ text: label, onClick: function () {
    SimEngine.Reaction.perturb(type);
  }});
  document.getElementById(id).appendChild(btn);
}

addPerturbButton('perturb-btns', '+Reactant', 'addReactant');
addPerturbButton('perturb-btns', '-Reactant', 'removeReactant');
addPerturbButton('perturb-btns', '+Product', 'addProduct');
addPerturbButton('perturb-btns', '-Product', 'removeProduct');
```

**Step 4: Verify**

- Changing the reaction dropdown reinitializes particles with new colors
- Temperature slider changes particle speeds
- Volume slider moves the piston wall
- Perturbation buttons are clickable (full functionality in Task 6)

---

### Task 5: Perturbation + Temperature + Volume Logic

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (Reaction module)

**Step 1: Add perturb(), setTemperature(), setVolume() methods**

Inside the Reaction IIFE, before the return statement:

```javascript
  // ── Perturbations ──
  function perturb(type, params) {
    var count = (params && params.count) || 20;
    var nReactantSpecies = _reactionData.stoich.reactants.length;
    var w = _bounds.right - _bounds.left;
    var h = _bounds.bottom - _bounds.top;

    if (type === 'addReactant') {
      for (var i = 0; i < count && _n < MAX_PARTICLES; i++) {
        var idx = _n;
        _x[idx] = _bounds.left + 10 + Math.random() * (w - 20);
        _y[idx] = _bounds.top + 10 + Math.random() * (h - 20);
        var angle = Math.random() * 2 * Math.PI;
        var speed = mbSpeed(_T, 1);
        _vx[idx] = speed * Math.cos(angle);
        _vy[idx] = speed * Math.sin(angle);
        _species[idx] = Math.floor(Math.random() * nReactantSpecies);
        _n++;
      }
    } else if (type === 'addProduct') {
      for (var i = 0; i < count && _n < MAX_PARTICLES; i++) {
        var idx = _n;
        _x[idx] = _bounds.left + 10 + Math.random() * (w - 20);
        _y[idx] = _bounds.top + 10 + Math.random() * (h - 20);
        var angle = Math.random() * 2 * Math.PI;
        var speed = mbSpeed(_T, 1);
        _vx[idx] = speed * Math.cos(angle);
        _vy[idx] = speed * Math.sin(angle);
        _species[idx] = nReactantSpecies + Math.floor(Math.random() * _reactionData.stoich.products.length);
        _n++;
      }
    } else if (type === 'removeReactant') {
      var removed = 0;
      for (var i = _n - 1; i >= 0 && removed < count; i--) {
        if (_species[i] < nReactantSpecies) {
          // Swap with last particle
          _n--;
          if (i < _n) {
            _x[i] = _x[_n]; _y[i] = _y[_n];
            _vx[i] = _vx[_n]; _vy[i] = _vy[_n];
            _species[i] = _species[_n];
          }
          removed++;
        }
      }
    } else if (type === 'removeProduct') {
      var removed = 0;
      for (var i = _n - 1; i >= 0 && removed < count; i--) {
        if (_species[i] >= nReactantSpecies) {
          _n--;
          if (i < _n) {
            _x[i] = _x[_n]; _y[i] = _y[_n];
            _vx[i] = _vx[_n]; _vy[i] = _vy[_n];
            _species[i] = _species[_n];
          }
          removed++;
        }
      }
    }
  }

  // ── Temperature change ──
  function setTemperature(newT) {
    var oldT = _T;
    _T = newT;

    // Rescale velocities
    if (oldT > 0) {
      var scale = Math.sqrt(newT / oldT);
      for (var i = 0; i < _n; i++) {
        _vx[i] *= scale;
        _vy[i] *= scale;
      }
    }

    // Recalculate rate constants (Arrhenius)
    var rates = computeRateConstants(_reactionData, _T);
    _kf = rates.kf;
    _kr = rates.kr;
  }

  // ── Volume change ──
  function setVolume(newV) {
    // Map volume slider (0.5-5.0) to container width
    // Default V=2.0 maps to full width (840px)
    // V scales linearly: width = (V / 2.0) * 840
    var baseWidth = _bounds.right;  // store original right on init
    var newRight = _bounds.left + Math.max(200, (newV / 2.0) * 840);
    _bounds.right = Math.min(newRight, 840);

    // Push particles inside if they're outside new bounds
    for (var i = 0; i < _n; i++) {
      if (_x[i] + 4 > _bounds.right) {
        _x[i] = _bounds.right - 4 - Math.random() * 20;
        _vx[i] = -Math.abs(_vx[i]);
      }
    }
  }
```

**Step 2: Add query methods**

```javascript
  // ── Query methods ──
  function getConcentrations() {
    var nReactantSpecies = _reactionData.stoich.reactants.length;
    var reactantCount = 0;
    var productCount = 0;
    for (var i = 0; i < _n; i++) {
      if (_species[i] < nReactantSpecies) reactantCount++;
      else productCount++;
    }
    var vol = (_bounds.right - _bounds.left) * (_bounds.bottom - _bounds.top);
    return {
      reactants: reactantCount,
      products: productCount,
      reactantConc: reactantCount / _n,
      productConc: productCount / _n,
      reactantFraction: reactantCount / Math.max(_n, 1),
      productFraction: productCount / Math.max(_n, 1)
    };
  }

  function getRates() {
    var count = _bufferFull ? RATE_SMOOTH_FRAMES : Math.max(_bufferIndex, 1);
    var fSum = 0, rSum = 0;
    for (var i = 0; i < count; i++) {
      fSum += _forwardBuffer[i];
      rSum += _reverseBuffer[i];
    }
    return {
      forward: fSum / count,
      reverse: rSum / count
    };
  }

  function getQ() {
    var conc = getConcentrations();
    // Q = [products]^p / [reactants]^r using particle fractions
    var prodTerm = Math.pow(conc.productConc + 1e-10, _reactionData.stoich.products.reduce(function (s, p) { return s + p.coeff; }, 0));
    var reactTerm = Math.pow(conc.reactantConc + 1e-10, _reactionData.stoich.reactants.reduce(function (s, r) { return s + r.coeff; }, 0));
    return prodTerm / reactTerm;
  }

  function getKc() {
    // Kc at current temperature via van't Hoff equation
    // ln(K2/K1) = -dH/R * (1/T2 - 1/T1)
    return _reactionData.Kc_298 * Math.exp(-_reactionData.dH / R_GAS * (1 / _T - 1 / 298));
  }

  function getKp() {
    // Kp = Kc * (RT)^(dn)
    var Kc = getKc();
    return Kc * Math.pow(R_GAS * _T / 101325, _reactionData.dn);  // R in J/(mol*K), P in Pa
  }

  function getDeltaG() {
    // dG = -RT ln K
    var Kc = getKc();
    return -R_GAS * _T * Math.log(Kc);
  }

  function isAtEquilibrium() {
    var Q = getQ();
    var Kc = getKc();
    if (Kc === 0) return false;
    return Math.abs(Q - Kc) / Kc < 0.15;  // within 15%
  }

  function getMode() { return _mode; }
  function setMode(m) { _mode = m; }
  function getBounds() { return { left: _bounds.left, top: _bounds.top, right: _bounds.right, bottom: _bounds.bottom }; }
  function getSpeciesList() { return _speciesList.slice(); }
  function getParticleCount() { return _n; }
  function getTemperature() { return _T; }
```

**Step 3: Update return statement with all public methods**

```javascript
  return {
    REACTIONS: REACTIONS,
    init: init,
    step: step,
    render: render,
    perturb: perturb,
    setTemperature: setTemperature,
    setVolume: setVolume,
    setMode: setMode,
    getConcentrations: getConcentrations,
    getRates: getRates,
    getQ: getQ,
    getKc: getKc,
    getKp: getKp,
    getDeltaG: getDeltaG,
    isAtEquilibrium: isAtEquilibrium,
    getMode: getMode,
    getBounds: getBounds,
    getSpeciesList: getSpeciesList,
    getParticleCount: getParticleCount,
    getTemperature: getTemperature
  };
```

**Step 4: Verify perturbations**

In console: call `SimEngine.Reaction.perturb('addReactant')`, then `getConcentrations()` — reactant count should increase by 20. Call `setTemperature(500)` — velocities should scale up.

---

### Task 6: Graphs — Concentration vs. Time + Rate vs. Time

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html` (script section)

**Step 1: Initialize graphs**

```javascript
// Concentration vs. Time graph
var concGraph = SimEngine.Graph.create('conc-canvas', {
  title: 'Concentration vs. Time',
  xLabel: 'Time',
  yLabel: 'Fraction',
  xRange: [0, 500],
  yRange: [0, 1]
});
concGraph.addSeries('reactants', '#3B82F6', 2);   // blue
concGraph.addSeries('products', '#DC2626', 2);     // red

// Rate vs. Time graph
var rateGraph = SimEngine.Graph.create('rate-canvas', {
  title: 'Forward / Reverse Rates',
  xLabel: 'Time',
  yLabel: 'Rate (events/frame)',
  xRange: [0, 500],
  yRange: [0, 5]
});
rateGraph.addSeries('forward', '#0D9488', 2);      // teal
rateGraph.addSeries('reverse', '#D97706', 2);      // orange
```

**Step 2: Update animation loop to feed graphs**

In the animation loop, after `SimEngine.Reaction.step(speed)`:

```javascript
frameCount++;

var conc = SimEngine.Reaction.getConcentrations();
var rates = SimEngine.Reaction.getRates();

// Plot every 3 frames to reduce point density
if (frameCount % 3 === 0) {
  concGraph.addPoint('reactants', frameCount, conc.reactantFraction);
  concGraph.addPoint('products', frameCount, conc.productFraction);
  concGraph.draw();

  rateGraph.addPoint('forward', frameCount, rates.forward);
  rateGraph.addPoint('reverse', frameCount, rates.reverse);
  rateGraph.draw();
}
```

**Step 3: Verify**

- Concentration graph shows two lines approaching equilibrium values
- Rate graph shows forward/reverse rates converging
- After perturbation (add reactant), both graphs show disruption then re-convergence

---

### Task 7: Q vs. K Readout Panel + Info Display

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html` (HTML + script)

**Step 1: Add Q vs K readout HTML**

In the control panel section:

```html
<div class="info-panel" id="info-panel">
  <div class="info-label">Equilibrium Status</div>
  <div class="info-row">
    <span>K<sub>c</sub>:</span>
    <span id="info-kc">—</span>
  </div>
  <div class="info-row">
    <span>Q:</span>
    <span id="info-q">—</span>
  </div>
  <div class="info-row">
    <span>Status:</span>
    <span id="info-status">—</span>
  </div>
  <div class="info-row">
    <span>Reactants:</span>
    <span id="info-reactants">—</span>
  </div>
  <div class="info-row">
    <span>Products:</span>
    <span id="info-products">—</span>
  </div>
</div>
```

**Step 2: Update info panel every frame**

```javascript
function updateInfoPanel() {
  var Kc = SimEngine.Reaction.getKc();
  var Q = SimEngine.Reaction.getQ();
  var conc = SimEngine.Reaction.getConcentrations();

  document.getElementById('info-kc').textContent = Kc.toExponential(2);
  document.getElementById('info-q').textContent = Q.toExponential(2);
  document.getElementById('info-reactants').textContent = conc.reactants;
  document.getElementById('info-products').textContent = conc.products;

  var statusEl = document.getElementById('info-status');
  if (SimEngine.Reaction.isAtEquilibrium()) {
    statusEl.textContent = 'At equilibrium (Q \u2248 K)';
    statusEl.style.color = 'var(--green)';
  } else if (Q < Kc) {
    statusEl.textContent = 'Q < K \u2192 shifts right';
    statusEl.style.color = 'var(--blue)';
  } else {
    statusEl.textContent = 'Q > K \u2192 shifts left';
    statusEl.style.color = 'var(--red)';
  }
}
```

**Step 3: Verify**

- Info panel updates in real-time
- After perturbation, status changes from "At equilibrium" to "Q < K" or "Q > K"
- Eventually returns to "At equilibrium"

---

### Task 8: Volume Piston + Pressure Effects

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html` (render + controls)

**Step 1: Draw piston wall on canvas**

In the canvas render function, after drawing particles:

```javascript
// Draw piston (right wall) if gas-phase reaction
var rxnData = SimEngine.Reaction.REACTIONS[SimEngine.State.get('reaction')];
var bounds = SimEngine.Reaction.getBounds();

if (rxnData.phase === 'gas') {
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(bounds.right, bounds.top);
  ctx.lineTo(bounds.right, bounds.bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  // Piston handle
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(bounds.right - 2, bounds.top, 8, bounds.bottom - bounds.top);
}
```

**Step 2: Disable volume slider for aqueous reactions**

```javascript
SimEngine.State.on('reaction', function (data) {
  var rxn = SimEngine.Reaction.REACTIONS[data.value];
  var volSlider = document.getElementById('slider-volume');
  if (rxn.phase === 'aqueous') {
    volSlider.disabled = true;
    volSlider.parentElement.style.opacity = '0.4';
    volSlider.parentElement.title = 'Volume changes do not affect aqueous equilibria';
  } else {
    volSlider.disabled = false;
    volSlider.parentElement.style.opacity = '1';
    volSlider.parentElement.title = '';
  }
});
```

**Step 3: Verify**

- Gas reactions (N₂O₄, Haber): piston visible, volume slider works, compression shifts equilibrium
- Aqueous reactions (cobalt, thiocyanate): volume slider disabled, no piston drawn
- Compressing N₂O₄ ⇌ 2NO₂ shifts left (fewer gas moles)
- Compressing Haber shifts right (fewer gas moles)

---

### Task 9: HL Panel — Collision Model + Quantitative Readouts

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (collision-reaction logic)
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html` (HL panel)

**Step 1: Implement collision-reaction model in Core**

Replace the `stepCollisionReaction` placeholder with real collision logic:

```javascript
  function stepCollisionReaction(dt) {
    var nReactantSpecies = _reactionData.stoich.reactants.length;
    var radius = 4;
    var minDist = radius * 2;
    var minDistSq = minDist * minDist;

    // Check all pairs (brute force for now — optimize later if needed)
    for (var i = 0; i < _n; i++) {
      for (var j = i + 1; j < _n; j++) {
        var dx = _x[i] - _x[j];
        var dy = _y[i] - _y[j];
        var distSq = dx * dx + dy * dy;

        if (distSq < minDistSq) {
          // Collision detected — check if reaction can occur
          var sideI = _species[i] < nReactantSpecies ? 'reactant' : 'product';
          var sideJ = _species[j] < nReactantSpecies ? 'reactant' : 'product';

          // Calculate collision energy
          var dvx = _vx[i] - _vx[j];
          var dvy = _vy[i] - _vy[j];
          var collisionEnergy = 0.5 * (dvx * dvx + dvy * dvy);

          // Forward reaction: two reactants collide
          if (sideI === 'reactant' && sideJ === 'reactant') {
            var Ea_scaled = _reactionData.Ea_f * K_SIM / R_GAS;  // scale to sim units
            if (collisionEnergy > Ea_scaled * 0.001) {  // tunable threshold
              _species[i] = nReactantSpecies + Math.floor(Math.random() * _reactionData.stoich.products.length);
              _species[j] = nReactantSpecies + Math.floor(Math.random() * _reactionData.stoich.products.length);
              _forwardEvents++;
            }
          }
          // Reverse reaction: two products collide
          else if (sideI === 'product' && sideJ === 'product') {
            var Ea_r_scaled = _reactionData.Ea_r * K_SIM / R_GAS;
            if (collisionEnergy > Ea_r_scaled * 0.001) {
              _species[i] = Math.floor(Math.random() * nReactantSpecies);
              _species[j] = Math.floor(Math.random() * nReactantSpecies);
              _reverseEvents++;
            }
          }

          // Elastic bounce (regardless of reaction)
          var dist = Math.sqrt(distSq) || 1;
          var nx = dx / dist;
          var ny = dy / dist;
          var relV = dvx * nx + dvy * ny;
          if (relV < 0) {
            _vx[i] -= relV * nx;
            _vy[i] -= relV * ny;
            _vx[j] += relV * nx;
            _vy[j] += relV * ny;
          }
          // Separate overlapping particles
          var overlap = minDist - dist;
          if (overlap > 0) {
            _x[i] += nx * overlap * 0.5;
            _y[i] += ny * overlap * 0.5;
            _x[j] -= nx * overlap * 0.5;
            _y[j] -= ny * overlap * 0.5;
          }
        }
      }
    }
  }
```

**Step 2: Add HL panel HTML**

```html
<div class="hl-panel" id="hl-panel" style="display:none;">
  <div class="hl-badge">HL</div>
  <h3>Quantitative Equilibrium Data</h3>
  <div class="hl-grid">
    <div class="hl-stat">
      <span class="hl-label">K<sub>c</sub></span>
      <span class="hl-value" id="hl-kc">—</span>
    </div>
    <div class="hl-stat">
      <span class="hl-label">K<sub>p</sub></span>
      <span class="hl-value" id="hl-kp">—</span>
    </div>
    <div class="hl-stat">
      <span class="hl-label">&Delta;G&deg;</span>
      <span class="hl-value" id="hl-dg">—</span>
      <span class="hl-unit">kJ/mol</span>
    </div>
  </div>
  <h4>Collision-Reaction Model</h4>
  <canvas id="hl-canvas" width="840" height="300"></canvas>
</div>
```

**Step 3: Wire HL toggle**

```javascript
SimEngine.State.on('hlEnabled', function (data) {
  var hlPanel = document.getElementById('hl-panel');
  hlPanel.style.display = data.value ? 'block' : 'none';

  // Switch reaction model
  SimEngine.Reaction.setMode(data.value ? 'collision' : 'color-change');
});

// Update HL readouts in animation loop
function updateHLPanel() {
  if (!SimEngine.State.get('hlEnabled')) return;

  document.getElementById('hl-kc').textContent = SimEngine.Reaction.getKc().toExponential(3);

  var rxn = SimEngine.Reaction.REACTIONS[SimEngine.State.get('reaction')];
  if (rxn.phase === 'gas') {
    document.getElementById('hl-kp').textContent = SimEngine.Reaction.getKp().toExponential(3);
  } else {
    document.getElementById('hl-kp').textContent = 'N/A (aqueous)';
  }

  var dG = SimEngine.Reaction.getDeltaG() / 1000;  // convert to kJ/mol
  document.getElementById('hl-dg').textContent = dG.toFixed(1);
}
```

**Step 4: Verify**

- HL toggle shows/hides panel
- Kc, Kp, dG values update with temperature changes
- Collision model shows particles bouncing and reacting on collision
- Kp shows "N/A" for aqueous reactions

---

### Task 10: Equilibrium Convergence Calibration

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (tune rate constants)

**Step 1: Calibration testing**

Run the simulation at defaults (N₂O₄, 298K, V=2.0, 200 particles). After 500 frames:

- Verify concentration stabilizes (reactant/product fractions stay within +/-3% for 100 frames)
- Verify forward rate ≈ reverse rate (within 20%)
- Verify Q ≈ Kc (within 30% — particle noise makes tight convergence unrealistic)

**Step 2: Tune if needed**

Adjust these knobs in `stepColorChange`:
- The `1000` scaling factor on pForward/pReverse — higher = faster convergence, noisier
- The `0.05` probability clamp — higher = more reactive, noisier
- The `RATE_SMOOTH_FRAMES` constant — higher = smoother rates, slower warmup

Target: System reaches equilibrium within 200 frames. Re-equilibrates after perturbation within 150 frames.

**Step 3: Test Le Chatelier responses**

Verify for each perturbation:
- Add reactant → Q < K → system shifts right → new equilibrium at same Kc
- Add product → Q > K → system shifts left → new equilibrium at same Kc
- Raise T on endothermic (N₂O₄) → Kc increases → more products
- Raise T on exothermic (Haber) → Kc decreases → more reactants
- Compress gas reaction → shifts toward fewer moles

---

### Task 11: SL/HL Toggle + Teacher/Student Mode + Keyboard

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html`

**Step 1: Wire SL/HL toggle**

Same pattern as Gas Laws:
- Toggle button in header
- HL panel visibility
- Header badge color changes to purple when HL enabled
- Keyboard shortcut H

**Step 2: Wire Teacher/Student mode**

Same pattern as Gas Laws:
- Teacher mode: large canvas, keyboard shortcuts active
- Student mode: standard layout
- Keyboard shortcut T

**Step 3: Init keyboard handler**

```javascript
SimEngine.Controls.initKeyboard();
```

**Step 4: Verify**

- H key toggles HL panel
- T key toggles teacher/student mode
- Space pauses/resumes
- R resets simulation

---

### Task 12: Polish + Responsive + Print

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html`

**Step 1: Responsive layout**

- 900px breakpoint: single-column layout (canvas full-width, controls below)
- 600px breakpoint: minimum width, graphs stack vertically

**Step 2: Print styles**

```css
@media print {
  .controls-panel, .header-controls, button { display: none !important; }
  canvas { border: 1px solid #ccc; }
  .hl-panel { page-break-before: always; }
}
```

**Step 3: Canvas legend**

Draw a small legend on the particle canvas showing species colors and names for the current reaction.

**Step 4: Graph clearing on reaction change**

When the reaction dropdown changes, clear both graphs and reset frame count.

**Step 5: Verify**

- Resize browser: layout adapts at breakpoints
- Print preview: controls hidden, canvases visible
- Legend shows correct species for each reaction
- Switching reactions clears graphs and starts fresh

---

## Verification Checklist

1. **Equilibrium convergence**: Species fractions stabilize within 200 frames at default settings
2. **Le Chatelier — concentration**: Add reactant → shifts right, re-equilibrates at same Kc
3. **Le Chatelier — temperature**: Endothermic + heat → shifts right (more products); exothermic + heat → shifts left
4. **Le Chatelier — pressure**: Compress N₂O₄ → shifts left; compress Haber → shifts right
5. **Q vs. K accuracy**: Q approaches Kc within 30% at equilibrium (particle noise expected)
6. **Rate convergence**: Forward and reverse rates visibly converge on rate graph
7. **All 4 reactions**: Each selectable reaction initializes correctly with proper colors and behavior
8. **HL collision model**: Particles react on collision, not spontaneously
9. **HL readouts**: Kc, Kp, dG update correctly with temperature; Kp=N/A for aqueous
10. **Volume disabled for aqueous**: Slider grayed out, no piston for cobalt/thiocyanate
11. **Responsive**: Layout works from 1200px to 600px
12. **Keyboard shortcuts**: Space, R, H, T all functional
13. **Performance**: 60fps with 200 particles in color-change mode

---

## Critical Files

| File | Path | Purpose |
|------|------|---------|
| SimEngine_Core.js | `3-Resources/SimEngine/SimEngine_Core.js` | Add Reaction module (line 962+) |
| SimEngine_Equilibrium.html | `1-Projects/SimEngine/SimEngine_Equilibrium.html` | Phase 2 deliverable |
| Design doc | `1-Projects/SimEngine/docs/plans/2026-03-31-equilibrium-design.md` | Reference |
| Gas Laws (reference) | `1-Projects/SimEngine/SimEngine_GasLaws.html` | CSS/layout patterns to replicate |
| Style guide | `3-Resources/IB_Chemistry_Tutorial_Style_Guide.md` | Visual reference |
