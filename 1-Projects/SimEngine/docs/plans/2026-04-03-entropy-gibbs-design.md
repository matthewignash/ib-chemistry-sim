# Entropy & Gibbs Free Energy — Design Document (Sim #16)

> **IB Topic:** R1.4 Entropy and Spontaneity (HL)
> **File:** `SimEngine_EntropyGibbs.html`
> **Date:** 2026-04-03

---

## Purpose

Give HL students an interactive workspace to explore entropy, Gibbs free energy, and spontaneity. R1.4 is entirely HL content and heavily tested on Paper 2. This sim combines a particle-based entropy visualizer with calculation tools for ΔG = ΔH − TΔS, four-quadrant spontaneity classification, and ΔG° from ΔGf° data.

---

## Architecture

**Single-file HTML** following SimEngine conventions: IIFE closure, CSS variables from design system, 240px sidebar + 1fr grid, canvas-based visuals, SL/HL toggle, teacher mode.

**Entirely HL content** — the SL/HL toggle exists for UI consistency but all tabs are HL. The sim is designed for HL students.

**Four tabbed views** below the header:
1. **Entropy Visualizer** — default
2. **Gibbs Calculator**
3. **Spontaneity Predictor**
4. **ΔG° from ΔGf°**

Tabs share a common data layer (thermodynamic values, reaction library) but have independent state and canvases.

---

## Tab 1: Entropy Visualizer

### Sidebar
Substance palette:
- **Common** — H₂O, CO₂, NaCl, C(diamond), C(graphite)
- **Controls** — State selector (solid/liquid/gas), Temperature slider (100–1000 K)

Partition controls:
- "Add Partition" / "Remove Partition" button
- "Reset" button

### Main Panel

1. **Particle simulation canvas** (~600×400px):
   - Full 2D particle engine with elastic inter-particle collisions
   - ~30–50 particles rendered as colored circles
   - Spatial grid optimization to reduce O(n²) collision checks
   - Wall bounces with elastic reflection
   - **Three state modes**:
     - **Solid**: Particles vibrate around fixed lattice positions with small amplitudes. Low kinetic energy.
     - **Liquid**: Particles move freely but with inter-particle attractive forces keeping them in a loose cluster. Medium kinetic energy.
     - **Gas**: Particles move fast with full elastic collisions, filling available space. High kinetic energy.
   - **Partition feature**: Vertical wall divides canvas. "Remove Partition" triggers expansion animation — particles confined to left half spread to fill entire space. Microstate counter (W) increases visually.
   - Temperature slider controls average particle speed (Ek distribution)

2. **S° comparison panel** (below canvas):
   - Bar chart comparing S° values: solid < liquid < gas for selected substance
   - S° values from IB Data Booklet (e.g., H₂O: solid 48, liquid 70, gas 189 J mol⁻¹ K⁻¹)
   - Qualitative explanation of entropy factors:
     - State (positional freedom)
     - Molecular complexity (more atoms → higher S°)
     - Temperature (more accessible microstates)

3. **Substance comparison**: Select different substances to compare S° values side by side

---

## Tab 2: Gibbs Calculator

### Sidebar
Problem palette grouped by thermodynamic character:
- **ΔH<0, ΔS>0** — combustion of CH₄, rusting of iron
- **ΔH>0, ΔS>0** — dissolving NH₄NO₃, CaCO₃ decomposition
- **ΔH<0, ΔS<0** — NH₃ synthesis (N₂ + 3H₂ → 2NH₃), freezing water
- **ΔH>0, ΔS<0** — photosynthesis (illustrative, never spontaneous)
- **Custom** — enter own ΔH and ΔS values

### Main Panel

1. **Input section**: Editable fields for ΔH° (kJ mol⁻¹), ΔS° (J mol⁻¹ K⁻¹), T (K). Pre-filled from palette selection.

2. **Calculation display**: Step-by-step:
   - Convert ΔS° from J to kJ: ΔS° = X J mol⁻¹ K⁻¹ = X/1000 kJ mol⁻¹ K⁻¹
   - ΔG° = ΔH° − TΔS°
   - Show substitution with actual numbers

