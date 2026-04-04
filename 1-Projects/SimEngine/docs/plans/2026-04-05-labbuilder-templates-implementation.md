# Extended LabBuilder Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 new guided assembly templates (recrystallization, filtration & evaporation, calorimetry, chromatography) and 6 new equipment draw functions to SimEngine_LabBuilder.html.

**Architecture:** Data-only additions — 6 new draw functions + 6 EQUIPMENT entries + 4 SETUP_TEMPLATES entries. No engine/validation/rendering changes needed. The existing template selector auto-discovers new templates via Object.keys(SETUP_TEMPLATES).

**Tech Stack:** Single-file HTML/CSS/JS, HTML5 Canvas drawing, no frameworks.

---

### Task 1: Add 6 New Draw Functions

**Files:**
- Modify: `SimEngine_LabBuilder.html` (insert after line 612, before closing of draw functions section)

**Step 1: Add drawPolystyreneCup**

Insert after the `drawAntiBumpingGranules` function (line 612):

```javascript
  function drawPolystyreneCup(ctx, cx, cy, s){
    s = s || 1; ctx.save();
    ctx.strokeStyle = STROKE; ctx.lineWidth = 1;
    // Cup body (white, slightly tapered)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx-18*s, cy-20*s); ctx.lineTo(cx-15*s, cy+15*s);
    ctx.lineTo(cx+15*s, cy+15*s); ctx.lineTo(cx+18*s, cy-20*s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Rim
    ctx.beginPath();
    ctx.ellipse(cx, cy-20*s, 18*s, 5*s, 0, 0, Math.PI*2);
    ctx.fillStyle = '#F8FAFC'; ctx.fill(); ctx.stroke();
    // Lid line
    ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.moveTo(cx-16*s, cy-18*s); ctx.lineTo(cx+16*s, cy-18*s); ctx.stroke();
    ctx.restore();
  }

  function drawFilterPaper(ctx, cx, cy, s){
    s = s || 1; ctx.save();
    ctx.strokeStyle = STROKE; ctx.lineWidth = 1;
    // Folded cone shape
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.moveTo(cx, cy+12*s);
    ctx.lineTo(cx-12*s, cy-6*s);
    ctx.quadraticCurveTo(cx, cy-10*s, cx+12*s, cy-6*s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Fold line
    ctx.strokeStyle = '#D4A574'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx, cy+12*s); ctx.lineTo(cx, cy-8*s); ctx.stroke();
    ctx.restore();
  }

  function drawBuchnerFunnel(ctx, cx, cy, s){
    s = s || 1; ctx.save();
    ctx.strokeStyle = STROKE; ctx.lineWidth = 1;
    // Wide flat funnel body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx-20*s, cy-8*s); ctx.lineTo(cx-20*s, cy+2*s);
    ctx.lineTo(cx-5*s, cy+2*s); ctx.lineTo(cx-5*s, cy+18*s);
    ctx.lineTo(cx+5*s, cy+18*s); ctx.lineTo(cx+5*s, cy+2*s);
    ctx.lineTo(cx+20*s, cy+2*s); ctx.lineTo(cx+20*s, cy-8*s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Perforated plate (dots)
    ctx.fillStyle = '#94A3B8';
    for(var i = -2; i <= 2; i++){
      ctx.beginPath(); ctx.arc(cx+i*6*s, cy-2*s, 1*s, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  function drawBuchnerFlask(ctx, cx, cy, s){
    s = s || 1; ctx.save();
    ctx.strokeStyle = STROKE; ctx.lineWidth = 1;
    // Conical body
    ctx.fillStyle = FILL_GLASS;
    ctx.beginPath();
    ctx.moveTo(cx-8*s, cy-20*s); ctx.lineTo(cx-20*s, cy+15*s);
    ctx.lineTo(cx+20*s, cy+15*s); ctx.lineTo(cx+8*s, cy-20*s);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Neck
    ctx.fillRect(cx-6*s, cy-28*s, 12*s, 10*s);
    ctx.strokeRect(cx-6*s, cy-28*s, 12*s, 10*s);
    // Side arm
    ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.moveTo(cx+15*s, cy-8*s); ctx.lineTo(cx+25*s, cy-12*s); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+25*s, cy-12*s, 2*s, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  function drawTlcPlate(ctx, cx, cy, s){
    s = s || 1; ctx.save();
    ctx.strokeStyle = STROKE; ctx.lineWidth = 1;
    // Plate rectangle
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(cx-10*s, cy-18*s, 20*s, 36*s);
    ctx.strokeRect(cx-10*s, cy-18*s, 20*s, 36*s);
    // Pencil baseline
    ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 0.5;
    ctx.setLineDash([2*s, 2*s]);
    ctx.beginPath(); ctx.moveTo(cx-8*s, cy+12*s); ctx.lineTo(cx+8*s, cy+12*s); ctx.stroke();
    ctx.setLineDash([]);
    // Sample spots
    ctx.fillStyle = '#7C3AED';
    ctx.beginPath(); ctx.arc(cx-4*s, cy+12*s, 1.5*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+4*s, cy+12*s, 1.5*s, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawPencil(ctx, cx, cy, s){
    s = s || 1; ctx.save();
    // Pencil body
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(cx-18*s, cy-2*s, 30*s, 4*s);
    ctx.strokeStyle = STROKE; ctx.lineWidth = 1;
    ctx.strokeRect(cx-18*s, cy-2*s, 30*s, 4*s);
    // Tip
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(cx+12*s, cy-2*s); ctx.lineTo(cx+18*s, cy);
    ctx.lineTo(cx+12*s, cy+2*s); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Eraser
    ctx.fillStyle = '#F87171';
    ctx.fillRect(cx-22*s, cy-2*s, 4*s, 4*s);
    ctx.strokeRect(cx-22*s, cy-2*s, 4*s, 4*s);
    ctx.restore();
  }
```

