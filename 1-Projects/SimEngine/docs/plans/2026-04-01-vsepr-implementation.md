# VSEPR & Molecular Geometry Explorer Implementation Plan

> **Status: COMPLETE** — All 7 tasks implemented and verified 2026-04-01.

**Goal:** Build a 3D molecular geometry viewer with VSEPR shape prediction, polarity analysis overlay, and HL hybridization/sigma-pi extensions.

**Architecture:** New `SimEngine.VSEPR` module in `SimEngine_Core.js` handles the molecule database, 3D coordinate generation for each VSEPR geometry, polarity calculation, and hybridization derivation. The HTML file `SimEngine_VSEPR.html` provides a canvas-based 3D trackball viewer, build-your-own controls (bonding/lone pairs), preset molecule dropdown, polarity toggle overlay, geometry reference table, and HL panel.

**Tech Stack:** Vanilla JS, canvas 2D rendering with manual 3D projection, no external libraries.

**Design doc:** `docs/plans/2026-04-01-vsepr-design.md`

**Verification summary:**
- All 13 VSEPR geometries: correct names, angles, atom/lone pair counts
- 29 preset molecules with correct bond orders and metadata
- 3D trackball rotation with auto-rotate
- H₂O: bent, 104.5°, polar (green net dipole arrow) ✓
- CO₂: linear, 180°, nonpolar (dipoles cancel) ✓
- SF₆: octahedral, 90°, sp³d², expanded octet indicator ✓
- CO₂ HL: sp hybridization, 2σ + 2π bonds ✓
- Data collection: snapshot working, reference table with 13 clickable rows
- No regressions on Gas Laws, Equilibrium, Acid-Base, Electrochem sims
- Responsive layout, keyboard shortcuts, teacher/student modes

---

### Task 1: VSEPR Module — Molecule Database + Geometry Calculator

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (append after Electrochem module, ~line 2874)

**What to build:**

Append a new Module 9: VSEPR after the Electrochem IIFE closing `})();` at line 2874.

The module must contain:

**1. Electronegativity lookup object:**

```javascript
var EN = {
  H: 2.20, He: 0, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44,
  F: 3.98, Ne: 0, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58,
  Cl: 3.16, Ar: 0, Br: 2.96, I: 2.66, Se: 2.55, Xe: 2.60, Kr: 3.00,
  Sn: 1.96, Pb: 2.33, As: 2.18, Te: 2.10, Sb: 2.05
};
```

**2. CPK color lookup object:**

```javascript
var CPK = {
  H: '#E8E8E8', C: '#374151', N: '#3B82F6', O: '#EF4444', F: '#22C55E',
  Cl: '#10B981', Br: '#92400E', I: '#7C3AED', S: '#EAB308', P: '#F97316',
  B: '#F59E0B', Be: '#84CC16', Xe: '#06B6D4', Se: '#D97706', Si: '#9CA3AF',
  Na: '#A855F7', K: '#8B5CF6', Ca: '#22D3EE', Al: '#CBD5E1', Mg: '#84CC16',
  Sn: '#6B7280', Pb: '#475569', default: '#94A3B8'
};
```

**3. Geometry definitions — `GEOMETRIES` object:**

Keyed by `"bondingPairs-lonePairs"` string (e.g., `"2-0"`, `"4-2"`). Each entry:

```javascript
{
  electronDomains: 4,
  electronGeometry: 'tetrahedral',
  molecularGeometry: 'bent',
  idealAngle: 104.5,
  hybridization: 'sp³',
  // Function that returns unit vectors for ALL domain positions (bonding + lone)
  domainPositions: function () { return [...]; }
}
```

Domain positions for each electron domain count (unit vectors from origin):

- **2 domains (linear):** `[0,0,1]`, `[0,0,-1]`
- **3 domains (trigonal planar):** `[0,0,1]`, `[sin(120°),0,cos(120°)]`, `[sin(240°),0,cos(240°)]` — in xz plane
- **4 domains (tetrahedral):** `[0,1,0]`, `[0,-1/3, 2√2/3]`, `[-√6/3,-1/3,-√2/3]`, `[√6/3,-1/3,-√2/3]`
- **5 domains (trigonal bipyramidal):** 3 equatorial in xz plane at 120° + 2 axial at `[0,±1,0]`
- **6 domains (octahedral):** `[±1,0,0]`, `[0,±1,0]`, `[0,0,±1]`

