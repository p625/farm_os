# 002 — Command Architecture

**Type:** Normative  
**Status:** Architecture Freeze v1.0 — Approved

---

## Overview

All machine-operated gameplay flows through a single command model:

```text
Client (UI / Presentation / AI / Script)
        │
        ▼
      Game.issueMachineCommand(machineId, command)
        │
        ▼
   MachineRegistry.resolve(machineId)
        │
        ▼
   MachineController.issueCommand(command)
        │
        ▼
   Domain systems (FieldSystem, Trailer, InventorySystem, …)
```

---

## Game

`Game` is the **only command gateway** for client-initiated gameplay.

`Game` MUST:

- Accept `issueMachineCommand(machineId, command)`
- Validate or delegate validation before execution
- Update `GameSnapshot` after state changes
- Trigger save when appropriate

`Game` MUST NOT be bypassed by UI or Presentation for gameplay mutations.

---

## MachineRegistry

`MachineRegistry` is a **thin router**. It is NOT an Entity Manager.

`MachineRegistry` MUST:

- Register and resolve `machineId` → `MachineController`
- Route `issueCommand` to the correct controller
- Provide machine snapshots for `GameSnapshot`

`MachineRegistry` MUST NOT:

- Own field, crop, market, or production state
- Replace domain systems
- Become a universal entity lifecycle manager

---

## MachineController

Each controllable machine implements `MachineController` (conceptual interface).

A controller MUST:

- Own machine simulation state (position, kinetic state, active command, trailer)
- Execute `MachineCommand` against domain systems
- Expose read-only snapshots
- Serialize and restore its save slice

`TractorJobSystem` is the initial controller implementation for `tractor_1`. The freeze does not require renaming existing systems.

---

## MachineCommand

`MachineCommand` is the universal machine action payload:

```text
MachineCommand
  destination: CommandDestination
  task: CommandTask
```

### CommandDestination

| Kind | Purpose |
|------|---------|
| `world` | Move to world coordinates (x, z) |
| `field` | Move to or act on a field |
| `farm` | Farmyard / silo zone (for example, unload) |
| `building` | Future building target (for example, mill dock) |

### CommandTask

`CommandTask` is a **discriminated union**. Parameters live inside the variant.

| Task kind | Payload | Phase |
|-----------|---------|-------|
| `none` | — | 11A |
| `plow` | — | 11B |
| `seed` | `cropId` | 11B |
| `harvest` | — | 11B |
| `unload` | `targetBuildingId?` (optional; default farmyard in 11D) | 11D |

Future task kinds (not in Phase 11): `repair`, `refuel`, `deliver`, `load`, `sleep`, `build`.

**MUST NOT** use a loose `parameters: Record<string, unknown>` alongside a string task type.

---

## Command Routing

Execution flow:

1. Resolve machine via `MachineRegistry`
2. Check machine **capabilities** for `task.kind`
3. Check **world rules** (field state, ownership, trailer capacity, zone proximity)
4. If `task.kind` is `none`: navigate to `destination`, then idle
5. If task requires work: navigate to `destination`, enter `working`, apply task via domain systems, then idle at current position
6. **MUST NOT** auto-return to farmyard after work

Only **one active command** per machine at a time.

---

## Machine Capabilities

Each machine has a static capability set defined in machine catalog configuration.

Example capabilities: `move`, `plow`, `seed`, `harvest`, `unload`, `tow`, `refuel`.

Commands MUST be rejected if the machine lacks the required capability.

Capabilities are static in Phase 11. Dynamic capabilities from attachments are deferred until the Implement system exists.

---

## Non-Machine Commands

The following MUST use typed `Game` methods, NOT `MachineCommand`:

- Purchase / lease field (ownership)
- Sell crop from silo (market)
- Buy shop upgrade (farm shop)
- Start milling (production building)
- Save game, reset farm, game speed (meta)

They MUST still follow Rule 2: enter through `Game`, never direct system mutation from UI.

---

## Future Command Expansion

New machine types register in `MachineRegistry` and declare capabilities. New `CommandTask` variants are added to the union with typed payloads.

Future AI, multiplayer, scripting, and automation MUST issue the same `MachineCommand` payloads. The server (when it exists) validates the same structure clients use.

---

## Change Policy

Command shape and gateway rules are **immutable** under Freeze v1.0.

New task variants and destinations MAY be added via architecture review. Existing variants MUST NOT change semantics without migration.
