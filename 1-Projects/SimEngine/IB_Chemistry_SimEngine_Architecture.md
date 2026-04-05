# IB Chemistry Simulation Engine — Architecture Document

## Project Vision

A modular, reusable simulation engine that powers interactive IB Chemistry simulations — from conceptual gas law visualizations to full IA-style virtual labs with spectroscopy database lookups. Built as single-file HTML applications that embed in Schoology for flipped classroom use and work as live classroom demos.

### Design Principles

- **IB Chemistry scoped**: Every module maps to IB syllabus content. No general-purpose physics engine — purpose-built for what IB students need.
- **SL/HL toggle**: Baked into the engine core. Every simulation has an SL baseline with HL extensions toggled on/off via a persistent UI switch.
- **Dual mode**: Teacher mode (keyboard-driven, projector-friendly) and Student mode (self-guided, embedded in Schoology) in every simulation.
- **Conceptual first, quantitatively accurate where possible**: Correct trends and relationships always. Real values and calculations when the underlying model supports it.
- **Visual consistency**: Follows the IB Chemistry Tutorial Style Guide — same colors, fonts, layout patterns, and rough.js aesthetic as existing materials.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SIMULATION SCENES                     │
│  (Gas Laws, Equilibrium, Electrochemistry, Spectroscopy, │
│   VSEPR, IA Labs...)                                     │
├─────────────────────────────────────────────────────────┤
│                     IA SCAFFOLD LAYER                    │
│  (Experimental Design → Data Collection → Processing     │
│   → Evaluation — rubric-aligned prompts)                 │
├──────────────┬──────────────┬───────────────────────────┤
│  DYNAMIC     │  DATABASE    │  DATA PROCESSING          │
│  SIMULATIONS │  SIMULATIONS │  WORKSPACE                │
│  (particles, │  (spectra,   │  (tables, graphs,         │
│   reactions,  │   qual anal, │   uncertainty,            │
│   equilibria) │   properties)│   error bars)             │
├──────────────┴──────────────┴───────────────────────────┤
│                     ENGINE CORE                          │
│  Particle System · Equilibrium Solver · Renderer         │
│  Graph Engine · Controls Framework · SL/HL Toggle        │
│  State Manager · Teacher/Student Mode                    │
├─────────────────────────────────────────────────────────┤
│                   STYLE / UI LAYER                       │
│  CSS Variables · Layout System · rough.js Helpers        │
│  (from IB Chemistry Tutorial Style Guide)                │
└─────────────────────────────────────────────────────────┘
```

---

## Engine Core Modules

### 1. Particle System (`SimEngine.Particles`)

The foundation for gas laws, kinetic molecular theory, rate of reaction, and state changes.

**Capabilities:**
- N particles with position, velocity, mass, radius, color, and type
- Elastic wall collisions (container boundaries)
- Inter-particle collisions (optional, toggleable for performance)
- Maxwell-Boltzmann speed distribution initialization
- Temperature ↔ average kinetic energy relationship (Ek = 3/2 kT)
- Adjustable container volume (movable wall/piston)
- Particle count changes (add/remove moles)
- Color-coding by speed (cool→hot gradient) or by species

**SL/HL Differentiation:**
- SL: Ideal gas behavior, PV=nRT relationships, KMT postulates
- HL: Real gas deviations (Van der Waals), intermolecular forces visualization, critical temperature behavior

**Key constants and formulas:**
```
PV = nRT (ideal)
[P + a(n/V)²][V - nb] = nRT (Van der Waals, HL)
Ek_avg = (3/2)kT
Maxwell-Boltzmann: f(v) = 4π(m/2πkT)^(3/2) · v² · e^(-mv²/2kT)
```

### 2. Equilibrium Solver (`SimEngine.Equilibrium`)

Drives dynamic equilibrium, acid-base, Kc/Kp, and Le Chatelier's principle simulations.

**Capabilities:**
- ICE table computation from initial concentrations and K value
- Forward/reverse rate visualization (particle color changes on reaction)
- Dynamic rate graphs (rate_f and rate_r converging over time)
- Concentration vs. time plots
- Le Chatelier perturbation: change [conc], T, P and watch system respond
- pH calculation from Ka/Kb and concentration
- Buffer system modeling

**SL/HL Differentiation:**
- SL: Qualitative Le Chatelier's, Kc expressions, pH of strong acids/bases
- HL: Kp calculations, Ka/Kb quantitative problems, buffer pH (Henderson-Hasselbalch), entropy/Gibbs free energy (ΔG = ΔH - TΔS, ΔG = -RT ln K)

### 3. Electrochemistry Module (`SimEngine.Electrochem`)

Powers galvanic/voltaic cell and electrolysis simulations.

**Capabilities:**
- Standard electrode potential database (IB data booklet values)
- Cell EMF calculation from half-cell potentials
- Animated electron flow and ion migration
- Salt bridge visualization
- Electrolysis: products at electrodes based on species and conditions
- Faraday's law calculations (HL)

**SL/HL Differentiation:**
- SL: Galvanic cell construction, EMF calculation, simple electrolysis
- HL: Faraday's law quantitative problems, non-standard conditions (Nernst conceptual), competing reactions in electrolysis

### 4. Molecular Geometry Renderer (`SimEngine.VSEPR`)

Interactive 3D-ish visualization of molecular shapes.

**Capabilities:**
- Input: molecular formula or Lewis structure
- Calculate electron domains and molecular geometry
- Render 2D projections with perspective (or simple 3D via Three.js if scope allows)
- Show bond angles, lone pairs
- Toggle between electron domain geometry and molecular geometry
- Wedge/dash notation for 3D representation on 2D canvas

**SL/HL Differentiation:**
- SL: Basic VSEPR shapes (linear through octahedral), bond angles, polarity
- HL: Hybridization labels (sp, sp², sp³), expanded octets, formal charge

### 5. Graph Engine (`SimEngine.Graph`)

Shared real-time graphing used across all simulations.

**Capabilities:**
- Line plots, scatter plots, bar charts, distribution curves
- Real-time data streaming (updates every animation frame)
- Axis labels with units and chemical notation (subscripts/superscripts)
- Multiple series with legend
- Error bars (for IA data processing)
- Best-fit line / curve fitting (linear, polynomial, logarithmic)
- Zoom, pan, crosshair on hover
- Export data as CSV (for IA workflow)

**Rendering:** Canvas-based to match rough.js aesthetic, with option for clean/precise mode for quantitative work.

### 6. Controls Framework (`SimEngine.Controls`)

Standardized UI controls across all simulations.

**Components:**
- Slider with live value display and units
- Dropdown / select for discrete choices (e.g., select a gas, select an electrode)
- Toggle switch (SL/HL, Teacher/Student mode)
- Play/Pause/Reset/Step buttons
- Speed control (0.5x, 1x, 2x, 4x)
- Data table input (editable cells for IA data entry)

**Keyboard shortcuts (Teacher mode):**
- Space: play/pause
- Arrow keys: step forward/back
- R: reset
- T: toggle teacher/student mode
- H: toggle HL content
- 1-9: switch between simulation tabs/views

### 7. State Manager (`SimEngine.State`)

Manages simulation state, history, and mode switching.

**Capabilities:**
- Centralized state object for each simulation
- Undo/redo for parameter changes
- State serialization (save/load simulation state as JSON)
- Mode management: teacher vs. student, SL vs. HL
- Event system for cross-module communication

---

## Database Simulation Modules

### 8. Spectroscopy Database (`SimEngine.Spectroscopy`)

Powers the "determine organic structure" lab and related analytical chemistry simulations.

**Compound Database Structure:**
```javascript
{
  id: "ethanol",
  name: "Ethanol",
  formula: "C₂H₅OH",
  molecularFormula: "C2H6O",
  molarMass: 46.07,
  structure: "CH₃CH₂OH",  // condensed
  functionalGroups: ["hydroxyl"],

  // IR Data
  ir: {
    peaks: [
      { wavenumber: 3550, intensity: "broad, strong", assignment: "O-H stretch (hydrogen bonded)" },
      { wavenumber: 2950, intensity: "strong", assignment: "C-H stretch" },
      { wavenumber: 1050, intensity: "strong", assignment: "C-O stretch" }
    ]
  },

  // Mass Spec Data
  ms: {
    molecularIon: 46,
    basePeak: 31,
    fragments: [
      { mz: 46, relIntensity: 25, fragment: "M⁺ (CH₃CH₂OH⁺)" },
      { mz: 45, relIntensity: 50, fragment: "M-1 (loss of H)" },
      { mz: 31, relIntensity: 100, fragment: "CH₂OH⁺" },
      { mz: 29, relIntensity: 30, fragment: "CHO⁺" },
      { mz: 15, relIntensity: 15, fragment: "CH₃⁺" }
    ]
  },

  // ¹H NMR Data (HL only)
  hnmr: {
    solvent: "CDCl₃",
    peaks: [
      { shift: 1.2, multiplicity: "triplet", integration: 3, assignment: "CH₃", coupling: "J = 7.0 Hz" },
      { shift: 2.6, multiplicity: "singlet (broad)", integration: 1, assignment: "OH" },
      { shift: 3.7, multiplicity: "quartet", integration: 2, assignment: "CH₂", coupling: "J = 7.0 Hz" }
    ]
  },

  // IB difficulty tier
  tier: "standard",  // standard | challenging | extension
  topics: ["R1.3", "R3.2"]  // syllabus references
}
```

**Spectrum Rendering:**
- IR: wavenumber (4000–400 cm⁻¹) vs. transmittance, with fingerprint region shaded
- MS: bar chart of m/z vs. relative intensity, molecular ion labeled
- ¹H NMR: chemical shift (0–12 ppm) with splitting patterns drawn, integration curves

**Interaction Model:**
1. Student receives an "unknown" (compound selected from database, identity hidden)
2. Student chooses which technique to "run" (IR, MS, NMR)
3. Spectrum renders interactively — student can hover for peak values
4. Student annotates peaks (drag labels, type assignments)
5. Student proposes a structure (select from options or draw — stretch goal)
6. System checks answer and provides feedback

**SL/HL Differentiation:**
- SL: IR (functional group identification from table) + MS (molecular ion, basic fragmentation)
- HL: Adds ¹H NMR (chemical shifts, splitting, integration), more complex unknowns, degree of unsaturation calculation

**Compound Library (initial set — expand over time):**

| Category | SL Compounds | HL Additions |
|---|---|---|
| Alcohols | methanol, ethanol, propan-1-ol | propan-2-ol, butan-1-ol |
| Aldehydes/Ketones | ethanal, propanal | propanone, butanal |
| Carboxylic Acids | methanoic acid, ethanoic acid | propanoic acid |
| Esters | methyl methanoate, ethyl ethanoate | methyl propanoate |
| Amines (HL) | — | ethylamine, propylamine |
| Halogenoalkanes | — | 1-bromopropane, 2-chlorobutane |

### 9. Qualitative Analysis Database (`SimEngine.QualAnalysis`)

**Tests and observations:**
- Flame tests (color by cation)
- Precipitation reactions (solubility rules)
- Gas tests (limewater, splint, litmus)
- Functional group tests (bromine water, acidified dichromate, Tollens', etc.)

Same interaction model: student selects a test, observes the result, deduces the substance.

---

## Data Layer — Element & Compound Properties

The engine needs a comprehensive, IB-relevant data backend powering everything from periodic trend explorers to Lewis structure generation to IMF predictions. This section defines what data we need, where to source it, and how to structure it.

### 10. Periodic Table Database (`SimEngine.Elements`)

A complete dataset for all elements, optimized for IB Chemistry use cases.

**Per-element data structure:**
```javascript
{
  atomicNumber: 17,
  symbol: "Cl",
  name: "Chlorine",
  atomicMass: 35.45,
  group: 17,
  period: 3,
  block: "p",
  category: "halogen",            // alkali-metal, alkaline-earth, transition-metal,
                                   // post-transition-metal, metalloid, nonmetal,
                                   // halogen, noble-gas, lanthanide, actinide

  // Bonding & Structure properties
  electronegativity: 3.16,         // Pauling scale
  atomicRadius: 79,                // pm (empirical)
  covalentRadius: 99,              // pm
  vanDerWaalsRadius: 175,          // pm
  ionicRadius: { charge: -1, radius: 181 },  // most common ion
  ionizationEnergy: 1251.2,        // kJ/mol (first)
  electronAffinity: -349.0,        // kJ/mol
  electronConfiguration: "[Ne] 3s² 3p⁵",
  electronConfigShort: "2,8,7",    // for shell diagrams
  oxidationStates: [-1, 1, 3, 5, 7],
  commonOxidationState: -1,

  // Physical properties
  meltingPoint: 171.6,             // K
  boilingPoint: 239.11,            // K
  density: 3.214,                  // g/L (gas at STP) or g/cm³ (solid/liquid)
  standardState: "gas",            // solid, liquid, gas at 298K
  color: "#1DC31D",                // CPK color hex for visualization

  // IB-specific flags
  ibDataBooklet: true,             // appears in IB data booklet
  commonInIB: true,                // frequently tested element
  ibTopics: ["S1.3", "S2.2", "S3.1", "R3.1"]  // syllabus references
}
```

**What this powers:**
- Periodic trend visualizations (plot any property vs. atomic number, across periods/groups)
- Lewis structure generator (use valence electrons from configuration)
- Electronegativity difference → bond type prediction (ionic/polar covalent/nonmetal)
- IMF strength comparisons (from polarizability via atomic radius, EN differences)
- Ionic radius vs. atomic radius comparisons
- Electron configuration practice tools
- VSEPR predictions (from valence shell electron count)

**SL/HL Differentiation:**
- SL: EN, atomic radius, ionization energy trends; basic electron configurations; simple Lewis structures
- HL: Successive ionization energies, electron affinity trends, formal charge, expanded octets, hybridization from electron domain count

### 11. Compound Properties Database (`SimEngine.Compounds`)

Extends the spectroscopy database (Section 8) with physical and thermodynamic properties for virtual lab experiments.

**Additional fields per compound:**
```javascript
{
  // ...spectroscopy fields from Section 8...

  // Physical properties (for lab simulations)
  meltingPoint: -114.1,            // °C
  boilingPoint: 78.37,             // °C
  density: 0.789,                  // g/cm³ at 20°C
  solubilityWater: "miscible",     // g/100mL or "miscible"/"immiscible"
  color: "colorless",
  state: "liquid",                 // at 25°C
  odor: "characteristic",
  refractive_index: 1.361,

  // Thermodynamic data (for enthalpy/Hess's law/Gibbs)
  enthalpyFormation: -277.0,       // kJ/mol (standard)
  enthalpyCombustion: -1367.0,     // kJ/mol
  entropyStandard: 160.7,          // J/(mol·K)
  gibbsFormation: -174.8,          // kJ/mol
  specificHeatCapacity: 2.44,      // J/(g·K)

  // Acid-base properties
  pKa: 15.9,                       // or null if not acidic
  pKb: null,
  conjugateAcid: null,
  conjugateBase: "C₂H₅O⁻",

  // Reactivity
  flammable: true,
  oxidizer: false,
  hazards: ["flammable", "irritant"],
  ghs_pictograms: ["flame", "exclamation-mark"],

  // Vernier sensor behavior (what sensors detect)
  vernierProperties: {
    pH: null,                       // pH if dissolved in water
    conductivity: 0.0,              // µS/cm in pure form
    absorbanceMax: null,            // nm wavelength for colorimeter
    colorimetryColor: null          // filter to use
  }
}
```

### Data Sources — Where to Collect This

| Data Category | Primary Source | Format | License | Notes |
|---|---|---|---|---|
| **Element properties** (EN, radius, IE, EA, configs) | [PubChem Periodic Table](https://pubchem.ncbi.nlm.nih.gov/periodic-table/) | CSV/JSON download | Public domain (US Gov) | Best single source — has EN, atomic radius, IE, EA, oxidation states, all in one downloadable CSV |
| **Element properties** (backup/cross-reference) | [WebElements](https://www.webelements.com/) | Manual extraction | Educational use | Good for ionic radii, successive IEs |
| **IB Data Booklet values** | IB Chemistry Data Booklet 2025 | Manual entry | IB © (internal use) | ~60 values; enter by hand to ensure exact match with what students see in exams |
| **Thermodynamic data** (ΔHf, ΔHc, S°, ΔGf) | [NIST Chemistry WebBook](https://webbook.nist.gov/chemistry/) | Web scraping or [NistChemPy](https://github.com/IvanChernyshov/NistChemPy) | Public domain | Authoritative source; unofficial Python API available for batch extraction |
| **IR spectra** (peak positions) | [NIST WebBook](https://webbook.nist.gov/chemistry/) + [SDBS](https://sdbs.db.aist.go.jp/) | Images + peak tables | Public domain / free academic | NIST has ~16,000 IR spectra; SDBS has peak lists for common organics |
| **Mass spec fragmentation** | [NIST WebBook](https://webbook.nist.gov/chemistry/) | Peak lists | Public domain | Standard EI mass spectra |
| **¹H NMR chemical shifts** | [SDBS](https://sdbs.db.aist.go.jp/) + textbook correlation tables | Peak tables | Free academic | For IB, we mainly need the standard correlation table + ~30 specific compounds |
| **Bond enthalpies** | IB Data Booklet | Manual entry | IB © (internal use) | ~30 bond types; must match data booklet exactly |
| **Standard electrode potentials** | IB Data Booklet | Manual entry | IB © (internal use) | ~40 half-reactions |
| **Solubility data** | PubChem compound pages | JSON via PUG-REST API | Public domain | Solubility in water, common solvents |
| **pKa values** | [Evans pKa table](https://organicchemistrydata.org/) + CRC Handbook | Manual curation | Various | Curate ~50 acids/bases relevant to IB |
| **GHS hazard data** | PubChem | JSON via PUG-REST API | Public domain | For risk assessment in IA scaffold |

**Data Collection Strategy:**

1. **Start with PubChem CSV download** — one file gives you 118 elements with atomic mass, EN, radius, IE, EA, configurations, states, melting/boiling points, density. This is ~80% of the element data in one step.
2. **Manually enter IB Data Booklet values** — bond enthalpies, electrode potentials, specific heats, and enthalpy values that students use in exams. These must be exact matches.
3. **Use NistChemPy (Python)** to batch-extract thermodynamic data for ~50 key compounds. Script this — don't do it by hand.
4. **Curate spectroscopy data for 30-40 compounds** relevant to IB organic chemistry. Start with the compound list in Section 8 and expand.
5. **Cross-reference everything against the IB Data Booklet** before shipping. If a value differs between NIST and the data booklet, use the data booklet value (that's what students see in exams).

### Data File Organization

```
3-Resources/SimEngine/data/
├── elements.json                  ← 118 elements, all properties
├── ib_data_booklet.json           ← Bond enthalpies, electrode potentials,
│                                     specific heats — exact IB values
├── compounds_organic.json         ← Organic compounds with spectra + physical props
├── compounds_inorganic.json       ← Acids, bases, salts, common reagents
├── spectroscopy_correlation.json  ← IR, NMR, MS correlation tables
│                                     (wavenumber ranges → functional groups, etc.)
├── solubility_rules.json          ← Precipitation/solubility lookup
├── flame_test_colors.json         ← Cation → flame color mapping
└── equipment.json                 ← Lab equipment database (see Section 14)
```

---

## Virtual Lab Builder — Equipment & Drag-and-Drop Setup

### 14. Equipment Database (`SimEngine.Equipment`)

A catalog of lab equipment that students can select, position, and connect in a virtual lab workspace.

**Equipment categories and items:**

```javascript
{
  category: "glassware",
  items: [
    {
      id: "beaker_250",
      name: "250 mL Beaker",
      variants: [50, 100, 250, 400, 600, 1000],  // mL sizes available
      svg: "beaker.svg",                           // vector graphic
      connectable: ["thermometer", "stirring_rod", "ph_probe"],
      properties: {
        maxVolume: 250,
        graduated: true,
        graduationPrecision: 25,   // mL per graduation
        heatResistant: true
      },
      ibNotes: "Not used for precise measurement — graduated cylinder for that"
    }
  ]
}
```

**Full equipment list organized by category:**

**Measurement & Volumetric:**
- Graduated cylinders (10, 25, 50, 100 mL)
- Burette (50 mL, ±0.05 mL)
- Volumetric flasks (100, 250, 500, 1000 mL)
- Volumetric pipettes (10, 25 mL, ±0.04 mL)
- Graduated pipettes (1, 5, 10 mL)
- Pipette filler / bulb
- Electronic balance (±0.01 g and ±0.001 g)
- Wash bottle (distilled water)

**General Glassware:**
- Beakers (50–1000 mL)
- Erlenmeyer flasks (125, 250, 500 mL)
- Round-bottom flasks (100, 250, 500 mL)
- Boiling tubes / test tubes
- Test tube rack
- Watch glass
- Evaporating dish
- Crucible + lid
- Funnel (filter, separating)
- Buchner funnel + flask (vacuum filtration)
- Condensers (Liebig, reflux)
- Distillation head + adapter

**Heating & Mixing:**
- Bunsen burner (with gas supply)
- Hot plate / stirrer combo
- Water bath (with thermometer)
- Tripod + gauze mat
- Heat-resistant mat
- Magnetic stirrer bar
- Glass stirring rod
- Retort stand + clamps + boss heads

**Safety & Containment:**
- Fume hood (indicated as workspace zone)
- Safety goggles
- Lab coat
- Gloves (nitrile)
- Waste containers (aqueous, organic, solid)

**Separation & Filtration:**
- Filter paper (various grades)
- Separating funnel
- Distillation apparatus (assembled view)
- Chromatography paper / TLC plates
- Centrifuge

**Vernier Sensors (see Section 15 for detail):**
- Temperature probe
- pH sensor
- Conductivity probe
- Gas pressure sensor
- Colorimeter / SpectroVis
- Drop counter
- Voltage probe
- ORP sensor
- CO₂ gas sensor
- O₂ gas sensor

### Lab Builder Interface (`SimEngine.LabBuilder`)

A drag-and-drop workspace where students assemble apparatus before running an experiment.

**Workspace layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Equipment Palette (left sidebar)          Lab Bench (center) │
│  ┌──────────┐  ┌──────────────────────────────────────────┐  │
│  │ Search...│  │                                          │  │
│  ├──────────┤  │     [drag equipment here]                │  │
│  │ 🧪 Glass │  │                                          │  │
│  │ 🔬 Meas  │  │     Snap-to-grid positioning             │  │
│  │ 🔥 Heat  │  │     Connection lines between items       │  │
│  │ 📊 Sensor│  │     Fluid level indicators               │  │
│  │ ⚗️ Sep   │  │                                          │  │
│  └──────────┘  └──────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ Checklist Panel  │  │ Connection Panel│                    │
│  │ ☑ Goggles       │  │ Probe → Beaker  │                    │
│  │ ☑ Lab coat      │  │ Burner → Tripod │                    │
│  │ ☐ Fume hood?    │  │ Clamp → Stand   │                    │
│  └─────────────────┘  └─────────────────┘                    │
└──────────────────────────────────────────────────────────────┘
```

