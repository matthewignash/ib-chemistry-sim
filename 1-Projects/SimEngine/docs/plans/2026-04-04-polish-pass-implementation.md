# Comprehensive Polish Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix IB content errors, add accessibility attributes, and normalize visual styling across all 36 SimEngine sims.

**Architecture:** Three independent waves applied sequentially. Wave 1 fixes data accuracy (5 files). Wave 2 adds ARIA/accessibility attributes (20+ files). Wave 3 normalizes CSS (36 files). Each wave is independently shippable.

**Tech Stack:** Single-file HTML/CSS/JS sims, no frameworks, no build tools. Verify via browser preview.

---

## Wave 1 — Content Accuracy

### Task 1: Fix Bond Enthalpies in ib_data_booklet.json

**Files:**
- Modify: `3-Resources/SimEngine/data/ib_data_booklet.json` (lines 28-32, 38)

**Step 1: Update bond enthalpy values**

Change these 5 values to match IB 2025 Data Booklet:

| Line | Bond | Old | New |
|------|------|-----|-----|
| 28 | C–O | 360 | 358 |
| 29 | C=O | 799 | 804 |
| 31 | C–Cl | 338 | 324 |
| 32 | C–Br | 276 | 285 |
| 38 | N≡N | 941 | 945 |

**Step 2: Verify** — Read the file and confirm all 5 values are correct.

---

### Task 2: Fix Bond Enthalpies in CovalentBonding.html

**Files:**
- Modify: `SimEngine_CovalentBonding.html` (lines 435, 436, 438, 443)

**Step 1: Update inline bond enthalpy values**

| Line | Bond | Old `energy:` | New `energy:` |
|------|------|---------------|---------------|
| 435 | C–O | 360 | 358 |
| 436 | C=O | 799 | 804 |
| 438 | C–Cl | 338 | 324 |
| 443 | N≡N | 941 | 945 |

Note: C–Br is not present in this file's BONDS array — no change needed.

**Step 2: Verify** — Preview the sim's Bond Data tab, confirm updated values display correctly.

---

### Task 3: Fix Bond Enthalpies in EnthalpyProfiles.html

**Files:**
- Modify: `SimEngine_EnthalpyProfiles.html` (lines 306, 307, 335, 349, 362)

**Step 1: Update BOND_ENERGIES object**

Line 306: Change `'C=O': 805` → `'C=O': 804`
Line 307: Change `'C-Br': 285` — this is already correct (285 matches IB), leave as-is.

Also check if N≡N, C–O, C–Cl appear in BOND_ENERGIES and fix if present.

**Step 2: Update reaction data that hardcodes C=O energy**

Lines 335, 349, 362: Change `energy: 805` → `energy: 804` in all three combustion reaction objects.

**Step 3: Verify** — Preview the sim, check that enthalpy calculations produce correct results with updated values.

---

### Task 4: Add 'use strict' to PeriodicTrends.html

**Files:**
- Modify: `SimEngine_PeriodicTrends.html` (line 472)

**Step 1: Add 'use strict' directive**

The IIFE at line 472 reads: `var PT_LAYOUT = (function() {`

Add `'use strict';` as the first line inside the IIFE:
```javascript
var PT_LAYOUT = (function() {
'use strict';
```

Also check for any other IIFE blocks in the file and add 'use strict' if missing.

**Step 2: Verify** — Preview the sim, confirm no console errors. The strict mode may surface previously-silent bugs.

---

### Task 5: Commit Wave 1

```bash
git add 3-Resources/SimEngine/data/ib_data_booklet.json SimEngine_CovalentBonding.html SimEngine_EnthalpyProfiles.html SimEngine_PeriodicTrends.html
git commit -m "fix: correct IB bond enthalpy values and add use strict to PeriodicTrends"
```

---

## Wave 2 — Accessibility

### Task 6: Add aria-labels to IAScaffold Inputs

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Label the preset select**

Line 191: Add `aria-label="Teacher preset selector"` to `<select id="presetSelect">`

**Step 2: Label variable definition inputs**

Add `aria-label` to each input in the variable definition table:
- `varIVName` → `aria-label="Independent variable name"`
- `varIVMeasure` → `aria-label="Independent variable measurement tool"`
- `varIVRange` → `aria-label="Independent variable range"`
- `varDVName` → `aria-label="Dependent variable name"`
- `varDVMeasure` → `aria-label="Dependent variable measurement tool"`
- `varDVRange` → `aria-label="Dependent variable range"`

**Step 3: Label all textarea elements**

