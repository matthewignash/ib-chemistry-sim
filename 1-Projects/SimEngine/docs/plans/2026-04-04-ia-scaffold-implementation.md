# IA Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 4-tab IA Scaffold hub (SimEngine_IAScaffold.html) that guides students through the IB Chemistry 2025 IA criteria, then embed IA Guide panels into 4 existing lab sims.

**Architecture:** Single-file HTML with standard SimEngine patterns (CSS vars, tab system, IIFE JS, DOM-only). 4 tabs map to the 4 IA criteria (Research Design, Data Analysis, Conclusion, Evaluation). Lab-specific presets load contextualised RQs and variables. Embedded panels in lab sims are ~50-line collapsible sidebars.

**Tech Stack:** HTML/CSS/JS (vanilla), Google Fonts (Inter, Fira Code), no frameworks, `file://` compatible, no innerHTML.

---

## Task 1: Scaffold the HTML shell + CSS

**Files:**
- Create: `SimEngine_IAScaffold.html`

**Step 1: Create the file with full CSS + header + tab bar + empty tab containers**

Write the complete HTML document with:
- Standard SimEngine `<style>` block (copy CSS vars + component classes from CalorimetryLab pattern)
- Header: "IA Scaffold" with subtitle "IB Chemistry — Internal Assessment Guide"
- HL and Teacher toggles in header-right
- Tab bar with 4 tabs: Research Design, Data Analysis, Conclusion, Evaluation
- Empty `<div class="tab-content">` for each tab
- Keyboard hint footer: `H` HL, `T` Teacher, `1-4` tabs, `R` Reset, `N` Next tab
- Standard SimEngine IIFE script block with tab switching + keyboard shortcuts + HL/Teacher toggle logic

Additional CSS needed for IA-specific components:
```css
/* RQ Builder */
.rq-builder{background:var(--teal-bg);border:1px solid var(--teal);border-radius:8px;padding:1rem;margin-bottom:1rem;}
.rq-preview{font-family:'Fira Code',monospace;font-size:.9rem;padding:.75rem;background:white;border-radius:6px;border:1px solid var(--border);margin-top:.75rem;min-height:2.5rem;}

/* Variables Table */
.var-table{width:100%;border-collapse:collapse;margin-bottom:1rem;font-size:.82rem;}
.var-table th{background:var(--navy);color:white;padding:.5rem .75rem;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.03em;}
.var-table td{padding:.5rem .75rem;border:1px solid var(--border);}
.var-table input,.var-table textarea{width:100%;padding:.35rem .5rem;border:1px solid var(--border);border-radius:4px;font-size:.82rem;font-family:inherit;}
.var-table textarea{resize:vertical;min-height:2rem;}

/* Rubric Self-Check */
.rubric-card{background:white;border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;margin-bottom:.5rem;cursor:pointer;transition:.2s;}
.rubric-card:hover{border-color:var(--teal);}
.rubric-card.selected{border-color:var(--teal);background:var(--teal-bg);box-shadow:0 0 0 3px rgba(13,148,136,.15);}
.rubric-mark{font-size:.7rem;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.03em;margin-bottom:.25rem;}
.rubric-desc{font-size:.8rem;line-height:1.5;}

/* Checklist */
.checklist{list-style:none;}
.checklist li{display:flex;align-items:flex-start;gap:.5rem;padding:.4rem 0;font-size:.85rem;}
.checklist input[type="checkbox"]{width:16px;height:16px;accent-color:var(--teal);margin-top:.15rem;flex-shrink:0;}
.checklist li.checked{color:var(--text-muted);text-decoration:line-through;}

/* Method Steps */
.method-steps{counter-reset:method;}
.method-step{display:flex;gap:.75rem;margin-bottom:.75rem;align-items:flex-start;}
.method-step::before{counter-increment:method;content:counter(method);display:flex;align-items:center;justify-content:center;min-width:28px;height:28px;border-radius:50%;background:var(--teal);color:white;font-size:.75rem;font-weight:700;}
.method-step textarea{flex:1;padding:.5rem .75rem;border:1px solid var(--border);border-radius:6px;font-size:.85rem;font-family:inherit;resize:vertical;min-height:2.5rem;}

/* Sentence Starters */
.sentence-starter{background:var(--blue-bg);border:1px solid #BFDBFE;border-radius:8px;padding:.75rem 1rem;margin-bottom:.75rem;font-size:.85rem;}
.sentence-starter .starter-label{font-size:.72rem;font-weight:600;color:var(--blue);text-transform:uppercase;margin-bottom:.35rem;}
.sentence-starter textarea{width:100%;padding:.5rem .75rem;border:1px solid var(--border);border-radius:6px;font-size:.85rem;font-family:inherit;resize:vertical;min-height:3rem;margin-top:.35rem;}

/* Weakness Category */
.weakness-category{margin-bottom:1rem;}
.weakness-category .cat-label{font-size:.78rem;font-weight:600;color:var(--text);margin-bottom:.5rem;display:flex;align-items:center;gap:.5rem;}
.weakness-category .cat-label::before{content:'';display:inline-block;width:10px;height:10px;border-radius:2px;}
.weakness-category.systematic .cat-label::before{background:var(--red);}
.weakness-category.random .cat-label::before{background:var(--amber);}
.weakness-category.equipment .cat-label::before{background:var(--blue);}

/* Progress tracker */
.ia-progress{display:flex;gap:.5rem;margin-bottom:1.25rem;}
.ia-progress-step{flex:1;text-align:center;padding:.5rem;border-radius:8px;background:var(--border);font-size:.72rem;font-weight:600;color:var(--text-muted);transition:.3s;}
.ia-progress-step.active{background:var(--teal);color:white;}
.ia-progress-step.done{background:#DCFCE7;color:#166534;}
```

