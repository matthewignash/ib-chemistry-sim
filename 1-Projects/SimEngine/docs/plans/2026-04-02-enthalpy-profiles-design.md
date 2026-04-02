# Enthalpy & Energy Profiles Explorer — Design Document

> Date: 2026-04-02
> IB Topic: R1.1 — Measuring Enthalpy Changes
> Status: Approved

---

## Context

Simulation #10 for SimEngine. Reactivity 1 (thermodynamics/energetics) has zero simulations — the biggest remaining syllabus gap. The Enthalpy & Energy Profiles Explorer covers R1.1 (Measuring Enthalpy Changes), a core topic tested heavily on Paper 1 and Paper 2. Students need to interpret energy profile diagrams, understand activation energy, distinguish exothermic/endothermic reactions, and (at HL) calculate enthalpy changes from bond enthalpies. Both teacher-led demos and student self-guided exploration on Schoology.

---

## Architecture Decisions

- **Rendering:** Canvas 2D for energy profile diagram (bezier curves + arrows); HTML divs for bond enthalpy bars (accessibility + hover tooltips)
- **Data:** Embedded JS array of 20 reactions inline (maintains single-file HTML for Schoology)
- **Modules used:** SimEngine.State, SimEngine.Controls
- **No new core modules needed**
- **Single-file HTML** for Schoology embedding
- **No innerHTML** — equations use Unicode subscripts (₂, ₃, ₄ etc.), consistent with IMF sim

---

## Layout

```
┌───────────────────────────────────────────────────────────────┐
│  Header: "Enthalpy & Energy Profiles"       [R1.1] [SL/HL]   │
│          IB Chemistry — R1.1 Enthalpy Changes       [T/S]     │
├───────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────────────────────────────────────────┐ │
│ │ Reaction │ │  Energy Profile Canvas (680×420)             │ │
│ │ Palette  │ │                                              │ │
│ │ 240px    │ │     ───╮        ← Ea arrow                  │ │
│ │          │ │        │╲                                    │ │
│ │ [Search] │ │  R ────╯  ╲──── P    ← ΔH arrow            │ │
│ │          │ │                                              │ │
│ │ ▸ Combus │ │  [catalyst overlay in dashed line]           │ │
│ │ ▸ Neutra │ │                                              │ │
│ │ ▸ Decomp │ │  Reaction progress →                        │ │
│ │ ▸ Dissol │ │                                              │ │
│ │ ▸ Synth  │ ├──────────────────────────────────────────────┤ │
│ │ ▸ HL rxn │ │ Reaction Info Panel                         │ │
│ │          │ │ Equation · ΔH · Ea · Type badge             │ │
│ │ ──────── │ │ [Catalyst toggle] [Annotations toggle]      │ │
│ │ Presets▼ │ ├──────────────────────────────────────────────┤ │
│ └──────────┘ │ HL: Bond Enthalpy Calculator                │ │
│              │ Bonds Broken  ████████  +2648 kJ            │ │
│              │ Bonds Formed  ██████████ −3252 kJ           │ │
│              │ ΔH = −604 kJ/mol (approximate)              │ │
│              │ Itemized bond table                          │ │
│              └──────────────────────────────────────────────┘ │
│                                                               │
│  kbd: [H] HL  [T] Teacher  [C] Catalyst  [A] Annotations     │
│       [↑↓] Prev/Next  [R] Reset  [/] Search                  │
└───────────────────────────────────────────────────────────────┘
```

---

## Core Features

### Reaction Palette (Left Sidebar)
- Scrollable list organized by category (same pattern as IMF palette)
- Search/filter bar at top
- Click reaction to display its energy profile
- Active reaction highlighted in palette
- Sticky positioning (same as IMF)

### Energy Profile Canvas
- Canvas 2D with bezier curve rendering
- Two cubic bezier segments joined at transition state peak
- Reactant and product plateau lines extending to canvas edges
- Color coded: red curve for exothermic, blue for endothermic
- Animated curve draw on reaction select (~1.5s ease-in-out)
- Labels fade in after curve completes

### Annotations (toggleable)
- ΔH arrow: double-headed vertical between reactant/product levels
- Ea arrow: single-headed from reactant level to transition state
- Reactant/Product/Transition state labels
- Arrow values with units

### Catalyst Overlay (toggleable)
- Dashed green line showing lowered transition state
- Same reactant/product levels (ΔH unchanged)
- Catalyzed Ea ≈ 55% of uncatalyzed (visually clear difference)
- Legend: solid = without catalyst, dashed = with catalyst

### Reaction Info Panel
- Balanced equation with Unicode subscripts
- ΔH and Ea values with color coding
- Type badge: red "EXOTHERMIC" or blue "ENDOTHERMIC"
- Catalyst and annotation toggles

---

## Reaction Library (20 reactions)

### Combustion (SL)
| ID | Equation | ΔH (kJ/mol) | Ea (kJ/mol) |
|----|----------|-------------|-------------|
| ch4_comb | CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l) | −890 | +218 |
| c2h5oh_comb | C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l) | −1367 | +190 |
| c3h8_comb | C₃H₈(g) + 5O₂(g) → 3CO₂(g) + 4H₂O(g) | −2219 | +210 |
| h2_comb | 2H₂(g) + O₂(g) → 2H₂O(l) | −572 | +210 |
| c_comb | C(s) + O₂(g) → CO₂(g) | −394 | +200 |

### Neutralization (SL)
| ID | Equation | ΔH | Ea |
|----|----------|----|----|
| hcl_naoh | HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l) | −57.1 | +25 |
| h2so4_naoh | H₂SO₄(aq) + 2NaOH(aq) → Na₂SO₄(aq) + 2H₂O(l) | −114.2 | +25 |
| ch3cooh_naoh | CH₃COOH(aq) + NaOH(aq) → CH₃COONa(aq) + H₂O(l) | −55.2 | +30 |

