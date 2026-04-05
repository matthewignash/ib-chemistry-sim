# SimEngine — Curriculum Resource Inventory & Timeline

*Use this document to track what has been created, where it lives, and what maps to your curriculum delivery schedule.*

---

## Complete Resource Inventory

### Interactive Simulations (38 built + Index, all in `1-Projects/SimEngine/`)

| # | File | IB Topic | Type | SL/HL | Size |
|---|---|---|---|---|---|
| 1 | SimEngine_StatesOfMatter.html | S1.1 | Particle visualization | Both | 58 KB |
| 2 | SimEngine_NuclearAtom.html | S1.2 | Mass spec + emission viewer | Both | 117 KB |
| 3 | SimEngine_ElectronConfig.html | S1.3 | 4-tab orbital builder | Both | 106 KB |
| 4 | SimEngine_Stoichiometry.html | S1.4 | Mole concept workspace | Both | 109 KB |
| 5 | SimEngine_GasLaws.html | S1.5 | Ideal gas explorer | Both | 54 KB |
| 6 | SimEngine_GasLawsLab.html | S1.5 | Virtual gas laws lab | Both | 81 KB |
| 7 | SimEngine_IonicBonding.html | S2.1 | 3D ionic lattice builder | Both | 95 KB |
| 8 | SimEngine_MetallicBonding.html | S2.2 | Metallic bonding model | Both | 61 KB |
| 9 | SimEngine_CovalentBonding.html | S2.3 | Lewis structures + bonding | Both | 67 KB |
| 10 | SimEngine_VSEPR.html | S2.4 | 3D molecular geometry | Both | 68 KB |
| 11 | SimEngine_IMFComparison.html | S2.4 | IMF comparison tool | Both | 71 KB |
| 12 | SimEngine_PeriodicTrends.html | S3.1 | IE, radius, EN graphing | Both | 89 KB |
| 13 | SimEngine_FunctionalGroups.html | S3.2 | Organic group explorer | Both | 66 KB |
| 14 | SimEngine_OrganicMechanisms.html | S3.2/R3.3 | SN1/SN2/E1/E2/EA/FRS | Both | 92 KB |
| 15 | SimEngine_EnthalpyProfiles.html | R1.1 | Energy diagrams | Both | 58 KB |
| 16 | SimEngine_HessLaw.html | R1.2 | Enthalpy cycle builder | Both | 82 KB |
| 17 | SimEngine_BornHaber.html | R1.2 | Born-Haber cycles (HL) | Both | 72 KB |
| 18 | SimEngine_EnergyFromFuels.html | R1.3 | Combustion calorimetry | Both | 45 KB |
| 19 | SimEngine_EntropyGibbs.html | R1.4 | Delta-G calculator + spontaneity | Both | 88 KB |
| 20 | SimEngine_CollisionTheory.html | R2.2 | Particle collision engine | Both | 52 KB |
| 21 | SimEngine_RateLaw.html | R2.2 | Rate law determination | Both | 67 KB |
| 22 | SimEngine_Equilibrium.html | R2.3 | Le Chatelier + K builder | Both | 54 KB |
| 23 | SimEngine_AcidBase.html | R3.1 | Titration + pH curves | Both | 70 KB |
| 24 | SimEngine_Electrochem.html | R3.2 | Galvanic + electrolysis | Both | 92 KB |
| 25 | SimEngine_NucleophilicAddition.html | R3.4 | HCN addition + condensation + synthesis | HL | 43 KB |
| 26 | SimEngine_LewisAcidBase.html | R3.4 | Lewis acids/bases + complex ions | HL | 66 KB |
| 27 | rechargeable_battery_simulation.html | R3.2 | Li-Ion vs Lead-Acid | N/A | 39 KB |

**Virtual Labs (6 dedicated lab sims)**

| # | File | IB Topic | Type | Size |
|---|---|---|---|---|
| 28 | SimEngine_CalorimetryLab.html | R1.1 | Hands-on enthalpy measurement | 71 KB |
| 29 | SimEngine_GravimetricLab.html | R2.1 | Precipitation & mass analysis | 59 KB |
| 30 | SimEngine_StoichiometryLab.html | S1.4 | Mole calculation lab | 40 KB |
| 31 | SimEngine_TitrationLab.html | R3.1 | Acid-base titration lab | 69 KB |
| 32 | SimEngine_SpectroscopyLab.html | S3.2 | IR/MS/NMR analysis | 70 KB |
| 33 | SimEngine_VernierLab.html | Tools | Virtual Go Direct sensors | 64 KB |

**Skill Trainers (3 practice tools)**

| # | File | IB Topic | Type | Size |
|---|---|---|---|---|
| 34 | SimEngine_GraphTrainer.html | Tools | Graph interpretation practice | 71 KB |
| 35 | SimEngine_EquipmentTrainer.html | Tools | Equipment recognition + uncertainty | 74 KB |
| 36 | SimEngine_UncertaintyTrainer.html | Tools | Error propagation practice | 61 KB |

