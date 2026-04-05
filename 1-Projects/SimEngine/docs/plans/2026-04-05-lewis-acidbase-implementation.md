# Lewis Acids/Bases & Complex Ions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 3-tab HL simulation covering Lewis acid-base theory (R3.4.7) and complex ion formation (R3.4.8).

**Architecture:** Single-file HTML/CSS/JS following existing sim conventions. Canvas 2D for Lewis structure diagrams and complex ion geometry visualizations. Inline data (~100 lines) for reactions and presets. No Core.js dependency.

**Tech Stack:** HTML5 Canvas, vanilla JS IIFE pattern, CSS custom properties matching the SimEngine design system.

---

### Task 1: HTML Shell + CSS + Tab Navigation

**Files:**
- Create: `1-Projects/SimEngine/SimEngine_LewisAcidBase.html`

Create the complete HTML shell with:
- Header: "Lewis Acids, Bases & Complex Ions" / "IB Chemistry — R3.4 Electron-Pair Sharing (HL)"
- Badge: "R3.4" with HL purple
- SL/HL toggle (HL default on, SL shows "This is an HL-only topic" message)
- Teacher/Student toggle
- 3-tab bar: "Lewis Explorer", "Complex Ion Builder", "Practice"
- Grid layout: palette panel (left) + tab content (right)
- Footer with keyboard hints
- All CSS from the existing design system (copy root variables and component styles from SimEngine_NucleophilicAddition.html)
- `<script>` block with IIFE skeleton, tab switching logic, HL/teacher toggle handlers, keyboard shortcuts (H, T, 1-3, R, Esc)

**Verify:** Open in browser, tabs switch, HL/teacher toggles work, responsive layout stacks on narrow screens.

### Task 2: Lewis Acid-Base Data + Tab 1 Palette

**Files:**
- Modify: `SimEngine_LewisAcidBase.html`

Add inline data inside the IIFE:

