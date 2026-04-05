# Lewis Acids/Bases & Complex Ions — Design Document

> **Date:** 2026-04-05
> **File:** `SimEngine_LewisAcidBase.html`
> **IB Topic:** R3.4.7–R3.4.8 (HL only)
> **Architecture:** Single-file HTML/CSS/JS, Canvas 2D rendering, standalone (no Core.js dependency)

---

## Problem

R3.4.7 (Lewis acids/bases) and R3.4.8 (complex ions) are the only R3.3/R3.4 subtopics without a dedicated simulation. These are HL-only topics being taught April 14–16. Students need interactive tools to:
- Understand electron-pair donation/acceptance beyond Bronsted-Lowry
- Visualize complex ion formation with coordinate bonds
- Connect Lewis theory to the organic mechanisms they've already studied

---

## Design

### Tab 1: Lewis Acid-Base Explorer

**Left panel — Categorized species palette:**
- **Lewis Acids:** H+, Ag+, Fe3+, Cu2+, Al3+, BF3, AlCl3, SO3, CO2
- **Lewis Bases:** OH-, CN-, Cl-, F-, NH3, H2O, C2H5OH
- Student selects one acid + one base to form a reaction

**Right panel — Canvas visualization:**
- Both species drawn with electron dot structures
- Curved arrow showing lone pair donation from base → acid
- Product (adduct) with coordinate bond highlighted in distinct color
- Labels: "Lewis acid (e- pair acceptor)" / "Lewis base (e- pair donor)"

**Info section below canvas:**
- Balanced equation
- Whether reaction is ALSO Bronsted-Lowry (e.g., H+ + OH- → H2O) or Lewis-ONLY (e.g., BF3 + NH3 → F3B-NH3)
- Key teaching point for each reaction

**Bronsted-Lowry comparison toggle:**
- Highlights which Lewis reactions are a superset of Bronsted-Lowry
- Visual Venn diagram: "All Bronsted-Lowry reactions are Lewis reactions, but not all Lewis reactions are Bronsted-Lowry"

### Tab 2: Complex Ion Builder

**Metal ion selector (top):**
- d-block metals: Cu2+ (blue), Fe2+ (green), Fe3+ (yellow), Cr3+ (green), Co2+ (pink), Ni2+ (green), Ag+ (colorless), Zn2+ (colorless)
- Shown as colored circles with charge labels

**Ligand palette (left):**
- Monodentate: H2O, NH3, Cl-, CN-, OH-, SCN-
- Bidentate: en (ethylenediamine), C2O4^2- (oxalate)
- Labels indicate mono/bidentate

**Central canvas:**
- Metal ion at center
- Click/drag ligands to attach — coordinate bonds drawn with arrow notation (→)
- Geometry updates as ligands are added:
  - 2 ligands → linear
  - 4 ligands → tetrahedral or square planar (based on metal)
  - 6 ligands → octahedral
- Live formula display: `[Cu(NH₃)₄(H₂O)₂]²⁺`
- Color swatch showing approximate complex color

**Preset quick-load buttons:**
- [Cu(H2O)6]2+ (pale blue, octahedral)
- [Cu(NH3)4(H2O)2]2+ (deep blue, octahedral)
- [CuCl4]2- (yellow-green, tetrahedral)
- [Fe(H2O)6]3+ (yellow, octahedral)
- [Fe(SCN)(H2O)5]2+ (blood red, octahedral)
- [Ag(NH3)2]+ (colorless, linear)
- [Cr(H2O)6]3+ (violet, octahedral)
- [Ni(NH3)6]2+ (blue-violet, octahedral)

**Info card (right):**
- Coordination number
- Geometry name and description
- Whether this is an IB-expected example
- Ligand exchange explanation (where applicable)

### Tab 3: Practice Problems

**Mode A — Identify Lewis acid/base:**
- Given a reaction equation, student identifies the Lewis acid and Lewis base
- Covers both organic (BF3 + NH3) and inorganic (metal + ligand) examples
- Immediate feedback with explanation

**Mode B — Predict complex ion:**
- Given metal ion + ligands, predict:
  - Complex formula with correct brackets and charge
  - Coordination number
  - Geometry
- Multiple choice format for formula, typed input for coordination number

**Score tracker:** Running correct/total count, reset button

---

## Data (inline, ~100 lines)

**Lewis acid-base reactions (~15 pairs):**
```
{ acid: 'BF3', base: 'NH3', product: 'F3B-NH3', bronstedToo: false }
{ acid: 'H+', base: 'OH-', product: 'H2O', bronstedToo: true }
{ acid: 'Ag+', base: 'NH3', product: '[Ag(NH3)2]+', bronstedToo: false }
...
```

**Complex ion presets (~10):**
```
{ metal: 'Cu2+', ligands: [{type:'H2O', count:6}], cn: 6, geometry: 'octahedral', color: '#ADD8E6', formula: '[Cu(H₂O)₆]²⁺' }
{ metal: 'Ag+', ligands: [{type:'NH3', count:2}], cn: 2, geometry: 'linear', color: null, formula: '[Ag(NH₃)₂]⁺' }
...
```

**Metal ion data (~8):**
```
{ id: 'Cu2+', name: 'Copper(II)', charge: 2, dElectrons: 9, color: '#3B82F6', commonCN: [4,6] }
...
```

---

## UI Conventions

- Dark navy header with "R3.4" badge (HL only)
- SL/HL toggle (HL default on, SL hides entire sim with message)
- Teacher/Student mode toggle
- Keyboard shortcuts: H (HL), T (Teacher), 1-3 (tabs), R (reset)
- Canvas with `devicePixelRatio` scaling
- Responsive: palette stacks below canvas on narrow screens

---

## Scope Exclusions

- No 3D rendering (Canvas 2D projections only)
- No crystal field theory or d-orbital splitting (beyond IB scope)
- No stability constants (Kstab) — IB 2025 doesn't require quantitative treatment
- No spectrochemical series
