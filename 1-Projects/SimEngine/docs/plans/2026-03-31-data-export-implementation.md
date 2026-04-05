# Data Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reusable data collection and CSV export to SimEngine, with timed runs, snapshots, parameter sweeps, and student/teacher mode differentiation.

**Architecture:** New `SimEngine.DataCollector` module in `SimEngine_Core.js` handles all data recording, storage, and CSV generation. Each simulation registers its own variables via `registerVariables()`. The HTML files add a collapsible Data Collection panel in the controls section. Teacher mode exposes free-text inputs and parameter sweep; student mode uses dropdowns.

**Tech Stack:** Vanilla JS, CSV via Blob + URL.createObjectURL, no external libraries.

**Design doc:** `docs/plans/2026-03-31-data-export-design.md`

---

### Task 1: DataCollector Module — Registration + Storage

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (append after Reaction module, ~line 1633)

**Step 1: Add the DataCollector module scaffold**

Append to `SimEngine_Core.js` after the Reaction module:

```javascript
// MODULE 6: DATA COLLECTOR
// Timed data collection, snapshots, parameter
// sweeps, and CSV export for all simulations.
SimEngine.DataCollector = (function () {

  var _variables = [];    // [{ key, label, getter, isDefault, hl }]
  var _runData = [];
  var _runConfig = null;
  var _runActive = false;
  var _runCollected = 0;
  var _runFrameCounter = 0;
  var _snapshots = [];
  var _sweepConfig = null;
  var _sweepActive = false;
  var _sweepStep = 0;
  var _sweepSettleCounter = 0;
  var _sweepData = [];

  function registerVariables(varList) {
    _variables = varList.map(function (v) {
      return {
        key: v.key,
        label: v.label,
        getter: v.getter,
        isDefault: !!v.default,
        hl: !!v.hl
      };
    });
  }

  function getVariables() {
    return _variables.slice();
  }

  return {
    registerVariables: registerVariables,
    getVariables: getVariables
  };

})();
```

**Step 2: Verify**

In browser console: `SimEngine.DataCollector.getVariables()` returns `[]`. After calling `registerVariables(...)`, `getVariables()` returns the registered array.

---

### Task 2: Timed Run Collection

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (DataCollector module)

**Step 1: Add startRun, stopRun, tick, and query methods**

Inside the DataCollector IIFE, before the return statement, add functions for:
- `startRun(config)` — config: { durationSec, pointCount, variables: ['key1','key2',...] }. Calculates intervalFrames = round((durationSec * 60) / pointCount). Sets _runActive = true. Emits 'dataCollectionStart'.
- `stopRun()` — Sets _runActive = false. Emits 'dataCollectionStop'.
- `tick()` — Called every frame. If run active, increments frame counter. Every intervalFrames, calls _recordRunPoint() and increments _runCollected. When _runCollected >= pointCount, stops and emits 'dataCollectionComplete'. Also calls _tickSweep() if sweep active.
- `_recordRunPoint()` — Iterates _variables, calls getter() for each key in _runConfig.variables, pushes row to _runData.
- `isRunning()` — returns _runActive.
- `getProgress()` — returns { collected, total, percent }.
- `getRun()` — returns _runData copy.

**Step 2: Update return statement to expose all new methods.**

**Step 3: Verify**

Register a test variable, start a run, call tick() enough times to complete, verify getRun() has correct number of rows.

---

### Task 3: Snapshots

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (DataCollector module)

**Step 1: Add snapshot methods**

- `recordSnapshot()` — Calls every registered variable's getter, stores row in _snapshots. Emits 'snapshotRecorded' with count and row data.
- `getSnapshots()` — Returns _snapshots copy.

**Step 2: Update return statement.**

---

### Task 4: CSV Generation + Download

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (DataCollector module)

**Step 1: Add toCSV, download, clearData methods**

- `_formatValue(key, val)` — Formats numbers: scientific notation for abs >= 1e5 or abs < 1e-3; 4 decimal places for fractions; 3 for rates; 4 significant figures default.
- `toCSV(dataType)` — dataType: 'run' | 'snapshots' | 'sweep'. Builds CSV string with header row from variable labels, data rows from stored arrays. Returns string.
- `download(filename, dataType)` — Creates Blob with CSV content, creates hidden anchor element, triggers click for download, cleans up. Uses URL.createObjectURL.
- `clearData()` — Resets all data arrays and state flags. Emits 'dataCleared'.

**Step 2: Update return statement.**

**Step 3: Verify**

After a completed run, toCSV('run') returns valid CSV. download() triggers browser file download.

---

### Task 5: Parameter Sweep (Teacher Mode)

**Files:**
- Modify: `3-Resources/SimEngine/SimEngine_Core.js` (DataCollector module)

**Step 1: Add sweep methods**

