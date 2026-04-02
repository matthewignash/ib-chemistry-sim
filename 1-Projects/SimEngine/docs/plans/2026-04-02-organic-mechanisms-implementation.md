# Organic Mechanisms Explorer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a step-through animated mechanism viewer with 6 IB HL mechanisms and 5-6 example reactions each, using Canvas for curly arrow animation and DOM for info panels.

**Architecture:** Single-file HTML (SimEngine_FunctionalGroups.html pattern). Canvas renders molecular structures and curly arrows with frame-based animation. Template system maps mechanism types to animation sequences with substitutable groups. DOM panels show step descriptions, energy profiles (small canvas), and mechanism summaries. All 30+ reactions derived from 6 mechanism templates.

**Tech Stack:** Vanilla JS, Canvas 2D, CSS Grid, no external deps.

---

### Task 1: Scaffold HTML/CSS

**Files:**
- Create: `SimEngine_OrganicMechanisms.html`

**What to build:**
- Copy CSS from SimEngine_FunctionalGroups.html (header, toggle, layout, cards, palette, keyboard hint)
- Header: "Organic Mechanisms Explorer", "R3.4 Reaction Mechanisms", HL badge (always visible, no SL/HL toggle needed — this is HL only), Teacher toggle
- Grid: 240px sidebar + 1fr main panel
- Sidebar: search input, palette list div, teacher presets dropdown
- Main panel: mechanism canvas card (680x420), step controls bar (back/step counter/next/play/reset), step description card, 2-column grid (energy profile canvas 300x200 + mechanism summary card)
- Keyboard hint bar
- roundRect polyfill
- Empty IIFE scaffold with init()

**Step controls HTML structure (built in JS via createElement):**
- Container div with flex layout
- Back button, step label span, Next button, Play button, Reset button
- CSS: `.step-controls { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 0.5rem; }`

**Additional CSS needed:**
- `.step-controls button` — same style as `.slots-actions button` from other sims
- `.step-counter` — monospace font, min-width for stable layout
- `.step-desc` — italicized step description text
- `.summary-grid` — 2-column grid for mechanism summary
- `.summary-label` / `.summary-value` — property display
- `.energy-canvas` — small canvas styling
- `.arrow-legend` — curly arrow color legend

**Commit:** "feat(sim12): scaffold HTML/CSS for Organic Mechanisms Explorer"

---