3. **Result**: ΔG° value, color-coded green (spontaneous, ΔG < 0) or red (non-spontaneous, ΔG > 0)

4. **Enthalpy/Entropy stacked bar diagram** (canvas):
   - Two bars side by side: ΔH and TΔS
   - Visual comparison of which term dominates
   - As temperature changes, TΔS bar grows/shrinks — students see the balance shift

5. **ΔG vs T graph** (canvas ~full width × 250px):
   - X-axis: Temperature (0–1500 K), Y-axis: ΔG (kJ mol⁻¹)
   - Linear plot: ΔG = ΔH − TΔS (slope = −ΔS, intercept = ΔH)
   - Crossover temperature T* = ΔH/ΔS marked with vertical dashed line (when ΔH and ΔS have same sign)
   - Shaded regions: green where ΔG < 0 (spontaneous), red where ΔG > 0
   - Draggable temperature marker on x-axis — ΔG value updates in real-time
   - Current temperature highlighted with a dot on the line

6. **Temperature slider**: 200–1500 K, synced with graph marker

---

## Tab 3: Spontaneity Predictor

### Sidebar
Reaction palette grouped by quadrant:
- **Q1: ΔH<0, ΔS>0** — Always spontaneous
- **Q2: ΔH>0, ΔS>0** — Spontaneous at high T
- **Q3: ΔH<0, ΔS<0** — Spontaneous at low T
- **Q4: ΔH>0, ΔS<0** — Never spontaneous
- **Challenge** — mystery reactions for student to classify

### Main Panel

1. **Four-quadrant diagram** (canvas ~400×400px):
   - X-axis: ΔS (negative → positive), Y-axis: ΔH (positive ↑, negative ↓)
   - Four colored quadrants with labels:
     - Top-right (ΔH>0, ΔS>0): "Spontaneous at high T" — amber
     - Bottom-right (ΔH<0, ΔS>0): "Always spontaneous" — green
     - Bottom-left (ΔH<0, ΔS<0): "Spontaneous at low T" — teal
     - Top-left (ΔH>0, ΔS<0): "Never spontaneous" — red
   - Selected reaction plotted as a labeled point

2. **Reaction card**: Shows:
   - Balanced equation
   - ΔH° and ΔS° values
   - Quadrant classification
   - Real-world context (e.g., "Iron rusting in moist air", "Ice melting on a warm day", "Water freezing in a freezer")
   - For Q2/Q3: crossover temperature T* = ΔH/ΔS

3. **Challenge mode**: Given a reaction with ΔH° and ΔS°:
   - Student clicks which quadrant it belongs to
   - Green/red feedback
   - Running score display
   - Must also predict: spontaneous at 298 K? (yes/no)

4. **Teacher mode**: Reveal all answers, show all reactions plotted simultaneously on the four-quadrant diagram

### Reaction Library (~12 reactions with real-world context)
- CH₄ + 2O₂ → CO₂ + 2H₂O — "Burning natural gas" (ΔH<0, ΔS>0)
- 4Fe + 3O₂ → 2Fe₂O₃ — "Iron rusting" (ΔH<0, ΔS<0)
- CaCO₃ → CaO + CO₂ — "Limestone decomposition in a kiln" (ΔH>0, ΔS>0)
- N₂ + 3H₂ → 2NH₃ — "Haber process" (ΔH<0, ΔS<0)
- H₂O(s) → H₂O(l) — "Ice melting on a warm day" (ΔH>0, ΔS>0)
- H₂O(l) → H₂O(s) — "Water freezing in a freezer" (ΔH<0, ΔS<0)
- NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq) — "Cold pack dissolving" (ΔH>0, ΔS>0)
- 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ — "Photosynthesis" (ΔH>0, ΔS<0)
- C₃H₈ + 5O₂ → 3CO₂ + 4H₂O — "Propane barbecue" (ΔH<0, ΔS>0)
- 2Mg + O₂ → 2MgO — "Magnesium sparkler" (ΔH<0, ΔS<0)
- NaCl(s) → Na⁺(aq) + Cl⁻(aq) — "Dissolving table salt" (ΔH>0, ΔS>0)
- C(s) + O₂(g) → CO₂(g) — "Charcoal burning" (ΔH<0, ΔS≈0)

