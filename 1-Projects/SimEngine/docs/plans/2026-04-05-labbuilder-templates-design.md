# Design: Extended LabBuilder Templates

## Context
The Virtual Lab Builder has 2 guided templates (distillation, titration) and 30 equipment items. Students need practice setting up 4 additional common IB Chemistry practicals. This adds 4 new templates and 6 new equipment draw functions using the existing template engine — no engine changes required.

## New Equipment Items (6)

| ID | Name | Category | Draw Description |
|----|------|----------|------------------|
| `polystyrene_cup` | Polystyrene Cup | glassware | White cup with lid line |
| `filter_paper` | Filter Paper | general | Folded circle shape |
| `buchner_funnel` | Buchner Funnel | separation | Wide flat funnel with perforations |
| `buchner_flask` | Buchner Flask | glassware | Side-arm conical flask |
| `tlc_plate` | TLC Plate | general | Small rectangle with baseline dots |
| `pencil` | Pencil | general | Simple pencil shape |

## Template 1: Recrystallization (8 steps)
Purify an impure solid using hot solvent, hot filtration, then cooling.

Steps: goggles -> beaker (dissolving) -> hot_plate -> stirring_rod -> filter_funnel -> filter_paper -> conical_flask (collect filtrate) -> beaker (ice bath)

Connections: dissolving beaker -> funnel "pour hot solution", funnel -> flask "filtrate drips", flask -> ice beaker "cool in ice bath"

## Template 2: Filtration & Evaporation (7 steps)
Separate precipitate by gravity filtration, recover salt by evaporation.

Steps: retort_stand -> filter_funnel -> filter_paper -> conical_flask -> wash_bottle -> evap_dish -> tripod_gauze

Connections: flask -> evap_dish "transfer filtrate", evap_dish -> tripod "heat gently"

## Template 3: Calorimetry Coffee Cup (6 steps)
Measure enthalpy change with polystyrene cup calorimeter.

Steps: polystyrene_cup -> meas_cylinder -> thermometer -> balance -> stirring_rod -> beaker (support)

Connections: cylinder -> cup "pour measured solution", balance -> cup "add weighed solid"

## Template 4: Paper/TLC Chromatography (7 steps)
Separate and identify components by chromatography.

Steps: beaker (chamber) -> meas_cylinder -> pencil (baseline) -> tlc_plate -> watch_glass (lid) -> dropper (spotting) -> meas_cylinder (solvent)

Connections: cylinder -> beaker "add solvent", dropper -> plate "spot samples on baseline"

## Template Selector
Existing flexbox grid expands naturally from 2 to 6 cards.

## Verification
- All 6 templates appear in selector and complete without errors
- New equipment appears in sandbox palette
- No console errors
