# Functional Group Explorer — Design Document

**Simulation #11** | IB Chemistry S3.2 Functional Groups | 2026-04-02

## Overview

Interactive gallery of 16 functional groups with Canvas-drawn 2D structural diagrams, property info cards, and HL spectroscopy data. Filterable sidebar palette, teacher presets, keyboard shortcuts. Single-file HTML for Schoology embedding.

## Layout

- **Grid:** 240px sticky sidebar + 1fr main panel
- **Sidebar:** Search bar, category-grouped buttons, teacher presets dropdown
- **Main panel:** Canvas structure viewer (680x420) + Group info card + HL spectroscopy panel
- **Header:** Navy gradient, title, S3.2 badge, HL + Teacher toggles

## Functional Groups

### SL (12)

| Category | Group | General Formula | IUPAC Suffix | Example |
|----------|-------|----------------|-------------|---------|
| Hydrocarbon | Alkane | C-C, C-H | -ane | Propane |
| Hydrocarbon | Alkene | C=C | -ene | Propene |
| Hydrocarbon | Alkyne | C=C (triple) | -yne | Propyne |
| Hydrocarbon | Arene | Benzene ring | -benzene | Methylbenzene |
| O-containing | Alcohol | R-OH | -ol | Ethanol |
| O-containing | Aldehyde | R-CHO | -al | Ethanal |
| O-containing | Ketone | R-CO-R' | -one | Propanone |
| O-containing | Carboxylic acid | R-COOH | -oic acid | Ethanoic acid |
| N-containing | Amine | R-NH2 | -amine | Ethylamine |
| Halogen | Halogenoalkane | R-X | halo- | Chloroethane |
| O-containing | Ether | R-O-R' | -oxy- | Methoxyethane |
| O-containing | Carboxylate ion | R-COO- | -oate | Sodium ethanoate |

### HL (4)

| Group | General Formula | IUPAC Suffix | Example |
|-------|----------------|-------------|---------|
| Ester | R-COO-R' | -oate | Ethyl ethanoate |
| Amide | R-CONH2 | -amide | Ethanamide |
| Nitrile | R-CN (triple) | -nitrile | Ethanenitrile |
| Acyl chloride | R-COCl | -oyl chloride | Ethanoyl chloride |

### Categories
Hydrocarbons, Oxygen-containing, Nitrogen-containing, Halogen-containing, HL Groups

## Data Model

Per functional group:
- `id`, `name`, `generalFormula`, `category`, `hlOnly`
- `suffix` / `prefix` (IUPAC naming)
- `properties`: polarity, H-bonding, solubility, BP trend, state, reaction types
- `exampleMolecules`: 2-3 molecules with name + condensed formula
- `structure`: atoms `{ element, x, y, label }` + bonds `{ from, to, order }`
- `highlightAtoms`: indices of functional group atoms
- `spectroscopy` (HL): IR range, MS fragmentation, NMR shift

## Canvas Structure Rendering

- Atoms in 0-1 normalized coords, scaled to canvas with padding
- Bond types: single (1 line), double (2 parallel), triple (3), aromatic (alternating dashed)
- Functional group highlighted with translucent colored rectangle
- Category colors: Hydrocarbons=blue, O-containing=red, N-containing=purple, Halogens=green
- Heteroatoms always labeled; C implicit at junctions; lone pairs as dot pairs
- 200ms fade transition on group switch
- HiDPI via devicePixelRatio, roundRect polyfill

## Info Card

- Name + IUPAC suffix/prefix badge
- General formula in monospace
- Properties grid (2x3): polarity, H-bonding, solubility, BP trend, state, reactions
- Example molecules (clickable to swap canvas)

## HL Spectroscopy Panel

Hidden in SL mode. Shows per group:
- IR: wavenumber range + bond type
- MS: characteristic m/z losses
- NMR: chemical shift range

## Teacher Presets

1. SL Tour — cycles all 12 SL groups
2. Oxygen Family — alcohol, aldehyde, ketone, carboxylic acid
3. Naming Practice — shows structure, hides name until click
4. HL Extensions — all 4 HL groups
5. Spectroscopy Signatures — HL mode, cycles with IR/NMR

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| H | HL toggle |
| T | Teacher mode |
| Up/Down | Prev/Next group |
| 1-3 | Switch example molecule |
| R | Reset |
| / | Search |
| Esc | Clear/Deselect |
| S | Toggle spectroscopy (HL) |

## Constraints

- Single-file HTML, no external deps except SimEngine_Core.js
- NO innerHTML — all DOM via createElement/textContent/appendChild
- Unicode subscripts for formulas
- Canvas: explicit px dimensions, maxWidth: 100%
- roundRect polyfill for older browsers
- body.hl-active class pattern for SL/HL
