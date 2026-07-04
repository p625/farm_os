# 011 — Phase 15: Crop Care

**Type:** Specification  
**Status:** Implemented  
**Architecture Freeze:** v1.0 unchanged  
**Save version:** 11

---

## Overview

Phase 15 adds optional work between seeding and harvest. The player may **fertilize** and **spray** growing crops to improve yield. Skipping care leaves the loop playable with a modest fertility-only baseline.

Prerequisite: Phase 14 World Expansion (distance and workload).

---

## Design Principles

| Principle | Detail |
|-----------|--------|
| **Optional care** | No mandatory chores; harvest always succeeds |
| **Derived condition** | `cropCondition` is computed for HUD only — **never stored** |
| **Stored actions only** | `FieldCropCare.applied[]` persisted in save |
| **Generalized model** | `CropCareAction` enum extensible beyond Phase 15 |
| **Balance in one file** | All multipliers in `crop-care-balance.ts` |
| **Farm Store acquisition** | Spreader and sprayer are free Dealer products via Delivery Zone |
| **No Architecture Freeze changes** | Extensions to existing command / attachment / store patterns |

---

## Crop Care Model

```typescript
// types/crop-care.ts
export const CropCareAction = { Fertilize: 'fertilize', Spray: 'spray' } as const

export interface FieldCropCare {
  applied: readonly CropCareAction[]
}
```

Phase 15 implements only `fertilize` and `spray`. Future actions (e.g. rolling, side-dress) append to the enum without schema redesign.

**Reset:** `plowField` and `completeHarvest` clear `applied` to `[]`.  
**Window:** `seeded`, `growing`, `harvestable` (before harvest command completes).  
**Limit:** one application per action per crop cycle.

---

## Crop Condition (Derived)

HUD computes condition from snapshot data:

```text
cropCondition = clamp(
  fertilityBaseline(catalogFertility)
  + sum(actionConditionBonuses(applied)),
  0, 100
)
```

Constants live in `crop-care-balance.ts`. `CropSystem` and save do **not** store `cropCondition`.

---

## Yield Formula

```text
finalYield = max(1, round(
  crop.baseYield
  × shopYieldMultiplier
  × computeFertilityYieldFactor(fertility)
  × computeCareYieldMultiplier(applied)
))
```

All factors from `crop-care-balance.ts` via `crop-care.ts` helpers. No hardcoded multipliers in `CropSystem`.

---

## Attachments & Capabilities

| Attachment | Category | Capability | Acquisition |
|------------|----------|------------|-------------|
| Fertilizer spreader | `fertilizing` | `fertilize` | Farm Store (Dealer, Attachments, ₡0) |
| Sprayer | `spraying` | `spray` | Farm Store (Dealer, Attachments, ₡0) |

Delivered to **Delivery Zone** (Phase 13 pattern). Not yard-spawned in `DEFAULT_ATTACHMENT_SPAWNS`.

`ProductFulfillmentKind.Attachment` fulfillment path.

---

## Command Flow

```text
Radial Hnojit / Postřik
  → Game.fertilizeField / sprayField
  → Game.issueMachineCommand({ task: { kind: 'fertilize' | 'spray' } })
  → TractorJobSystem
  → FieldSystem.applyCropCare(fieldId, action)
```

Combines do not perform crop care.

---

## Sub-phases

| Phase | Scope |
|-------|-------|
| **15A** | Crop care model, balance, yield, save v11, HUD condition |
| **15B** | Fertilizer spreader product + Fertilize action |
| **15C** | Sprayer product + Spray action + visuals |

---

## Field History (Future — Documentation Only)

Reserved concept for per-field event log:

```typescript
// NOT implemented in Phase 15
interface FieldHistoryEntry {
  day: number
  kind: 'plow' | 'seed' | 'fertilize' | 'spray' | 'harvest'
  cropId?: string
  yield?: number
}
```

Use cases: season recap, Farm Manager (Phase 16D), Studio analytics. No save slice in Phase 15.

---

## Out of Scope

- GPS autowork, workers (Phase 16)
- Weather, seasons, pests/disease gameplay
- Consumable fertilizer/chemical purchasing (future Agronomy store)
- Soil maps, precision farming, pathfinding
- `cropCondition` in save

---

## Related

- [008_Phase13_FarmStore.md](./008_Phase13_FarmStore.md) — product / delivery architecture
- [010_Phase16_Automation.md](./010_Phase16_Automation.md) — deferred automation
