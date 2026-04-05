# VSEPR & Molecular Geometry Explorer -- Design Document

**Date:** 2026-04-01
**Scope:** 3D molecular shape viewer + polarity analysis with build-your-own electron domain configuration

---

## Overview

Single-page simulation combining an interactive 3D VSEPR shape viewer with a polarity analysis overlay. Students set bonding pairs and lone pairs to build molecular geometries, watching a rotatable 3D model update instantly. A preset dropdown maps real molecules onto their domain configurations. A toggleable polarity overlay adds bond dipole arrows and net dipole vector. Teacher mode adds free element selection and animation controls. HL extends with hybridization labels, sigma/pi bond counts, and expanded octet indicators.

## Deliverables

| File | Change | Purpose |
|------|--------|---------|
| SimEngine_Core.js | Add `SimEngine.VSEPR` module | Geometry calculator, molecule database, polarity, hybridization |
| SimEngine_VSEPR.html | New file | VSEPR & Molecular Geometry Explorer deliverable |

---

## VSEPR Engine (SimEngine.VSEPR)

### Molecule Database

~30 preset molecules. Each entry:

```
{ key: 'H2O', name: 'Water', formula: 'H₂O',
  central: 'O', terminal: ['H', 'H'],
  bondingPairs: 2, lonePairs: 2,
  electronDomains: 4, molecularGeometry: 'bent',
  electronGeometry: 'tetrahedral',
  bondAngle: 104.5, hybridization: 'sp³',
  sigmaBonds: 2, piBonds: 0,
  bondOrders: [1, 1],
  expandedOctet: false }
```

**Presets organized by geometry:**

| Electron Domains | Lone Pairs | Molecular Geometry | Bond Angle | Examples |
|---|---|---|---|---|
| 2 | 0 | Linear | 180° | BeCl₂, CO₂, HCN |
| 3 | 0 | Trigonal planar | 120° | BF₃, SO₃, NO₃⁻ |
| 3 | 1 | Bent | ~117° | SO₂, O₃, NO₂⁻ |
| 4 | 0 | Tetrahedral | 109.5° | CH₄, NH₄⁺, CCl₄ |
| 4 | 1 | Trigonal pyramidal | ~107° | NH₃, PCl₃, H₃O⁺ |
| 4 | 2 | Bent | ~104.5° | H₂O, H₂S, SCl₂ |
| 5 | 0 | Trigonal bipyramidal | 90°/120° | PCl₅ |
| 5 | 1 | Seesaw | ~90°/120° | SF₄ |
| 5 | 2 | T-shaped | ~90° | ClF₃, BrF₃ |
| 5 | 3 | Linear | 180° | XeF₂, I₃⁻ |
| 6 | 0 | Octahedral | 90° | SF₆ |
| 6 | 1 | Square pyramidal | ~90° | BrF₅, IF₅ |
| 6 | 2 | Square planar | 90° | XeF₄ |

### 3D Coordinate Generator

Given `bondingPairs` and `lonePairs`, compute unit vectors for each domain position:
- 2 domains: linear (±z axis)
- 3 domains: trigonal planar (xy plane, 120° apart)
- 4 domains: tetrahedral (standard orientations)
- 5 domains: trigonal bipyramidal (lone pairs placed equatorial first)
- 6 domains: octahedral (lone pairs placed opposite each other)

Lone pairs always occupy the positions that minimize repulsion:
- Trigonal bipyramidal: equatorial positions first
- Octahedral: opposite positions (trans)

Returns: `{ atoms: [{x,y,z,element,type}], lonePairs: [{x,y,z}], bonds: [{from,to,order}] }`

### Electronegativity Database

| Element | EN (Pauling) |
|---------|-------------|
| H | 2.20 |
| B | 2.04 |
| C | 2.55 |
| N | 3.04 |
| O | 3.44 |
| F | 3.98 |
| P | 2.19 |
| S | 2.58 |
| Cl | 3.16 |
| Br | 2.96 |
| I | 2.66 |
| Se | 2.55 |
| Xe | 2.60 |
| Be | 1.57 |