**Step 2: Open in preview, verify 4 tabs switch correctly**

Run: preview server, navigate to IAScaffold, click each tab
Expected: Tab switching works, HL/Teacher toggles function, keyboard shortcuts work

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): scaffold IA Scaffold hub with CSS + tab system"
```

---

## Task 2: Lab data constants + lab selector

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Add the LAB_DATA object and lab selector dropdown**

Add to the JS section:
```javascript
var LAB_DATA = {
  calorimetry: {
    name: 'Calorimetry Lab',
    file: 'SimEngine_CalorimetryLab.html',
    exampleRQ: 'How does the choice of calorimeter material affect the accuracy of the enthalpy change measurement?',
    iv: { name: 'Calorimeter material', measure: 'Polystyrene cup, glass beaker, metal can', range: '3 types' },
    dv: { name: 'Temperature change / calculated enthalpy', measure: 'Thermometer (±0.5 °C) or digital probe (±0.1 °C)', range: 'Record to ±0.1 °C' },
    cvs: [
      { name: 'Volume of solution', measure: 'Measuring cylinder (±0.5 cm³)', range: '50.0 cm³' },
      { name: 'Concentration of acid/base', measure: 'Prepared solution', range: '1.00 mol dm⁻³' },
      { name: 'Mass of solid (if used)', measure: 'Balance (±0.01 g)', range: '2.00 g' }
    ],
    methodHints: ['Select calorimeter type and measure mass of empty calorimeter', 'Measure volume of solution using measuring cylinder', 'Record initial temperature of solution', 'Add reagent and stir; record temperature every 30 s for 5 minutes', 'Plot temperature-time graph and extrapolate to find maximum ΔT', 'Repeat with different calorimeter materials (3 trials each)'],
    safetyNotes: ['Wear safety goggles when handling acids/bases', 'Handle hot solutions with care', 'Dispose of solutions as instructed'],
    uncertainties: { thermometer: '±0.5 °C', digitalProbe: '±0.1 °C', measuringCylinder: '±0.5 cm³', balance: '±0.01 g' }
  },
  titration: {
    name: 'Titration Lab',
    file: 'SimEngine_TitrationLab.html',
    exampleRQ: 'How does the choice of indicator affect the accuracy of an acid-base titration endpoint?',
    iv: { name: 'Indicator type', measure: 'Phenolphthalein, methyl orange, bromothymol blue', range: '3 indicators' },
    dv: { name: 'Titre volume / calculated concentration', measure: 'Burette (±0.05 cm³ per reading)', range: 'Record to ±0.05 cm³' },
    cvs: [
      { name: 'Volume of analyte', measure: 'Pipette (±0.06 cm³)', range: '25.00 cm³' },
      { name: 'Concentration of titrant', measure: 'Prepared standard solution', range: '0.100 mol dm⁻³' },
      { name: 'Temperature', measure: 'Room temperature', range: '~25 °C' }
    ],
    methodHints: ['Rinse and fill burette with titrant; record initial reading', 'Pipette 25.00 cm³ analyte into conical flask', 'Add 2-3 drops of indicator', 'Titrate drop-wise near endpoint; record final burette reading', 'Repeat until concordant results (within ±0.10 cm³)', 'Calculate mean titre from concordant values'],
    safetyNotes: ['Wear safety goggles', 'Rinse skin immediately if acid/base contact occurs', 'Use a white tile under the flask to see colour change'],
    uncertainties: { burette: '±0.05 cm³ (×2 readings = ±0.10 cm³)', pipette: '±0.06 cm³', volumetricFlask: '±0.10 cm³' }
  },
  gravimetric: {
    name: 'Gravimetric Analysis Lab',
    file: 'SimEngine_GravimetricLab.html',
    exampleRQ: 'What is the value of x in the formula CuSO₄·xH₂O?',
    iv: { name: 'Identity of hydrated salt', measure: 'CuSO₄·xH₂O, MgSO₄·xH₂O, etc.', range: '3-4 salts' },
    dv: { name: 'Mass loss / moles of water', measure: 'Balance (±0.001 g)', range: 'Record to ±0.001 g' },
    cvs: [
      { name: 'Heating time per cycle', measure: 'Stopwatch', range: '5 minutes' },
      { name: 'Crucible type', measure: 'Same porcelain crucible', range: 'Consistent' },
      { name: 'Sample mass', measure: 'Balance (±0.001 g)', range: '~2.000 g' }
    ],
    methodHints: ['Measure mass of empty crucible + lid', 'Add ~2 g of hydrated salt; record exact mass', 'Heat strongly over Bunsen burner for 5 minutes', 'Cool in desiccator; record mass', 'Repeat heating until constant mass (±0.002 g)', 'Calculate mass of water lost and determine x'],
    safetyNotes: ['Use crucible tongs — crucible is extremely hot', 'Place hot crucible on heat-resistant mat, not balance', 'Cool fully before weighing'],
    uncertainties: { balance: '±0.001 g', crucible: 'Heat to constant mass (±0.002 g)' }
  },
  qualitative: {
    name: 'Qualitative Analysis Lab',
    file: 'SimEngine_QualitativeAnalysis.html',
    exampleRQ: 'How can flame tests and precipitation reactions be used to identify unknown ionic compounds?',
    iv: { name: 'Identity of unknown compound', measure: 'Labelled unknowns A-F', range: '6 unknowns' },
    dv: { name: 'Observed flame colour / precipitate formation', measure: 'Visual observation', range: 'Qualitative observations' },
    cvs: [
      { name: 'Concentration of reagents', measure: 'Standard 0.1 mol dm⁻³ solutions', range: 'Consistent' },
      { name: 'Sample size', measure: 'Spatula tip / 1 cm³', range: 'Consistent' },
      { name: 'Observation conditions', measure: 'Clean nichrome wire; fresh test tubes', range: 'Consistent' }
    ],
    methodHints: ['Clean nichrome wire by dipping in HCl and heating until no colour', 'Dip wire in unknown, hold in blue flame, record colour', 'Dissolve sample in water; add NaOH(aq) dropwise, record precipitate colour', 'Test if precipitate dissolves in excess NaOH', 'Add AgNO₃(aq) then dilute HNO₃; record precipitate', 'Cross-reference results with data booklet to identify ions'],
    safetyNotes: ['Wear safety goggles', 'HCl and NaOH are corrosive — avoid skin contact', 'AgNO₃ stains skin — wear gloves'],
    uncertainties: { qualitative: 'Observations are subjective; compare to reference standards' }
  },
  custom: {
    name: 'Custom Investigation',
    file: null,
    exampleRQ: '',
    iv: { name: '', measure: '', range: '' },
    dv: { name: '', measure: '', range: '' },
    cvs: [{ name: '', measure: '', range: '' }],
    methodHints: [],
    safetyNotes: [],
    uncertainties: {}
  }
};
```

Add lab selector dropdown to top of sim-container (above tabs), visible across all tabs:
```html
<div class="sim-card" style="margin-bottom:1rem;">
  <div class="sim-card-header">Select Your Lab Investigation</div>
  <div class="sim-card-body" style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
    <div class="control-group" style="flex:1;min-width:200px;margin-bottom:0;">
      <label>Lab</label>
      <select id="labSelect">
        <option value="calorimetry">Calorimetry Lab</option>
        <option value="titration">Titration Lab</option>
        <option value="gravimetric">Gravimetric Analysis Lab</option>
        <option value="qualitative">Qualitative Analysis Lab</option>
        <option value="custom">Custom Investigation</option>
      </select>
    </div>
    <button class="btn btn-outline" id="openLabBtn">Open Lab Sim ↗</button>
  </div>