**How drag-and-drop works:**
1. Student browses equipment palette by category or search
2. Drags item onto the lab bench canvas
3. Items snap to grid positions and show connection points (glowing dots)
4. Student connects items by dragging between connection points (e.g., thermometer into beaker, clamp onto retort stand, tubing between flask and gas collection)
5. System validates connections ("A condenser needs water inlet and outlet connected" / "Bunsen burner needs a heat-resistant surface underneath")
6. Invalid placements show gentle warnings, not hard blocks — let students learn from mistakes

**Apparatus validation:**
- "You're heating a volumetric flask — these aren't designed for heating. Did you mean an Erlenmeyer?"
- "Your distillation setup is missing a condenser — the vapor has nowhere to cool"
- "Good setup! You've correctly assembled a reflux apparatus"

**Pre-built apparatus templates:**
For common IB experiments, offer "load template" options that pre-populate the bench with a standard setup. Students can then modify or use as-is. Templates include:
- Simple titration (burette + clamp + stand + conical flask + white tile)
- Distillation (round-bottom flask + distillation head + condenser + collection flask)
- Reflux (round-bottom flask + reflux condenser + hot plate)
- Calorimetry (polystyrene cup + thermometer + lid)
- Gas collection over water (flask + delivery tube + trough + gas jar)
- Electrochemical cell (two beakers + electrodes + salt bridge + voltmeter)
- Gravimetric analysis (filter + crucible + balance)

