# Electrochemistry Explorer -- Design Document

**Date:** 2026-04-01
**Scope:** Combined galvanic cell builder + electrolysis simulator + E° calculator

---

## Overview

Single-page simulation combining a drag-and-drop galvanic cell builder, an electrolysis simulator, and an E° calculator practice tool. Students assemble electrochemical cells from components, watch animated electron flow and ion migration, and see real-time E°cell calculations. A mode toggle swaps between galvanic (spontaneous) and electrolysis (forced) using the same visual framework, emphasizing the conceptual contrast. Teacher mode adds free electrolyte configuration for electrolysis and Faraday's law calculations (HL).

## Deliverables

| File | Change | Purpose |
|------|--------|---------|
| SimEngine_Core.js | Add `SimEngine.Electrochem` module | Half-cell database, E° calculations, discharge rules, Faraday's law |
| SimEngine_Electrochem.html | New file | Electrochemistry Explorer deliverable |

---

## Electrochem Engine (SimEngine.Electrochem)

### Half-Cell Database

~30 entries from the IB data booklet. Each entry:

```
{ key: 'Zn', ion: 'Zn²⁺', metal: 'Zn', formula: 'Zn²⁺/Zn',
  halfReaction: 'Zn²⁺ + 2e⁻ → Zn',
  E: -0.76, electrons: 2, state: 'solid',
  color: '#94A3B8' }
```

**Standard Electrode Potentials (IB Data Booklet):**

| Half-reaction | E° (V) |
|---------------|--------|
| Li⁺ + e⁻ → Li | -3.04 |
| K⁺ + e⁻ → K | -2.92 |
| Ca²⁺ + 2e⁻ → Ca | -2.87 |
| Na⁺ + e⁻ → Na | -2.71 |
| Mg²⁺ + 2e⁻ → Mg | -2.37 |
| Al³⁺ + 3e⁻ → Al | -1.66 |
| Mn²⁺ + 2e⁻ → Mn | -1.18 |
| Zn²⁺ + 2e⁻ → Zn | -0.76 |
| Fe²⁺ + 2e⁻ → Fe | -0.44 |
| Ni²⁺ + 2e⁻ → Ni | -0.26 |
| Sn²⁺ + 2e⁻ → Sn | -0.14 |
| Pb²⁺ + 2e⁻ → Pb | -0.13 |
| H⁺ + e⁻ → ½H₂ | 0.00 |
| Cu²⁺ + 2e⁻ → Cu | +0.34 |
| I₂ + 2e⁻ → 2I⁻ | +0.54 |
| Ag⁺ + e⁻ → Ag | +0.80 |
| Br₂ + 2e⁻ → 2Br⁻ | +1.07 |
| Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O | +1.33 |
| Cl₂ + 2e⁻ → 2Cl⁻ | +1.36 |
| MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O | +1.51 |
| F₂ + 2e⁻ → 2F⁻ | +2.87 |

Plus additional entries: Co²⁺, Cr³⁺, Fe³⁺/Fe²⁺, O₂/OH⁻, O₂/H₂O, S₂O₈²⁻, Au³⁺ as needed from the data booklet.

### E°cell Calculation

Given two half-cells:
- More negative E° = anode (oxidation, reversed)
- More positive E° = cathode (reduction)
- E°cell = E°cathode - E°anode
- Spontaneous if E°cell > 0

### Cell Notation

Generated automatically: `Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)`
- Anode on left, cathode on right
- Single bar = phase boundary
- Double bar = salt bridge

### Activity Series

Derived from E° ranking. All metals sorted from most negative (most reactive) to most positive (least reactive). Non-metals and complex ions excluded from the activity series display but remain in the half-cell table.

### Electrolysis Discharge Rules

**Molten electrolytes:**
- Cathode: cation reduced (metal deposited or gas)
- Anode: anion oxidized (non-metal, usually gas)

**Aqueous electrolytes:**
- Cathode: compare E° of cation vs H⁺/H₂O. More positive E° is discharged. If cation is more reactive than H⁺ (E° more negative than 0), H₂ produced instead.
- Anode: compare E° of anion vs OH⁻/H₂O. Halides (Cl⁻, Br⁻, I⁻) discharged preferentially at moderate-high concentration (kinetic factor). Otherwise O₂ from water.
- Active electrode: if anode metal matches cation, anode dissolves instead (e.g., Cu anode in CuSO₄).

### Faraday's Law (HL)

- Q = I × t (charge = current × time)
- moles of electrons = Q / F (F = 96485 C/mol)
- moles of product = moles of electrons / n (electrons per ion)
- mass of product = moles × molar mass

### Module API

