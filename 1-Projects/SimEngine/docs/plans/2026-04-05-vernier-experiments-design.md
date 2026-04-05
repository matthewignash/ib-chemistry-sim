# Design: Expanded Vernier Experiments (Phase 5.1)

## Context
VernierLab MVP shipped with 2 experiments. The EXPERIMENTS data model supports easy expansion. Adding 6 new experiments using existing temperature and pH sensors.

## New Experiments

### Temperature Probe
1. **Enthalpy of Combustion** — methanol spirit burner, gradual rise over ~100s, plateau. Literature ΔH = −726 kJ/mol, students typically get −400 to −500 (heat loss).
2. **Enthalpy of Dissolution (NH₄NO₃)** — endothermic, temperature DROP ~5-6°C. ΔH = +25.7 kJ/mol. Key teaching: sign convention.

### pH Sensor — Weak Acid Titrations
3. **Ethanoic acid (CH₃COOH) + NaOH** — Ka = 1.74×10⁻⁵, buffer region, equiv pH ~8.7
4. **Methanoic acid (HCOOH) + NaOH** — Ka = 1.77×10⁻⁴, equiv pH ~8.2, comparison pair with ethanoic

### pH Sensor — Diprotic Titrations (HL)
5. **H₂SO₄ + NaOH** — Ka2 = 1.2×10⁻², two poorly-separated equivalence points
6. **H₂CO₃ + NaOH** — Ka1 = 4.3×10⁻⁷, Ka2 = 4.7×10⁻¹¹, two clearly visible equivalence points, ocean acidification link

## Architecture
No new files, sensors, or draw functions needed. All changes in `SimEngine_VernierLab.html`:
- Add entries to EXPERIMENTS object with generate() functions
- Add pH helper functions: `generateWeakAcidPH()` and `generateDiproticPH()`
- Fix 3 hardcoded `_activeExperiment === 'titration'` checks → `exp.sensor === 'ph'`
- Expand `updateIBContext()`, teacher panels, and HL panels with experiment-specific content
- Update Index description

## Chemistry Notes
- Weak acid titrations use Henderson-Hasselbalch in buffer region, hydrolysis at equivalence, excess OH⁻ after
- Diprotic H₂CO₃ has well-separated Ka values → two clear steps
- Diprotic H₂SO₄ has Ka2 = 0.012 → poorly separated first equivalence (pedagogically important)
- Combustion noise should be ±0.5°C (flame flicker) vs ±0.3°C for mixing experiments