---

## Vernier Probe Simulation & Graphical Analysis Integration

### 15. Vernier Sensor Simulator (`SimEngine.Vernier`)

Simulates Vernier Go Direct sensors and their behavior in the virtual lab. Students learn how to select the right sensor, connect it, configure collection parameters, and interpret the data — before touching real equipment.

**Supported sensors and what they measure:**

| Sensor | Measurement | Range | Resolution | Common IB Experiments |
|---|---|---|---|---|
| Temperature Probe | Temperature | -40 to 135°C | 0.01°C | Enthalpy, rate of reaction, calorimetry |
| pH Sensor | pH | 0–14 | 0.01 | Titrations, buffer preparation, acid-base equilibria |
| Conductivity Probe | Conductivity | 0–20,000 µS/cm | 1 µS/cm | Ionic vs. molecular compounds, titration endpoint |
| Gas Pressure Sensor | Pressure | 0–210 kPa | 0.01 kPa | Gas laws (Boyle's, Amontons'), vapor pressure |
| Colorimeter / SpectroVis | Absorbance | 0–3.5 Abs | 0.001 | Beer-Lambert law, rate by color change, equilibrium |
| Drop Counter | Drop count / volume | — | 1 drop (~0.028 mL) | Titrations with real-time pH graphing |
| Voltage Probe | Voltage | ±30 V | 0.002 V | Electrochemical cells, Faraday's law |
| ORP Sensor | Redox potential | -2000 to +2000 mV | 0.1 mV | Redox titrations, electrode potentials |
| CO₂ Gas Sensor | CO₂ concentration | 0–100,000 ppm | 10 ppm | Respiration, fermentation, decomposition |
| O₂ Gas Sensor | O₂ concentration | 0–27% | 0.01% | Decomposition of H₂O₂, photosynthesis |

