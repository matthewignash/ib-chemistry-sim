# Ionic Bonding Visualizer — Design Document (Sim #17)

> **IB Topic:** S2.1 The Ionic Model
> **File:** `SimEngine_IonicBonding.html`
> **Date:** 2026-04-03

---

## Purpose

Give students an interactive workspace to explore the ionic bonding model: electron transfer between metals and non-metals, ionic radius changes, crystal lattice structures, properties of ionic compounds, and lattice energy trends (HL). S2.1 is core SL content heavily tested on Papers 1 and 2.

---

## Architecture

**Single-file HTML** following SimEngine conventions: IIFE closure, CSS variables from design system, 240px sidebar + 1fr grid, canvas-based visuals, SL/HL toggle, teacher mode.

**Four tabbed views** below the header:
1. **Electron Transfer** (SL) — default
2. **Crystal Lattice** (SL)
3. **Properties Lab** (SL)
4. **Lattice Energy Trends** (HL only — hidden until HL toggle on)

Tabs share a common data layer (ionic radii, lattice energies, compound properties) but have independent state and canvases.

---

## Tab 1: Electron Transfer

### Sidebar
Element pair palette grouped by stoichiometry:
- **1:1** — NaCl, LiF, KBr, MgO, CaS
- **1:2** — CaF₂, MgCl₂, BaCl₂
- **2:1** — Na₂O, K₂O, Li₂O
- **Complex** — Al₂O₃, MgF₂

Mode toggle: **Auto-play** / **Step-by-step**

### Main Panel

1. **Electron transfer canvas** (~600×400px):
   - Two atoms rendered as concentric circles (electron shells) with dots for electrons
   - Metal atom on left (colored warm — amber/orange), non-metal on right (colored cool — teal/blue)
   - Valence electrons highlighted with distinct color
   - **Auto-play mode**: atoms approach → valence electrons animate as colored dots moving from metal to non-metal → atoms resize smoothly (cation shrinks, anion grows) → charge labels (+/−) fade in → final ion notation appears
   - **Step-by-step mode**: student clicks "Next Step" through 5 stages:
     1. Show both atoms with full electron configurations labeled (e.g., 2,8,1 for Na)
     2. Highlight valence electrons with pulsing glow
     3. Animate electron transfer (dots fly across)
     4. Show resulting ions with new electron configurations and charge labels
     5. Show ionic formula and electrostatic attraction arrow
   - For 1:2 and 2:1 stoichiometries: show multiple atoms (e.g., 2 Na atoms + 1 O atom for Na₂O)
   - Animation duration: ~2s auto-play, student-paced for step-by-step

2. **Ionic radius comparison** (below canvas):
   - Bar chart: atomic radius vs ionic radius for both metal and non-metal
   - Cation bar shorter than atom (lost shell), anion bar longer than atom (gained electrons, more repulsion)
   - Values in pm from IB Data Booklet
   - Annotation: "Cations are smaller than their parent atoms" / "Anions are larger"

3. **Electron configuration card**:
   - Before and after configs for both species
   - Highlight isoelectronic noble gas (e.g., Na⁺ is isoelectronic with Ne)

4. **HL extension**: Polarization card
   - Show how small, highly-charged cation (e.g., Li⁺, Mg²⁺) distorts large anion's electron cloud
   - Canvas illustration: symmetrical anion → distorted anion near cation
   - Fajans' rules summary: high charge density cation + large anion → more covalent character

---

## Tab 2: Crystal Lattice

### Sidebar
Compound palette:
- **Common** — NaCl, MgO, CsCl
- **Size ratio examples** — LiF, KBr, CaO

Controls:
- "Auto-build" / "Place ions" toggle
- Grid size selector: 3×3×3, 4×4×4, 5×5×5
- "Highlight coordination" checkbox

### Main Panel

1. **Isometric lattice canvas** (~500×450px):
   - 2.5D isometric projection of crystal lattice
   - Cations rendered as smaller spheres (warm color), anions as larger spheres (cool color)
   - Alternating arrangement clearly visible
   - **Auto-build mode**: lattice generates with brief grow-in animation
   - **Place ions mode**: student clicks grid positions to place cation or anion, system validates alternating pattern (green outline = correct, red = wrong placement)
   - Click any ion to highlight its coordination shell (nearest neighbors connected with dashed lines, coordination number displayed)
   - For NaCl: coordination number 6 (octahedral)
   - For CsCl: coordination number 8 (cubic)

2. **Lattice info card** (below canvas):
   - Compound formula and name
   - Structure type (NaCl-type, CsCl-type)
   - Coordination number for both cation and anion
   - Radius ratio (r⁺/r⁻) and predicted geometry
   - Diagram legend (color = ion identity, size = ionic radius)

3. **Radius ratio panel**:
   - Slider to adjust r⁺/r⁻ ratio
   - Shows which structure type is predicted for different ranges
   - Current compound's ratio highlighted

---

## Tab 3: Properties Lab

### Sidebar
Compound palette:
- **Ionic** — NaCl, MgO, CaF₂, KBr, Na₂O
- **Comparison** — "vs Diamond (covalent network)", "vs Ice (molecular)"

Property selector buttons:
- Conductivity
- Melting Point
- Solubility

### Main Panel