```js
var LEWIS_ACIDS = [
  { id: 'H+', formula: 'H⁺', name: 'Hydrogen ion', type: 'cation', reason: 'Empty 1s orbital', electrons: 0 },
  { id: 'BF3', formula: 'BF₃', name: 'Boron trifluoride', type: 'molecule', reason: 'Empty p orbital on B (6 e⁻)', electrons: 6 },
  { id: 'AlCl3', formula: 'AlCl₃', name: 'Aluminium chloride', type: 'molecule', reason: 'Empty p orbital on Al', electrons: 6 },
  { id: 'Ag+', formula: 'Ag⁺', name: 'Silver ion', type: 'cation', reason: 'Empty d/s orbitals', electrons: 46 },
  { id: 'Fe3+', formula: 'Fe³⁺', name: 'Iron(III) ion', type: 'cation', reason: 'Empty d orbitals', electrons: 23 },
  { id: 'Cu2+', formula: 'Cu²⁺', name: 'Copper(II) ion', type: 'cation', reason: 'Empty d orbitals', electrons: 27 },
  { id: 'Al3+', formula: 'Al³⁺', name: 'Aluminium ion', type: 'cation', reason: 'Empty s/p orbitals', electrons: 10 },
  { id: 'SO3', formula: 'SO₃', name: 'Sulfur trioxide', type: 'molecule', reason: 'S can expand octet', electrons: 24 },
  { id: 'CO2', formula: 'CO₂', name: 'Carbon dioxide', type: 'molecule', reason: 'δ⁺ C accepts e⁻ pair', electrons: 16 }
];

var LEWIS_BASES = [
  { id: 'NH3', formula: 'NH₃', name: 'Ammonia', type: 'molecule', lonePairs: 1, donorAtom: 'N' },
  { id: 'H2O', formula: 'H₂O', name: 'Water', type: 'molecule', lonePairs: 2, donorAtom: 'O' },
  { id: 'OH-', formula: 'OH⁻', name: 'Hydroxide ion', type: 'anion', lonePairs: 3, donorAtom: 'O' },
  { id: 'CN-', formula: 'CN⁻', name: 'Cyanide ion', type: 'anion', lonePairs: 1, donorAtom: 'C' },
  { id: 'Cl-', formula: 'Cl⁻', name: 'Chloride ion', type: 'anion', lonePairs: 4, donorAtom: 'Cl' },
  { id: 'F-', formula: 'F⁻', name: 'Fluoride ion', type: 'anion', lonePairs: 4, donorAtom: 'F' },
  { id: 'C2H5OH', formula: 'C₂H₅OH', name: 'Ethanol', type: 'molecule', lonePairs: 2, donorAtom: 'O' }
];

var REACTIONS = [
  { acid: 'BF3', base: 'NH3', product: 'F₃B←NH₃', equation: 'BF₃ + NH₃ → F₃B-NH₃', bronsted: false,
    note: 'Lewis-only reaction. BF₃ has empty p orbital on B; NH₃ donates its lone pair.' },
  { acid: 'H+', base: 'NH3', product: 'NH₄⁺', equation: 'H⁺ + NH₃ → NH₄⁺', bronsted: true,
    note: 'Both Lewis AND Brønsted-Lowry. H⁺ accepts e⁻ pair (Lewis acid) and is donated to NH₃ (proton transfer).' },
  { acid: 'H+', base: 'OH-', product: 'H₂O', equation: 'H⁺ + OH⁻ → H₂O', bronsted: true,
    note: 'Both Lewis AND Brønsted-Lowry. Neutralization reaction.' },
  { acid: 'AlCl3', base: 'Cl-', product: 'AlCl₄⁻', equation: 'AlCl₃ + Cl⁻ → AlCl₄⁻', bronsted: false,
    note: 'Lewis-only. Al expands coordination from 3 to 4. Friedel-Crafts catalyst.' },
  { acid: 'Ag+', base: 'NH3', product: '[Ag(NH₃)₂]⁺', equation: 'Ag⁺ + 2NH₃ → [Ag(NH₃)₂]⁺', bronsted: false,
    note: 'Lewis-only. Forms Tollens\' reagent. Ag⁺ accepts two lone pairs from NH₃.' },
  { acid: 'Cu2+', base: 'NH3', product: '[Cu(NH₃)₄(H₂O)₂]²⁺', equation: 'Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺', bronsted: false,
    note: 'Lewis-only. Ligand exchange: NH₃ replaces H₂O. Solution turns deep blue.' },
  { acid: 'Fe3+', base: 'CN-', product: '[Fe(CN)₆]³⁻', equation: 'Fe³⁺ + 6CN⁻ → [Fe(CN)₆]³⁻', bronsted: false,
    note: 'Lewis-only. Forms hexacyanoferrate(III) — used in Prussian blue test.' },
  { acid: 'CO2', base: 'OH-', product: 'HCO₃⁻', equation: 'CO₂ + OH⁻ → HCO₃⁻', bronsted: false,
    note: 'Lewis-only. CO₂ accepts e⁻ pair at electrophilic C. Important in ocean chemistry.' },
  { acid: 'SO3', base: 'H2O', product: 'H₂SO₄', equation: 'SO₃ + H₂O → H₂SO₄', bronsted: false,
    note: 'Lewis-only at initial step. SO₃ accepts e⁻ pair from O in H₂O. Contact process final step.' },
  { acid: 'H+', base: 'H2O', product: 'H₃O⁺', equation: 'H⁺ + H₂O → H₃O⁺', bronsted: true,
    note: 'Both Lewis AND Brønsted-Lowry. Shows hydronium ion formation.' },
  { acid: 'Cu2+', base: 'H2O', product: '[Cu(H₂O)₆]²⁺', equation: 'Cu²⁺ + 6H₂O → [Cu(H₂O)₆]²⁺', bronsted: false,
    note: 'Lewis-only. Aqua complex formation. Pale blue color in solution.' },
  { acid: 'Fe3+', base: 'OH-', product: 'Fe(OH)₃', equation: 'Fe³⁺ + 3OH⁻ → Fe(OH)₃', bronsted: false,
    note: 'Lewis-only. Forms rusty-brown precipitate. Common qualitative test.' }
];
```