**Sensor setup simulation:**
```javascript
{
  sensor: "go_direct_ph",
  name: "Go Direct pH Sensor",
  connectionType: "bluetooth",     // or USB
  calibration: {
    required: true,
    points: 2,                     // 2-point calibration
    buffers: [4.0, 7.0, 10.0],    // available buffer solutions
    procedure: [
      "Remove storage bottle from sensor tip",
      "Rinse probe with distilled water",
      "Place probe in pH 7 buffer, wait for stable reading",
      "Click 'Calibrate' and enter 7.00",
      "Rinse probe, place in pH 4 buffer",
      "Wait for stable reading, click 'Calibrate' and enter 4.00"
    ]
  },
  dataCollection: {
    mode: "time-based",            // or "events with entry", "drop counting"
    defaultRate: 2,                // samples/second
    defaultDuration: 120,          // seconds
    maxRate: 10
  },
  maintenance: [
    "Store in pH 4 buffer solution when not in use",
    "Never let the bulb dry out",
    "Replace if readings drift consistently"
  ]
}
```

**What students practice:**
1. **Sensor selection**: "I'm measuring the rate of a color change — which sensor do I need?" (Colorimeter)
2. **Calibration**: Walk through calibration procedure step by step. System simulates the calibration screens — student enters buffer values, waits for stability
3. **Collection setup**: Choose time-based vs. event-based, set rate and duration appropriate to the experiment
4. **Probe placement**: In the lab builder, physically connect the sensor to the right container. System checks: "Your pH probe needs to be submerged in the solution, not hovering above it"
5. **Troubleshooting**: Simulate common issues — "Reading shows -0.23 pH — did you calibrate?" / "Conductivity reading is maxed out — switch to high range"

