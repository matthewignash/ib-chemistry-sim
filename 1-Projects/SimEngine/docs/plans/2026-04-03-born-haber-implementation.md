# Born-Haber Cycle Builder — Implementation Plan (Sim #19)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive Born-Haber cycle builder for IB Chemistry HL students covering R1.2 Enthalpy Changes.

**Architecture:** Single-file HTML with IIFE, 3 tabs (Cycle Builder, Lattice Enthalpy Calculator, Theoretical vs Experimental), canvas-based energy diagrams, step-by-step cycle construction, Hess's law calculations, and theoretical vs experimental lattice enthalpy comparison.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas 2D API, SimEngine design system conventions.

---

### Task 1: Scaffold & Data Layer

**Files:**
- Create: `SimEngine_BornHaber.html`

**Step 1: Create scaffold with full CSS, HTML structure, and data layer**

Create the single-file HTML with:
- HTML: header ("Born-Haber Cycles", R1.2 badge, HL badge hidden, SL/HL toggle, Teacher toggle), tab bar (3 tabs: Cycle Builder, Lattice Enthalpy Calculator, Theoretical vs Experimental), sim-container with palette panel + tab-content areas
- CSS: Full design system (`:root` variables, header gradient, tab bar, sidebar, cards, toggles, responsive) — copy from existing sims
- JS IIFE with: `el(tag, cls, text)`, `round()`, `setupCanvas()` returning `{ctx, W, H}`, `switchTab()`, SL/HL toggle, Teacher toggle, keyboard shortcuts skeleton

**Data layer** (embed inline):

```javascript
var BH_COMPOUNDS = [
  // Group 1 halides (6 steps each: atomMetal, atomNonmetal, ie1, ea1, formation, lattice)
  { id:'nacl', label:'NaCl', category:'group1', formula:'NaCl', metal:'Na', nonmetal:'Cl', nonmetalMol:'Cl₂',
    steps: {
      atomMetal:    { label:'Atomization of Na',     eq:'Na(s) → Na(g)',              dh:108 },
      atomNonmetal: { label:'Atomization of Cl',     eq:'½Cl₂(g) → Cl(g)',           dh:121 },
      ie1:          { label:'First ionization of Na', eq:'Na(g) → Na⁺(g) + e⁻',      dh:496 },
      ea1:          { label:'Electron affinity of Cl',eq:'Cl(g) + e⁻ → Cl⁻(g)',      dh:-349 },
      formation:    { label:'Formation of NaCl',      eq:'Na(s) + ½Cl₂(g) → NaCl(s)',dh:-411 },
      lattice:      { label:'Lattice enthalpy',       eq:'Na⁺(g) + Cl⁻(g) → NaCl(s)',dh:-787 }
    }
  },
  // ... LiF, NaF, KBr, KCl, LiCl, NaBr (same structure)
  // Group 2 compounds (8 steps: atomMetal, atomNonmetal, ie1, ie2, ea1, ea2, formation, lattice)
  // MgO, CaO, MgCl₂ (ea1 only for MgCl₂, doubled), BaO
];
```

Reuse exact thermodynamic values from SimEngine_HessLaw.html BH_COMPOUNDS. Add NaF:
- atomMetal:108, atomNonmetal:79(F), ie1:496, ea1:-328(F), formation:-577, lattice:-932

Add theoretical lattice enthalpies for Tab 3:
```javascript
var THEORETICAL_LATTICE = {
  nacl: -770, lif: -1030, naf: -910, kbr: -672, kcl: -701, licl: -834, nabr: -735,
  mgo: -3850, cao: -3460, mgcl2: -2540, bao: -3110
};
```

Categories:
```javascript
var BH_CATEGORIES = [
  { key:'group1', label:'Group 1 Halides' },
  { key:'group2', label:'Group 2 Compounds' },
  { key:'advanced', label:'Advanced' }
];
```

### Task 2: Tab 1 — Cycle Builder

**Main canvas** (~full width × 450px): Born-Haber cycle energy diagram

**drawCycleCanvas():**
- Vertical energy axis (kJ mol⁻¹), horizontal energy levels connected by labeled arrows
- `toY(energy)` coordinate transform mapping energy range to pixel Y
- Step-by-step mode: `_currentStep` index (0 to N), "Next Step" button advances
- Each step adds one energy level + arrow:
  1. Elements in standard states — baseline at 0
  2. Atomization of metal — arrow up (red)
  3. Atomization of non-metal — arrow up (red)
  4. Ionization of metal — IE₁ arrow up (red), IE₂ if Group 2 (red)
  5. Electron affinity — EA₁ arrow down (green), EA₂ if oxide (up, red — EA₂ is endothermic)
  6. Lattice enthalpy — large arrow down to compound level (purple)