Plus additional elements as needed for the preset molecules.

### Polarity Calculator

- Bond dipole magnitude = |EN(terminal) - EN(central)|
- Bond dipole vector = magnitude × unit vector from central toward terminal (direction: toward more EN atom)
- Net dipole = vector sum of all bond dipoles
- Polar if |net dipole| > 0.1 (threshold accounts for floating-point cancellation in symmetric molecules)
- Explanation generated: symmetric cancellation vs. asymmetric geometry

### Hybridization (HL)

Derived from electron domain count:

| Electron Domains | Hybridization |
|---|---|
| 2 | sp |
| 3 | sp² |
| 4 | sp³ |
| 5 | sp³d |
| 6 | sp³d² |

### Sigma/Pi Bonds (HL)

- σ bonds = number of bonding pairs (every bond has exactly one sigma)
- π bonds = sum of (bond order - 1) for each bond
- For presets: bond orders known from database (CO₂ = two double bonds → 2σ + 2π)
- For build-your-own without preset: assume all single bonds (σ only), with note displayed

### Module API

```
SimEngine.VSEPR.MOLECULES          -- preset molecule database array
SimEngine.VSEPR.EN                 -- electronegativity lookup object

SimEngine.VSEPR.getGeometry(bondingPairs, lonePairs)
  Returns: { electronDomains, electronGeometry, molecularGeometry,
             idealAngle, hybridization, coords }
  coords: { atoms: [{x,y,z}], lonePairs: [{x,y,z}] }

SimEngine.VSEPR.getPolarity(config)
  config: { central, terminals: [{element, position: {x,y,z}}] }
  Returns: { bondDipoles: [{from,to,magnitude,vector}],
             netDipole: {x,y,z,magnitude}, isPolar, explanation }

SimEngine.VSEPR.getHybridization(electronDomains)
  Returns: { hybridization, description }

SimEngine.VSEPR.getSigmaPi(bondOrders)
  Returns: { sigmaBonds, piBonds }
```

---

## 3D Rendering

### Canvas Trackball

Canvas (~600x500) with perspective projection.

**Coordinate system:** Central atom at origin. Surrounding atoms at computed 3D positions, scaled to bond length ~120px.

**Rotation:** Mouse drag applies rotation around x/y axes. Cumulative 3x3 rotation matrix, updated on each drag delta. All positions multiplied by rotation matrix before projection.

**Perspective projection:** `screenX = centerX + x * focalLength / (z + focalLength)`. Focal length ~400.

**Depth sorting:** Draw back-to-front — atoms further from camera rendered first.

### Atom Rendering

- **Central atom**: Circle ~30px radius, CPK color (C=dark grey, N=blue, O=red, S=yellow, F=green, Cl=green, etc.)
- **Terminal atoms**: Circle ~22px radius, CPK color
- **Element labels**: White text centered on each atom circle
- **Bonds**: Lines between central and terminal atoms. Single=1 line, double=2 parallel lines, triple=3 lines. Line thickness scales slightly with z-depth.

### CPK Colors

| Element | Color |
|---------|-------|
| H | #FFFFFF (white, dark border) |
| C | #374151 (dark grey) |
| N | #3B82F6 (blue) |
| O | #EF4444 (red) |
| F | #22C55E (green) |
| Cl | #10B981 (green) |
| Br | #92400E (dark red) |
| I | #7C3AED (purple) |
| S | #EAB308 (yellow) |
| P | #F97316 (orange) |
| B | #F59E0B (amber) |
| Be | #84CC16 (lime) |
| Xe | #06B6D4 (cyan) |

### Lone Pair Rendering

