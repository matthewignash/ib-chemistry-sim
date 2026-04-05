# Periodic Trends Explorer — Design Document

> Date: 2026-04-02
> IB Topic: S3.1 — The Periodic Table: Classification of Elements
> Status: Approved

---

## Context

We have 7 working simulations covering gas laws, kinetics, equilibrium, acid-base, electrochemistry, collision theory, and VSEPR. The Periodic Trends Explorer fills a critical gap — it's one of the most frequently referenced tools in IB Chemistry, used across multiple topics (S1.3 electron configs, S2.2 bonding polarity, S3.1 periodic trends). Both teacher-led demos and student self-guided exploration on Schoology.

---

## Architecture Decisions

- **Rendering:** Canvas-drawn periodic table (matches engine's canvas-first philosophy)
- **Data:** Embedded JS array inline (maintains single-file HTML pattern for Schoology)
- **Modules used:** SimEngine.State, SimEngine.Graph, SimEngine.Controls
- **No new core modules needed** — all rendering is simulation-specific

---

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Header: "Periodic Trends Explorer"     [SL/HL] [T/S]   │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐  ┌──────────────┐  │
│  │  Canvas: Periodic Table          │  │  Controls     │  │
│  │  (heatmap-colored cells)         │  │  Property ▼   │  │
│  │  Click element → highlight       │  │  Period ▼     │  │
│  │  Legend gradient bar below       │  │  Group ▼      │  │
│  └─────────────────────────────────┘  │  Block ▼      │  │
│                                       │               │  │
│  ┌─────────────────────────────────┐  │  Element Info │  │
│  │  Trend Graph                    │  │  (clicked el) │  │
│  │  Property vs Atomic Number      │  └──────────────┘  │
│  │  Filtered in teal, rest gray    │                    │
│  │  Period boundaries as dashes    │                    │
│  └─────────────────────────────────┘                    │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  HL Panel: Successive IEs (log scale) + Ionic Radii ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

---

## Properties

### SL Properties
| Property | Unit | Range | Notes |
|----------|------|-------|-------|
| Electronegativity | Pauling | 0.7–4.0 | Noble gases excluded |
| Atomic radius | pm | 25–260 | Empirical values |
| 1st ionization energy | kJ/mol | 376–2372 | All elements |
| Melting point | K | 14–3695 | |
| Boiling point | K | 4–5869 | |

### HL Additions (hidden in SL mode)
| Property | Unit | Notes |
|----------|------|-------|
| Electron affinity | kJ/mol | Convention: negative = exothermic |
| Successive IEs | kJ/mol | Elements 1–36, plotted on log scale |
| Ionic radius | pm | Common ions only |
| Density | g/cm³ | |
| Metallic character | 1–10 scale | Qualitative, derived from EN + IE |

---

## Periodic Table Canvas

- Standard 18-column layout with lanthanides/actinides below
- Each cell: ~40×36px, displays symbol + atomic number
- **Heatmap gradient:** teal (#0D9488, low) → amber (#D97706, high)
- Elements with no data for selected property: light gray (#E2E8F0)
- **Hover:** Tooltip with element name + property value
- **Click:** Highlights element on table AND graph, populates Element Info card
- **Legend:** Horizontal gradient bar below table showing value range

---

## Trend Graph

- Built with SimEngine.Graph module
- X-axis: Atomic number (1–118 or filtered range)
- Y-axis: Selected property
- **Filtered elements:** Connected line + dots in teal (#0D9488)
- **Non-filtered elements:** Small gray dots for context
- **Period boundaries:** Vertical dashed lines with period labels
- **Hover crosshair:** Shows element symbol + exact value
- **Clicked element:** Highlighted with larger dot + label

---

## Filter Controls

- **Property dropdown:** Select which property to visualize (heatmap + graph update together)
- **Period filter:** All / Period 1 / Period 2 / Period 3 / Period 4 / Period 5 / Period 6 / Period 7
- **Group filter:** All / Group 1 / Group 2 / ... / Group 18
- **Block filter:** All / s-block / p-block / d-block / f-block
- Filters combine: e.g., Period 4 + d-block = transition metals of Period 4

---

## Element Info Card

When an element is clicked:
- Symbol (large), name, atomic number, atomic mass
- Category badge (alkali metal, halogen, noble gas, transition metal, etc.)
- Electron configuration (full + noble gas core)
- All property values in a list
- HL: Show oxidation states, ionic radius

---

## HL Panel

### Successive IE Graph
- Appears when HL is toggled on AND an element is selected
- X-axis: IE number (1, 2, 3, ...)
- Y-axis: log₁₀(IE) in kJ/mol
- Data for elements 1–36
- Students identify large jumps (shell breaks) to deduce electron structure
- Annotations showing shell boundaries

### Ionic Radius Comparison
- Bar chart: atomic radius vs ionic radius for selected element's common ion(s)
- Cation shown smaller, anion shown larger than parent atom

---

## SL/HL Behavior

| Feature | SL | HL |
|---------|----|----|
| Property dropdown | EN, radius, IE₁, mp, bp | + EA, ionic radius, density, metallic char |
| Trend graph | Same for all | Same for all |
| Element info card | Basic properties | + oxidation states, ionic radius |
| Successive IE panel | Hidden | Visible when element selected |
| Ionic radius comparison | Hidden | Visible when element selected |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Toggle SL/HL |
| `T` | Toggle teacher/student mode |
| `1`–`5` | Quick-select SL property (1=EN, 2=radius, 3=IE₁, 4=mp, 5=bp) |
| `6`–`9` | Quick-select HL property (6=EA, 7=ionic radius, 8=density, 9=metallic char) |
| Arrow keys | Navigate elements on periodic table |
| `R` | Reset to defaults |
| `Esc` | Deselect element |

---

## Data

- All 118 elements, embedded as JS array
- ~12 numeric properties per element
- Successive IE data for elements 1–36
- Sourced from IUPAC/NIST standard values matching IB data booklet where applicable
- Estimated inline size: ~20KB

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `SimEngine_PeriodicTrends.html` | **Create** — single-file simulation |
| `SimEngine_Core.js` | **No changes** — using existing State, Graph, Controls |

---

## Verification

1. Open in browser via Python HTTP server (port 8765)
2. Select each property → confirm heatmap updates correctly
3. Click elements → confirm info card + graph highlight
4. Apply filters (period, group, block) → confirm graph shows correct subset
5. Toggle HL → confirm successive IE panel appears, HL properties in dropdown
6. Keyboard shortcuts all work
7. Hover tooltip shows correct values
8. Cross-check IE₁ values against IB data booklet for Period 3 elements