For each `"bp-lp"` key, the `domainPositions` function returns all positions. The first `bp` positions are bonding (atoms), the remaining `lp` are lone pairs. Lone pair placement rules:
- Trigonal bipyramidal: lone pairs occupy **equatorial** positions first
- Octahedral: first lone pair goes axial, second goes trans (opposite)

Complete geometry entries needed:

```
"2-0": linear / linear / 180° / sp
"3-0": trig planar / trig planar / 120° / sp²
"3-1": trig planar / bent / ~117° / sp²
"4-0": tetrahedral / tetrahedral / 109.5° / sp³
"4-1": tetrahedral / trigonal pyramidal / ~107° / sp³
"4-2": tetrahedral / bent / ~104.5° / sp³
"5-0": trig bipyramidal / trig bipyramidal / 90°,120° / sp³d
"5-1": trig bipyramidal / seesaw / ~90°,120° / sp³d
"5-2": trig bipyramidal / T-shaped / ~90° / sp³d
"5-3": trig bipyramidal / linear / 180° / sp³d
"6-0": octahedral / octahedral / 90° / sp³d²
"6-1": octahedral / square pyramidal / ~90° / sp³d²
"6-2": octahedral / square planar / 90° / sp³d²
```

**4. Molecule preset database — `MOLECULES` array:**

~30 entries. Each:

```javascript
{ key: 'H2O', name: 'Water', formula: 'H₂O',
  central: 'O', terminals: ['H', 'H'],
  bondingPairs: 2, lonePairs: 2,
  bondOrders: [1, 1],
  expandedOctet: false }
```

Full list of presets:

| Key | Name | Formula | Central | Terminals | BP | LP | Bond Orders |
|-----|------|---------|---------|-----------|----|----|-------------|
| BeCl2 | Beryllium chloride | BeCl₂ | Be | [Cl, Cl] | 2 | 0 | [1, 1] |
| CO2 | Carbon dioxide | CO₂ | C | [O, O] | 2 | 0 | [2, 2] |
| HCN | Hydrogen cyanide | HCN | C | [H, N] | 2 | 0 | [1, 3] |
| BF3 | Boron trifluoride | BF₃ | B | [F, F, F] | 3 | 0 | [1, 1, 1] |
| SO3 | Sulfur trioxide | SO₃ | S | [O, O, O] | 3 | 0 | [2, 2, 2] |
| NO3 | Nitrate ion | NO₃⁻ | N | [O, O, O] | 3 | 0 | [1.33, 1.33, 1.33] |
| SO2 | Sulfur dioxide | SO₂ | S | [O, O] | 2 | 1 | [2, 2] |
| O3 | Ozone | O₃ | O | [O, O] | 2 | 1 | [1.5, 1.5] |
| CH4 | Methane | CH₄ | C | [H, H, H, H] | 4 | 0 | [1, 1, 1, 1] |
| NH4 | Ammonium ion | NH₄⁺ | N | [H, H, H, H] | 4 | 0 | [1, 1, 1, 1] |
| CCl4 | Carbon tetrachloride | CCl₄ | C | [Cl, Cl, Cl, Cl] | 4 | 0 | [1, 1, 1, 1] |
| NH3 | Ammonia | NH₃ | N | [H, H, H] | 3 | 1 | [1, 1, 1] |
| PCl3 | Phosphorus trichloride | PCl₃ | P | [Cl, Cl, Cl] | 3 | 1 | [1, 1, 1] |
| H3O | Hydronium ion | H₃O⁺ | O | [H, H, H] | 3 | 1 | [1, 1, 1] |
| H2O | Water | H₂O | O | [H, H] | 2 | 2 | [1, 1] |
| H2S | Hydrogen sulfide | H₂S | S | [H, H] | 2 | 2 | [1, 1] |
| SCl2 | Sulfur dichloride | SCl₂ | S | [Cl, Cl] | 2 | 2 | [1, 1] |
| PCl5 | Phosphorus pentachloride | PCl₅ | P | [Cl, Cl, Cl, Cl, Cl] | 5 | 0 | [1,1,1,1,1] |
| SF4 | Sulfur tetrafluoride | SF₄ | S | [F, F, F, F] | 4 | 1 | [1, 1, 1, 1] |
| ClF3 | Chlorine trifluoride | ClF₃ | Cl | [F, F, F] | 3 | 2 | [1, 1, 1] |
| BrF3 | Bromine trifluoride | BrF₃ | Br | [F, F, F] | 3 | 2 | [1, 1, 1] |
| XeF2 | Xenon difluoride | XeF₂ | Xe | [F, F] | 2 | 3 | [1, 1] |
| I3 | Triiodide ion | I₃⁻ | I | [I, I] | 2 | 3 | [1, 1] |
| SF6 | Sulfur hexafluoride | SF₆ | S | [F, F, F, F, F, F] | 6 | 0 | [1,1,1,1,1,1] |
| BrF5 | Bromine pentafluoride | BrF₅ | Br | [F, F, F, F, F] | 5 | 1 | [1,1,1,1,1] |
| IF5 | Iodine pentafluoride | IF₅ | I | [F, F, F, F, F] | 5 | 1 | [1,1,1,1,1] |
| XeF4 | Xenon tetrafluoride | XeF₄ | Xe | [F, F, F, F] | 4 | 2 | [1, 1, 1, 1] |
| CF4 | Carbon tetrafluoride | CF₄ | C | [F, F, F, F] | 4 | 0 | [1, 1, 1, 1] |
| NF3 | Nitrogen trifluoride | NF₃ | N | [F, F, F] | 3 | 1 | [1, 1, 1] |

