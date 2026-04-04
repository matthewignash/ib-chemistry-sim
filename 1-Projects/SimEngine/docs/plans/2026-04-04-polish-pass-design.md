# Design: Comprehensive Polish Pass — Prioritized Waves

## Context
With 36 sims complete, three audits identified issues across content accuracy, accessibility, and visual consistency. This polish pass addresses all findings in a risk-ordered sequence.

## Approach: Three Independent Waves

### Wave 1 — Content Accuracy (~5 files, lowest risk)
Fix IB Data Booklet mismatches that directly affect student learning.

| File | Change |
|------|--------|
| `ib_data_booklet.json` | Fix 5 bond enthalpies: C–O 360→358, C=O 799→804, N≡N 941→945, C–Cl 338→324, C–Br 276→285 |
| `CovalentBonding.html` | Update inline bond enthalpy values to match corrected data booklet |
| `EnthalpyProfiles.html` | Fix C=O value 805→804 |
| `PeriodicTrends.html` | Add missing `'use strict'` to IIFE |

### Wave 2 — Accessibility (~20 files, low risk)
Attribute-only additions — no layout or logic changes.

- `aria-label` on all 63 unlabeled `<canvas>` elements
- `aria-live="polite"` on feedback/score display regions
- `<label>` or `aria-label` on all unlabeled `<input>`, `<select>`, `<textarea>` (especially IAScaffold's 30+ fields)
- `role="tablist"` / `role="tab"` / `role="tabpanel"` on tab systems where missing
- Skip-to-content `<a>` link in sims with tab bars

### Wave 3 — Visual/UX Consistency (~36 files, moderate risk)
CSS normalization — cosmetic only, no logic changes.

- **Palette**: Normalize to majority values (`--text:#1E293B`, `--blue:#2563EB`). Update 11 divergent sims. Add `--orange`/`--green` where missing.
- **Header padding**: Standardize to `0.75rem 1.5rem`
- **Tab-bar max-width**: Standardize to `900px`
- **Footer**: Add standard footer to ~70% of sims missing one

## Verification
- After each wave: preview 3-4 representative sims, confirm no regressions
- Wave 1: verify corrected bond enthalpies appear in sim output
- Wave 2: inspect ARIA attributes in DevTools across sims
- Wave 3: visually compare header/tab/footer consistency
- Final: zero console errors across all 36 sims
