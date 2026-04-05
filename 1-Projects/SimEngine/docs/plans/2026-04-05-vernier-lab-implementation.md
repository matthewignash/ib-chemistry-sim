# Virtual Vernier Sensor Lab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a virtual Vernier sensor simulation with data collection and Graphical Analysis-style tools for IB Chemistry students to practice before real lab work.

**Architecture:** Single `SimEngine_VernierLab.html` file with 3 tabs (Sensor Setup, Data Collection, Analysis). Two MVP experiments (Enthalpy of Neutralization with temperature probe, Strong Acid-Base Titration with pH sensor). EXPERIMENTS data object makes adding new experiments trivial. Standard SimEngine single-file patterns throughout.

**Tech Stack:** Single-file HTML/CSS/JS, HTML5 Canvas, no frameworks, `file://` compatible.

---

### Task 1: HTML Shell + CSS Foundation

**Files:**
- Create: `SimEngine_VernierLab.html`

**Step 1: Create the standard SimEngine shell**

Use the standard SimEngine HTML shell pattern (copy from CalorimetryLab as reference). Include:
- Standard `:root` CSS variables (--navy, --teal, --blue, --purple, --red, --amber, --text, --text-muted, --border, --card-bg, --sim-canvas-bg, --blue-bg, --teal-bg, --amber-bg, --red-bg, --purple-bg, --toggle-on, --green, --orange)
- Header with title "Virtual Vernier Lab", subtitle "IB Chemistry — Practical Skills", badge "Tool 1", HL toggle, Teacher toggle
- Tab bar with 3 tabs: "Sensor Setup", "Data Collection", "Analysis"
- `.sim-container` with 3 `.tab-content` divs (ids: tab-setup, tab-collect, tab-analysis)
- Standard toggle CSS, tab CSS, card CSS
- Skip link + ARIA roles (role="tablist", role="tab", role="tabpanel")
- Footer: `SimEngine — Virtual Vernier Lab • H=HL T=Teacher`

**Step 2: Add Vernier-specific CSS**

```css
/* Sensor card */
.sensor-card{background:var(--card-bg);border:2px solid var(--border);border-radius:12px;padding:1.25rem;display:flex;gap:1.25rem;align-items:center;}
.sensor-card.connected{border-color:var(--green);}
.sensor-status{display:inline-flex;align-items:center;gap:.35rem;font-size:.75rem;font-weight:600;padding:.25rem .75rem;border-radius:12px;}
.sensor-status.disconnected{background:var(--red-bg);color:var(--red);}
.sensor-status.connected{background:var(--teal-bg);color:var(--teal);}

/* Data table */
.data-table-wrap{max-height:400px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;}
.data-table{width:100%;border-collapse:collapse;font-size:.8rem;font-family:'Fira Code',monospace;}
.data-table th{background:var(--navy);color:white;padding:.4rem .6rem;position:sticky;top:0;text-align:left;font-size:.72rem;}
.data-table td{padding:.3rem .6rem;border-bottom:1px solid var(--border);}
.data-table tr:nth-child(even){background:#F8FAFC;}
.data-table tr.highlight{background:var(--teal-bg);}

/* Collection controls */
.collect-controls{display:flex;gap:.75rem;align-items:center;margin-bottom:1rem;padding:.75rem;background:var(--card-bg);border-radius:8px;border:1px solid var(--border);}
.collect-btn{padding:.5rem 1.25rem;border:none;border-radius:6px;font-family:inherit;font-weight:600;font-size:.82rem;cursor:pointer;transition:.2s;}
.collect-btn.start{background:var(--teal);color:white;}
.collect-btn.start:hover{background:#0F766E;}
.collect-btn.stop{background:var(--red);color:white;}
.collect-btn.reset{background:var(--border);color:var(--text);}
.speed-toggle{font-size:.72rem;padding:.25rem .5rem;border:1px solid var(--border);border-radius:4px;cursor:pointer;background:white;}
.speed-toggle.active{background:var(--teal);color:white;border-color:var(--teal);}

/* Analysis toolbar */
.analysis-toolbar{display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;}
.tool-btn{padding:.4rem .8rem;border:1px solid var(--border);border-radius:6px;background:white;font-size:.75rem;font-weight:500;cursor:pointer;font-family:inherit;transition:.2s;}
.tool-btn:hover{border-color:var(--teal);color:var(--teal);}
.tool-btn.active{background:var(--teal);color:white;border-color:var(--teal);}
.results-panel{background:var(--blue-bg);border:1px solid #BFDBFE;border-radius:8px;padding:1rem;margin-top:1rem;font-size:.85rem;}
.results-panel h4{font-size:.8rem;margin-bottom:.5rem;color:var(--navy);}
.result-row{display:flex;justify-content:space-between;padding:.25rem 0;border-bottom:1px solid rgba(0,0,0,.05);}
.result-label{color:var(--text-muted);font-size:.78rem;}
.result-value{font-family:'Fira Code',monospace;font-weight:600;font-size:.82rem;}
```

