# 004 — Rendering Architecture

**Type:** Normative  
**Status:** Architecture Freeze v1.0 — Approved

---

## Three Layers

```text
┌─────────────────────────────────────────┐
│  UI (React)                             │
│  HUD, dialogs, radial menus             │
│  Screen-space interaction               │
└─────────────────┬───────────────────────┘
                  │ Game commands
┌─────────────────▼───────────────────────┐
│  Presentation (Babylon.js)              │
│  Scene, meshes, picking, visuals        │
│  World-space interaction                │
└─────────────────┬───────────────────────┘
                  │ Game commands (never direct system mutation)
┌─────────────────▼───────────────────────┐
│  Simulation (Gameplay systems)          │
│  Authoritative state                    │
└─────────────────────────────────────────┘
```

---

## Simulation

Gameplay systems own authoritative state.

Simulation MUST NOT import UI or Presentation.

Simulation updates on the game loop tick and via commands received through `Game`.

---

## Presentation

Presentation visualizes simulation state.

Presentation MUST:

- Read position, state, and snapshots from systems or `GameSnapshot`
- Sync meshes, materials, highlights, and indicators
- Forward world input to `Game` as commands or selection requests

Presentation MUST NOT:

- Call `fieldSystem.plowField()`, `inventorySystem.addCrop()`, or equivalent mutation APIs
- Store authoritative gameplay state

Presentation MAY store ephemeral view state (hover, animation phase, pick cache).

### Existing presentation modules

| Module | Responsibility |
|--------|----------------|
| `FieldPresentation` | Field meshes, hover, left-click field select |
| `FieldOverlayPresentation` | Labels, outlines, growth bars |
| `TractorPresentation` | Tractor position, work indicator |
| `ProductionPresentation` | Mill visual state |
| `CameraController` | Isometric camera, zoom, pan |

Phase 11 adds input routing for tractor selection, right-click movement, and context menu triggers.

---

## UI

UI owns screen-space interaction.

UI MUST:

- Render HUD panels from `GameSnapshot`
- Call `Game` command methods on button clicks
- Render radial context menus from snapshot-derived options

UI MUST NOT:

- Import simulation systems for mutation
- Hold authoritative gameplay state (cargo quantities, field state, money)

UI MAY hold ephemeral UI state (dialog open, menu screen position, confirm reset).

---

## Input Routing

All gameplay input converges on `Game`.

| Source | Input | Action |
|--------|-------|--------|
| Presentation | Left-click tractor | `Game.selectEntity({ kind: 'machine', machineId })` |
| Presentation | Left-click field | `Game.selectEntity({ kind: 'field', fieldId })` |
| Presentation | Right-click terrain | `Game.issueMachineCommand(…, { destination: world, task: none })` |
| Presentation | Right-click field | Open field radial menu (via `Game`) |
| Presentation | Right-click farmyard | Open farmyard radial menu (Phase 11D) |
| UI | HUD buttons | `Game.issueMachineCommand(…)` or typed `Game` commands |
| UI | Radial menu selection | `Game.issueMachineCommand(…)` |

---

## Selection

Selection is tracked in `Game` snapshot state.

- Only one selected entity at a time
- Tractor must be selected for machine movement and field context actions
- Selection drives visual highlights in Presentation and labels in UI

Selection is NOT a simulation system.

---

## World Picking

Presentation performs Babylon raycasts on pointer events.

Pick resolution order (conceptual):

1. Machine meshes (tractor)
2. Field meshes
3. Farmyard / building meshes
4. Ground / terrain

Resolved picks MUST map to structured targets (`machineId`, `fieldId`, `world`, `farmZone`). Presentation forwards targets to `Game`; it does not interpret gameplay rules.

---

## Right-Click Flow

### Terrain

```text
Right-click ground (tractor selected)
  → issueMachineCommand({ destination: world, task: none })
  → tractor moves immediately
  → NO context menu
```

### Field

```text
Right-click field (tractor selected)
  → Game computes valid radial actions from field state + capabilities
  → UI renders radial menu
  → player selects action
  → issueMachineCommand({ destination: field, task: … })
```

There is NO "Go Here" action in the field radial menu. Movement to a field location is achieved by right-clicking terrain, or by issuing a work command that includes field destination.

### Farmyard (Phase 11D)

```text
Right-click farmyard (tractor selected, trailer has goods)
  → radial menu with Unload
  → issueMachineCommand({ destination: farm, task: unload })
```

---

## Camera and Right-Click

ArcRotateCamera uses right-drag for panning. Input layer MUST distinguish right-click (command) from right-drag (camera pan) using a movement threshold.

---

## Responsibilities Summary

| Concern | Owner |
|---------|-------|
| Field growth, harvest rules | `FieldSystem` |
| Silo quantities | `InventorySystem` |
| Tractor position, command | `MachineController` |
| Tractor mesh position | `TractorPresentation` |
| Plow button enabled state | `GameSnapshot` → UI |
| Radial menu options | `GameSnapshot` → UI |
| Field highlight | `FieldPresentation` |

---

## Change Policy

Presentation read-only rule and Game gateway for input are **immutable** under Freeze v1.0.
