# Born-Haber Cycle Builder — Design Document (Sim #19)

> **IB Topic:** R1.2 Enthalpy Changes (HL)
> **File:** `SimEngine_BornHaber.html`
> **Date:** 2026-04-03

---

## Purpose

Give HL students an interactive workspace to construct Born-Haber cycles, calculate lattice enthalpies using Hess's law, and compare theoretical vs experimental lattice enthalpies to assess covalent character. R1.2 Born-Haber cycles are exclusively HL content heavily tested on Paper 2.

---

## Architecture

**Single-file HTML** following SimEngine conventions: IIFE closure, CSS variables from design system, 240px sidebar + 1fr grid, canvas-based visuals, SL/HL toggle, teacher mode.

**Entirely HL content** — SL/HL toggle exists for UI consistency but all tabs are HL.

**Three tabbed views** below the header:
1. **Cycle Builder** — default
2. **Lattice Enthalpy Calculator**
3. **Theoretical vs Experimental**

---

## Tab 1: Cycle Builder

### Sidebar
Compound palette grouped by type:
- **Group 1 halides** — NaCl, LiF, KBr, NaF, KCl, LiCl, NaBr
- **Group 2 compounds** — MgO, CaO, MgCl₂
- **Advanced** — BaO

Mode toggle: **Step-by-step** / **Auto-build**. Reset button.

### Main Panel

1. **Born-Haber cycle energy diagram** (canvas ~full width × 450px):
   - Vertical energy axis (kJ mol⁻¹) with horizontal energy levels connected by labeled arrows
   - **Step-by-step mode** (6 stages for NaCl-type, 8 for MgCl₂):
     1. Elements in standard states — baseline energy level
     2. Atomization of metal — ΔHₐₜ(M) arrow up
     3. Atomization of non-metal — ΔHₐₜ(X) arrow up
     4. Ionization of metal — IE₁ (and IE₂ for Group 2) arrow up
     5. Electron affinity — EA₁ arrow down (×2 for MgCl₂)
     6. Lattice enthalpy — large arrow down to compound level
   - Formation enthalpy shown as direct path (dashed blue arrow)
   - Arrows color-coded: endothermic (red, up), exothermic (green, down)
   - Lattice enthalpy arrow in purple when solved
   - "Next Step" button advances through stages
   - Labels on each arrow: process name + value

2. **Step info card** (below canvas): explains current step with equation, definition, value

3. **Auto-build mode**: all steps animate in sequence (~1s each)

---

## Tab 2: Lattice Enthalpy Calculator

### Sidebar
Same compound palette + "Custom values" option.

### Main Panel

1. **Hess's law equation display**: ΔHf = ΔHₐₜ(M) + ΔHₐₜ(X) + ΣIE + ΣEA + ΔHₗₐₜₜ
2. **Value table**: each thermodynamic quantity with label, equation, and value (editable in custom mode)
3. **Step-by-step calculation**:
   - Rearrange for ΔHₗₐₜₜ
   - Substitute all values
   - Calculate result
4. **Result**: lattice enthalpy with sign convention (exothermic = negative)

---

## Tab 3: Theoretical vs Experimental

### Sidebar
Compound group selector + Challenge toggle.

### Main Panel

1. **Comparison table**: compound, theoretical ΔHₗₐₜₜ, experimental ΔHₗₐₜₜ, % difference
2. **Covalent character analysis**: large discrepancy = significant covalent character (Fajans' rules)
3. **Bar chart** (canvas): theoretical vs experimental side-by-side bars
4. **Challenge mode**: given thermodynamic data, calculate lattice enthalpy. Green/red feedback + score.

---

## Shared Components

### SL/HL Toggle
- All content is HL — toggle exists for UI consistency

### Teacher Mode
- Presets per tab, answer reveal toggle

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| H | Toggle HL |
| T | Toggle Teacher mode |
| 1, 2, 3 | Switch tabs |
| R | Reset |
| / | Focus search |
| ↑↓ | Navigate palette |
| Enter | Next step / Submit |
| E | Export CSV |
| Space | Play/pause auto-build |

### Data Layer
- Thermodynamic data for ~11 ionic compounds (atomization enthalpies, IE, EA, formation enthalpies, lattice enthalpies)
- Theoretical lattice enthalpies from ionic model for comparison

### Data Export
CSV of student work consistent with SimEngine pattern.

---

## Visual Design
Follows SimEngine design system: navy header, teal accents, green for exothermic, red for endothermic, purple for HL/lattice enthalpy.

---

## Success Criteria
1. Student can build Born-Haber cycle step-by-step for Group 1 and Group 2 compounds
2. Student can calculate lattice enthalpy using Hess's law
3. Student can compare theoretical vs experimental lattice enthalpies
4. All thermodynamic values match IB Data Booklet
5. Follows SimEngine conventions