Teardrop/lobe shapes pointing outward from central atom. Drawn as two bezier curves forming a lobe. Fill: central atom color at ~25% opacity. Toggleable via "Show Lone Pairs" checkbox (default: on).

### Bond Angle Display

Dashed arc drawn between two adjacent bonding positions, with angle label (e.g., "109.5°"). Only shown for one representative angle per geometry. Toggleable via "Show Angles" checkbox (default: on).

### Polarity Overlay (toggle off by default)

When "Show Polarity" enabled:
- **Bond dipole arrows**: Arrowhead along each bond pointing toward more electronegative atom. Arrow size proportional to EN difference. Color: red.
- **Net dipole arrow**: Bold green arrow from central atom showing resultant dipole vector. Prominent arrowhead.
- **"Polar" / "Nonpolar"** label on canvas, color-coded (red/green)
- **EN values** displayed next to each atom in small text

### Auto-Rotate

Slow rotation (~0.5°/frame around y-axis) when user is not dragging. Stops on mouse down, resumes on mouse up after 2 seconds idle. Toggleable via "Auto-Rotate" checkbox (default: on).

---

## Controls

### Student Mode — Build-Your-Own

- **Bonding Pairs**: Stepper buttons (+ / -), range 1–6
- **Lone Pairs**: Stepper buttons (+ / -), range 0–3
- Changing either value instantly updates the 3D model
- Invalid combinations (e.g., 0 bonding pairs) prevented by min value

### Student Mode — Preset Molecules

Dropdown grouped by geometry type:

```
— Linear (180°) —
BeCl₂
CO₂
HCN
— Trigonal Planar (120°) —
BF₃
SO₃
...
```

Selecting a preset:
1. Sets bonding pairs and lone pairs
2. Sets central and terminal elements
3. Updates polarity data (real EN values)
4. Shows molecular formula and name in readout

### Teacher Mode

- Bonding pairs 1–6, lone pairs 0–5 (any combination)
- Central atom dropdown (elements from EN database)
- Terminal atom dropdown (elements from EN database) — all terminals same element
- Auto-rotate speed slider

### View Toggles

| Toggle | Default | Effect |
|--------|---------|--------|
| Show Lone Pairs | On | Render/hide lone pair lobes |
| Show Bond Angles | On | Render/hide angle arcs + labels |
| Show Polarity | Off | Render/hide dipole arrows + EN values |
| Auto-Rotate | On | Enable/disable continuous y-rotation |

---

## Info Readout

Always visible beside the canvas:

**Geometry info (always shown):**
- Electron domains: 4
- Electron geometry: Tetrahedral
- Molecular geometry: Bent
- Bond angle: ~104.5°
- Bonding pairs: 2 | Lone pairs: 2

**Molecule info (when preset selected):**
- Formula: H₂O
- Name: Water

**Polarity info (when polarity toggle on):**
- EN (central): 3.44 (O)
- EN (terminal): 2.20 (H)
- ΔEN: 1.24
- Net dipole: Polar
- Explanation: "Bond dipoles do not cancel due to asymmetric geometry"

---

## HL Panel

Purple-bordered card (same pattern as other sims).

### Hybridization

- Label: sp³
- Description: "4 electron domains → 4 hybrid orbitals → sp³ hybridization"
- For expanded octets: "5 electron domains → sp³d hybridization (uses d orbitals)"

### Sigma/Pi Bonds

- σ bonds: 2
- π bonds: 0
- For preset molecules with double/triple bonds: "CO₂: 2 σ bonds + 2 π bonds (2 double bonds)"
- For build-your-own: "Assuming all single bonds — select a preset for accurate π bond count"

### Expanded Octet Indicator

- If electron domains > 4: "Expanded octet — requires d orbitals (period 3+)"
- If electron domains ≤ 4: not shown

---

## Geometry Reference Table

Collapsible panel below the main sim area. Shows all 13 molecular geometries:

