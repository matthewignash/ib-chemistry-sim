# Organic Mechanisms Explorer — Design Document

**Simulation #12** | IB Chemistry R3.4 Reaction Mechanisms (HL) | 2026-04-02

## Overview

Step-through animated mechanism viewer covering all 6 IB HL mechanisms with 5-6 example reactions each. Canvas-rendered curly arrows, bond changes, and atom movement with DOM panels for step descriptions, energy profiles, and mechanism summaries. Template-based rendering system for efficient reaction data.

## Layout

- **Grid:** 240px sticky sidebar + 1fr main panel
- **Sidebar:** Search bar, category-grouped mechanism buttons, reaction selector per mechanism, teacher presets
- **Main panel:** Mechanism Canvas (680x420) with step controls + Step description card + 2-column: energy profile canvas (300x200) + mechanism summary card
- **Header:** Navy gradient, "Organic Mechanisms Explorer", R3.4 badge, HL badge (always visible), Teacher toggle

## Mechanisms (6)

### 1. SN2 (Nucleophilic Substitution, Bimolecular)
- **Steps:** 1 (concerted backside attack)
- **Stereochemistry:** Inversion (Walden inversion)
- **Rate:** Rate = k[RX][Nu]
- **Substrate pref:** Primary > Secondary (tertiary does not occur)
- **Conditions:** Strong nucleophile, polar aprotic solvent
- **Reactions:** CH3CH2Br+OH-, CH3Br+CN-, CH3CH2Cl+NH3, CH3I+H2O, CH3Br+CH3O-

### 2. SN1 (Nucleophilic Substitution, Unimolecular)
- **Steps:** 3 (ionisation, nucleophilic attack, deprotonation)
- **Stereochemistry:** Racemisation
- **Rate:** Rate = k[RX]
- **Substrate pref:** Tertiary > Secondary (primary does not occur)
- **Conditions:** Weak/neutral nucleophile, polar protic solvent
- **Reactions:** (CH3)3CBr+H2O, (CH3)3CCl+H2O, benzylic+H2O, (CH3)2CHBr+CH3OH, (CH3)3CBr+CN-

### 3. E2 (Elimination, Bimolecular)
- **Steps:** 1 (concerted anti-periplanar)
- **Stereochemistry:** Anti-periplanar geometry required
- **Rate:** Rate = k[RX][base]
- **Substrate pref:** Works on all, favoured with strong base + bulky base
- **Conditions:** Strong base, high temperature
- **Reactions:** CH3CHBrCH3+OH-, CH3CH2CH2Br+OEt-, (CH3)2CHCH2Br+OH-, cyclohexyl-Br+OH-, Zaitsev example

### 4. E1 (Elimination, Unimolecular)
- **Steps:** 2 (ionisation, elimination from carbocation)
- **Stereochemistry:** No stereospecificity (Zaitsev product)
- **Rate:** Rate = k[RX]
- **Substrate pref:** Tertiary > Secondary
- **Conditions:** Weak base, polar protic solvent, high temperature
- **Reactions:** (CH3)3CBr, (CH3)3CCl, 2-bromo-2-methylbutane, cyclohexanol+H2SO4, (CH3)2CHOH+H2SO4

### 5. Electrophilic Addition
- **Steps:** 2 (electrophilic attack on pi bond, nucleophilic attack on carbocation)
- **Stereochemistry:** Markovnikov's rule for asymmetric alkenes
- **Rate:** Depends on electrophile
- **Reactions:** CH2=CH2+HBr, CH2=CH2+Br2, CH3CH=CH2+HBr (Markovnikov), CH2=CH2+H2O, CH3CH=CH2+HCl, CH2=CH2+Cl2

### 6. Free Radical Substitution
- **Steps:** 3 phases (initiation, propagation x2, termination)
- **Stereochemistry:** None (radical intermediate)
- **Conditions:** UV light
- **Reactions:** CH4+Cl2, CH4+Br2, C2H6+Cl2, C3H8+Cl2, CH4+F2

## Canvas Rendering

### Frame Data Model
Each mechanism step is a frame:
- `atoms`: array of { id, label, x, y, charge, lonePairs }
- `bonds`: array of { from, to, order, style, breaking, forming }
- `arrows`: array of { from, to, type: 'curly'|'fishhook', controlPoints }
- `description`: text explaining the step

### Animation
- Curly arrows draw progressively along bezier path (300ms)
- Bonds fade out (breaking) / fade in (forming) over 300ms
- Atoms slide to new positions with easing
- Flash highlight on new bonds
- Partial charges (delta+/delta-) fade in/out per frame

### Template System
Each mechanism type defines an animation template with placeholder groups. Specific reactions provide substitution maps:
```
{ nucleophile: 'OH-', substrate: 'CH3CH2', leavingGroup: 'Br', product: 'CH3CH2OH' }
```
The renderer fills the template to produce the specific reaction animation.

### Curly Arrow Rendering
- Full curly arrow: two-electron movement (nucleophilic, heterolytic)
- Half/fishhook arrow: one-electron movement (homolytic, free radical)
- Bezier curves with filled arrowheads
- Color: full arrows = blue, fishhook arrows = red

## Step Controls
- Back/Next buttons with step counter
- Play button (auto-advance, 2s per step)
- Reset button
- Keyboard: Left/Right arrows, Space=play/pause

## Energy Profile Panel
- Small Canvas (300x200) reusing bezier rendering from Enthalpy Profiles sim
- One-step: single hump (SN2, E2)
- Two-step: two humps with intermediate valley (SN1, E1)
- Three-phase: initiation energy then chain (free radical)
- Colored dot moves along curve matching current step
- Labels: Reactants, TS1, Intermediate (if applicable), TS2, Products

## Mechanism Summary Panel
- Type badge (SN1/SN2/E1/E2/etc)
- Rate expression in monospace
- Conditions: reagent, solvent type, temperature
- Stereochemistry outcome with explanation
- Substrate preference with rationale

## Teacher Presets (5)
1. "SN1 vs SN2" — side-by-side comparison setup
2. "E1 vs E2" — elimination comparison
3. "Substitution vs Elimination" — competing pathways
4. "Electrophilic Addition Tour" — cycles through addition examples
5. "Free Radical Steps" — detailed initiation/propagation/termination

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Left/Right | Step back/forward |
| Space | Play/Pause |
| T | Teacher mode |
| Up/Down | Prev/Next mechanism |
| 1-6 | Switch example reaction |
| R | Reset to step 1 |
| / | Search |
| Esc | Clear/Deselect |

## Constraints
- Single-file HTML, no external deps except SimEngine_Core.js
- NO innerHTML — all DOM via createElement/textContent/appendChild
- Unicode subscripts for formulas
- Canvas: explicit px dimensions, maxWidth: 100%
- roundRect polyfill for older browsers
- This is an HL-only simulation (no SL/HL toggle needed)