```
SimEngine.Electrochem.init()

SimEngine.Electrochem.HALF_CELLS     -- half-cell database array
SimEngine.Electrochem.ELECTROLYTES   -- preset electrolyte database
SimEngine.Electrochem.F              -- Faraday constant

SimEngine.Electrochem.calculateCell(halfCellKeyA, halfCellKeyB)
  Returns: { anode, cathode, eCell, spontaneous, cellNotation,
             anodeReaction, cathodeReaction, electronTransfer }

SimEngine.Electrochem.getActivitySeries()
  Returns: [{ key, metal, E }] sorted most reactive first

SimEngine.Electrochem.predictElectrolysis(config)
  config: { cation, anion, state, electrodeType, concentration }
  Returns: { cathodeProduct, anodeProduct, cathodeReaction, anodeReaction, explanation }

SimEngine.Electrochem.faraday(current, time, electrons, molarMass)
  Returns: { charge, molesElectrons, molesProduct, massProduct }

SimEngine.Electrochem.deltaG(eCell, electronTransfer)
  Returns: { deltaG }  (ΔG° = -nFE°cell)
```

---

## Galvanic Cell Builder

### Drag-and-Drop Assembly

**Canvas** (~800x500) showing a workspace with:
- Two empty beaker positions (left and right) as snap zones
- Wire track across the top
- Salt bridge slot between beakers
- Voltmeter position on the wire

**Parts tray** below the canvas:
- Electrode strips (appear after half-cell selection)
- Salt bridge (U-tube piece)
- Wire (or auto-connects when electrodes placed)

**Snap zones:** Electrodes snap into left-beaker or right-beaker slots. Salt bridge snaps into its slot between beakers. Wire auto-connects once both electrodes are placed.

**Validation:**
- Both electrodes must be in separate beakers
- Salt bridge must be connected
- If both electrodes placed in same beaker: gentle error message
- Cell "complete" when all three conditions met → animation starts

### Cell Animation

Once assembled:
- **Electron flow**: small dots move along wire from anode to cathode
- **Anode dissolution**: metal atom sprites shrink, release electron dots, become colored ions drifting into solution
- **Cathode deposition**: ions approach electrode, gain electrons, deposit as solid (atom sprites grow on surface)
- **Salt bridge**: anions drift toward anode beaker, cations drift toward cathode beaker
- **Voltmeter**: displays E°cell value, needle animated
- **Speed**: proportional to E°cell magnitude

### Ion Colors

| Ion | Color |
|-----|-------|
| Cu²⁺ | #3B82F6 (blue) |
| Zn²⁺ | #94A3B8 (grey) |
| Fe²⁺ | #84CC16 (green) |
| Ag⁺ | #D1D5DB (silver) |
| Ni²⁺ | #22C55E (green) |
| Pb²⁺ | #6B7280 (dark grey) |
| SO₄²⁻ | #EAB308 (yellow) |
| NO₃⁻ | #F97316 (orange) |
| Cl⁻ | #10B981 (green) |

### Activity Series Sidebar

Displayed in the control panel:
- Metals ranked by E° (most negative at top = most reactive)
- When two electrodes selected, both highlight with anode/cathode labels
- Arrow indicating electron flow direction

### Controls

- Half-cell A dropdown (populated from database)
- Half-cell B dropdown
- Assemble / Reset buttons
- Animation speed slider (teacher)

---

## Electrolysis Simulator

### Mode Switch

Toggling from Galvanic to Electrolysis changes:
- Voltmeter replaced by battery/power supply icon on the wire
- Electrode labels: "anode (+)" and "cathode (-)"
- Electron flow direction reversed (anode to cathode via external circuit still, but anode is now positive)
- Parts tray removed (no assembly needed — cell auto-builds from electrolyte selection)

### Student Mode — Preset Electrolytes

| Preset | Electrolyte | State | Cathode Product | Anode Product |
|--------|-------------|-------|-----------------|---------------|
| 1 | NaCl | molten | Na(l) | Cl₂(g) |
| 2 | PbBr₂ | molten | Pb(l) | Br₂(g) |
| 3 | CuCl₂ | aqueous | Cu(s) | Cl₂(g) |
| 4 | CuSO₄ (inert electrodes) | aqueous | Cu(s) | O₂(g) |
| 5 | NaCl (concentrated) | aqueous | H₂(g) | Cl₂(g) |
| 6 | NaCl (dilute) | aqueous | H₂(g) | O₂(g) |
| 7 | H₂SO₄ (dilute) | aqueous | H₂(g) | O₂(g) |
| 8 | AgNO₃ | aqueous | Ag(s) | O₂(g) |
| 9 | CuSO₄ (Cu electrodes) | aqueous | Cu(s) deposits | Cu(s) dissolves |

### Teacher Mode — Build-Your-Own

- Cation dropdown (from half-cell database metals)
- Anion dropdown (Cl⁻, Br⁻, I⁻, SO₄²⁻, NO₃⁻, OH⁻)
- State toggle: molten / aqueous
- Concentration: dilute / concentrated (affects halide discharge)
- Electrode type: inert (graphite/platinum) / active (same metal as cation)
- Discharge rule engine predicts products with explanation text

### Animation

- **Metal deposition** (cathode): ions approach, gain electrons, build up on electrode surface
- **Gas evolution**: bubbles rise from electrode (H₂ = small, O₂ = small, Cl₂ = yellow-green tint)
- **Active anode dissolving**: atoms leave anode surface, become ions in solution
- **Ion migration**: cations toward cathode, anions toward anode
- **Molten state**: no water molecules, just ions. Aqueous: subtle water molecule background.