**Step 3: Add standard IIFE script block with tab switching, HL/Teacher toggles, keyboard shortcuts**

```javascript
(function(){
'use strict';
function clearChildren(el){ while(el.firstChild) el.removeChild(el.firstChild); }

// Tab switching
document.querySelectorAll('.tab-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    var target = btn.getAttribute('data-tab');
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    document.querySelectorAll('.tab-content').forEach(function(c){ c.classList.remove('active'); });
    btn.classList.add('active'); btn.setAttribute('aria-selected','true');
    document.getElementById('tab-'+target).classList.add('active');
  });
});

// HL / Teacher toggles
document.getElementById('hlToggle').addEventListener('change', function(){ document.body.classList.toggle('hl-active', this.checked); });
document.getElementById('teacherToggle').addEventListener('change', function(){ document.body.classList.toggle('teacher-active', this.checked); });

// Keyboard shortcuts
document.addEventListener('keydown', function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
  var k = e.key.toLowerCase();
  if(k==='h') document.getElementById('hlToggle').click();
  if(k==='t') document.getElementById('teacherToggle').click();
  if(k==='1'||k==='2'||k==='3') document.querySelectorAll('.tab-btn')[parseInt(k)-1].click();
  if(k==='r') resetExperiment();
  if(k===' '){ e.preventDefault(); toggleCollection(); }
});
```

**Step 4: Verify** — Preview in browser, confirm 3 tabs switch correctly, HL/Teacher toggles work, keyboard shortcuts function. Zero console errors.

---

### Task 2: Experiment Data + Sensor Database

**Files:**
- Modify: `SimEngine_VernierLab.html` (add inside IIFE, after utility functions)

**Step 1: Add sensor definitions**

```javascript
var SENSORS = {
  temperature: {
    id: 'temperature', name: 'Go Direct Temperature Probe',
    range: '-40 to 135 °C', precision: '±0.5 °C (probe) / ±0.01 °C (resolution)',
    uncertainty: '±0.5', unit: '°C', sampleRates: [1, 2, 5, 10],
    ibNotes: 'IB uncertainty: ±0.5 °C for the probe. Record to 1 d.p. Resolution is 0.01 °C but accuracy is ±0.5 °C.',
    calibration: 'Two-point calibration: ice water (0.0 °C) and warm water (checked with lab thermometer).',
    commonErrors: ['Not waiting for thermal equilibrium','Reading before stabilisation','Not stirring solution']
  },
  ph: {
    id: 'ph', name: 'Go Direct pH Sensor',
    range: '0–14', precision: '±0.1 (after calibration)',
    uncertainty: '±0.01', unit: '', sampleRates: [1, 2],
    ibNotes: 'IB uncertainty: ±0.01 pH (resolution). Calibrate with pH 4 and pH 7 buffer solutions before each use.',
    calibration: 'Two-point calibration: pH 4.00 buffer and pH 7.00 buffer. Rinse probe with distilled water between buffers.',
    commonErrors: ['Not calibrating before use','Letting probe dry out','Not rinsing between solutions']
  }
};
```