**5. `getGeometry(bondingPairs, lonePairs)` function:**

Look up `GEOMETRIES[bp + '-' + lp]`. If not found, return null. Return geometry info plus computed 3D coordinates:

```javascript
function getGeometry(bp, lp) {
  var key = bp + '-' + lp;
  var geom = GEOMETRIES[key];
  if (!geom) return null;
  var positions = geom.domainPositions();
  var atoms = [];
  for (var i = 0; i < bp; i++) {
    atoms.push({ x: positions[i][0], y: positions[i][1], z: positions[i][2], index: i });
  }
  var lonePairCoords = [];
  for (var j = bp; j < bp + lp; j++) {
    lonePairCoords.push({ x: positions[j][0], y: positions[j][1], z: positions[j][2] });
  }
  return {
    electronDomains: geom.electronDomains,
    electronGeometry: geom.electronGeometry,
    molecularGeometry: geom.molecularGeometry,
    idealAngle: geom.idealAngle,
    hybridization: geom.hybridization,
    atoms: atoms,
    lonePairs: lonePairCoords
  };
}
```

**6. `getPolarity(config)` function:**

```javascript
function getPolarity(central, terminals) {
  // central: element string, terminals: [{element, x, y, z}]
  var enCentral = EN[central] || 0;
  var bondDipoles = [];
  var netX = 0, netY = 0, netZ = 0;
  for (var i = 0; i < terminals.length; i++) {
    var t = terminals[i];
    var enTerm = EN[t.element] || 0;
    var diff = enTerm - enCentral;
    var len = Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z) || 1;
    var ux = t.x / len, uy = t.y / len, uz = t.z / len;
    bondDipoles.push({
      element: t.element, magnitude: Math.abs(diff),
      vector: { x: ux * diff, y: uy * diff, z: uz * diff }
    });
    netX += ux * diff;
    netY += uy * diff;
    netZ += uz * diff;
  }
  var netMag = Math.sqrt(netX * netX + netY * netY + netZ * netZ);
  var isPolar = netMag > 0.1;
  var explanation = isPolar
    ? 'Bond dipoles do not cancel due to asymmetric geometry.'
    : (bondDipoles.length > 0 && bondDipoles[0].magnitude > 0.1)
      ? 'Bond dipoles cancel due to symmetric geometry.'
      : 'All bonds are nonpolar (ΔEN ≈ 0).';
  return {
    enCentral: enCentral,
    bondDipoles: bondDipoles,
    netDipole: { x: netX, y: netY, z: netZ, magnitude: netMag },
    isPolar: isPolar,
    explanation: explanation
  };
}
```

**7. `getHybridization(electronDomains)` function:**

```javascript
function getHybridization(ed) {
  var map = { 2: 'sp', 3: 'sp²', 4: 'sp³', 5: 'sp³d', 6: 'sp³d²' };
  return {
    hybridization: map[ed] || 'unknown',
    description: ed + ' electron domains → ' + (map[ed] || '?') + ' hybridization'
  };
}
```

**8. `getSigmaPi(bondOrders)` function:**

```javascript
function getSigmaPi(bondOrders) {
  var sigma = bondOrders.length; // every bond has one sigma
  var pi = 0;
  for (var i = 0; i < bondOrders.length; i++) {
    pi += Math.max(0, Math.round(bondOrders[i]) - 1);
  }
  return { sigmaBonds: sigma, piBonds: pi };
}
```

