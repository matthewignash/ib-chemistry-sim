# States of Matter — Design Document (Sim #20)

**Syllabus:** S1.1 — Introduction to the Particulate Nature of Matter
**File:** `SimEngine_StatesOfMatter.html`
**Level:** SL (no HL-only content)
**Tabs:** 3

---

## Tab 1: Particle View

**Canvas** (~full width x 400px): Animated 2D particle simulation with ~30 particles as colored circles.

**Temperature slider** (100K–500K) drives particle behavior in real-time:
- **Solid** (below mp): Particles vibrate in fixed lattice positions, tight spacing, oscillate around grid points
- **Liquid** (between mp & bp): Particles move randomly, close together but no fixed positions, slide past each other
- **Gas** (above bp): Particles move fast, spread out, bounce off walls, large spacing
- **Phase transitions**: Visual mixing of behaviors as particles break free

**State label** updates dynamically ("Solid", "Liquid", "Gas") with color indicator.

**Property cards** (DOM below canvas): Update per state showing spacing, movement type, shape/volume, compressibility.

Physics: particle speed proportional to temperature (KE ∝ T), elastic wall collisions, `setInterval` at ~30fps.

---

## Tab 2: Heating Curve

**Canvas** (~full width x 350px): Interactive temperature-vs-energy graph.

- **"Heat" button** starts continuous heating from low temperature
- Graph plots temperature (Y) vs energy added (X)
- **Plateaus** at melting point and boiling point (energy goes to breaking IMFs, not raising T)
- **5 labeled regions**: solid heating, melting (plateau), liquid heating, boiling (plateau), gas heating
- Click any region → annotation card below explains particle-level behavior
- **Small particle preview** (canvas inset ~120x120px) synced to current position on curve
- **Substance selector** in palette changes mp/bp values

---

## Tab 3: Kinetic Energy Distribution

**Canvas** (~full width x 300px): Maxwell-Boltzmann distribution curves.

- X-axis: kinetic energy, Y-axis: fraction of particles
- Draw curves at multiple temperatures (color-coded: blue=cold, orange=hot)
- Temperature slider or buttons to add/remove curves at specific temperatures
- Distribution broadens and shifts right at higher T
- Mark "most probable KE" and "average KE" on curves
- Shaded area above energy threshold → relates to evaporation/boiling

---

## Sidebar Palette

- **Substance selector**: Water (H₂O), Ethanol (C₂H₅OH), Sodium chloride (NaCl), Iron (Fe)
- **Reset** button
- **Teacher presets** (visible in teacher mode)

---

## Data

| Substance | Formula | mp (K) | bp (K) |
|-----------|---------|--------|--------|
| Water | H₂O | 273 | 373 |
| Ethanol | C₂H₅OH | 159 | 351 |
| Sodium chloride | NaCl | 1074 | 1686 |
| Iron | Fe | 1811 | 3134 |

---

## Keyboard Shortcuts

H (HL), T (Teacher), 1/2/3 (tabs), R (reset), / (search), ↑↓ (navigate palette), E (export CSV), Space (play/pause heating)
