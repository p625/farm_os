# 006 — Phase 11: Manual Machine Control

**Type:** Implementation specification  
**Status:** Architecture Freeze v1.0 — Approved  
**Prerequisite docs:** [000](./000_GoldenRules.md) – [005](./005_SaveArchitecture.md)

This document specifies Phase 11 only. It does NOT contain code.

Each phase MUST leave the game fully playable and MUST pass `npm run build`.

---

## Phase Overview

| Phase | Focus |
|-------|-------|
| **11A** | Command foundation + manual movement |
| **11B** | Field radial contextual actions |
| **11C** | Trailer transport (harvest → trailer) |
| **11D** | Farm unloading (trailer → silo) |

---

## Phase 11A — Manual Movement and Command Foundation

### Goal

Establish machine-oriented command architecture. Player can select tractor and right-click terrain to move. Remove automatic return to farmyard after field work.

### Architecture deliverables

- `MachineCommand` with `CommandDestination` and `CommandTask` discriminated union
- `Game.issueMachineCommand(machineId, command)`
- Thin `MachineRegistry` with `tractor_1` registered
- `MachineController` interface; `TractorJobSystem` as first implementation
- Static capability checks per machine catalog
- Kinetic states: `idle`, `moving`, `working` only
- `selectedEntity` on `GameSnapshot` (Game/UI state)
- Remove `Returning` state and auto-return behavior

### Gameplay

- Left-click tractor → select `tractor_1`
- Right-click terrain (tractor selected) → move to world point (linear movement, no pathfinding)
- Existing HUD Plow / Seed / Harvest buttons route through `issueMachineCommand` (bridge)
- After field work completes, tractor stays at field position

### Input

- Right-click vs camera pan: click/drag threshold required
- Tractor selection visual in Presentation

### Save

- Persist machine position, rotation, and state (v7 foundation)

### Acceptance criteria

- [ ] `issueMachineCommand` is the only path for machine movement and field work from clients
- [ ] `MachineRegistry` resolves `tractor_1`; no hardcoded ID branches outside catalog/bootstrap
- [ ] Tractor does NOT auto-return to farmyard after work
- [ ] One active command per machine at a time
- [ ] Right-click terrain moves tractor when selected
- [ ] Game is playable via HUD field workflow
- [ ] `npm run build` passes

---

## Phase 11B — Field Radial Contextual Actions

### Goal

Field work is triggered from world interaction via radial context menu.

### Gameplay

- Right-click field (tractor selected) → radial menu
- Valid actions only: **Plow**, **Seed**, **Harvest**, **Cancel**
- Invalid actions are hidden, not shown disabled
- **No "Go Here"** entry in radial menu
- Terrain right-click remains immediate move
- Seed opens existing Choose Crop dialog, then issues `{ kind: 'seed', cropId }`
- Cancel dismisses menu only

### Commands

- Radial actions call `issueMachineCommand` with `destination: field` and appropriate `task`
- Capability and field rules determine visible actions

### UI

- `RadialContextMenu` React component
- HUD field buttons remain as accessibility fallback

### Acceptance criteria

- [ ] Field radial menu shows only valid actions for field state
- [ ] No "Go Here" in field menu
- [ ] Terrain right-click still moves without menu
- [ ] All radial actions route through `issueMachineCommand`
- [ ] Full field workflow playable via radial menu
- [ ] `npm run build` passes

---

## Phase 11C — Trailer Transport

### Goal

Harvest loads trailer, not silo.

### Architecture deliverables

- `Trailer` on `tractor_1` (capacity, load, clear, snapshot)
- `FieldSystem.harvestField` returns yield; MUST NOT call `InventorySystem`
- Harvest task: validate trailer capacity **before** field mutation → harvest field → `trailer.load`
- Event: harvest loaded into trailer
- Save v7: trailer contents + machine command state

### Gameplay

- Harvest fills trailer
- Silo inventory unchanged until unload
- Harvest blocked when trailer full (clear feedback)
- HUD tractor panel shows trailer contents and capacity

### Acceptance criteria

- [ ] Inventory and trailer remain separate concepts
- [ ] Trailer capacity validated before field is harvested
- [ ] `InventorySystem` not written on harvest
- [ ] Trailer state persists in save v7
- [ ] Game playable with harvest → trailer loop
- [ ] `npm run build` passes

---

## Phase 11D — Farm Unloading

### Goal

Complete logistics loop: trailer → silo → market / production.

### Architecture deliverables

- `unload` task: `{ kind: 'unload', targetBuildingId?: string }`
- Farmyard zone proximity check
- Unload transfers trailer contents to `InventorySystem`
- Event: stored to silo / cargo unloaded
- Larger Trailer shop upgrade affects capacity

### Gameplay

- Right-click farmyard (tractor selected, trailer has goods) → radial with **Unload**
- After unload, trailer empty; silo updated; market and production work as before
- Player must drive to farmyard to unload before selling or milling

### Acceptance criteria

- [ ] Unload is primary path from trailer to silo
- [ ] Market and production consume silo only (unchanged behavior post-unload)
- [ ] Farmyard radial unload works
- [ ] Larger Trailer upgrade affects capacity
- [ ] Full loop: harvest → drive → unload → sell / mill
- [ ] `npm run build` passes

---

## Explicitly Out of Phase 11 Scope

- Implement attachments (plow, seeder as entities)
- Pathfinding
- Second machine
- Worker registry
- Command queue / cancel
- States: waiting, blocked, disabled
- Multiplayer
- Removing HUD field buttons (may remain as fallback)

---

## Change Policy

This specification is locked under Architecture Freeze v1.0.

Deviations require architecture review.
