# 007 — Phase 12: Attachments and Harvest Machines

**Type:** Implementation specification  
**Status:** Approved — implementation not started  
**Prerequisite docs:** [000](./000_GoldenRules.md) – [006](./006_Phase11_ManualMachineControl.md)  
**Architecture Freeze:** v1.0 unchanged — this document extends implementation only

This document specifies Phase 12 only. It does NOT contain code.

Each sub-phase MUST leave the game fully playable and MUST pass `npm run build`.

Phase 11C world-first field workflow (radial menu, tractor selection, right-clicked `fieldId`) is the baseline. Phase 12 evolves implicit tractor tools into **equipment-based capabilities**.

---

## Relationship to Architecture Freeze v1.0

| Freeze concept | Phase 12 interpretation |
|----------------|---------------------------|
| `MachineRegistry` thin router | Unchanged — only **machines** register |
| `MachineCommand` gateway | Unchanged — field work and movement |
| Trailer ≠ Inventory | Unchanged — in-transit cargo only |
| Future Implement concept (003) | Realized as **Attachment** subtype `implement` |
| Dynamic capabilities from attachments (002, 003) | Implemented via **effective capabilities** |
| Additional machines (003) | Grain and corn combines in 12C |

**NOT modified:** Golden Rules, normative architecture docs 000–005, `issueMachineCommand` signature, save philosophy, layer separation.

---

## Phase Overview

| Phase | Focus |
|-------|-------|
| **12A** | Attachment architecture, world objects, attach / detach |
| **12B** | Field work requires attached implement (plow + seeder) |
| **12C** | Harvest machines, headers, crop compatibility |
| **12D** | Trailer logistics (combine → trailer → silo) |
| **12E** | Potato harvesting |

**Deferred to Phase 13+:** sprayer, fertilizer, precision farming, and all spray-related `CommandTask` variants.

---

## Core Architecture: Attachment

### Generalized model

Replace separate top-level **Implement** and **Trailer** concepts with a single simulation concept:

```text
Attachment
├── implement      (plow, cultivator, seeder, …)
├── trailer        (wagon, grain cart, tanker, …)
├── header         (grain header, corn header, …)
├── frontAttachment (front loader, front weight, snow blade, …)
└── (future types)
```

**Attachment** is the generic simulation object. Specialized types are catalog metadata, not separate registries.

This hierarchy MUST support future devices without architecture redesign:

- plows, cultivators, seeders, fertilizer spreaders  
- front loaders, front weights, snow blades  
- balers, mowers  
- trailers, tankers  
- forestry tools  
- combine headers  

### Attachment vs Machine

| | **Attachment** | **Machine** |
|---|----------------|-------------|
| Registered in `MachineRegistry` | No | Yes |
| Player selects for movement | No (parent machine) | Yes |
| Owns kinetic command loop | No | Yes |
| Provides capabilities when mounted | Yes | Base capabilities only |
| World pick target | Yes | Yes |
| Persisted in save | Yes (`attachments` slice) | Yes (`machines` slice) |

### Attachment vs Inventory

- **Attachment cargo** (trailer containers) = in-transit, temporary.  
- **InventorySystem** = permanent silo storage.  
- MUST NOT merge attachment cargo with inventory.

---

## Machine Attachment Slots

Every machine owns **attachment slots**. Slots are defined in machine catalog configuration.

Do **not** special-case combines. Headers use the same slot model as implements.

### Example slot maps

**Tractor (`tractor_1`)**

| Slot ID | Accepted attachment types |
|---------|---------------------------|
| `front_hitch` | `frontAttachment`, (future: snow blade, loader) |
| `rear_hitch` | `implement` |
| `trailer_hitch` | `trailer` |

**Grain combine (`grain_combine_1`)**

| Slot ID | Accepted attachment types |
|---------|---------------------------|
| `header_slot` | `header` (grain-compatible headers) |
| `trailer_hitch` | `trailer` (future / 12D logistics) |

