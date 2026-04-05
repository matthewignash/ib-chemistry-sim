# Acid-Base Titration Explorer -- Design Document

**Date:** 2026-03-31
**Scope:** Combined titration curve simulator + particle dissociation view

---

## Overview

Single-page simulation combining a real-time titration curve with a particle-level view of acid-base neutralization. Students add titrant drop-by-drop, watching the pH curve build while seeing molecular-level proton transfer and neutralization. Teacher mode adds a volume slider, free concentration inputs, and configurable acid/base pairs. HL extends with Henderson-Hasselbalch, derivative curves, half-equivalence points, and polyprotic acids.

## Deliverables

| File | Change | Purpose |
|------|--------|---------|
| SimEngine_Core.js | Add `SimEngine.Titration` module | pH calculation engine + acid/base database |
| SimEngine_AcidBase.html | New file | Titration Explorer deliverable |

---

## Titration Engine (SimEngine.Titration)

### pH Calculation

Pure math module. Given acid, base, concentrations, and volume of titrant, computes pH at any point.

**Strong acid + strong base:**
- Before equivalence: pH from excess H+ concentration
- At equivalence: pH = 7
- After equivalence: pOH from excess OH-, pH = 14 - pOH

**Weak acid + strong base:**
- Before any addition: Ka equilibrium (quadratic or approximation)
- Buffer region (before equivalence): Henderson-Hasselbalch, pH = pKa + log([A-]/[HA])
- At equivalence: hydrolysis of conjugate base, Kb = Kw/Ka
- After equivalence: excess OH-

**Strong acid + weak base:**
- Mirror of weak acid/strong base using Kb

**Weak acid + weak base:**
- Combined Ka/Kb calculation at each point

**Polyprotic acids (HL):**
- Sequential equivalence points using Ka1, Ka2, Ka3
- Each proton donation treated as separate equilibrium

### Curve Precomputation

When acid/base selection or concentrations change, the module precomputes the full curve from 0 to 50 mL in 0.1 mL steps (500 points). This enables instant graph rendering and smooth slider interaction.

### Acid/Base Database

Built into the module.

**Acids:**

| Name | Formula | Ka | Type | HL |
|------|---------|-----|------|-----|
| Hydrochloric acid | HCl | strong | strong | no |
| Sulfuric acid | H2SO4 | strong (Ka2 = 0.012) | strong/diprotic | yes |
| Nitric acid | HNO3 | strong | strong | no |
| Acetic acid | CH3COOH | 1.8e-5 | weak | no |
| Phosphoric acid | H3PO4 | Ka1=7.5e-3, Ka2=6.2e-8, Ka3=4.8e-13 | weak/triprotic | yes |
| Citric acid | C6H8O7 | Ka1=7.4e-4, Ka2=1.7e-5, Ka3=4.0e-7 | weak/triprotic | yes |

**Bases:**

| Name | Formula | Kb | Type |
|------|---------|-----|------|
| Sodium hydroxide | NaOH | strong | strong |
| Potassium hydroxide | KOH | strong | strong |
| Ammonia | NH3 | 1.8e-5 | weak |
| Sodium carbonate | Na2CO3 | 2.1e-4 | weak |

### Presets (Student Mode)

| Preset | Acid | Base | Type |
|--------|------|------|------|
| Strong/Strong | HCl (0.10 M) | NaOH (0.10 M) | SA/SB |
| Weak Acid/Strong Base | CH3COOH (0.10 M) | NaOH (0.10 M) | WA/SB |
| Strong Acid/Weak Base | HCl (0.10 M) | NH3 (0.10 M) | SA/WB |
| Weak/Weak | CH3COOH (0.10 M) | NH3 (0.10 M) | WA/WB |

### Module API