**Step 2: Add experiment definitions with data generators**

```javascript
var EXPERIMENTS = {
  neutralization: {
    id: 'neutralization',
    name: 'Enthalpy of Neutralization',
    sensor: 'temperature',
    description: 'Measure the temperature change when 25.0 cm³ of 1.00 mol dm⁻³ HCl reacts with 25.0 cm³ of 1.00 mol dm⁻³ NaOH in a polystyrene cup calorimeter.',
    xAxis: { label: 'Time', unit: 's' },
    yAxis: { label: 'Temperature', unit: '°C' },
    defaults: { duration: 180, sampleRate: 2 },
    ibContext: {
      equation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',
      expectedDeltaH: -57.1,
      expectedDeltaT: 6.8,
      formula: 'q = mcΔT, then ΔH = -q/n'
    },
    generate: function(settings){
      var data = [];
      var dt = 1 / settings.sampleRate;
      var n = Math.round(settings.duration * settings.sampleRate);
      var T0 = 22.0 + (Math.random() - 0.5) * 2;
      var dT = 6.5 + Math.random() * 1.0;
      var mixTime = 30;
      var mixIdx = Math.round(mixTime * settings.sampleRate);
      for(var i = 0; i < n; i++){
        var t = i * dt;
        var T;
        if(i < mixIdx){
          T = T0 + (Math.random() - 0.5) * 0.3;
        } else {
          var elapsed = t - mixTime;
          T = T0 + dT * (1 - Math.exp(-elapsed / 8)) - elapsed * 0.008;
          T += (Math.random() - 0.5) * 0.3;
        }
        data.push({ x: Math.round(t * 10) / 10, y: Math.round(T * 100) / 100 });
      }
      return data;
    }
  },
  titration: {
    id: 'titration',
    name: 'Strong Acid-Base Titration',
    sensor: 'ph',
    description: 'Monitor pH as 0.100 mol dm⁻³ NaOH is added dropwise from a burette to 25.0 cm³ of 0.100 mol dm⁻³ HCl.',
    xAxis: { label: 'Volume NaOH added', unit: 'cm³' },
    yAxis: { label: 'pH', unit: '' },
    defaults: { volumeIncrement: 1.0, totalVolume: 50.0 },
    ibContext: {
      equation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',
      expectedEquivVol: 25.0,
      expectedEquivPH: 7.0,
      formula: 'c(HCl) × V(HCl) = c(NaOH) × V(NaOH)'
    },
    generate: function(settings){
      var data = [];
      var cAcid = 0.100, vAcid = 25.0, cBase = 0.100;
      var v = 0;
      while(v <= settings.totalVolume + 0.01){
        var molesAcid = cAcid * vAcid / 1000;
        var molesBase = cBase * v / 1000;
        var totalVol = (vAcid + v) / 1000;
        var pH;
        if(molesBase < molesAcid * 0.999){
          var excessH = (molesAcid - molesBase) / totalVol;
          pH = -Math.log10(excessH);
        } else if(molesBase > molesAcid * 1.001){
          var excessOH = (molesBase - molesAcid) / totalVol;
          var pOH = -Math.log10(excessOH);
          pH = 14 - pOH;
        } else {
          pH = 7.0;
        }
        pH = Math.max(0, Math.min(14, pH + (Math.random() - 0.5) * 0.08));
        data.push({ x: Math.round(v * 100) / 100, y: Math.round(pH * 100) / 100 });
        v += settings.volumeIncrement;
      }
      return data;
    }
  }
};
```

**Step 3: Verify** — No preview changes yet, but ensure no console errors on page load.

---

### Task 3: Tab 1 — Sensor Setup UI

**Files:**
- Modify: `SimEngine_VernierLab.html` (build the setup tab content)

**Step 1: Build the setup UI via JS**