**Corn combine (`corn_combine_1`)**

| Slot ID | Accepted attachment types |
|---------|---------------------------|
| `header_slot` | `header` (corn-compatible headers) |
| `trailer_hitch` | `trailer` (future) |

Slot rules:

- Each slot holds **zero or one** attachment at a time.  
- Attachment type MUST match slot `acceptedTypes`.  
- Effective capabilities derive from **all occupied slots** on the selected machine.  
- Detached attachments exist as world objects at a position.

---

## Attachment Lifecycle States

Reserved lifecycle enum (extensible):

| State | Phase 12 implementation |
|-------|-------------------------|
| `detached` | **12A** — world object at position |
| `approaching` | Reserved |
| `attaching` | Reserved |
| `attached` | **12A** — mounted on machine slot |
| `detaching` | Reserved |

Phase 12A implements instant attach / detach (no animation timer). Future phases MAY use intermediate states without schema changes.

---

## Trailer and Cargo Model

Trailer is an attachment subtype. Cargo is **not** a flat crop list only.

```text
Trailer Attachment
└── containers[] (cargo slots)
    └── cargo entry: { cargoKind, itemId?, quantity, … }
```

**Phase 12D** implements **grain** cargo only.

Architecture MUST remain open for future `cargoKind` values:

- `grain`, `bale`, `pallet`, `fertilizer`, `seed`, `machinery`, `logs`, …

No implementation of non-grain cargo in Phase 12. Catalog and save types MUST use discriminated cargo kinds, not hardcoded crop-only arrays without a kind field.

---

## Harvest Compatibility

Harvest capability is **header-driven**, not machine-driven.

```text
Machine (combine)
  + attached Header (header_slot)
  = effective harvest capability for supported crops
```

Catalog:

```text
Header definition
  → supportedCropIds: readonly string[]
```

Validation flow:

1. Resolve selected machine.  
2. Resolve header in `header_slot` (if any).  
3. Check header `supportedCropIds` contains field crop.  
4. Check field state, ownership, cargo capacity.  
5. Issue `{ kind: 'harvest' }` via `issueMachineCommand`.

**Tractor MUST NOT harvest** after Phase 12B (harvest removed from tractor effective capabilities).

**Potato** — no header support until Phase 12E.

---

## Effective Capabilities

```text
effectiveCapabilities(machineId) =
  baseCapabilities(machineId)           // from machine catalog
  ∪ capabilitiesFromAttachments(slots)  // each mounted attachment
```

Examples:

| Configuration | Effective field capabilities |
|---------------|----------------------------|
| Tractor alone | `move`, `tow` |
| Tractor + plow on `rear_hitch` | + `plow` |
| Tractor + seeder on `rear_hitch` | + `seed` |
| Grain combine + grain header | `move`, `harvest` (grain crops via header) |
| Corn combine + corn header | `move`, `harvest` (corn via header) |

Commands MUST be rejected if `task.kind` is not in effective capabilities.

Static `machineHasCapability(catalog)` is insufficient after 12B — use `getEffectiveCapabilities(machineId)`.

---

## Attach and Detach API

Attachment coupling is **not** a `MachineCommand` field task. Use typed `Game` methods (same gateway principle as ownership and market):

```text
Game.attachAttachment(machineId, slotId, attachmentId): boolean
Game.detachAttachment(machineId, slotId): boolean
```

Rules:

- Selected machine must match `machineId`.  
- Machine MUST be `idle` (no active command).  
- Attachment MUST be `detached` and within proximity OR picked by raycast.  
- Slot MUST accept attachment type.  
- Detach sets attachment to `detached` at a defined offset from machine hitch.

Movement to attachment before attach: existing `{ destination: world, task: none }`.

---

## Input and Radial Menus

All controllable machines share the same interaction model.

### Selection

- Left-click machine → `Game.selectMachine(machineId)`.  
- Machine selection persists after field work (Phase 11C behavior).

