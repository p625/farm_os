# Phase 16D — Block Work Orders

## Status

| Field | Value |
|-------|-------|
| **Status** | Approved — implemented |
| **Prerequisite** | Phase 16C Work Orders |
| **Architecture** | Freeze v1.0 unchanged |

## Purpose

Block scope is the first **regional** work-order scope. The player assigns work to an entire field block from the field radial menu with a single GPS action.

## Player flow

```text
Right-click field in Block B → Plow
  → Perform Manually
  → This field (GPS)
  → Selected fields (GPS)
  → Entire Block (GPS)
```

The right-clicked field determines the block via `field-catalog.blockId`.

## Scope resolution

```text
Field B-03 → blockId B → WorkOrderScope.block
  → all catalog fields in Block B
  → filter by ownership + machine/task eligibility
  → catalog_order queue
```

`eligible` scope is **not** exposed from the field radial (reserved for Work Orders panel in 16F).

## Display names

Auto-generated examples: `Plow Block A`, `Seed Block C`, `Harvest Block B`.

## Snapshots

`WorkOrderSnapshot` includes `blockId` when scope is `block`. HUD and Fleet show block, remaining fields, remaining area, and current field.

## Event log

| Event | Block order example |
|-------|-------------------|
| Created | Work order created: Plow Block B |
| Started | GPS started Plow Block B |
| Field completed | Completed Domácí pole |
| Completed | Completed Block B |
| Cancelled | Cancelled Block B |

## Save

`scope: { kind: 'block', blockId }` persisted in existing `workOrders[]` (save v13). No save version change.

## Out of scope

Workers, Manager mode, Work Orders panel, area scope, eligible-from-radial, priorities, multi-machine orchestration.