**Step 2: Verify** — Preview LabBuilder in browser, open sandbox mode, confirm no console errors.

---

### Task 2: Add 6 New EQUIPMENT Entries

**Files:**
- Modify: `SimEngine_LabBuilder.html` (insert before the closing `];` of the EQUIPMENT array, currently at line 678)

**Step 1: Add equipment entries**

Insert before line 678 (`];`):

```javascript
    {id:'polystyrene_cup', name:'Polystyrene Cup', category:'glassware', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
     typicalUse:'Insulated calorimeter for enthalpy change measurements', ibNotes:'Low heat capacity minimises heat loss. Use with a lid for better insulation.', commonMistakes:['Not using a lid','Forgetting to stir'], draw:drawPolystyreneCup, hitR:35},
    {id:'filter_paper', name:'Filter Paper', category:'general', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
     typicalUse:'Separating insoluble solids from liquids during filtration', ibNotes:'Fold into quarters then open as a cone. Wet with distilled water to seat in funnel.', commonMistakes:['Tearing the paper','Not wetting to seat in funnel'], draw:drawFilterPaper},
    {id:'buchner_funnel', name:'Buchner Funnel', category:'separation', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
     typicalUse:'Vacuum filtration for faster separation of precipitates', ibNotes:'Use with Buchner flask and vacuum pump. Filter paper must cover all holes.', commonMistakes:['Filter paper not covering all holes','Not using vacuum'], draw:drawBuchnerFunnel, hitR:40},
    {id:'buchner_flask', name:'Buchner Flask', category:'glassware', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
     typicalUse:'Side-arm flask connected to vacuum pump for vacuum filtration', ibNotes:'The side arm connects to the vacuum source. Thicker glass withstands reduced pressure.', commonMistakes:['Forgetting to connect vacuum tubing'], draw:drawBuchnerFlask, hitR:40},
    {id:'tlc_plate', name:'TLC Plate', category:'general', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
     typicalUse:'Thin layer chromatography for separating and identifying compounds', ibNotes:'Draw pencil baseline 1 cm from bottom. Calculate Rf = distance moved by spot / distance moved by solvent front.', commonMistakes:['Using pen instead of pencil for baseline','Letting solvent reach the top'], draw:drawTlcPlate},
    {id:'pencil', name:'Pencil', category:'general', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
     typicalUse:'Drawing baselines on chromatography plates and marking filter paper', ibNotes:'Must use pencil (graphite), not pen. Ink would dissolve and interfere with the chromatogram.', commonMistakes:['Using pen instead of pencil'], draw:drawPencil},
```

**Step 2: Verify** — Preview LabBuilder, open sandbox mode, search palette for new items. Confirm all 6 appear with correct thumbnails.

---

### Task 3: Add Recrystallization Template

**Files:**
- Modify: `SimEngine_LabBuilder.html` (insert into SETUP_TEMPLATES object, after line 777 — after the closing `}` of the titration template)

**Step 1: Add template**

Insert after line 777 (after `titration: { ... }`), adding a comma after the titration closing brace:

```javascript
    recrystallization: {
      id: 'recrystallization',
      name: 'Recrystallization',
      description: 'Purify an impure solid using hot solvent and cooling',
      steps: [
        { instruction: 'Put on safety goggles before starting.', equipment: 'goggles',
          target: {x:0.1, y:0.15}, tolerance: 70, hint: 'Always wear eye protection when heating solvents.' },
        { instruction: 'Place a beaker for dissolving the impure solid.', equipment: 'beaker',
          target: {x:0.25, y:0.6}, tolerance: 55, hint: 'The beaker holds the hot solvent and impure solid.' },
        { instruction: 'Place a hot plate beneath the beaker.', equipment: 'hot_plate',
          target: {x:0.25, y:0.82}, tolerance: 55, hint: 'A hot plate is safer than a Bunsen when using flammable organic solvents.' },
        { instruction: 'Add a stirring rod to the beaker.', equipment: 'stirring_rod',
          target: {x:0.25, y:0.45}, tolerance: 50, hint: 'Stir to dissolve the solute in minimum hot solvent.' },
        { instruction: 'Set up a filter funnel for hot filtration.', equipment: 'filter_funnel',
          target: {x:0.5, y:0.5}, tolerance: 55, hint: 'Filter while hot to remove insoluble impurities before crystallization.' },
        { instruction: 'Place filter paper in the funnel.', equipment: 'filter_paper',
          target: {x:0.5, y:0.55}, tolerance: 50, hint: 'Fold into a cone shape and seat in the funnel.' },
        { instruction: 'Place a conical flask to collect the hot filtrate.', equipment: 'conical_flask',
          target: {x:0.5, y:0.72}, tolerance: 55, hint: 'The pure dissolved product passes through; impurities stay on the filter paper.' },
        { instruction: 'Place a beaker with ice water for cooling.', equipment: 'beaker',
          target: {x:0.78, y:0.6}, tolerance: 55, hint: 'Rapid cooling in ice water produces smaller, purer crystals.' }
      ],
      connections: [
        {from: 1, to: 4, label: 'pour hot solution'},
        {from: 4, to: 6, label: 'filtrate drips'},
        {from: 6, to: 7, label: 'cool in ice bath'}
      ],
      annotations: [
        {text: 'Minimum hot solvent', x: 0.15, y: 0.55},
        {text: 'Hot filtration', x: 0.42, y: 0.42},
        {text: 'Pure crystals form on cooling', x: 0.7, y: 0.72}
      ],
      successMessage: 'Recrystallization apparatus complete! Dissolve the impure solid in minimum hot solvent, filter hot to remove impurities, then cool to crystallize the pure product.'
    },
```

**Step 2: Verify** — Preview LabBuilder, select Recrystallization from template selector, complete all 8 steps.

---

### Task 4: Add Filtration & Evaporation Template

**Files:**
- Modify: `SimEngine_LabBuilder.html` (insert into SETUP_TEMPLATES, after recrystallization)

**Step 1: Add template**

```javascript
    filtration_evaporation: {
      id: 'filtration_evaporation',
      name: 'Filtration & Evaporation',
      description: 'Separate a precipitate by filtration, then recover a dissolved salt by evaporation',
      steps: [
        { instruction: 'Place a retort stand to support the funnel.', equipment: 'retort_stand',
          target: {x:0.25, y:0.4}, tolerance: 60, hint: 'The retort stand holds the filter funnel above the flask.' },
        { instruction: 'Attach a filter funnel to the stand.', equipment: 'filter_funnel',
          target: {x:0.25, y:0.5}, tolerance: 50, hint: 'The funnel separates insoluble precipitate from the solution.' },
        { instruction: 'Place filter paper in the funnel.', equipment: 'filter_paper',
          target: {x:0.25, y:0.55}, tolerance: 50, hint: 'Fold and wet with distilled water so it sits flat against the glass.' },
        { instruction: 'Place a conical flask under the funnel.', equipment: 'conical_flask',
          target: {x:0.25, y:0.72}, tolerance: 55, hint: 'Collects the filtrate (the liquid that passes through).' },
        { instruction: 'Place a wash bottle nearby for rinsing.', equipment: 'wash_bottle',
          target: {x:0.1, y:0.72}, tolerance: 70, hint: 'Rinse the residue with distilled water to wash through any remaining dissolved product.' },
        { instruction: 'Place an evaporating dish for the filtrate.', equipment: 'evap_dish',
          target: {x:0.65, y:0.6}, tolerance: 55, hint: 'Transfer the filtrate here and evaporate to recover the dissolved salt.' },
        { instruction: 'Set up a tripod and gauze under the dish.', equipment: 'tripod_gauze',
          target: {x:0.65, y:0.78}, tolerance: 55, hint: 'The gauze spreads the heat evenly. Heat gently to avoid spitting.' }
      ],
      connections: [
        {from: 3, to: 5, label: 'transfer filtrate'},
        {from: 5, to: 6, label: 'heat gently'}
      ],
      annotations: [
        {text: 'Residue stays on paper', x: 0.15, y: 0.45},
        {text: 'Wash with distilled water', x: 0.05, y: 0.65},
        {text: 'Heat until crystals form', x: 0.58, y: 0.55}
      ],
      successMessage: 'Filtration and evaporation setup complete! Pour the mixture through the filter, wash the residue, then gently evaporate the filtrate to recover dissolved salt crystals.'
    },
```

