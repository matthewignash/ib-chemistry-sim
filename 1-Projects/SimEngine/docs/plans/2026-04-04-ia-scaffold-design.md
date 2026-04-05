# IA Scaffold — Design Document

**Date:** 2026-04-04
**Phase:** 6 (IA Scaffold)
**Approach:** Full Interactive Hub + Embedded Lab Panels

## Overview

Build an IA (Internal Assessment) scaffold system that guides IB Chemistry students through the 4 IA criteria from the 2025 syllabus. Two components:

1. **SimEngine_IAScaffold.html** — standalone 4-tab hub mapping to the 4 IA criteria
2. **Embedded IA Guide panels** — collapsible sidebar added to 4 existing lab sims

## IB Chemistry 2025 IA Criteria (24 marks total)

| Criterion | Marks | Focus |
|-----------|-------|-------|
| Research Design | 6 | Research question, variables, methodology |
| Data Analysis | 6 | Recording, processing, graphs, calculations |
| Conclusion | 6 | Answering RQ using analysis + scientific context |
| Evaluation | 6 | Methodology assessment, improvements |

Scoring uses "best-fit approach" — each criterion marked holistically against 6-point scale.

## Standalone Hub: SimEngine_IAScaffold.html

### Tab 1: Research Design (Criterion 1)

- **Lab selector** — dropdown: CalorimetryLab, TitrationLab, GravimetricLab, QualitativeAnalysis, Custom
- **Research question builder** — structured prompt: "How does [IV] affect [DV] when [CVs] are kept constant?"
- **Variables table** — IV, DV, CVs with columns for: variable name, how measured/controlled, range/values
- **Method outline** — numbered step prompts (equipment, fair test, trials, safety)
- **Rubric self-check** — 6-mark descriptors displayed; student selects their level

### Tab 2: Data Analysis (Criterion 2)

- **Raw data table builder** — auto-generates column headers from selected lab's variables
- **Uncertainty guidance** — instrument uncertainties, links to UncertaintyTrainer concepts
- **Processed data prompts** — sample calculation, graph type selection, error bars
- **Graph checklist** — title, labelled axes with units, line of best fit, anomalies

### Tab 3: Conclusion (Criterion 3)

- **Answer the RQ** — structured prompt with sentence starters
- **Scientific context** — connect results to relevant theory
- **Data reference** — cite specific data points/trends
- **Literature comparison** — compare to accepted values, calculate % error

### Tab 4: Evaluation (Criterion 4)

- **Strengths** — what gave reliable results
- **Weaknesses** — categorised: systematic errors, random errors, equipment limitations
- **Improvements** — for each weakness, realistic improvement + justification
- **Extension** — suggest follow-up investigation

### Shared Features

- HL/Teacher toggles (standard SimEngine pattern)
- Teacher mode: model answers, common mistakes, marking guidance per lab
- Keyboard shortcuts: H, T, 1-4, R, N
- Lab-specific presets (teacher dropdown)

## Embedded IA Guide Panels

Collapsible right-side panel added to 4 lab sims, toggled by header button or `I` key.

### Content per lab (contextualised)

- Research question hint (example RQ for that lab)
- Variables reminder (pre-filled IV/DV/CV)
- Data recording prompt
- Link button → opens IAScaffold with lab pre-selected

### Target sims

- SimEngine_CalorimetryLab.html
- SimEngine_TitrationLab.html
- SimEngine_GravimetricLab.html
- SimEngine_QualitativeAnalysis.html

### Implementation

~50 lines HTML/CSS/JS per lab sim. Shared CSS class `.ia-guide-panel`.

## Lab-Specific Data

Each selectable lab needs contextualised content:

### CalorimetryLab
- Example RQ: "How does the choice of calorimeter material affect the accuracy of the enthalpy change measurement?"
- IV: calorimeter material (polystyrene, glass, metal)
- DV: temperature change / calculated enthalpy
- CVs: volume of solution, concentration, mass of solute

### TitrationLab
- Example RQ: "How does the choice of indicator affect the accuracy of an acid-base titration endpoint?"
- IV: indicator type / concentration of analyte
- DV: titre volume / calculated concentration
- CVs: volume of analyte, concentration of titrant, temperature

### GravimetricLab
- Example RQ: "What is the value of x in the formula CuSO₄·xH₂O?"
- IV: identity of hydrated salt
- DV: mass loss / moles of water
- CVs: heating time, crucible type, sample mass

### QualitativeAnalysis
- Example RQ: "How can flame tests and precipitation reactions be used to identify unknown ionic compounds?"
- IV: identity of unknown compound
- DV: observed flame colour / precipitate formation
- CVs: concentration of reagents, sample size

## Build Order

1. SimEngine_IAScaffold.html (standalone hub)
2. Embed IA Guide panels into 4 lab sims
3. Update SimEngine_Index.html (35 sims)
4. Update SimEngine_Project_Status (Phase 6 started)

## Technical Notes

- Single-file HTML, no frameworks, `file://` compatible
- No innerHTML — DOM methods only
- Standard SimEngine CSS variables and patterns
- Google Fonts: Inter, Fira Code