1. **Conductivity test** (canvas ~500×300px):
   - Three-panel illustration: solid | molten | aqueous
   - Each panel shows:
     - Circuit with battery, wires, bulb, electrodes in substance
     - **Solid**: ions locked in lattice (grid pattern), bulb OFF, "Ions cannot move"
     - **Molten**: ions free-moving (animated particles), bulb ON (glowing), "Free ions carry charge"
     - **Aqueous**: ions dispersed among water molecules (animated), bulb ON, "Dissolved ions carry charge"
   - Student clicks between states to see animation transition
   - Current state highlighted

2. **Melting point comparison** (canvas bar chart):
   - Vertical bars for selected ionic compounds + comparison substances
   - MgO (~2850°C) >> NaCl (801°C) >> Ice (0°C)
   - Color-coded: ionic = teal, covalent network = amber, molecular = blue
   - Annotation: "Higher charge + smaller ions → stronger electrostatic attraction → higher melting point"

3. **Solubility data table**:
   - Compound, solubility in water (g/100mL), soluble/insoluble classification
   - Matches IB solubility rules
   - Color-coded: soluble (green), slightly soluble (amber), insoluble (red)

4. **Explanation cards** (toggle to show/hide):
   - Why ionic compounds are brittle (displacement of ion layers → like-charge repulsion)
   - Why they have high melting points (strong electrostatic attraction in 3D lattice)
   - Why they conduct when molten/aqueous (free mobile ions)

---

## Tab 4: Lattice Energy Trends (HL Only)

### Sidebar
Compound groups:
- **Group 1 halides** — LiF, LiCl, LiBr, NaF, NaCl, NaBr, KF, KCl, KBr
- **Group 2 oxides** — MgO, CaO, SrO, BaO
- **Charge comparison** — NaCl vs MgO vs Al₂O₃

### Main Panel

1. **Lattice enthalpy bar chart** (canvas ~full width × 300px):
   - Vertical bars for selected compound group
   - Values in kJ mol⁻¹ (all positive — energy required to separate gaseous ions)
   - Sorted by magnitude
   - Bars color-coded by compound

2. **Coulomb's law explorer** (interactive):
   - Formula displayed: E ∝ (q⁺ × q⁻) / (r⁺ + r⁻)
   - Two sliders:
     - Cation charge (1+, 2+, 3+)
     - Ion separation (sum of ionic radii, 100–400 pm)
   - Animated visualization: two charged spheres with force arrows
   - Calculated relative lattice energy updates in real-time
   - Annotation explains each factor's effect

3. **Trend analysis cards**:
   - Down a group: same charge, increasing size → decreasing lattice energy (LiF > NaF > KF)
   - Across a period: increasing charge, decreasing size → increasing lattice energy (NaCl < MgO < Al₂O₃)
   - Cross-reference with melting point trends (Tab 3)

4. **Challenge mode**: Given two compounds, predict which has higher lattice energy. Green/red feedback with explanation.

---

## Shared Components

### SL/HL Toggle
- `body.hl-active` class toggle
- Tab 4 hidden unless HL on
- Polarization card in Tab 1 hidden unless HL on

### Teacher Mode
- Presets dropdown per tab (curated sequences)
- Answer reveal toggle
- Tab 2: auto-build lattice with all annotations
- Tab 4: show all lattice energies with trend arrows

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| H | Toggle HL |
| T | Toggle Teacher mode |
| 1, 2, 3, 4 | Switch tabs |
| R | Reset current problem |
| / | Focus search |
| ↑↓ | Navigate palette |
| Enter | Next step (Tab 1 step mode) / Submit (Tab 4 challenge) |
| E | Export CSV |
| Space | Play/pause animation (Tab 1 auto mode) |

### Data Layer (shared across tabs)
- Atomic radii for ~15 elements (pm)
- Ionic radii for ~20 common ions (pm)
- Electron configurations for elements Z=1–20
- Lattice enthalpies for ~15 ionic compounds (kJ mol⁻¹)
- Melting points for ~10 ionic compounds + comparisons (°C)
- Solubility data for ~10 compounds
- Electronegativity values for ~15 elements

### Data Export
CSV of student work (tab, problem ID, inputs, answers, score, time taken) — consistent with existing SimEngine data export pattern.

---

## Visual Design

Follows SimEngine design system exactly:
- Navy header gradient, teal accents
- Warm colors for cations/metals (amber #D97706, orange #EA580C)
- Cool colors for anions/non-metals (teal #0D9488, blue #2563EB)
- Green (#059669) for correct/soluble
- Red (#DC2626) for incorrect/insoluble
- Purple (#7C3AED) for HL content
- Inter font (body), Fira Code (numerical values, electron configs)
- Cards with white background, subtle border, 12px radius
- Dark background option for lattice canvas (ions pop against dark bg)

---

## Responsive Behavior

- Desktop (>900px): sidebar + main grid
- Mobile (<900px): single column, sidebar becomes horizontal scrolling category pills, tabs become scrollable
- Canvas diagrams resize with container (maintain aspect ratio)
- Lattice reduces grid size on mobile for performance

---

## Success Criteria

1. Student can observe electron transfer from metal to non-metal with step-by-step or auto-play modes
2. Student can see ionic radius changes (cation shrinks, anion grows) with quantitative data
3. Student can explore 2.5D crystal lattice and identify coordination numbers
4. Student can compare conductivity of solid, molten, and aqueous ionic compounds
5. Student can compare melting points and relate to ionic bond strength
6. HL student can explore lattice energy trends using Coulomb's law
7. All ionic radii and lattice enthalpies match IB Data Booklet
8. Teacher can use presets and answer reveal for classroom activities
9. Follows all SimEngine conventions (single-file, IIFE, CSS variables, keyboard shortcuts)
