# Gas Laws Virtual Lab — Design Document (Sim #21)

**Syllabus:** S1.5 — Ideal Gases
**File:** `SimEngine_GasLawsLab.html`
**Level:** SL + HL (Tab 3 is HL-only)
**Tabs:** 3

---

## Tab 1: Gas Law Labs

**Dropdown selector**: Boyle's Law (P vs V), Charles's Law (V vs T), Gay-Lussac's Law (P vs T), Avogadro's Law (V vs n)

**Virtual apparatus** (~full width x 350px canvas):
- **Boyle's**: Draggable piston in a cylinder. Drag to compress/expand gas. Particles inside respond in real-time.
- **Charles's**: Temperature dial below cylinder. Turn to heat/cool. Volume (piston position) adjusts automatically.
- **Gay-Lussac's**: Fixed volume container. Temperature dial changes pressure (shown on gauge).
- **Avogadro's**: Fixed T and P. Buttons to add/remove particles. Volume adjusts.

**Real-time graph** (~full width x 250px canvas): Plots the dependent vs independent variable as students manipulate the apparatus. Curve/line builds in real-time.

**Data table** (DOM below graph): Records data points with columns for each variable. CSV export.

**Particle preview** (~120x120px canvas inset): Small animated particle view synced to current conditions.

---

## Tab 2: Ideal Gas Calculator

**Toggle**: Practice Mode / Free Calculator

**Practice Mode**:
- Generated scenario with given values and one unknown
- Student enters predicted answer
- "Check" button reveals worked solution with PV=nRT rearrangement
- Green/red feedback + score tracking
- Particle animation shows before/after conditions

**Free Calculator**:
- Input fields for P, V, n, T (any 3 known)
- Dropdown to select unknown variable
- "Solve" button shows result with step-by-step working
- Units selector (atm/kPa, L/mL, mol, K/°C)

---

## Tab 3: Real vs Ideal (HL)

**Interactive deviation graph** (~full width x 300px canvas):
- X-axis: Pressure, Y-axis: PV/nRT (compressibility factor Z)
- Ideal gas: horizontal line at Z = 1
- Real gas: curve that deviates, especially at high P and low T
- Sliders for temperature and gas selection
- Shaded regions showing where attractions dominate (Z < 1) vs repulsions dominate (Z > 1)

**Comparison table** (DOM):
- Multiple gases at same conditions
- Columns: Gas, Z value, % deviation, dominant effect
- Ranked by deviation magnitude
- Color-coded: green (close to ideal) to red (large deviation)

**Annotations**: Fajans-style cards explaining why each gas deviates (molecular size, IMF strength, Van der Waals a and b constants).

---

## Sidebar Palette

- **Gas selector**: Ideal Gas, Helium (He), Nitrogen (N₂), Carbon dioxide (CO₂), Water vapor (H₂O)
- **Reset** button
- **Teacher presets** (visible in teacher mode)

---

## Data

| Gas | Formula | a (L² atm mol⁻²) | b (L mol⁻¹) | Molar mass (g mol⁻¹) |
|-----|---------|-------------------|-------------|----------------------|
| Ideal | — | 0 | 0 | 28 |
| Helium | He | 0.0346 | 0.0238 | 4 |
| Nitrogen | N₂ | 1.370 | 0.0387 | 28 |
| Carbon dioxide | CO₂ | 3.658 | 0.0429 | 44 |
| Water vapor | H₂O | 5.537 | 0.0305 | 18 |

---

## Keyboard Shortcuts

H (HL), T (Teacher), 1/2/3 (tabs), R (reset), / (search), ↑↓ (navigate palette), E (export CSV), Space (play/pause)
