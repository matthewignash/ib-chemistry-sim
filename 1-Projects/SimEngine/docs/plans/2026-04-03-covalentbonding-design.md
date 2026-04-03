# Covalent Bonding — Design Document (Sim #22)

**Syllabus:** S2.3 — The Covalent Model
**File:** `SimEngine_CovalentBonding.html`
**Level:** SL + HL (Tab 2 is HL-only)
**Tabs:** 3

---

## Tab 1: Bond Explorer

**Atom selector**: Two dropdowns to pick atom pair (e.g., C + O), plus bond order selector (single/double/triple where available).

**Bond visualization canvas** (~full width x 300px): Two atoms drawn as circles (sized by atomic radius), electron density cloud between them, dipole arrow showing polarity direction, bond order lines (single/double/triple).

**Property cards** (DOM below canvas): Bond order, bond length (pm), bond energy (kJ/mol), electronegativity difference, polarity classification (nonpolar covalent / polar covalent / ionic character).

**Trend graph** (~full width x 250px): Bar or scatter chart showing the selected bond in context of a series. Series options: by bond order (C-C / C=C / C≡C), by electronegativity (C-H, C-C, C-N, C-O, C-F), by period (F-F, Cl-Cl, Br-Br, I-I).

---

## Tab 2: Orbital Overlap & Hybridization (HL)

**Molecule palette**: Grouped by hybridization type (sp³, sp², sp).

**Orbital diagram canvas** (~full width x 350px): Shows central atom with hybridized orbital lobes. Sigma bonds as head-on overlap, pi bonds as lateral p-orbital overlap. Lone pairs shown as non-bonding lobes.

**Info cards**: Hybridization type, bond angles, sigma/pi count, molecular geometry.

**Toggle buttons**: Show/hide sigma bonds, pi bonds, lone pairs independently.

---

## Tab 3: Bond Comparison

**Side-by-side canvas** (~full width x 300px): Compare 2-4 bonds with visual bars (length, energy) and atom representations.

**Comparison table** (DOM): Columns for bond, order, length, energy, EN diff, polarity. Sortable by clicking headers.

**Add/remove**: Click bonds from palette to add (max 4), clear all button.

---

## Data

23 bonds with order, length (pm), energy (kJ/mol), EN difference.
7 molecules with hybridization, geometry, sigma/pi counts, lone pairs.

---

## Keyboard Shortcuts

H (HL), T (Teacher), 1/2/3 (tabs), R (reset), / (search), ↑↓ (navigate palette), E (export CSV)
