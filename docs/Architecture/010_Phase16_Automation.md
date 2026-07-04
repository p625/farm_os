# Phase 16 — Automation (Approved, Not Implemented)

## Status

| Field | Value |
|-------|-------|
| **Status** | Architecture approved — **deferred** |
| **Implementation** | After Phase 15 (Crop Care) |

## Purpose

Document the approved automation stack before implementation. **No types, save fields, or UI exist in code until Phase 16.**

## Execution path

```text
Player / GPS module / Farm Worker
        │
        ▼
Game.issueMachineCommand(command, { controlMode, issuedBy })
        │
        ▼
MachineRegistry (thin)
        │
        ▼
MachineController (unchanged — TractorJobSystem, CombineJobSystem, …)
```

**Rules:**

- No parallel AI simulation
- No duplicate controller or job system
- Workers never execute field logic directly — they issue commands only

## ControlMode (future)

```typescript
type ControlMode = 'manual' | 'gps_autowork'
```

GPS Autowork uses the same `MachineCommand` path as manual play.

## issuedBy metadata (future)

```typescript
type CommandIssuer = 'player' | 'worker' | 'gps_module'
```

Attached to command context for logging, fleet UI, and debugging.

## Fleet snapshot (future)

Read-only presentation aggregate:

```typescript
interface MachineFleetEntrySnapshot {
  machineId: string
  templateId: string
  controlMode: ControlMode
  position: { x: number; z: number }
  state: string
  activeJobLabel: string | null
}
```

## Worker assignment (future)

```typescript
interface WorkerAssignment {
  workerId: string
  machineId: string
  fieldId?: string
  taskKind?: string
}
```

Worker tick resolves assignment → `Game.issueMachineCommand(...)`.

## Phase 16 sub-phases

| Sub-phase | Feature |
|-----------|---------|
| 16A | GPS Autowork |
| 16B | Fleet Overview |
| 16C | Farm Workers |
| 16D | Farm Manager |

## Prerequisite

Phase 14 World Expansion must create workload (distance, field count, area-scaled work) so automation solves a real player problem.
