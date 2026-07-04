# Phase 16C–16F — Work Orders & Farm Workers

## Status

| Field | Value |
|-------|-------|
| **Status** | Approved — **16C implemented**; 16D–16F deferred |
| **Prerequisite** | Phase 16B GPS Autowork |
| **Architecture** | Freeze v1.0 unchanged |

## Purpose

Work Orders describe **farm work** (what + where). Machine and worker assignment are **separate concerns**. GPS and Workers are **execution modes** that advance orders through the existing command gateway.

```text
Work Order (farm work)
        │
        ├─ assignment: machineId (optional, reassignable in future)
        ├─ execution: commandOwner (player | gps | worker)
        └─ workerId (display only — separate from order identity)

Player / GPS / Worker
        │
        ▼
Game.issueMachineCommand()  →  advanceWorkOrder() on idle
        │
        ▼
MachineRegistry → MachineController
```

## Work Order independence

A `WorkOrder` does **not** own a machine permanently. `assignedMachineId` is runtime assignment. Phase 16 assigns exactly one machine per active order; future phases may reassign without recreating the order.

## Execution strategy

```typescript
type WorkOrderExecutionStrategy =
  | 'catalog_order'   // implemented — FIELD_CATALOG order
  | 'nearest_first'   // reserved
  | 'custom'          // reserved
```

## Field scope

| Scope | Phase | Entry point |
|-------|-------|-------------|
| `single` | 16C | Field radial — **This field (GPS)** |
| `fields` | 16C | Field radial — **Selected fields (GPS)** |
| `block` | 16D | Block radial — entire block |
| `eligible` | 16F | Work Orders panel — all eligible fields |
| `area` | **Reserved** — documentation only |

HUD field list supports shift+click multi-select for **Selected fields (GPS)**.

## displayName

Human-readable label reused in HUD, Fleet, and Event Log.

Examples: `Plow Block B`, `Harvest Wheat`, `Spray Growing Fields`.

## Snapshots

Expose `remainingFieldCount`, `completedFieldCount`, and **`remainingArea`** (sum of catalog areas for pending + current leg).

## Worker assignment

`workerId` on a work order is **convenience storage** for 16E. Conceptually separate: workers are assigned to orders, not embedded in machine simulation.

## Event log lifecycle

| Event | When |
|-------|------|
| Created | Order created, queue resolved |
| Started | First leg issued to assigned machine |
| Field Completed | One field leg finished |
| Completed | Queue empty |
| Cancelled | Player/system cancel |

## Orchestration hook

```typescript
// Reserved — future global scheduling (priorities, manager mode).
Game.evaluateWorkOrders(): void
```

Phase 16C advances orders per machine on controller `onChange` via `advanceWorkOrder(machineId)`.

## Sub-phases

| Phase | Deliverable |
|-------|-------------|
| **16C** | Work order types, `WorkOrderSystem`, GPS refactor, save v13, HUD/Fleet summary |
| **16D** | Block + eligible scope UI, block radial |
| **16E** | `WorkerRegistry`, worker picker, `commandOwner: worker` |
| **16F** | Work Orders panel, ETA, notifications |

## Pause (reserved)

`WorkOrderStatus.paused` + `AutomationPauseReason` for full grain bin etc. Not implemented in 16C.
