# Enthalpy Cycles & Calculations — Design Document (Sim #13)

> **IB Topic:** R1.1 Measuring Enthalpy Changes + R1.2 Energy Cycles (HL)
> **File:** `SimEngine_HessLaw.html`
> **Date:** 2026-04-02

---

## Purpose

Give students an interactive workspace to practice the three enthalpy calculation methods in the IB syllabus: Hess's Law (manipulating given reactions), bond enthalpy calculations (breaking/forming bonds), and Born-Haber cycles (HL — lattice enthalpy from thermodynamic data). These are heavily tested on Paper 2 and essential for IA data processing.

---

## Architecture

**Single-file HTML** following SimEngine conventions: IIFE closure, CSS variables from design system, 240px sidebar + 1fr grid, canvas-based diagrams, SL/HL toggle, teacher mode.

**Three tabbed views** below the header:
1. **Hess's Law** (SL) — default
2. **Bond Enthalpies** (SL)
3. **Born-Haber Cycles** (HL only — hidden until HL toggle on)

Tabs share a common data layer (IB Data Booklet values) but have independent state and canvases.

---

## Tab 1: Hess's Law Solver

### Sidebar
Problem palette grouped by category:
- **Formation** — problems using ΔHf° (e.g., find ΔH combustion of CH₄ from formation data)
- **Combustion** — problems using ΔHc° data
- **Mixed** — 2-3 given reactions requiring manipulation
- **HL Problems** — more complex multi-step (visible when HL on)
- **Teacher presets** — curated sequences for classroom use

### Main Panel — Guided Solver
1. **Target reaction** displayed prominently at top
2. **Given reactions panel** — 2-4 thermochemical equations with ΔH values
3. **Manipulation workspace** — for each given reaction:
   - **Reverse** toggle button (flips equation, negates ΔH)
   - **Multiplier** selector: ×½, ×1, ×2, ×3 (scales equation and ΔH)
   - Real-time display of manipulated equation + updated ΔH
4. **Sum button** — student clicks when ready
5. **Validation** — checks if manipulated reactions sum to target:
   - Success: green highlight, animated enthalpy cycle diagram on canvas
   - Incorrect: amber feedback explaining which species don't cancel

### Canvas: Enthalpy Cycle Diagram
- Drawn below the workspace card
- Shows reactants → intermediates → products pathway
- Arrows labeled with ΔH values for each step
- Animates with easeInOutCubic as student manipulates reactions
- Final cycle completes with a closing arrow on successful solve

### Data (~12 problems)
Using IB Data Booklet values:
- ΔHf° for common compounds (CO₂, H₂O, CH₄, C₂H₅OH, NH₃, etc.)
- ΔHc° for fuels (C, H₂, CH₄, C₂H₆, CH₃OH, C₂H₅OH)
- Mixed problems combining formation + combustion data

---

## Tab 2: Bond Enthalpy Calculator

### Sidebar
Reaction palette by type:
- **Combustion** — CH₄, C₂H₆, C₃H₈, CH₃OH, C₂H₅OH
- **Halogenation** — CH₄ + Cl₂ → CH₃Cl + HCl
- **Hydrogenation** — C₂H₄ + H₂ → C₂H₆
- **Other** — N₂ + 3H₂ → 2NH₃, etc.

### Main Panel — Bond Breaking/Forming Visualizer
1. **Equation display** with structural formulas showing all bonds
2. **Bonds Broken panel** (red-tinted left column):
   - Each bond type × count × mean bond enthalpy
   - Running total: Σ energy absorbed (+)
3. **Bonds Formed panel** (green-tinted right column):
   - Same format
   - Running total: Σ energy released (−)
4. **Result bar**: ΔH = Σ(broken) − Σ(formed)
   - Color-coded: red for endothermic, green for exothermic
5. **Comparison note**: literature ΔH value + explanation of why bond enthalpy calc is approximate (mean values vs. actual)

### Canvas: Bond Animation
- Structural formulas with bonds drawn explicitly
- Animation sequence: bonds break (red glow, snap apart) → pause → bonds form (green glow, snap together)
- Duration: ~2s break, 0.5s pause, ~2s form
- Bond energy values appear as each bond breaks/forms

