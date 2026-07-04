# 000 — Golden Rules

**Type:** Normative (primary architecture contract)  
**Status:** Architecture Freeze v1.0 — Approved

These rules MUST be followed by all FarmOS gameplay, presentation, and UI code.

---

## Rule 1 — Simulation Independence

Simulation systems MUST NOT depend on UI, React, or Babylon.js.

Simulation MAY depend on abstract services injected at bootstrap (for example, event logging or price lookups). Those services MUST NOT import presentation or UI layers.

---

## Rule 2 — Game Gateway

All **player-initiated** and **AI-initiated** gameplay actions MUST enter simulation through `Game`.

Internal simulation ticks and cross-system reactions (day advancement, crop growth, market fluctuation) are simulation events. They are NOT required to pass through player command APIs.

---

## Rule 3 — Presentation Is Read-Only

Presentation MUST read simulation state and visualize it.

Presentation MUST NOT call gameplay mutation methods on simulation systems directly.

Presentation MAY forward player intent to `Game` (selection, commands).

Presentation MAY hold ephemeral view state (hover highlights, animation blends, screen-space menu positions). Ephemeral view state is NOT simulation state.

---

## Rule 4 — Machine Commands

All **machine-operated** world interactions MUST use `MachineCommand` via `issueMachineCommand(machineId, command)`.

`CommandTask` MUST be a discriminated union. Task parameters MUST be typed fields inside the task variant, NOT a loose generic parameters object.

Non-machine gameplay (ownership, market, production buildings, meta actions) MUST use typed `Game` methods. Those methods MUST follow the same gateway principle: clients MUST NOT call simulation systems directly.

HUD or temporary bridges MUST NOT permanently bypass `issueMachineCommand` for machine-operated actions.

---

## Rule 5 — Storage Domains

`InventorySystem` MUST represent permanent silo storage.

`Trailer` MUST represent in-transit transported goods on a machine.

Trailer contents and inventory MUST NOT be merged into a single storage concept.

Unloading MUST be the primary path from trailer to silo for harvested crops. Market and production systems MUST consume silo inventory, not trailer contents.

---

## Rule 6 — Machine Registry

Every controllable machine MUST be registered in `MachineRegistry`.

Gameplay code MUST resolve machine behavior by `machineId` through `MachineRegistry`.

Gameplay code MUST NOT branch on hardcoded machine IDs (for example, `tractor_1`) outside catalog configuration and registry bootstrap.

---

## Rule 7 — Layer Ownership

| Layer | Owns |
|-------|------|
| **Gameplay systems** | Rules, authoritative state, simulation ticks |
| **Presentation** | Scene rendering, world picking, visual feedback |
| **UI** | Screen interaction, HUD, dialogs, radial menus |

Each layer MUST stay within its responsibilities.

---

## Rule 8 — Non-Machine Commands

Ownership, market, production building, and meta actions MUST use typed `Game` command methods.

They MUST NOT bypass `Game`.

They MUST NOT be forced into `MachineCommand` unless the action is genuinely machine-operated.

---

## Workers and Machines

Workers and machines are distinct concepts. Workers MUST NOT be silently treated as machines.

When workers are introduced, they MUST use an appropriate registry and command pattern defined by a future architecture review. They MUST NOT be forced into `MachineRegistry` without review.

---

## Change Policy

These Golden Rules MUST NOT change lightly.

Any modification requires an explicit architecture review and a new freeze version.
