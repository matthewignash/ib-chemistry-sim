# SimEngine Project Status — April 5, 2026

## Executive Summary

**38 interactive HTML simulations** have been built, covering all 18 IB Chemistry 2025 syllabus subtopics — **100% syllabus coverage achieved**. The original architecture planned ~82 simulation modules across 7 phases. **Phases 1–5 and 7 are COMPLETE.** Phase 4 Lab Builder has 6 guided assembly templates and 37 canvas-drawn equipment items. Phase 5 Virtual Vernier Lab has 2 sensor experiments with full data collection and Graphical Analysis-style tools. A comprehensive polish pass has been applied: IB content accuracy fixes, full ARIA accessibility attributes across all sims, and normalized CSS styling. Phase 6 (Advanced IA) remains not started.

---

## What Has Been Built (38 Simulations)

### Structure 1: Models of the Particulate Nature of Matter

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_StatesOfMatter.html` | S1.1 States of Matter | Both | Complete | Particle visualization, phase transitions, heating curves |
| `SimEngine_NuclearAtom.html` | S1.2 Nuclear Atom | Both | Complete | Mass spectrum viewer, emission spectrum, isotope explorer |
| `SimEngine_ElectronConfig.html` | S1.3 Electron Configurations | Both | Complete | 4-tab system: Orbital Builder, Notation, Periodic Map, IE Trends |
| `SimEngine_Stoichiometry.html` | S1.4 Mole Concept | Both | Complete | Particle diagrams, ICE tables, limiting reagent |
| `SimEngine_GasLaws.html` | S1.5 Ideal Gases | Both | Complete | P-V-T relationships, particle animation, PV=nRT solver |
| `SimEngine_GasLawsLab.html` | S1.5 Gas Laws Lab | Both | Complete | Boyle's/Charles's/Gay-Lussac's laws with 4 canvases |
| `SimEngine_GravimetricLab.html` | S1.4/R2.1 Gravimetric Analysis Lab | Both | Complete | Water of crystallisation (4 hydrates), thermal decomposition (4 carbonates), precipitation gravimetry (BaSO₄/AgCl), heating to constant mass, step-by-step calculations |

### Structure 2: Models of Bonding and Structure

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_IonicBonding.html` | S2.1 Ionic Model | Both | Complete | 3D rendering, drag-drop atoms, lattice models |
| `SimEngine_MetallicBonding.html` | S2.2/S2.3 Metallic Model | Both | Complete | Sea of electrons, properties, alloys, band theory (HL) |
| `SimEngine_CovalentBonding.html` | S2.3 Covalent Model | Both | Complete | Lewis structures, bonding modes, electronegativity |
| `SimEngine_VSEPR.html` | S2.4 Molecular Geometry | Both | Complete | 3D molecule builder, electron pair geometry, bond angles |
| `SimEngine_IMFComparison.html` | S2.4 IMF & Materials | Both | Complete | IMF type selector, boiling point predictor, polarity |

### Structure 3: Classification of Matter

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_PeriodicTrends.html` | S3.1 Periodic Table | Both | Complete | 4 graph canvases: IE, radius, EN trends |
| `SimEngine_FunctionalGroups.html` | S3.1/S3.2 Organic Groups | Both | Complete | Functional group explorer, structure builder |
| `SimEngine_OrganicMechanisms.html` | S3.2/R3.3 Organic Mechanisms | Both | Complete | SN1, SN2, elimination, electrophilic addition, free radical substitution |
| `SimEngine_QualitativeAnalysis.html` | S3.1/R3.1 Qualitative Analysis Lab | Both | Complete | Flame tests (7 metal ions), precipitation well plate (8×6 matrix), ion ID challenge (10 unknowns), mixed practice |

### Reactivity 1: What Drives Chemical Reactions?

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_EnthalpyProfiles.html` | R1.1 Enthalpy Diagrams | Both | Complete | Exo/endothermic diagrams, activation energy |
| `SimEngine_HessLaw.html` | R1.2 Hess's Law | Both | Complete | Enthalpy cycle builder, step-by-step construction |
| `SimEngine_BornHaber.html` | R1.2 Born-Haber (HL) | Both | Complete | Lattice enthalpy cycles, theoretical vs experimental |
| `SimEngine_EnergyFromFuels.html` | R1.3 Energy from Fuels | Both | Complete | Combustion calorimetry, fuel comparison, incomplete combustion, energy density (HL) |
| `SimEngine_EntropyGibbs.html` | R1.4 Entropy & Gibbs (HL) | Both | Complete | ΔG calculation, spontaneity explorer, temperature effects |
| `SimEngine_CalorimetryLab.html` | R1.1 Calorimetry Lab | Both | Complete | Coffee-cup & combustion calorimetry, equipment choice affects heat loss, graphical extrapolation, Hess's law verification, % error analysis |

