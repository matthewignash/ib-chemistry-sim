# IB Chemistry Simulation Engine — Syllabus-to-Simulation Map

> Companion document to `IB_Chemistry_SimEngine_Architecture.md` v2.0
> Maps every IB Chemistry 2025 syllabus topic to specific simulation labs, data requirements, and Vernier sensor integrations.

---

## How to Read This Document

Each syllabus section includes:
- **Sim Type**: Dynamic (particle/reaction engine), Database (lookup/exploration), Tool (data processing/graphing), or Virtual Lab (drag-and-drop apparatus + sensor)
- **Engine Module**: Which `SimEngine.*` module from the architecture doc powers it
- **Data Needed**: What database entries or JSON files the sim requires
- **Vernier Sensors**: Which Go Direct sensors connect to virtual lab versions
- **SL/HL**: What content is baseline vs. HL extension

---

## Structure 1: Models of the Particulate Nature of Matter

### S1.1 — Introduction to the Particulate Nature of Matter

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **States of Matter Particle View** | Dynamic | `Particles` | Particles in solid (vibrating, fixed lattice), liquid (close but mobile), gas (fast, random, spread). Student toggles between states; energy bar shows Ek distribution. |
| **Heating/Cooling Curve** | Dynamic + Tool | `Particles` + `Graph` | Heat a substance continuously. Graph plots T vs. time with plateaus at phase transitions. Particle view shows behavior at each stage. |

**Data requirements:**
- Melting/boiling points for common substances (water, ethanol, NaCl, iron) → `compounds_inorganic.json`, `compounds_organic.json`
- Specific heat capacities + enthalpy of fusion/vaporization → `ib_data_booklet.json`

**Vernier sensors:** Temperature probe (heating/cooling curves)

**SL/HL:** All SL content. No HL extension for S1.1.

---

### S1.2 — The Nuclear Atom

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Isotope Explorer** | Database | `Elements` | Select an element → see isotopes, mass numbers, abundances. Calculate relative atomic mass from isotopic data. Interactive weighted-average calculator. |
| **Mass Spectrometry Simulator** | Database | `Spectroscopy` | Display mass spectrum of elements (isotope peaks) and simple molecules. Student reads m/z, identifies molecular ion, calculates RAM from peak heights. |
| **Emission Spectrum Viewer** | Database | `Elements` | Select element → see line emission spectrum. Compare hydrogen series (Balmer visible). HL: energy level transitions with ΔE = hf calculation. |

**Data requirements:**
- Isotope data (mass, abundance) for elements 1–36 minimum → `elements.json` (extend with isotope array)
- Hydrogen emission wavelengths (Balmer, Lyman, Paschen series) → `elements.json` or `spectroscopy_correlation.json`
- First ionization energies across periodic table → `elements.json`

**Vernier sensors:** None directly (these are database/calculation sims)

**SL/HL:**
- SL: Isotopes, RAM calculation, atomic emission concept
- HL: Convergence of spectral lines → ionization energy, successive ionization energies, sublevel evidence

---

### S1.3 — Electron Configurations

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Electron Configuration Builder** | Database + Tool | `Elements` | Student builds configurations by filling orbital boxes (Aufbau, Hund, Pauli). System validates. Toggle between full notation, noble gas core notation, and orbital diagrams. |
| **Periodic Table → Configuration Mapper** | Database | `Elements` | Click any element on interactive periodic table → see electron configuration, orbital diagram, and which block/group it sits in. Pattern recognition tool. |

**Data requirements:**
- Electron configurations for all elements → `elements.json` (full and shorthand)
- Orbital energies (qualitative ordering) → hardcoded in engine
- Exceptions (Cr, Cu, etc.) flagged in data

**Vernier sensors:** None

**SL/HL:**
- SL: Configurations up to Z=36, sublevels s/p/d, ion configurations
- HL: Full orbital diagrams with boxes, exceptions to Aufbau, electron configurations of transition metal ions

---

### S1.4 — Counting Particles by Mass: The Mole

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Mole Concept Calculator** | Tool | `Graph` + custom | Interactive stoichiometry workspace. Enter a reaction, set moles/mass/volume of one species → calculates others. Shows mole ratios visually with particle diagrams. |
| **Solution Preparation Sim** | Virtual Lab | `LabBuilder` + `Vernier` | Drag-and-drop: weigh solute on balance, dissolve in volumetric flask, dilute to mark. Calculates concentration. Practices standard solution preparation (Tool 1). |
| **Serial Dilution Sim** | Virtual Lab | `LabBuilder` | Prepare a stock solution, then perform serial dilutions with pipettes and volumetric flasks. Track concentration at each step. |

**Data requirements:**
- Molar masses for all elements → `elements.json`
- Common compound molar masses → derive from formula + element data
- Avogadro's constant, molar volume at STP → `ib_data_booklet.json`

**Vernier sensors:** Electronic balance simulation (mass measurement precision ±0.01 g)

**SL/HL:**
- SL: Mole calculations, concentration (mol/dm³), molar volume of gases
- HL: Atom economy, combined stoichiometry problems

---

### S1.5 — Ideal Gases

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Gas Laws Explorer** | Dynamic | `Particles` + `Graph` | **Phase 1 build.** Full particle simulation with P, V, T, n sliders. Real-time PV=nRT verification. Maxwell-Boltzmann distribution curve. |
| **Boyle's Law Lab** | Virtual Lab | `Particles` + `LabBuilder` + `Vernier` | Gas pressure sensor connected to syringe. Student compresses gas → records P vs. V → plots to verify inverse relationship. |
| **Charles's Law Lab** | Virtual Lab | `Particles` + `LabBuilder` + `Vernier` | Temperature probe + gas collection apparatus. Heat gas → record V vs. T → extrapolate to absolute zero. |
| **Real Gas Deviations (HL)** | Dynamic | `Particles` | Van der Waals equation. Show deviations at high P / low T. Compare ideal vs. real gas behavior graphs. IMF visualization at particle level. |

