# Missing LabBuilder Templates — Design

> **Date:** 2026-04-05
> **File:** `SimEngine_LabBuilder.html` (modify only)
> **Scope:** 4 new SETUP_TEMPLATES + 5 new equipment pieces

## Templates

1. **Solution Preparation** (R2.1) — 6 steps: weigh solid, dissolve in beaker, transfer to volumetric flask, rinse, make up to mark
2. **Serial Dilution** (R2.1) — 6 steps: pipette stock, transfer to flask, dilute, repeat for 3 concentrations
3. **Galvanic Cell Builder** (R3.2) — 7 steps: two beakers with electrolyte, two metal electrodes, salt bridge, wires, voltmeter
4. **Electrolysis Setup** (R3.2) — 7 steps: beaker with electrolyte, two electrodes, power supply, wires, clamp stand

## New Equipment

| ID | Name | Draw Function |
|----|------|---------------|
| `electrode` | Metal Electrode | `drawElectrode` — vertical strip with terminal |
| `wire` | Wire & Clips | `drawWire` — wire with crocodile clips |
| `salt_bridge` | Salt Bridge | `drawSaltBridge` — U-tube with cotton plugs |
| `power_supply` | DC Power Supply | `drawPowerSupply` — box with +/- terminals |
| `spatula` | Spatula | `drawSpatula` — flat-ended lab spatula |
