# Calorimetry Simulation Design

**Date:** 2026-04-04
**File:** `SimEngine_CalorimetryLab.html`
**Alignment:** R1.1, R1.2, R2.1 — Kognity Practicals 5a, 5b, Tool 1 Calorimetry

## Overview

Interactive calorimetry lab simulator where equipment choices (cup material, lid, shielding) affect heat loss rates and experimental accuracy. Students run virtual experiments, observe real-time T-vs-t graphs, perform graphical extrapolation, calculate q=mcΔT, and compare to literature values.

## Tabs

### Tab 1: Coffee-Cup Calorimetry
- Equipment picker: cup material (polystyrene k=0.003, glass k=0.008, metal k=0.012), lid (×0.6), stirring (affects noise)
- Reactions: NaOH dissolution (−44.5), NaOH(s)+HCl (−101.7), NaOH(aq)+HCl (−57.1), NH₄NO₃ dissolution (+25.7)
- Canvas: animated apparatus left, T-vs-t graph right
- Run → cooling curve → extrapolation exercise → q=mcΔT calculation

### Tab 2: Combustion Calorimetry
- Equipment: fuel (methanol/ethanol/propanol/butanol), shielding (none/partial/full), distance, water volume
- Canvas: spirit lamp apparatus + T-vs-t graph
- Mass loss tracking, ΔH per mol vs literature

### Tab 3: Hess's Law
- Run all three NaOH reactions from Prac 5a
- Construct enthalpy cycle: ΔH₁ = ΔH₂ + ΔH₃
- Visual cycle builder

### Tab 4: Analysis
- % error calculator, equipment comparison table, uncertainty propagation

## Heat Loss Model
Newton's Law of Cooling: T(t) = T_room + (T_peak − T_room)·e^(−k·t)
Equipment choices modify k. Graphical extrapolation corrects for heat loss.

## Teacher Mode
- Theoretical curve overlay (dashed), % energy lost display
- Presets for common demos