### 16. Graphical Analysis Simulator (`SimEngine.GraphicalAnalysis`)

Mimics the Vernier Graphical Analysis interface so students are familiar with the software before lab day.

**Simulated features:**
- Live data table (time vs. sensor reading)
- Real-time graph that builds as data collects
- Multiple sensor overlay (e.g., temperature + pH vs. time)
- Data analysis tools: statistics (mean, min, max), curve fit (linear, polynomial, exponential), tangent line (for instantaneous rate), integral (for area under curve)
- Annotation (students can mark key events on the graph)
- Export to CSV

**Layout mimics actual Graphical Analysis:**
```
┌──────────────────────────────────────────────────────┐
│  Meter view: [pH: 4.32]  [Temp: 23.1°C]  [▶ Collect]│
├────────────────────┬─────────────────────────────────┤
│                    │                                 │
│    DATA TABLE      │         GRAPH                   │
│    Time | pH       │         pH vs. Time             │
│    0.0  | 7.02     │         (live updating)         │
│    0.5  | 6.98     │                                 │
│    1.0  | 6.91     │    [Curve Fit] [Stats] [Note]   │
│    ...             │                                 │
│                    │                                 │
├────────────────────┴─────────────────────────────────┤
│  Analysis: Linear Fit → y = -0.43x + 7.05  R² = 0.98│
└──────────────────────────────────────────────────────┘
```

**This connects to the IA scaffold:** Students design their experiment (Section 10), set up equipment in the lab builder (Section 14), configure sensors (Section 15), run the simulation which generates data through the Graphical Analysis interface (this section), then process and evaluate (Sections 12–13). The full IA workflow in one tool.

### Dry-Run Workflow: Simulation → Real Lab

The key use case: **students build the full experiment virtually, run it, get data, analyze it — then do it for real in class.** This means:

1. **Before lab day** (flipped / homework): Student opens the virtual lab. Selects equipment from the palette, assembles apparatus, connects Vernier sensors, configures data collection, runs the simulation, collects data, and writes a preliminary analysis. This functions as a "pre-lab" that's far more rigorous than a worksheet.

2. **Lab day**: Student already knows what equipment they need, how to assemble it, how to calibrate sensors, what data to collect, and roughly what to expect. Lab time is spent on execution and dealing with real-world complications — not on figuring out the setup.

3. **After lab day**: Student compares real data to simulated data. Discrepancies become the basis for evaluation ("My simulated data gave 4.2 kJ/mol but the real experiment gave 3.8 kJ/mol — the heat loss to the calorimeter cup was a systematic error the simulation didn't model").

**Teacher controls for dry-run mode:**
- Toggle "realistic noise" level (clean data for learning setup, noisy data for practicing analysis)
- Lock/unlock certain equipment choices (force students to justify their selection)
- Set a "hidden systematic error" that students must identify in evaluation
- View student setup screenshots / exported reports

---

## IA Scaffold Layer

### 10. Experimental Design Interface (`SimEngine.IADesign`)

Guides students through the IA planning process before running a simulation.

**Workflow:**
1. **Research Question**: Student types an RQ. System checks for IV, DV, and measurability. Provides formative feedback ("Your RQ mentions temperature — is that your independent variable?").
2. **Variables Table**: Student categorizes variables as IV, DV, or controlled. System flags missing controls relevant to the chosen experiment.
3. **Methodology Plan**: Student selects range and increments for IV, number of trials, and measurement method. System warns about insufficient range or too few data points.
4. **Risk Assessment**: Prompted checklist relevant to the chemicals/equipment in the simulation.

**Rubric Alignment (IB Criteria):**
- Maps to Exploration strand: research question, background, variables
- Formative hints use IB language ("Your RQ is focused but consider stating the expected relationship")

### 11. Data Collection Layer (`SimEngine.IAData`)

Generates realistic experimental data from the simulation engine.

**Realism Features:**
- Random error: Gaussian noise proportional to the precision of the "instrument"
- Systematic error: optional bias (e.g., uncalibrated thermometer reads 1.5°C high)
- Anomalous results: occasional outlier with probability settable by teacher
- Instrument precision: values rounded to appropriate decimal places
- Repeat trials: student decides how many, system generates independent data each time

**Data Table:**
- Editable spreadsheet-style table
- Student enters headers, units, and uncertainty
- Raw data auto-populates when student "runs" a trial
- Student must calculate means and propagate uncertainties themselves

### 12. Data Processing Workspace (`SimEngine.IAProcess`)

Tools for students to process their collected data.

**Features:**
- Calculate mean, standard deviation from raw trials
- Uncertainty propagation: absolute and percentage
- Graph generation: student selects axes, system plots with error bars
- Best-fit line with equation and R² value
- Linearization tools (e.g., plot ln[A] vs. time for first-order kinetics)
- Slope and intercept calculation from best-fit

**SL/HL Differentiation:**
- SL: Basic mean, percentage error, simple graphs
- HL: Full uncertainty propagation, linearization, statistical analysis

### 13. Evaluation Scaffold (`SimEngine.IAEval`)

Prompts students through the evaluation stage of the IA.

**Guided prompts (not auto-grading):**
- "Compare your experimental value to the literature value. Calculate your percentage error."
- "Identify one systematic error in your method. How did it affect your results?"
- "Identify one random error. How could you reduce it?"
- "Suggest one realistic improvement to your methodology."
- "Evaluate whether your data supports your hypothesis."

**Output:** Student responses are saved alongside their data as a printable/exportable report. Teacher can review.

---

## Math Skills Trainer — Standalone Practice Modules

### 17. Uncertainty & Error Propagation Trainer (`SimEngine.MathTrainer.Uncertainty`)

A standalone practice tool for the math skills students consistently struggle with. Generates unlimited practice problems with worked solutions.

**Practice modes:**

**Mode 1: Reading Instrument Uncertainty**
- Show an image of an instrument (burette, graduated cylinder, thermometer, balance, volumetric flask)
- Student identifies: reading, absolute uncertainty (±), percentage uncertainty
- Instruments shown in both illustration (rough.js) and photo mode (toggle)
- Progresses from simple (reading a thermometer) to complex (reading a meniscus on a burette)

**Mode 2: Absolute & Percentage Uncertainty**
- Given a measurement and its absolute uncertainty → calculate percentage uncertainty
- Given multiple measurements → calculate mean, range, and uncertainty from range (±½ range)
- Randomized values each time — infinite practice