Create a `buildSetupTab()` function that populates `#tab-setup` with:
- Experiment selector dropdown (iterates `Object.keys(EXPERIMENTS)`)
- Sensor card (canvas thumbnail of probe + specs from `SENSORS`)
- Collection settings (duration/sampleRate for temperature, volumeIncrement/totalVolume for titration)
- "Connect Sensor" button that transitions card from disconnected (red) to connected (green) with status text
- Teacher panel with calibration notes and common errors

```javascript
function buildSetupTab(){
  var container = document.getElementById('tab-setup');
  clearChildren(container);

  // Experiment selector card
  var selectCard = document.createElement('div');
  selectCard.className = 'sim-card';
  // ... build card header + body with <select> for experiments
  // On change: update sensor card + settings

  // Sensor info card with canvas-drawn probe
  var sensorCard = document.createElement('div');
  sensorCard.className = 'sensor-card disconnected';
  sensorCard.id = 'sensorCard';
  // ... canvas thumbnail (60x80) of probe, sensor name, specs, status badge

  // Collection settings
  var settingsCard = document.createElement('div');
  settingsCard.className = 'sim-card';
  settingsCard.id = 'settingsCard';
  // ... duration/sampleRate sliders for temp; volumeIncrement/totalVolume for pH

  // Connect button
  var connectBtn = document.createElement('button');
  connectBtn.className = 'collect-btn start';
  connectBtn.textContent = 'Connect Sensor';
  connectBtn.addEventListener('click', function(){ connectSensor(); });

  // Teacher panel
  var teacher = document.createElement('div');
  teacher.className = 'teacher-panel';
  // ... calibration steps, common errors, IB uncertainty note

  container.appendChild(selectCard);
  container.appendChild(sensorCard);
  container.appendChild(settingsCard);
  container.appendChild(connectBtn);
  container.appendChild(teacher);
}
```

Also add `drawTemperatureProbe(ctx, cx, cy, s)` and `drawpHProbe(ctx, cx, cy, s)` canvas drawing functions.

**Step 2: Add connectSensor() function**

```javascript
var _sensorConnected = false;
function connectSensor(){
  _sensorConnected = !_sensorConnected;
  var card = document.getElementById('sensorCard');
  var btn = card.parentNode.querySelector('.collect-btn');
  if(_sensorConnected){
    card.classList.remove('disconnected'); card.classList.add('connected');
    card.querySelector('.sensor-status').textContent = '● Connected';
    card.querySelector('.sensor-status').className = 'sensor-status connected';
    btn.textContent = 'Disconnect';
  } else {
    card.classList.remove('connected'); card.classList.add('disconnected');
    card.querySelector('.sensor-status').textContent = '○ Disconnected';
    card.querySelector('.sensor-status').className = 'sensor-status disconnected';
    btn.textContent = 'Connect Sensor';
  }
}
```

**Step 3: Verify** — Preview Tab 1: select each experiment, sensor card updates, connect/disconnect toggles, settings change per experiment type.

---

### Task 4: Tab 2 — Data Collection Engine + Live Graph

**Files:**
- Modify: `SimEngine_VernierLab.html`

**Step 1: Build the data collection UI**

Create `buildCollectTab()` that populates `#tab-collect` with:
- Controls bar (Start, Stop, Reset buttons + speed toggles 1x/2x/5x)
- Split layout: data table (left, ~35% width) + graph canvas (right, ~65% width)
- Status bar showing collection progress