</div>
```

Wire up lab selector change event + "Open Lab Sim" button (opens sim file in new tab).

**Step 2: Verify lab selector works**

Run: preview, change dropdown, check that openLabBtn navigates correctly
Expected: Selecting each lab updates internal state; "Open Lab Sim" opens correct file

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): add lab data constants and lab selector"
```

---

## Task 3: Tab 1 — Research Design

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Build Tab 1 content**

Inside `tab-design`, add 4 sim-cards:

**Card 1: Research Question Builder**
- RQ template with 3 dropdown/input fields: `[IV]`, `[DV]`, `[CVs]`
- Auto-populates from LAB_DATA when lab is selected
- Live preview: "How does [IV] affect [DV] when [CVs] are kept constant?"
- Student can edit any field
- Teacher panel: model RQ for selected lab, common mistakes list

**Card 2: Variables Table**
- 3-column table: Variable Name | How Measured/Controlled | Range/Values
- Rows: IV (1 row), DV (1 row), CVs (3+ rows with "Add CV" button)
- Pre-filled from LAB_DATA on lab select; editable
- Teacher panel: complete model variables for selected lab

**Card 3: Method Outline**
- Numbered step prompts (6 starter steps from LAB_DATA.methodHints)
- Editable textareas
- "Add Step" button
- Equipment, fair test, trials, safety reminder checkboxes
- Teacher panel: key method points, safety notes