**Mode 3: Error Propagation**
- Addition/subtraction: absolute uncertainties add
- Multiplication/division: percentage uncertainties add
- Multi-step problems: q = mcΔT with uncertainties on m, c, and ΔT
- IB-style problems: enthalpy from calorimetry data with full propagation
- Step-by-step scaffold: system shows which rule applies at each step, then fades hints as student improves

**Mode 4: Percentage Error & Accuracy**
- Given experimental value + literature value → calculate percentage error
- Classify errors as systematic vs. random from descriptions
- Suggest improvements to reduce each error type

**Problem Generation:**
```javascript
{
  type: "propagation_division",
  given: {
    volume: { value: 25.00, uncertainty: 0.04, unit: "cm³" },
    concentration: { value: 0.100, uncertainty: 0.001, unit: "mol/dm³" }
  },
  calculate: "moles with propagated uncertainty",
  steps: [
    "Calculate moles: n = c × V = 0.100 × 0.02500 = 0.00250 mol",
    "% uncertainty in V: (0.04/25.00) × 100 = 0.16%",
    "% uncertainty in c: (0.001/0.100) × 100 = 1.0%",
    "Total % uncertainty: 0.16 + 1.0 = 1.16%",
    "Absolute uncertainty: 0.00250 × 0.0116 = ±0.000029 mol",
    "Answer: 0.00250 ± 0.00003 mol"
  ],
  difficulty: "standard"  // standard | challenging | extension
}
```

**Scoring:** Track problems attempted, accuracy rate, average time. No grades sent anywhere — purely formative. Student sees their own progress dashboard.

**SL/HL Differentiation:**
- SL: Absolute and percentage uncertainty, simple propagation (add/subtract, multiply/divide), percentage error
- HL: Multi-step propagation, uncertainty in gradient of best-fit line, uncertainty in logarithmic quantities

---

### 18. Graph Interpretation Trainer (`SimEngine.MathTrainer.Graphs`)

Four sub-modules covering all graph skills from reading to predicting.

**Sub-module A: Reading Values & Trends**
- Display a graph (generated from chemistry data — not abstract) with axis labels and units
- Questions: "What is the pH at 15.0 cm³ of NaOH added?", "Describe the relationship between pressure and volume", "At what temperature does the rate double?"
- Student clicks on graph to select a point, types a value, or selects from trend descriptions (directly proportional, inversely proportional, exponential, logarithmic, no correlation)
- Difficulty progression: clear gridlines → estimate between gridlines → no gridlines (interpolation)

**Sub-module B: Gradient & Intercept**
- Display scatter data → student draws best-fit line (click two points or drag line)
- Calculate gradient using Δy/Δx from two well-spaced points on the line (not data points)
- Determine y-intercept (read from graph or calculate from gradient + point)
- Chemistry context: gradient of V vs. T graph → find absolute zero, gradient of concentration vs. time → initial rate
- System validates best-fit line quality ("Your line should pass through the mean point and have roughly equal scatter above and below")

**Sub-module C: Linearization Techniques (HL)**
- Given non-linear data (e.g., [A] vs. time for a first-order reaction)
- Student transforms data: choose which plot to make (ln[A] vs. t, 1/[A] vs. t, [A] vs. t)
- System plots the transformed data → student identifies which gives a straight line → determines reaction order
- Also: Arrhenius linearization (ln k vs. 1/T), Beer-Lambert (absorbance vs. concentration)
- Step-by-step guidance available: "For a first-order reaction, plotting ln[A] vs. time gives a straight line with gradient = -k"

**Sub-module D: Sketching & Predicting Graphs**
- Scenario-based: "The following equilibrium is exothermic in the forward direction: N₂O₄ ⇌ 2NO₂. Sketch how the concentration vs. time graph changes when temperature is increased at t = 50s."
- Student draws on a blank or partially-filled graph canvas (freehand sketch tool)
- System evaluates: correct direction of change, correct relative magnitudes, correct shape (not pixel-perfect — conceptual accuracy)
- Categories: Le Chatelier perturbations, Maxwell-Boltzmann changes, titration curve shapes, rate graphs with catalyst, heating/cooling curves with phase changes

**Graph data source:** All graphs use realistic chemistry data generated from the engine's simulation models — not generic math functions. This reinforces content knowledge while practicing graph skills.

**Canvas interaction:**
```
┌────────────────────────────────────────────┐
│  Graph Interpretation Trainer              │
│  ┌──────────────────────────────────┐      │
│  │         [Generated Graph]        │      │
│  │                                  │      │
│  │   ● click to read values         │      │
│  │   ✎ draw best-fit line           │      │
│  │   ✏ sketch prediction            │      │
│  │                                  │      │
│  └──────────────────────────────────┘      │
│                                            │
│  Question: What is the initial rate of     │
│  reaction? Show your working.              │
│                                            │
│  [Working space]        [Check Answer]     │
│                                            │
│  Progress: ████████░░ 8/10 correct         │
└────────────────────────────────────────────┘
```

---

### 19. Equipment Recognition & Selection Module (`SimEngine.EquipmentTrainer`)

Teaches students to identify, select, and justify lab equipment choices.

**Dual-mode equipment visuals:**

Every piece of equipment has TWO visual representations that toggle with a single button:

1. **Illustration mode** (default in simulations): Clean SVG line drawings with rough.js hand-drawn texture applied. Consistent with the tutorial style guide. Labels and callouts included.
2. **Photo mode**: Real photographs of the actual equipment. Cropped on white background, consistent lighting. Shows what the student will see on the lab bench.

```javascript
{
  id: "burette_50",
  name: "50 mL Burette",
  illustration: "equipment/svg/burette_50.svg",   // rough.js styled SVG
  photo: "equipment/photo/burette_50.jpg",          // real photo
  photoCredit: "school lab photo / CC0",
  annotations: [
    { label: "Stopcock", position: { x: 0.5, y: 0.85 } },
    { label: "Meniscus reading point", position: { x: 0.5, y: 0.3 } },
    { label: "Graduation marks (0.1 mL)", position: { x: 0.7, y: 0.5 } }
  ],
  precision: "±0.05 mL",
  commonMistakes: [
    "Reading from the top (0) not the bottom — burettes read downward",
    "Not removing the air bubble below the stopcock before titrating",
    "Forgetting to rinse with the titrant solution before filling"
  ]
}
```

**Practice Mode 1: Equipment Identification (Flashcard style)**
- Show a photo → student names the equipment
- Show an illustration → student names the equipment
- Show equipment name → student identifies it from a grid of 4 photos
- Spaced repetition: equipment the student gets wrong appears more frequently

**Practice Mode 2: Equipment Selection from Directions**
- Present a written experimental procedure (IB-style)
- Student reads the directions and selects all equipment needed from the catalog
- System checks: did they get the right items? Did they miss anything? Did they add unnecessary items?
- Feedback explains why each piece is needed: "You selected a beaker for heating — that works, but an Erlenmeyer flask would be better because it reduces splashing and is easier to swirl"