Build Tab 1 palette:
- Left panel: categorized list of acids (Cations / Molecules) and bases (Anions / Molecules)
- Click an acid to select it, click a base to select it
- When both selected, show the matching REACTION data in the info section
- Search filter for palette

**Verify:** Tab 1 palette renders, clicking acid + base shows reaction info.

### Task 3: Tab 1 Canvas — Lewis Structure Visualization

**Files:**
- Modify: `SimEngine_LewisAcidBase.html`

Implement `renderLewisReaction(ctx, acid, base, reaction)`:
- Draw the acid species on the left with electron dot structure
- Draw the base species on the right with lone pair dots
- Draw curved arrow from base lone pair → acid empty orbital
- Draw the product below with coordinate bond highlighted in teal
- Label: "Lewis acid (e⁻ pair acceptor)" above acid, "Lewis base (e⁻ pair donor)" above base
- Brønsted-Lowry comparison: if `reaction.bronsted`, show green "Also Brønsted-Lowry" badge; if not, show amber "Lewis only" badge

Draw functions needed:
- `drawSpecies(ctx, x, y, formula, lonePairPositions)` — renders formula with dot notation
- `drawCurvedArrow(ctx, x1, y1, x2, y2)` — donation arrow
- `drawBadge(ctx, x, y, text, color)` — Brønsted-Lowry vs Lewis-only indicator

**Verify:** Select BF₃ + NH₃, see Lewis structures with donation arrow. Select H⁺ + OH⁻, see "Also Brønsted-Lowry" badge.

### Task 4: Complex Ion Data + Tab 2 Palette

**Files:**
- Modify: `SimEngine_LewisAcidBase.html`

Add complex ion data:

```js
var METALS = [
  { id: 'Cu2+', formula: 'Cu²⁺', name: 'Copper(II)', charge: 2, color: '#3B82F6', commonCN: [4,6] },
  { id: 'Fe2+', formula: 'Fe²⁺', name: 'Iron(II)', charge: 2, color: '#059669', commonCN: [6] },
  { id: 'Fe3+', formula: 'Fe³⁺', name: 'Iron(III)', charge: 3, color: '#D97706', commonCN: [6] },
  { id: 'Cr3+', formula: 'Cr³⁺', name: 'Chromium(III)', charge: 3, color: '#7C3AED', commonCN: [6] },
  { id: 'Co2+', formula: 'Co²⁺', name: 'Cobalt(II)', charge: 2, color: '#EC4899', commonCN: [4,6] },
  { id: 'Ni2+', formula: 'Ni²⁺', name: 'Nickel(II)', charge: 2, color: '#059669', commonCN: [4,6] },
  { id: 'Ag+', formula: 'Ag⁺', name: 'Silver(I)', charge: 1, color: '#94A3B8', commonCN: [2] },
  { id: 'Zn2+', formula: 'Zn²⁺', name: 'Zinc(II)', charge: 2, color: '#94A3B8', commonCN: [4,6] }
];

var LIGANDS = [
  { id: 'H2O', formula: 'H₂O', name: 'Water', charge: 0, denticity: 1, abbrev: 'aqua' },
  { id: 'NH3', formula: 'NH₃', name: 'Ammonia', charge: 0, denticity: 1, abbrev: 'ammine' },
  { id: 'Cl-', formula: 'Cl⁻', name: 'Chloride', charge: -1, denticity: 1, abbrev: 'chlorido' },
  { id: 'CN-', formula: 'CN⁻', name: 'Cyanide', charge: -1, denticity: 1, abbrev: 'cyanido' },
  { id: 'OH-', formula: 'OH⁻', name: 'Hydroxide', charge: -1, denticity: 1, abbrev: 'hydroxido' },
  { id: 'SCN-', formula: 'SCN⁻', name: 'Thiocyanate', charge: -1, denticity: 1, abbrev: 'thiocyanato' },
  { id: 'en', formula: 'en', name: 'Ethylenediamine', charge: 0, denticity: 2, abbrev: 'en' },
  { id: 'C2O42-', formula: 'C₂O₄²⁻', name: 'Oxalate', charge: -2, denticity: 2, abbrev: 'oxalato' }
];

var COMPLEX_PRESETS = [
  { metal: 'Cu2+', ligands: [{id:'H2O',count:6}], cn: 6, geometry: 'octahedral', color: '#ADD8E6', formula: '[Cu(H₂O)₆]²⁺', name: 'Hexaaquacopper(II)' },
  { metal: 'Cu2+', ligands: [{id:'NH3',count:4},{id:'H2O',count:2}], cn: 6, geometry: 'octahedral', color: '#1E3A8A', formula: '[Cu(NH₃)₄(H₂O)₂]²⁺', name: 'Tetraamminediaquacopper(II)' },
  { metal: 'Cu2+', ligands: [{id:'Cl-',count:4}], cn: 4, geometry: 'tetrahedral', color: '#84CC16', formula: '[CuCl₄]²⁻', name: 'Tetrachloridocuprate(II)' },
  { metal: 'Fe3+', ligands: [{id:'H2O',count:6}], cn: 6, geometry: 'octahedral', color: '#FBBF24', formula: '[Fe(H₂O)₆]³⁺', name: 'Hexaaquairon(III)' },
  { metal: 'Fe3+', ligands: [{id:'SCN-',count:1},{id:'H2O',count:5}], cn: 6, geometry: 'octahedral', color: '#991B1B', formula: '[Fe(SCN)(H₂O)₅]²⁺', name: 'Thiocyanatopentaaquairon(III)' },
  { metal: 'Ag+', ligands: [{id:'NH3',count:2}], cn: 2, geometry: 'linear', color: null, formula: '[Ag(NH₃)₂]⁺', name: 'Diamminesilver(I)' },
  { metal: 'Cr3+', ligands: [{id:'H2O',count:6}], cn: 6, geometry: 'octahedral', color: '#7C3AED', formula: '[Cr(H₂O)₆]³⁺', name: 'Hexaaquachromium(III)' },
  { metal: 'Ni2+', ligands: [{id:'NH3',count:6}], cn: 6, geometry: 'octahedral', color: '#6366F1', formula: '[Ni(NH₃)₆]²⁺', name: 'Hexaamminenickel(II)' },
  { metal: 'Fe3+', ligands: [{id:'CN-',count:6}], cn: 6, geometry: 'octahedral', color: '#DC2626', formula: '[Fe(CN)₆]³⁻', name: 'Hexacyanidoferrate(III)' },
  { metal: 'Co2+', ligands: [{id:'Cl-',count:4}], cn: 4, geometry: 'tetrahedral', color: '#2563EB', formula: '[CoCl₄]²⁻', name: 'Tetrachloridocobaltate(II)' }
];
```

Build Tab 2 UI:
- Top: metal ion selector (colored circle buttons)
- Left palette: ligand buttons with denticity labels
- Preset quick-load dropdown (teacher mode shows all, student mode shows common ones)
- Info card area (right/below canvas)

**Verify:** Tab 2 shows metal selector, ligand palette, and preset dropdown.

### Task 5: Tab 2 Canvas — Complex Ion Geometry Visualization

**Files:**
- Modify: `SimEngine_LewisAcidBase.html`

