# Data Export Feature — Design Document

**Date:** 2026-03-31
**Scope:** Reusable module for all SimEngine simulations

---

## Overview

Add data collection and CSV export to SimEngine. Students can run timed data collection (like a virtual Vernier sensor), take snapshots, and download CSV files for use in Excel/Google Sheets for IA lab reports. Teacher mode adds parameter sweep automation and full variable control.

## Deliverables

| File | Change | Purpose |
|------|--------|---------|
| SimEngine_Core.js | Add `SimEngine.DataCollector` module | Reusable data collection engine |
| SimEngine_Equilibrium.html | Add data collection UI panel | First sim to use it |
| SimEngine_GasLaws.html | Add data collection UI panel | Retrofit to existing sim |

---

## Data Collection Workflow

### Student Mode (guided)

1. Click "Collect Data" to expand panel
2. Select duration (dropdown: 10s, 30s, 60s, 120s)
3. Select data points (dropdown: 10, 20, 50, 100)
4. Check which variables to record (sensible defaults pre-selected)
5. Click "Start Collection"
6. Progress bar shows live count: "Recording... 12/50 points"
7. On completion: "Download CSV" button
8. Snapshot button always available for single-point captures

### Teacher Mode (full control)

- All student options plus:
- Free-text inputs for duration and data point count
- All variables available including HL quantities (Kp, delta-G)
- Parameter sweep: vary one parameter across a range, auto-settle, record one row per step
- Snapshot table always visible

---

## Module API: SimEngine.DataCollector

### Registration

Each simulation registers which variables are available for collection:

```
SimEngine.DataCollector.registerVariables([
  { key: 'time', label: 'Time (s)', getter: fn, default: true },
  { key: 'reactantFrac', label: 'Reactant Fraction', getter: fn, default: true },
  { key: 'Kp', label: 'Kp', getter: fn, hl: true },
  ...
])
```

Properties:
- key: unique identifier
- label: CSV column header and checkbox label
- getter: function returning current value
- default: true if pre-selected in student mode
- hl: true if only shown when HL is enabled

### Timed Collection

```
startRun({ durationSec, pointCount, variables: ['key1', 'key2'] })
stopRun()
tick(frameCount)          — called each frame; records if interval hit
isRunning()               — boolean
getProgress()             — { collected, total, percent }
getRun()                  — array of data rows
```

Interval = (durationSec * 60) / pointCount frames between recordings (assuming 60fps).

### Snapshots

```
recordSnapshot()          — capture one data point
getSnapshots()            — array of snapshot rows
```

### Parameter Sweep (Teacher only)

```
startSweep({
  paramKey: 'temperature',
  from: 200, to: 800, steps: 10,
  settleFrames: 180,     — frames to wait for equilibrium at each step
  variables: ['key1', 'key2']
})
```

Steps through each parameter value, sets it via SimEngine.State, waits settleFrames, records one row, advances to next value.

### Export

```
toCSV(dataType)           — 'run' | 'snapshots' | 'both' -> CSV string
download(filename, type)  — triggers browser download via Blob + hidden <a>
clearData()               — reset all collected data
```

### CSV Format

```
Time (s), Reactant Fraction, Product Fraction, Forward Rate, Reverse Rate
0.00, 0.9350, 0.0650, 0.56, 0.56
0.50, 0.9300, 0.0700, 0.58, 0.54
```

Headers from label fields. Numbers: 4 decimal places for fractions, 2 for rates, scientific notation for Q/Kc/Kp/delta-G.

---

## UI Layout

Collapsible section in the control panel, below Q vs K readout:

```
-- DATA COLLECTION --
[expand/collapse]

Duration:    [30s dropdown]
Data Points: [20  dropdown]

Variables:   [x] Time
             [x] Reactant Fraction
             [x] Product Fraction
             [x] Forward Rate
             [x] Reverse Rate
             [ ] Q
             [ ] Kc
             [ ] Temperature

[Start Collection]

-- or --

[Snapshot]   (always available)

-- SNAPSHOTS (3) --
| Time  | React | Prod  |
| 0.00  | 0.935 | 0.065 |
| 2.50  | 0.870 | 0.130 |
| 5.00  | 0.900 | 0.100 |

[Download Snapshots CSV]
```

During collection:
```
Recording... [progress bar] 16/20 points
[Stop Early]
```

After collection:
```
Collection complete -- 20 points
[Download Run CSV]  [Clear]
```

Teacher mode extras:
```
-- PARAMETER SWEEP --
Vary: [Temperature dropdown]
From: [200] To: [800] Steps: [10]
Settle time: [3s]
[Run Sweep]
```

---

## Variables Per Simulation

### Equilibrium Explorer

| Key | Label | Default | HL |
|-----|-------|---------|-----|
| time | Time (s) | yes | no |
| reactantFrac | Reactant Fraction | yes | no |
| productFrac | Product Fraction | yes | no |
| rateForward | Forward Rate | yes | no |
| rateReverse | Reverse Rate | yes | no |
| Q | Q | no | no |
| Kc | Kc | no | no |
| Kp | Kp | no | yes |
| deltaG | delta-G (kJ/mol) | no | yes |
| temperature | Temperature (K) | no | no |
| volume | Volume (L) | no | no |
| reactantCount | Reactant Count | no | no |
| productCount | Product Count | no | no |

### Gas Laws Explorer

| Key | Label | Default | HL |
|-----|-------|---------|-----|
| time | Time (s) | yes | no |
| pressure | Pressure (sim) | yes | no |
| pressureIdeal | Pressure (ideal) | yes | no |
| temperature | Temperature (K) | yes | no |
| volume | Volume | no | no |
| avgSpeed | Avg Speed | no | no |
| avgKE | Avg KE | no | no |
| moles | Moles (n) | no | no |

---

## Sweep Parameters

### Equilibrium Explorer
- Temperature (200-800K)
- Volume (0.5-5.0L)

### Gas Laws Explorer
- Temperature (100-1000K)
- Volume (0.5-5.0)
- Moles (1-10)