**9. Helper: `getHalfCell` → `getMolecule` pattern — lookup by key:**

```javascript
var _moleculeMap = {};
for (var i = 0; i < MOLECULES.length; i++) {
  _moleculeMap[MOLECULES[i].key] = MOLECULES[i];
}
function getMolecule(key) { return _moleculeMap[key] || null; }
```

**10. Public API:**

```javascript
return {
  MOLECULES: MOLECULES,
  EN: EN,
  CPK: CPK,
  getGeometry: getGeometry,
  getPolarity: getPolarity,
  getHybridization: getHybridization,
  getSigmaPi: getSigmaPi,
  getMolecule: getMolecule
};
```

**Verification:** Open browser console on any existing sim page. Run:

```javascript
var g = SimEngine.VSEPR.getGeometry(2, 2);
console.log(g.molecularGeometry); // "bent"
console.log(g.idealAngle);       // 104.5
console.log(g.atoms.length);     // 2
console.log(g.lonePairs.length);  // 2

var m = SimEngine.VSEPR.getMolecule('H2O');
console.log(m.formula);          // "H₂O"

var p = SimEngine.VSEPR.getPolarity('O', [
  { element: 'H', x: g.atoms[0].x, y: g.atoms[0].y, z: g.atoms[0].z },
  { element: 'H', x: g.atoms[1].x, y: g.atoms[1].y, z: g.atoms[1].z }
]);
console.log(p.isPolar);          // true
console.log(p.netDipole.magnitude > 0.1); // true

var sp = SimEngine.VSEPR.getSigmaPi([2, 2]); // CO2
console.log(sp.sigmaBonds);      // 2
console.log(sp.piBonds);         // 2

// Verify all 13 geometry keys
['2-0','3-0','3-1','4-0','4-1','4-2','5-0','5-1','5-2','5-3','6-0','6-1','6-2'].forEach(function(k) {
  var parts = k.split('-');
  var r = SimEngine.VSEPR.getGeometry(+parts[0], +parts[1]);
  console.log(k + ': ' + r.molecularGeometry + ' (' + r.idealAngle + '°)');
});

// Verify symmetric molecule is nonpolar
var g4 = SimEngine.VSEPR.getGeometry(4, 0);
var p4 = SimEngine.VSEPR.getPolarity('C', [
  { element: 'H', x: g4.atoms[0].x, y: g4.atoms[0].y, z: g4.atoms[0].z },
  { element: 'H', x: g4.atoms[1].x, y: g4.atoms[1].y, z: g4.atoms[1].z },
  { element: 'H', x: g4.atoms[2].x, y: g4.atoms[2].y, z: g4.atoms[2].z },
  { element: 'H', x: g4.atoms[3].x, y: g4.atoms[3].y, z: g4.atoms[3].z }
]);
console.log(p4.isPolar);         // false (CH4 is nonpolar — symmetric)
```

No regressions on existing sims (Gas Laws, Equilibrium, AcidBase, Electrochem) — the module is appended after the Electrochem IIFE.

---

### Task 2: HTML Scaffold + 3D Trackball Renderer

**Files:**
- Create: `1-Projects/SimEngine/SimEngine_VSEPR.html`

**What to build:**

Create the complete HTML file with:

**1. HTML structure** following the same pattern as `SimEngine_Electrochem.html`:
- `<head>` with Google Fonts (Inter, Fira Code), style guide CSS variables, all styles inline
- `<script src="../../3-Resources/SimEngine/SimEngine_Core.js"></script>`
- Header: "VSEPR & Molecular Geometry" with SL/HL and Teacher/Student toggles
- Main content area with left (canvas) / right (controls) layout using CSS grid

**2. CSS** matching existing sims:
- Same `.header`, `.sim-container`, `.sim-card`, `.sim-card-header`, `.sim-card-body` patterns
- Same color variables: `--navy: #1E293B`, `--teal: #0D9488`, `--purple: #7C3AED` for HL
- Same toggle, button, and card styling
- Responsive breakpoints at 900px and 600px
- Print styles hiding controls

**3. 3D Canvas (600x500 CSS, HiDPI scaled):**

The canvas rendering system needs:

**Rotation matrix:**
```javascript
var _rotMatrix = [1,0,0, 0,1,0, 0,0,1]; // 3x3 identity, stored flat

function multiplyMatrix(a, b) {
  // 3x3 matrix multiply, a and b are flat arrays of 9
  return [
    a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
    a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
    a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8]
  ];
}

function rotateX(angle) {
  var c = Math.cos(angle), s = Math.sin(angle);
  return [1,0,0, 0,c,-s, 0,s,c];
}

function rotateY(angle) {
  var c = Math.cos(angle), s = Math.sin(angle);
  return [c,0,s, 0,1,0, -s,0,c];
}

function applyMatrix(m, v) {
  return {
    x: m[0]*v.x + m[1]*v.y + m[2]*v.z,
    y: m[3]*v.x + m[4]*v.y + m[5]*v.z,
    z: m[6]*v.x + m[7]*v.y + m[8]*v.z
  };
}
```

**Perspective projection:**
```javascript
var FOCAL = 400;
var BOND_LEN = 120; // pixels, scale factor for unit vectors

function project(p3d) {
  // p3d is already rotated and scaled
  var scale = FOCAL / (p3d.z + FOCAL + 200); // +200 pushes scene back
  return {
    x: CANVAS_CX + p3d.x * scale,
    y: CANVAS_CY + p3d.y * scale,
    z: p3d.z,
    scale: scale
  };
}
```

**Mouse drag trackball:**
```javascript
var _dragging = false, _lastX = 0, _lastY = 0;

canvas.addEventListener('mousedown', function (e) {
  _dragging = true;
  _lastX = e.offsetX;
  _lastY = e.offsetY;
  _autoRotating = false;
  _idleTimer = 0;
});

canvas.addEventListener('mousemove', function (e) {
  if (!_dragging) return;
  var dx = e.offsetX - _lastX;
  var dy = e.offsetY - _lastY;
  _lastX = e.offsetX;
  _lastY = e.offsetY;
  var sensitivity = 0.01;
  _rotMatrix = multiplyMatrix(rotateY(dx * sensitivity), _rotMatrix);
  _rotMatrix = multiplyMatrix(rotateX(dy * sensitivity), _rotMatrix);
});

canvas.addEventListener('mouseup', function () { _dragging = false; });
canvas.addEventListener('mouseleave', function () { _dragging = false; });
```

Also add touch equivalents (touchstart/touchmove/touchend) for mobile.

**Auto-rotate:**
```javascript
var _autoRotate = true;
var _autoRotating = true;
var _idleTimer = 0;

// In render loop:
if (_autoRotate && !_dragging) {
  _idleTimer++;
  if (_idleTimer > 120) _autoRotating = true; // resume after 2s idle at 60fps
  if (_autoRotating) {
    _rotMatrix = multiplyMatrix(rotateY(0.008), _rotMatrix); // ~0.5°/frame
  }
}
```

**Depth-sorted rendering:**

In the main `draw()` function:
1. Compute all 3D positions: scale unit vectors by `BOND_LEN`, apply `_rotMatrix`, project to 2D
2. Build a draw list of all objects (atoms, lone pairs, bonds) with their z-depth
3. Sort by z (furthest first)
4. Draw in order: bonds first (lines), then lone pairs (lobes), then atoms (circles with labels)

**Atom drawing:**
```javascript
function drawAtom(ctx, px, py, scale, element, isCentral) {
  var baseR = isCentral ? 30 : 22;
  var r = baseR * scale;
  var color = SimEngine.VSEPR.CPK[element] || SimEngine.VSEPR.CPK['default'];
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Label
  ctx.fillStyle = (element === 'C' || element === 'Br' || element === 'I') ? '#FFFFFF' : '#1E293B';
  ctx.font = '700 ' + Math.round(12 * scale) + 'px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(element, px, py);
}
```

**Bond drawing:**
```javascript
function drawBond(ctx, fromPx, fromPy, toPx, toPy, order, scale) {
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = Math.max(2, 3 * scale);
  if (order <= 1) {
    ctx.beginPath(); ctx.moveTo(fromPx, fromPy); ctx.lineTo(toPx, toPy); ctx.stroke();
  } else {
    // Multiple lines offset perpendicular to bond axis
    var dx = toPx - fromPx, dy = toPy - fromPy;
    var len = Math.sqrt(dx*dx + dy*dy) || 1;
    var nx = -dy/len * 3, ny = dx/len * 3; // perpendicular offset
    for (var i = 0; i < Math.round(order); i++) {
      var off = (i - (Math.round(order)-1)/2) * 2;
      ctx.beginPath();
      ctx.moveTo(fromPx + nx*off, fromPy + ny*off);
      ctx.lineTo(toPx + nx*off, toPy + ny*off);
      ctx.stroke();
    }
  }
}
```