### Task 2: Mechanism Data + Template System

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html` (JS section)

**What to build:**
Define the 6 mechanism templates and all reaction substitution maps.

**Template structure per mechanism:**
```js
var MECHANISMS = {
  sn2: {
    name: 'SN2', category: 'substitution',
    rateExpression: 'Rate = k[RX][Nu\u207B]',
    stereochemistry: 'Inversion (Walden inversion)',
    conditions: 'Strong nucleophile, polar aprotic solvent',
    substratePref: 'Primary > Methyl (tertiary does not occur)',
    energyProfile: { type: 'one-step', Ea: 85 },
    steps: [
      { id: 'reactants', description: '...', /* template positions */ },
      { id: 'transition', description: '...', /* arrow data */ },
      { id: 'products', description: '...' }
    ],
    reactions: [
      { id: 'sn2_1', equation: '...', nucleophile: 'OH\u207B', substrate: 'CH\u2083CH\u2082', leavingGroup: 'Br', product: 'CH\u2083CH\u2082OH' },
      // ... 4 more
    ]
  },
  // ... 5 more mechanisms
};
```

**Each mechanism's steps array defines the animation template:**
- Atom positions as normalized 0-1 coords with role labels (nuc, sub, lg, etc.)
- Bond list with breaking/forming flags
- Curly arrow definitions (from role → to role, bezier control points)
- Partial charge annotations
- Step description text (can reference {nucleophile}, {leavingGroup} placeholders)

**All 6 mechanisms with reactions:**
1. SN2: 5 reactions (OH-, CN-, NH3, H2O, CH3O-)
2. SN1: 5 reactions (H2O variants, benzylic, CN-)
3. E2: 5 reactions (OH-, OEt-, various substrates, Zaitsev)
4. E1: 5 reactions (various tert-halides, dehydration)
5. Electrophilic Addition: 6 reactions (HBr, Br2, H2O, HCl, Cl2)
6. Free Radical: 5 reactions (CH4+Cl2, CH4+Br2, C2H6+Cl2, C3H8+Cl2, CH4+F2)

**Categories array:**
```js
var CATEGORIES = [
  { key: 'substitution', label: 'Nucleophilic Substitution' },
  { key: 'elimination', label: 'Elimination' },
  { key: 'addition', label: 'Electrophilic Addition' },
  { key: 'radical', label: 'Free Radical' }
];
```

**Teacher presets:**
```js
var PRESETS = [
  { name: 'SN1 vs SN2', mech: 'sn2', rxnIdx: 0 },
  { name: 'E1 vs E2', mech: 'e2', rxnIdx: 0 },
  { name: 'Sub vs Elim', mech: 'sn2', rxnIdx: 0 },
  { name: 'Addition Tour', mech: 'electrophilic_addition', rxnIdx: 0 },
  { name: 'Free Radical Steps', mech: 'free_radical', rxnIdx: 0 }
];
```

**Commit:** "feat(sim12): add mechanism data and template system"

---

### Task 3: Palette + Selection Logic

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
- `buildPalette()` — category headers + mechanism buttons (same pattern as FunctionalGroups)
- Reaction selector: when a mechanism is selected, show a `<select>` dropdown in the info area to choose among the 5-6 example reactions
- `filterPalette(query)` — search filter
- `selectMechanism(mechId)` — sets active mechanism, resets to reaction 0 step 0
- `selectReaction(rxnIdx)` — changes reaction within current mechanism, resets to step 0
- `updatePaletteActive()` — highlight active mechanism button
- State variables: `_selectedMech`, `_selectedRxnIdx`, `_currentStep`
- `buildPresets()` — teacher preset dropdown

**Commit:** "feat(sim12): add mechanism palette and selection logic"

---

### Task 4: Canvas Structure Renderer

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
Core Canvas rendering for a single mechanism frame (no animation yet).

- `setupCanvas()` — main 680x420 canvas with HiDPI, aria-label, role=img
- `drawFrame(mech, rxn, stepIdx)` — renders one frame:
  - Resolve template positions → actual atom labels using reaction substitution map
  - Draw bonds (solid lines, with breaking bonds dashed, forming bonds colored)
  - Draw atom labels in pills (same pattern as FunctionalGroups)
  - Draw partial charges (delta+/delta-) as small text above atoms
  - Draw lone pairs as dot pairs
- Element colors: same as FunctionalGroups (C=#1E293B, O=#DC2626, N=#7C3AED, halogen=#059669)
- Background: light gray #FAFBFC

**Key rendering details:**
- Bond styles: `solid` (normal), `dashed` (breaking), `forming` (colored, thicker)
- Wedge bonds for stereochemistry: filled triangle (coming toward viewer), dashed lines (going away)
- Atom labels in white-background pills with colored text

**Commit:** "feat(sim12): add Canvas structure renderer"

---

### Task 5: Curly Arrow Renderer

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
- `drawCurlyArrow(ctx, fromX, fromY, toX, toY, controlPoints, type)`:
  - `type: 'full'` — double-barbed arrowhead (two-electron movement), blue color
  - `type: 'fishhook'` — single-barbed arrowhead (one-electron, free radical), red color
  - Bezier curve from start to end through control points
  - Arrowhead drawn as a filled triangle at the curve endpoint tangent
  - Line width: 2.5px, smooth cap/join
- `drawArrowAnimated(ctx, ..., progress)` — draws only up to `progress` (0-1) along the bezier, for the step animation
- Arrow bezier utility: `getBezierPoint(t, p0, p1, p2, p3)` and `getBezierTangent(t, ...)`

**Commit:** "feat(sim12): add curly arrow renderer with animation support"

---

### Task 6: Step Animation System

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
- Step controls: Back, Next, Play, Reset buttons (built via createElement)
- Step counter label
- `goToStep(stepIdx)` — sets current step, triggers transition animation
- `nextStep()` / `prevStep()` — navigate with bounds checking
- `togglePlay()` — auto-advance every 2 seconds
- Animation between frames:
  1. Curly arrows draw progressively (0→1 over 500ms)
  2. Breaking bonds fade opacity (1→0 over 300ms, starts at 200ms)
  3. Forming bonds fade in (0→1 over 300ms, starts at 400ms)
  4. Atoms interpolate position (lerp over 500ms)
  5. New partial charges fade in
- `animateTransition(fromStep, toStep)` — requestAnimationFrame loop managing the above
- Stop animation when transition complete, set `_animFrame = null`

**Commit:** "feat(sim12): add step animation system with play/pause"

---

### Task 7: Step Description Panel

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
- `updateStepDescription(mech, rxn, stepIdx)`:
  - Clear and rebuild the step description card
  - Resolve placeholder text: replace `{nucleophile}`, `{leavingGroup}`, `{substrate}`, `{product}` in description templates with actual reaction values
  - Style: italic description text with key terms in bold
- Description text examples:
  - SN2 step 1: "The {nucleophile} nucleophile attacks the electrophilic carbon from the opposite side (180deg) to the {leavingGroup} leaving group. Bond formation and bond breaking occur simultaneously in a single concerted step."
  - Free radical initiation: "UV light causes homolytic fission of the Cl-Cl bond, producing two chlorine radicals (Cl*). Each atom takes one electron from the shared pair."

**Commit:** "feat(sim12): add step description panel with template text"

---

### Task 8: Energy Profile Panel

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
- `setupEnergyCanvas()` — small 300x200 canvas with HiDPI
- `drawEnergyProfile(mech, currentStep)`:
  - Reuse bezier curve pattern from Enthalpy Profiles sim (scaled down)
  - One-step (SN2, E2): single hump, reactants→TS→products
  - Two-step (SN1, E1, electrophilic addition): two humps with intermediate valley
  - Three-phase (free radical): initiation energy → flat propagation chain
  - Colored dot on the curve at the position corresponding to `currentStep`
  - Labels: "Reactants", "TS1", "Int." (if applicable), "TS2", "Products"
- Dot position maps step index to fraction along the curve (e.g., step 0 = 0.0, step 1 = 0.5, step 2 = 1.0 for a 3-step mechanism)

**Commit:** "feat(sim12): add energy profile panel with step-tracking dot"

---

### Task 9: Mechanism Summary Panel

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
- `updateSummaryPanel(mech, rxn)`:
  - Type badge (same pattern as Enthalpy sim type badges)
  - Rate expression in monospace
  - Conditions: reagent, solvent, temperature
  - Stereochemistry outcome with brief explanation
  - Substrate preference
  - Current reaction equation
- Reaction selector dropdown within this panel: allows switching between the 5-6 example reactions

**Commit:** "feat(sim12): add mechanism summary panel with reaction selector"

---

### Task 10: Keyboard Shortcuts + Header Toggles

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
- Keyboard handler (same pattern as other sims):
  - Left/Right: prev/next step
  - Space: play/pause
  - T: teacher mode toggle
  - Up/Down: prev/next mechanism
  - 1-6: select reaction index within current mechanism
  - R: reset to step 0
  - /: focus search
  - Esc: clear search
- Header toggles: Teacher toggle only (no HL toggle — this is HL-only)
- Store `_tInput` at module level for keyboard sync

**Commit:** "feat(sim12): add keyboard shortcuts and header toggles"

---

### Task 11: Complete All Reaction Data

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to build:**
Fill in complete atom positions, bond data, curly arrow paths, and step descriptions for all 31 reactions across 6 mechanisms. This is the largest task — primarily data entry.

**Approach:** Start with one reaction per mechanism (already done in Task 2), then duplicate and adjust the substitution maps for the remaining 4-5 reactions per mechanism. The template system means only the labels/groups change — atom positions and arrow paths stay the same.

**Commit:** "feat(sim12): complete all 31 reaction data entries"

---

### Task 12: Code Review + Polish

**Files:**
- Modify: `SimEngine_OrganicMechanisms.html`

**What to do:**
- Run code-reviewer agent
- Fix all flagged issues
- Verify: no innerHTML, canvas sizing, roundRect polyfill, toggle sync, animation cleanup
- Test all 6 mechanisms with all reactions
- Test keyboard shortcuts
- Test step animation play/pause/reset
- Screenshot verification at 1280x1400 viewport

**Commit:** "fix(sim12): address code review findings"

---

## Verification Checklist
1. All 6 mechanisms selectable from palette
2. 5-6 reactions per mechanism switchable via dropdown
3. Curly arrows animate correctly for each mechanism type
4. Step controls (back/next/play/reset) work
5. Energy profile shows correct shape per mechanism type
6. Step-tracking dot moves with step changes
7. Step descriptions resolve placeholders correctly
8. Mechanism summary shows correct data
9. Keyboard shortcuts work and sync with UI
10. No innerHTML anywhere
11. Canvas sizing correct (explicit px, maxWidth 100%)
12. roundRect polyfill present