**Lab Builder + IA Scaffold**

| # | File | Type | Size |
|---|---|---|---|
| 37 | SimEngine_LabBuilder.html | 10 guided assembly templates + sandbox | 103 KB |
| 38 | SimEngine_IAScaffold.html | IA investigation cycle workflow | 73 KB |
| — | SimEngine_Index.html | Navigation hub for all sims | 25 KB |

**LabBuilder Templates (10 total):**
Distillation, Titration, Recrystallization, Filtration & Evaporation, Coffee-Cup Calorimetry, Paper/TLC Chromatography, Standard Solution Preparation, Serial Dilution, Galvanic Cell Builder, Electrolysis Setup

---

### Data Layer (Phase 3 — Complete)

| File | Records | Description |
|---|---|---|
| `3-Resources/SimEngine/data/elements.json` | 118 elements | Full periodic table with 19 properties each |
| `3-Resources/SimEngine/data/isotopes.json` | 23 elements | Isotope masses, abundances, MS fragmentation |
| `3-Resources/SimEngine/data/ib_data_booklet.json` | 9 sections | Constants, bond enthalpies, E-potentials, Ka/Kb, formation/lattice enthalpies |
| `3-Resources/SimEngine/data/compounds_inorganic.json` | 23 compounds | Ionic compounds with lattice data |
| `3-Resources/SimEngine/data/compounds_organic.json` | 10 compounds | Fuels with combustion enthalpies |
| `3-Resources/SimEngine/data/spectroscopy_correlation.json` | 16 groups | IR/NMR/MS correlation data |
| `3-Resources/SimEngine/data/solubility_rules.json` | 8 rules | Solubility, flame tests, precipitate matrix |
| `3-Resources/SimEngine/data/equipment.json` | 50 items | Lab equipment with uncertainties |
| `3-Resources/SimEngine/data/thermodynamic_data.json` | 27 compounds | Standard enthalpies, entropies, Gibbs energies |
| `3-Resources/SimEngine/data/ghs_hazards.json` | 9 chemicals | GHS pictograms, H-codes, P-codes |

**Core Engine:** `3-Resources/SimEngine/SimEngine_Core.js` — 9 modules (State, Particles, Graph, Controls, Reaction, DataCollector, Titration, Electrochem, VSEPR) + Data loader with fetch/fallback

**Scripts:** `3-Resources/SimEngine/scripts/` — validate_ib_data.py, sync_fallbacks.py, nist_thermodynamic.py, pubchem_elements.py, pubchem_ghs.py

---

### Curriculum Documents & Tools (various locations)

| Resource | Location | Description |
|---|---|---|
| IB Chemistry Guide 2025 | `3-Resources/IB-Guide/IB Chemistry Guide 2025.pdf` | Official syllabus (3.85 MB) |
| Curriculum Map XLSX | `2-Areas/IB_Chemistry_2025_Curriculum.xlsx` | Full curriculum mapping spreadsheet |
| R3 Calendar | `2-Areas/IB_Chemistry_R3_Calendar.html` | Interactive March-April timeline |
| POGIL Comparison Tool | `POGIL_AP_IB_Comparison.html` | 30 AP-IB POGIL adaptations (502 KB) |
| Tutorial Style Guide | `3-Resources/IB_Chemistry_Tutorial_Style_Guide.md` | Design system for all HTML resources |

---

## Curriculum Delivery Timeline — Where Sims Fit

### Already Taught (Before March 27)

| IB Topic | Sims Available | Use Case |
|---|---|---|
| S1.1-S1.5 | 6 sims (States, Nuclear, Electron, Stoich, Gas x2) | Review stations, homework |
| S2.1-S2.4 | 5 sims (Ionic, Metallic, Covalent, VSEPR, IMF) | Review stations, homework |
| S3.1-S3.2 | 3 sims (Periodic, FuncGroups, OrgMech) + SpectroscopyLab | Review stations |
| R1.1-R1.4 | 5 sims (Enthalpy, Hess, BornHaber, EnergyFromFuels, Entropy) | Review, HL extension |
| R2.1-R2.3 | 3 sims (Collision, RateLaw, Equilibrium) | Review stations |
| R3.1 Acid-Base | AcidBase + TitrationLab | Post-summative review |

### Current Teaching Window (March 27 - April 17)

| Date | Content | Sim Support |
|---|---|---|
| March 27-31 | R3.2 Organic Redox | Electrochem, rechargeable_battery |
| April 1-3 | R3.2 continued | Electrochem for practice |
| April 7-9 | R3.3 Electron Sharing (HL) | OrganicMechanisms (SN1/SN2/E1/E2/EA/FRS) |
| April 10 | Senior Skip Day | No class |
| April 14-16 | R3.4 Electron-Pair Sharing (HL) | NucleophilicAddition + LewisAcidBase |
| April 17 | Last new content day | Wrap-up, transition to exam prep |