Example scenario:
```
PROCEDURE:
"Prepare 250 cm³ of 0.100 mol/dm³ sodium hydroxide solution
from solid NaOH pellets."

Required equipment:
✓ Electronic balance (±0.01 g)
✓ Weighing boat or watch glass
✓ 250 mL volumetric flask
✓ Wash bottle (distilled water)
✓ Glass stirring rod
✓ Beaker (to dissolve in first)
✓ Safety goggles + gloves (NaOH is corrosive)

Common student mistakes:
✗ Using a beaker instead of a volumetric flask (wrong precision)
✗ Forgetting to dissolve in a beaker first before transferring
✗ Not selecting safety equipment
```

**Practice Mode 3: Precision & Appropriateness**
- "You need to measure exactly 25.00 cm³ of acid. Which equipment?" → Volumetric pipette, not graduated cylinder
- "You need approximately 50 cm³ of water to dissolve a solid. Which equipment?" → Graduated cylinder or even a beaker is fine
- Teaches the distinction between precise measurement and approximate volume — a nuance many IB students miss

**Practice Mode 4: Equipment Assembly**
- Simplified drag-and-drop: given a list of equipment, arrange them in the correct order/configuration
- Example: "Set up a distillation apparatus" → student places round-bottom flask, distillation head, condenser, collection flask in sequence
- This feeds directly into the Lab Builder (Section 14) but is a simpler, guided version for learning

**Photo Asset Strategy:**
- Take standardized photos of your school's lab equipment (consistent background, lighting, angle)
- Supplement with Creative Commons lab photos from educational repositories
- Each photo tagged with: equipment ID, category, scale reference, any distinguishing features
- Target: 50 equipment items photographed = covers all IB-relevant apparatus

---

## Embedded Math Checks in Virtual Labs

In addition to the standalone trainers above, every virtual lab simulation includes embedded math skill checks at natural breakpoints. These are NOT separate from the lab — they're woven into the workflow.

**Where embedded checks appear:**

| Lab Stage | Math Check | What Student Does |
|---|---|---|
| **Data Collection** | Uncertainty identification | Before recording, student must state the uncertainty of the instrument they're reading |
| **After raw data** | Mean calculation | Student calculates mean from repeat trials before system reveals the value |
| **Processing** | Unit conversion | System prompts: "Convert your volume from cm³ to dm³" before proceeding |
| **Processing** | Error propagation | Student propagates uncertainty through their calculation step-by-step |
| **Graph creation** | Axis selection | Student must choose appropriate axes, scales, and labels — system doesn't auto-generate |
| **Graph analysis** | Gradient calculation | Student draws best-fit line and calculates gradient before system shows the value |
| **Evaluation** | Percentage error | Student calculates % error against literature value |

**Teacher controls for embedded checks:**
- Toggle each check type on/off (maybe skip uncertainty checks for a first-time lab, enable everything for IA practice)
- Set "strict mode" (student cannot proceed until check is correct) vs. "advisory mode" (system shows feedback but allows moving on)
- View class-wide analytics: "78% of students got the propagation step wrong — reteach this"

**Integration with `SimEngine.IAProcess`:**
The existing data processing workspace (Section 12) gains these check points. When a student enters the processing stage of an IA dry-run, the system doesn't just hand them a finished graph — it walks them through creating it, checking their math at each step.

---

## Updated Phase Roadmap (v3.0)

### Phase 1: Core Engine + Gas Laws (unchanged)
Core particle system, graph engine, controls, SL/HL toggle, teacher/student mode.

### Phase 2: Additional Topic Simulations (unchanged)
Equilibrium, acid-base, electrochemistry, rate of reaction, VSEPR, enthalpy.

### Phase 3: Data Layer + Database Simulations (unchanged)
Element database, compound database, spectroscopy lab, periodic trends explorer.

### Phase 4: Virtual Lab Builder + Equipment Module
- Equipment database with dual visual assets (SVG illustrations + photos)
- Drag-and-drop lab bench interface
- Connection validation system
- Pre-built apparatus templates
- **NEW: Equipment Recognition Trainer (flashcards, selection from directions, precision practice)**

### Phase 5: Vernier Integration + Graphical Analysis (unchanged)
Sensor database, calibration simulation, Graphical Analysis-style interface.

### Phase 6: IA Scaffold + Dry-Run Integration (expanded)
- Experimental design interface
- Realistic data generation
- Data processing workspace **with embedded math checks**
- Evaluation prompts
- Full dry-run workflow
- **NEW: Embedded uncertainty/propagation checks at each lab stage**

### Phase 7: Math Skills Trainers (NEW)
- Uncertainty & Error Propagation Trainer (standalone)
- Graph Interpretation Trainer (all four sub-modules: reading, gradient, linearization, sketching)
- Equipment Selection Practice (from written directions)
- Progress tracking dashboard across all trainers
- Problem bank generation from simulation data

---

## Phase 1 Reference Build: Gas Laws (Proof of Concept)

**File:** `SimEngine_GasLaws.html`

**What it demonstrates:**
- Particle system with wall/piston collisions
- Real-time P, V, T, n controls via sliders
- Live PV=nRT graph panel
- Maxwell-Boltzmann distribution curve that shifts with temperature
- SL/HL toggle (HL adds Van der Waals deviations)
- Teacher/Student mode toggle
- Full style guide compliance

**Controls:**
| Control | Range | Default |
|---|---|---|
| Temperature (K) | 100–1000 | 300 |
| Volume (arbitrary) | 0.5–5.0 | 2.0 |
| Moles (n) | 1–10 | 3 |
| Gas species | Ideal, He, N₂, CO₂ | Ideal |

**Graph Panels:**
1. Particle animation canvas (main visual)
2. P vs. V (isothermal) — updates in real time
3. Maxwell-Boltzmann speed distribution
4. (HL) Ideal vs. real gas overlay

---

## Technical Specifications

### Delivery Format

Single-file HTML documents. All CSS, JavaScript, and data embedded in one file per simulation. This ensures:
- Easy upload to Schoology (one file, no dependencies to break)
- Works offline once loaded
- No server infrastructure needed
- Easy to share with other IB teachers

### External Dependencies (CDN)

| Library | Version | CDN | Purpose |
|---|---|---|---|
| rough.js | 4.6.6 | jsdelivr | Hand-drawn aesthetic for diagrams |
| Inter font | latest | Google Fonts | Body text |
| Fira Code | latest | Google Fonts | Chemical formulas |
| Caveat | latest | Google Fonts | Hand-drawn labels |

No other external dependencies. All simulation logic is vanilla JavaScript.

### Performance Targets

| Metric | Target |
|---|---|
| Particle count (smooth 60fps) | 200–500 particles |
| Canvas size | 960×540 (standard), responsive down to 320px |
| Initial load time | < 2 seconds on school WiFi |
| File size per simulation | < 500KB (aim for < 300KB) |

### Browser Support

- Chrome 90+ (primary — school Chromebooks)
- Safari 15+ (student iPads)
- Firefox 90+
- Edge 90+
- No IE support

### Accessibility

- All controls keyboard-navigable
- Color not sole indicator of state (add text labels / patterns)
- Canvas animations have pause control
- Print mode reveals all content statically

