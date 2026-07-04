# Phase 16 — Automation (Approved, Not Implemented)

## Status

| Field | Value |
|-------|-------|
| **Status** | Partially implemented — 16A Fleet, 16B GPS |
| **Implementation** | 16A complete; 16B GPS Autowork |

## Execution path

```text
Player / GPS module / Farm Worker (future)
        │
        ▼
Game.issueMachineCommand(machineId, command, { commandOwner })
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

## CommandOwner

```typescript
type CommandOwner = 'player' | 'gps' | 'worker'  // worker reserved
```

Describes who issued the command. GPS Autowork uses the same `MachineCommand` path as manual play.

## AutomationSession

Generalized automation metadata. Phase 16B implements GPS only.

```typescript
interface AutomationSession {
  owner: CommandOwner
  fieldId: string
  taskKind: string
  cropId?: string
  startedAtDay: number
}
```

## Fleet snapshot

Read-only presentation aggregate — see Phase 16A `FleetMachineSnapshot` with `commandOwner`.

## Worker assignment (future)

```typescript
interface WorkerAssignment {
  workerId: string
  machineId: string
  fieldId?: string
  taskKind?: string
}
```

Worker tick resolves assignment → `Game.issueMachineCommand(..., { commandOwner: 'worker' })`.

## Phase 16 sub-phases

| Sub-phase | Feature |
|-----------|---------|
| 16A | Fleet Overview |
| 16B | GPS Autowork |
| 16C | Farm Workers |
| 16D | Farm Manager |

See [012_Phase16B_GpsAutowork.md](./012_Phase16B_GpsAutowork.md) for GPS specification.