**Card 4: Rubric Self-Check (Criterion 1)**
- 4 clickable rubric-cards showing the 6-mark scale descriptors:
  - 5-6: "The research design is clear with an appropriate and justified methodology..."
  - 3-4: "The research design is mostly clear with a methodology that is mostly appropriate..."
  - 1-2: "The research design is partially clear with limited methodology..."
  - 0: "The research design is not clear or not present"
- Student clicks to self-assess; selected card highlights
- Teacher panel: marking guidance

**Step 2: Verify Tab 1**

Run: preview, select a lab, verify RQ auto-populates, variables fill, method steps load
Expected: All 4 cards render, pre-fill from lab data, editable, teacher mode shows model answers

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): add Tab 1 Research Design with RQ builder, variables, method"
```

---

## Task 4: Tab 2 — Data Analysis

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Build Tab 2 content**

Inside `tab-analysis`, add 4 sim-cards:

**Card 1: Raw Data Table Builder**
- Auto-generates columns from selected lab's IV/DV
- Configurable: number of trials (default 3), number of IV values (default 5)
- Editable cells for data entry
- "Add Row" / "Add Trial" buttons
- Teacher panel: sample data set

**Card 2: Uncertainty Guidance**
- Displays instrument uncertainties from LAB_DATA.uncertainties
- Absolute vs percentage uncertainty formulas
- Link to UncertaintyTrainer: button opens `SimEngine_UncertaintyTrainer.html`
- Teacher panel: common uncertainty mistakes

**Card 3: Processed Data Prompts**
- Sample calculation template (sentence starter + input)
- Graph type selector: scatter, line, bar (with guidance on when to use each)
- Error bar guidance
- Mean calculation reminder
- Teacher panel: model processed data

**Card 4: Graph Checklist**
- Interactive checklist with checkboxes:
  - ☐ Descriptive title
  - ☐ Independent variable on x-axis with units
  - ☐ Dependent variable on y-axis with units
  - ☐ Appropriate scale (data fills >50% of axes)
  - ☐ Data points plotted accurately
  - ☐ Line of best fit or curve
  - ☐ Error bars (if applicable)
  - ☐ Anomalous data identified
- Progress bar fills as items checked
- Teacher panel: common graph errors

**Step 2: Verify Tab 2**

Run: preview, switch to Tab 2, change lab, verify table columns update
Expected: Data table generates columns, checklist is interactive, uncertainty info loads

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): add Tab 2 Data Analysis with table builder, uncertainties, graph checklist"
```

