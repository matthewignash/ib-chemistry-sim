# Gas Laws Virtual Lab — Implementation Plan (Sim #21)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive Gas Laws Virtual Lab for IB Chemistry students covering S1.5 Ideal Gases, with hands-on apparatus simulations, an ideal gas calculator with practice mode, and HL-level real vs ideal gas analysis.

**Architecture:** Single-file HTML with IIFE, 3 tabs (Gas Law Labs, Ideal Gas Calculator, Real vs Ideal [HL]). Canvas-based apparatus visualization, real-time graphing, particle animations, Van der Waals equation calculations.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas 2D API, SimEngine design system conventions.

---

### Task 1: Scaffold & Data Layer

**Files:**
- Create: `SimEngine_GasLawsLab.html`

**Step 1: Create scaffold with full CSS, HTML structure, and data layer**

Create the single-file HTML with:
- HTML: header ("Gas Laws Virtual Lab", S1.5 badge, HL badge hidden, SL/HL toggle, Teacher toggle via `#headerToggles`), tab bar (3 tabs: Gas Law Labs, Ideal Gas Calculator, Real vs Ideal), `sim-container` with `sim-top-row` containing 240px `palette-panel` + `tab-content` areas
- CSS: Full design system copy from SimEngine_StatesOfMatter.html — `:root` variables (--navy, --teal, --blue, --purple, --light-bg, --card-bg, --text, --text-muted, --border, --green, --red, --amber, background variants, --sim-canvas-bg, --hl-badge-bg, --hl-border), header gradient, tab bar with `.tab-btn[data-tab]` and `.tab-num`, sidebar 240px+1fr grid, cards, toggles, buttons, palette items, responsive breakpoints, keyboard hint bar, `.hl-panel { display: none; }` / `body.hl-active .hl-panel { display: block; }`, teacher panel visibility, `focus-visible` outline on `.tab-btn`, `.check-btn`, `.palette-item`
- JS roundRect polyfill before IIFE (exact copy from StatesOfMatter)
- JS IIFE with standard helpers: `el(tag, cls, text)` (text is 3rd param, NOT object), `round(val, dp)`, `setupCanvas(canvas)` returning ctx (with `data-baseHeight` pattern), `q(s)` for CSV quoting, `lerp(a, b, t)`, `clamp(v, lo, hi)`
- `buildToggles()` creating HL toggle (--toggle-on: var(--purple), aria-label "Enable HL content", toggles `body.hl-active`) and Teacher toggle (--toggle-on: var(--amber), aria-label "Enable teacher mode", toggles `body.teacher-active`)
- `switchTab(tabName)` with `_activeTab` state, toggling `.tab-btn.active` and `.tab-content.active`
- Tab button click listeners on `document.querySelectorAll('.tab-btn')`

**Reference patterns:**
- `SimEngine_StatesOfMatter.html` lines 1-500: full scaffold, el() helper, setupCanvas, switchTab
- `SimEngine_BornHaber.html`: palette building with categories

**Data layer** (embed inline):

```javascript
var R = 0.08206; // L atm mol⁻¹ K⁻¹

var GASES = [
  { id: 'ideal', label: 'Ideal Gas',         formula: '\u2014',  a: 0,     b: 0,      molar: 28, color: '#64748B' },
  { id: 'he',    label: 'Helium',             formula: 'He',     a: 0.0346, b: 0.0238, molar: 4,  color: '#2563EB' },
  { id: 'n2',    label: 'Nitrogen',           formula: 'N\u2082', a: 1.370,  b: 0.0387, molar: 28, color: '#0D9488' },
  { id: 'co2',   label: 'Carbon dioxide',     formula: 'CO\u2082', a: 3.658, b: 0.0429, molar: 44, color: '#D97706' },
  { id: 'h2o',   label: 'Water vapor',        formula: 'H\u2082O', a: 5.537, b: 0.0305, molar: 18, color: '#7C3AED' }
];

var GAS_LAWS = [
  { id: 'boyle',     label: "Boyle's Law",       xVar: 'V', yVar: 'P', held: 'T, n', relation: 'P \u221D 1/V' },
  { id: 'charles',   label: "Charles's Law",      xVar: 'T', yVar: 'V', held: 'P, n', relation: 'V \u221D T' },
  { id: 'gaylussac', label: "Gay-Lussac's Law",   xVar: 'T', yVar: 'P', held: 'V, n', relation: 'P \u221D T' },
  { id: 'avogadro',  label: "Avogadro's Law",     xVar: 'n', yVar: 'V', held: 'T, P', relation: 'V \u221D n' }
];
```

State variables: `_activeTab`, `_selectedGas`, `_selectedLaw`, `_paused`, `_labData`, `_labParticles`, `_pistonPos`, `_temperature`, `_pressure`, `_volume`, `_moles`, `_dragging`, `_calcMode`, `_currentProblem`, `_score`, `_realTemp`, `_realPressure`.

### Task 2: Tab 1 — Gas Law Labs

**Apparatus canvas** (~full width x 350px): `setInterval` at ~30fps.

**Apparatus model:**
- Cylinder with movable piston, particles bouncing inside
- Piston position maps to volume (0.5-5.0 L range)
- Particle count proportional to moles, speed proportional to sqrt(T)