**Lone pair lobe drawing:**
```javascript
function drawLonePair(ctx, px, py, dirX, dirY, scale) {
  // Teardrop lobe pointing in direction (dirX, dirY) from atom center
  var lobeLen = 40 * scale;
  ctx.save();
  ctx.translate(px, py);
  var angle = Math.atan2(dirY, dirX);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(lobeLen*0.3, -lobeLen*0.25, lobeLen*0.8, -lobeLen*0.15, lobeLen, 0);
  ctx.bezierCurveTo(lobeLen*0.8, lobeLen*0.15, lobeLen*0.3, lobeLen*0.25, 0, 0);
  ctx.fillStyle = 'rgba(147, 51, 234, 0.25)'; // purple tint
  ctx.fill();
  ctx.strokeStyle = 'rgba(147, 51, 234, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
```

**Bond angle arc drawing:**
```javascript
function drawAngleArc(ctx, centerPx, centerPy, p1x, p1y, p2x, p2y, angleDeg) {
  var arcR = 30;
  var a1 = Math.atan2(p1y - centerPy, p1x - centerPx);
  var a2 = Math.atan2(p2y - centerPy, p2x - centerPx);
  ctx.beginPath();
  ctx.arc(centerPx, centerPy, arcR, a1, a2, false);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  // Angle label
  var midA = (a1 + a2) / 2;
  ctx.fillStyle = '#64748B';
  ctx.font = '600 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(angleDeg + '°', centerPx + arcR * 1.5 * Math.cos(midA), centerPy + arcR * 1.5 * Math.sin(midA));
}
```

**Animation loop:**
```javascript
var _animFrame;
function render() {
  _animFrame = requestAnimationFrame(render);
  draw();
}
render();
```

**4. Controls panel (right side):**

- Bonding pairs stepper: `[- 2 +]` buttons, range 1–6
- Lone pairs stepper: `[- 0 +]` buttons, range 0–3 (student), 0–5 (teacher)
- Preset molecule dropdown: `<select>` with optgroups by geometry type
- Toggles: Show Lone Pairs, Show Bond Angles, Show Polarity, Auto-Rotate
- Info readout div showing geometry results
- Data collection panel (collapsed by default)

**5. Wiring:**

When bonding/lone pairs change → call `SimEngine.VSEPR.getGeometry(bp, lp)` → store result → update readout → redraw canvas.

When preset selected → look up molecule → set bp/lp → set central/terminal elements → update polarity data → redraw.

When polarity toggle on and a preset is selected (real elements known) → call `SimEngine.VSEPR.getPolarity()` → render overlay arrows.

**Verification:** Load the page in browser. Default should show tetrahedral CH₄ (or 2bp/0lp linear). Click-drag to rotate the molecule. Change bonding pairs to 3, lone pairs to 1 → see trigonal pyramidal shape. Select H₂O preset → see bent molecule with correct atom labels. Toggle polarity → see dipole arrows and "Polar" label.

---