Add descriptive `aria-label` to each `<textarea>` based on its purpose/placeholder text. Pattern: `aria-label="[Section name] input field"`.

**Step 4: Add tab roles**

On the tab bar container (~line 153): Add `role="tablist"`
On each `.tab-btn`: Add `role="tab"` and `aria-selected="false"` (JS will toggle to true for active tab)
On each `.tab-content`: Add `role="tabpanel"`

Update the tab-switching JS to set `aria-selected="true"` on the active tab and `"false"` on others.

**Step 5: Add aria-live region**

Find the feedback/score display area and add `aria-live="polite"` so screen readers announce changes.

**Step 6: Verify** — Preview, switch tabs, fill inputs. Confirm no console errors.

---

### Task 7: Add aria-labels to Electrochem + AcidBase Inputs

**Files:**
- Modify: `SimEngine_Electrochem.html`
- Modify: `SimEngine_AcidBase.html`

**Step 1: Electrochem selects and inputs**

| Element | aria-label |
|---------|------------|
| `halfCellA` (line 794) | `"Half-cell A selection"` |
| `halfCellB` (line 798) | `"Half-cell B selection"` |
| `electrolyteSelect` (line 810) | `"Electrolyte selection"` |
| `eCation` (line 815) | `"Cation selection"` |
| `eAnion` (line 819) | `"Anion selection"` |
| `eConc` (line 832) | `"Concentration selection"` |
| `eElectrode` (line 840) | `"Electrode material selection"` |
| `quizInput` (line 982) | `"Quiz answer input"` |
| `cellCanvas` (line 765) | `"Electrochemical cell diagram"` |

**Step 2: AcidBase selects and inputs**

| Element | aria-label |
|---------|------------|
| `presetSelect` (line 699) | `"Titration preset selection"` |
| `acidSelect` (line 705) | `"Acid selection"` |
| `acidConc` (line 709) | `"Acid concentration"` |
| `baseSelect` (line 716) | `"Base selection"` |
| `baseConc` (line 720) | `"Base concentration"` |
| `indicatorSelect` (line 727) | `"Indicator selection"` |
| `volSlider` (line 752) | `"Volume of base added slider"` |
| `hlDerivToggle` (line 932) | `"Show derivative curve toggle"` |
| Canvas at line 683 | `"Titration curve graph"` |
| Canvas at line 895 | `"pH indicator color chart"` |

**Step 3: Add aria-live to feedback regions in both files**

**Step 4: Verify** — Preview both sims, interact with controls, confirm no errors.

---

### Task 8: Add aria-labels to All Canvas Elements

**Files:** All SimEngine_*.html files with unlabeled canvas elements.

**Step 1: Add aria-label to each canvas**

Work through each file systematically. Use descriptive labels based on what the canvas displays:

| File | Canvas ID | aria-label |
|------|-----------|------------|
| **RateLaw** | `sim-canvas` | `"Reaction simulation"` |
| | `graph-conc-time` | `"Concentration vs time graph"` |
| | `analysis-plot-0` | `"Zero-order analysis plot"` |
| | `analysis-plot-1` | `"First-order analysis plot"` |
| | `analysis-plot-2` | `"Second-order analysis plot"` |
| | `graph-initial-rates` | `"Initial rates graph"` |
| | `graph-arrhenius` | `"Arrhenius plot"` |
| **CollisionTheory** | `sim-canvas` | `"Particle collision simulation"` |
| | `mb-canvas` | `"Maxwell-Boltzmann distribution"` |
| | `rate-canvas` | `"Reaction rate graph"` |
| | `conc-canvas` | `"Concentration graph"` |
| | `energy-canvas` | `"Energy profile diagram"` |
| **PeriodicTrends** | `ptCanvas` | `"Interactive periodic table"` |
| | `trendCanvas` | `"Periodic trend visualization"` |
| | `sieCanvas` | `"Successive ionization energies"` |
| | `ionicCanvas` | `"Ionic character comparison"` |
| **GasLaws** | all 4 | Descriptive labels per canvas purpose |
| **Equilibrium** | all 3 | Descriptive labels per canvas purpose |
| **OrganicMechanisms** | all 3 | Descriptive labels per canvas purpose |
| **TitrationLab** | all 3 | Descriptive labels per canvas purpose |
| **GravimetricLab** | all 3 | Descriptive labels per canvas purpose |
| **IMFComparison** | all 3 | Descriptive labels per canvas purpose |
| **EnergyFromFuels** | all 4 | Descriptive labels per canvas purpose |
| **CalorimetryLab** | all 2 | Descriptive labels per canvas purpose |
| **GraphTrainer** | all 2 | Descriptive labels per canvas purpose |

