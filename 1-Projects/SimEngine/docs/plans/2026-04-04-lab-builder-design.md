# Virtual Lab Builder — Design Document

**Date:** 2026-04-04
**Phase:** 4
**File:** `SimEngine_LabBuilder.html`

## Goal

Build an interactive lab apparatus assembly simulator where students learn to set up common IB Chemistry practical equipment. Two modes: guided step-by-step assembly (with validation) and free-form sandbox.

## Architecture

Single-file HTML sim following standard SimEngine patterns (IIFE, no innerHTML, CSS custom properties, HL/Teacher toggles, keyboard shortcuts). Two-tab system:

1. **Tab 1: Guided Assembly** — step-by-step instructions to build a specific apparatus. Student selects a setup template (Distillation or Titration), then follows numbered steps placing equipment onto a workspace canvas. Each step validates correct equipment and approximate position before advancing. Completed setup shows annotated diagram.

2. **Tab 2: Sandbox** — free-form canvas. Students drag equipment from a palette, place freely on workspace, and connect pieces. No validation. Designs saved/loaded via localStorage.

Both modes share the same canvas rendering engine and equipment database.

## Components

### Equipment Palette
- Scrollable sidebar (left side, 200px wide) listing equipment by category
- Categories from equipment.json: volumetric, glassware, heating, measurement, separation, safety, sensors, general
- Each item shows: canvas preview thumbnail (40x40), name, uncertainty (if applicable)
- Click to select (highlighted border), click on canvas to place
- Category accordion — collapsed by default, expand on click
- Search/filter input at top

### Workspace Canvas
- HTML5 Canvas, fills remaining width
- Background: light grid (20px spacing) for alignment reference
- Equipment items rendered using existing `draw()` functions from EquipmentTrainer
- Items are draggable once placed (mousedown + mousemove on canvas, hit-test against placed items)
- Delete: drag to bin zone (bottom-right corner icon) or select + press Delete/Backspace
- Zoom: not needed for v1 (fixed scale)

### Guided Mode Engine
- `SETUP_TEMPLATES` object defines each apparatus setup:
  ```
  {
    id: 'distillation',
    name: 'Simple Distillation',
    description: 'Separate a liquid from a solution or purify a solvent',
    steps: [
      {
        instruction: 'Place a retort stand on the left side of the bench.',
        equipment: 'retort_stand',
        target: { x: 0.25, y: 0.5 },
        tolerance: 60,
        hint: 'The retort stand provides the support structure for the entire setup.'
      },
      {
        instruction: 'Clamp a round-bottom flask to the retort stand.',
        equipment: 'round_flask',
        target: { x: 0.25, y: 0.65 },
        tolerance: 50,
        hint: 'The round-bottom flask holds the mixture to be distilled.'
      },
      // ... more steps
    ],
    connections: [
      { from: 'round_flask', to: 'liebig_condenser', label: 'vapour path' },
      { from: 'liebig_condenser', to: 'conical_flask', label: 'condensate' }
    ],
    annotations: [
      { text: 'Water IN (bottom)', x: 0.55, y: 0.7 },
      { text: 'Water OUT (top)', x: 0.55, y: 0.4 },
      { text: 'Thermometer reads boiling point', x: 0.25, y: 0.35 }
    ],
    successMessage: 'Distillation apparatus assembled correctly! The thermometer monitors the boiling point of the distillate.'
  }
  ```

- Step progression: current step highlighted, previous steps shown as completed (green check), future steps greyed out
- Step validation: checks (1) correct equipment id and (2) position within tolerance radius of target
- Wrong equipment: red flash + "Try a different piece of equipment"
- Wrong position: amber hint + arrow pointing toward correct area
- All steps complete: connections auto-drawn, annotations shown, success message displayed

### Validation Layer (guided only)
- Hit-test: check if placed equipment id matches step's expected equipment
- Position check: Euclidean distance from placed center to target center, within tolerance (pixels)
- Visual feedback: green glow (correct), amber pulse (close but wrong position), red shake (wrong equipment)
- Score: tracks attempts per step, total time, first-try accuracy percentage

### Connection Lines
- Drawn as curved Bezier paths between equipment "ports"
- Each equipment item has implicit port positions (e.g., flask neck = top-center, condenser inlet = left-center)
- In guided mode: connections auto-drawn when both endpoints are correctly placed
- In sandbox mode: click first item, then click second item to create connection. Click connection to delete.
- Line style: dashed grey (#94A3B8), with small arrow showing flow direction

### Equipment Info Popup
- On hover (desktop) or long-press (mobile) over placed equipment
- Shows: name, uncertainty, typical use, IB notes, common mistakes
- Data sourced from equipment.json fields
- Positioned above/below item, auto-flips to stay in viewport

## Starter Templates

### 1. Simple Distillation (7 steps)
1. Place retort stand (left side)
2. Clamp round-bottom flask to stand
3. Place Bunsen burner below flask
4. Insert thermometer into flask (via adapter)
5. Attach Liebig condenser (angled downward)
6. Place conical flask as receiver (right side)
7. Connect water supply to condenser (bottom in, top out)

**Equipment used:** retort_stand, round_flask, bunsen, thermometer, liebig_condenser, conical_flask + rubber tubing (virtual)

**Key teaching points:**
- Condenser angled downward for gravity flow
- Water flows countercurrent (in at bottom, out at top)
- Thermometer bulb at side-arm junction
- Anti-bumping granules in flask (annotation)

### 2. Titration Setup (6 steps)
1. Place retort stand (center)
2. Clamp burette to stand
3. Fill burette with titrant (virtual step — just confirms burette is clamped)
4. Place conical flask below burette
5. Place white tile under conical flask
6. Position wash bottle nearby

**Equipment used:** retort_stand, burette, conical_flask, wash_bottle + white tile (simple rect)

**Key teaching points:**
- Burette at eye level for reading
- White tile aids indicator colour change detection
- Wash bottle for rinsing flask walls
- Funnel removed before titrating (annotation)

## Shared Features

- **HL/Teacher toggles** — standard `body.hl-active` / `body.teacher-active` classes
  - Teacher mode: shows all annotations and hints simultaneously
  - HL mode: adds more detailed annotations about uncertainty and technique
- **Keyboard shortcuts:** H (HL), T (Teacher), 1-2 (tabs), R (reset), Delete (remove selected)
- **Reset button** — clears workspace, resets guided steps to beginning
- **Score display** (guided mode) — attempts, time elapsed, accuracy %
- **localStorage** (sandbox) — save/load named designs

## Data Dependencies

- `equipment.json` — 50 items with id, name, category, uncertainty, typicalUse, ibNotes, commonMistakes
- EquipmentTrainer draw functions — 26 canvas drawing functions to be extracted/shared
- New draw functions needed for: liebig_condenser, reflux_condenser, distillation_adapter, side_arm_flask, water_bath, and a few others used in templates

## Canvas Drawing Strategy

The 26 existing `draw(ctx, cx, cy, scale)` functions from EquipmentTrainer.html will be copied into LabBuilder.html (single-file model means no shared imports). New draw functions will be created for template-specific equipment not in the original 26. All draw functions follow the same signature and use the same color constants (STROKE, FILL_GLASS, FILL_LIQUID, FILL_METAL, etc.).

## Not In Scope (v1)

- Photos or SVG assets (canvas drawing only)
- More than 2 templates (expand later)
- Physics simulation (no liquid flow, no heating animation)
- Assessment/grading integration
- Multi-step procedures (just apparatus assembly, not running the experiment)
- Mobile drag-and-drop (desktop-first; mobile gets a "not optimised" note)