Implement `renderComplex(ctx, metal, ligands, geometry)`:
- Draw metal ion at center as a large colored circle
- Draw ligands around metal in the correct geometry:
  - **Linear (cn=2):** left and right
  - **Tetrahedral (cn=4):** corners of projected tetrahedron
  - **Square planar (cn=4):** four cardinal directions
  - **Octahedral (cn=6):** four equatorial + two axial (shown with perspective)
- Draw coordinate bond arrows (→) from ligand to metal
- Show formula below: `[Cu(NH₃)₄(H₂O)₂]²⁺`
- Color swatch showing complex color
- Coordination number and geometry name labels

Implement interactive building:
- `_selectedMetal`, `_attachedLigands` state
- Click ligand to add it (up to max coordination number)
- Click attached ligand to remove it
- Geometry auto-updates based on ligand count + metal preferences
- Formula auto-calculates from metal charge + ligand charges

**Verify:** Select Cu²⁺, click NH₃ 4 times and H₂O 2 times → octahedral complex drawn, formula shows [Cu(NH₃)₄(H₂O)₂]²⁺.

### Task 6: Tab 3 — Practice Problems

**Files:**
- Modify: `SimEngine_LewisAcidBase.html`

Two practice modes:

**Mode A — Identify Lewis acid/base:**
- Show a reaction equation from REACTIONS array
- Two dropdown selectors: "Lewis acid is ___" / "Lewis base is ___"
- Check button with immediate feedback (green/red + explanation)

**Mode B — Predict complex:**
- Show metal + ligands, ask for coordination number and geometry
- Multiple choice for geometry (linear/tetrahedral/square planar/octahedral)
- Number input for coordination number
- Check button with feedback

- Score tracker: correct/total, reset button
- Random problem selection, no repeats until all used

**Verify:** Both modes generate problems, check answers correctly, score updates.

### Task 7: Polish + Accessibility + Commit

**Files:**
- Modify: `SimEngine_LewisAcidBase.html`

- Add `aria-label` attributes to canvases and interactive elements
- Add skip-to-content link
- Test all keyboard shortcuts (H, T, 1-3, R, Esc, N for next problem)
- Test responsive layout at mobile/tablet/desktop widths
- Verify teacher mode shows extra info (preset section, answer hints)
- Update `SimEngine_Index.html` to include the new sim in the navigation

**Verify:**
- Open via http server, all 3 tabs work, no console errors
- Keyboard navigation works
- Mobile layout stacks correctly
- Teacher mode reveals extra content

### Task 8: Commit

```bash
git checkout -b feat/lewis-acidbase
git add 1-Projects/SimEngine/SimEngine_LewisAcidBase.html
git add 1-Projects/SimEngine/SimEngine_Index.html
git add 1-Projects/SimEngine/docs/plans/2026-04-05-lewis-acidbase-design.md
git add 1-Projects/SimEngine/docs/plans/2026-04-05-lewis-acidbase-implementation.md
git commit -m "feat(sim): add Lewis Acids/Bases & Complex Ions simulation (R3.4.7-R3.4.8)"
```

---

## Verification Checklist

1. Tab 1: Select BF₃ + NH₃ → see Lewis-only reaction with donation arrow
2. Tab 1: Select H⁺ + OH⁻ → see "Also Brønsted-Lowry" indicator
3. Tab 2: Build [Cu(H₂O)₆]²⁺ from scratch → octahedral, pale blue
4. Tab 2: Load [Ag(NH₃)₂]⁺ preset → linear geometry
5. Tab 3: Answer identification problem correctly → green feedback + score
6. Tab 3: Answer complex prediction → correct geometry check
7. HL toggle off → shows "HL only" message
8. Teacher toggle → shows presets section
9. Keyboard shortcuts all work
10. No console errors on any tab

## Parallelization

Tasks 1-3 are sequential (foundation → data → canvas).
Tasks 4-5 are sequential (data → canvas).
Task 6 depends on data from Tasks 2 and 4.
Task 7 is final polish.