Also add `role="img"` to all canvas elements so screen readers treat them as images.

**Step 2: Verify** — Spot-check 5 files in preview, confirm canvas elements have labels in DevTools.

---

### Task 9: Add aria-live Regions to All Sims

**Files:** All SimEngine_*.html files

**Step 1: Identify feedback/score display elements**

In each sim, find the element that shows feedback after user interactions (score displays, correct/incorrect messages, step progress). Add `aria-live="polite"` to these elements.

Common patterns to look for:
- Elements with class `feedback`, `score`, `result`, `message`
- Elements updated by JS after quiz answers or interactions
- Step counters / progress indicators

**Step 2: Verify** — Spot-check 5 files.

---

### Task 10: Add Tab Roles to All Tab-Based Sims

**Files:** All SimEngine_*.html files that use `.tab-bar` / `.tab-btn` / `.tab-content` pattern

**Step 1: Add ARIA roles to tab HTML**

For each file with tabs:
- Tab bar container: Add `role="tablist"`
- Each tab button: Add `role="tab"`, `aria-selected="false"`
- Each tab panel: Add `role="tabpanel"`

**Step 2: Update tab-switching JS**

In each file's tab-switching handler, add logic to update `aria-selected`:
```javascript
// After switching active tab:
document.querySelectorAll('[role="tab"]').forEach(function(t) {
  t.setAttribute('aria-selected', t === activeTab ? 'true' : 'false');
});
```

**Step 3: Verify** — Test tab switching in 3 sims, confirm aria-selected toggles correctly.

---

### Task 11: Add Skip-to-Content Links

**Files:** All SimEngine_*.html files with tab navigation

**Step 1: Add skip link**

Add as first child of `<body>`:
```html
<a href="#main-content" class="skip-link">Skip to content</a>
```

Add to CSS:
```css
.skip-link{position:absolute;top:-40px;left:0;background:var(--navy);color:white;padding:8px 16px;z-index:1000;transition:top 0.2s;}
.skip-link:focus{top:0;}
```

Add `id="main-content"` to the main content container (usually the first `.tab-content` or main workspace).

**Step 2: Verify** — Tab into the page, confirm skip link appears on focus.

---

### Task 12: Label Remaining Unlabeled Inputs

**Files:** All remaining files with unlabeled `<input>`, `<select>`, `<textarea>` (Equilibrium, RateLaw, CollisionTheory, GasLaws, IMFComparison, EnergyFromFuels, CalorimetryLab, GraphTrainer, etc.)

**Step 1: Add aria-label to each unlabeled form control**

Read each file, identify unlabeled controls, add descriptive `aria-label` attributes.

**Step 2: Verify** — Spot-check 5 files.

---

### Task 13: Commit Wave 2

```bash
git add SimEngine_*.html
git commit -m "feat: add ARIA labels, live regions, tab roles, and skip links for accessibility"
```

---

## Wave 3 — Visual/UX Consistency

### Task 14: Normalize CSS Color Palette (11 files)

**Files to modify** (these use the divergent `--text:#334155` / `--blue:#3B82F6`):
- SimEngine_CalorimetryLab.html
- SimEngine_EquipmentTrainer.html
- SimEngine_GraphTrainer.html
- SimEngine_GravimetricLab.html
- SimEngine_IAScaffold.html
- SimEngine_Index.html
- SimEngine_LabBuilder.html
- SimEngine_QualitativeAnalysis.html
- SimEngine_SpectroscopyLab.html
- SimEngine_TitrationLab.html
- SimEngine_UncertaintyTrainer.html

**Step 1: In each file, replace CSS custom properties**

Change: `--text:#334155` → `--text:#1E293B`
Change: `--blue:#3B82F6` → `--blue:#2563EB`

These are in the `:root` block, typically within the first 15 lines of `<style>`.

**Step 2: Verify** — Preview 3 files, confirm text and accent colors match the standard palette.

---

### Task 15: Add Missing CSS Variables

**Files missing `--green`** (6 files):
- SimEngine_EquipmentTrainer.html
- SimEngine_GraphTrainer.html
- SimEngine_Index.html
- SimEngine_LabBuilder.html
- SimEngine_SpectroscopyLab.html
- SimEngine_UncertaintyTrainer.html

Add to `:root`: `--green:#10B981;`

**Files missing `--orange`** (31 files — all except those that already define it):