**Data requirements:**
- Gas constant R → `ib_data_booklet.json`
- Van der Waals constants (a, b) for common gases (He, H₂, N₂, CO₂, NH₃) → `compounds_inorganic.json`
- Molar masses for common gases → `elements.json` / `compounds_inorganic.json`

**Vernier sensors:** Gas pressure sensor, temperature probe

**SL/HL:**
- SL: PV=nRT, gas laws, KMT postulates, molar volume
- HL: Van der Waals, real gas deviations, conditions favoring ideal behavior

---

## Structure 2: Models of Bonding and Structure

### S2.1 — The Ionic Model

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Ionic Bonding Visualizer** | Dynamic | `Particles` + `Elements` | Animate electron transfer between metal and non-metal atoms. Show resulting ion sizes (ionic radius vs. atomic radius). Build crystal lattice. |
| **Lattice Energy Explorer (HL)** | Database + Tool | `Elements` | Compare lattice energies based on ion charge and size. Born-Haber cycle diagram builder. |
| **Ionic Compound Properties Lab** | Virtual Lab | `LabBuilder` + `Vernier` | Test conductivity of solid vs. molten vs. aqueous ionic compounds. Measure melting point. |

**Data requirements:**
- Ionic radii for common ions → `elements.json` (ionic radius field)
- Electronegativity values → `elements.json`
- Lattice energies for common ionic compounds → `ib_data_booklet.json`
- Conductivity values for solids/melts/solutions → `compounds_inorganic.json`

**Vernier sensors:** Conductivity probe, temperature probe

**SL/HL:**
- SL: Ionic bond formation, properties of ionic compounds, electron transfer
- HL: Born-Haber cycles, lattice enthalpy trends, polarization

---

### S2.2 — The Covalent Model

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Lewis Structure Builder** | Database + Tool | `Elements` + `VSEPR` | Input a molecular formula → system guides Lewis structure drawing. Count valence electrons, place bonds, add lone pairs, check octets. |
| **VSEPR Shape Predictor** | Dynamic | `VSEPR` | From Lewis structure → predict electron domain geometry and molecular geometry. 3D rotatable model. Show bond angles. |
| **Polarity Analyzer** | Database | `Elements` + `VSEPR` | Calculate EN differences → determine bond polarity → analyze molecular polarity from geometry. Vector arrow visualization. |
| **Bond Enthalpy Calculator** | Tool | custom | Enter a balanced equation → look up bond enthalpies → calculate ΔH. Compare bonds broken vs. formed. |

**Data requirements:**
- Electronegativity (Pauling) for all elements → `elements.json`
- Covalent radii → `elements.json`
- Bond enthalpies → `ib_data_booklet.json`
- VSEPR geometry rules → hardcoded in engine
- Bond lengths for common bonds → `ib_data_booklet.json` or `compounds_organic.json`

**Vernier sensors:** None (conceptual/calculation sims)

**SL/HL:**
- SL: Lewis structures, VSEPR (up to 6 electron domains), bond polarity, molecular polarity
- HL: Formal charge, resonance structures, expanded octets, hybridization (sp, sp², sp³), sigma/pi bonds

---

### S2.3 — The Metallic Model

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Metallic Bonding Visualizer** | Dynamic | `Particles` | Sea of delocalized electrons around fixed cation lattice. Animate electrical conductivity (electron flow under applied field), malleability (layers sliding), thermal conductivity. |
| **Alloy Structure Comparison** | Dynamic | `Particles` | Compare pure metal lattice vs. alloy (substitutional and interstitial). Show why alloys are harder — disrupted layer sliding. |

**Data requirements:**
- Metal properties (melting points, conductivity values) for common metals → `elements.json`
- Alloy compositions (bronze, steel, brass) → `compounds_inorganic.json`

**Vernier sensors:** Conductivity probe (comparing metallic vs. ionic vs. molecular), temperature probe

**SL/HL:**
- SL: Metallic bond model, properties explained by delocalized electrons
- HL: Band theory conceptual, transition metal properties (variable oxidation states, colored compounds, catalytic behavior)

---

### S2.4 — From Models to Materials

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **IMF Comparison Tool** | Database | `Elements` + `Compounds` | Select two substances → compare IMF types (London, dipole-dipole, H-bonding) → predict relative boiling points. Animated particle-level view showing IMF interactions. |
| **Boiling Point Trend Explorer** | Database + Tool | `Elements` + `Graph` | Plot boiling points of homologous series, Group 16/17 hydrides, alkanes vs. alcohols. Identify anomalies (H₂O, HF, NH₃). |
| **Chromatography Sim** | Virtual Lab | `LabBuilder` | Paper/TLC chromatography. Spot samples, develop, calculate Rf values. Demonstrates partition between phases. |

**Data requirements:**
- Boiling points for homologous series (alkanes C1–C10, alcohols C1–C6, carboxylic acids C1–C4) → `compounds_organic.json`
- Group 14–17 hydride boiling points → `compounds_inorganic.json`
- Molecular masses, polarity data, H-bonding capability flags → `compounds_organic.json`
- Rf values for common substances in standard solvents → `compounds_organic.json` (extend)

**Vernier sensors:** Temperature probe (for boiling point determination lab)

