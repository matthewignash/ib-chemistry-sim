# States of Matter Implementation Plan (Sim #20)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive states of matter simulation for IB Chemistry S1.1 with animated particles, heating curves, and Maxwell-Boltzmann distributions.

**Architecture:** Single-file HTML with IIFE, 3 tabs (Particle View, Heating Curve, KE Distribution), canvas-based particle animation driven by temperature slider, interactive heating curve graph with synced particle preview, and Maxwell-Boltzmann curve visualization.

**Tech Stack:** Vanilla HTML/CSS/JS, Canvas 2D API, SimEngine design system conventions.

---

### Task 1: Scaffold & Data Layer

**Files:**
- Create: `SimEngine_StatesOfMatter.html`

**Step 1: Create scaffold with full CSS, HTML structure, and data layer**

Create the single-file HTML with:
- HTML: header ("States of Matter", S1.1 badge, SL/HL toggle, Teacher toggle), tab bar (3 tabs: Particle View, Heating Curve, KE Distribution), sim-container with palette panel + tab-content areas
- CSS: Full design system (`:root` variables, header gradient, tab bar, sidebar, cards, toggles, responsive) — copy from existing sims (e.g. `SimEngine_BornHaber.html` or `SimEngine_NuclearAtom.html`)
- JS IIFE with: `el(tag, cls, text)`, `round()`, `setupCanvas()` with `data-baseHeight`, `switchTab()`, SL/HL toggle, Teacher toggle, keyboard shortcuts skeleton, `buildPalette()`, `buildPresetDropdown()`

**Reference patterns:**
- `SimEngine_NuclearAtom.html` lines 1-500: full scaffold, el() at line 419, setupCanvas at line 432, switchTab pattern
- `SimEngine_BornHaber.html`: palette building with categories, mode toggles in sidebar

**Data layer** (embed inline):

```javascript
var SUBSTANCES = [
  { id: 'water', label: 'Water', formula: 'H\u2082O', category: 'molecular',
    mp: 273, bp: 373, particleColor: '#2563EB', particleRadius: 6 },
  { id: 'ethanol', label: 'Ethanol', formula: 'C\u2082H\u2085OH', category: 'molecular',
    mp: 159, bp: 351, particleColor: '#059669', particleRadius: 7 },
  { id: 'nacl', label: 'Sodium chloride', formula: 'NaCl', category: 'ionic',
    mp: 1074, bp: 1686, particleColor: '#7C3AED', particleRadius: 5 },
  { id: 'iron', label: 'Iron', formula: 'Fe', category: 'metallic',
    mp: 1811, bp: 3134, particleColor: '#DC2626', particleRadius: 5 }
];

var CATEGORIES = [
  { key: 'molecular', label: 'Molecular' },
  { key: 'ionic', label: 'Ionic' },
  { key: 'metallic', label: 'Metallic' }
];
```

State variables: `_activeTab`, `_selectedId`, `_temperature` (slider value), `_particles` array, `_animInterval`, `_heatingActive`, `_heatingEnergy`, `_mbTemps` array.

### Task 2: Tab 1 — Particle View

**Particle simulation canvas** (~full width x 400px): `setInterval` at ~30fps.

**Particle model:**
- `_particles` array of ~30 objects: `{x, y, vx, vy, homeX, homeY}` where homeX/homeY is the lattice position
- `initParticles(substance)`: create grid of particles for solid state (6x5 grid centered)
- `updateParticles()`: per-frame update logic based on current state:
  - **Solid** (T < mp): particles oscillate around homeX/homeY. Displacement = `amplitude * sin(t * freq + phase)` where amplitude ∝ T. Keep particles close to lattice.
  - **Liquid** (mp ≤ T < bp): particles drift randomly, stay near bottom half of canvas, bounce off walls and each other (simple overlap repulsion). Speed ∝ sqrt(T).
  - **Gas** (T ≥ bp): particles move freely across full canvas, higher speed, elastic wall bouncing. Speed ∝ sqrt(T).
  - **Phase transition smoothing**: at mp±10K and bp±10K, blend behaviors (some particles break free of lattice / spread out gradually)
- `drawParticles(ctx, W, H)`: clear canvas, draw each particle as filled circle with slight border, draw wall boundaries

**Temperature slider:**
- Range depends on substance: from `mp - 100` to `bp + 100` (clamped to min 50K)
- Label shows current T in Kelvin
- On input: update `_temperature`, trigger particle update

**State label**: DOM element showing "Solid", "Liquid", or "Gas" with colored badge (blue/teal/red)

**Property cards** (DOM below canvas): 4 mini cards in a flex row:
- Spacing: "Tightly packed" / "Close but irregular" / "Far apart"
- Movement: "Vibrate in place" / "Slide past each other" / "Move freely and fast"
- Shape & Volume: "Fixed shape, fixed volume" / "No fixed shape, fixed volume" / "No fixed shape, no fixed volume"
- Compressibility: "Incompressible" / "Virtually incompressible" / "Easily compressed"