```
SimEngine.Titration.init(config)
  config: { acidKey, baseKey, acidConc, baseConc, acidVol }

SimEngine.Titration.computeCurve()
  Returns: [{ volume, pH, pOH, hConc, ohConc, haConc, aConc, region }]

SimEngine.Titration.getPHAtVolume(vol)
  Returns: { pH, pOH, hConc, ohConc, haConc, aConc, region }

SimEngine.Titration.getEquivalencePoints()
  Returns: [{ volume, pH }]  (multiple for polyprotic)

SimEngine.Titration.getHalfEquivalencePoints()
  Returns: [{ volume, pH, pKa }]

SimEngine.Titration.getBufferRange()
  Returns: { startVol, endVol }

SimEngine.Titration.getDerivative()
  Returns: [{ volume, dPHdV }]

SimEngine.Titration.getHendersonHasselbalch(vol)
  Returns: { pKa, ratioLog, aConc, haConc, pH }

SimEngine.Titration.getSpeciesCounts(vol, maxParticles)
  Returns: { HA, H, A, OH, water, spectator }

SimEngine.Titration.ACIDS   -- acid database
SimEngine.Titration.BASES   -- base database
SimEngine.Titration.PRESETS -- 4 classic presets
```

---

## Titration Interaction

### Drop-by-Drop Mode (Student Default)

- "Add Drop" button: adds 0.5 mL per click
- "Stream" button: hold to add continuously at ~2 mL/sec
- Volume display: "Volume added: 12.5 mL"
- pH readout: large, prominent, updates with each drop
- pH curve builds point-by-point as drops are added
- "Reset Titration" returns to 0 mL

### Slider Mode (Teacher)

- Volume slider: 0 to 50 mL, step 0.1 mL
- pH updates instantly as slider moves
- Full curve visible immediately
- Concentration inputs become free-text number inputs (0.01-2.0 M)
- Acid and base dropdowns show full list including HL polyprotic acids

### Controls

- Preset dropdown (student mode): 4 classic types
- Acid dropdown + concentration
- Base dropdown + concentration
- Indicator dropdown: phenolphthalein, methyl orange, bromothymol blue, none
- Add Drop / Stream / Reset buttons
- No play/pause/speed -- this sim is volume-driven, not time-driven

---

## pH Curve Graph

Full-width graph using SimEngine.Graph module. pH (0-14) vs Volume added (0-50 mL).

### Curve Rendering

- Student mode: points appear as drops are added, connected by line
- Teacher mode: full precomputed curve drawn, dot marker at current volume

### Annotated Regions

Color-coded background zones on the graph:
- **Initial region** (light blue): before any significant reaction
- **Buffer region** (light green): where pH changes slowly (WA/SB and SA/WB only)
- **Equivalence point** (vertical dashed line): labeled with volume and pH
- **Excess region** (light orange): after equivalence, excess titrant dominates

### HL Additions

- **Half-equivalence point**: marked dot with label "pH = pKa" (WA/SB) or "pOH = pKb" (SA/WB)
- **Derivative curve**: toggle overlay showing dpH/dV on secondary y-axis, spike at equivalence
- **Indicator range overlay**: horizontal band on pH axis showing selected indicator's transition range, colored with indicator colors

---

## Particle View

Small canvas (~400x300) showing a simplified beaker with animated species sprites.

### Species

- **HA** molecules: intact acid (one color per acid)
- **H+** ions: small red circles
- **A-** ions: conjugate base color
- **OH-** ions: small blue circles (appear as titrant added)
- **H2O**: brief flash animation when H+ meets OH- (neutralization)
- **Spectator ions** (Na+, Cl-, etc.): grey, subtle

### Behavior

- Particle counts derived from pH calculation at current volume via getSpeciesCounts()
- Capped at ~100 total particles for visual clarity
- Simple Brownian motion: random velocity nudges each frame, particles drift within beaker bounds
- When drop added: new OH- particles appear at top, drift down
- H+ and OH- that overlap annihilate with brief H2O flash effect
- Strong acid: no HA shown (fully dissociated). Weak acid: mix of HA + H+ + A-
- Legend on canvas showing species colors

### Flask Background Color (Indicator)

- No indicator: clear / light blue
- Phenolphthalein: colorless below 8.2, pink above 10.0
- Methyl orange: red below 3.1, yellow above 4.4
- Bromothymol blue: yellow below 6.0, blue above 7.6
- Smooth color interpolation within transition range

---

## HL Panel

