# Stoichiometry & Quantitative Analysis — Design Document (Sim #14)

> **IB Topic:** R2.1 How Much? The Amount of Chemical Change
> **File:** `SimEngine_Stoichiometry.html`
> **Date:** 2026-04-03

---

## Purpose

Give students an interactive workspace to practice the four core quantitative skills in R2.1: stoichiometric calculations from balanced equations, limiting reagent identification with particle-level visualization, titration technique with real-time pH curves, and gravimetric analysis (HL). These are heavily tested on Paper 2 and essential for IA data processing.

---

## Architecture

**Single-file HTML** following SimEngine conventions: IIFE closure, CSS variables from design system, 240px sidebar + 1fr grid, canvas-based visuals, SL/HL toggle, teacher mode.

**Four tabbed views** below the header:
1. **Stoichiometry Workspace** (SL) — default
2. **Limiting Reagent** (SL)
3. **Titration Lab** (SL)
4. **Gravimetric Analysis** (HL only — hidden until HL toggle on)

Tabs share a common data layer (molar masses, reaction library) but have independent state. Tabs 2 and 3 each have a canvas; Tab 4 uses canvas for step illustrations.

---

## Tab 1: Stoichiometry Workspace

### Sidebar
Reaction palette grouped by category:
- **Combustion** — CH₄ + 2O₂ → CO₂ + 2H₂O, C₂H₆ + O₂, C₃H₈ + O₂
- **Neutralization** — HCl + NaOH, H₂SO₄ + NaOH, CH₃COOH + NaOH
- **Synthesis** — N₂ + 3H₂ → 2NH₃, 2Mg + O₂ → 2MgO
- **Decomposition** — CaCO₃ → CaO + CO₂, 2H₂O₂ → 2H₂O + O₂
- **Redox** — Zn + CuSO₄ → ZnSO₄ + Cu, Fe₂O₃ + 3CO → 2Fe + 3CO₂
- **HL** — more complex multi-step problems (visible when HL on)

### Main Panel
1. **Balanced equation** displayed prominently at top with mole ratios highlighted
2. **Molar mass reference** — shows M for each species (calculated from embedded element data)
3. **Input section** — student selects one species and enters a known quantity:
   - Dropdown: choose species
   - Input field: enter value
   - Unit selector: mol, g, L (gas at STP), or cm³ of solution
   - If solution: concentration field appears
4. **Results table** — auto-calculates for all other species:
   - Moles, mass (g), volume (L at STP if gas)
   - Color-coded columns: reactants (red tint), products (green tint)
5. **Percentage yield section** (below results):
   - Input: actual yield obtained
   - Calculates: % yield = (actual/theoretical) × 100
   - Traffic light indicator: >90% green, 60-90% amber, <60% red
6. **HL: Atom economy** card (visible when HL on):
   - Shows: atom economy = (M of desired product × coeff) / (Σ M of all products × coeff) × 100%

No canvas for this tab — pure calculation workspace.

---

## Tab 2: Limiting Reagent Visualizer

### Sidebar
Reaction palette (subset of Tab 1, curated for clear limiting reagent scenarios):
- **Simple** — N₂ + 3H₂ → 2NH₃, 2Mg + O₂ → 2MgO, Zn + CuSO₄ → ZnSO₄ + Cu
- **Combustion** — CH₄ + 2O₂, C₂H₅OH + 3O₂
- **Neutralization** — HCl + NaOH, H₂SO₄ + 2NaOH

### Main Panel
1. **Balanced equation** at top with mole ratios
2. **Mole input sliders** — one per reactant:
   - Range: 0.0–5.0 mol (step 0.1)
   - Live display of current value
   - Color-coded by species
3. **Analysis card** — updates in real-time as sliders change:
   - Shows moles of each reactant vs. required ratio
   - Identifies limiting reagent (highlighted) and excess reagent
   - Calculates: moles of excess remaining, moles of each product formed
   - Percentage excess = (excess remaining / total) × 100
4. **"React" button** — triggers the particle animation on canvas

### Canvas: Particle Animation
- Two-phase animation:
  - **Before**: particles of each reactant in distinct colors, counts matching slider values (scaled, e.g., 1 mol = 10 particles)
  - **During**: particles pair up according to stoichiometry, animate combining into product particles (color change + merge)
  - **After**: product particles shown + leftover excess reagent particles remain
- Duration: ~3s total
- Labels show species and count below particle groups
- Replay button to re-run animation

---

## Tab 3: Titration Lab

### Sidebar
Titration palette grouped by type:
- **Strong acid + Strong base** — HCl + NaOH, H₂SO₄ + NaOH
- **Weak acid + Strong base** — CH₃COOH + NaOH, H₂CO₃ + NaOH
- **Strong acid + Weak base** — HCl + NH₃
- **HL: Polyprotic** — H₃PO₄ + NaOH (visible when HL on)

### Main Panel
1. **Setup card** — configure the titration:
   - Analyte: volume (cm³) + concentration (mol dm⁻³)
   - Titrant: concentration (mol dm⁻³)
   - Indicator dropdown: phenolphthalein (8.2–10.0), methyl orange (3.1–4.4), bromothymol blue (6.0–7.6), or "pH probe" (no indicator, just curve)
2. **Titration visual** — canvas-based animated apparatus:
   - Burette on left with volume markings and liquid level
   - Conical flask below with solution color
   - "Add 1.0 mL" / "Add 0.1 mL" / "Add drop" buttons for student control
   - Flask solution color changes based on pH + selected indicator
   - Burette liquid level drops as titrant is added
   - Current pH displayed as a digital readout