| E-Geometry | M-Geometry | BP | LP | Angle | Example | Diagram |
|---|---|---|---|---|---|---|
| Linear | Linear | 2 | 0 | 180° | CO₂ | ○—●—○ |
| Trig. planar | Trig. planar | 3 | 0 | 120° | BF₃ | ... |
| ... | ... | ... | ... | ... | ... | ... |

Clicking a row loads that geometry into the 3D viewer (sets bonding pairs and lone pairs, selects the example molecule as preset).

---

## Data Collection

Uses existing SimEngine.DataCollector module.

### Variables

| Key | Label | Default | HL |
|-----|-------|---------|-----|
| molecule | Molecule | yes | no |
| electronDomains | Electron Domains | yes | no |
| electronGeometry | Electron Geometry | yes | no |
| molecularGeometry | Molecular Geometry | yes | no |
| bondAngle | Bond Angle (°) | yes | no |
| lonePairs | Lone Pairs | no | no |
| isPolar | Polar | no | no |
| hybridization | Hybridization | no | yes |
| sigmaBonds | σ Bonds | no | yes |
| piBonds | π Bonds | no | yes |

### Adaptations

Configuration-driven (same as Electrochemistry):
- **Snapshot**: Capture current molecule configuration
- **Sweep** (teacher): Iterate through all presets, record data for each
- No auto-collect or timed collection

---

## Page Layout

```
+------------------------------------------------------+
|  .header — "VSEPR & Molecular Geometry"               |
|  [SL/HL toggle] [Teacher/Student toggle]              |
+------------------------------------------------------+
|                                                       |
|  +---------------------+  +------------------------+ |
|  |  3D CANVAS           |  |  CONTROL PANEL          | |
|  |  (600x500)           |  |  Bonding Pairs: [- 2 +] | |
|  |  Rotatable molecule  |  |  Lone Pairs:    [- 2 +] | |
|  |  Lone pair lobes     |  |  Preset: [H₂O ▾]       | |
|  |  Bond angle arcs     |  |                          | |
|  |  Polarity arrows     |  |  [✓] Lone Pairs         | |
|  |  (when toggled)      |  |  [✓] Bond Angles        | |
|  |                      |  |  [ ] Polarity            | |
|  |                      |  |  [✓] Auto-Rotate         | |
|  |                      |  |                          | |
|  |                      |  |  -- INFO READOUT --      | |
|  |                      |  |  Electron domains: 4     | |
|  |                      |  |  E-geometry: Tetrahedral | |
|  |                      |  |  M-geometry: Bent        | |
|  |                      |  |  Bond angle: 104.5°      | |
|  |                      |  |                          | |
|  |                      |  |  -- DATA COLLECTION --   | |
|  +---------------------+  +------------------------+ |
|                                                       |
|  +--------------------------------------------------+ |
|  |  Geometry Reference Table (collapsible)           | |
|  |  All 13 geometries — click to load                | |
|  +--------------------------------------------------+ |
|                                                       |
|  +--------------------------------------------------+ |
|  |  [HL] Hybridization & Bonding                     | |
|  |  Hybridization: sp³ | σ bonds: 2 | π bonds: 0    | |
|  |  Expanded octet: No                               | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
```

Responsive: single column below 900px. Print: show 3D canvas snapshot + readouts, hide controls and toggles.

---

## Critical Differences from Previous Sims

1. **3D rendering**: First sim with interactive 3D rotation via trackball. All previous sims used 2D canvas only.
2. **Build-your-own**: Primary interaction is configuring abstract parameters (bonding/lone pairs), not selecting chemicals.
3. **No time axis**: Completely static — no animation loop, no play/pause. Only auto-rotate is animated.
4. **Polarity as overlay**: Separate visual layer toggled on/off, not a separate mode.
5. **Reference table as navigation**: Clicking geometry rows loads them into the viewer.
6. **New module**: SimEngine.VSEPR is pure data + 3D coordinate math (no particle arrays, no frame stepping).
