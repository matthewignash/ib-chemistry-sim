# Virtual Lab Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build SimEngine_LabBuilder.html — a two-tab lab apparatus assembly simulator (guided + sandbox) using canvas-drawn equipment.

**Architecture:** Single-file HTML sim following standard SimEngine patterns (IIFE, no innerHTML, clearChildren helper, CSS custom properties). Two tabs: Guided Assembly with step-by-step validation, and Sandbox with free-form placement. Reuses 26 canvas draw functions from EquipmentTrainer, adds ~5 new ones for condenser/adapter equipment.

**Tech Stack:** Vanilla HTML/CSS/JS, HTML5 Canvas, no frameworks, file:// compatible.

---

### Task 1: HTML Shell + CSS Foundation

**Files:**
- Create: `SimEngine_LabBuilder.html`

**Step 1: Create the HTML file with standard SimEngine shell**

Write the complete HTML skeleton: DOCTYPE, head with Google Fonts import, `:root` CSS custom properties (--navy:#1E293B, --teal:#0D9488, --blue:#3B82F6, --purple:#7C3AED, etc.), body reset styles, sim-header, toggles, tab-bar with 2 tabs (guided, sandbox), tab-content containers, keyboard hints footer, and empty `<script>` IIFE.

The layout needs a special split-pane structure for this sim:
```html
<div class="lab-layout">
  <aside class="palette" id="palette"><!-- equipment list --></aside>
  <main class="workspace-wrap">
    <canvas id="workspace" width="800" height="600"></canvas>
    <div class="step-panel" id="stepPanel"><!-- guided mode steps --></div>
  </main>
</div>
```

CSS for the lab-specific layout:
```css
.lab-layout{display:flex;gap:0;height:calc(100vh - 200px);min-height:500px;}
.palette{width:200px;border-right:1px solid var(--border);overflow-y:auto;background:var(--card-bg);flex-shrink:0;}
.workspace-wrap{flex:1;position:relative;background:var(--sim-canvas-bg);}
#workspace{width:100%;height:100%;display:block;cursor:crosshair;}
.step-panel{position:absolute;bottom:0;left:0;right:0;background:rgba(255,255,255,0.95);border-top:1px solid var(--border);padding:1rem;max-height:140px;overflow-y:auto;}

/* Palette styles */
.palette-search{width:100%;padding:.5rem;border:none;border-bottom:1px solid var(--border);font-family:inherit;font-size:.8rem;}
.palette-category{border-bottom:1px solid var(--border);}
.palette-category-header{padding:.5rem .75rem;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);cursor:pointer;display:flex;justify-content:space-between;align-items:center;}
.palette-category-header:hover{background:var(--teal-bg);}
.palette-category.collapsed .palette-items{display:none;}
.palette-item{padding:.4rem .75rem;font-size:.8rem;cursor:grab;display:flex;align-items:center;gap:.5rem;border-bottom:1px solid #f1f5f9;}
.palette-item:hover{background:var(--blue-bg);}
.palette-item.selected{background:var(--teal-bg);border-left:3px solid var(--teal);}
.palette-item canvas{width:36px;height:36px;flex-shrink:0;}

/* Step panel styles */
.step-instruction{font-size:.9rem;font-weight:500;margin-bottom:.5rem;}
.step-hint{font-size:.8rem;color:var(--text-muted);font-style:italic;}
.step-progress{display:flex;gap:.25rem;margin-bottom:.5rem;}
.step-dot{width:24px;height:24px;border-radius:50%;background:var(--border);display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;color:var(--text-muted);}
.step-dot.done{background:var(--teal);color:white;}
.step-dot.current{background:var(--blue);color:white;}

/* Equipment info popup */
.eq-popup{position:absolute;background:white;border:1px solid var(--border);border-radius:8px;padding:.75rem;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:250px;z-index:100;font-size:.8rem;pointer-events:none;}
.eq-popup h4{margin:0 0 .25rem;font-size:.85rem;color:var(--navy);}
.eq-popup .uncertainty{color:var(--teal);font-family:'Fira Code',monospace;font-size:.75rem;}
.eq-popup .ib-note{margin-top:.5rem;padding-top:.5rem;border-top:1px solid var(--border);color:var(--text-muted);}

/* Sandbox toolbar */
.sandbox-toolbar{position:absolute;top:.5rem;right:.5rem;display:flex;gap:.5rem;}
.sandbox-btn{padding:.4rem .75rem;border:1px solid var(--border);border-radius:4px;background:white;font-size:.75rem;cursor:pointer;font-family:inherit;}
.sandbox-btn:hover{background:var(--blue-bg);}

/* Template selector */
.template-selector{padding:1rem;text-align:center;}
.template-card{display:inline-block;width:200px;padding:1rem;margin:.5rem;border:2px solid var(--border);border-radius:8px;cursor:pointer;text-align:center;transition:.2s;}
.template-card:hover{border-color:var(--teal);background:var(--teal-bg);}
.template-card h3{font-size:.9rem;margin:0 0 .25rem;}
.template-card p{font-size:.75rem;color:var(--text-muted);margin:0;}

/* Score display */
.score-bar{display:flex;gap:1rem;padding:.5rem 1rem;background:var(--blue-bg);border-radius:6px;font-size:.8rem;align-items:center;}
.score-item{display:flex;align-items:center;gap:.25rem;}
.score-label{color:var(--text-muted);}
.score-value{font-weight:600;font-family:'Fira Code',monospace;}

/* Feedback flash */
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes pulse-green{0%,100%{box-shadow:none}50%{box-shadow:0 0 20px rgba(13,148,136,0.4)}}
.flash-wrong{animation:shake 0.3s ease;}
.flash-correct{animation:pulse-green 0.5s ease;}

/* Connection lines drawn on canvas, no CSS needed */

/* Bin zone */
.bin-zone{position:absolute;bottom:150px;right:10px;width:50px;height:50px;border:2px dashed var(--red);border-radius:8px;display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;}
.bin-zone.active{opacity:0.6;}
.bin-zone.hover{opacity:1;background:var(--red-bg);}
```

Include standard SimEngine styles for: `*` reset, body, .sim-header, .toggle-group, .toggle-btn, .tab-bar, .tab-btn, .tab-num, .tab-content, .keyboard-hints, kbd.

**Step 2: Verify file loads in browser**

Open the file in the preview server. Should see: header with title "Virtual Lab Builder", HL/Teacher toggles, 2 tab buttons, empty split-pane layout with palette sidebar and canvas area.

Run: Start preview server, navigate to sim, take screenshot.
Expected: Styled page with correct layout, no console errors.

**Step 3: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): scaffold HTML shell with split-pane layout and CSS"
```

---

### Task 2: Canvas Drawing Engine + Equipment Database

**Files:**
- Modify: `SimEngine_LabBuilder.html`

**Step 1: Add color constants and all 26 draw functions inside the IIFE**

Copy from EquipmentTrainer.html (lines 236-700):
- Color constants: STROKE, FILL_GLASS, FILL_LIQUID, FILL_METAL, FILL_DARK, FILL_RED, FILL_BLUE, FILL_COPPER, FILL_FLAME_BLUE, FILL_FLAME_ORANGE
- All 26 draw functions (drawBurette through drawGoggles)
- The clearChildren helper: `function clearChildren(el){ while(el.firstChild) el.removeChild(el.firstChild); }`

**Step 2: Add 5 new draw functions for template-specific equipment**

```javascript
function drawLiebigCondenser(ctx, cx, cy, s){
  s = s || 1; ctx.save();
  ctx.strokeStyle = STROKE; ctx.lineWidth = 1.5;
  // Outer tube (angled)
  ctx.fillStyle = FILL_GLASS;
  ctx.beginPath();
  ctx.moveTo(cx-40*s, cy-8*s); ctx.lineTo(cx+40*s, cy-8*s);
  ctx.lineTo(cx+40*s, cy+8*s); ctx.lineTo(cx-40*s, cy+8*s);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Inner tube
  ctx.beginPath();
  ctx.moveTo(cx-40*s, cy-3*s); ctx.lineTo(cx+40*s, cy-3*s);
  ctx.lineTo(cx+40*s, cy+3*s); ctx.lineTo(cx-40*s, cy+3*s);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Water inlet/outlet nubs
  ctx.fillStyle = FILL_GLASS;
  ctx.fillRect(cx-15*s, cy+8*s, 6*s, 8*s); ctx.strokeRect(cx-15*s, cy+8*s, 6*s, 8*s);
  ctx.fillRect(cx+10*s, cy-16*s, 6*s, 8*s); ctx.strokeRect(cx+10*s, cy-16*s, 6*s, 8*s);
  // Water flow arrows (blue)
  ctx.fillStyle = FILL_BLUE; ctx.font = (8*s)+'px Inter';
  ctx.fillText('\u2191', cx-13*s, cy+20*s);
  ctx.fillText('\u2191', cx+12*s, cy-10*s);
  ctx.restore();
}