### Task 3: Polarity Overlay

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_VSEPR.html`

**What to build:**

Add polarity rendering to the existing draw function, controlled by the "Show Polarity" toggle.

When polarity is enabled AND a preset molecule is selected (so we know real elements):

**1. Bond dipole arrows:**

For each bond, draw an arrowhead along the bond pointing toward the more electronegative atom. Arrow size proportional to EN difference. Use the `getPolarity()` result's `bondDipoles` array.

```javascript
function drawBondDipole(ctx, fromPx, fromPy, toPx, toPy, magnitude) {
  if (magnitude < 0.05) return; // negligible
  // Arrow at midpoint of bond, pointing toward terminal
  var mx = (fromPx + toPx) / 2, my = (fromPy + toPy) / 2;
  var dx = toPx - fromPx, dy = toPy - fromPy;
  var len = Math.sqrt(dx*dx + dy*dy) || 1;
  var ux = dx/len, uy = dy/len;
  var arrowLen = Math.min(30, magnitude * 20);
  // Shaft
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx - ux * arrowLen, my - uy * arrowLen);
  ctx.lineTo(mx + ux * arrowLen, my + uy * arrowLen);
  ctx.stroke();
  // Arrowhead
  var hx = mx + ux * arrowLen, hy = my + uy * arrowLen;
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(hx, hy);
  ctx.lineTo(hx - ux*8 - uy*4, hy - uy*8 + ux*4);
  ctx.lineTo(hx - ux*8 + uy*4, hy - uy*8 - ux*4);
  ctx.closePath();
  ctx.fill();
  // Cross at negative end (δ+)
  var cx = mx - ux * arrowLen, cy = my - uy * arrowLen;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy); ctx.lineTo(cx + 4, cy);
  ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 4);
  ctx.stroke();
}
```

**2. Net dipole arrow:**

Bold green arrow from center of molecule in direction of net dipole vector (projected to 2D). Only drawn if `isPolar` is true.

```javascript
function drawNetDipole(ctx, centerPx, centerPy, netDipole3d) {
  // Project net dipole direction to 2D
  var rotated = applyMatrix(_rotMatrix, netDipole3d);
  var p = project({ x: rotated.x * BOND_LEN * 0.8, y: rotated.y * BOND_LEN * 0.8, z: rotated.z * BOND_LEN * 0.8 });
  ctx.strokeStyle = '#22C55E';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerPx, centerPy);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  // Arrowhead
  var dx = p.x - centerPx, dy = p.y - centerPy;
  var len = Math.sqrt(dx*dx + dy*dy) || 1;
  var ux = dx/len, uy = dy/len;
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - ux*12 - uy*6, p.y - uy*12 + ux*6);
  ctx.lineTo(p.x - ux*12 + uy*6, p.y - uy*12 - ux*6);
  ctx.closePath();
  ctx.fill();
}
```

**3. Polar/Nonpolar label** on canvas and EN values next to each atom.

**4. Polarity info in readout panel:**
- EN (central): value
- EN (terminal): value
- ΔEN: value
- Net dipole: Polar / Nonpolar
- Explanation text

**Verification:** Select H₂O → toggle polarity on → see red bond dipole arrows pointing from H toward O, green net dipole arrow pointing away from H side, "Polar" label. Select CH₄ → toggle polarity → see red bond dipole arrows but NO net dipole arrow, "Nonpolar" label. Select CO₂ → linear, dipoles cancel → "Nonpolar". Select BF₃ → same, "Nonpolar".

---

### Task 4: Geometry Reference Table

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_VSEPR.html`

**What to build:**

Collapsible panel below the main sim area (same collapse pattern as E° Calculator in Electrochem). Contains an HTML table showing all 13 molecular geometries.

Table columns: Electron Geometry | Molecular Geometry | Bonding Pairs | Lone Pairs | Bond Angle | Example | Hybridization (HL only)

Each row is clickable. Clicking a row:
1. Sets bonding pairs and lone pairs to match
2. Selects the example molecule preset
3. Updates the 3D view

Highlight the currently active row with a light background color.

**Verification:** Expand the table. Click "T-shaped" row → canvas shows ClF₃ with 3 bonding + 2 lone pairs. Click "Octahedral" row → canvas shows SF₆ with 6 bonding. Active row highlighted.

---

### Task 5: HL Panel + Hybridization/Sigma-Pi

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_VSEPR.html`

**What to build:**

Purple-bordered HL card (same pattern as other sims — hidden when SL mode, shown when HL toggled on).

**Contents:**

1. **Hybridization readout:**
   - Label: "sp³"
   - Description: "4 electron domains → 4 hybrid orbitals → sp³ hybridization"
   - Uses `SimEngine.VSEPR.getHybridization(electronDomains)`

2. **Sigma/Pi bond table:**
   - σ bonds: N
   - π bonds: N
   - Uses `SimEngine.VSEPR.getSigmaPi(bondOrders)` when a preset is selected
   - When build-your-own (no preset): show "σ bonds: N (assuming single bonds)" and "Select a preset for π bond data"

3. **Expanded octet indicator:**
   - If electron domains > 4: "Expanded octet — central atom uses d orbitals (period 3+)"
   - If ≤ 4: hidden or "No expanded octet"

4. **Wire to HL toggle:**
   - `#hlToggle` change event shows/hides the panel
   - Also shows hybridization column in reference table when HL mode on

**Verification:** Toggle HL on. Select CO₂ → hybridization "sp", σ bonds: 2, π bonds: 2. Select SF₆ → hybridization "sp³d²", expanded octet indicator shown. Select CH₄ → hybridization "sp³", σ bonds: 4, π bonds: 0, no expanded octet.

---