### Decomposition (SL)
| ID | Equation | ΔH | Ea |
|----|----------|----|----|
| caco3_decomp | CaCO₃(s) → CaO(s) + CO₂(g) | +178 | +250 |
| h2o2_decomp | 2H₂O₂(aq) → 2H₂O(l) + O₂(g) | −196 | +75 |
| n2o4_decomp | N₂O₄(g) → 2NO₂(g) | +57.2 | +55 |
| nh4cl_decomp | NH₄Cl(s) → NH₃(g) + HCl(g) | +176 | +200 |

### Dissolution (SL)
| ID | Equation | ΔH | Ea |
|----|----------|----|----|
| nacl_dissolve | NaCl(s) → Na⁺(aq) + Cl⁻(aq) | +3.9 | +20 |
| naoh_dissolve | NaOH(s) → Na⁺(aq) + OH⁻(aq) | −44.5 | +15 |

### Synthesis (SL)
| ID | Equation | ΔH | Ea |
|----|----------|----|----|
| haber | N₂(g) + 3H₂(g) → 2NH₃(g) | −92 | +230 |
| hcl_form | H₂(g) + Cl₂(g) → 2HCl(g) | −185 | +180 |
| h2o_form | 2H₂(g) + O₂(g) → 2H₂O(g) | −484 | +210 |

### HL Reactions (bond enthalpy focus)
| ID | Equation | ΔH | Ea |
|----|----------|----|----|
| ch4_chlor | CH₄(g) + Cl₂(g) → CH₃Cl(g) + HCl(g) | −104 | +160 |
| c2h4_hbr | C₂H₄(g) + HBr(g) → C₂H₅Br(g) | −54 | +140 |
| n2_o2 | N₂(g) + O₂(g) → 2NO(g) | +181 | +310 |

---

## HL Panel: Bond Enthalpy Calculator

- Visible only with `body.hl-active` class
- Only shown for reactions with bond enthalpy data (covalent gaseous reactions)
- For ionic/aqueous reactions: shows note "Bond enthalpy calculations apply to gaseous covalent reactions only"

### Visual Components
- **Stacked bars** (HTML divs): Bonds Broken bar and Bonds Formed bar, color-segmented by bond type
- **Net ΔH bar**: shows calculated difference
- **Itemized table**: Two columns (Broken | Formed), each bond type with count × energy = subtotal
- **Discrepancy note**: "Bond enthalpies are average values — calculated ΔH is approximate" (explicit IB exam point)

### Bond Enthalpy Data (IB Data Booklet Section 11)
| Bond | kJ/mol | Bond | kJ/mol |
|------|--------|------|--------|
| C-H | 414 | O-H | 463 |
| C-C | 346 | O=O | 498 |
| C=C | 614 | H-H | 436 |
| C-O | 358 | N-H | 391 |
| C=O | 804 | N≡N | 945 |
| C-Cl | 324 | Cl-Cl | 242 |
| C-Br | 285 | H-Cl | 432 |
| N=O | 587 | H-Br | 366 |
| O-O | 142 | Br-Br | 193 |

---

## SL/HL Behavior

| Feature | SL | HL |
|---------|----|----|
| Reaction palette | 17 SL reactions | + 3 HL reactions |
| Energy profile diagram | Full | Same |
| Catalyst overlay | Available | Available |
| Annotations | Available | Available |
| Bond enthalpy calculator | Hidden | Visible for applicable reactions |
| HL presets | Hidden | Shown |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Toggle SL/HL |
| `T` | Toggle teacher/student |
| `C` | Toggle catalyst overlay |
| `A` | Toggle annotations |
| `↑`/`↓` | Previous/next reaction |
| `R` | Reset to default |
| `/` | Focus search |
| `Esc` | Deselect |

---

## Teacher Presets

| Preset | Reaction(s) | IB Concept |
|--------|-------------|------------|
| Exo vs Endo | CH₄ combustion, then CaCO₃ decomposition | Compare energy profile shapes |
| Catalyst Effect | H₂O₂ decomposition + catalyst ON | Same ΔH, lower Ea |
| Neutralization Series | HCl+NaOH, then CH₃COOH+NaOH | Strong vs weak acid ΔH |
| Haber Process | N₂+H₂→NH₃ + catalyst ON | Industrial catalysis context |
| HL: Bond Enthalpy Calc | H₂+Cl₂→2HCl (auto-enables HL) | Simple 2-bond calculation |

---

## Animation

### Curve Draw (on reaction select)
- Bezier curve draws left-to-right over ~1.5s with easeInOutCubic
- Plateau lines appear first (fade in 200ms)
- Labels and arrows fade in after curve completes (300ms delay)
- Catalyst overlay draws after main curve if enabled (500ms delay)

### Transition Between Reactions
- Current curve fades out (300ms)
- New curve draws in

---

## Files

| File | Action |
|------|--------|
| `SimEngine_EnthalpyProfiles.html` | **Create** |
| `SimEngine_Core.js` | **No changes** |

---

## Verification

1. Select reactions from palette → energy profile updates with correct curve shape
2. Exothermic: products lower, red curve. Endothermic: products higher, blue curve
3. Toggle catalyst → dashed green overlay appears with lower Ea, same ΔH
4. Toggle annotations → arrows and labels show/hide
5. Curve animates smoothly on reaction change
6. HL toggle → bond enthalpy calculator appears for applicable reactions
7. Bond enthalpy bars show correct values from IB Data Booklet
8. Teacher presets load correct reactions
9. Keyboard shortcuts work
10. Search filters palette correctly