function drawWhiteTile(ctx, cx, cy, s){
  s = s || 1; ctx.save();
  ctx.strokeStyle = STROKE; ctx.lineWidth = 1;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx-25*s, cy-2*s, 50*s, 4*s);
  ctx.strokeRect(cx-25*s, cy-2*s, 50*s, 4*s);
  // Cross-hairs for colour visibility
  ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx-10*s, cy); ctx.lineTo(cx+10*s, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy-2*s); ctx.lineTo(cx, cy+2*s); ctx.stroke();
  ctx.restore();
}

function drawRubberTubing(ctx, cx, cy, s){
  s = s || 1; ctx.save();
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 3*s;
  ctx.beginPath();
  ctx.moveTo(cx-20*s, cy); ctx.quadraticCurveTo(cx, cy+15*s, cx+20*s, cy);
  ctx.stroke();
  ctx.restore();
}

function drawPipetteFiller(ctx, cx, cy, s){
  s = s || 1; ctx.save();
  ctx.strokeStyle = STROKE; ctx.lineWidth = 1.5;
  // Bulb
  ctx.fillStyle = FILL_RED;
  ctx.beginPath(); ctx.arc(cx, cy-15*s, 10*s, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  // Nozzle
  ctx.fillStyle = FILL_DARK;
  ctx.fillRect(cx-2*s, cy-5*s, 4*s, 20*s); ctx.strokeRect(cx-2*s, cy-5*s, 4*s, 20*s);
  ctx.restore();
}

function drawAntiBumpingGranules(ctx, cx, cy, s){
  s = s || 1; ctx.save();
  ctx.fillStyle = '#94A3B8';
  for(var i=0;i<5;i++){
    ctx.beginPath();
    ctx.arc(cx + (Math.random()*10-5)*s, cy + (Math.random()*6-3)*s, 2*s, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}
```

**Step 3: Add EQUIPMENT data array (subset of equipment.json, inline)**

Include all equipment used by the two templates plus common sandbox items (~30 items). Each entry: id, name, category, uncertainty, typicalUse, ibNotes, commonMistakes, draw (function reference).

```javascript
var EQUIPMENT = [
  {id:'retort_stand', name:'Retort Stand and Clamp', category:'general', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
   typicalUse:'Holding and supporting apparatus at height', ibNotes:'Ensure clamp is tight. Use boss head for angle adjustment.', commonMistakes:['Not tightening clamp enough','Overloading one side'], draw:drawRetortStand},
  {id:'round_flask', name:'Round-Bottom Flask', category:'glassware', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
   typicalUse:'Even heating; used in distillation and reflux', ibNotes:'Always support with clamp, never free-standing. Add anti-bumping granules before heating.', commonMistakes:['Heating without anti-bumping granules','Not clamping securely'], draw:drawRoundBottomFlask},
  // ... all 26 from EquipmentTrainer + new ones:
  {id:'liebig_condenser', name:'Liebig Condenser', category:'general', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
   typicalUse:'Cooling vapours during distillation', ibNotes:'Water flows in at bottom, out at top (countercurrent).', commonMistakes:['Running water in wrong direction','Not securing with clamp'], draw:drawLiebigCondenser},
  {id:'white_tile', name:'White Tile', category:'general', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
   typicalUse:'Placed under titration flask to see indicator colour change', ibNotes:'Essential for accurate endpoint detection.', commonMistakes:[], draw:drawWhiteTile},
  {id:'pipette_filler', name:'Pipette Filler', category:'general', uncertainty:'N/A', uncertaintyVal:null, unit:'', precision:'N/A',
   typicalUse:'Safely drawing liquid into pipettes', ibNotes:'Never pipette by mouth.', commonMistakes:['Pipetting by mouth'], draw:drawPipetteFiller},
];

var EQ_MAP = {};
EQUIPMENT.forEach(function(eq){ EQ_MAP[eq.id] = eq; });
```

**Step 4: Add CATEGORIES and CONFUSION groups**

```javascript
var CATEGORIES = [
  {id:'volumetric', name:'Volumetric', icon:'\u25B3'},
  {id:'glassware', name:'Glassware', icon:'\u25CB'},
  {id:'heating', name:'Heating', icon:'\u2668'},
  {id:'measurement', name:'Measurement', icon:'\u2316'},
  {id:'separation', name:'Separation', icon:'\u25BD'},
  {id:'safety', name:'Safety', icon:'\u26A0'},
  {id:'general', name:'General', icon:'\u2699'}
];
```

**Step 5: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): add canvas drawing engine + equipment database"
```

---

### Task 3: Equipment Palette UI

**Files:**
- Modify: `SimEngine_LabBuilder.html`

**Step 1: Build the palette renderer**

```javascript
function buildPalette(){
  var palette = document.getElementById('palette');
  clearChildren(palette);

  // Search input
  var search = document.createElement('input');
  search.className = 'palette-search';
  search.placeholder = 'Search equipment...';
  search.setAttribute('type', 'text');
  search.addEventListener('input', function(){ filterPalette(search.value); });
  palette.appendChild(search);

  // Category groups
  CATEGORIES.forEach(function(cat){
    var items = EQUIPMENT.filter(function(eq){ return eq.category === cat.id; });
    if(items.length === 0) return;

    var section = document.createElement('div');
    section.className = 'palette-category';
    section.setAttribute('data-cat', cat.id);

    var header = document.createElement('div');
    header.className = 'palette-category-header';
    header.textContent = cat.icon + ' ' + cat.name + ' (' + items.length + ')';
    var arrow = document.createElement('span');
    arrow.textContent = '\u25BC';
    header.appendChild(arrow);
    header.addEventListener('click', function(){
      section.classList.toggle('collapsed');
      arrow.textContent = section.classList.contains('collapsed') ? '\u25B6' : '\u25BC';
    });
    section.appendChild(header);

    var list = document.createElement('div');
    list.className = 'palette-items';
    items.forEach(function(eq){
      var item = document.createElement('div');
      item.className = 'palette-item';
      item.setAttribute('data-eq', eq.id);

      // Thumbnail canvas
      var thumb = document.createElement('canvas');
      thumb.width = 36; thumb.height = 36;
      var tctx = thumb.getContext('2d');
      eq.draw(tctx, 18, 18, 0.3);
      item.appendChild(thumb);

      var label = document.createElement('span');
      label.textContent = eq.name;
      item.appendChild(label);

      item.addEventListener('click', function(){ selectEquipment(eq.id); });
      list.appendChild(item);
    });
    section.appendChild(list);
    palette.appendChild(section);
  });
}

function filterPalette(query){
  var q = query.toLowerCase();
  document.querySelectorAll('.palette-item').forEach(function(item){
    var eq = EQ_MAP[item.getAttribute('data-eq')];
    var match = !q || eq.name.toLowerCase().indexOf(q) !== -1 ||
                eq.category.toLowerCase().indexOf(q) !== -1 ||
                eq.typicalUse.toLowerCase().indexOf(q) !== -1;
    item.style.display = match ? '' : 'none';
  });
  // Show categories that have visible items
  document.querySelectorAll('.palette-category').forEach(function(cat){
    var hasVisible = cat.querySelector('.palette-item:not([style*="display: none"])');
    cat.style.display = hasVisible ? '' : 'none';
  });
}

var _selectedEquipment = null;

function selectEquipment(eqId){
  _selectedEquipment = eqId;
  document.querySelectorAll('.palette-item').forEach(function(item){
    item.classList.toggle('selected', item.getAttribute('data-eq') === eqId);
  });
}
```

**Step 2: Call buildPalette() in init**

```javascript
function init(){
  buildPalette();
  initCanvas();
  switchTab('guided');
  // ... keyboard + toggle handlers
}
document.addEventListener('DOMContentLoaded', init);
```

**Step 3: Verify palette renders**

Preview the sim. Should see: left sidebar with searchable category groups, each equipment item showing a canvas thumbnail and name. Clicking an item highlights it.

**Step 4: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): add equipment palette with search and category groups"
```

---

### Task 4: Workspace Canvas + Placement System

**Files:**
- Modify: `SimEngine_LabBuilder.html`

**Step 1: Implement canvas initialization and grid drawing**

```javascript
var _canvas, _ctx;
var _placed = []; // {id, eqId, x, y, scale}
var _nextId = 1;
var _dragging = null; // {placedId, offsetX, offsetY}
var _hovered = null; // placed item id

function initCanvas(){
  _canvas = document.getElementById('workspace');
  _ctx = _canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas(){
  var wrap = _canvas.parentElement;
  _canvas.width = wrap.clientWidth;
  _canvas.height = wrap.clientHeight;
  renderWorkspace();
}

function renderWorkspace(){
  var w = _canvas.width, h = _canvas.height;
  _ctx.clearRect(0, 0, w, h);

  // Grid
  _ctx.strokeStyle = '#E2E8F0';
  _ctx.lineWidth = 0.5;
  for(var x = 0; x < w; x += 20){
    _ctx.beginPath(); _ctx.moveTo(x, 0); _ctx.lineTo(x, h); _ctx.stroke();
  }
  for(var y = 0; y < h; y += 20){
    _ctx.beginPath(); _ctx.moveTo(0, y); _ctx.lineTo(w, y); _ctx.stroke();
  }

  // Placed equipment
  _placed.forEach(function(item){
    var eq = EQ_MAP[item.eqId];
    if(eq && eq.draw){
      eq.draw(_ctx, item.x, item.y, item.scale || 0.8);
    }
    // Highlight if hovered
    if(_hovered === item.id){
      _ctx.strokeStyle = 'rgba(13,148,136,0.5)';
      _ctx.lineWidth = 2;
      _ctx.strokeRect(item.x - 30, item.y - 30, 60, 60);
    }
  });

  // Connections
  _connections.forEach(function(conn){
    drawConnection(conn.fromId, conn.toId, conn.label);
  });

  // Annotations (guided mode, after completion)
  if(_guidedComplete && _activeTemplate){
    _activeTemplate.annotations.forEach(function(ann){
      _ctx.font = '11px Inter';
      _ctx.fillStyle = 'rgba(30,41,59,0.8)';
      _ctx.fillText(ann.text, ann.x * w, ann.y * h);
    });
  }
}
```

**Step 2: Add mouse event handlers for placement, dragging, and hover**

```javascript
function getCanvasPos(e){
  var rect = _canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function hitTest(x, y){
  // Check placed items (reverse order = top first)
  for(var i = _placed.length - 1; i >= 0; i--){
    var item = _placed[i];
    var dx = x - item.x, dy = y - item.y;
    if(Math.abs(dx) < 30 && Math.abs(dy) < 30) return item;
  }
  return null;
}

function snapToGrid(val){ return Math.round(val / 20) * 20; }

_canvas.addEventListener('mousedown', function(e){
  var pos = getCanvasPos(e);
  var hit = hitTest(pos.x, pos.y);

  if(hit){
    // Start dragging existing item
    _dragging = { placedId: hit.id, offsetX: pos.x - hit.x, offsetY: pos.y - hit.y };
  } else if(_selectedEquipment){
    // Place new equipment
    var snapped = { x: snapToGrid(pos.x), y: snapToGrid(pos.y) };
    placeEquipment(_selectedEquipment, snapped.x, snapped.y);
  }
});

_canvas.addEventListener('mousemove', function(e){
  var pos = getCanvasPos(e);
  if(_dragging){
    var item = _placed.find(function(p){ return p.id === _dragging.placedId; });
    if(item){
      item.x = snapToGrid(pos.x - _dragging.offsetX);
      item.y = snapToGrid(pos.y - _dragging.offsetY);
      renderWorkspace();
    }
  } else {
    var hit = hitTest(pos.x, pos.y);
    var newHover = hit ? hit.id : null;
    if(newHover !== _hovered){
      _hovered = newHover;
      renderWorkspace();
      showEquipmentPopup(hit, pos);
    }
  }
});

_canvas.addEventListener('mouseup', function(e){
  if(_dragging){
    // Check if dragged to bin zone
    var pos = getCanvasPos(e);
    var binZone = document.querySelector('.bin-zone');
    if(binZone){
      var binRect = binZone.getBoundingClientRect();
      var canvasRect = _canvas.getBoundingClientRect();
      var binX = binRect.left - canvasRect.left;
      var binY = binRect.top - canvasRect.top;
      if(pos.x > binX && pos.y > binY){
        removeEquipment(_dragging.placedId);
      }
    }
    // Check guided mode validation
    if(_activeTab === 'guided' && _activeTemplate){
      validatePlacement(_dragging.placedId);
    }
    _dragging = null;
    renderWorkspace();
  }
});

function placeEquipment(eqId, x, y){
  var item = { id: _nextId++, eqId: eqId, x: x, y: y, scale: 0.8 };
  _placed.push(item);

  // In guided mode, validate immediately
  if(_activeTab === 'guided' && _activeTemplate){
    validatePlacement(item.id);
  }

  renderWorkspace();
  return item;
}

function removeEquipment(placedId){
  _placed = _placed.filter(function(p){ return p.id !== placedId; });
  _connections = _connections.filter(function(c){ return c.fromId !== placedId && c.toId !== placedId; });
  renderWorkspace();
}
```

**Step 3: Add equipment info popup**

```javascript
function showEquipmentPopup(hit, pos){
  var existing = document.querySelector('.eq-popup');
  if(existing) existing.parentNode.removeChild(existing);
  if(!hit) return;

  var eq = EQ_MAP[hit.eqId];
  if(!eq) return;

  var popup = document.createElement('div');
  popup.className = 'eq-popup';

  var h4 = document.createElement('h4');
  h4.textContent = eq.name;
  popup.appendChild(h4);

  if(eq.uncertainty !== 'N/A'){
    var unc = document.createElement('div');
    unc.className = 'uncertainty';
    unc.textContent = eq.uncertainty;
    popup.appendChild(unc);
  }

  var use = document.createElement('div');
  use.textContent = eq.typicalUse;
  popup.appendChild(use);

  if(eq.ibNotes){
    var note = document.createElement('div');
    note.className = 'ib-note';
    note.textContent = eq.ibNotes;
    popup.appendChild(note);
  }

  popup.style.left = (pos.x + 10) + 'px';
  popup.style.top = (pos.y - 80) + 'px';
  _canvas.parentElement.appendChild(popup);

  // Auto-remove after 3s or on mouse move
  setTimeout(function(){
    if(popup.parentNode) popup.parentNode.removeChild(popup);
  }, 3000);
}
```

**Step 4: Verify placement works**

Preview: select equipment from palette, click on canvas to place. Drag placed items. Hover to see popup. Verify grid snapping works.

**Step 5: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): add workspace canvas with placement, dragging, and hover popups"
```

---

### Task 5: Guided Mode — Template Engine + Validation

**Files:**
- Modify: `SimEngine_LabBuilder.html`

**Step 1: Define the two setup templates**

```javascript
var SETUP_TEMPLATES = {
  distillation: {
    id: 'distillation',
    name: 'Simple Distillation',
    description: 'Separate a liquid mixture based on differences in boiling point',
    steps: [
      { instruction: 'Place a retort stand on the left side of the bench.', equipment: 'retort_stand',
        target: {x:0.2, y:0.5}, tolerance: 60, hint: 'The retort stand supports the entire apparatus.' },
      { instruction: 'Clamp a round-bottom flask to the retort stand.', equipment: 'round_flask',
        target: {x:0.2, y:0.65}, tolerance: 50, hint: 'Position the flask where it can be heated from below.' },
      { instruction: 'Place a Bunsen burner below the flask.', equipment: 'bunsen',
        target: {x:0.2, y:0.85}, tolerance: 50, hint: 'The Bunsen heats the liquid mixture in the flask.' },
      { instruction: 'Insert a thermometer into the flask neck.', equipment: 'thermometer',
        target: {x:0.2, y:0.4}, tolerance: 50, hint: 'The thermometer bulb should sit at the side-arm junction to read the boiling point of the distillate.' },
      { instruction: 'Attach a Liebig condenser, angled downward to the right.', equipment: 'liebig_condenser',
        target: {x:0.5, y:0.55}, tolerance: 70, hint: 'Water flows in at the bottom and out at the top (countercurrent cooling).' },
      { instruction: 'Place a conical flask as the receiver on the right.', equipment: 'conical_flask',
        target: {x:0.8, y:0.75}, tolerance: 60, hint: 'The distillate collects in this flask.' },
      { instruction: 'Place a second retort stand to support the condenser.', equipment: 'retort_stand',
        target: {x:0.55, y:0.5}, tolerance: 60, hint: 'A second clamp supports the condenser at the correct angle.' }
    ],
    connections: [
      {from: 1, to: 4, label: 'vapour rises'},
      {from: 4, to: 5, label: 'vapour path'},
      {from: 5, to: 6, label: 'condensate drips'}
    ],
    annotations: [
      {text: 'Water IN (bottom)', x:0.45, y:0.7},
      {text: 'Water OUT (top)', x:0.45, y:0.42},
      {text: 'Thermometer at side-arm', x:0.12, y:0.35},
      {text: 'Anti-bumping granules', x:0.12, y:0.72},
      {text: 'Collect distillate', x:0.75, y:0.7}
    ],
    successMessage: 'Distillation apparatus assembled correctly! The mixture is heated, vapour rises through the condenser where it cools and condenses, and pure distillate collects in the receiver flask.'
  },
  titration: {
    id: 'titration',
    name: 'Titration Setup',
    description: 'Set up apparatus for an acid-base titration',
    steps: [
      { instruction: 'Place a retort stand in the centre of the bench.', equipment: 'retort_stand',
        target: {x:0.5, y:0.4}, tolerance: 60, hint: 'The retort stand holds the burette vertically.' },
      { instruction: 'Clamp a burette to the retort stand.', equipment: 'burette',
        target: {x:0.5, y:0.35}, tolerance: 50, hint: 'The burette must be vertical with the scale at eye level. Record initial reading to 2 d.p.' },
      { instruction: 'Place a white tile on the base below the burette.', equipment: 'white_tile',
        target: {x:0.5, y:0.85}, tolerance: 50, hint: 'The white background makes it easier to see the indicator colour change at the endpoint.' },
      { instruction: 'Place a conical flask on the white tile.', equipment: 'conical_flask',
        target: {x:0.5, y:0.75}, tolerance: 50, hint: 'The conical flask holds the analyte. Its shape allows swirling without spilling.' },
      { instruction: 'Place a wash bottle nearby for rinsing.', equipment: 'wash_bottle',
        target: {x:0.75, y:0.75}, tolerance: 70, hint: 'Use distilled water to rinse the flask walls during titration. This ensures all analyte reacts.' },
      { instruction: 'Place a volumetric pipette and filler to the side.', equipment: 'vol_pipette',
        target: {x:0.25, y:0.6}, tolerance: 70, hint: 'Use the volumetric pipette to transfer an exact volume of analyte (e.g., 25.00 cm\u00B3) into the conical flask.' }
    ],
    connections: [
      {from: 2, to: 4, label: 'titrant drips'}
    ],
    annotations: [
      {text: 'Read meniscus at eye level', x:0.38, y:0.25},
      {text: 'Record to 2 d.p. (e.g., 23.45)', x:0.38, y:0.3},
      {text: 'Swirl flask during addition', x:0.55, y:0.72},
      {text: 'White tile aids colour detection', x:0.55, y:0.88}
    ],
    successMessage: 'Titration apparatus set up correctly! Fill the burette with titrant, pipette the analyte into the conical flask, add indicator, and titrate to the endpoint.'
  }
};
```

**Step 2: Build the template selector and step panel UI**

```javascript
var _activeTemplate = null;
var _currentStep = 0;
var _guidedComplete = false;
var _stepPlacements = {}; // stepIndex -> placedItemId
var _score = { attempts: 0, startTime: 0, firstTryCorrect: 0 };

function showTemplateSelector(){
  var container = document.getElementById('tab-guided');
  clearChildren(container);

  var selector = document.createElement('div');
  selector.className = 'template-selector';

  var heading = document.createElement('h2');
  heading.textContent = 'Choose an apparatus to build';
  heading.style.cssText = 'font-size:1.1rem;margin-bottom:1rem;color:var(--navy);';
  selector.appendChild(heading);

  Object.keys(SETUP_TEMPLATES).forEach(function(key){
    var tmpl = SETUP_TEMPLATES[key];
    var card = document.createElement('div');
    card.className = 'template-card';

    var h3 = document.createElement('h3');
    h3.textContent = tmpl.name;
    card.appendChild(h3);

    var p = document.createElement('p');
    p.textContent = tmpl.description;
    card.appendChild(p);

    var steps = document.createElement('p');
    steps.textContent = tmpl.steps.length + ' steps';
    steps.style.cssText = 'font-size:.7rem;color:var(--teal);font-weight:600;margin-top:.5rem;';
    card.appendChild(steps);

    card.addEventListener('click', function(){ startGuidedSetup(key); });
    selector.appendChild(card);
  });

  container.appendChild(selector);
}

function startGuidedSetup(templateId){
  _activeTemplate = SETUP_TEMPLATES[templateId];
  _currentStep = 0;
  _guidedComplete = false;
  _placed = [];
  _connections = [];
  _stepPlacements = {};
  _score = { attempts: 0, startTime: Date.now(), firstTryCorrect: 0 };
  buildGuidedUI();
  renderWorkspace();
}

function buildGuidedUI(){
  var container = document.getElementById('tab-guided');
  clearChildren(container);

  // Lab layout wrapper
  var layout = document.createElement('div');
  layout.className = 'lab-layout';

  // Re-append palette and workspace
  layout.appendChild(document.getElementById('palette'));

  var workWrap = document.createElement('div');
  workWrap.className = 'workspace-wrap';
  workWrap.appendChild(_canvas);

  // Step panel
  var panel = document.createElement('div');
  panel.className = 'step-panel';
  panel.id = 'stepPanel';
  workWrap.appendChild(panel);

  // Bin zone
  var bin = document.createElement('div');
  bin.className = 'bin-zone';
  bin.textContent = '\uD83D\uDDD1';
  workWrap.appendChild(bin);

  layout.appendChild(workWrap);
  container.appendChild(layout);

  updateStepPanel();
}
```

**Step 3: Implement step panel updates and validation**

```javascript
function updateStepPanel(){
  var panel = document.getElementById('stepPanel');
  if(!panel) return;
  clearChildren(panel);

  if(_guidedComplete){
    // Show success
    var msg = document.createElement('div');
    msg.style.cssText = 'text-align:center;padding:.5rem;';
    var check = document.createElement('div');
    check.textContent = '\u2705 ' + _activeTemplate.successMessage;
    check.style.cssText = 'font-size:.9rem;color:var(--teal);font-weight:600;';
    msg.appendChild(check);

    // Score
    var elapsed = Math.round((Date.now() - _score.startTime) / 1000);
    var accuracy = _score.attempts > 0 ? Math.round(_score.firstTryCorrect / _activeTemplate.steps.length * 100) : 0;
    var scoreBar = document.createElement('div');
    scoreBar.className = 'score-bar';
    scoreBar.style.marginTop = '.5rem';
    [['Time', elapsed + 's'], ['Attempts', _score.attempts], ['Accuracy', accuracy + '%']].forEach(function(pair){
      var item = document.createElement('span');
      item.className = 'score-item';
      var lbl = document.createElement('span'); lbl.className = 'score-label'; lbl.textContent = pair[0] + ': ';
      var val = document.createElement('span'); val.className = 'score-value'; val.textContent = pair[1];
      item.appendChild(lbl); item.appendChild(val);
      scoreBar.appendChild(item);
    });
    msg.appendChild(scoreBar);

    var resetBtn = document.createElement('button');
    resetBtn.className = 'sandbox-btn';
    resetBtn.textContent = 'Try Again';
    resetBtn.style.marginTop = '.5rem';
    resetBtn.addEventListener('click', function(){ startGuidedSetup(_activeTemplate.id); });
    msg.appendChild(resetBtn);

    panel.appendChild(msg);
    return;
  }

  // Step progress dots
  var dots = document.createElement('div');
  dots.className = 'step-progress';
  _activeTemplate.steps.forEach(function(step, i){
    var dot = document.createElement('div');
    dot.className = 'step-dot';
    if(i < _currentStep) dot.classList.add('done');
    if(i === _currentStep) dot.classList.add('current');
    dot.textContent = i + 1;
    dots.appendChild(dot);
  });
  panel.appendChild(dots);

  // Current instruction
  var step = _activeTemplate.steps[_currentStep];
  var instr = document.createElement('div');
  instr.className = 'step-instruction';
  instr.textContent = 'Step ' + (_currentStep + 1) + ': ' + step.instruction;
  panel.appendChild(instr);

  var hint = document.createElement('div');
  hint.className = 'step-hint';
  hint.textContent = step.hint;
  panel.appendChild(hint);
}

function validatePlacement(placedItemId){
  if(!_activeTemplate || _guidedComplete) return;

  var step = _activeTemplate.steps[_currentStep];
  var item = _placed.find(function(p){ return p.id === placedItemId; });
  if(!item) return;

  _score.attempts++;

  // Check equipment type
  if(item.eqId !== step.equipment){
    // Wrong equipment — remove it, show feedback
    removeEquipment(placedItemId);
    showFeedback('wrong', 'Wrong equipment \u2014 try ' + EQ_MAP[step.equipment].name);
    return;
  }

  // Check position (relative to canvas size)
  var targetX = step.target.x * _canvas.width;
  var targetY = step.target.y * _canvas.height;
  var dist = Math.sqrt(Math.pow(item.x - targetX, 2) + Math.pow(item.y - targetY, 2));

  if(dist > step.tolerance * 1.5){
    // Too far — show hint arrow but keep equipment
    showFeedback('close', 'Good equipment! Move it closer to the target area.');
    return;
  }

  // Snap to exact target position
  item.x = targetX;
  item.y = targetY;

  // Mark step complete
  if(_score.attempts === 1 || !_stepPlacements[_currentStep]){
    _score.firstTryCorrect++;
  }
  _stepPlacements[_currentStep] = placedItemId;
  showFeedback('correct', 'Correct!');

  _currentStep++;

  if(_currentStep >= _activeTemplate.steps.length){
    // All steps complete!
    _guidedComplete = true;
    // Auto-draw connections
    _activeTemplate.connections.forEach(function(conn){
      var fromItem = _placed.find(function(p){ return p.id === _stepPlacements[conn.from]; });
      var toItem = _placed.find(function(p){ return p.id === _stepPlacements[conn.to]; });
      if(fromItem && toItem){
        _connections.push({fromId: fromItem.id, toId: toItem.id, label: conn.label});
      }
    });
  }

  updateStepPanel();
  renderWorkspace();
}

function showFeedback(type, message){
  // Remove existing feedback
  var existing = document.querySelector('.feedback-toast');
  if(existing) existing.parentNode.removeChild(existing);

  var toast = document.createElement('div');
  toast.className = 'feedback-toast';
  toast.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);padding:.5rem 1rem;border-radius:6px;font-size:.85rem;font-weight:500;z-index:200;';

  if(type === 'correct'){
    toast.style.background = 'var(--teal-bg)'; toast.style.color = 'var(--teal)';
    toast.style.border = '1px solid var(--teal)';
  } else if(type === 'close'){
    toast.style.background = 'var(--amber-bg)'; toast.style.color = 'var(--amber)';
    toast.style.border = '1px solid var(--amber)';
  } else {
    toast.style.background = 'var(--red-bg)'; toast.style.color = 'var(--red)';
    toast.style.border = '1px solid var(--red)';
  }

  toast.textContent = message;
  _canvas.parentElement.appendChild(toast);
  setTimeout(function(){ if(toast.parentNode) toast.parentNode.removeChild(toast); }, 2000);
}
```

**Step 4: Verify guided mode works end-to-end**

Preview: select Distillation template, follow all 7 steps. Verify: step dots update, wrong equipment rejected, correct equipment snaps to position, connections drawn on completion, success message and score displayed.

**Step 5: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): add guided mode with template engine, validation, and scoring"
```

---

### Task 6: Connection Lines + Annotations

**Files:**
- Modify: `SimEngine_LabBuilder.html`

**Step 1: Implement connection drawing on canvas**

```javascript
var _connections = []; // {fromId, toId, label}

function drawConnection(fromId, toId, label){
  var fromItem = _placed.find(function(p){ return p.id === fromId; });
  var toItem = _placed.find(function(p){ return p.id === toId; });
  if(!fromItem || !toItem) return;

  _ctx.save();
  _ctx.strokeStyle = '#94A3B8';
  _ctx.lineWidth = 1.5;
  _ctx.setLineDash([4, 4]);

  // Bezier curve between items
  var mx = (fromItem.x + toItem.x) / 2;
  var my = (fromItem.y + toItem.y) / 2 - 20;
  _ctx.beginPath();
  _ctx.moveTo(fromItem.x, fromItem.y);
  _ctx.quadraticCurveTo(mx, my, toItem.x, toItem.y);
  _ctx.stroke();

  // Arrow at endpoint
  var angle = Math.atan2(toItem.y - my, toItem.x - mx);
  _ctx.setLineDash([]);
  _ctx.fillStyle = '#94A3B8';
  _ctx.beginPath();
  _ctx.moveTo(toItem.x, toItem.y);
  _ctx.lineTo(toItem.x - 8*Math.cos(angle-0.3), toItem.y - 8*Math.sin(angle-0.3));
  _ctx.lineTo(toItem.x - 8*Math.cos(angle+0.3), toItem.y - 8*Math.sin(angle+0.3));
  _ctx.closePath();
  _ctx.fill();

  // Label at midpoint
  if(label){
    _ctx.font = '10px Inter';
    _ctx.fillStyle = 'rgba(30,41,59,0.6)';
    _ctx.textAlign = 'center';
    _ctx.fillText(label, mx, my - 5);
    _ctx.textAlign = 'start';
  }

  _ctx.restore();
}
```

**Step 2: Add sandbox connection mode**

```javascript
var _connectMode = false;
var _connectFrom = null;

function toggleConnectMode(){
  _connectMode = !_connectMode;
  _connectFrom = null;
  var btn = document.getElementById('connectBtn');
  if(btn) btn.classList.toggle('active', _connectMode);
}

// In canvas click handler, add after existing logic:
// if(_connectMode && hit){
//   if(!_connectFrom){ _connectFrom = hit.id; }
//   else { _connections.push({fromId:_connectFrom, toId:hit.id, label:''}); _connectFrom=null; renderWorkspace(); }
// }
```

**Step 3: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): add connection lines and annotations rendering"
```

---

### Task 7: Sandbox Mode

**Files:**
- Modify: `SimEngine_LabBuilder.html`

**Step 1: Build sandbox tab with toolbar**

```javascript
function buildSandboxUI(){
  var container = document.getElementById('tab-sandbox');
  clearChildren(container);

  var layout = document.createElement('div');
  layout.className = 'lab-layout';

  // Reuse palette
  layout.appendChild(document.getElementById('palette'));

  var workWrap = document.createElement('div');
  workWrap.className = 'workspace-wrap';
  workWrap.appendChild(_canvas);

  // Toolbar
  var toolbar = document.createElement('div');
  toolbar.className = 'sandbox-toolbar';

  var connectBtn = document.createElement('button');
  connectBtn.className = 'sandbox-btn';
  connectBtn.id = 'connectBtn';
  connectBtn.textContent = 'Connect';
  connectBtn.addEventListener('click', toggleConnectMode);
  toolbar.appendChild(connectBtn);

  var clearBtn = document.createElement('button');
  clearBtn.className = 'sandbox-btn';
  clearBtn.textContent = 'Clear All';
  clearBtn.addEventListener('click', function(){
    _placed = []; _connections = []; renderWorkspace();
  });
  toolbar.appendChild(clearBtn);

  var saveBtn = document.createElement('button');
  saveBtn.className = 'sandbox-btn';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', saveSandboxDesign);
  toolbar.appendChild(saveBtn);

  var loadBtn = document.createElement('button');
  loadBtn.className = 'sandbox-btn';
  loadBtn.textContent = 'Load';
  loadBtn.addEventListener('click', loadSandboxDesign);
  toolbar.appendChild(loadBtn);

  workWrap.appendChild(toolbar);

  // Bin zone
  var bin = document.createElement('div');
  bin.className = 'bin-zone';
  bin.textContent = '\uD83D\uDDD1';
  workWrap.appendChild(bin);

  layout.appendChild(workWrap);
  container.appendChild(layout);
}

function saveSandboxDesign(){
  var data = {
    placed: _placed.map(function(p){ return {eqId:p.eqId, x:p.x/_canvas.width, y:p.y/_canvas.height}; }),
    connections: _connections.map(function(c){ return {fromIdx: _placed.findIndex(function(p){return p.id===c.fromId;}), toIdx: _placed.findIndex(function(p){return p.id===c.toId;}), label:c.label}; })
  };
  try {
    localStorage.setItem('simengine_labbuilder_sandbox', JSON.stringify(data));
    showFeedback('correct', 'Design saved!');
  } catch(e){
    showFeedback('wrong', 'Could not save (localStorage unavailable)');
  }
}

function loadSandboxDesign(){
  try {
    var raw = localStorage.getItem('simengine_labbuilder_sandbox');
    if(!raw){ showFeedback('wrong', 'No saved design found'); return; }
    var data = JSON.parse(raw);
    _placed = [];
    _connections = [];
    _nextId = 1;
    data.placed.forEach(function(p){
      _placed.push({id:_nextId++, eqId:p.eqId, x:p.x*_canvas.width, y:p.y*_canvas.height, scale:0.8});
    });
    data.connections.forEach(function(c){
      if(c.fromIdx >= 0 && c.toIdx >= 0 && _placed[c.fromIdx] && _placed[c.toIdx]){
        _connections.push({fromId:_placed[c.fromIdx].id, toId:_placed[c.toIdx].id, label:c.label||''});
      }
    });
    renderWorkspace();
    showFeedback('correct', 'Design loaded!');
  } catch(e){
    showFeedback('wrong', 'Error loading design');
  }
}
```

**Step 2: Wire up tab switching to rebuild layout**

The palette and canvas are shared DOM elements that move between tabs. In switchTab:
```javascript
function switchTab(id){
  _activeTab = id;
  // ... standard tab switching code ...
  if(id === 'guided'){
    if(!_activeTemplate) showTemplateSelector();
    else buildGuidedUI();
  } else if(id === 'sandbox'){
    _activeTemplate = null;
    _guidedComplete = false;
    buildSandboxUI();
  }
  renderWorkspace();
}
```

**Step 3: Verify sandbox mode**

Preview: switch to Sandbox tab. Place equipment freely, connect two items, save design, clear all, load design. Verify persistence works.

**Step 4: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): add sandbox mode with save/load and connection tool"
```

---

### Task 8: Keyboard Shortcuts + HL/Teacher Toggles

**Files:**
- Modify: `SimEngine_LabBuilder.html`

**Step 1: Add standard keyboard and toggle handlers in init()**

```javascript
// HL toggle
var hlBtn = document.getElementById('hlToggle');
hlBtn.addEventListener('click', function(){
  document.body.classList.toggle('hl-active');
  hlBtn.classList.toggle('active');
});

// Teacher toggle
var tBtn = document.getElementById('teacherToggle');
tBtn.addEventListener('click', function(){
  document.body.classList.toggle('teacher-active');
  tBtn.classList.toggle('active');
  renderWorkspace(); // re-render to show/hide teacher annotations
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e){
  if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  var k = e.key.toLowerCase();
  if(k === 'h'){ hlBtn.click(); }
  else if(k === 't'){ tBtn.click(); }
  else if(k === '1'){ switchTab('guided'); }
  else if(k === '2'){ switchTab('sandbox'); }
  else if(k === 'r'){
    if(_activeTab === 'guided' && _activeTemplate) startGuidedSetup(_activeTemplate.id);
    else if(_activeTab === 'sandbox'){ _placed=[]; _connections=[]; renderWorkspace(); }
  }
  else if(k === 'delete' || k === 'backspace'){
    if(_hovered){
      removeEquipment(_hovered);
      _hovered = null;
    }
  }
  else if(k === 'escape'){
    _selectedEquipment = null;
    _connectMode = false;
    _connectFrom = null;
    document.querySelectorAll('.palette-item').forEach(function(i){ i.classList.remove('selected'); });
  }
});
```

**Step 2: Add teacher-mode annotations rendering**

In renderWorkspace(), after drawing placed equipment:
```javascript
// Teacher mode: show all template annotations regardless of completion
if(document.body.classList.contains('teacher-active') && _activeTemplate && !_guidedComplete){
  _ctx.save();
  _ctx.globalAlpha = 0.5;
  _activeTemplate.steps.forEach(function(step){
    var tx = step.target.x * _canvas.width;
    var ty = step.target.y * _canvas.height;
    _ctx.strokeStyle = '#94A3B8';
    _ctx.setLineDash([3,3]);
    _ctx.beginPath();
    _ctx.arc(tx, ty, step.tolerance, 0, Math.PI*2);
    _ctx.stroke();
    _ctx.setLineDash([]);
    _ctx.font = '9px Inter';
    _ctx.fillStyle = '#94A3B8';
    _ctx.fillText(EQ_MAP[step.equipment].name, tx+step.tolerance+5, ty+3);
  });
  _ctx.restore();
}
```

**Step 3: Commit**

```bash
git add SimEngine_LabBuilder.html
git commit -m "feat(lab-builder): add keyboard shortcuts and HL/Teacher toggle support"
```

---

### Task 9: Update Index + Project Status

**Files:**
- Modify: `SimEngine_Index.html`
- Modify: `SimEngine_Project_Status_2026-04-03.md`

**Step 1: Add LabBuilder to SimEngine_Index.html SIMS array**

Find the SIMS array and add:
```javascript
{ file:'SimEngine_LabBuilder.html', name:'Virtual Lab Builder', section:'Math', topic:'Tool 1', level:'both',
  desc:'Build lab apparatus step-by-step (distillation, titration) or explore freely in sandbox mode',
  keywords:'lab builder apparatus equipment assembly distillation titration setup practical' }
```

Update simCount: 35 → 36 in both the `<div id="simCount">` and the footer.

**Step 2: Update project status**

In `SimEngine_Project_Status_2026-04-03.md`:
- Change "Phase 4: Virtual Lab Builder — NOT STARTED" to "Phase 4: Virtual Lab Builder — IN PROGRESS"
- Add LabBuilder row to the Math Skills Trainers table
- Update executive summary count: 35 → 36

**Step 3: Commit**

```bash
git add SimEngine_Index.html SimEngine_Project_Status_2026-04-03.md
git commit -m "feat(lab-builder): add to Index (36 sims) and update project status"
```

---

### Task 10: Verification

**No files modified — verification only.**

**Step 1: Verify guided mode end-to-end**
- Open LabBuilder in preview
- Select "Simple Distillation"
- Complete all 7 steps
- Verify: connections drawn, annotations shown, score displayed
- Reset and try "Titration Setup" (6 steps)
- Verify: same flow works for second template

**Step 2: Verify sandbox mode**
- Switch to Sandbox tab
- Place 5+ equipment items
- Connect two items
- Save design
- Clear all
- Load design — verify items and connections restored

**Step 3: Verify keyboard shortcuts**
- H toggles HL mode
- T toggles Teacher mode (shows target zones in guided mode)
- 1/2 switches tabs
- R resets current mode
- Delete removes hovered equipment
- Escape deselects

**Step 4: Verify Index**
- Open SimEngine_Index.html
- Confirm "36 Simulations" displayed
- Confirm LabBuilder card appears in Math section
- Click card — should open LabBuilder

**Step 5: Zero console errors**
- Check browser console on LabBuilder — no errors
- Check browser console on Index — no errors