Add to `:root`: `--orange:#F59E0B;`

Only add these variables if the file doesn't already define them. These ensure consistent color references are available even if not yet used.

**Step 1: Add missing variables to each file's `:root` block**

**Step 2: Verify** — Spot-check 5 files, confirm variables are defined.

---

### Task 16: Standardize Header Padding

**Files to change** (23 files currently using `padding:1.5rem 2rem`):
All SimEngine_*.html files NOT in the 11-file "new design" group, plus SimEngine_Index.html.

The 11 "new design" files already use `padding:.75rem 1.5rem` — this is the target.

Also, 3 files use gradient backgrounds (`linear-gradient(135deg,var(--navy),#2D4A7A)`):
- SimEngine_EnergyFromFuels.html
- SimEngine_NucleophilicAddition.html
- SimEngine_StoichiometryLab.html

Change these to flat `background:var(--navy)` for consistency, and update padding to `.75rem 1.5rem`.

SimEngine_Index.html uses `linear-gradient(135deg,#1E293B 0%,#334155 100%)` — change to `background:var(--navy)` and `padding:.75rem 1.5rem`.

**Step 1: Update header CSS in each file**

Find `.header{...padding:1.5rem 2rem...}` and change to `padding:.75rem 1.5rem`.
Find gradient backgrounds and simplify to `background:var(--navy)`.

**Step 2: Also standardize header h1 font-size**

Check if header h1 sizes vary. Standardize to `font-size:1.3rem` across all files.

**Step 3: Verify** — Preview 5 files, confirm headers are compact and consistent.

---

### Task 17: Standardize Tab-Bar Max-Width

**Files with tab bars:**

9 files use `max-width:1100px`:
- CalorimetryLab, EquipmentTrainer, GraphTrainer, GravimetricLab, IAScaffold, LabBuilder, QualitativeAnalysis, TitrationLab, UncertaintyTrainer

4 files use `max-width:1200px`:
- EnergyFromFuels, NucleophilicAddition, SpectroscopyLab, StoichiometryLab

Remaining tab-based sims: check and normalize.

**Step 1: Standardize all tab-bar max-width to `1100px`**

Change the 4 files using `1200px` to `1100px`.
Check all other tab-based sims and normalize to `1100px`.

**Step 2: Verify** — Preview 3 files at different viewport widths, confirm consistent max-width behavior.

---

### Task 18: Add Standard Footer to All Sims

**Files:** All 37 SimEngine_*.html files (none currently have footers)

**Step 1: Add footer CSS**

Add to each file's `<style>`:
```css
footer{text-align:center;padding:0.5rem;color:var(--text);opacity:0.5;font-size:0.75rem;margin-top:1rem;}
```

**Step 2: Add footer HTML**

Add before closing `</body>`:
```html
<footer>SimEngine &mdash; [Sim Name] &bull; H=HL T=Teacher</footer>
```

Replace `[Sim Name]` with each sim's actual name (e.g., "Acid-Base Titration", "Collision Theory").

For sims without H/T shortcuts, use just: `SimEngine &mdash; [Sim Name]`

For Index, use: `SimEngine &mdash; 36 Interactive Chemistry Simulations`

**Step 3: Verify** — Preview 5 files, confirm footer appears at bottom with correct text.

---

### Task 19: Commit Wave 3

```bash
git add SimEngine_*.html
git commit -m "style: normalize CSS palette, headers, tab-bars, and footers across all sims"
```

---

## Final Verification

### Task 20: End-to-End Verification

**Step 1: Open SimEngine_Index.html** — Confirm it loads, shows 36 sims, all cards link correctly.

**Step 2: Spot-check 5 representative sims** — One from each wave's most-changed files:
- CovalentBonding (Wave 1 — bond enthalpies)
- IAScaffold (Wave 2 — accessibility)
- AcidBase (Wave 2+3 — inputs + CSS)
- PeriodicTrends (Wave 1+2 — strict mode + canvas labels)
- LabBuilder (Wave 3 — CSS normalization)

**Step 3: Check for console errors** — Zero errors expected in all previewed sims.

**Step 4: Verify ARIA attributes in DevTools** — Inspect canvas elements, inputs, and tab roles.

---

## File Summary

| Wave | Files Modified | Risk |
|------|---------------|------|
| 1 | 4 (json + 3 html) | Low — data fixes only |
| 2 | ~20 html | Low — attribute additions only |
| 3 | ~36 html | Moderate — CSS changes |
| **Total** | **~37 unique files** | |
