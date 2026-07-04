# 001 — Vision and Roadmap

**Type:** Descriptive (non-normative)  
**Status:** Architecture Freeze v1.0 — Approved

This document describes long-term architectural direction. It does NOT contain implementation promises, schedules, or phase commitments.

---

## Product Direction

FarmOS is evolving from an automatic farming prototype into a **long-term agricultural management simulation**.

Machines become **controllable entities** in a larger economy. The player manages fields, logistics, storage, production, and equipment over time.

FarmOS is **not** a driving simulator. Movement and selection serve management gameplay: dispatch machines, haul goods, and operate the farm.

---

## Future Machine Types

The architecture is intended to support additional controllable machines over time, including:

- Tractor
- Combine
- Truck
- Drone
- Worker (as a controllable actor — distinct from vehicles)
- Boat
- Train
- Autonomous vehicle

Each machine type shares the command and registry model. Machine-specific behavior lives in its controller implementation.

---

## Future Buildings

Interactive and logistical buildings may include:

- Farm / farmyard
- Silo
- Mill
- Bakery
- Warehouse
- Garage
- Fuel station

Buildings may become command destinations (for example, unload, refuel, deliver). Building state remains owned by domain systems (production, storage, and future building registries).

---

## Future Attachments

Agricultural equipment may eventually be modeled separately from cargo transport:

| Category | Examples |
|----------|----------|
| **Trailer** | Cargo transport, grain cart |
| **Implement** | Plow, cultivator, seeder, sprayer, header |

Phase 11 introduces **Trailer** only. **Implement** is a reserved future concept.

---

## Architectural Direction (Stable)

FarmOS uses:

- **Domain systems** for authoritative state (fields, inventory, market, production)
- **MachineRegistry** as a thin command router for controllable machines
- **MachineCommand** as the universal machine action payload
- **Game** as the client command gateway
- **Presentation / UI** as visualization and interaction layers

---

## Explicitly Out of Scope

The following are **not** part of Architecture Freeze v1.0 and MUST NOT be assumed without a future review:

- Entity Component System (ECS)
- Universal Entity Manager
- Full pathfinding
- Multiplayer replication
- Command queues and macro automation
- Dynamic runtime capability composition from attachments
- Trailer wear, implement attach/detach simulation
- Worker and machine unification into a single entity model

---

## Change Policy

This vision document MAY be updated to reflect product direction.

It does NOT override [000_GoldenRules.md](./000_GoldenRules.md).