### Exam Prep (April 17+)

All 38 sims become review tools. Suggested organization:

| Prep Focus | Sims to Assign |
|---|---|
| Paper 1 concept review | StatesOfMatter, GasLaws, Equilibrium, CollisionTheory, IMFComparison |
| Paper 2 calculation practice | Stoichiometry, RateLaw, AcidBase, EntropyGibbs, HessLaw, EnergyFromFuels |
| HL extension topics | BornHaber, EntropyGibbs, LewisAcidBase, NucleophilicAddition, OrganicMechanisms |
| Organic chemistry | FunctionalGroups, OrganicMechanisms, NucleophilicAddition, SpectroscopyLab |
| Data-response practice | Electrochem (E-tables), PeriodicTrends (graph reading), NuclearAtom (mass spec) |
| Lab skills | LabBuilder (10 templates), EquipmentTrainer, UncertaintyTrainer, GraphTrainer |
| IA preparation | IAScaffold, CalorimetryLab, TitrationLab, GravimetricLab |

---

## Coverage Status — All IB Topics

| IB Topic | Subtopics | Sim Coverage | Status |
|---|---|---|---|
| S1.1 Particulate Nature | States of matter | StatesOfMatter | Complete |
| S1.2 Nuclear Atom | Isotopes, mass spec, emission | NuclearAtom | Complete |
| S1.3 Electron Configuration | Orbitals, Aufbau, Hund | ElectronConfig | Complete |
| S1.4 Counting Particles | Mole concept, stoichiometry | Stoichiometry, StoichiometryLab | Complete |
| S1.5 Ideal Gases | PV=nRT, gas behavior | GasLaws, GasLawsLab | Complete |
| S2.1 Ionic Model | Lattice structures, properties | IonicBonding | Complete |
| S2.2 Metallic Model | Sea of electrons, properties | MetallicBonding | Complete |
| S2.3 Covalent Model | Lewis structures, bond enthalpy | CovalentBonding | Complete |
| S2.4 Shape & Polarity | VSEPR, IMF | VSEPR, IMFComparison | Complete |
| S3.1 Periodic Table | Trends, properties | PeriodicTrends | Complete |
| S3.2 Functional Groups | Organic chemistry | FunctionalGroups, SpectroscopyLab | Complete |
| R1.1 Enthalpy Changes | Energy diagrams | EnthalpyProfiles, CalorimetryLab | Complete |
| R1.2 Energy Cycles | Hess's law, Born-Haber | HessLaw, BornHaber | Complete |
| R1.3 Energy from Fuels | Combustion, calorimetry | EnergyFromFuels | Complete |
| R1.4 Entropy & Gibbs | Spontaneity, delta-G | EntropyGibbs | Complete |
| R2.2 Rate of Reaction | Collision theory, rate laws | CollisionTheory, RateLaw | Complete |
| R2.3 Equilibrium | Le Chatelier, Kc | Equilibrium | Complete |
| R3.1 Acids & Bases | pH, titration, buffers | AcidBase, TitrationLab | Complete |
| R3.2 Electron Transfer | Redox, electrochemistry | Electrochem, rechargeable_battery | Complete |
| R3.3 Electron Sharing (HL) | Mechanisms (SN/E/EA/FRS) | OrganicMechanisms | Complete |
| R3.4 Electron-Pair Sharing (HL) | Nucleophilic addition, Lewis, complex ions | NucleophilicAddition, LewisAcidBase | Complete |

**All 18 IB Chemistry subtopics now have dedicated simulation coverage.**

---

## Phase Completion Status

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Core Simulations (27 interactive sims) | Complete |
| Phase 2 | Additional Sims (11 more: labs, trainers, tools) | Complete |
| Phase 3 | Data Layer (10 JSON files, Core.js Data module, scripts) | Complete |
| Phase 4 | Virtual Labs (LabBuilder 10 templates + 6 dedicated labs) | Complete |
| Phase 5 | Vernier Sensor Simulation | Started (VernierLab.html exists) |
| Phase 6 | IA Scaffold | Complete (IAScaffold.html) |
| Phase 7 | Math Skills Trainers | Complete (Graph, Equipment, Uncertainty) |

---

## Quick Reference — File Naming Convention

All SimEngine sims follow: `SimEngine_[TopicName].html`

Located at: `1-Projects/SimEngine/`

Core engine: `3-Resources/SimEngine/SimEngine_Core.js`

Data files: `3-Resources/SimEngine/data/*.json`

Design docs: `1-Projects/SimEngine/docs/plans/[date]-[topic]-design.md`

---

*This document is intended for Matthew's curriculum planning. Upload to Schoology or keep locally for reference. Last updated April 5, 2026.*