---

## Task 5: Tab 3 — Conclusion

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Build Tab 3 content**

Inside `tab-conclusion`, add 4 sim-cards:

**Card 1: Answer the Research Question**
- Sentence starters with textareas:
  - "The data shows that [IV] affects [DV] by..."
  - "As [IV] increased/changed, [DV]..."
  - "Therefore, the answer to the research question is..."
- Auto-fills IV/DV names from lab selection
- Teacher panel: model conclusion sentences

**Card 2: Scientific Context**
- Prompt: "Explain WHY the results occurred using relevant chemical theory"
- Sentence starters:
  - "This can be explained by..." (textarea)
  - "According to [theory/principle]..." (textarea)
- Reference to relevant syllabus section
- Teacher panel: key theory connections for each lab

**Card 3: Data Reference**
- Prompt: "Cite specific data points or trends from your results"
- Sentence starters:
  - "For example, when [IV] was [value], [DV] was [value]..."
  - "The trend shows..."
  - "The gradient of the graph is [value], which represents..."
- Teacher panel: how to cite data effectively

**Card 4: Literature Comparison**
- Accepted/literature value input
- Experimental value input
- Auto-calculates percentage error: |experimental - accepted| / accepted × 100
- Sentence starter: "The percentage error of [X]% suggests..."
- Teacher panel: accepted values for each lab, interpretation guidance

**Step 2: Verify Tab 3**

Run: preview, switch to Tab 3, test % error calculator
Expected: Sentence starters render, % error calculates correctly, teacher panels show

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): add Tab 3 Conclusion with RQ answer, theory, data refs, % error"
```

---

## Task 6: Tab 4 — Evaluation

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Build Tab 4 content**

Inside `tab-evaluation`, add 4 sim-cards:

**Card 1: Strengths**
- Prompt: "What aspects of your method gave reliable results?"
- Checklist of common strengths (checkable + custom text):
  - ☐ Concordant results obtained
  - ☐ Controlled variables kept constant
  - ☐ Appropriate number of trials
  - ☐ Precise equipment used
  - ☐ Custom: [textarea]
- Teacher panel: model strength statements

**Card 2: Weaknesses**
- 3 categorised sections (colour-coded):
  - Systematic errors (red) — e.g., heat loss, incomplete reactions
  - Random errors (amber) — e.g., reading meniscus, timing
  - Equipment limitations (blue) — e.g., resolution of instruments
- Each category has "Add Weakness" button → adds textarea row
- Pre-populated with 1-2 examples per category from LAB_DATA
- Teacher panel: comprehensive weakness list per lab

**Card 3: Improvements**
- For each weakness entered in Card 2, auto-generates an improvement row:
  - Weakness: [displayed from Card 2]
  - Improvement: [textarea]
  - Justification: [textarea]
- "This improvement would reduce [systematic/random] error because..."
- Teacher panel: model improvement-justification pairs

**Card 4: Extension**
- Prompt: "Suggest a follow-up investigation"
- Sentence starters:
  - "A further investigation could explore..."
  - "This would test whether..."
  - "The independent variable would be... and the dependent variable..."
- Teacher panel: extension ideas for each lab

**Step 2: Verify Tab 4**

Run: preview, switch to Tab 4, add weaknesses, verify improvements auto-link
Expected: Weakness categories render with colours, improvements link to weaknesses

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): add Tab 4 Evaluation with strengths, weaknesses, improvements, extension"
```