```javascript
function buildCollectTab(){
  var container = document.getElementById('tab-collect');
  clearChildren(container);

  // Controls bar
  var controls = document.createElement('div');
  controls.className = 'collect-controls';
  // Start/Stop/Reset buttons + speed toggles (1x, 2x, 5x)

  // Split layout
  var layout = document.createElement('div');
  layout.className = 'lab-layout';

  // Data table (left)
  var tableWrap = document.createElement('div');
  tableWrap.className = 'data-table-wrap';
  tableWrap.style.cssText = 'flex:0 0 35%;min-width:200px;';
  var table = document.createElement('table');
  table.className = 'data-table';
  table.id = 'dataTable';
  // Headers set from active experiment axes

  // Graph canvas (right)
  var canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'flex:1;min-width:300px;';
  var canvas = document.createElement('canvas');
  canvas.id = 'collectGraph';
  canvas.setAttribute('data-w', '600');
  canvas.setAttribute('data-h', '400');
  canvas.setAttribute('aria-label', 'Data collection graph');
  canvas.setAttribute('role', 'img');
  // ... DPR setup

  container.appendChild(controls);
  layout.appendChild(tableWrap);
  layout.appendChild(canvasWrap);
  container.appendChild(layout);
}
```

**Step 2: Implement the collection engine**

```javascript
var _collectedData = [];
var _collecting = false;
var _collectionTimer = null;
var _dataIndex = 0;
var _generatedData = [];
var _speed = 1;

function startCollection(){
  if(!_sensorConnected){ showFeedback('Connect the sensor first!'); return; }
  var exp = EXPERIMENTS[_activeExperiment];
  _generatedData = exp.generate(_settings);
  _collectedData = [];
  _dataIndex = 0;
  _collecting = true;
  updateCollectButtons();
  collectNext();
}

function collectNext(){
  if(!_collecting || _dataIndex >= _generatedData.length){
    _collecting = false;
    updateCollectButtons();
    return;
  }
  _collectedData.push(_generatedData[_dataIndex]);
  addTableRow(_generatedData[_dataIndex]);
  _dataIndex++;
  renderCollectGraph();
  var delay = (_activeExperiment === 'titration') ? 300 : (1000 / _settings.sampleRate);
  _collectionTimer = setTimeout(collectNext, delay / _speed);
}

function stopCollection(){
  _collecting = false;
  clearTimeout(_collectionTimer);
  updateCollectButtons();
}

function resetExperiment(){
  stopCollection();
  _collectedData = [];
  _dataIndex = 0;
  clearTable();
  renderCollectGraph();
}

function toggleCollection(){
  if(_collecting) stopCollection(); else startCollection();
}
```

**Step 3: Implement renderCollectGraph()**

Canvas graph with axes, gridlines, and plotted data points + connecting lines:

```javascript
function renderCollectGraph(){
  var canvas = document.getElementById('collectGraph');
  if(!canvas) return;
  var dpr = window.devicePixelRatio || 1;
  var w = parseInt(canvas.getAttribute('data-w'));
  var h = parseInt(canvas.getAttribute('data-h'));
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  var pad = { top: 30, right: 30, bottom: 50, left: 65 };
  var pw = w - pad.left - pad.right;
  var ph = h - pad.top - pad.bottom;
  var exp = EXPERIMENTS[_activeExperiment];

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);

  // Determine axis ranges from data or defaults
  var xMin = 0, xMax, yMin, yMax;
  if(_activeExperiment === 'titration'){
    xMax = _settings.totalVolume || 50;
    yMin = 0; yMax = 14;
  } else {
    xMax = _settings.duration || 180;
    yMin = 15; yMax = 35;
  }
  if(_collectedData.length > 0){
    // Auto-adjust y range with 10% padding
    var ys = _collectedData.map(function(d){ return d.y; });
    var dataMin = Math.min.apply(null, ys);
    var dataMax = Math.max.apply(null, ys);
    var margin = (dataMax - dataMin) * 0.1 || 1;
    yMin = Math.floor(dataMin - margin);
    yMax = Math.ceil(dataMax + margin);
  }

  // Grid + axes
  ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 0.5;
  // ... draw gridlines, axis labels, tick marks

  // Plot data
  if(_collectedData.length > 0){
    ctx.strokeStyle = '#0D9488'; ctx.lineWidth = 2;
    ctx.beginPath();
    _collectedData.forEach(function(d, i){
      var px = pad.left + ((d.x - xMin) / (xMax - xMin)) * pw;
      var py = pad.top + (1 - (d.y - yMin) / (yMax - yMin)) * ph;
      if(i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Data points
    ctx.fillStyle = '#0D9488';
    _collectedData.forEach(function(d){
      var px = pad.left + ((d.x - xMin) / (xMax - xMin)) * pw;
      var py = pad.top + (1 - (d.y - yMin) / (yMax - yMin)) * ph;
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2); ctx.fill();
    });
  }

  // Axis titles
  ctx.fillStyle = var(--navy); ctx.font = '600 12px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(exp.xAxis.label + (exp.xAxis.unit ? ' / ' + exp.xAxis.unit : ''), pad.left + pw/2, h - 8);
  ctx.save(); ctx.translate(14, pad.top + ph/2); ctx.rotate(-Math.PI/2);
  ctx.fillText(exp.yAxis.label + (exp.yAxis.unit ? ' / ' + exp.yAxis.unit : ''), 0, 0);
  ctx.restore();
}
```