### Reactivity 2: How Much, How Fast, and How Far?

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_TitrationLab.html` | R2.1/R3.1 Titration Lab | Both | Complete | Acid-base (3 types), redox (KMnO₄), back titration, interactive burette, indicator choice, step-by-step calculations, uncertainty propagation |
| `SimEngine_StoichiometryLab.html` | R2.1 Amounts in Reactions | Both | Complete | Percentage yield, experimental design, atom economy (HL), back-titration (HL) |
| `SimEngine_CollisionTheory.html` | R2.2 Collision Theory | Both | Complete | 5 canvases: particle collisions, KE distribution |
| `SimEngine_RateLaw.html` | R2.2 Rate Laws | Both | Complete | Rate law determination, order experiments |
| `SimEngine_Equilibrium.html` | R2.3 Equilibrium | Both | Complete | Concentration vs time, forward/reverse rates, K builder |
| `SimEngine_AcidBase.html` | R3.1 Acid-Base | Both | Complete | Titration sim, beaker viz, pH graphs, HH equation |

### Reactivity 3: What Are the Mechanisms of Chemical Change?

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_NucleophilicAddition.html` | R3.4 Nucleophilic Addition (HL) | HL only | Complete | HCN addition to carbonyls, condensation/hydrolysis, synthesis pathways |
| `SimEngine_Electrochem.html` | R3.2 Electrochemistry | Both | Complete | Galvanic/voltaic cells, electrode potentials, electron flow |

