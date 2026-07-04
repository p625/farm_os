# 003 — Machine Architecture

**Type:** Normative  
**Status:** Architecture Freeze v1.0 — Approved

---

## Overview

Controllable machines are the player's primary agents in the world. Phase 11 introduces manual control for the first machine: `tractor_1`.

The architecture supports additional machines without redesigning the command system.

---

## MachineRegistry

See [002_CommandArchitecture.md](./002_CommandArchitecture.md).

`MachineRegistry` remains intentionally small:

- Route commands
- Resolve machine IDs
- Return snapshots

It MUST NOT become an Entity Manager.

---

## Machine Lifecycle

### Bootstrap

At game start, registered machines are initialized. `tractor_1` is the first registrant.

### Active command

A machine may have zero or one active `MachineCommand`. While moving or working, new commands are rejected unless a future review adds command replacement.

### Idle

After command completion, the machine remains at its current world position. It MUST NOT automatically return to a home position.

### Dispose

On game dispose, controllers release listeners. Save data is persisted before dispose when auto-save is enabled.

---

## Machine Snapshots

`GameSnapshot` exposes machine state for UI and Presentation.

Machine snapshots MUST include:

- `machineId`
- Kinetic state (`idle`, `moving`, `working`)
- Position and rotation
- Active command summary (if any)
- Work progress (if working)
- Trailer contents (Phase 11C+)
- Capability-derived flags for UI (for example, can unload)

Snapshots are **derived read models**. They are NOT authoritative. Simulation state in the controller is authoritative.

---

## Selection

Selection is **Game / UI state**, not a simulation system.

`selectedEntity` MAY be:

- `none`
- `machine` (with `machineId`)
- `field` (with `fieldId`)
- `building` (future)

Only one entity is selected at a time.

Selection MUST NOT be required for simulation ticks. Commands from AI MUST use `machineId` directly.

Selection state MAY be omitted from save data (resets to `none` on load).

---

## Trailer

`Trailer` represents **in-transit goods** on a machine.

### Responsibilities

- Hold crop quantities during transport
- Enforce capacity
- Load on harvest (Phase 11C)
- Unload to silo at farmyard (Phase 11D)

### Rules

- Trailer MUST NOT write to `InventorySystem` on harvest
- Trailer MUST NOT be merged with inventory concepts
- Capacity MAY be influenced by shop upgrades (Larger Trailer)

### Ownership

Initially, `tractor_1` owns one `Trailer`. Future machines may have integrated storage (combine bin) or towed trailers.

---

## Future Implement Concept

**Implement** is reserved for future equipment attachments: plow, cultivator, seeder, sprayer, header.

Phase 11 does NOT implement Implement entities.

Field work in Phase 11 (plow, seed, harvest) is expressed as `CommandTask` kinds. The tractor implicitly has required equipment.

When Implement is introduced, machine capabilities MAY be derived from attached implements.

---

## Machine Ownership

`MachineController` owns:

- World position and rotation
- Kinetic state
- Active command and work timer
- Trailer state

Domain systems own their domains:

| System | Owns |
|--------|------|
| `FieldSystem` | Field lifecycle |
| `InventorySystem` | Silo storage |
| `CropSystem` | Crop rules and yields |
| `OwnershipSystem` | Field ownership |

Controllers orchestrate domain systems. They MUST NOT duplicate domain rules.

---

## Machine States

Phase 11 kinetic states:

| State | Meaning |
|-------|---------|
| `idle` | No active movement or work |
| `moving` | Navigating toward destination |
| `working` | Executing task timer at destination |

Future states (`waiting`, `blocked`, `disabled`) are **deferred**. They MUST NOT be added until a feature requires them.

Future blocking MAY use orthogonal metadata (for example, `blockReason`) instead of expanding the state enum prematurely.

---

## Future Machine Expansion

Adding a new machine:

1. Define `machineId` in machine catalog
2. Declare static capabilities
3. Implement `MachineController`
4. Register in `MachineRegistry` at bootstrap
5. Add save slice and migration
6. Add Presentation picking and visuals

No change to `issueMachineCommand` signature or registry routing pattern is required.

Workers use a separate registry when introduced. See [000_GoldenRules.md](./000_GoldenRules.md).

---

## Change Policy

Machine registry routing model and trailer/inventory separation are **immutable** under Freeze v1.0.

Implement system and additional machines are **deferred**.
