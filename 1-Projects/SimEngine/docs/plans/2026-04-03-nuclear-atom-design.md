# The Nuclear Atom — Design Document (Sim #15)

> **IB Topic:** S1.2 The Nuclear Atom
> **File:** `SimEngine_NuclearAtom.html`
> **Date:** 2026-04-03

---

## Purpose

Give students an interactive workspace to explore the three pillars of S1.2: isotopes and relative atomic mass, mass spectrometry interpretation, and emission spectra with the Bohr model. These concepts are foundational for IB Chemistry and heavily tested across Papers 1 and 2.

---

## Architecture

**Single-file HTML** following SimEngine conventions: IIFE closure, CSS variables from design system, 240px sidebar + 1fr grid, canvas-based visuals, SL/HL toggle, teacher mode.

**Four tabbed views** below the header:
1. **Isotope Explorer** (SL) — default
2. **Mass Spec: Analyze** (SL)
3. **Mass Spec: Build** (SL)
4. **Emission Spectra** (SL, with HL extensions)

Tabs share a common data layer (isotope data, element info) but have independent state. Each tab has its own canvas(es) and sidebar palette.

---

## Tab 1: Isotope Explorer

### Sidebar
Element palette grouped by category:
- **Alkali Metals** — Li, Na, K
- **Alkaline Earth** — Mg, Ca
- **Nonmetals** — H, C, N, O, S
- **Halogens** — Cl, Br
- **Noble Gases** — He, Ne, Ar, Kr
- **Transition Metals** — Fe, Cu, Zn, Ag, Zr
- **Other** — B, Si

Search filter at top.

### Main Panel
1. **Mini periodic table** (canvas ~400×200px) — clickable cells colored by category, highlights selected element. Subset of ~25 elements with isotope data.
2. **Isotope cards** — nuclear notation for each isotope:
   - Mass number (superscript), atomic number (subscript), symbol
   - Natural abundance (%)
3. **Abundance bar chart** (canvas) — horizontal bars showing % natural abundance per isotope
4. **RAM Calculator**:
   - Weighted average formula with step-by-step calculation
   - Editable abundance inputs for "what-if" mode
   - Comparison to IB Data Booklet value
5. **HL: Radioactive isotopes card** — half-life and decay type for selected radioisotopes (e.g., ¹⁴C, ⁴⁰K)

---

## Tab 2: Mass Spec: Analyze

### Sidebar
Compound palette grouped by type:
- **Elements** — Cl₂, Br₂, Ne, Zr
- **Simple Organic** — CH₄, C₂H₅OH, CH₃COOH
- **HL: Fragmentation** — C₃H₈, C₄H₁₀

### Main Panel
1. **Spectrum canvas** (full width × 300px): m/z vs relative intensity bar chart
   - Peaks initially unlabeled
   - X-axis: m/z, Y-axis: relative intensity (0–100%)
2. **Click-to-identify**: student clicks a peak, dropdown appears with options:
   - M⁺ (molecular ion), base peak, M+1, M+2, fragment
   - Green check or red X feedback per peak
   - Running score display
3. **Info panel** (after identification or teacher reveal):
   - Molecular formula, molar mass
   - Fragment explanations for each peak
   - For isotope patterns: M, M+2, M+4 pattern explanation
4. **HL: Fragmentation analysis** — bond-breaking diagrams for organic compounds

---

## Tab 3: Mass Spec: Build

### Sidebar
Same compound palette as Tab 2 with difficulty indicators:
- **Easy** — CH₄, Ne
- **Medium** — Cl₂, Br₂, C₂H₅OH
- **Hard (HL)** — C₃H₈, C₄H₁₀

### Main Panel
1. **Challenge prompt**: molecular formula + molar mass displayed
2. **Build canvas**: student clicks to place peaks at m/z values, drags height for relative intensity
3. **Delete/remove** peaks via right-click or delete button
4. **Checklist** (updates in real-time):
   - Molecular ion (M⁺) placed?
   - Base peak at 100%?
   - Key fragments present?