**Step 4: Verify** — Preview Tab 2: start collection for both experiments, watch data table populate and graph build in real time. Test stop/reset. Test speed toggles.

---

### Task 5: Tab 3 — Analysis Tools

**Files:**
- Modify: `SimEngine_VernierLab.html`

**Step 1: Build the analysis UI**

Create `buildAnalysisTab()`:
- Toolbar with 5 tool buttons (Statistics, Linear Fit, Curve Fit, Tangent, Annotation)
- Graph canvas (reuses same rendering as collectGraph but with interactive overlay)
- Results panel below graph
- "Copy Data" button

**Step 2: Implement Statistics tool**

Click two points on graph to select a range → calculate mean, min, max, std dev for y values in that range → display in results panel.

**Step 3: Implement Linear Fit tool**

Click two points → calculate slope and intercept using least-squares regression on ALL data between those x values → draw best-fit line → show equation y = mx + b and R² in results panel.

**Step 4: Implement Curve Fit tool**

Dropdown: linear, quadratic, exponential. Fit to all data. Draw fitted curve. Show equation + R². Use least-squares regression. For exponential: linearize with ln(y) then fit.

**Step 5: Implement Tangent tool**

Click a data point → calculate instantaneous rate using central difference (or forward/backward at endpoints) → draw tangent line segment through point → show slope in results panel.

**Step 6: Implement Annotation tool**

Click on graph → prompt for text via a small input field → place text label at that position. Store annotations in array. Render on graph.

**Step 7: Implement Copy Data button**

```javascript
function copyData(){
  var exp = EXPERIMENTS[_activeExperiment];
  var header = exp.xAxis.label + '\t' + exp.yAxis.label + '\n';
  var rows = _collectedData.map(function(d){ return d.x + '\t' + d.y; }).join('\n');
  navigator.clipboard.writeText(header + rows).then(function(){
    showFeedback('Data copied to clipboard!');
  });
}
```

**Step 8: Add IB context results**

For temperature experiment: show ΔT, q = mcΔT calculation, ΔH = -q/n
For titration: show equivalence point volume, calculate unknown concentration

**Step 9: Verify** — Preview Tab 3: test each tool with both experiments. Verify calculations are correct. Test copy data.

---

### Task 6: Canvas Drawing Functions for Sensors

**Files:**
- Modify: `SimEngine_VernierLab.html` (add before SENSORS definition)

**Step 1: Add sensor probe draw functions**

