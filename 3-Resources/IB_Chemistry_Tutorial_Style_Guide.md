# IB Chemistry Tutorial Style Guide

A design reference for building HTML-based tutorial tools, interactive diagrams, worked tutorials, and practice worksheets. Follow this guide to maintain visual and functional consistency across all materials.

---

## 1. Color System

All colors are defined as CSS custom properties in `:root`. Use these consistently — never hard-code raw hex values inline.

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--navy` | `#1B2A4A` | Headers, primary backgrounds, question number badges |
| `--teal` | `#0D9488` | Primary accent, correct answers, step indicators, key insights |
| `--blue` | `#2563EB` | Secondary accent, selected states, secondary diagram theme |
| `--light-bg` | `#F8FAFC` | Page background, step backgrounds |
| `--card-bg` | `#FFFFFF` | Card/panel surfaces |
| `--text` / `--dark` | `#1E293B` | Body text, atom labels |
| `--text-muted` / `--muted` | `#64748B` | Captions, secondary text, hydrogen atom labels |
| `--border` | `#E2E8F0` | Card borders, option borders |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--green` | `#059669` | Correct answer highlights |
| `--red` | `#DC2626` or `#EF4444` | Incorrect answers, oxygen atoms in structural formulas |
| `--amber` | `#D97706` | Distractor explanations, warnings, third diagram theme |
| `--purple` | `#7C3AED` | Reserved for HL-only content indicators |
| `--orange` | `#F59E0B` | Quiz prompts, third diagram accent |

### Background Tints (for boxes/banners)

Each semantic color has a light tint for backgrounds:

| Token | Hex | Usage |
|---|---|---|
| `--green-bg` | `#ECFDF5` | Correct answer banners, answer key boxes |
| `--red-bg` | `#FEF2F2` | Incorrect answer banners |
| `--amber-bg` | `#FFFBEB` | Distractor explanation boxes |
| `--teal-bg` | `#F0FDFA` or `#CCFBF1` | Intro boxes, key insight panels |
| `--blue-bg` | `#EFF6FF` or `#DBEAFE` | Key point boxes, selected option states |

---

## 2. Typography

### Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code&family=Caveat:wght@400;600;700&display=swap');
```

| Font | Variable | Usage |
|---|---|---|
| **Inter** | `'Inter', -apple-system, sans-serif` | Body text, UI elements, buttons, labels |
| **Fira Code** | `'Fira Code', monospace` | Chemical formulas inline (`.chem` class), equation boxes |
| **Caveat** | `'Caveat', cursive` | Hand-drawn diagram labels, rough.js canvas text, mode bar titles |

### Scale

| Element | Size | Weight |
|---|---|---|
| Page title (`.header h1`) | 1.8rem | 700 |
| Diagram section title (`h2`) | 1.5rem | 700 (default) |
| Question stem (`.q-stem`) | 1.05rem | 500 |
| Body text | 16px (1rem) | 400 |
| Step labels (`.step-num`) | 0.85rem | 700, teal color |
| Source tags / hints | 0.75rem | 400–600 |
| Canvas atom labels | 16px Caveat | 600 |
| Canvas badge labels | 11px Inter | 700, white on colored bg |

### Line Height

Body line-height: `1.7` (generous for readability on student materials).

---

## 3. Layout & Spacing

### Page Structure

```
.header          — Full-width gradient banner (navy → #2D4A7A at 135deg)
.container       — max-width: 820px, centered, padding: 2rem 1.5rem
  .intro-box     — Left-bordered teal box for instructions
  .question-card — White card with colored header bar
  ...
.footer          — Centered, muted, border-top separator
```

For wider interactive content (diagrams), use `max-width: 1100px`.

### Card Pattern

All question/problem cards follow this structure:

```html
<div class="question-card">
  <div class="q-header">         <!-- navy background -->
    <div class="q-number">1</div> <!-- teal circle badge -->
    <div class="q-title">...</div>
    <div class="q-source">...</div>
  </div>
  <div class="q-body">           <!-- white, padded 1.5rem -->
    <!-- stem, options, button, solution -->
  </div>
</div>
```

### Spacing Rules

- Card margin-bottom: `2rem–2.5rem`
- Inner section padding: `1.5rem`
- Between steps: `0.75rem`
- Between option items: `0.3rem–0.4rem`
- Border radius: `12px` for cards, `8px` for inner elements, `999px` for pill badges

---

## 4. Interactive Components

### MC Option Lists

```html
<ul class="options" data-correct="D">
  <li data-val="A"><span class="opt-letter">A</span> option text</li>
  ...
</ul>
```

States: default → `.selected` (blue) → `.correct` (green) / `.incorrect` (red). Each state changes the `opt-letter` circle background and the `li` border + background.

### Reveal Button

```css
.reveal-btn {
  background: var(--teal);
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
}
```

On click: hides itself, shows `.solution` div, highlights correct option.

### Toggle Answer Key (Practice Problems)

A sticky toggle bar at top with a single button that adds/removes `.visible` on all `.answer-key` elements.

### Step-by-Step Solution

```html
<div class="walkthrough">
  <h4>Step-by-step reasoning</h4> <!-- teal, uppercase, 0.9rem -->
  <div class="step">
    <div class="step-num">Step 1 — Title</div>
    <p>Explanation...</p>
  </div>
</div>
```

Steps have left border (3px teal), light background, rounded corners.

### Distractor Explanation Box

```html
<div class="distractor-box">
  <h4>Why the other options are wrong</h4> <!-- amber -->
  <ul>...</ul>
</div>
```

Amber background + dashed amber border. Use `<strong>` for option letter references.

### Key Point / Insight Box

```html
<div class="key-point">
  <strong>Key IB takeaway:</strong> ...
</div>
```

Blue background, blue border. For diagram pages, use `.insight.teal` / `.insight.blue` / `.insight.orange` to match the diagram's theme color.

---

## 5. Structural Formula Drawing (rough.js)

### Library & CDN

```html
<script src="https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.js"></script>
```

**Do NOT use cdnjs.cloudflare.com** — the rough.js file returns 404 there.

### Canvas Setup (HiDPI)

Always scale canvas for device pixel ratio:

```javascript
const DPR = window.devicePixelRatio || 1;

function setupCanvas(id, w, h) {
  const c = document.getElementById(id);
  c.width = w * DPR;
  c.height = h * DPR;
  c.style.width = w + 'px';
  c.style.height = h + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(DPR, DPR);
  return { canvas: c, ctx, rc: rough.canvas(c) };
}
```

Standard canvas sizes: `960×540` (wide diagrams), `960×440` (shorter), `960×460` (medium).

### Core Drawing Helpers

**These four functions are the building blocks for all diagrams:**

```javascript
// Text — used for all labels
function txt(ctx, str, x, y, opts = {}) {
  ctx.save();
  ctx.font = (opts.weight||'400') + ' ' + (opts.size||14) + 'px ' + (opts.font||"'Caveat', cursive");
  ctx.fillStyle = opts.color || '#1E293B';
  ctx.textAlign = opts.align || 'center';
  ctx.textBaseline = opts.baseline || 'middle';
  if (opts.rotate) {
    ctx.translate(x, y);
    ctx.rotate(opts.rotate * Math.PI / 180);
    ctx.fillText(str, 0, 0);
  } else {
    ctx.fillText(str, x, y);
  }
  ctx.restore();
}

// Atom — positioned label, returns {x,y} for bond connections
function atom(ctx, label, x, y, color, size) {
  txt(ctx, label, x, y, { size: size||16, weight: '600', color: color||'#1E293B', font: "'Caveat', cursive" });
  return {x, y};
}

// Bond — rough.js line between two points, with optional double bond
function bond(rc, x1, y1, x2, y2, color, dbl) {
  color = color || '#1E293B';
  rc.line(x1, y1, x2, y2, { stroke: color, strokeWidth: 2, roughness: 0.8 });
  if (dbl) {
    var dx = x2-x1, dy = y2-y1, len = Math.sqrt(dx*dx+dy*dy);
    var nx = -dy/len*3.5, ny = dx/len*3.5;
    rc.line(x1+nx, y1+ny, x2+nx, y2+ny, { stroke: color, strokeWidth: 2, roughness: 0.8 });
  }
}

// Arrow — rough line with filled arrowhead
function arw(rc, ctx, x1, y1, x2, y2, color, width) {
  color = color || '#0D9488'; width = width || 2;
  rc.line(x1, y1, x2, y2, { stroke: color, strokeWidth: width, roughness: 1.2 });
  var a = Math.atan2(y2 - y1, x2 - x1), hl = 10;
  ctx.save(); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hl * Math.cos(a - 0.4), y2 - hl * Math.sin(a - 0.4));
  ctx.lineTo(x2 - hl * Math.cos(a + 0.4), y2 - hl * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill(); ctx.restore();
}
```

### Additional Helpers

```javascript
// Dashed line (for separators, reaction boundaries)
function dash(ctx, x1, y1, x2, y2, color, width) {
  ctx.save(); ctx.strokeStyle = color || '#94A3B8';
  ctx.lineWidth = width || 1.5; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}

// Badge (rounded rectangle with centered label)
function badge(rc, ctx, x, y, w, h, bg, label) {
  rc.rectangle(x, y, w, h, { fill: bg, fillStyle: 'solid', stroke: bg, strokeWidth: 1, roughness: 0.8 });
  txt(ctx, label, x+w/2, y+h/2, { size: 11, weight: '700', color: 'white', font: "'Inter', sans-serif" });
}
```

### Structural Formula Layout Rules

**CRITICAL: Do NOT use center-aligned text strings for structural formulas.** Characters in Caveat font have varying widths, causing visual misalignment. Instead:

1. **Position every atom individually** using the `atom()` function with explicit `(x, y)` coordinates
2. **Draw each bond individually** using the `bond()` function
3. **Use consistent spacing**: ~48px between bonded heavy atoms (C, O, N), ~26px for terminal H atoms
4. **Color conventions**:
   - Carbon (C): `#1E293B` (default dark)
   - Oxygen (O): `#EF4444` (red)
   - Hydrogen (H): `#64748B` (muted gray)
   - Nitrogen (N): `#2563EB` (blue)
   - Bond color for C=O double bonds: `#EF4444` (red, matching oxygen)

### Example: Ethanol

```javascript
var cx1=100, cx2=148, ox=185; // x positions for C1, C2, O
var y = 98; // shared y baseline

// Main chain: H-C-C-O-H
atom(ctx, 'H', cx1-25, y, '#64748B'); bond(rc, cx1-16, y, cx1-8, y);
atom(ctx, 'C', cx1, y);               bond(rc, cx1+8, y, cx2-8, y);
atom(ctx, 'C', cx2, y);               bond(rc, cx2+8, y, ox-10, y);
atom(ctx, 'O', ox, y, '#EF4444');      bond(rc, ox+8, y, ox+20, y);
atom(ctx, 'H', ox+28, y, '#64748B');

// Vertical H's on C1
atom(ctx, 'H', cx1, y-26, '#64748B'); bond(rc, cx1, y-20, cx1, y-8);
atom(ctx, 'H', cx1, y+26, '#64748B'); bond(rc, cx1, y+8, cx1, y+20);

// Vertical H's on C2
atom(ctx, 'H', cx2, y-26, '#64748B'); bond(rc, cx2, y-20, cx2, y-8);
atom(ctx, 'H', cx2, y+26, '#64748B'); bond(rc, cx2, y+8, cx2, y+20);
```

### rough.js Settings

| Property | Value | Notes |
|---|---|---|
| `roughness` | 0.5–0.8 for bonds/boxes | Lower = cleaner; higher = more "sketchy" |
| `roughness` | 1.2 for arrows | Slightly rougher for hand-drawn feel |
| `roughness` | 1.8 for molecule boxes | Most hand-drawn feel |
| `bowing` | 1.5 for molecule boxes | Curved lines for organic feel |
| `strokeWidth` | 2 for bonds | Standard bond weight |
| `fillStyle` | `'solid'` for backgrounds | Avoid hachure patterns in molecule boxes |

### Reaction Box Pattern

Molecules sit inside rough.js rounded rectangles with tinted fills:

```javascript
rc.rectangle(30, 25, 190, 140, {
  fill: '#CCFBF1',        // teal tint for starting material
  fillStyle: 'solid',
  stroke: '#0D9488',       // teal border
  strokeWidth: 2,
  roughness: 1.8,
  bowing: 1.5
});
txt(ctx, 'Primary Alcohol', 125, 48, { size: 20, weight: '700', color: '#0D9488' });
```

Color the box to match the reaction type: teal for alcohols, amber for aldehydes, blue for carboxylic acids, green for alkanes.

---

## 6. Animation / Step Reveal System

### Architecture

Each diagram has a step counter and an array of draw functions:

```javascript
var diagrams = {
  d1: { step: 0, max: 6, auto: null, speed: 2000 },
  d2: { step: 0, max: 4, auto: null, speed: 2000 },
  ...
};

function advance(id) {
  var d = diagrams[id];
  if (d.step >= d.max) return;
  d.step++;
  redraw(id);
  updateIndicator(id);
}
```

### Redraw Pattern

On each step advance, **clear and redraw the entire canvas** (don't try to draw incrementally):

```javascript
function redraw(id) {
  // Clear
  ctx.clearRect(0, 0, w, h);
  // Draw base (always visible)
  drawBase(rc, ctx);
  // Draw each step up to current
  if (step >= 1) drawStep1(rc, ctx);
  if (step >= 2) drawStep2(rc, ctx);
  ...
}
```

### Teacher vs Student Mode

- **Teacher mode**: Advance with spacebar/arrow keys. Keyboard shortcuts: `1/2/3` switch active diagram, `R` resets all.
- **Student mode**: Auto-play with speed selector (Slow: 3000ms, Normal: 2000ms, Fast: 1000ms). Show quiz prompts before key reveals.

```javascript
function setMode(mode) {
  document.body.className = mode === 'student' ? 'student-mode' : '';
}
```

CSS toggles visibility:
```css
body.student-mode .quiz-prompt { display: block; }
body.student-mode .advance-btn { display: none; }
body.student-mode .auto-controls { display: flex; }
```

### Caption Updates

Each step updates a caption box below the canvas:

```javascript
var captions = [
  "Click <strong>Next Step</strong> to begin...",
  "<strong>Step 1:</strong> The primary alcohol is oxidized by K₂Cr₂O₇...",
  ...
];
document.getElementById(id + '-caption').innerHTML = captions[step];
```

### Quiz Prompts (Student Mode)

Appear at key decision points, styled with dashed amber border:

```javascript
if (step === 2) {
  quizEl.innerHTML = '<span class="quiz-q">What product forms if we use distillation here?</span>';
}
```

---

## 7. Print Styles

Every HTML tool must include print styles:

```css
@media print {
  /* Hide interactive controls */
  .reveal-btn, .toggle-bar, .mode-bar, .step-controls,
  .auto-controls, .quiz-prompt { display: none !important; }

  /* Force-show all answers/solutions */
  .solution, .answer-key { display: block !important; }

  /* Prevent page breaks inside cards */
  .question-card, .problem, .diagram-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Clean up shadows */
  .question-card, .problem, .diagram-section {
    box-shadow: none;
    border: 1px solid #ddd;
  }

  body { font-size: 13px–14px; }
}
```

---

## 8. Responsive Design

Include a mobile breakpoint at 600px:

```css
@media (max-width: 600px) {
  .container { padding: 1rem; }
  .header h1 { font-size: 1.4rem; }
  .q-body, .p-body { padding: 1rem; }
}
```

For diagram pages, canvases use `max-width: 100%` and the container widens to 1100px.

---

## 9. Chemical Notation Conventions

### Inline Formulas

Use the `.chem` class for inline chemical notation:

```html
<span class="chem">CH₃CH₂OH</span>
```

```css
.chem {
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
  background: #F1F5F9;
  padding: 0.15em 0.35em;
  border-radius: 4px;
}
```

Use Unicode subscripts (₂, ₃) and superscripts (²⁻, ³⁺) directly — don't use `<sub>`/`<sup>` inside `.chem` spans.

### Equation Boxes

For standalone equations:

```html
<div class="equation-box">C₆H₁₀ + H₂ →<sup>Ni, ~150°C</sup> C₆H₁₂</div>
```

```css
.equation-box {
  background: #F1F5F9;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  text-align: center;
  line-height: 1.8;
}
```

### Reaction Arrows

In HTML text: use `→` (→) for irreversible, `⇌` (⇌) for equilibrium.

In canvas diagrams: use the `arw()` helper with theme color.

---

## 10. File Naming Convention

All tutorial HTML files follow this pattern:

```
R[topic]_[Type].html
```

Examples:
- `R3.2.9-11_Worked_Tutorial.html` — step-by-step MC walkthrough
- `R3.2.9-11_Practice_Problems.html` — original problems with answer key
- `R3.2.9-11_Reaction_Diagrams.html` — interactive rough.js animated diagrams

---

## 11. PPTX Companion Slides

When building PPTX files alongside HTML tools, use the matching color theme:

| PPTX Element | Color |
|---|---|
| Top bar | `#1B2A4A` (navy) |
| Accent / highlights | `#0D9488` (teal) |
| Secondary accent | `#2563EB` (blue) |
| Header font | Trebuchet MS |
| Body font | Calibri |

Build PPTX programmatically with PptxGenJS (Node.js). See the pptx skill for methodology.

---

## 12. Quick Start Template

For a new tutorial HTML file, start with this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Topic] — IB Chemistry</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code&display=swap');
  :root {
    --navy: #1B2A4A; --teal: #0D9488; --blue: #2563EB;
    --light-bg: #F8FAFC; --card-bg: #FFFFFF;
    --text: #1E293B; --text-muted: #64748B; --border: #E2E8F0;
    --green: #059669; --red: #DC2626; --amber: #D97706;
    --green-bg: #ECFDF5; --red-bg: #FEF2F2; --amber-bg: #FFFBEB;
    --teal-bg: #F0FDFA; --blue-bg: #EFF6FF;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: var(--light-bg);
         color: var(--text); line-height: 1.7; font-size: 16px; }

  /* Add component styles here — copy from this guide */

  @media print { /* ... */ }
  @media (max-width: 600px) { /* ... */ }
</style>
</head>
<body>
  <div class="header">
    <h1>[Topic Title]</h1>
    <div class="subtitle">[Subtitle]</div>
    <div class="tag">IB Chemistry</div>
  </div>
  <div class="container">
    <!-- Content here -->
  </div>
  <div class="footer">IB Chemistry — [Topic] &bull; [Description]</div>
</body>
</html>
```

For rough.js diagram pages, add the Caveat font import and the rough.js CDN script, use the wider 1100px container, and include the drawing helpers from Section 5.