---

## E° Calculator (Practice Mode)

Collapsible panel below the cell view.

### Half-Cell Table

Full ~30 entries displayed in a scrollable table, sorted by E° (most negative at top). Columns: half-reaction, E° (V). Click a row to select it as half-cell A or B.

### Calculation Display

After selecting two half-cells:
- Both half-reactions written out (cathode as reduction, anode reversed as oxidation)
- E°cell = E°cathode - E°anode with numerical values substituted
- Cell notation
- Spontaneous? (Yes if E°cell > 0)

### Quiz Mode

Toggle that hides the calculated E°cell. Student enters their answer in an input field. System checks: correct (green), incorrect (red, shows correct answer). Tracks score (e.g., "7/10 correct").

---

## HL Panel

Purple-bordered card (same pattern as other sims).

### Faraday's Law Calculator

- Current input (A): number field, 0.1-10.0
- Time input: number field + unit toggle (seconds / minutes / hours)
- Half-reaction: auto-populated from selected cell, or dropdown to pick any
- Live readout:
  - Q = I × t = ___ C
  - Moles of e⁻ = Q / F = ___
  - Moles of product = moles e⁻ / n = ___
  - Mass of product = moles × M = ___ g

### Additional HL Readouts

- ΔG° = -nFE°cell (with values substituted)
- Minimum voltage required for non-spontaneous cell (electrolysis): |E°cell|
- Standard conditions: 298 K, 1 mol/L, 1 atm

---

## Data Collection

Uses existing SimEngine.DataCollector module.

### Variables

| Key | Label | Default | HL |
|-----|-------|---------|-----|
| halfCellA | Half-cell A | yes | no |
| halfCellB | Half-cell B | yes | no |
| eCell | E°cell (V) | yes | no |
| anode | Anode | no | no |
| cathode | Cathode | no | no |
| spontaneous | Spontaneous | no | no |
| charge | Charge (C) | no | yes |
| molesElectrons | Moles e⁻ | no | yes |
| massProduct | Mass product (g) | no | yes |

### Adaptations

This sim is configuration-driven (not time-driven or volume-driven):
- **Snapshot**: capture current cell configuration at any time
- **Sweep** (teacher): iterate through all pairs from a selected set of metals (e.g., pick 5 metals → record E°cell for all 10 pairs)
- No auto-collect or timed collection

---

## Page Layout

```
+------------------------------------------------------+
|  .header — "Electrochemistry Explorer"                |
|  [SL/HL toggle] [Teacher/Student toggle]              |
+------------------------------------------------------+
|                                                       |
|  Mode: ( Galvanic Cell ) / ( Electrolysis )           |
|                                                       |
|  +---------------------+  +------------------------+ |
|  |  CELL CANVAS         |  |  CONTROL PANEL          | |
|  |  (800x500)           |  |  Half-cell A: [dropdown] | |
|  |  Beakers, electrodes |  |  Half-cell B: [dropdown] | |
|  |  Wire, salt bridge   |  |  Electrolyte: [dropdown] | |
|  |  Animated e- flow    |  |  [Assemble] [Reset]      | |
|  |  Ion migration       |  |                          | |
|  |                      |  |  -- ACTIVITY SERIES --   | |
|  |                      |  |  Ranked metals list      | |
|  |                      |  |  Highlights selected     | |
|  |  PARTS TRAY          |  |                          | |
|  |  [electrode][bridge]  |  |  -- LIVE READOUT --      | |
|  |  [wire]              |  |  E°cell: +1.10 V        | |
|  |                      |  |  Anode: Zn (oxidation)   | |
|  |                      |  |  Cathode: Cu (reduction) | |
|  |                      |  |  Cell notation: Zn|Zn²⁺… | |
|  |                      |  |  Spontaneous: Yes        | |
|  |                      |  |                          | |
|  |                      |  |  -- DATA COLLECTION --   | |
|  +---------------------+  +------------------------+ |
|                                                       |
|  +--------------------------------------------------+ |
|  |  E° Calculator (collapsible)                      | |
|  |  Half-cell table + practice calculation + quiz    | |
|  +--------------------------------------------------+ |
|                                                       |
|  +--------------------------------------------------+ |
|  |  [HL] Electrochemistry Calculations               | |
|  |  Faraday's law + ΔG° = -nFE°cell                 | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
```

Responsive: single column below 900px. Print: show cell diagram + readouts, hide drag controls and parts tray.

---

## Critical Differences from Previous Sims

1. **Configuration-driven**: No time/volume axis. Cell is static once assembled. Data collection is snapshot-based.
2. **Drag-and-drop**: New interaction pattern — snap zones for cell assembly. Parts tray below canvas.
3. **Mode toggle**: Galvanic/Electrolysis swap the same visual framework with reversed electron flow.
4. **Discharge rule engine**: Electrolysis product prediction requires logic for aqueous vs molten, active vs inert electrodes, concentration effects.
5. **Quiz mode**: E° calculator has a self-test feature — new pattern not in other sims.
6. **New module**: SimEngine.Electrochem is pure data + calculation (no particle arrays, no frame stepping).