**Per-law behavior:**
- **Boyle's** (P vs V): Piston draggable. P = nRT/V. As V decreases, P increases.
- **Charles's** (V vs T): Temperature slider. V = nRT/P. Piston auto-adjusts.
- **Gay-Lussac's** (P vs T): Fixed piston. Temperature slider. Pressure gauge on cylinder.
- **Avogadro's** (V vs n): Add/remove particle buttons. V = nRT/P. Piston auto-adjusts.

**Piston drag** (Boyle's only):
- mousedown/touchstart on canvas: detect if on piston bar, set `_dragging = true`
- mousemove/touchmove: update `_pistonPos` (clamped 0.1-0.9), recalculate V and P
- mouseup/touchend: `_dragging = false`

**Graph canvas** (~full width x 250px):
- Axes labeled with law's x/y variables
- Theoretical curve (dashed) across full range
- Collected data points as filled circles
- Current position as larger highlighted dot

**Data table** (DOM below graph):
- Columns match law variables
- "Record Point" button in sidebar pushes current values
- "Clear Data" button resets

**Particle preview** (120x120 inset):
- Small bouncing particles synced to current conditions

**Sidebar:** Gas law dropdown, Record/Clear buttons, Reset

### Task 3: Tab 2 — Ideal Gas Calculator

**Toggle:** Practice Mode / Free Calculator (buttons in sidebar)

**Practice Mode:**
- `generateProblem()`: randomly pick unknown (P/V/n/T), generate plausible values for other 3
- Scenario card displays problem text
- Student input field + "Check" button
- Green/red feedback, worked solution with PV=nRT rearrangement steps
- Score tracking, "Next Problem" button
- Teacher panel shows answer reveal

**Free Calculator:**
- "Solve for:" dropdown (P/V/n/T)
- Input fields for 3 knowns with unit labels
- Units toggle: atm/kPa, L/mL, K/°C
- "Solve" button shows result + step-by-step working
- Unit conversions: 1 atm = 101.325 kPa, 1 L = 1000 mL, K = °C + 273.15

**Particle animation** (~200x150 canvas):
- Particles representing calculated conditions (count ∝ n, speed ∝ sqrt(T), density ∝ 1/V)

### Task 4: Tab 3 — Real vs Ideal (HL)

Entire tab wrapped in `.hl-panel`.

**Compressibility graph** (~full width x 300px):
- X: Pressure (0-500 atm), Y: Z = PV/nRT (0.0-2.5)
- Ideal gas: horizontal dashed line at Z = 1
- Real gases: colored curves from Van der Waals equation
- Shaded regions: blue below Z=1 ("Attractive forces"), red above Z=1 ("Repulsive forces")

**Van der Waals Z calculation:**
- For each P, solve `(P + a/V²)(V - b) = RT` for V using Newton-Raphson (10 iterations)
- Then Z = PV/RT
- 50 pressure points, logarithmic spacing 1-500 atm

**Comparison table** (DOM):
- Columns: Gas, Formula, Z value, % deviation, a, b, Dominant effect
- At current temperature and reference pressure (200 atm)
- Sorted by |% deviation| descending
- Color-coded: green (<5%), amber (5-15%), red (>15%)

**Annotation cards:**
- Why gases deviate, Van der Waals a constant, b constant, temperature effect
- Teacher mode reveals additional cards

**Sidebar:** Temperature slider (100-1000 K), gas checkboxes

### Task 5: Polish & Integration

- **Keyboard shortcuts**: H (HL), T (Teacher), 1/2/3 (tabs), R (reset), / (search), ↑↓ (palette nav), E (export CSV), Space (play/pause)
- **Teacher mode**: presets per tab, answer reveal in calculator
- **Data export CSV**: per-tab export with `q()` helper for field quoting
- **Responsive** (<900px): single column, palette collapses, canvas resize
- **Window resize** handler → debounced re-render
- **Accessibility**: aria-labels on canvases, toggle inputs, focus-visible styles
- **Animation**: single setInterval, store return value in `_intervalId`

### Verification

1. Open via preview server at `localhost:8765/1-Projects/SimEngine/SimEngine_GasLawsLab.html`
2. **Tab 1 — Boyle's**: Drag piston, verify P vs V inverse relationship. Record points, verify data table. Export CSV.
3. **Tab 1 — Charles's**: Adjust temperature, verify V vs T linear.
4. **Tab 1 — Gay-Lussac's**: Fixed piston, verify pressure gauge responds to T.
5. **Tab 1 — Avogadro's**: Add/remove molecules, verify V vs n linear.
6. **Tab 2 — Practice**: Generate problem, enter answer, verify feedback + worked solution. Check score. Teacher mode reveals answer.
7. **Tab 2 — Free Calculator**: Solve for T with P=1, V=22.4, n=1 → T ≈ 273 K. Test unit toggles.
8. **Tab 3**: Enable HL. Verify Z vs P curves. He near ideal, H₂O/CO₂ deviate most. Temperature slider changes curves. Comparison table ranks correctly.
9. Keyboard shortcuts: H, T, 1-3, R, /, ↑↓, E, Space.
10. Responsive: resize to <900px, verify single column.