Purple-bordered card (same pattern as Equilibrium HL panel).

### Readouts

- **Ka** (or Ka1, Ka2, Ka3 for polyprotic)
- **Kb** of conjugate base (Kw / Ka)
- **pKa / pKb**
- **[H+]** and **[OH-]** at current volume
- **Henderson-Hasselbalch**: pH = pKa + log([A-]/[HA]) with current values substituted. Only displayed when current volume is in the buffer region.

---

## Data Collection

Uses existing SimEngine.DataCollector module, same pattern as Gas Laws and Equilibrium.

### Variables

| Key | Label | Default | HL |
|-----|-------|---------|-----|
| volume | Volume added (mL) | yes | no |
| pH | pH | yes | no |
| pOH | pOH | yes | no |
| hConc | [H+] (mol/L) | no | no |
| ohConc | [OH-] (mol/L) | no | no |
| haConc | [HA] (mol/L) | no | yes |
| aConc | [A-] (mol/L) | no | yes |

### Adaptations

Since this sim is volume-driven (not time-driven), data collection works differently:
- **Auto-collect mode**: replaces timed collection. When enabled, automatically records a data point at each drop added.
- **Snapshot**: works normally -- capture current state at any volume.
- **Sweep** (teacher): sweep titrant volume from 0 to 50 mL in N steps, record at each step.

---

## Indicators Database

| Indicator | pH Low | pH High | Color Low | Color High |
|-----------|--------|---------|-----------|------------|
| Phenolphthalein | 8.2 | 10.0 | colorless | #EC4899 (pink) |
| Methyl orange | 3.1 | 4.4 | #EF4444 (red) | #EAB308 (yellow) |
| Bromothymol blue | 6.0 | 7.6 | #EAB308 (yellow) | #3B82F6 (blue) |

---

## Page Layout

```
+------------------------------------------------------+
|  .header -- "Acid-Base Titration Explorer"            |
|  [SL/HL toggle] [Teacher/Student toggle]              |
+------------------------------------------------------+
|                                                       |
|  +---------------------+  +------------------------+ |
|  |  PARTICLE CANVAS     |  |  CONTROL PANEL          | |
|  |  Beaker view         |  |  Preset: [4 types]      | |
|  |  Species sprites     |  |  Acid: [dropdown] [conc] | |
|  |  Flask color from    |  |  Base: [dropdown] [conc] | |
|  |  indicator           |  |  Indicator: [dropdown]   | |
|  |  Legend              |  |                          | |
|  |                      |  |  [Add Drop] [Stream]     | |
|  |                      |  |  Vol: 12.5 mL  pH: 4.32 | |
|  |                      |  |  [Reset Titration]       | |
|  |                      |  |                          | |
|  |                      |  |  -- INFO READOUT --      | |
|  |                      |  |  Equivalence: 25.0 mL    | |
|  |                      |  |  Region: Buffer          | |
|  |                      |  |                          | |
|  |                      |  |  -- DATA COLLECTION --   | |
|  +---------------------+  +------------------------+ |
|                                                       |
|  +--------------------------------------------------+ |
|  |  pH vs Volume Curve (full width)                  | |
|  |  Annotated regions + equivalence point            | |
|  |  [HL: derivative toggle] [HL: indicator overlay]  | |
|  +--------------------------------------------------+ |
|                                                       |
|  +--------------------------------------------------+ |
|  |  [HL] Acid-Base Thermodynamics                    | |
|  |  Ka / Kb / pKa / Henderson-Hasselbalch            | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
```

Responsive: single column below 900px. Print: hide controls, show graph + particle canvas.

---

## Critical Differences from Gas Laws / Equilibrium

1. **Volume-driven, not time-driven**: No play/pause/speed. Student controls pace via drops.
2. **Precomputed curve**: Full pH curve calculated upfront, not built frame-by-frame.
3. **Particle view is decorative**: Sprite animation for conceptual understanding, not a physics simulation. Counts derived from math engine.
4. **Data collection adaptation**: Auto-collect per drop replaces timed collection.
5. **New module**: SimEngine.Titration is pure math (no particle arrays, no frame stepping).
