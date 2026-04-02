# Enthalpy & Energy Profiles Explorer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive energy profile diagram tool with 20 reactions, catalyst overlay, and HL bond enthalpy calculator.

**Architecture:** Single-file HTML (`SimEngine_EnthalpyProfiles.html`) with Canvas 2D rendering for energy profiles, HTML divs for bond enthalpy bars, CSS grid layout (240px sidebar + 1fr), SimEngine.State for reactive state management. No innerHTML — all DOM via createElement/textContent.

**Tech Stack:** Vanilla JS, Canvas 2D, CSS Grid, SimEngine_Core.js (State, Controls modules)

---

### Task 1: HTML Skeleton + CSS

**Files:**
- Create: `SimEngine_EnthalpyProfiles.html`

**Step 1: Create the file with complete HTML structure and CSS**

Copy the CSS variable system, header, grid layout, sim-card, palette, and keyboard hint patterns from `SimEngine_IMFComparison.html`. Adapt for this sim:

- Header: "Enthalpy & Energy Profiles Explorer", subtitle "IB Chemistry — R1.1 Enthalpy Changes", badges R1.1 + HL
- Grid: `.sim-top-row` with `grid-template-columns: 240px 1fr`
- Left column: `.palette-panel` (sticky, max-height 600px, scrollable body with search + category sections + preset dropdown)
- Right column: `.main-panel` containing:
  - `.sim-card` with canvas `#profileCanvas` (680×420)
  - `.sim-card` reaction info panel `#infoPanel`
  - `.hl-panel` with bond enthalpy calculator `#bondPanel`
- Keyboard hint bar at bottom
- Responsive breakpoint at 900px (single column)
- `.hl-panel { display: none; } body.hl-active .hl-panel { display: block; }` pattern

**Step 2: Verify in browser**

Open `http://localhost:8765/1-Projects/SimEngine/SimEngine_EnthalpyProfiles.html`
Expected: Empty layout with header, sidebar, canvas placeholder, info panel area. No JS errors.

**Step 3: Commit**
```
git add SimEngine_EnthalpyProfiles.html
git commit -m "feat: scaffold Enthalpy Profiles Explorer HTML + CSS"
```

---

### Task 2: Reaction Data + Bond Enthalpy Table

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html` (add `<script>` section)

**Step 1: Add the IIFE wrapper, constants, and reaction data**

Inside `<script>`, create:
- `BOND_ENERGIES` object: `{ 'C-H': 414, 'O-H': 463, ... }` — all 18 bond types from IB Data Booklet Section 11
- `CATEGORIES` array: combustion, neutralization, decomposition, dissolution, synthesis, hl
- `REACTIONS` array: 20 reaction objects with schema:
  ```javascript
  { id, equation, deltaH, Ea, type, category, hlOnly, catalystNote,
    bonds: { broken: [{bond, count, energy}], formed: [{bond, count, energy}] } or null }
  ```
- `RXN_MAP` object for ID lookup
- Unicode subscripts for all equations (₂, ₃, ₄, ₅ — NO innerHTML/sub tags)

Reference: Design doc Section "Reaction Library" for all 20 reactions and their data.

**Step 2: Verify data loads**

Console: `REACTIONS.length` should be 20. `BOND_ENERGIES['C-H']` should be 414.

**Step 3: Commit**
```
git commit -m "feat: embed 20 reaction data objects + bond enthalpy table"
```

---

### Task 3: Reaction Palette

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Build palette rendering**

- `buildPalette()`: iterate CATEGORIES, create category headers + reaction items (createElement pattern, NO innerHTML)
- Each reaction item: button with equation text, click handler calls `selectReaction(id)`
- Active reaction gets `.active` class (teal border/bg)
- HL reactions get `.hl-rxn` class, hidden by default, shown via `body.hl-active .hl-rxn { display: block; }`
- Search filter: `#rxnSearch` input filters by equation text
- Preset dropdown: `#presetSelect` with 5 presets from design doc

**Step 2: Build preset loading**

- `PRESETS` array: 5 presets, each with `{name, rxnId, catalyst, hlMode}`
- Preset select handler: clears state, loads specified reaction, sets catalyst/HL as needed

