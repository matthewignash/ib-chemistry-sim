# Equilibrium Explorer — Design Document

**Date:** 2026-03-31
**Phase:** 2 (first simulation)
**IB Syllabus:** R2.3 — How Far? The Extent of Chemical Change

---

## Overview

Combined Dynamic Equilibrium Visualizer + Le Chatelier's Principle Lab. A single simulation that shows equilibrium establishing dynamically, then lets students perturb the system (concentration, temperature, pressure/volume) and observe the response. Builds on the SimEngine architecture proven in Phase 1 (Gas Laws).

## Deliverables

| File | Path | Purpose |
|------|------|---------|
| SimEngine_Equilibrium.html | `1-Projects/SimEngine/` | Phase 2 deliverable |
| SimEngine_Core.js | `3-Resources/SimEngine/` | New `SimEngine.Reaction` module added |

---

## Core Simulation Model

### SL View: Color-Change Model (Default)

Particles move freely in a container with elastic wall collisions. Each frame, every particle has a probability of switching species:

- Forward probability: `k_f * [reactants]` (concentration-dependent)
- Reverse probability: `k_r * [products]` (concentration-dependent)
- At equilibrium: forward rate = reverse rate; species populations stabilize but particles keep switching (visually dynamic)
- Kc = k_f / k_r determines equilibrium position

This model prioritizes clarity — students see particles constantly changing color in both directions, reinforcing that equilibrium is dynamic, not static.

### HL View: Collision-Reaction Model (Extension)

- Reactions only occur on particle-particle collisions
- A + B collision with sufficient energy -> C + D
- Activation energy threshold: only collisions above Ea trigger reaction
- More physically accurate, connects to collision theory and rate concepts
- Available when HL toggle is enabled

### Selectable Reactions

| Reaction | Key | Kc (298K) | delta-H (kJ/mol) | delta-n(gas) | Reactant Color | Product Color |
|----------|-----|-----------|-------------------|--------------|----------------|---------------|
| N2O4 <=> 2NO2 | N2O4_NO2 | 4.6e-3 | +57.2 | +1 | Colorless/pale | Brown |
| N2 + 3H2 <=> 2NH3 | haber | 6.0e5 | -92.2 | -2 | Blue + Grey | Green |
| Co(H2O)6-2+ <=> CoCl4-2- | cobalt | 1.0e-2 | +50 | 0 (aq) | Pink | Blue |
| Fe3+ + SCN- <=> FeSCN2+ | thiocyanate | 1.4e2 | -1.5 | 0 (aq) | Yellow + Colorless | Red |

Default: N2O4 <=> 2NO2 (classic IB reaction, colorless-to-brown, endothermic).

---

## Le Chatelier Perturbations

### Concentration Changes
- Buttons: [+Reactant] [-Reactant] [+Product] [-Product]
- Adding reactant = inject new particles of that species
- System visibly shifts: rates diverge, then reconverge at same Kc
- Concentration vs. time graph shows spike and re-equilibration

### Temperature Changes
- Temperature slider (200K-800K)
- Endothermic (delta-H > 0): raising T increases k_f more than k_r, shifts right, Kc increases
- Exothermic (delta-H < 0): raising T increases k_r more than k_f, shifts left, Kc decreases
- Implementation: Arrhenius scaling k(T2) = k(T1) * exp(-Ea/R * (1/T2 - 1/T1))
- Particles also speed up visually (velocity rescaling)

### Pressure/Volume Changes
- Volume slider with movable piston wall (same concept as Gas Laws)
- Only affects reactions with delta-n(gas) != 0
- Decrease volume -> shifts toward fewer moles of gas
- Kc stays the same; only position shifts
- For aqueous reactions: volume slider disabled with explanatory note

### Perturbation Feedback
- Text annotation on perturbation: "Q < K -- system shifts right to restore equilibrium"
- Q vs. K panel updates in real-time showing approach back to K

---

## UI Layout

```
+-----------------------------------------------------------+
|  .header  -- Navy gradient banner                          |
|  "Equilibrium Explorer" / "IB Chemistry SimEngine"         |
|  [SL/HL toggle] [Teacher/Student toggle]                   |
+-----------------------------------------------------------+
|                                                            |
|  +------------------------+  +--------------------------+  |
|  |                        |  |  CONTROL PANEL           |  |
|  |  PARTICLE CANVAS       |  |  Reaction: [dropdown]    |  |
|  |  (840 x 420)           |  |  Temperature: [===] 300K |  |
|  |                        |  |  Volume:      [===] 2.0  |  |
|  |  Reactants (color A)   |  |                          |  |
|  |  Products  (color B)   |  |  -- PERTURBATIONS --     |  |
|  |  Switching in both     |  |  [+Reactant] [-Reactant] |  |
|  |  directions            |  |  [+Product]  [-Product]  |  |
|  |                        |  |                          |  |
|  |                        |  |  [Play] [Pause] [Reset]  |  |
|  |                        |  |                          |  |
|  |                        |  |  -- Q vs K READOUT --    |  |
|  |                        |  |  Kc: 4.6e-3             |  |
|  |                        |  |  Q:  2.1e-3             |  |
|  |                        |  |  Q < K -> shifts right   |  |
|  +------------------------+  +--------------------------+  |
|                                                            |
|  +-----------------------+  +----------------------------+ |
|  |  [Conc] vs Time       |  |  Forward/Reverse Rates    | |
|  |  [Reactant] line      |  |  rate_f line (teal)       | |
|  |  [Product] line       |  |  rate_r line (orange)     | |
|  |  Perturbation spikes  |  |  Converge at equilibrium  | |
|  |  + recovery           |  |  Diverge on perturbation  | |
|  +-----------------------+  +----------------------------+ |
|                                                            |
|  +--------------------------------------------------------+|
|  |  [HL] Quantitative Panel                               ||
|  |  Kc | Kp | delta-G = -RT ln K                          ||
|  |  Collision-reaction particle view (HL model)            ||
|  +--------------------------------------------------------+|
|                                                            |
|  .footer                                                   |
+-----------------------------------------------------------+
```