- Formation enthalpy as dashed blue arrow from elements baseline to compound level
- Color coding: endothermic arrows red going up, exothermic arrows green going down, lattice enthalpy purple
- Labels on each arrow: process name + ΔH value

**drawArrow(ctx, x1, y1, x2, y2, color):** Utility for drawing arrows with arrowheads

**Step info card** (DOM below canvas): shows current step equation, definition, value in a `.sim-card`

**Auto-build mode:** `setInterval` animates through steps at ~1s each. Space to play/pause.

**Sidebar:** Compound palette (grouped by category), mode toggle (Step-by-step / Auto-build), Reset button

### Task 3: Tab 2 — Lattice Enthalpy Calculator

**Sidebar:** Same compound palette + "Custom values" checkbox

**Main panel:**

1. **Hess's law equation display** (DOM card):
   `ΔHf = ΔHₐₜ(M) + ΔHₐₜ(X) + ΣIE + ΣEA + ΔHₗₐₜₜ`

2. **Value table** (DOM table in card): each thermodynamic quantity with label, equation, value
   - In custom mode, values are editable `<input type="number">`
   - Pre-filled from compound data

3. **Step-by-step calculation** (DOM card, shown on "Calculate" button click):
   - Step 1: Rearrange: `ΔHₗₐₜₜ = ΔHf − ΔHₐₜ(M) − ΔHₐₜ(X) − ΣIE − ΣEA`
   - Step 2: Substitute values with actual numbers
   - Step 3: Calculate result
   - Color-coded result: green for exothermic lattice enthalpy

4. **Result card**: lattice enthalpy value with sign, comparison note

### Task 4: Tab 3 — Theoretical vs Experimental

**Sidebar:** Compound group selector (Group 1 Halides / Group 2 / All), Challenge toggle

**Main panel:**

1. **Comparison table** (DOM): compound, theoretical ΔHₗₐₜₜ, experimental ΔHₗₐₜₜ, % difference
   - Color-code % difference: green (<5%), amber (5-15%), red (>15%)

2. **Covalent character analysis card** (DOM):
   - Large discrepancy = significant covalent character
   - Fajans' rules summary: small highly-charged cation + large polarizable anion → more covalent
   - Highlight compounds with largest discrepancies

3. **Bar chart** (canvas ~full width × 300px): theoretical vs experimental side-by-side bars for each compound
   - Theoretical bars in teal, experimental bars in blue
   - Labels below bars, values on top

4. **Challenge mode**: Given thermodynamic data for a compound, calculate lattice enthalpy.
   - Show all step values except lattice enthalpy
   - Student enters calculated value in input
   - Green/red feedback + score + show correct answer if wrong

### Task 5: Polish & Integration

- **Keyboard shortcuts**: H (HL), T (Teacher), 1/2/3 (tabs), R (reset), / (search), ↑↓ (palette nav), Enter (next step / submit), E (export CSV), Space (play/pause auto-build)
- **Teacher mode**: presets per tab, answer reveal toggle
- **Data export CSV**: tab, compound, student input, correct answer, score, timestamp — with proper field quoting
- **Responsive** (<900px): single column, horizontal pills, canvas resize
- **Window resize** handler → re-render active canvas
- **Accessibility**: aria-labels on canvases, button elements for interactive controls

### Verification

1. Open via preview server at `localhost:8765/1-Projects/SimEngine/SimEngine_BornHaber.html`
2. **Tab 1**: Select NaCl. Click "Next Step" through 6 stages — verify energy levels build correctly, arrows colored correctly (red up, green down, purple lattice). Verify formation enthalpy dashed blue arrow. Try auto-build — verify animation. Select MgO — verify 8 steps (IE₁, IE₂, EA₁, EA₂).
3. **Tab 2**: Select NaCl. Verify value table pre-filled. Click Calculate — verify step-by-step shows correct rearrangement and result (-787 kJ mol⁻¹). Try custom mode — verify editable inputs.
4. **Tab 3**: Verify comparison table shows all compounds with theoretical vs experimental. Verify bar chart renders. Check % differences. Try challenge mode — enter correct answer, verify green feedback.
5. Test keyboard shortcuts: H, T, 1-3, R, Space, Enter, E.
6. Responsive: resize to <900px, verify single column.