### Data
Mean bond enthalpies from IB Data Booklet (~20 types):
C-H (414), C-C (346), C=C (614), C≡C (839), C-O (358), C=O (804), O-H (463), O=O (498), H-H (436), N-H (391), N≡N (945), C-Cl (324), H-Cl (432), C-Br (285), H-Br (366), C-N (286), C=N (615), N-O (201), S-H (363), F-F (158)

---

## Tab 3: Born-Haber Cycles (HL Only)

### Sidebar
Ionic compound palette:
- **Group 1 halides** — NaCl, NaBr, KCl, KBr, LiF, LiCl
- **Group 2 halides** — MgCl₂, CaCl₂
- **Group 2 oxides** — MgO, CaO, BaO
- **Comparison pairs** — pre-selected for trend analysis (NaCl vs KCl, MgO vs CaO)

### Main Panel — Energy Ladder Builder
1. **Compound info** — formula, constituent elements, target: "Find lattice enthalpy of [compound]"
2. **Canvas: Vertical energy ladder** (classic Born-Haber diagram):
   - Y-axis: enthalpy / kJ mol⁻¹ (scaled to fit all steps)
   - Horizontal levels connected by vertical arrows
   - Steps animate in one at a time as student adds them
   - Color-coded: endothermic steps (red arrows up), exothermic steps (green arrows down)

3. **Step builder panel** — student constructs the cycle:
   - Dropdown to select step type:
     - Atomization of metal: M(s) → M(g)
     - Atomization of non-metal: ½X₂(g) → X(g)
     - First ionization: M(g) → M⁺(g) + e⁻
     - Second ionization (for Group 2): M⁺(g) → M²⁺(g) + e⁻
     - First electron affinity: X(g) + e⁻ → X⁻(g)
     - Formation: elements → compound
     - Lattice enthalpy: gaseous ions → ionic solid
   - Value field (pre-filled from data booklet, student confirms)
   - "Add Step" button → canvas animates new level

4. **Validation** — once all steps added:
   - System checks cycle closure via Hess's law
   - Calculates unknown (usually lattice enthalpy)
   - Green animation: closing arrow completes the cycle
   - Result displayed with correct sign convention

5. **Trend analysis card** (teacher mode):
   - Compare lattice enthalpies across selected compounds
   - Bar chart: relate to ion charge and ionic radius
   - Discussion prompts for students

### Data (~10 compounds with full cycle data)
From IB Data Booklet and standard sources:
- ΔHf° for ionic compounds
- ΔHat for metals (Na, K, Li, Mg, Ca, Ba) and non-metals (Cl, Br, F, O)
- IE₁ (and IE₂ for Group 2) for metals
- EA₁ for halogens and oxygen
- Lattice enthalpies (for validation / answer checking)

---

## Shared Components

### SL/HL Toggle
- `body.hl-active` class toggle
- Tab 3 hidden unless HL on
- HL problems in Tab 1 hidden unless HL on

### Teacher Mode
- Presets dropdown per tab
- Answer reveal toggle
- Step-by-step solution walkthrough option
- Tab 1: curated problem sequences
- Tab 3: comparison pair analysis

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| H | Toggle HL |
| T | Toggle Teacher mode |
| 1, 2, 3 | Switch tabs |
| R | Reset current problem |
| / | Focus search |
| ↑↓ | Navigate problems |
| Enter | Submit/sum answer |

### Data Export
CSV export of student's work (problem ID, student answer, correct answer, time taken) — consistent with existing SimEngine data export pattern.

---

## Visual Design

Follows SimEngine design system exactly:
- Navy header gradient, teal accents
- Red (#DC2626) for endothermic / bonds broken / energy absorbed
- Green (#059669) for exothermic / bonds formed / energy released
- Purple (#7C3AED) for HL content
- Inter font (body), Fira Code (numerical values)
- Cards with white background, subtle border, 12px radius

---

## Responsive Behavior

- Desktop (>900px): sidebar + main grid
- Mobile (<900px): single column, sidebar becomes horizontal scrolling category pills, tabs become scrollable
- Canvas diagrams resize with container (maintain aspect ratio)

---

## Success Criteria

1. Student can solve Hess's Law problems by manipulating given reactions
2. Student can calculate ΔH from bond enthalpies with animated visualization
3. HL student can construct Born-Haber cycles step-by-step with energy ladder diagram
4. All numerical values match IB Data Booklet exactly
5. Teacher can use presets to guide classroom activities
6. Follows all SimEngine conventions (single-file, IIFE, CSS variables, keyboard shortcuts)
