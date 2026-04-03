# Electron Configuration Builder — Design Document (Sim #18)

> **IB Topic:** S1.3 Electron Configuration
> **File:** `SimEngine_ElectronConfig.html`
> **Date:** 2026-04-03

---

## Purpose

Give students an interactive workspace to explore electron configuration: orbital filling with Aufbau/Hund/Pauli rules, shorthand notation with noble gas cores, ion configurations, periodic table block structure, and ionization energy trends (HL). S1.3 is core SL content heavily tested on Papers 1 and 2, with HL extensions for d-block exceptions and IE patterns.

---

## Architecture

**Single-file HTML** following SimEngine conventions: IIFE closure, CSS variables from design system, 240px sidebar + 1fr grid, canvas-based visuals, SL/HL toggle, teacher mode.

**Four tabbed views** below the header:
1. **Orbital Builder** (SL) — default
2. **Notation & Ions** (SL)
3. **Periodic Table Map** (SL)
4. **Ionization Energy Trends** (HL only — hidden until HL toggle on)

Tabs share a common data layer (electron configs, IE data, periodic table layout) but have independent state and canvases.

---

## Tab 1: Orbital Builder

### Sidebar
Element palette grouped by period:
- **Period 1** — H, He
- **Period 2** — Li, Be, B, C, N, O, F, Ne
- **Period 3** — Na, Mg, Al, Si, P, S, Cl, Ar
- **Period 4** — K, Ca, Sc, Ti, V, Cr, Mn, Fe, Co, Ni, Cu, Zn, Ga, Ge, As, Se, Br, Kr

Mode toggle: **Build** / **Demo**
Reset button

### Main Panel

1. **Orbital box diagram** (canvas ~650×400px):
   - Rows of orbital boxes arranged by energy level: 1s | 2s, 2p×3 | 3s, 3p×3 | 4s, 3d×5, 4p×3
   - Each box is a rectangular cell (~40×50px); electrons shown as up/down arrows
   - Aufbau energy order indicated by numbered labels
   - **Drag interaction**: electron source at bottom of canvas. Student drags an arrow into a box. System validates:
     - Aufbau: must fill lower energy first
     - Pauli: max 2 electrons per box, opposite spin
     - Hund's rule: within a subshell, fill all boxes singly before pairing
   - Green glow on valid placement, red shake + tooltip on violation
   - **Demo mode**: auto-fills one electron at a time with 500ms delay, rule annotation at each step

2. **Running notation display** (below canvas): builds "1s² 2s² 2p⁴" live

3. **Rule cards**: three collapsible cards for Aufbau, Hund's, Pauli — highlight active rule

4. **HL: d-block exceptions card** (hidden unless HL): Cr and Cu exceptions with expected vs actual config

---

## Tab 2: Notation & Ions

### Sidebar
Element palette (same grouping) + Ion charge selector (neutral, +1, +2, +3, −1, −2). Challenge mode toggle.

### Main Panel

1. **Full notation display**: "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹⁰" with styled subshell spans
2. **Noble gas core shorthand**: "[Ar] 4s² 3d¹⁰" — noble gas highlighted purple
3. **Ion configuration panel**: shows electron removal (4s before 3d for d-block), before/after comparison
4. **Isoelectronic card**: identifies matching noble gas
5. **Challenge mode**: student types electron config, green/red feedback, running score

---

## Tab 3: Periodic Table Map

### Sidebar
Block filter checkboxes (s, p, d). Display options: "Show configs" toggle, "Show valence e⁻" toggle.

### Main Panel

1. **Interactive periodic table** (canvas ~full width × 350px):
   - 18-column layout for periods 1–4 (Z=1–36)
   - Color-coded by block: s-block (red), p-block (blue), d-block (amber)
   - Click element → highlight, show detail card below
   - Block filter dims unselected blocks

2. **Selected element detail card**: orbital diagram + notation + noble gas core + block/period/group info

3. **Pattern annotations**: block descriptions

---

## Tab 4: Ionization Energy Trends (HL Only)

### Sidebar
Mode selector: "Successive IE" / "First IE Across Period". Element/period selector. Challenge toggle.

### Main Panel

1. **Successive IE graph** (canvas ~full width × 300px):
   - X-axis: IE number, Y-axis: log₁₀(IE in kJ mol⁻¹)
   - Color-coded bars: valence vs core electrons
   - Large jump annotations
   - Data for ~6 elements (Na, Mg, Al, Si, S, Cl)

2. **First IE across a period** (canvas):
   - Connected dot plot showing general increase L→R with annotated dips at Group 13 and Group 16

3. **Challenge mode**: identify element from successive IE pattern, running score

---

## Shared Components

### SL/HL Toggle
- `body.hl-active` class toggle
- Tab 4 hidden unless HL on
- d-block exceptions card in Tab 1 hidden unless HL on

### Teacher Mode
- Presets dropdown per tab
- Answer reveal toggle
- Tab 1: auto-fill via Demo mode
- Tab 2: show all answers

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| H | Toggle HL |
| T | Toggle Teacher mode |
| 1, 2, 3, 4 | Switch tabs |
| R | Reset current problem |
| / | Focus search |
| ↑↓ | Navigate palette |
| Enter | Submit (challenge mode) |
| E | Export CSV |
| Space | Pause/resume demo |

### Data Layer
- Electron configurations for Z=1–36
- Orbital filling order (Aufbau sequence)
- Noble gas electron counts
- First ionization energies for Z=1–36
- Successive IE data for ~6 elements
- Periodic table grid positions (18 columns, 4 periods)

### Data Export
CSV of student work (tab, element, inputs, answers, score, time taken).

---

## Visual Design

Follows SimEngine design system exactly:
- Navy header gradient, teal accents
- s-block red (#DC2626), p-block blue (#2563EB), d-block amber (#D97706)
- Green (#059669) for correct placements
- Red (#DC2626) for violations
- Purple (#7C3AED) for HL content
- Inter font (body), Fira Code (electron configs, numerical values)
- Cards with white background, subtle border, 12px radius

---

## Responsive Behavior

- Desktop (>900px): sidebar + main grid
- Mobile (<900px): single column, horizontal scrolling pills, canvas resize
- Orbital boxes scale down on mobile

---

## Success Criteria

1. Student can drag electrons into orbital boxes with Aufbau/Hund/Pauli validation
2. Student can observe demo mode filling orbitals step-by-step
3. Student can view full notation and noble gas core shorthand
4. Student can see ion configurations with correct electron removal order (4s before 3d)
5. Student can explore periodic table color-coded by s/p/d blocks
6. HL student can analyze successive IE graphs to identify valence electrons
7. HL student can see first IE trends across a period with dip explanations
8. d-block exceptions (Cr, Cu) correctly shown with HL toggle
9. Teacher can use presets and answer reveal
10. Follows all SimEngine conventions (single-file, IIFE, CSS variables, keyboard shortcuts)