---

## Task 7: Progress tracker + Reset + Teacher presets

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Add shared features**

- **Progress tracker** at top of sim-container (below lab selector): 4 steps showing completion state per tab. A tab is "done" when ≥1 field has been filled.
- **Reset button** (keyboard `R`): clears all fields, resets progress, confirms with "Are you sure?" prompt
- **Next tab button** (`N`): advances to next tab
- **Teacher presets dropdown**: when Teacher mode is on, shows a dropdown per lab with pre-filled model answers. Selecting a preset fills all fields with model data.

**Step 2: Verify**

Run: preview, fill some fields, check progress updates, test Reset, test presets
Expected: Progress bar highlights completed tabs, Reset clears all, presets fill model data

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): add progress tracker, reset, next-tab, teacher presets"
```

---

## Task 8: Embed IA Guide panels in lab sims

**Files:**
- Modify: `SimEngine_CalorimetryLab.html`
- Modify: `SimEngine_TitrationLab.html`
- Modify: `SimEngine_GravimetricLab.html`
- Modify: `SimEngine_QualitativeAnalysis.html`

**Step 1: Add IA Guide panel to each lab sim**

For each of the 4 lab sims, add:

**CSS** (in `<style>` block):
```css
.ia-guide-panel{position:fixed;right:0;top:0;width:320px;height:100%;background:white;border-left:2px solid var(--teal);box-shadow:-4px 0 12px rgba(0,0,0,.1);transform:translateX(100%);transition:transform .3s ease;z-index:200;overflow-y:auto;padding:1rem;}
.ia-guide-panel.open{transform:translateX(0);}
.ia-guide-toggle{position:fixed;right:0;top:50%;transform:translateY(-50%);background:var(--teal);color:white;border:none;border-radius:8px 0 0 8px;padding:.75rem .4rem;cursor:pointer;font-size:.75rem;font-weight:700;writing-mode:vertical-rl;z-index:201;font-family:inherit;}
.ia-guide-toggle:hover{background:#0F766E;}
.ia-guide-panel h3{font-size:.9rem;font-weight:700;color:var(--navy);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
.ia-guide-panel .ia-section{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--border);}
.ia-guide-panel .ia-section:last-child{border-bottom:none;}
.ia-guide-panel .ia-label{font-size:.72rem;font-weight:600;color:var(--teal);text-transform:uppercase;letter-spacing:.03em;margin-bottom:.35rem;}
.ia-guide-panel .ia-hint{font-size:.82rem;line-height:1.5;color:var(--text);}
.ia-guide-panel .ia-vars{font-size:.8rem;margin:.5rem 0;}
.ia-guide-panel .ia-vars dt{font-weight:600;color:var(--text);margin-top:.35rem;}
.ia-guide-panel .ia-vars dd{color:var(--text-muted);margin-left:1rem;}
.ia-guide-panel .btn-open-scaffold{display:block;width:100%;margin-top:1rem;}
body.ia-panel-open .sim-container{margin-right:320px;transition:margin-right .3s ease;}
```

**HTML** (before closing `</body>`):
```html
<button class="ia-guide-toggle" id="iaToggle">IA Guide</button>
<div class="ia-guide-panel" id="iaPanel">
  <h3>📋 IA Guide — [Lab Name]</h3>
  <div class="ia-section">
    <div class="ia-label">Example Research Question</div>
    <div class="ia-hint">[Lab-specific example RQ]</div>
  </div>
  <div class="ia-section">
    <div class="ia-label">Variables</div>
    <dl class="ia-vars">
      <dt>IV:</dt><dd>[Lab-specific IV]</dd>
      <dt>DV:</dt><dd>[Lab-specific DV]</dd>
      <dt>CVs:</dt><dd>[Lab-specific CVs]</dd>
    </dl>
  </div>
  <div class="ia-section">
    <div class="ia-label">Data Recording Prompt</div>
    <div class="ia-hint">Record all raw data with units and uncertainties. Include at least 3 trials per IV value.</div>
  </div>
  <a href="SimEngine_IAScaffold.html?lab=[labkey]" class="btn btn-teal btn-open-scaffold">Open Full IA Scaffold →</a>
</div>
```

**JS** (add to existing IIFE):
```javascript
// IA Guide panel
var iaToggle = document.getElementById('iaToggle');
var iaPanel = document.getElementById('iaPanel');
if (iaToggle && iaPanel) {
  iaToggle.addEventListener('click', function() {
    iaPanel.classList.toggle('open');
    document.body.classList.toggle('ia-panel-open');
  });
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'i' || e.key === 'I') {
      iaPanel.classList.toggle('open');
      document.body.classList.toggle('ia-panel-open');
    }
  });
}
```

Contextualise content per lab using the data from the design doc (lines 89-111).

**Step 2: Verify each lab's panel**

Run: preview each lab sim, press `I`, check panel opens/closes, check content is lab-specific, click "Open Full IA Scaffold" link
Expected: Panel slides in from right, shows correct RQ/variables, link works

**Step 3: Commit**

```bash
git add SimEngine_CalorimetryLab.html SimEngine_TitrationLab.html SimEngine_GravimetricLab.html SimEngine_QualitativeAnalysis.html
git commit -m "feat: embed IA Guide panels in 4 lab sims"
```

---

## Task 9: Update Index + Project Status

**Files:**
- Modify: `SimEngine_Index.html`
- Modify: `SimEngine_Project_Status_2026-04-03.md`

**Step 1: Add IAScaffold to SimEngine_Index.html**

Add to SIMS array (in the Math Skills section, after EquipmentTrainer):
```javascript
{ file:'SimEngine_IAScaffold.html', name:'IA Scaffold', section:'Math', topic:'Tool 1', level:'both',
  desc:'Guided Internal Assessment workflow: research design, data analysis, conclusion, and evaluation',
  keywords:'IA internal assessment scaffold research question variables method data analysis conclusion evaluation rubric criteria' }
