# Design: Virtual Vernier Sensor Lab (Phase 5 MVP)

## Context
Phase 5 of the SimEngine project: simulate Vernier Go Direct sensors and Graphical Analysis software so students practice the full data collection + analysis workflow before lab day. MVP scope: 2 sensors (temperature, pH), 2 experiments, full analysis toolkit.

## Architecture
Single `SimEngine_VernierLab.html` file with 3 tabs following standard SimEngine patterns. New experiments added as data entries to an EXPERIMENTS object — no engine changes needed to expand.

## Tab 1: Sensor Setup
- Experiment selector dropdown (2 experiments)
- Sensor card showing specs (range, precision, uncertainty) with canvas-drawn probe
- Collection settings (duration/sample rate for temp; volume increment for titration)
- "Connect Sensor" button with animated pairing workflow
- Teacher panel: calibration notes, common errors, IB uncertainty values

## Tab 2: Data Collection
- Split layout: data table (left) + live graph canvas (right)
- Auto-populated columns based on experiment type
- Start/Stop/Reset controls with speed toggle (1x/2x/5x)
- Graph builds point-by-point in real time with auto-scaling axes
- Realistic noisy data: temperature (exponential + Gaussian noise ±0.3°C), pH (sigmoidal + scatter ±0.05)

## Tab 3: Analysis
- Interactive graph with 5 toolbar tools:
  1. Statistics (range selection → mean/min/max/stddev)
  2. Linear Fit (two-point selection → equation + R²)
  3. Curve Fit (linear/quadratic/exponential → equation + R²)
  4. Tangent (click point → instantaneous rate)
  5. Annotation (click to label key features)
- Results panel with IB-context calculations (q=mcΔT, concentration from equivalence point)
- "Copy Data" button for export to spreadsheets

## Experiments (MVP)
1. Enthalpy of Neutralization — Temperature probe, time vs temperature, ~180s
2. Strong Acid-Base Titration — pH sensor, volume vs pH, ~50 points

## Data Model
EXPERIMENTS object with id, name, sensor, axes, defaults, generate function. Expandable by adding entries.

## Verification
- Both experiments complete full workflow: setup → collect → analyze
- Analysis tools produce correct results
- Teacher mode shows expected data + marking points
- Zero console errors