---

## Style Guide Integration

All simulations inherit the IB Chemistry Tutorial Style Guide:

- **Colors**: Use CSS custom properties (`--navy`, `--teal`, `--blue`, `--purple` for HL indicators, etc.)
- **Typography**: Inter (UI), Fira Code (chemical formulas), Caveat (canvas labels)
- **Layout**: `.header` gradient banner, `.container` (820px for controls, 1100px for canvases)
- **rough.js**: Same helpers (`txt`, `atom`, `bond`, `arw`, `dash`, `badge`) for any structural formula rendering within simulations
- **Teacher/Student mode**: Same toggle pattern and keyboard shortcuts
- **HL indicator**: Purple (`--purple: #7C3AED`) badge/border for HL-only content sections

### New Style Tokens for SimEngine

```css
:root {
  /* Existing tokens from style guide... */

  /* SimEngine additions */
  --sim-canvas-bg: #FAFBFC;        /* Slightly off-white canvas background */
  --sim-particle-hot: #EF4444;     /* Fast particle color */
  --sim-particle-cold: #3B82F6;    /* Slow particle color */
  --sim-particle-neutral: #64748B; /* Default particle color */
  --sim-grid: #E2E8F0;             /* Graph gridlines */
  --sim-axis: #1E293B;             /* Graph axes */
  --sim-data-1: #0D9488;           /* Primary data series (teal) */
  --sim-data-2: #2563EB;           /* Secondary data series (blue) */
  --sim-data-3: #D97706;           /* Tertiary data series (amber) */
  --sim-data-4: #7C3AED;           /* Fourth data series (purple/HL) */
  --sim-error-bar: #94A3B8;        /* Error bar color */
  --hl-badge-bg: #7C3AED;          /* HL content badge */
  --hl-border: #7C3AED33;          /* HL section border (with alpha) */
}
```

---

## File Structure

All simulations live in the project workspace alongside existing materials:

```
IB Chemistry/
├── 3-Resources/
│   ├── IB_Chemistry_Tutorial_Style_Guide.md
│   └── SimEngine/
│       ├── SimEngine_Core.js              ← Shared engine (copy-pasted into each HTML)
│       ├── README.md                      ← Developer notes
│       └── data/
│           ├── elements.json              ← 118 elements, all properties
│           ├── ib_data_booklet.json       ← Bond enthalpies, electrode potentials, etc.
│           ├── compounds_organic.json     ← Organic compounds + spectra + physical props
│           ├── compounds_inorganic.json   ← Acids, bases, salts, common reagents
│           ├── spectroscopy_correlation.json ← IR/NMR/MS lookup tables
│           ├── solubility_rules.json      ← Precipitation/solubility lookup
│           ├── flame_test_colors.json     ← Cation → flame color
│           ├── equipment.json             ← Lab equipment catalog
│           └── vernier_sensors.json       ← Sensor specs, calibration procedures
├── SimEngine_GasLaws.html                 ← Phase 1
├── SimEngine_Equilibrium.html             ← Phase 2
├── SimEngine_AcidBase.html                ← Phase 2
├── SimEngine_Electrochemistry.html        ← Phase 2
├── SimEngine_RateOfReaction.html          ← Phase 2
├── SimEngine_VSEPR.html                   ← Phase 2
├── SimEngine_Spectroscopy.html            ← Phase 3
├── SimEngine_PeriodicTrends.html          ← Phase 3
├── SimEngine_LewisStructures.html         ← Phase 3
├── SimEngine_LabBuilder.html              ← Phase 4 (drag-and-drop lab setup)
├── SimEngine_IA_GasLaws.html              ← Phase 6 (full IA dry-run)
├── SimEngine_IA_Titration.html            ← Phase 6
└── ...existing files...
```

**Note on single-file delivery:** While data files exist separately in `3-Resources/SimEngine/data/`, each simulation HTML file embeds its required data inline. The JSON files serve as the authoritative source during development — a build step (or copy-paste) inlines the relevant data into each HTML file. This keeps the single-file Schoology delivery model intact.

**Note on equipment SVGs:** Equipment graphics will be inline SVG in the HTML files. Keep source SVGs in `3-Resources/SimEngine/assets/` for reference, but they ship embedded.

---

## Phase 1 Build Plan (Gas Laws)

This is the first simulation to build. It proves out the engine architecture and gives Matthew a testable artifact.

### Components to build:

1. **Particle system**: N particles in a rectangular container, elastic collisions with walls, speed-based coloring
2. **Piston**: Right wall is movable, linked to volume slider
3. **PV=nRT calculator**: Computes pressure from particle collisions per frame (count wall hits × momentum transfer) AND from ideal gas law — display both for comparison
4. **Control panel**: T, V, n sliders + gas species selector + SL/HL toggle + mode toggle
5. **Graph panel 1**: Real-time P vs. V (isothermal curve builds as student adjusts V)
6. **Graph panel 2**: Maxwell-Boltzmann distribution, updates with T
7. **HL panel**: Van der Waals overlay on P-V graph, real vs. ideal comparison
8. **Info panel**: Live readout of P, V, T, n, average speed, average KE

### Interaction flow:

**Student mode:**
1. Read intro text explaining what the simulation models
2. Adjust T slider → watch particles speed up/slow down, MB distribution shift
3. Adjust V slider → watch piston move, pressure change
4. Adjust n slider → watch particles appear/disappear
5. Observe graphs updating in real time
6. (HL) Toggle HL mode → see Van der Waals deviations appear
7. Quiz prompts appear at key moments ("What happens to pressure if you double T at constant V?")

**Teacher mode:**
1. Keyboard-driven: spacebar toggles animation, arrow keys step through presets
2. Large canvas fills most of screen (projector-friendly)
3. Caption bar at bottom for talking points
4. Number keys switch between "views" (particles only, particles + graph, graph only)

---

## Future Considerations

- **Export/sharing**: Simulation state as URL parameters so teachers can share specific setups
- **Student response collection**: Integration with Google Forms or Schoology quiz API for quiz prompts
- **Collaborative mode**: Multiple students interacting with the same simulation (WebRTC — long-term)
- **Mobile optimization**: Touch-friendly controls for student phones/tablets
- **Build system**: If the project grows beyond 6-8 simulations, consider a simple build script that compiles `SimEngine_Core.js` + scene-specific code into single HTML files
- **Community**: Other IB Chemistry teachers could contribute compound database entries or new scenes
- **Vernier hardware integration**: If Vernier ever releases a web API for Go Direct sensors, the Graphical Analysis simulator could connect to real sensors — hybrid virtual/real data collection
- **3D molecular viewer**: Integrate Three.js for true 3D VSEPR and crystal structure visualization
- **Student portfolio**: Track a student's virtual lab history across multiple experiments — shows growth in experimental design skills over the course

---

*Document version: 2.0 — March 31, 2026*
*Project: IB Chemistry Simulation Engine*
*Author: Matthew Ignash + Claude (co-planning)*