3. **pH Curve** — real-time graph on adjacent canvas area:
   - X-axis: volume of titrant added (cm³)
   - Y-axis: pH (0–14)
   - Point plotted each time student adds titrant
   - Equivalence point marked when detected (steepest gradient)
   - Buffer region labeled for weak acid/strong base curves
4. **Results card** (appears after equivalence point reached):
   - Volume at equivalence point
   - Calculated concentration of analyte (from c₁v₁ = c₂v₂ adjusted for stoichiometry)
   - Indicator suitability check — was the chosen indicator appropriate?

### pH Calculation Model
- Strong/strong: direct stoichiometric calculation of [H⁺] or [OH⁻]
- Weak acid/strong base: Henderson-Hasselbalch in buffer region, Ka equilibrium elsewhere
- Half-equivalence point: pH = pKa (highlighted on curve for weak acid titrations)

### Data (~6 titrations)
- Ka values: CH₃COOH (1.8 × 10⁻⁵), H₂CO₃ (4.3 × 10⁻⁷), NH₃ Kb (1.8 × 10⁻⁵), H₃PO₄ Ka₁/Ka₂/Ka₃
- Indicators: phenolphthalein, methyl orange, bromothymol blue (pH ranges + colors)
- Kw = 1.0 × 10⁻¹⁴

---

## Tab 4: Gravimetric Analysis (HL Only)

### Sidebar
Precipitation reaction palette:
- **Halide analysis** — AgNO₃ + NaCl → AgCl↓ + NaNO₃, AgNO₃ + KBr → AgBr↓ + KNO₃
- **Sulfate analysis** — BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl
- **Carbonate analysis** — CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl
- **Metal hydroxides** — NaOH + CuSO₄ → Cu(OH)₂↓ + Na₂SO₄

### Main Panel — Step-by-step Guided Workflow
Student advances through steps with "Next Step" button. Each step has a canvas illustration + calculation area.

1. **Step 1: Dissolve sample** — illustration shows solid dissolving in beaker. Student enters: mass of sample (g), volume of solution (cm³).
2. **Step 2: Add excess reagent** — illustration shows reagent being added, precipitate forming (particles appearing). Student confirms which precipitate forms (dropdown — tests understanding of solubility rules).
3. **Step 3: Filter** — illustration shows filtration setup (filter paper + funnel + flask). Precipitate collected on filter paper. Student enters: mass of filter paper (g).
4. **Step 4: Dry & weigh** — illustration shows drying in oven, then weighing on balance. Student enters: mass of filter paper + precipitate (g).
5. **Step 5: Calculate** — workspace auto-populates:
   - Mass of precipitate = (paper + ppt) − paper
   - Moles of precipitate = mass / M
   - Moles of target ion (from stoichiometry)
   - Mass of target ion
   - Percentage composition = (mass of ion / mass of sample) × 100

### Canvas
Simple step illustrations using basic shapes — beaker, funnel, filter paper, balance. Color-coded: solution (blue), precipitate particles (white/yellow depending on compound), filter paper (gray).

---

## Shared Components

### SL/HL Toggle
- `body.hl-active` class toggle
- Tab 4 hidden unless HL on
- HL problems in Tab 1 hidden unless HL on
- Atom economy card in Tab 1 hidden unless HL on
- Polyprotic titrations in Tab 3 hidden unless HL on

### Teacher Mode
- Presets dropdown per tab (curated problem sequences)
- Answer reveal toggle
- Step-by-step solution walkthrough option

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| H | Toggle HL |
| T | Toggle Teacher mode |
| 1, 2, 3, 4 | Switch tabs |
| R | Reset current problem |
| / | Focus search |
| ↑↓ | Navigate palette |
| Enter | Submit/calculate |

### Data Layer (shared across tabs)
- Element molar masses (~20 common elements inline)
- Reaction library (~20 reactions with balanced equations, species, mole ratios)
- Indicator data (3 indicators with pH ranges, colors, Ka values)
- Solubility rules (for Tab 4 precipitate identification)

### Data Export
CSV of student work (problem ID, inputs, answers, time taken) — consistent with existing SimEngine data export pattern.

---

## Visual Design

Follows SimEngine design system exactly:
- Navy header gradient, teal accents
- Red (#DC2626) for reactants / limiting reagent / acid
- Green (#059669) for products / excess / base
- Purple (#7C3AED) for HL content
- Amber (#D97706) for warnings / indicator transitions
- Inter font (body), Fira Code (numerical values)
- Cards with white background, subtle border, 12px radius

---

## Responsive Behavior

- Desktop (>900px): sidebar + main grid
- Mobile (<900px): single column, sidebar becomes horizontal scrolling category pills, tabs become scrollable
- Canvas diagrams resize with container (maintain aspect ratio)

---

## Success Criteria

1. Student can calculate moles/mass/volume for all species from a balanced equation
2. Student can identify limiting reagent and calculate excess + products formed
3. Student can perform a guided titration with real-time pH curve and identify equivalence point
4. HL student can work through gravimetric analysis step-by-step
5. All molar masses and Ka values match IB Data Booklet exactly
6. Teacher can use presets to guide classroom activities
7. Follows all SimEngine conventions (single-file, IIFE, CSS variables, keyboard shortcuts)
