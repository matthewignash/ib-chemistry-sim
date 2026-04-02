# IMF Comparison Tool — Design Document

> Date: 2026-04-02
> IB Topic: S2.4 — From Molecules to Materials (Intermolecular Forces)
> Status: Approved

---

## Context

Simulation #9 for SimEngine. Covers S2.4 intermolecular forces — a high-confusion topic where students struggle to connect molecular structure → polarity → IMF type → physical properties. Designed for both teacher-led demos and student self-guided exploration on Schoology.

---

## Architecture Decisions

- **Rendering:** Canvas 2D with 3D projection for ball-and-stick models (adapted from VSEPR sim)
- **Data:** Embedded JS (~55 molecules with 3D coordinates and properties)
- **Modules used:** SimEngine.State, SimEngine.Controls
- **No new core modules needed**
- **Single-file HTML** for Schoology embedding

---

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Header: "IMF Comparison Tool"              [SL/HL] [T/S]   │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────────────────────────────┐  │
│  │  Molecule     │  │  Comparison Slots (up to 5)          │  │
│  │  Palette      │  │  3D models + IMF badges per slot     │  │
│  │  (categories) │  │                                      │  │
│  │  [Search]     │  │  Property Comparison Bars below      │  │
│  │  [Presets]    │  │  (BP, MP, Mr + HL: dipole, polar.)   │  │
│  └──────────────┘  └──────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  HL Panel: Mr vs BP Scatter + IMF Strength Breakdown   │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Core Features

### Molecule Palette
- Scrollable sidebar organized by category with search
- SL: noble gases, halogens, hydrides, alkanes, alcohols, simple inorganic
- HL additions: amines, carboxylic acids, esters, ethers, aldehydes/ketones, halogenoalkanes

### Comparison Slots (up to 5)
- Click molecule from palette to add to next open slot
- Each slot: rotatable 3D ball-and-stick model, δ+/δ- annotations, IMF badges
- IMF badges: London (gray), Dipole-dipole (blue), H-bonding (teal)
- Slots scroll horizontally when >3 filled

### 3D Ball-and-Stick Models
- Canvas 2D projection of 3D coordinates (adapted from VSEPR sim)
- CPK element coloring, glossy atom rendering
- Mouse/touch drag to rotate each molecule independently
- Pre-computed 3D coordinates generated at startup via geometry helpers

### Property Comparison Bars
- Horizontal bar chart comparing: BP, MP, Mr (SL) + dipole, polarizability (HL)
- Color-coded to match slot position

### IMF Display
- Direct display (no quiz mode)
- Logic: All → London; Polar → + dipole-dipole; N-H/O-H/F-H → + H-bonding

---

## Molecule Data (~55 molecules)

### SL Set (~30)
Noble gases (He, Ne, Ar, Kr, Xe), Halogens (F₂, Cl₂, Br₂, I₂), Hydrides (SiH₄, NH₃, PH₃, H₂O, H₂S, H₂Se, H₂Te, HF, HCl, HBr, HI), Alkanes (CH₄–C₄H₁₀), Alcohols (CH₃OH–C₄H₉OH), Simple inorganic (CO₂, SO₂, N₂, O₂, H₂)

### HL Additions (~25)
Carboxylic acids, amines, esters, ethers, aldehydes/ketones, halogenoalkanes (CH₃Cl–CCl₄)

---

## HL Panel

- **Mr vs BP Scatter:** All molecules plotted, colored by dominant IMF type. Reveals H₂O/HF/NH₃ outliers.
- **IMF Strength Breakdown:** Stacked bars showing relative London/dipole/H-bond contributions.

---

## SL/HL Behavior

| Feature | SL | HL |
|---------|----|----|
| Molecule palette | ~30 core | + ~25 organic |
| Property bars | BP, MP, Mr | + dipole, polarizability |
| Mr vs BP scatter | Hidden | Visible |
| IMF breakdown | Hidden | Visible |
| Functional group labels | Hidden | Visible |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Toggle SL/HL |
| `T` | Toggle teacher/student |
| `1`–`5` | Select comparison slot |
| `Delete` | Remove molecule from selected slot |
| `Esc` | Deselect |
| `R` | Reset (clear all) |
| `/` | Focus search |

---

## Teacher Presets

- Group 16 Hydrides (H₂O, H₂S, H₂Se, H₂Te)
- Alkane vs Alcohol (C₂H₆ vs C₂H₅OH)
- Halogen Series (F₂, Cl₂, Br₂, I₂)
- Hydrogen Bonding (H₂O, NH₃, HF)
- Alkane Chain Length (CH₄–C₄H₁₀)

---

## Files

| File | Action |
|------|--------|
| `SimEngine_IMFComparison.html` | **Create** |
| `SimEngine_Core.js` | **No changes** |

---

## Verification

1. Click molecules → appear in comparison slots with 3D models
2. Rotate 3D models → smooth interaction
3. IMF badges: H₂O = all 3, CH₄ = London only
4. Property bars: H₂O bp >> H₂S bp
5. Fill 5 slots → horizontal scroll works
6. HL toggle → scatter plot + extra molecules
7. Teacher presets load correct molecules
8. Keyboard shortcuts work