---

## Tab 4: ΔG° from ΔGf°

### Sidebar
Reaction palette grouped by type:
- **Combustion** — CH₄ + 2O₂, C₂H₅OH + 3O₂, C₃H₈ + 5O₂
- **Decomposition** — CaCO₃ → CaO + CO₂, 2H₂O₂ → 2H₂O + O₂
- **Synthesis** — N₂ + 3H₂ → 2NH₃, 2Mg + O₂ → 2MgO
- **Neutralization** — HCl + NaOH → NaCl + H₂O

### Main Panel

1. **Balanced equation** displayed prominently at top with coefficients highlighted

2. **ΔGf° reference table**: Lists ΔGf° (kJ mol⁻¹) for each species:
   - Columns: Species, ΔGf° value, Coefficient, n × ΔGf°
   - Color-coded: products (green rows), reactants (red rows)
   - Elements in standard state: ΔGf° = 0 (highlighted with note)

3. **Calculation workspace**: Step-by-step:
   - Σ(n × ΔGf° products) = [each term listed]
   - Σ(n × ΔGf° reactants) = [each term listed]
   - ΔG°rxn = Σ products − Σ reactants = [result]

4. **Result**: ΔG° with spontaneity prediction (green/red color coding)

5. **Cross-reference**: Compare ΔG° calculated here with ΔG° from ΔH° − TΔS° at 298 K (shows consistency of thermodynamic data)

---

## Shared Components

### SL/HL Toggle
- `body.hl-active` class toggle exists for UI consistency
- All content is HL — no SL-only sections

### Teacher Mode
- Presets dropdown per tab (curated sequences)
- Answer reveal toggle
- Tab 3: show all reactions on diagram simultaneously
- Tab 4: step-through solution

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
| E | Export CSV |
| Space | Toggle particle animation (Tab 1) |

### Data Layer (shared across tabs)
- S° values for ~10 substances in solid, liquid, and gas states (J mol⁻¹ K⁻¹)
- ΔH° and ΔS° for ~12 reactions (kJ mol⁻¹ and J mol⁻¹ K⁻¹)
- ΔGf° for ~20 compounds (kJ mol⁻¹) from IB Data Booklet
- Real-world context descriptions for each reaction

### Data Export
CSV of student work (tab, problem ID, inputs, answers, score, time taken) — consistent with existing SimEngine data export pattern.

---

## Visual Design

Follows SimEngine design system exactly:
- Navy header gradient, teal accents
- Green (#059669) for spontaneous / ΔG < 0 / products
- Red (#DC2626) for non-spontaneous / ΔG > 0 / reactants
- Amber (#D97706) for temperature-dependent spontaneity
- Purple (#7C3AED) for HL content badge
- Inter font (body), Fira Code (numerical values)
- Cards with white background, subtle border, 12px radius
- Dark background option for particle canvas (to make particles pop)

---

## Responsive Behavior

- Desktop (>900px): sidebar + main grid
- Mobile (<900px): single column, sidebar becomes horizontal scrolling category pills, tabs become scrollable
- Canvas diagrams resize with container (maintain aspect ratio)
- Particle sim reduces particle count on mobile for performance

---

## Success Criteria

1. Student can observe particle behavior differences between solid, liquid, and gas states
2. Student can remove partition and see entropy increase visually
3. Student can calculate ΔG from ΔH, ΔS, and T with step-by-step working
4. Student can use ΔG vs T graph to find crossover temperature
5. Student can classify reactions into four spontaneity quadrants
6. Student can calculate ΔG° from ΔGf° data with step-by-step working
7. All thermodynamic values match IB Data Booklet
8. Teacher can use presets and answer reveal for classroom activities
9. Follows all SimEngine conventions (single-file, IIFE, CSS variables, keyboard shortcuts)