### Task 6: Data Collection

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_VSEPR.html`

**What to build:**

Data collection panel inside the controls area (same pattern as Electrochem). Uses `SimEngine.DataCollector`.

**Register variables:**

```javascript
SimEngine.DataCollector.registerVariables([
  { key: 'molecule', label: 'Molecule', getter: function () { return _currentPreset ? _currentPreset.formula : (bp + 'bp/' + lp + 'lp'); }, default: true },
  { key: 'electronDomains', label: 'Electron Domains', getter: function () { return _currentGeom ? _currentGeom.electronDomains : 0; }, default: true },
  { key: 'electronGeometry', label: 'Electron Geometry', getter: function () { return _currentGeom ? _currentGeom.electronGeometry : '—'; }, default: true },
  { key: 'molecularGeometry', label: 'Molecular Geometry', getter: function () { return _currentGeom ? _currentGeom.molecularGeometry : '—'; }, default: true },
  { key: 'bondAngle', label: 'Bond Angle (°)', getter: function () { return _currentGeom ? _currentGeom.idealAngle : 0; }, default: true },
  { key: 'lonePairs', label: 'Lone Pairs', getter: function () { return _lp; }, default: false },
  { key: 'isPolar', label: 'Polar', getter: function () { return _currentPolarity ? (_currentPolarity.isPolar ? 'Yes' : 'No') : '—'; }, default: false },
  { key: 'hybridization', label: 'Hybridization', getter: function () { return _currentGeom ? _currentGeom.hybridization : '—'; }, default: false, hl: true },
  { key: 'sigmaBonds', label: 'σ Bonds', getter: function () { return _currentSigmaPi ? _currentSigmaPi.sigmaBonds : 0; }, default: false, hl: true },
  { key: 'piBonds', label: 'π Bonds', getter: function () { return _currentSigmaPi ? _currentSigmaPi.piBonds : 0; }, default: false, hl: true }
]);
```

**Buttons:** Snapshot, Download CSV, Clear. Same pattern as Electrochem.

**Sweep mode (teacher):** Iterate through all MOLECULES presets, record a snapshot for each.

**Verification:** Assemble CH₄ → click Snapshot → table shows row. Change to H₂O → Snapshot → second row. Download CSV → file contains both rows. Teacher mode → Sweep → all ~30 presets recorded.

---

### Task 7: Polish — Responsive, Print, Keyboard, Teacher Mode

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_VSEPR.html`

**What to build:**

**1. Teacher mode controls:**
- When teacher toggle on: bonding pairs range extends to 1–6, lone pairs to 0–5
- Central atom dropdown (populated from EN keys)
- Terminal atom dropdown (same)
- Auto-rotate speed slider
- All teacher-only controls hidden in student mode

**2. Keyboard shortcuts:**
```javascript
document.addEventListener('keydown', function (e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  switch (e.key.toLowerCase()) {
    case 'l': toggleLonePairs(); break;
    case 'a': toggleAngles(); break;
    case 'p': togglePolarity(); break;
    case 'r': toggleAutoRotate(); break;
    case 'h': toggleHL(); break;
    case 't': toggleTeacher(); break;
    case 'arrowup': incrementBP(); break;
    case 'arrowdown': decrementBP(); break;
    case 'arrowleft': decrementLP(); break;
    case 'arrowright': incrementLP(); break;
  }
});
```

**3. Responsive:**
- 900px: single column (canvas full width, controls below)
- 600px: reduce padding, smaller header font
- Canvas scales to fit container width on mobile

**4. Print:**
- Hide controls, toggles, buttons
- Show canvas (static snapshot) + readout text
- HL panel visible if HL mode on

**5. Edge cases:**
- Prevent invalid configurations (0 bonding pairs)
- Handle preset with elements not in EN database gracefully (default EN = 0)
- Canvas resizes correctly on window resize

**Verification:** Resize to mobile → single column layout. Press keyboard shortcuts → controls respond. Print preview → clean output with molecule and readouts.

---

## Critical Files

| File | Path | Purpose |
|------|------|---------|
| SimEngine_Core.js | `3-Resources/SimEngine/SimEngine_Core.js` | Add Module 9: VSEPR (append after line 2874) |
| SimEngine_VSEPR.html | `1-Projects/SimEngine/SimEngine_VSEPR.html` | New deliverable |
| Design doc | `docs/plans/2026-04-01-vsepr-design.md` | Reference |
| Style guide | `3-Resources/IB_Chemistry_Tutorial_Style_Guide.md` | Visual reference |
| Electrochem HTML | `1-Projects/SimEngine/SimEngine_Electrochem.html` | Pattern reference for layout, data collection, toggles |