- `startSweep(config)` — config: { paramKey, from, to, steps, settleFrames, variables }. Sets first parameter value via SimEngine.State.set(). Emits 'sweepStart'.
- `_tickSweep()` — Called by tick() when sweep active. Increments settle counter. When settle complete: records data point (param value + selected variables), advances to next step, sets new param value. When all steps done, emits 'sweepComplete'.
- `isSweeping()` — returns _sweepActive.
- `getSweepProgress()` — returns { step, total, percent }.
- `getSweepData()` — returns _sweepData copy.

**Step 2: Update return statement.**

**Step 3: Verify**

Start a 3-step sweep with 5 settle frames. Call tick() 15 times. Verify getSweepData() has 3 rows with different parameter values.

---

### Task 6: Equilibrium HTML — Data Collection Panel UI

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_Equilibrium.html`

**Step 1: Add CSS for data collection panel**

Add styles for: .data-panel, .data-panel-header, .data-panel-body, .data-config, .var-checkboxes, .progress-bar, .progress-bar-fill, .progress-text, .snapshot-table, .sweep-config, .data-btn, .data-btn-primary. Follow existing style guide tokens (var(--border), var(--teal), var(--text-muted), etc).

**Step 2: Add HTML for data collection panel**

Inside the control panel card, after the Q vs K readout section, add:
- Collapsible "DATA COLLECTION" header with arrow toggle
- Duration select (10s, 30s, 60s, 120s)
- Data Points select (10, 20, 50, 100)
- Variable checkboxes container (populated by JS)
- Start Collection button + Snapshot button
- Progress bar section (hidden initially)
- Completion section with Download CSV and Clear buttons (hidden initially)
- Snapshots count + table + download button
- Sweep section (teacher only): param dropdown, from/to/steps/settle inputs, Run Sweep button, progress bar

**Step 3: Add JavaScript wiring**

Register equilibrium variables:
- time, reactantFrac, productFrac, rateForward, rateReverse (defaults)
- Q, Kc, temperature, reactantCount, productCount (optional)
- Kp, deltaG (HL only)

Build variable checkboxes dynamically. Rebuild when HL toggles.

Wire all button click handlers:
- dataPanelToggle: expand/collapse body
- btnStartRun: read duration/points/vars, call startRun()
- btnStopRun: call stopRun()
- btnSnapshot: call recordSnapshot()
- btnDownloadRun: call download(filename, 'run')
- btnDownloadSnapshots: call download(filename, 'snapshots')
- btnClearRun: call clearData(), reset UI
- btnStartSweep: read sweep config, call startSweep()

Wire State event listeners:
- dataCollectionProgress: update progress bar width and text
- dataCollectionComplete: show completion UI
- dataCollectionStop: show partial data or reset
- snapshotRecorded: add row to snapshot table, update count
- sweepProgress: update sweep progress bar
- sweepComplete: auto-download sweep CSV
- dataCleared: reset snapshot table and count

Teacher mode: show sweep section, replace dropdowns with number inputs.

**Step 4: Wire tick() into animation loop**

In the existing animate() function, add `SimEngine.DataCollector.tick();` once per frame (outside the speed loop).

**Step 5: Verify**

- Panel expands/collapses
- Start collection shows progress, completes, downloads CSV
- Snapshot adds table row
- Teacher mode shows sweep
- HL toggle shows/hides Kp and deltaG checkboxes

---

### Task 7: Gas Laws HTML — Data Collection Panel

**Files:**
- Modify: `1-Projects/SimEngine/SimEngine_GasLaws.html`

**Step 1: Add same CSS and HTML panel structure as Equilibrium**

Copy the data panel CSS and HTML from Equilibrium into Gas Laws. Register gas law variables:
- time, pressure, pressureIdeal, temperature (defaults)
- volume, avgSpeed, avgKE, moles (optional)

Sweep parameters: temperature, volume, moles.

**Step 2: Wire tick() into Gas Laws animation loop**

**Step 3: Verify same functionality as Equilibrium with gas law variables.**

---

## Verification Checklist

1. Timed run: 10s/10pts results in exactly 10 CSV rows
2. CSV format: headers match labels, numbers properly formatted
3. Snapshots: each click adds one row to table and store
4. Download: triggers browser download with correct filename
5. Progress bar: updates during collection
6. Stop early: partial data downloadable
7. Clear: resets all data and UI
8. Teacher mode: free-text inputs, sweep section visible
9. Student mode: dropdowns, no sweep
10. HL variables: Kp/deltaG only when HL enabled
11. Parameter sweep: steps through values, settles, records, auto-downloads
12. Gas Laws: same functionality with gas law variables
13. No regression: both simulations still work correctly

---

## Critical Files

| File | Path | Purpose |
|------|------|---------|
| SimEngine_Core.js | `3-Resources/SimEngine/SimEngine_Core.js` | Add DataCollector module |
| SimEngine_Equilibrium.html | `1-Projects/SimEngine/SimEngine_Equilibrium.html` | Add data panel UI |
| SimEngine_GasLaws.html | `1-Projects/SimEngine/SimEngine_GasLaws.html` | Retrofit data panel UI |
| Design doc | `docs/plans/2026-03-31-data-export-design.md` | Reference |