Update property cards whenever state changes.

**Sidebar:** Substance palette (grouped by category), temperature slider, Reset button.

### Task 3: Tab 2 — Heating Curve

**Main canvas** (~full width x 350px): Temperature vs energy added graph.

**`drawHeatingCurve(ctx, W, H)`:**
- Axes: X = energy added (arbitrary units, 0–100), Y = temperature (K)
- Pre-calculate 5 segments for the selected substance:
  1. Solid heating: T rises from startT to mp (segment ~0–15% of energy)
  2. Melting plateau: T stays at mp (segment ~15–30%)
  3. Liquid heating: T rises from mp to bp (segment ~30–55%)
  4. Boiling plateau: T stays at bp (segment ~55–75%)
  5. Gas heating: T rises from bp upward (segment ~75–100%)
- Draw the curve as a thick line with color changes per segment
- If heating in progress, animate a dot moving along the curve
- Label each segment with text annotation

**Heating animation:**
- "Heat" button starts `setInterval` that increments `_heatingEnergy` by ~0.5 per frame
- Moving dot follows the curve
- Current state shown in info card below

**Region click interaction:**
- Click on a segment of the curve → highlight that segment, show annotation card explaining what's happening at particle level
- Annotation examples:
  - Solid heating: "Particles vibrate faster as kinetic energy increases"
  - Melting: "Energy breaks intermolecular forces. Temperature stays constant — all energy goes to overcoming attractions."
  - Boiling: "Energy overcomes remaining intermolecular forces to separate particles completely."

**Particle preview inset** (~120x120px canvas in top-right corner):
- Shows ~12 mini particles in the current state matching the heating curve position
- Reuse particle drawing logic from Tab 1 but simplified

**Sidebar:** Same substance palette + "Heat" / "Reset" controls

### Task 4: Tab 3 — KE Distribution

**Main canvas** (~full width x 300px): Maxwell-Boltzmann distribution curves.

**`drawMBCurves(ctx, W, H)`:**
- X-axis: Kinetic energy (arbitrary units), Y-axis: Fraction of particles
- Maxwell-Boltzmann function approximation: `f(E) = C * sqrt(E) * exp(-E / (k * T))` where C is normalization constant
- Draw smooth curves using `ctx.bezierCurveTo` or point-by-point with small increments
- Multiple curves at different temperatures, each with distinct color:
  - Low T: blue, narrow, tall peak shifted left
  - Mid T: teal, broader, lower peak
  - High T: red/orange, broadest, lowest peak, shifted right
- Mark "most probable KE" (peak) with dashed vertical line
- Mark "average KE" with dotted vertical line
- Legend showing temperature for each curve

**Temperature controls:**
- 3 preset temperature buttons: "Cold (200K)", "Warm (400K)", "Hot (800K)"
- Toggle buttons to show/hide each curve
- Or temperature slider that adds a curve at the current T

**Energy threshold line:**
- Draggable vertical line or fixed threshold
- Shade area to the right of threshold in semi-transparent color
- Label: "Particles with enough energy to escape"
- Show percentage of particles above threshold

**Sidebar:** Substance palette (affects curve shape slightly), temperature preset buttons, Reset

### Task 5: Polish & Integration

- **Keyboard shortcuts**: H (HL), T (Teacher), 1/2/3 (tabs), R (reset), / (search), ↑↓ (palette nav), E (export CSV), Space (play/pause heating)
- **Teacher mode**: presets per tab, answer reveal toggle
- **Data export CSV**: tab, substance, state, temperature, timestamp — with proper field quoting via `q()` helper
- **Responsive** (<900px): single column, horizontal pills, canvas resize
- **Window resize** handler → re-render active canvas, re-init particles
- **Accessibility**: aria-labels on canvases (dynamic), button elements for all interactive controls
- **Animation cleanup**: `stopAnimation()` on tab switch to prevent multiple intervals running

### Verification

1. Open via preview server at `localhost:8765/1-Projects/SimEngine/SimEngine_StatesOfMatter.html`
2. **Tab 1**: Select Water. Slide temperature from 200K to 500K. Verify:
   - Below 273K: particles vibrate in lattice (solid)
   - At 273K: some particles break free (melting transition)
   - 273K–373K: particles move randomly, close together (liquid)
   - Above 373K: particles spread out, fast (gas)
   - State label and property cards update correctly
   - Switch to NaCl — verify slider range adjusts to cover 1074K–1686K range
3. **Tab 2**: Select Water. Click "Heat". Verify:
   - Curve shows 5 segments with plateaus at 273K and 373K
   - Moving dot tracks along curve
   - Particle preview inset shows matching state
   - Click on melting plateau — annotation appears
4. **Tab 3**: Verify MB curves at 200K, 400K, 800K. Higher T → broader, lower, right-shifted. Energy threshold shading works.
5. Keyboard shortcuts: H, T, 1-3, R, Space, E
6. Responsive: resize to <900px, verify single column