```

Update count: `34 Simulations` → `35 Simulations` (in simCount div and footer)

**Step 2: Update project status**

Add IAScaffold row to Math Skills table. Update sim count 34 → 35 in executive summary and "What Has Been Built" heading. Add Phase 6 note.

**Step 3: Verify**

Run: preview Index page, search "IA", verify card appears in Math Skills section
Expected: Card renders with correct badges, search finds it, count shows 35

**Step 4: Commit**

```bash
git add SimEngine_Index.html SimEngine_Project_Status_2026-04-03.md
git commit -m "feat: add IA Scaffold to index (35 sims) and update project status"
```

---

## Task 10: Handle `?lab=` query parameter in IAScaffold

**Files:**
- Modify: `SimEngine_IAScaffold.html`

**Step 1: Read query parameter on load**

Add to init function:
```javascript
var params = new URLSearchParams(window.location.search);
var labParam = params.get('lab');
if (labParam && LAB_DATA[labParam]) {
  document.getElementById('labSelect').value = labParam;
  loadLab(labParam);
}
```

This allows the "Open Full IA Scaffold →" links from embedded panels to pre-select the correct lab.

**Step 2: Verify**

Run: preview, navigate to `SimEngine_IAScaffold.html?lab=titration`
Expected: Titration Lab is pre-selected, all fields pre-populated

**Step 3: Commit**

```bash
git add SimEngine_IAScaffold.html
git commit -m "feat(sim35): handle ?lab= query parameter for deep linking from lab sims"
```

---

## Verification

After all tasks:
1. Open SimEngine_Index.html — confirm 35 sims, IAScaffold card visible
2. Open IAScaffold — test all 4 tabs with each lab selection
3. Toggle HL and Teacher mode — verify teacher panels appear
4. Test keyboard shortcuts: H, T, 1-4, R, N
5. Open each lab sim (Calorimetry, Titration, Gravimetric, Qualitative) — press `I` to open IA Guide panel
6. Click "Open Full IA Scaffold →" from a lab panel — verify correct lab pre-selected
7. Check console for zero errors across all files