**SL/HL:**
- SL: London forces, dipole-dipole, hydrogen bonding; relating IMFs to physical properties
- HL: Explaining anomalous boiling points quantitatively, Raoult's law concept

---

## Structure 3: Classification of Matter

### S3.1 — The Periodic Table: Classification of Elements

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Periodic Trends Explorer** | Database + Tool | `Elements` + `Graph` | Interactive periodic table. Click property (EN, atomic radius, IE, EA, melting point) → color-coded heatmap + trend line across period/down group. |
| **First Ionization Energy Plotter** | Database + Tool | `Elements` + `Graph` | Plot IE₁ vs. atomic number for first 36 elements. Student identifies patterns, explains anomalies (Be→B drop, N→O drop). |
| **Successive IE Analyzer (HL)** | Database + Tool | `Elements` + `Graph` | Plot successive IEs for a given element → log scale → identify electron shell breaks. Deduce group from graph. |
| **Transition Metal Properties** | Database | `Elements` | Explore variable oxidation states, colored compounds, catalytic activity. Database of common TM complexes with colors and oxidation states. |

**Data requirements:**
- All periodic trends data for Z=1–118 → `elements.json` (EN, radius, IE₁, EA, melting/boiling points, density)
- Successive ionization energies for Z=1–20 minimum → `elements.json` (extend with IE array)
- Transition metal complex data (colors, oxidation states, magnetic properties) → `compounds_inorganic.json` (extend)
- Atomic radii (empirical + covalent + van der Waals) → `elements.json`

**Vernier sensors:** None (database exploration sims)

**SL/HL:**
- SL: Periodic trends (EN, atomic radius, IE₁, metallic character), group properties
- HL: Successive IEs, electron affinity trends, transition metals (variable oxidation, colored ions, catalysis), d-orbital splitting concept

---

### S3.2 — Functional Groups: Classification of Organic Compounds

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Functional Group Identifier** | Database | `Spectroscopy` + `Compounds` | Browse organic molecules by functional group. See structure, name (IUPAC), properties. Test understanding with "identify the functional group" exercises. |
| **Homologous Series Explorer** | Database + Tool | `Compounds` + `Graph` | Select a series (alkanes, alcohols, carboxylic acids) → plot properties (bp, mp, density, solubility) vs. carbon number. Identify trends. |
| **Isomer Builder** | Database + Tool | custom | Given a molecular formula → build all possible structural isomers. System validates each structure. HL: stereoisomers (E/Z, optical). |
| **Reaction Pathways Map** | Database | custom | Interactive flowchart of organic reactions. Click a functional group → see possible reactions → products. HL: mechanisms animated. |
| **Spectroscopy ID Lab** | Database | `Spectroscopy` | **Core database sim.** Unknown compound → run IR, MS, ¹H NMR → identify structure. Full interaction model from architecture doc Section 8. |

**Data requirements:**
- Full organic compound database with functional groups, IUPAC names, structural formulas → `compounds_organic.json`
- IR correlation table (functional group → wavenumber range) → `spectroscopy_correlation.json`
- ¹H NMR chemical shift correlation table → `spectroscopy_correlation.json`
- MS fragmentation patterns → `compounds_organic.json` (per-compound)
- IR, MS, NMR peak data for 30–40 IB-relevant compounds → `compounds_organic.json`
- Reaction conditions and products for IB organic reactions → new file `reactions_organic.json`
- Index of hydrogen deficiency formula → hardcoded

**Vernier sensors:** None for database sims; SpectroVis/colorimeter for colorimetry-related functional group tests

**SL/HL:**
- SL: Alcohols, carboxylic acids, aldehydes, ketones, esters, amines, amides, halogenoalkanes; IUPAC naming; structural formulas; IR + MS identification
- HL: ¹H NMR (shifts, splitting, integration), IHD, reaction mechanisms (nucleophilic substitution, electrophilic addition, elimination, condensation), stereoisomerism

---

## Reactivity 1: What Drives Chemical Reactions?

### R1.1 — Measuring Enthalpy Changes

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Calorimetry Lab** | Virtual Lab | `LabBuilder` + `Vernier` + `IAData` | Polystyrene cup calorimeter. Measure temperature change during neutralization, dissolution, or combustion. Calculate q = mcΔT and ΔH. |
| **Enthalpy Level Diagram Builder** | Tool | `Graph` + custom | Draw enthalpy level diagrams for exothermic/endothermic reactions. Label ΔH, activation energy, reactants, products. |
| **Hess's Law Calculator** | Tool | custom | Enter target reaction + given reactions → manipulate (reverse, multiply) → sum to get ΔH. Visual enthalpy cycle. |
| **Bond Enthalpy Calculator** | Tool | custom | Enter equation → break bonds (endothermic) → form bonds (exothermic) → calculate ΔH from bond enthalpies. Animated bond breaking/forming. |

**Data requirements:**
- Standard enthalpy of formation (ΔHf°) → `ib_data_booklet.json`
- Standard enthalpy of combustion (ΔHc°) → `ib_data_booklet.json`
- Bond enthalpies (mean) → `ib_data_booklet.json`
- Specific heat capacity of water (4.18 J g⁻¹ K⁻¹) → `ib_data_booklet.json`
- Enthalpy of neutralization data → `ib_data_booklet.json`