5. **"Check Answer" button**: overlays student spectrum with correct answer
   - Student peaks in teal, correct peaks in green
   - Scoring: ±1 m/z tolerance, ±10% intensity tolerance
   - Feedback card with detailed comparison
6. **Teacher mode**: pre-filled checklist, step-through expected peaks

---

## Tab 4: Emission Spectra

### Sidebar
Element palette:
- **Primary** — H (default, full Bohr model)
- **Comparison** — He, Li, Na, Ca, Ne

### Main Panel — Split Layout
1. **Bohr model** (left canvas ~300×300px):
   - Concentric circles for energy levels n=1 to n=6
   - Energy values labeled: Eₙ = −13.6/n² eV
   - Clickable transitions: click starting level then ending level
   - Animated electron jump with photon emission (colored circle)
   - ΔE and λ calculation displayed
   - Series labels: Lyman (→n=1), Balmer (→n=2), Paschen (→n=3)
2. **Emission spectrum** (right canvas):
   - Dark background with bright spectral lines
   - Lines accumulate as student clicks transitions
   - Wavelength labels on each line
   - Color matches visible spectrum (UV/IR shown as dashed)
   - "Show All" button to display complete spectrum
   - Series brackets below spectrum
3. **Spectrum comparison** (below canvases):
   - Reference emission spectra for H, He, Li, Na, Ca, Ne
   - Unknown spectrum challenge: identify the element
   - Dropdown guess with green/red feedback

### HL Extensions
- Convergence limit zoom: magnified view of series limit
- IE from convergence frequency calculation
- Successive ionization energy bar chart with shell-break annotations

---

## Shared Components

### SL/HL Toggle
- `body.hl-active` class toggle
- HL fragmentation problems in Tabs 2/3 hidden unless HL on
- Radioactive isotopes card in Tab 1 hidden unless HL on
- Convergence/IE cards in Tab 4 hidden unless HL on

### Teacher Mode
- Presets dropdown per tab (curated sequences)
- Answer reveal toggle
- Tab 2: auto-label all peaks
- Tab 3: pre-filled spectrum
- Tab 4: show all transitions

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| H | Toggle HL |
| T | Toggle Teacher mode |
| 1, 2, 3, 4 | Switch tabs |
| R | Reset current problem |
| / | Focus search |
| ↑↓ | Navigate palette |
| Enter | Submit/check answer |

### Data Layer (shared across tabs)
- Isotope data (~25 elements): mass numbers, exact masses, natural abundances
- Mass spec data (~10 compounds): m/z peaks with relative intensity and fragment identities
- Hydrogen emission lines: Lyman, Balmer, Paschen series wavelengths
- Energy levels: Eₙ = −13.6/n² eV (n=1–6)
- Reference emission spectra: H, He, Li, Na, Ca, Ne
- HL: Successive ionization energies for ~6 elements

### Data Export
CSV of student work (problem ID, inputs, answers, score, time taken) — consistent with existing SimEngine data export pattern.

---

## Visual Design

Follows SimEngine design system exactly:
- Navy header gradient, teal accents
- Category colors for periodic table cells (alkali=warm yellow, noble gas=indigo, etc.)
- Purple (#7C3AED) for HL content
- Inter font (body), Fira Code (numerical values)
- Cards with white background, subtle border, 12px radius
- Dark background for emission spectrum canvas (to show bright lines)

---

## Responsive Behavior

- Desktop (>900px): sidebar + main grid
- Mobile (<900px): single column, sidebar becomes horizontal scrolling category pills, tabs become scrollable
- Canvas diagrams resize with container (maintain aspect ratio)

---

## Success Criteria

1. Student can explore isotopes and calculate RAM from abundance data
2. Student can identify peaks in a mass spectrum with immediate feedback
3. Student can build a mass spectrum from scratch and check against correct answer
4. Student can click Bohr model transitions and see corresponding spectral lines
5. Student can identify unknown elements from emission spectra
6. All data matches IB Data Booklet values
7. Teacher can use presets to guide classroom activities
8. Follows all SimEngine conventions (single-file, IIFE, CSS variables, keyboard shortcuts)