### Right-click routing (machine selected)

| Pick target | Action |
|-------------|--------|
| Detached attachment mesh | Attachment radial: **Attach** (if compatible slot free) |
| Attached attachment mesh on selected machine | Attachment radial: **Detach** |
| Field mesh | Field radial (actions from effective capabilities + field state) |
| Terrain | `{ destination: world, task: none }` |
| Machine busy | No field or attachment menu |

Pick priority on pointer down (machine selected):

1. Attachment meshes (any slot)  
2. Field mesh (skip machine body via pick predicate)  
3. Terrain  

Click-vs-drag threshold unchanged (camera pan vs click).

### Field radial actions

- MUST use **right-clicked `fieldId`**, not HUD-selected field.  
- Invalid actions hidden (not disabled).  
- No "Go Here" in field menu.  
- Growing / seeded fields: no work actions (until Phase 13+ spray).

### Attachment radial actions

- **Attach** / **Detach** / **Cancel** only.  
- Hide invalid actions.

### Terrain movement collision

Attachment radial MUST NOT open on terrain picks. Equipment meshes MUST be pickable when detached.

---

## Command Model (unchanged shape)

Field work continues through:

```text
Game.issueMachineCommand(machineId, {
  destination: { kind: 'field', fieldId },
  task: { kind: 'plow' | 'seed', cropId? | 'harvest' | 'unload', … }
})
```

Phase 12 task kinds used:

| Task | Phase | Notes |
|------|-------|-------|
| `none` | existing | Movement |
| `plow` | 12B | Requires plow implement |
| `seed` | 12B | Requires seeder implement |
| `harvest` | 12C | Requires header; combine only |
| `unload` | 12D | Trailer / farmyard logistics |

**NOT in Phase 12:** `spray`, fertilizer tasks.

---

## Harvest Logistics

### Phase 12C

- Combine harvests into **combine grain bin** (machine-owned in-transit storage on controller).  
- MUST NOT write `InventorySystem` on harvest.  
- Bin capacity enforced before field mutation.

### Phase 12D

- Transfer grain from combine bin → trailer containers (when configured).  
- Tractor (or combine) with trailer drives to farmyard.  
- `{ kind: 'unload' }` at farm zone → trailer containers → `InventorySystem`.  
- Market and production consume silo only (unchanged).

---

## Simulation Systems

| System | Role |
|--------|------|
| `AttachmentSystem` | Owns all attachment entities, slots, lifecycle, save slice |
| `MachineCapabilityResolver` | Pure effective-capability computation |
| `MachineRegistry` | Thin router — machines only |
| `TractorJobSystem` | Tractor controller; uses effective caps |
| `GrainCombineJobSystem` | New — 12C |
| `CornCombineJobSystem` | New — 12C |
| `FieldSystem`, `CropSystem`, `InventorySystem` | Domain rules unchanged; orchestrated by controllers |

`AttachmentSystem` MUST NOT become a second machine registry.

---

## Presentation

| Module | Role |
|--------|------|
| `AttachmentPresentation` | Meshes for all attachment types; parent to machine when attached |
| `MachineInputPresentation` | Generalized from tractor input; pick routing for all machines |
| `MachinePresentation` | Per-machine visuals (tractor, combines) |
| UI radial components | Field radial, attachment radial, crop radial (existing patterns) |

Presentation MUST NOT mutate simulation.

---

## Save Migration (v7 → v8)

Bump `SAVE_VERSION` to **8** when Phase 12A lands.

### New slice: `attachments`

```text
attachments: {
  items: AttachmentSaveData[]   // all world attachments
}
```

Each `AttachmentSaveData` includes:

- `attachmentId`, `attachmentType`, `catalogId`  
- `lifecycleState` (`detached` | `attached` in 12A)  
- `position`, `rotationY` when detached  
- `mountedOn`: `{ machineId, slotId } | null` when attached  
- `containers` (trailer only; grain cargo in 12D)