**Vernier sensors:** Temperature probe (calorimetry is the #1 use case)

**SL/HL:**
- SL: q = mcΔT, enthalpy of combustion/neutralization/solution, Hess's law, bond enthalpy calculations
- HL: Born-Haber cycles, lattice enthalpy, enthalpy of atomization/hydration/solution cycle

---

### R1.2 — Energy Cycles in Reactions (HL)

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Born-Haber Cycle Builder** | Tool | custom | Drag-and-drop enthalpy steps to construct Born-Haber cycle for ionic compounds. Calculate lattice enthalpy. |
| **Enthalpy Cycle Solver** | Tool | custom | General Hess's law cycle builder — works for any multi-step enthalpy problem. Student draws arrows, enters values, solves for unknown. |

**Data requirements:**
- Ionization energies (first + successive) → `elements.json`
- Electron affinities → `elements.json`
- Lattice enthalpies for common ionic compounds → `ib_data_booklet.json`
- Enthalpy of atomization → `ib_data_booklet.json`
- Enthalpy of hydration → `compounds_inorganic.json`

**Vernier sensors:** None (calculation tools)

**SL/HL:** HL only

---

### R1.3 — Energy from Fuels

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Combustion Calorimetry Lab** | Virtual Lab | `LabBuilder` + `Vernier` | Burn a fuel (spirit burner) under a calorimeter. Measure mass change + temperature rise. Calculate enthalpy of combustion. Compare to data booklet. |
| **Fuel Efficiency Comparison** | Database + Tool | `Compounds` + `Graph` | Compare enthalpy of combustion per gram and per mole across fuels (alkanes, alcohols, hydrogen). Calculate specific energy and energy density. |

**Data requirements:**
- Enthalpy of combustion for common fuels → `ib_data_booklet.json`
- Density and molar mass of fuels → `compounds_organic.json`
- Specific energy and energy density values → derived from above

**Vernier sensors:** Temperature probe

**SL/HL:**
- SL: Enthalpy of combustion, incomplete combustion, specific energy
- HL: Comparing fuels quantitatively, biofuels, fossil fuel alternatives

---

### R1.4 — Entropy and Spontaneity (HL)

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Entropy Visualizer** | Dynamic | `Particles` | Particle simulation showing microstates. Remove partition → gas expands → show increase in positional entropy. Compare S values: solid < liquid < gas. |
| **Gibbs Free Energy Calculator** | Tool | custom | Enter ΔH, ΔS, T → calculate ΔG. Interactive graph of ΔG vs. T to find spontaneity crossover temperature. |
| **Spontaneity Predictor** | Tool + Database | custom + `Compounds` | Given a reaction → look up ΔH° and ΔS° → predict spontaneity at given T. Four quadrants visualization (ΔH vs. ΔS signs). |

**Data requirements:**
- Standard entropy values S° → `ib_data_booklet.json` or NIST via NistChemPy
- Standard enthalpy of formation → `ib_data_booklet.json`
- Gibbs free energy of formation → `compounds_inorganic.json`, `compounds_organic.json`

**Vernier sensors:** None (conceptual/calculation sims)

**SL/HL:** HL only

---

## Reactivity 2: How Much, How Fast, and How Far?

### R2.1 — How Much? The Amount of Chemical Change

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Stoichiometry Workspace** | Tool | custom | Balanced equation → enter known quantity → calculate all species amounts. Limiting reagent identification. Percentage yield calculator. |
| **Limiting Reagent Visualizer** | Dynamic | `Particles` | Particle-level view of reaction with unequal moles. Animate reaction proceeding → show excess reagent left over. |
| **Titration Sim** | Virtual Lab | `LabBuilder` + `Vernier` | Full titration setup: burette, conical flask, indicator (or pH probe). Add titrant → monitor pH → endpoint detection. Back-titration option. |
| **Gravimetric Analysis Lab** | Virtual Lab | `LabBuilder` | Precipitation, filtration, drying, weighing. Calculate moles from mass of precipitate. |

**Data requirements:**
- Molar masses → derived from `elements.json`
- Indicator color change ranges (phenolphthalein, methyl orange, bromothymol blue) → `compounds_inorganic.json`
- Ka values for indicators → `compounds_inorganic.json`
- Solubility rules (for gravimetric) → `solubility_rules.json`

**Vernier sensors:** pH sensor + drop counter (titration), electronic balance, temperature probe

**SL/HL:**
- SL: Mole ratios, limiting reagent, theoretical/experimental yield, percentage yield
- HL: Atom economy, back-titration, gravimetric analysis

---

### R2.2 — How Fast? The Rate of Chemical Change

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Rate of Reaction Explorer** | Dynamic | `Particles` + `Graph` | Particle collision simulation. Adjust T, concentration, surface area, catalyst → see effect on collision frequency and energy. Graph concentration vs. time. |
| **Maxwell-Boltzmann & Activation Energy** | Dynamic + Tool | `Particles` + `Graph` | Show M-B distribution. Shade area above Ea. Change T → distribution shifts → more particles exceed Ea. Add catalyst → Ea line moves left. |
| **Rate Law Determination Lab** | Virtual Lab | `LabBuilder` + `Vernier` + `IAData` | Method of initial rates: vary concentrations, measure initial rate (by colorimeter, gas pressure, or temperature). Determine rate law from data. |
| **Concentration vs. Time Plots** | Tool | `Graph` | Given rate law → plot [A] vs. t, ln[A] vs. t, 1/[A] vs. t. Student identifies reaction order from graph linearity. |
| **Arrhenius Equation Plotter (HL)** | Tool | `Graph` | Plot ln(k) vs. 1/T. Calculate Ea from slope. |

**Data requirements:**
- Activation energies for common reactions → `ib_data_booklet.json` or `compounds_inorganic.json`
- Rate constant values at various temperatures → curated dataset for specific reactions
- Catalyst effect data (Ea with/without) → custom data entries

**Vernier sensors:** Temperature probe, gas pressure sensor, colorimeter/SpectroVis, conductivity probe

**SL/HL:**
- SL: Factors affecting rate, collision theory, Maxwell-Boltzmann, catalysts, rate of reaction measurement
- HL: Rate expression, order of reaction, rate constant, Arrhenius equation, mechanisms and rate-determining step

---

### R2.3 — How Far? The Extent of Chemical Change

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Dynamic Equilibrium Visualizer** | Dynamic | `Particles` + `Equilibrium` + `Graph` | Two-flask system showing forward/reverse reactions. Rate graphs converge. Concentration vs. time shows equilibrium establishment. |
| **Le Chatelier's Principle Lab** | Dynamic | `Equilibrium` + `Graph` | At equilibrium: change [concentration], T, or P → watch system shift. Q vs. K comparison. Real examples (N₂O₄/NO₂ color, CoCl₄²⁻/Co(H₂O)₆²⁺). |
| **ICE Table Solver** | Tool | `Equilibrium` | Enter reaction + initial concentrations + K → calculate equilibrium concentrations via ICE table. Student fills in the table, system checks. |
| **Kp Calculator (HL)** | Tool | `Equilibrium` | Convert between Kc and Kp. Calculate partial pressures at equilibrium. |
| **Equilibrium Constant Lab** | Virtual Lab | `LabBuilder` + `Vernier` | Colorimeter to measure [FeSCN²⁺] at equilibrium. Vary initial concentrations → calculate Kc from data. |

**Data requirements:**
- Equilibrium constant values (Kc) for IB-standard reactions → `ib_data_booklet.json`
- Enthalpy values for equilibrium reactions (to predict T effect) → `ib_data_booklet.json`
- Molar absorptivities for colored equilibrium species (Beer-Lambert) → `compounds_inorganic.json`

**Vernier sensors:** Colorimeter/SpectroVis, temperature probe, gas pressure sensor

**SL/HL:**
- SL: Dynamic equilibrium concept, Kc expression, Le Chatelier's principle (qualitative), Q vs. K
- HL: Kc quantitative problems, Kp, relationship between K and ΔG° (ΔG° = -RT ln K)

---

## Reactivity 3: What Are the Mechanisms of Chemical Change?

### R3.1 — Proton Transfer Reactions (Acid-Base)

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Acid-Base Particle View** | Dynamic | `Particles` + `Equilibrium` | Brønsted-Lowry proton transfer animated at particle level. Strong acid = complete ionization. Weak acid = equilibrium (show both ionized and un-ionized). |
| **pH Calculator** | Tool | `Equilibrium` | Enter acid/base identity + concentration → calculate pH. Strong: direct. Weak: from Ka/Kb. Shows the calculation steps. |
| **pH Scale Explorer** | Database | `Compounds` | Interactive pH scale with common substances placed on it. Zoom in to see [H⁺] and [OH⁻] at each pH. |
| **Titration Curve Simulator** | Virtual Lab + Tool | `LabBuilder` + `Vernier` + `Equilibrium` + `Graph` | Full titration with real-time pH curve. Strong/strong, strong/weak, weak/strong, weak/weak. Identify equivalence point, half-equivalence (pKa), buffer region. |
| **Buffer Solution Lab** | Virtual Lab | `LabBuilder` + `Vernier` | Prepare a buffer (weak acid + conjugate base). Add small amounts of acid or base → show pH barely changes. Compare to unbuffered solution. |
| **Indicator Selection Tool** | Database + Tool | `Compounds` | Given a titration type → recommend indicator based on pH range at equivalence point. Color change visualization. |

**Data requirements:**
- Ka values for weak acids → `ib_data_booklet.json`
- Kb values for weak bases → derived from Ka and Kw
- Kw = 1.0 × 10⁻¹⁴ at 25°C → `ib_data_booklet.json`
- pKa values for indicators → `compounds_inorganic.json`
- pH of common substances → `compounds_inorganic.json` / `compounds_organic.json`

**Vernier sensors:** pH sensor + drop counter (titration), temperature probe

**SL/HL:**
- SL: Brønsted-Lowry theory, strong/weak acids and bases, pH scale, pH of strong acids/bases, acid-base reactions, indicators
- HL: Ka/Kb calculations, pH of weak acids/bases, buffer solutions (Henderson-Hasselbalch), titration curves, half-equivalence point, polyprotic acids

---

### R3.2 — Electron Transfer Reactions (Redox)

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Oxidation State Trainer** | Tool | custom | Enter a compound → assign oxidation states to each atom. System validates using rules. Identify which species are oxidized/reduced. |
| **Half-Equation Balancer** | Tool | custom | Enter a redox reaction → split into half-equations → balance electrons → combine. Student does the work, system checks. |
| **Galvanic Cell Builder** | Virtual Lab | `Electrochem` + `LabBuilder` + `Vernier` | Drag electrodes into beakers, add electrolytes, connect with salt bridge and wire. System calculates E°cell. Animate electron flow and ion migration. |
| **Electrolysis Simulator** | Virtual Lab | `Electrochem` + `LabBuilder` + `Vernier` | Set up electrolysis cell. Choose electrolyte → predict products at each electrode. HL: Faraday's law calculations. |
| **Activity Series Explorer** | Database | `Electrochem` | Rank metals by activity. Predict displacement reactions. Compare to standard electrode potentials. |
| **Electrochemical Cell EMF Calculator** | Tool | `Electrochem` | Select two half-cells → calculate E°cell. Predict spontaneity. Show cell diagram notation. |

**Data requirements:**
- Standard electrode potentials (E°) → `ib_data_booklet.json` (~40 half-reactions)
- Activity/reactivity series → derived from E° values
- Electrolysis product rules (aqueous solutions) → hardcoded or `ib_data_booklet.json`
- Faraday constant → `ib_data_booklet.json`

**Vernier sensors:** Voltage probe, ORP sensor, conductivity probe

**SL/HL:**
- SL: Oxidation states, redox identification, activity series, simple galvanic cells, electrolysis basics
- HL: Standard electrode potentials, E°cell calculations, electrolysis of aqueous solutions, Faraday's law, electroplating

---

### R3.3 — Electron Sharing Reactions (HL)

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Nucleophilic Substitution Mechanism** | Dynamic | custom | Animated SN1 and SN2 mechanisms. Show nucleophile approach, transition state, leaving group departure. Compare rate expressions. |
| **Electrophilic Addition Mechanism** | Dynamic | custom | Animated addition of HBr to alkene. Show carbocation intermediate. Markovnikov's rule visualization. |
| **Elimination vs. Substitution** | Dynamic + Tool | custom | Given conditions (strong base/weak nucleophile vs. weak base/strong nucleophile) → predict E1/E2/SN1/SN2 pathway. Decision tree tool. |
| **Radical Substitution (Free Radical)** | Dynamic | custom | Animated chain mechanism: initiation (homolytic fission, UV), propagation (radical + molecule), termination (radical + radical). |

**Data requirements:**
- Bond dissociation energies (for radical reactions) → `ib_data_booklet.json`
- Nucleophilicity/basicity strength tables → `compounds_organic.json` (extend)
- Leaving group ability ranking → hardcoded
- Reaction conditions database (reagents, solvents, temperatures) → `reactions_organic.json`

**Vernier sensors:** None (mechanism visualization sims)

**SL/HL:** HL only

---

### R3.4 — Electron-Pair Sharing Reactions (HL)

| Simulation | Sim Type | Engine Module | Description |
|---|---|---|---|
| **Nucleophilic Addition Mechanism** | Dynamic | custom | Animated addition of HCN to carbonyl. Show curly arrow mechanism. |
| **Condensation/Hydrolysis Reactions** | Dynamic | custom | Ester formation (condensation) and ester hydrolysis animated. Show water molecule formed/consumed. |
| **Reaction Pathway Builder** | Database + Tool | custom | Full organic synthesis pathways. Student chains reactions: alcohol → halogenoalkane → amine or alcohol → aldehyde → carboxylic acid → ester. |

**Data requirements:**
- Organic reaction database (reactants + conditions → products) → `reactions_organic.json`
- Functional group interconversion map → `reactions_organic.json`
- Named reagents and conditions → `reactions_organic.json`

**Vernier sensors:** None (mechanism sims)

**SL/HL:** HL only

---

## Tool 1 & Tool 2: Experimental Techniques and Technology

These cross-cutting skills map to Virtual Lab simulations throughout:

| IB Technique | SimEngine Integration | Key Sims |
|---|---|---|
| Preparing standard solutions | `LabBuilder` + balance + volumetric flask | S1.4 Solution Preparation |
| Dilutions | `LabBuilder` + pipettes + volumetric flasks | S1.4 Serial Dilution |
| Distillation / Reflux | `LabBuilder` + distillation apparatus template | S2.4, S3.2 (separating organic mixtures) |
| Chromatography | `LabBuilder` + TLC/paper chromatography | S2.4 Chromatography Sim |
| Calorimetry | `LabBuilder` + temp probe + polystyrene cup | R1.1 Calorimetry Lab |
| Titration | `LabBuilder` + burette + pH sensor + drop counter | R2.1 Titration Sim, R3.1 Titration Curves |
| Electrochemical cells | `LabBuilder` + voltage probe + electrodes | R3.2 Galvanic Cell Builder |
| Colorimetry / Spectrophotometry | `LabBuilder` + SpectroVis/colorimeter | R2.2 Rate Law Lab, R2.3 Equilibrium Lab |
| Recrystallization | `LabBuilder` + hot plate + filter | S2.4 (purity/separation) |
| Melting point determination | `LabBuilder` + temp probe + capillary tube | S2.1 / S2.4 (identifying substances) |
| Drying to constant mass | `LabBuilder` + balance + oven/desiccator | R2.1 Gravimetric Analysis Lab |
| Separation of mixtures | `LabBuilder` + separating funnel / filtration | S2.4, S3.2 (organic separation techniques) |
| Physical & digital molecular modelling | `VSEPR` + 3D renderer | S2.2 VSEPR Shape Predictor |

### Tool 3: Mathematics Skills Integration

These skills are embedded across the `SimEngine.Graph`, `SimEngine.IAProcess`, and `SimEngine.GraphicalAnalysis` modules:

| Math Skill (from IB Guide) | SimEngine Integration |
|---|---|
| Logarithmic functions | Arrhenius plots (ln k vs. 1/T), pH calculations, linearization of rate data |
| Exponential functions (HL) | First-order rate decay, radioactive decay curves |
| Rates of change from tabulated data | Tangent line tool in Graphical Analysis, instantaneous rate from concentration-time graphs |
| Mean and range | Data processing workspace (repeated trials), Graphical Analysis statistics |
| Scientific notation | All calculator/display modules, Graph axis formatting |
| Direct and inverse proportionality | Gas law graphs (P vs. V, V vs. T), Beer-Lambert law, rate vs. concentration |
| Graphical representation | Core to `Graph` engine — every sim with quantitative output |
| Uncertainty and error propagation | `IAProcess` module — absolute, percentage, propagated uncertainties |

### Inquiry Process Skills Integration

| Inquiry Skill | SimEngine Integration |
|---|---|
| **Inquiry 1: Exploring and designing** | `IADesign` module — research question, variables table, methodology planning |
| **Inquiry 2: Collecting and processing data** | `IAData` + `IAProcess` + `GraphicalAnalysis` — data tables, graphs, statistics, uncertainty |
| **Inquiry 3: Concluding and evaluating** | `IAEval` module — percentage error, systematic/random error identification, improvements |

---

## Math Skills Trainers — Standalone Practice Modules (Phase 7)

These standalone practice tools map to Tool 3 (Mathematics) and the data processing skills students need for the IA. They exist as independent sims students can drill anytime, AND as embedded checks within virtual labs.

### Uncertainty & Error Propagation Trainer (`SimEngine.MathTrainer.Uncertainty`)

| Practice Mode | Skills Covered | Syllabus Connection |
|---|---|---|
| Reading instrument uncertainty | Identify reading ± absolute uncertainty from equipment visuals | Tool 1 (measuring variables), all virtual labs |
| Absolute & percentage uncertainty | Convert between absolute/percentage, calculate from repeated trials | R2.1, IA data processing |
| Error propagation | Add absolute (±) for add/subtract, add % for multiply/divide, multi-step | IA Processing criterion, R1.1 calorimetry, R2.1 titrations |
| Percentage error & accuracy | Experimental vs. literature comparison, systematic vs. random error | IA Evaluation criterion |

**Data requirements:** Problem generation uses real chemistry values from `ib_data_booklet.json` and `compounds_organic.json`. Needs new file `math_trainer_problems.json` for scenario banks.

### Graph Interpretation Trainer (`SimEngine.MathTrainer.Graphs`)

| Sub-module | Skills Covered | Syllabus Connection |
|---|---|---|
| **A: Reading values & trends** | Extract data points, identify proportionality, describe trends | Tool 3 (direct/inverse proportionality), S1.5, R2.2, R2.3 |
| **B: Gradient & intercept** | Draw best-fit, calculate Δy/Δx, find y-intercept, derive quantities | Tool 3 (rates of change), R2.2 (initial rate), S1.5 (absolute zero) |
| **C: Linearization (HL)** | Transform data (ln, 1/x), identify linear form, determine order/Ea | R2.2 HL (rate expression, Arrhenius), R1.4 HL (Gibbs) |
| **D: Sketching & predicting** | Predict graph changes from scenario descriptions | R2.3 (Le Chatelier graphs), R2.2 (M-B changes), R3.1 (titration curves) |

**Data requirements:** Scenario banks in `math_trainer_problems.json` — all graphs generated from chemistry simulation data, not abstract math.

### Equipment Recognition & Selection (`SimEngine.EquipmentTrainer`)

| Practice Mode | Skills Covered | Syllabus Connection |
|---|---|---|
| **Equipment ID (flashcards)** | Name equipment from photos and illustrations, toggle between visual styles | Tool 1 (experimental techniques) |
| **Selection from directions** | Read IB-style procedure → pick all needed equipment from catalog | Tool 1 (applying techniques), IA Design criterion |
| **Precision & appropriateness** | Choose correct equipment for precision needed (pipette vs. cylinder) | Tool 1 (measuring variables), uncertainty concepts |
| **Assembly practice** | Arrange equipment in correct configuration for standard setups | Tool 1 (distillation, reflux, titration, etc.) |

**Data requirements:** Equipment photo library (~50 items), `equipment.json` with dual visual references (SVG + photo), procedure bank in `equipment_scenarios.json`.

**Visual assets:** Every equipment item has two representations — rough.js SVG illustration (consistent with style guide) and real photograph — toggled with a single button.

### Embedded Math Checks in Virtual Labs

In addition to standalone trainers, every virtual lab includes embedded math checks at natural breakpoints:

| Lab Stage | Embedded Check |
|---|---|
| Data collection | State the uncertainty of the instrument before recording |
| After raw data | Calculate mean from repeat trials |
| Processing | Propagate uncertainty through calculation step-by-step |
| Graph creation | Choose axes, scales, labels manually (no auto-generation) |
| Graph analysis | Draw best-fit line, calculate gradient |
| Evaluation | Calculate percentage error against literature value |

Teacher can toggle checks on/off per lab and set strict mode (must be correct to proceed) vs. advisory mode (feedback only).

---

## Data Collection Summary — What You Need to Build

### Priority 1: Core Data Files (needed for Phase 1–2)

| File | Records | Primary Source | Effort |
|---|---|---|---|
| `elements.json` | 118 elements × ~25 properties | PubChem CSV download | Low — one CSV download + transform script |
| `ib_data_booklet.json` | ~150 values (bond enthalpies, E°, ΔHf°, ΔHc°, Ka, specific heats) | IB Data Booklet 2025 (manual) | Medium — manual entry but critical for accuracy |

### Priority 2: Compound & Reaction Data (needed for Phase 2–3)

| File | Records | Primary Source | Effort |
|---|---|---|---|
| `compounds_organic.json` | ~40 organic compounds with physical + spectral data | PubChem + NIST + SDBS | Medium-High — batch extraction + manual curation |
| `compounds_inorganic.json` | ~60 inorganic compounds/ions | PubChem + NIST | Medium |
| `spectroscopy_correlation.json` | IR table (~30 entries), NMR table (~15 entries), MS rules | Textbook tables + NIST | Low — static tables |
| `reactions_organic.json` | ~25 IB organic reactions with conditions + products | IB Guide + textbook | Medium — manual entry |
| `solubility_rules.json` | ~20 rules | Textbook | Low — static rules |
| `flame_test_colors.json` | ~10 cations | Textbook | Low — static data |

### Priority 3: Extended Data (needed for Phase 3–5)

| File | Records | Primary Source | Effort |
|---|---|---|---|
| `elements.json` extensions | Successive IEs (Z=1–20), isotope data | NIST + WebElements | Medium |
| `compounds_organic.json` extensions | Full IR/MS/NMR peak data for 40 compounds | SDBS + NIST WebBook | High — most labor-intensive data task |
| `equipment.json` | ~50 equipment items with SVG references, connection rules | Manual entry | Medium |

### Priority 4: Virtual Lab Data (needed for Phase 4–6)

| File | Records | Primary Source | Effort |
|---|---|---|---|
| `equipment.json` | SVG assets + connection validation rules | Custom creation | High — needs artwork |
| Equipment photos | ~50 standardized photos of lab equipment | School lab photography | Medium — consistent lighting/background needed |
| Vernier sensor specs | 10 sensors with calibration procedures, ranges | Vernier documentation | Low-Medium |
| Lab template configurations | ~10 pre-built apparatus setups | Manual design | Medium |

### Priority 5: Math Trainer Data (needed for Phase 7)

| File | Records | Primary Source | Effort |
|---|---|---|---|
| `math_trainer_problems.json` | ~200 problems across all modes (uncertainty, graphs, equipment) | Custom creation using real chemistry values | Medium — problems auto-generate from templates but need seed scenarios |
| `equipment_scenarios.json` | ~20 IB-style procedures for equipment selection practice | Adapted from IB past papers + Vernier labs | Low-Medium |
| Graph scenario bank | ~40 chemistry graphs with associated questions | Generated from simulation engine data | Medium — need representative data for each graph type |

---

## Database Extraction Scripts Needed

1. **`extract_pubchem_elements.py`** — Download PubChem periodic table CSV → parse → output `elements.json`
2. **`extract_nist_thermo.py`** — Use NistChemPy to batch-query thermodynamic data for ~50 compounds → merge into compound JSON files
3. **`extract_sdbs_nmr.py`** — Scrape/parse SDBS peak lists for target compounds → merge into `compounds_organic.json`
4. **`validate_ib_data.py`** — Cross-reference all data against IB Data Booklet values; flag discrepancies; override with booklet values where they differ
5. **`build_sim_data.py`** — Combine all JSON data files into embeddable inline data blocks for each single-file HTML simulation

---

## Vernier Lab Manual Integration — Recommendation

**Yes, loading a Vernier lab manual would significantly strengthen this project.** Here's why:

### What a Vernier manual provides that we don't currently have:

1. **Tested procedures with specific sensor settings** — Exact sample rates, collection durations, and calibration points that work for each experiment type. Right now our sensor specs are generic; a lab manual gives us optimized parameters for each specific lab.

2. **Data collection methodology** — How to structure data collection (time-based vs. event-based vs. drop counting) for each experiment. This directly maps to our `SimEngine.Vernier` sensor setup simulation.

3. **Expected data ranges** — Real experimental data that we can use to calibrate our simulation's data generation. If the Vernier manual says "typical temperature change is 8–12°C for this neutralization," we can tune our random data generator accordingly.

4. **Troubleshooting scenarios** — Common issues students encounter with each sensor in each experiment. These become our simulated troubleshooting prompts.

5. **Pre-lab questions and analysis prompts** — These map directly to our IA scaffold's guided prompts and can inform the formative feedback the system gives.

### How to use it:

- Cross-reference Vernier experiments with our syllabus map above
- Extract sensor configuration details (rate, duration, calibration) per experiment
- Use their data tables as templates for our virtual lab data output format
- Adapt their analysis questions for our IA evaluation scaffold
- Their equipment setup diagrams inform our `LabBuilder` apparatus templates

### Which Vernier manuals to prioritize:

- **Chemistry with Vernier** (the main chemistry lab manual) — covers calorimetry, titrations, rates, electrochemistry, gas laws
- **Advanced Chemistry with Vernier** — covers more quantitative labs aligned with HL content
- **Investigating Chemistry through Inquiry** — inquiry-based labs that align with IA methodology

If you can get any of these in digital form, I can extract the relevant configuration data and map each experiment to our simulation architecture.

---

## Simulation Count Summary

| Category | SL Sims | HL-Only Sims | Virtual Labs | Total |
|---|---|---|---|---|
| Structure 1 (S1.1–S1.5) | 10 | 2 | 4 | 14 |
| Structure 2 (S2.1–S2.4) | 9 | 1 | 3 | 12 |
| Structure 3 (S3.1–S3.2) | 8 | 2 | 0 | 10 |
| Reactivity 1 (R1.1–R1.4) | 7 | 4 | 2 | 9 |
| Reactivity 2 (R2.1–R2.3) | 10 | 3 | 4 | 14 |
| Reactivity 3 (R3.1–R3.4) | 8 | 7 | 3 | 11 |
| **TOTAL** | **52** | **19** | **16** | **~70** |
| | | | | |
| **Math Skills Trainers (Phase 7)** | | | | |
| Uncertainty & Error Propagation | 3 modes | 1 mode (HL propagation) | — | 4 |
| Graph Interpretation | 3 sub-modules | 1 sub-module (linearization) | — | 4 |
| Equipment Recognition & Selection | 4 modes | — | — | 4 |
| **GRAND TOTAL** | | | | **~82** |

> Note: Some sims serve multiple topics and are counted once in their primary topic. Virtual labs counted separately where they have distinct apparatus setups. Math trainer modes counted as separate deliverables since each has its own UI.

---

*This document should be used alongside `IB_Chemistry_SimEngine_Architecture.md` for implementation planning. Data collection should begin with Priority 1 files and proceed through the phases as outlined in the architecture roadmap.*
