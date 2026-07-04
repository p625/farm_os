# Phase 16B — GPS Autowork

## Status

| Field | Value |
|-------|-------|
| **Status** | Approved — implemented |
| **Prerequisite** | Phase 16A Fleet Overview |
| **Architecture** | Freeze v1.0 unchanged |

## Purpose

GPS Autowork is the first automation layer. GPS is **not** an AI worker — it is another issuer of `MachineCommand` through `Game.issueMachineCommand()`.

```text
Player / GPS / Worker (future)
        │
        ▼
Game.issueMachineCommand(machineId, command, { commandOwner })
        │
        ▼
MachineRegistry → MachineController
```

## CommandOwner

Describes **who issued** the active command, not how the machine behaves.

```typescript
type CommandOwner = 'player' | 'gps' | 'worker'  // worker reserved
```

Reserved for Phase 16C+: `worker`. Manager Mode assigns work only; it never executes commands directly.

## AutomationSession

Generalized automation metadata (GPS in 16B; Workers reuse later).

```typescript
interface AutomationSession {
  owner: CommandOwner
  fieldId: string
  taskKind: 'plow' | 'seed' | 'fertilize' | 'spray' | 'harvest'
  cropId?: string
  startedAtDay: number
}
```

`MachineCommand` shape is **unchanged**. Session is Game-owned, persisted in save v12 `machineAutomation`.

## Supported tasks (16B)

| Task | Machines |
|------|----------|
| Plow, Seed, Fertilize, Spray | Tractors with attachments |
| Harvest | Combines with compatible header |

**Out of scope:** logistics, trailer driving, silo unload, store interaction.

## Execution model

**Approach A** — reuse existing move → work timer → field apply → idle. No lane traversal. No teleport.

GPS issues **one** `MachineCommand` per job. Controllers execute unchanged.

## Field radial (task-first)

```text
Plow → Perform Manually | Automatic (GPS)
Seed → Perform Manually | Automatic (GPS) → crop picker
```

Workers later add a third mode option without restructuring the menu.

## Completion

No `GPS Finished` machine status. Controller returns to `idle`. Completion is logged in **Event Log** only.

## Interruption

`cancelActiveCommand()` on controllers is the generic interrupt API for GPS, Workers, and future Manager-assigned work.

Player manual commands cancel active work first, then issue the new command with `commandOwner: 'player'`.

## Future pause (not implemented)

If a combine cannot continue (e.g. full grain bin), architecture allows a future **Pause** state on automation sessions. Phase 16B does not implement pause gameplay.

## Save v12

`machineAutomation[]`: per-machine `commandOwner` + `session`. Mid-GPS resume uses existing machine slice + automation slice together.

## Sub-phases (corrected)

| Sub-phase | Feature |
|-----------|---------|
| 16A | Fleet Overview |
| 16B | GPS Autowork |
| 16C | Farm Workers |
| 16D | Farm Manager |