**Step 3: Verify**

Click reactions in palette → console logs selected ID. Search filters correctly. Presets load.

**Step 4: Commit**
```
git commit -m "feat: reaction palette with search and teacher presets"
```

---

### Task 4: Energy Profile Canvas — Core Rendering

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Implement energy profile rendering**

- `drawEnergyProfile(rxn, options)` function:
  - Canvas setup: 680×420 logical, DPR scaling, margins {top:40, right:30, bottom:50, left:60}
  - Compute energy levels: `reactantE = 0`, `productE = deltaH`, `transitionE = Ea`
  - Scale Y-axis to fit all levels with 15% padding
  - Draw reactant plateau (x=0.02 to 0.10), product plateau (x=0.90 to 0.98)
  - Draw bezier curve — two cubic segments joined at transition state:
    - Segment 1: (0.10, reactantE) → control points → (0.50, transitionE)
    - Segment 2: (0.50, transitionE) → control points → (0.90, productE)
  - Color: red (#DC2626) for exo, blue (#2563EB) for endo
  - Background tint: subtle color wash between energy levels
  - X-axis label: "Reaction progress →"
  - Y-axis label: "Enthalpy / kJ" (rotated)

**Step 2: Wire up selection**

- `selectReaction(id)`: sets `_selectedRxn`, calls `drawEnergyProfile()`, updates palette active state

**Step 3: Verify**

Select CH₄ combustion → red curve with products lower. Select CaCO₃ decomposition → blue curve with products higher.

**Step 4: Commit**
```
git commit -m "feat: energy profile canvas with bezier curve rendering"
```

---

### Task 5: Annotations (ΔH + Ea Arrows)

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Add annotation rendering to drawEnergyProfile**

When `_annotationsOn` is true:
- **ΔH arrow**: double-headed vertical at x=0.82, between reactant and product levels. Label "ΔH = −890 kJ/mol". Red for exo (pointing down), blue for endo (pointing up).
- **Ea arrow**: single-headed vertical at x=0.35, from reactant level to transition state. Label "Ea = +218 kJ/mol". Teal (#0D9488).
- **Text labels**: "Reactants" at left plateau, "Products" at right plateau, "Transition state" at peak with dot marker
- Arrow rendering: `drawArrow(ctx, x1, y1, x2, y2, color, doubleHead)` helper function

**Step 2: Verify**

Annotations visible by default. Toggle off → arrows disappear, curve remains.

**Step 3: Commit**
```
git commit -m "feat: ΔH and Ea annotation arrows on energy profile"
```

---

### Task 6: Catalyst Overlay

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Add catalyst curve rendering**

When `_catalystOn` is true:
- Second bezier curve with `setLineDash([8, 6])`, 2.5px, green (#059669)
- Same reactant/product levels (ΔH unchanged)
- Lower transition state: `catTransitionE = Ea * 0.55`
- If annotations on: second Ea arrow in green, labeled "Ea (catalyzed)"
- Legend box in top-right: solid line = "Without catalyst", dashed green = "With catalyst"
- Catalyst note text (e.g., "MnO₂ catalyst") shown in info panel

**Step 2: Verify**

Toggle catalyst → dashed green curve appears below main curve. Both share same start/end levels.

**Step 3: Commit**
```
git commit -m "feat: catalyst overlay with lowered Ea visualization"
```

---

### Task 7: Reaction Info Panel

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Build info panel rendering**

- `updateInfoPanel(rxn)` function:
  - Equation text (createElement, textContent — Unicode subscripts)
  - ΔH value: colored red (negative) or blue (positive), with units
  - Ea value: teal, with units
  - Type badge: pill element, red bg "EXOTHERMIC" or blue bg "ENDOTHERMIC"
  - Catalyst toggle checkbox (wired to `_catalystOn` state)
  - Annotations toggle checkbox (wired to `_annotationsOn` state)

**Step 2: Verify**

Select different reactions → info panel updates with correct equation, values, badge color.

**Step 3: Commit**
```
git commit -m "feat: reaction info panel with equation, values, and toggles"
```

---

### Task 8: Curve Draw Animation

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Implement animation system**

- Animation state: `_anim = { progress: 0, phase: 'idle', startTime: 0 }`
- `easeInOutCubic(t)` easing function
- `startDrawAnimation()`: sets phase to 'drawing', starts requestAnimationFrame loop
- `animate()` function:
  - 'drawing' phase: draw bezier curve up to parametric `t = progress` (0→1 over 1.5s)
  - After curve complete → 'labels' phase: fade in annotations over 300ms
  - After labels → 'catalyst' phase (if enabled): draw catalyst curve over 500ms
  - After all complete → 'complete' phase: stop animation loop
- On reaction change: fade out old (300ms opacity), start new draw animation
- `startAnimation()` / stop pattern (same as IMF sim — only run rAF when needed)

**Step 2: Verify**

Click different reactions → curve draws smoothly left-to-right, labels fade in after.

**Step 3: Commit**
```
git commit -m "feat: animated curve draw with eased progression"
```

---

### Task 9: HL Bond Enthalpy Calculator

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Build bond enthalpy panel**

- `updateBondPanel(rxn)` function:
  - If `rxn.bonds === null`: show note "Bond enthalpy calculations apply to gaseous covalent reactions only"
  - Otherwise:
    - Compute `totalBroken = Σ(count × energy)` for broken bonds
    - Compute `totalFormed = Σ(count × energy)` for formed bonds
    - `calcDeltaH = totalBroken - totalFormed`
  - **Stacked bars** (HTML divs):
    - "Bonds Broken (endothermic)" bar: segments colored by bond type, total labeled
    - "Bonds Formed (exothermic)" bar: same pattern
    - "Net ΔH" bar: colored red/blue
  - **Itemized table**: two columns, each bond with count × energy = subtotal
  - **Calculation line**: "ΔH = Σ(broken) − Σ(formed) = X − Y = Z kJ/mol"
  - **Discrepancy note**: "Bond enthalpies are average values — calculated ΔH is approximate. Data booklet value: [actual ΔH]"

**Step 2: Verify**

Enable HL → bond panel appears. Select CH₄ combustion → shows 4×C-H + 2×O=O broken, 2×C=O + 4×O-H formed. Select NaCl dissolution → shows "ionic" note.

**Step 3: Commit**
```
git commit -m "feat: HL bond enthalpy calculator with stacked bars"
```

---

### Task 10: Keyboard Shortcuts + SL/HL Toggle + Final Integration

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Add keyboard handler**

- `document.addEventListener('keydown', ...)`:
  - H → toggle HL (via SimEngine.Controls toggle)
  - T → toggle teacher/student
  - C → toggle catalyst overlay, redraw
  - A → toggle annotations, redraw
  - ↑/↓ → select previous/next reaction in palette
  - R → reset to default (CH₄ combustion, catalyst off, annotations on)
  - / → focus search
  - Esc → clear search, deselect

**Step 2: Wire SL/HL toggle**

- SimEngine.State listener on hlEnabled: `document.body.classList.toggle('hl-active', isHL)`
- Redraw palette (show/hide HL reactions), redraw bond panel
- Teacher mode: show preset dropdown

**Step 3: Add init function**

- `init()`: build palette, set up toggles, select default reaction, start animation
- DOMContentLoaded guard

**Step 4: Full verification (all 10 items from design doc)**

1. Select reactions → energy profile updates ✓
2. Exo = red + products lower, endo = blue + products higher ✓
3. Catalyst toggle → dashed green overlay ✓
4. Annotations toggle → arrows show/hide ✓
5. Curve animates on reaction change ✓
6. HL toggle → bond enthalpy calculator ✓
7. Bond enthalpy values match IB Data Booklet ✓
8. Teacher presets work ✓
9. Keyboard shortcuts work ✓
10. Search filters palette ✓

**Step 5: Commit**
```
git commit -m "feat: keyboard shortcuts, SL/HL toggle, final integration"
```

---

### Task 11: Code Review + Polish

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html`

**Step 1: Run code review agent**

Check for: innerHTML violations, roundRect polyfill, animation efficiency, accessibility, data accuracy.

**Step 2: Fix any issues found**

**Step 3: Final commit**
```
git commit -m "fix: address code review findings for Enthalpy Profiles"
```