### Analytical Chemistry / Cross-cutting

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_SpectroscopyLab.html` | S3.2 Analytical Techniques | Both | Complete | 4 tabs: IR Viewer, MS Viewer, NMR Viewer (HL), ID Challenge with 12 unknowns |

### Math Skills Trainers (Phase 7)

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `SimEngine_UncertaintyTrainer.html` | Tool 1 / IA Skills | Both | Complete | 4 tabs: Reading Uncertainty (canvas instruments), Error Propagation (step-by-step), % Error + classification, Mixed Practice with score tracking |
| `SimEngine_GraphTrainer.html` | Tool 1 / IA Skills | Both | Complete | 4 tabs: Reading Graphs (6 graph types: calibration, heating, Charles's Law, titration, equivalence, conc-time), Gradients & Rates (step-by-step gradient, tangent, order MCQ, rate constant), Graph Analysis HL (Arrhenius Ea, linearization, integrated rate plots), Mixed Practice with score tracking |
| `SimEngine_EquipmentTrainer.html` | Tool 1 / IA Skills | Both | Complete | 4 tabs: Equipment Identification (26 items, canvas drawings, confusion-group distractors), Equipment Selection (14 task scenarios, 2×2 grid), Measurement & Precision (uncertainty values, equipment comparison, % uncertainty), Mixed Practice with score tracking |
| `SimEngine_IAScaffold.html` | Tool 1 / IA Skills | Both | Complete | 4-tab IA scaffold: Research Design (RQ builder, variables table, method outline, rubric self-check), Data Analysis (raw data table builder, uncertainty guidance, graph checklist), Conclusion (sentence starters, % error calculator, literature comparison), Evaluation (categorised weaknesses, linked improvements, extension). Lab-specific presets for Calorimetry, Titration, Gravimetric, Qualitative. Embedded IA Guide panels in 4 lab sims. |
| `SimEngine_LabBuilder.html` | Tool 1 / Lab Skills | Both | Complete | 2-tab Virtual Lab Builder: Guided Assembly with 6 templates (Distillation, Titration, Recrystallization, Filtration, Calorimetry, Chromatography) and Sandbox with save/load. 37 canvas-drawn equipment items. |
| `SimEngine_VernierLab.html` | Tool 1 / Lab Skills | Both | Complete | 3-tab Virtual Vernier Lab: Sensor Setup (experiment selector, probe drawing, collection settings), Data Collection (live graph + data table, speed controls), Analysis (5 tools: Statistics, Linear Fit, Curve Fit, Tangent, Annotation). 8 experiments: Enthalpy of Neutralization, Enthalpy of Combustion, Enthalpy of Dissolution (NH₄NO₃), Strong Acid-Base Titration, Weak Acid Titrations (ethanoic + methanoic acid), Diprotic Titrations (H₂SO₄ + H₂CO₃, HL). IB context calculations, teacher + HL panels with experiment-specific content. |

### Additional (Outside SimEngine folder)

| Sim File | Syllabus Topic | SL/HL | Status | Notes |
|---|---|---|---|---|
| `rechargeable_battery_simulation.html` | R3.2 Rechargeable Cells | N/A | Complete | Li-Ion vs Lead-Acid toggle, in R3.2 unit folder |

---

## Chemistry Accuracy Review (April 3, 2026)

Seven simulations were spot-checked against IB Chemistry 2025 terminology and content requirements:

| Sim | Chemistry | IB Terminology | SL/HL Gating | Verdict |
|---|---|---|---|---|
| Born-Haber | Correct | "Lattice enthalpy" (not energy) | HL only | PASS |
| Acid-Base | Correct | Ka/Kb, Henderson-Hasselbalch | Gated correctly | PASS |
| Electrochemistry | Correct | Anode/cathode signs correct | Both modes | PASS (minor note) |
| Equilibrium | Correct | Kc, Q vs K, Le Chatelier | Both | PASS |
| Entropy-Gibbs | Correct | ΔG = ΔH − TΔS, correct units | HL | PASS |
| Organic Mechanisms | Correct | SN1/SN2/E2, Walden inversion | Both (HL toggle added) | PASS |
| Gas Laws | Correct | Kelvin, ideal gas variables | Both | PASS |

**One pedagogical note:** The Electrochem sim labels anode as (−) in galvanic cells, which is technically correct per IB convention, but could benefit from a tooltip or note clarifying that anode/cathode sign conventions flip between galvanic and electrolysis cells. Both cell types are present and correctly differentiated.

---

## Syllabus Coverage Map

### Topics WITH a simulation built:

- S1.1 States of Matter
- S1.2 Nuclear Atom
- S1.3 Electron Configurations
- S1.4 Mole Concept / Stoichiometry
- S1.5 Ideal Gases (2 sims: conceptual + lab)
- S2.1 Ionic Model
- S2.2/S2.3 Metallic Model (metallic bonding, properties, alloys, band theory)
- S2.3 Covalent Model
- S2.4 VSEPR / IMF (2 sims)
- S3.1 Periodic Table Trends
- S3.2 Functional Groups / Organic Mechanisms (2 sims)
- R1.1 Enthalpy Diagrams
- R1.2 Hess's Law / Born-Haber (2 sims)
- R1.3 Energy from Fuels (combustion calorimetry, fuel comparison, energy density)
- R1.4 Entropy & Gibbs
- R2.1 Amounts in Reactions (percentage yield, atom economy, back-titration)
- R2.2 Collision Theory / Rate Laws (2 sims)
- R2.3 Equilibrium
- R3.1 Acid-Base
- R3.2 Electrochemistry (2 sims including rechargeable battery)
- R3.3 Electron Sharing Reactions (covered via OrganicMechanisms HL toggle)
- R3.4 Nucleophilic Addition (HL) — condensation/hydrolysis, synthesis pathways

### Coverage: All 18 subtopics now have at least one simulation.

Previously uncovered topics (S2.2, S2.3, R1.3, R2.1, R3.3, R3.4) were filled in the April 3 sprint with MetallicBonding, EnergyFromFuels, StoichiometryLab, NucleophilicAddition, and an HL toggle enhancement to OrganicMechanisms.

---

## Phase Status vs. Original Architecture Plan

### Phase 1: Gas Laws Proof of Concept — COMPLETE
- `SimEngine_GasLaws.html` — particle simulation with PV=nRT
- `SimEngine_Core.js` — modular engine (State, Particles, Graph, Controls)

### Phase 2: Topic Simulations — COMPLETE (29 sims built)
All planned topic-level simulations from the architecture doc have been built, covering all 18 IB Chemistry 2025 subtopics including equilibrium, acid-base, electrochemistry, rate laws, VSEPR, enthalpy, bonding, organic chemistry, metallic bonding, fuels, stoichiometric relationships, and nucleophilic addition.

### Phase 3: Data Layer & Database Sims — COMPLETE
- **8 JSON data files** in `3-Resources/SimEngine/data/`:
  - `elements.json` — 118 elements, 20 properties each, successive IE data
  - `ib_data_booklet.json` — constants, bond enthalpies, electrode potentials, Ka values
  - `compounds_organic.json` — 10 fuels with combustion data (synced: dHc/cat/color match HTML)
  - `compounds_inorganic.json` — 14 ions + 23 ionic compounds (lattice enthalpies, solubility, crystal structures)
  - `spectroscopy_correlation.json` — 16 functional groups + flat arrays (ir_peaks, ir_groups, nmr_regions, ms_compounds matching SpectroscopyLab.html)
  - `isotopes.json` — 23 elements with isotope data + 9 mass spectra (synced: cat field matches HTML)
  - `solubility_rules.json` — 10 rules, solubility matrix, flame test colors + flat arrays (flame_ions, precip_cations, precip_anions, precip_matrix, unknowns matching QualitativeAnalysis.html)
  - `equipment.json` — 50 lab equipment items, confusion groups, 14 scenarios, 8 precision entries
- **4 Python extraction scripts** in `3-Resources/SimEngine/scripts/`:
  - `pubchem_elements.py` — augment elements.json with PubChem Periodic Table data
  - `nist_thermodynamic.py` — pull thermodynamic data for 49 IB compounds (27 manual + 22 NIST)
  - `pubchem_ghs.py` — pull GHS hazard data for 30 lab chemicals (9 manual + 21 PubChem)
  - `validate_ib_data.py` — cross-reference all JSON files against IB Data Booklet (found 5 bond enthalpy discrepancies to review)
- All sims use hardcoded inline data; JSON files serve as canonical reference (single-file delivery model)

### Phase 4: Virtual Lab Builder — COMPLETE
- **Virtual Lab Builder** — **COMPLETE** (`SimEngine_LabBuilder.html`, 2 tabs: Guided Assembly with 6 templates, Sandbox with save/load)
- 6 guided templates: Simple Distillation, Titration Setup, Recrystallization, Filtration & Evaporation, Coffee-Cup Calorimetry, Paper/TLC Chromatography
- 37 canvas-drawn equipment items (31 original + 6 new: polystyrene cup, filter paper, Buchner funnel, Buchner flask, TLC plate, pencil)
- Step-by-step validation, scoring, connection lines
- Equipment photo library not yet collected

### Phase 5: Vernier Sensor Simulation — COMPLETE
- Virtual Vernier Lab sim (`SimEngine_VernierLab.html`) with 8 experiments
- Temperature probe: Enthalpy of Neutralization, Enthalpy of Combustion, Enthalpy of Dissolution (NH₄NO₃)
- pH sensor: Strong Acid-Base Titration, Weak Acid Titrations (ethanoic + methanoic acid), Diprotic Titrations (H₂SO₄ + H₂CO₃, HL)
- 3-tab workflow: Sensor Setup → Data Collection (live graph) → Analysis
- 5 analysis tools: Statistics, Linear Fit, Curve Fit, Tangent, Annotation
- IB context calculations, experiment-specific teacher + HL panels

### Phase 6: Advanced IA Workflow — NOT STARTED (IAScaffold is a partial MVP)
- IAScaffold sim covers basic IA workflow (Research Design → Data Analysis → Conclusion → Evaluation)
- No advanced rubric-aligned assessment integration
- No query param deep linking from lab sims (?lab= parameter)

### Phase 7: Math Skills Trainers — COMPLETE (3 of 3)
- **Uncertainty/error propagation trainer** — **COMPLETE** (`SimEngine_UncertaintyTrainer.html`, 4 tabs: Reading Uncertainty, Propagation, % Error, Practice)
- **Graph interpretation trainer** — **COMPLETE** (`SimEngine_GraphTrainer.html`, 4 tabs: Reading Graphs, Gradients & Rates, Graph Analysis HL, Practice)
- **Equipment recognition trainer** — **COMPLETE** (`SimEngine_EquipmentTrainer.html`, 4 tabs: Equipment Identification (26 items), Equipment Selection (14 scenarios), Measurement & Precision, Practice)

---

## Supporting Infrastructure

### Architecture & Planning Docs (in `docs/plans/`)

| Type | Count | Notes |
|---|---|---|
| Design documents | ~20 | Design specs for most built sims |
| Implementation documents | ~9 | Detailed build plans for subset of sims |
| Architecture doc | 1 | `IB_Chemistry_SimEngine_Architecture.md` (v3.0, 60 KB) |
| Syllabus map | 1 | `IB_Chemistry_SimEngine_Syllabus_Map.md` (45 KB, maps ~82 modules) |

### Core Engine
- `SimEngine_Core.js` (136 KB) in `3-Resources/SimEngine/`
- Modules: State, Particles, Graph, Controls
- Species database: He, N₂, CO₂ with physical parameters

### Style System
- Tutorial Style Guide at `3-Resources/IB_Chemistry_Tutorial_Style_Guide.md`
- Consistent CSS variables, rough.js aesthetic, Inter/Fira Code/Caveat fonts
- SL/HL toggle pattern: `body.hl-active` CSS class with purple accent

---

## Priorities and Recommendations

### Immediate (before April 17 final content day):
1. ~~HL toggle for OrganicMechanisms.html~~ — **DONE** (April 3)
2. ~~Build sims for 6 uncovered subtopics~~ — **DONE** (April 3, 4 new sims + 1 enhancement)
3. ~~Electrochemistry tooltip~~ — **DONE** (April 3, dynamic sign convention note)
4. ~~Pathway Decision tab for OrganicMechanisms~~ — **DONE** (April 3, decision tree + quiz + reference table)
5. ~~Phase 3 data layer~~ — **DONE** (April 4, 8 JSON data files + 4 Python scripts. equipment.json added, all JSON synced to HTML field names, PubChem/NIST extraction scripts created, validation script operational)
6. ~~Quality pass on lean sims~~ — **DONE** (April 4, teacher presets added to EnergyFromFuels, NucleophilicAddition, StoichiometryLab; palette search added to NucleophilicAddition)
7. ~~Spectroscopy ID Lab~~ — **DONE** (April 4, SimEngine_SpectroscopyLab.html — 4 tabs: IR/MS/NMR/ID Challenge, 12 unknowns, teacher mode)
8. ~~Feature parity pass~~ — **DONE** (April 4, keyboard hint bars + palette search + teacher presets added to 7 sims: AcidBase, CollisionTheory, Electrochem, Equilibrium, GasLaws, RateLaw, VSEPR)
9. ~~Uncertainty & Error Trainer~~ — **DONE** (April 4, SimEngine_UncertaintyTrainer.html — 4 tabs: Reading Uncertainty, Propagation, % Error, Practice; Phase 7 started)
10. ~~Graph Interpretation Trainer~~ — **DONE** (April 4, SimEngine_GraphTrainer.html — 4 tabs: Reading Graphs, Gradients & Rates, Graph Analysis HL, Practice; Phase 7 two trainers complete)
11. ~~Cross-sim polish pass~~ — **DONE** (April 4, standardized `teacher-active` class across all 29 sims, fixed title format on SpectroscopyLab + UncertaintyTrainer, added body class pattern to EnthalpyProfiles + OrganicMechanisms)

### Medium-term (exam prep period, April 17+):
12. ~~Consolidate all sims into a single index/launcher page for student access~~ — **DONE** (April 4, SimEngine_Index.html — searchable card-based launcher, SL/HL filter, section quick-jump, responsive mobile layout, keyboard shortcuts)
13. ~~Visual overlap audit~~ — **DONE** (April 4, fixed OrganicMechanisms curly arrow z-order, fixed Electrochem ion label hidden behind electrode, verified CovalentBonding/VSEPR/HessLaw/BornHaber)
14. ~~Equipment recognition trainer (Phase 7)~~ — **DONE** (April 4, SimEngine_EquipmentTrainer.html — 26 equipment items with canvas drawings, 4 tabs: Identification, Selection (14 scenarios), Precision, Practice; Phase 7 now complete 3/3)
15. ~~Equipment.json data file~~ — **DONE** (April 4, 50 items for Phase 4)

### April 5 Sprint:
16. ~~DPR canvas doubling bug~~ — **DONE** (April 5, fixed setupCanvas() in 5 sims using data-w/data-h attributes to prevent re-reading already-scaled dimensions)
17. ~~Phase 4: Virtual Lab Builder~~ — **DONE** (April 5, SimEngine_LabBuilder.html — 2 tabs, 31 draw functions, guided + sandbox modes, distillation + titration templates)
18. ~~Comprehensive polish pass~~ — **DONE** (April 5, 3 waves across all 37 files):
    - Wave 1: Fixed 5 IB bond enthalpy values (C–O, C=O, N≡N, C–Cl, C–Br), added 'use strict' to PeriodicTrends
    - Wave 2: Added aria-label to all canvas/input elements, role=tablist/tab/tabpanel, aria-live regions, skip-to-content links
    - Wave 3: Normalized CSS palette (--text, --blue), added --orange/--green vars, standardized headers/footers/tab-bars
19. ~~Extended LabBuilder templates~~ — **DONE** (April 5, 4 new templates: Recrystallization, Filtration & Evaporation, Coffee-Cup Calorimetry, Paper/TLC Chromatography + 6 new equipment items)
20. ~~Phase 5: Virtual Vernier Lab~~ — **DONE** (April 5, SimEngine_VernierLab.html — 3 tabs, 8 experiments, 5 analysis tools, temperature + pH sensors, live data collection, IB context calculations)
21. ~~Phase 5.1: Expanded Vernier Experiments~~ — **DONE** (April 5, added 6 experiments: combustion, dissolution, weak acid titrations ×2, diprotic titrations ×2; experiment-specific IB context, teacher notes, HL uncertainty analysis)

### Long-term (summer/next year):
21. Phase 6: Advanced IA Workflow (rubric alignment, deep linking)
22. Equipment photo library for LabBuilder

---

*Last updated: April 5, 2026. 38 sims, 100% syllabus coverage, Phases 1–5 and 7 complete, comprehensive accessibility + visual polish applied.*