**Step 2: Verify** — Preview, select Filtration & Evaporation, complete all 7 steps.

---

### Task 5: Add Calorimetry Template

**Files:**
- Modify: `SimEngine_LabBuilder.html` (insert into SETUP_TEMPLATES, after filtration_evaporation)

**Step 1: Add template**

```javascript
    calorimetry: {
      id: 'calorimetry',
      name: 'Coffee-Cup Calorimetry',
      description: 'Measure enthalpy change using a polystyrene cup calorimeter',
      steps: [
        { instruction: 'Place a polystyrene cup as the calorimeter.', equipment: 'polystyrene_cup',
          target: {x:0.5, y:0.6}, tolerance: 55, hint: 'Polystyrene has low heat capacity, minimising heat loss to the surroundings.' },
        { instruction: 'Place a measuring cylinder for the solution.', equipment: 'meas_cylinder',
          target: {x:0.2, y:0.55}, tolerance: 55, hint: 'Measure an exact volume of solution (e.g. 25.0 cm\u00B3). Assume density = 1.00 g cm\u207B\u00B3.' },
        { instruction: 'Insert a thermometer to measure temperature.', equipment: 'thermometer',
          target: {x:0.5, y:0.35}, tolerance: 50, hint: 'Record temperature at regular intervals before and after adding reagent.' },
        { instruction: 'Place a balance to weigh the solid reagent.', equipment: 'balance',
          target: {x:0.8, y:0.7}, tolerance: 60, hint: 'Weigh the solid reactant to at least 2 decimal places.' },
        { instruction: 'Add a stirring rod.', equipment: 'stirring_rod',
          target: {x:0.5, y:0.45}, tolerance: 50, hint: 'Stir continuously to ensure even heat distribution throughout the solution.' },
        { instruction: 'Place a beaker as a support under the cup.', equipment: 'beaker',
          target: {x:0.5, y:0.78}, tolerance: 55, hint: 'A beaker prevents the polystyrene cup from tipping over.' }
      ],
      connections: [
        {from: 1, to: 0, label: 'pour measured solution'},
        {from: 3, to: 0, label: 'add weighed solid'}
      ],
      annotations: [
        {text: 'q = mc\u0394T', x: 0.35, y: 0.3},
        {text: 'Record T every 30 s', x: 0.6, y: 0.3},
        {text: 'Assume c = 4.18 J g\u207B\u00B9 K\u207B\u00B9', x: 0.35, y: 0.9}
      ],
      successMessage: 'Coffee-cup calorimeter ready! Record initial temperature, add the reagent, stir continuously, and record the maximum temperature change. Use q = mc\u0394T to calculate enthalpy change.'
    },
```

**Step 2: Verify** — Preview, select Coffee-Cup Calorimetry, complete all 6 steps.

---

### Task 6: Add Chromatography Template

**Files:**
- Modify: `SimEngine_LabBuilder.html` (insert into SETUP_TEMPLATES, after calorimetry)

**Step 1: Add template**