### Machine slice expansion

```text
machines: Record<MachineId, MachineSaveData>
```

Migrate v7 single `machine` → `machines.tractor_1`.

Per-machine save MAY include:

- Kinetic state, active command (existing)  
- `grainBin` (combine, 12C)  
- Slot occupancy is derived from `attachments` slice, not duplicated.

### Migration rules

- Default attachments spawned at equipment yard if missing.  
- New combines default to idle at catalog spawn.  
- Unknown attachment or slot → detach and place at yard.  
- `selectedEntity` and context menus NOT persisted.

---

## HUD

- Show selected machine name and occupied slots.  
- Show effective capabilities summary.  
- Hint: **"Select tractor, then right-click a field to work it."** (extend with attach hint in 12A).  
- Disabled HUD buttons with reason when attachment missing.  
- **HUD fallback buttons remain** through Phase 12.  
- Combine bin / trailer container readouts in 12C / 12D.

---

## Phase 12A — Attachment Architecture and Attach / Detach

### Goal

Introduce `Attachment` as the generic simulation object. World attachments exist. Player can attach and detach via radial menu. **Field work rules unchanged** (tractor still performs plow/seed/harvest temporarily).

### Deliverables

- `AttachmentSystem`  
- Attachment catalogs (`attachment-catalog.ts`): plow, seeder, wagon (trailer), grain header, corn header (headers may be attachable in world but not required for gameplay until 12C)  
- Machine slot definitions in machine catalog  
- `AttachmentPresentation`  
- `MachineInputPresentation` (refactor from `TractorInputPresentation`)  
- Attachment radial UI  
- `Game.attachAttachment` / `Game.detachAttachment`  
- Save v8 `attachments` slice + migration  
- Attachment lifecycle: `detached` and `attached` only  

### Gameplay

- Select tractor → right-click detached plow → **Attach** to `rear_hitch`  
- Right-click attached plow → **Detach**  
- Same pattern for trailer on `trailer_hitch` (empty cargo)  
- Terrain right-click still moves tractor  
- Field radial still works without requiring attachments (temporary bridge)  

### Acceptance criteria

- [ ] Attachment hierarchy types defined (`implement`, `trailer`, `header`, `frontAttachment`)  
- [ ] Tractor slots: `front_hitch`, `rear_hitch`, `trailer_hitch`  
- [ ] Attach / detach via `Game` gateway only  
- [ ] Detached attachments are world-pickable  
- [ ] Save v8 restores attachment positions and mount state  
- [ ] No regression to Phase 11C radial field workflow  
- [ ] `npm run build` passes  

---

## Phase 12B — Field Work Requires Implement

### Goal

Tractor alone can only move and tow. Plow and seed require mounted implements. Tractor harvest removed.

### Deliverables

- `MachineCapabilityResolver`  
- Tractor base capabilities: `move`, `tow` only  
- `getFieldRadialWorkActions` uses effective capabilities  
- `TractorJobSystem.validateCommand` uses effective capabilities  
- HUD reflects missing implement  
- Remove tractor `harvest` from gameplay paths  

### Field rules

| Field state | Required attachment | Task |
|-------------|---------------------|------|
| Grass | Plow implement on `rear_hitch` | `plow` |
| Plowed | Seeder implement on `rear_hitch` | `seed` |
| Seeded / Growing | — | no actions |
| Harvestable | — (tractor cannot harvest) | — |

### Acceptance criteria

- [ ] No plow without plow implement attached  
- [ ] No seed without seeder attached  
- [ ] Tractor cannot harvest any crop  
- [ ] Full plow → seed loop via radial without HUD buttons  
- [ ] Attach / detach still works  
- [ ] HUD fallback buttons respect effective capabilities  
- [ ] `npm run build` passes  

---

## Phase 12C — Harvest Machines and Headers

### Goal