```javascript
function drawTemperatureProbe(ctx, cx, cy, s){
  s = s || 1; ctx.save();
  ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1;
  // Handle/body (grey cylinder)
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(cx-6*s, cy-25*s, 12*s, 30*s);
  ctx.strokeRect(cx-6*s, cy-25*s, 12*s, 30*s);
  // Probe shaft (thin metal)
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(cx-2*s, cy+5*s, 4*s, 25*s);
  ctx.strokeRect(cx-2*s, cy+5*s, 4*s, 25*s);
  // Tip (sensor bulb)
  ctx.fillStyle = '#64748B';
  ctx.beginPath(); ctx.arc(cx, cy+32*s, 3*s, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // Status LED
  ctx.fillStyle = '#22C55E';
  ctx.beginPath(); ctx.arc(cx, cy-20*s, 2*s, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawpHProbe(ctx, cx, cy, s){
  s = s || 1; ctx.save();
  ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1;
  // Handle (dark grey)
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx-7*s, cy-28*s, 14*s, 20*s);
  ctx.strokeRect(cx-7*s, cy-28*s, 14*s, 20*s);
  // Glass body (translucent)
  ctx.fillStyle = 'rgba(226,232,240,0.6)';
  ctx.fillRect(cx-5*s, cy-8*s, 10*s, 30*s);
  ctx.strokeRect(cx-5*s, cy-8*s, 10*s, 30*s);
  // Reference junction (small band)
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(cx-5*s, cy+2*s, 10*s, 3*s);
  // Glass bulb tip
  ctx.fillStyle = 'rgba(200,220,240,0.5)';
  ctx.beginPath(); ctx.arc(cx, cy+24*s, 5*s, 0, Math.PI); ctx.fill(); ctx.stroke();
  // Status LED
  ctx.fillStyle = '#22C55E';
  ctx.beginPath(); ctx.arc(cx, cy-24*s, 2*s, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}
```

**Step 2: Verify** — Sensor thumbnails appear correctly in Setup tab sensor card.

---

### Task 7: Teacher Mode + HL Content

**Files:**
- Modify: `SimEngine_VernierLab.html`

**Step 1: Add teacher panels to each tab**

- Tab 1: Show expected data ranges, calibration procedure, IB uncertainty values
- Tab 2: Show expected graph shape (annotated), key moments to watch for
- Tab 3: Show expected analysis results (ΔH = -57.1 kJ/mol, equivalence at 25.0 cm³)

**Step 2: Add HL-only content**

- HL panel on Analysis tab: propagation of uncertainty through q = mcΔT
- HL panel: systematic vs random error discussion for each experiment

**Step 3: Verify** — Toggle Teacher and HL, confirm panels appear/hide correctly.

---

### Task 8: Update Index + Project Status + Commit

**Files:**
- Modify: `SimEngine_Index.html` — add VernierLab to SIMS array (36 → 37 sims)
- Modify: `SimEngine_Project_Status_2026-04-03.md` — update Phase 5 status

**Step 1: Add to Index SIMS array**

```javascript
{ file:'SimEngine_VernierLab.html', name:'Virtual Vernier Lab', section:'Math', topic:'Tool 1', level:'both',
  desc:'Simulate Vernier sensors and Graphical Analysis — collect and analyze data for enthalpy and titration experiments',
  keywords:'vernier sensor probe temperature pH data collection graphical analysis titration calorimetry enthalpy' }
```

Update count: 36 → 37 Simulations.

**Step 2: Update Phase 5 in project status**

Change "NOT STARTED" to "IN PROGRESS (MVP: 2 experiments)".

**Step 3: Commit**

```bash
git add SimEngine_VernierLab.html SimEngine_Index.html SimEngine_Project_Status_2026-04-03.md docs/plans/2026-04-05-vernier-lab-design.md docs/plans/2026-04-05-vernier-lab-implementation.md
git commit -m "feat: add Virtual Vernier Lab sim (Phase 5 MVP) with temperature and pH sensor experiments"
```

---

### Task 9: End-to-End Verification

**Step 1:** Open VernierLab in preview. Test full workflow for neutralization experiment:
- Select experiment → connect sensor → configure settings → switch to Tab 2 → start collection → watch data build → stop → switch to Tab 3 → use each analysis tool → copy data

**Step 2:** Repeat for titration experiment.

**Step 3:** Verify: teacher mode shows expected results, HL content appears, all keyboard shortcuts work.

**Step 4:** Open Index, confirm 37 sims and VernierLab card appears.

**Step 5:** Zero console errors across all pages.