```javascript
    chromatography: {
      id: 'chromatography',
      name: 'Paper / TLC Chromatography',
      description: 'Separate and identify mixture components using chromatography',
      steps: [
        { instruction: 'Place a beaker as the chromatography chamber.', equipment: 'beaker',
          target: {x:0.5, y:0.6}, tolerance: 55, hint: 'A tall beaker serves as the developing chamber.' },
        { instruction: 'Place a measuring cylinder to measure solvent.', equipment: 'meas_cylinder',
          target: {x:0.2, y:0.55}, tolerance: 55, hint: 'Add just enough solvent so the level is below the pencil baseline.' },
        { instruction: 'Use a pencil to draw the baseline.', equipment: 'pencil',
          target: {x:0.5, y:0.38}, tolerance: 55, hint: 'Draw a faint pencil line 1 cm from the bottom. Never use pen \u2014 ink dissolves in the solvent.' },
        { instruction: 'Place the TLC plate or chromatography paper.', equipment: 'tlc_plate',
          target: {x:0.5, y:0.45}, tolerance: 55, hint: 'The stationary phase. Do not touch the surface \u2014 oils from fingers affect separation.' },
        { instruction: 'Cover the beaker with a watch glass.', equipment: 'watch_glass',
          target: {x:0.5, y:0.35}, tolerance: 55, hint: 'The lid keeps the atmosphere saturated with solvent vapour, ensuring even development.' },
        { instruction: 'Place a dropper for spotting samples.', equipment: 'dropper',
          target: {x:0.75, y:0.55}, tolerance: 65, hint: 'Apply small, concentrated spots on the baseline. Multiple small applications are better than one large one.' },
        { instruction: 'Place a wash bottle for the mobile phase.', equipment: 'wash_bottle',
          target: {x:0.2, y:0.75}, tolerance: 65, hint: 'The mobile phase (solvent) rises by capillary action, carrying components different distances.' }
      ],
      connections: [
        {from: 1, to: 0, label: 'add solvent'},
        {from: 5, to: 3, label: 'spot samples on baseline'}
      ],
      annotations: [
        {text: 'Solvent below baseline!', x: 0.38, y: 0.72},
        {text: 'Rf = dist. spot / dist. solvent front', x: 0.6, y: 0.38},
        {text: 'Saturated atmosphere', x: 0.62, y: 0.3}
      ],
      successMessage: 'Chromatography setup complete! The mobile phase rises by capillary action, separating components based on their relative affinity for the stationary and mobile phases. Calculate Rf values to identify compounds.'
    }
```

Note: This is the last template — no trailing comma needed.

**Step 2: Verify** — Preview, select Paper / TLC Chromatography, complete all 7 steps.

---

### Task 7: Update Template Selector Grid CSS

**Files:**
- Modify: `SimEngine_LabBuilder.html` (line 77, `.template-card` CSS)

**Step 1: Reduce card width for 6-card grid**

Change line 77 from:
```css
.template-card{display:inline-block;width:200px;padding:1rem;margin:.5rem;...}
```
to:
```css
.template-card{display:inline-block;width:180px;padding:.75rem;margin:.4rem;...}
```

This ensures 3 cards fit per row in the 1100px container (3 x 180px + margins fits within ~600px content area).

**Step 2: Verify** — Preview, confirm all 6 template cards display in a clean grid layout.

---

### Task 8: Update Index Sim Count + Project Status

**Files:**
- Modify: `SimEngine_Index.html` — update the LabBuilder SIMS entry description to mention 6 templates
- Modify: `SimEngine_Project_Status_2026-04-03.md` — update Phase 4 status

**Step 1: Update Index description**

Find the LabBuilder entry in the SIMS array and update its `desc` field:
```
desc:'Build lab apparatus step-by-step (6 guided templates: distillation, titration, recrystallization, filtration, calorimetry, chromatography) or explore freely in sandbox mode'
```

**Step 2: Update Project Status**

Update the Phase 4 section to reflect 6 templates and list them.

**Step 3: Verify** — Preview Index, confirm LabBuilder card shows updated description.

---

### Task 9: Commit

```bash
git add SimEngine_LabBuilder.html SimEngine_Index.html SimEngine_Project_Status_2026-04-03.md docs/plans/2026-04-05-labbuilder-templates-design.md docs/plans/2026-04-05-labbuilder-templates-implementation.md
git commit -m "feat: add 4 new LabBuilder templates + 6 equipment items (recrystallization, filtration, calorimetry, chromatography)"
```

---

### Task 10: End-to-End Verification

**Step 1:** Open LabBuilder in preview. Verify template selector shows 6 cards in a clean grid.

**Step 2:** Complete each new template end-to-end:
- Recrystallization (8 steps)
- Filtration & Evaporation (7 steps)
- Coffee-Cup Calorimetry (6 steps)
- Paper / TLC Chromatography (7 steps)

**Step 3:** Check sandbox mode — search palette for new equipment items (polystyrene cup, filter paper, Buchner funnel, Buchner flask, TLC plate, pencil). Place each on the canvas.

**Step 4:** Verify zero console errors.

**Step 5:** Check existing distillation and titration templates still work correctly (no regressions).