Add grain and corn combines. Harvest via header crop compatibility. Harvest loads combine grain bin, not silo.

### Deliverables

- `grain_combine_1`, `corn_combine_1` in machine catalog and `MachineRegistry`  
- `GrainCombineJobSystem`, `CornCombineJobSystem`  
- Header attachments for grain and corn (`header_slot`)  
- Header catalog: `supportedCropIds`  
- Combine grain bin on controller  
- Field radial when combine selected  
- Potato fields show no harvest action with clear feedback  

### Crop compatibility (initial)

| Crop | Header / combine |
|------|------------------|
| wheat, barley, canola, soybean | Grain header on grain combine |
| corn | Corn header on corn combine |
| potato | Unsupported until 12E |

### Acceptance criteria

- [ ] Grain combine + grain header harvests grain crops only  
- [ ] Corn combine + corn header harvests corn only  
- [ ] Cross-crop harvest rejected  
- [ ] Tractor cannot harvest  
- [ ] Harvest does not write `InventorySystem`  
- [ ] Combine bin visible in HUD  
- [ ] Tillage + plant (tractor) + harvest (combine) loop playable  
- [ ] `npm run build` passes  

---

## Phase 12D — Trailer Logistics

### Goal

Complete in-transit logistics: combine bin → trailer containers → farmyard unload → silo.

### Deliverables

- Trailer `containers` with `cargoKind: 'grain'`  
- Transfer combine bin → trailer (typed `Game` method or documented unload/load flow)  
- `{ kind: 'unload' }` at farmyard for trailer → `InventorySystem`  
- Farmyard right-click radial when trailer has grain cargo  
- Capacity checks before load and unload  
- Larger Trailer shop upgrade (if not already present)  

### Acceptance criteria

- [ ] Full loop: harvest → bin → trailer → drive → unload → silo → sell / mill  
- [ ] Trailer cargo and silo inventory remain separate domains  
- [ ] Trailer capacity enforced  
- [ ] Cargo model extensible (`cargoKind` discriminant)  
- [ ] `npm run build` passes  

---

## Phase 12E — Potato Harvesting

### Goal

Add potato harvest support via dedicated header / machine configuration.

### Deliverables

- Potato header or `potato_harvester_1` machine (decision at implementation time)  
- `supportedCropIds` includes potato  
- HUD / radial no longer shows “unsupported” for potato on correct equipment  

### Acceptance criteria

- [ ] Potato harvestable with correct equipment only  
- [ ] Existing grain / corn rules unchanged  
- [ ] `npm run build` passes  

---

## Explicitly Out of Phase 12 Scope

- Sprayer, fertilizer, precision farming (Phase 13+)  
- `spray` command task  
- ECS  
- Worker registry  
- Pathfinding  
- Command queue / cancel mid-job  
- Multiplayer  
- Removing HUD fallback buttons  
- Merging trailer cargo with inventory  
- Auto-return to farmyard  
- Attachment wear / repair / fuel  
- Shop purchase of attachments (spawn at yard only in 12A)  
- Non-grain cargo implementation (architecture only)  
- Lifecycle states `approaching`, `attaching`, `detaching` (reserved only)  

---

## Risk Summary

| Risk | Mitigation |
|------|------------|
| Attachment system grows into entity manager | Single `AttachmentSystem`; machines stay in `MachineRegistry` |
| Pick routing complexity | One `MachineInputPresentation`; documented priority order |
| Save migration | v7→v8 chain; per-domain defaults |
| Playability gap in 12B | 12A trains attach; HUD hints; 12A leaves field work working until 12B lands |
| Header / crop matrix sprawl | Catalog-driven `supportedCropIds`; no hardcoded crop branches in controllers |

---

## Change Policy

This specification is approved for implementation.

Deviations from this document or from Architecture Freeze v1.0 require explicit architecture review.

Normative docs 000–005 MUST NOT be edited for Phase 12 implementation.
