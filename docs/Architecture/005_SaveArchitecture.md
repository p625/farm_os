# 005 — Save Architecture

**Type:** Normative  
**Status:** Architecture Freeze v1.0 — Approved

---

## Overview

FarmOS uses **versioned save data** with **per-domain slices**. Each gameplay system owns its save block. `SaveGameService` orchestrates migration and normalization.

Current save version at freeze: **v6**. Phase 11 introduces **v7** for machine and trailer state.

---

## Versioning

- `SAVE_VERSION` in config defines the current schema version
- Every save write MUST include `version`
- Load MUST migrate older versions forward chain by chain
- Unknown or corrupt core save MUST fail load gracefully (return null or repair per-domain)

---

## Migration

Migration rules:

1. Migrate version N → N+1 in discrete steps
2. Preserve farm data (money, fields, ownership, inventory, production) when possible
3. If a **single domain** slice is invalid, reset **that domain only** — not the whole farm
4. New domains introduced in a version MUST have default empty state in migration from prior version

Example (production repair pattern): invalid production data resets to default mill and empty processed inventory without wiping fields.

Phase 11 v6 → v7: add machine slice with defaults (home position, idle, empty trailer).

---

## Per-Domain Save Slices

`GameSaveData` is a composite of domain slices:

| Slice | Owner system |
|-------|----------------|
| `money`, `currentDay`, `gameSpeed` | `World` |
| `fields`, `selectedFieldId` | `FieldSystem` |
| `ownership` | `OwnershipSystem` |
| `inventory` | `InventorySystem` |
| `marketPrices`, `processedMarketPrices` | `MarketSystem` |
| `production` | `ProductionSystem` |
| `upgrades` | `FarmShopSystem` |
| `eventLog`, `eventLogNextId` | `GameEventLog` |
| `machine` (v7) | Machine controller / `TractorJobSystem` |

Each system MUST provide `toSaveData()` and `applySave()` for its slice.

`Game.captureSaveData()` assembles the composite. `Game.applySaveData()` distributes slices.

---

## Machine Save (v7)

Machine save slice MUST include:

| Field | Purpose |
|-------|---------|
| `machineId` | Identifier (for example, `tractor_1`) |
| `position` | x, y, z |
| `rotationY` | Facing |
| `state` | `idle`, `moving`, `working` |
| `activeCommand` | Destination + task + progress if mid-work |
| `trailer` | In-transit cargo |

`MachineRegistry` structure is NOT persisted. Only per-machine state is persisted.

---

## Trailer Save

Trailer save is part of the machine slice.

Trailer save MUST include:

- Crop quantities in transit (per crop type or slot model defined at implementation)
- MUST NOT duplicate silo `inventory` slice

On load:

- Trailer contents restore to machine trailer
- Silo inventory restores independently
- MUST NOT merge trailer into inventory on load

---

## Selection and UI State

`selectedEntity` and context menu state MUST NOT be persisted.

On load, selection resets to `none`.

---

## Future Compatibility Rules

1. **Additive fields** — new optional fields MAY be added within a version with defaults
2. **Breaking changes** — require version bump and migration
3. **Removed fields** — migration MUST strip or ignore deprecated fields
4. **Registry growth** — new machines add entries to machine save array or map; old saves default new machines to catalog defaults
5. **Task union growth** — unknown task kinds in save MUST reset machine command to idle
6. **Never** store Presentation or UI state in save

---

## Invalid Data Handling

| Invalid slice | Behavior |
|---------------|----------|
| Core (money, fields missing) | Reject load |
| Production | Reset production only |
| Machine / trailer | Reset machine to default idle, empty trailer |
| Market prices | Rebase to catalog defaults |
| Inventory | Normalize to catalog crop keys |

---

## Change Policy

Per-domain slice ownership and versioned migration are **immutable** under Freeze v1.0.

Save version bumps for Phase 11 machine/trailer are expected and approved.