Canvas: Fixed internal resolution 840x420, CSS width:100% height:auto for responsive scaling.
Responsive breakpoints: 900px (single column), 600px (minimum).

---

## Graphs

### Concentration vs. Time (left)
- Two series: reactant concentration (blue), product concentration (red)
- X-axis: time (scrolling buffer)
- Perturbation moments marked with vertical dashed line
- Uses SimEngine.Graph from Core

### Forward/Reverse Rates (right)
- Two series: forward rate (teal), reverse rate (orange)
- Rates converge at equilibrium, diverge on perturbation, reconverge
- This is the key visual for "dynamic equilibrium"
- Uses SimEngine.Graph from Core

### Q vs. K Readout (control panel)
- Not a graph — text display in control panel
- Shows current Kc, current Q, and shift direction
- Updates every frame

---

## New Engine Module: SimEngine.Reaction

Added to SimEngine_Core.js. Reusable for future reaction-based simulations (acid-base, rate of reaction).

### Public API

```
SimEngine.Reaction.init(config)
  config: { reactionKey, particleCount, bounds, temperature }

SimEngine.Reaction.step(dt)
  Moves particles, processes reactions (SL: probabilistic, HL: collision-based)

SimEngine.Reaction.render(ctx)
  Draws particles colored by species

SimEngine.Reaction.perturb(type, params)
  type: 'addReactant' | 'addProduct' | 'removeReactant' | 'removeProduct'

SimEngine.Reaction.setTemperature(newT)
  Arrhenius recalculation of k_f, k_r; velocity rescaling

SimEngine.Reaction.setVolume(newV)
  Piston adjustment; Q recalculated

// Query methods
SimEngine.Reaction.getConcentrations()  -> { reactants: [...], products: [...] }
SimEngine.Reaction.getRates()           -> { forward, reverse }
SimEngine.Reaction.getQ()               -> reaction quotient
SimEngine.Reaction.getKc()              -> equilibrium constant at current T
SimEngine.Reaction.getKp()              -> Kp from Kc and delta-n (HL)
SimEngine.Reaction.getDeltaG()          -> delta-G = -RT ln K (HL)
SimEngine.Reaction.isAtEquilibrium()    -> boolean (Q approx K)
SimEngine.Reaction.getMode()            -> 'color-change' | 'collision'
```

### Reaction Database

Built into the module (same pattern as species data in Particles module):

```
REACTIONS: {
  'N2O4_NO2':    { equation, Kc_298, dH, dn, Ea_f, Ea_r, colors, stoich },
  'haber':       { equation, Kc_298, dH, dn, Ea_f, Ea_r, colors, stoich },
  'cobalt':      { equation, Kc_298, dH, dn, Ea_f, Ea_r, colors, stoich },
  'thiocyanate': { equation, Kc_298, dH, dn, Ea_f, Ea_r, colors, stoich }
}
```

---

## HL Extensions

- **Kp display**: Kp = Kc * (RT)^(delta-n), shown in HL panel
- **delta-G display**: delta-G = -RT ln K, updates with temperature
- **Collision-reaction model**: HL particle view with Ea threshold, collision flashes on reaction events
- **Quantitative readouts**: All values formatted with scientific notation and units

---

## Reuse from SimEngine_Core.js

| Module | Reuse | Notes |
|--------|-------|-------|
| State | As-is | Event bus for all param changes |
| Graph | As-is | Concentration and rate plots |
| Controls | As-is | Sliders, dropdown, toggles, buttons, keyboard |
| Particles | Not used | Gas-specific; Reaction module replaces it for this sim |

---

## IB Syllabus Alignment

**SL Content:**
- Dynamic equilibrium concept (particles switching both directions)
- Kc expressions (displayed, not calculated by student)
- Le Chatelier's principle — qualitative prediction of shifts
- Q vs. K comparison

**HL Content:**
- Kp calculations
- delta-G = -RT ln K
- Collision-reaction model (connects to collision theory)
- Quantitative equilibrium constant problems
