import type { MachineCapability } from '@/types/machine.ts'
import { MachineCapability as Cap } from '@/types/machine.ts'
import {
  AutomationTaskKind,
  CommandOwner,
  type AutomationSession,
  type AutomationTaskKind as AutomationTaskKindValue,
  type MachineAutomationSaveData,
  type MachineAutomationState,
} from '@/types/machine-automation.ts'
import type { MachineCommand, MachineId } from '@/types/machine.ts'
import { FieldRadialActionKind } from '@/types/machine.ts'
import type { WorkOrderId } from '@/types/work-order.ts'

const GPS_FIELD_TASKS: readonly AutomationTaskKindValue[] = [
  AutomationTaskKind.Plow,
  AutomationTaskKind.Seed,
  AutomationTaskKind.Fertilize,
  AutomationTaskKind.Spray,
  AutomationTaskKind.Harvest,
]

export function fieldRadialActionToAutomationTask(
  action: FieldRadialActionKind,
): AutomationTaskKindValue | null {
  switch (action) {
    case FieldRadialActionKind.Plow:
      return AutomationTaskKind.Plow
    case FieldRadialActionKind.Seed:
      return AutomationTaskKind.Seed
    case FieldRadialActionKind.Harvest:
      return AutomationTaskKind.Harvest
    case FieldRadialActionKind.Fertilize:
      return AutomationTaskKind.Fertilize
    case FieldRadialActionKind.Spray:
      return AutomationTaskKind.Spray
    default:
      return null
  }
}

export function buildFieldWorkCommand(
  fieldId: string,
  taskKind: AutomationTaskKindValue,
  cropId?: string,
): MachineCommand | null {
  switch (taskKind) {
    case AutomationTaskKind.Plow:
      return {
        destination: { kind: 'field', fieldId },
        task: { kind: 'plow' },
      }
    case AutomationTaskKind.Seed:
      if (!cropId) {
        return null
      }
      return {
        destination: { kind: 'field', fieldId },
        task: { kind: 'seed', cropId },
      }
    case AutomationTaskKind.Harvest:
      return {
        destination: { kind: 'field', fieldId },
        task: { kind: 'harvest' },
      }
    case AutomationTaskKind.Fertilize:
      return {
        destination: { kind: 'field', fieldId },
        task: { kind: 'fertilize' },
      }
    case AutomationTaskKind.Spray:
      return {
        destination: { kind: 'field', fieldId },
        task: { kind: 'spray' },
      }
    default:
      return null
  }
}

export function machineSupportsGpsFieldWork(
  capabilities: readonly MachineCapability[],
): boolean {
  return GPS_FIELD_TASKS.some((task) => {
    switch (task) {
      case AutomationTaskKind.Plow:
        return capabilities.includes(Cap.Plow)
      case AutomationTaskKind.Seed:
        return capabilities.includes(Cap.Seed)
      case AutomationTaskKind.Fertilize:
        return capabilities.includes(Cap.Fertilize)
      case AutomationTaskKind.Spray:
        return capabilities.includes(Cap.Spray)
      case AutomationTaskKind.Harvest:
        return capabilities.includes(Cap.Harvest)
      default:
        return false
    }
  })
}

export function formatAutomationTaskLabel(
  taskKind: AutomationTaskKindValue,
  cropName?: string,
): string {
  switch (taskKind) {
    case AutomationTaskKind.Plow:
      return 'Plow'
    case AutomationTaskKind.Seed:
      return cropName ? `Seed ${cropName}` : 'Seed'
    case AutomationTaskKind.Harvest:
      return 'Harvest'
    case AutomationTaskKind.Fertilize:
      return 'Fertilize'
    case AutomationTaskKind.Spray:
      return 'Spray'
    default:
      return taskKind
  }
}

export class MachineAutomationRegistry {
  private readonly states = new Map<MachineId, MachineAutomationState>()

  getCommandOwner(machineId: MachineId): CommandOwner {
    return this.states.get(machineId)?.commandOwner ?? CommandOwner.Player
  }

  getActiveWorkOrderId(machineId: MachineId): WorkOrderId | null {
    return this.states.get(machineId)?.activeWorkOrderId ?? null
  }

  /** @deprecated Phase 16C — use WorkOrderSystem */
  getSession(machineId: MachineId): AutomationSession | null {
    return this.states.get(machineId)?.session ?? null
  }

  setAutomation(
    machineId: MachineId,
    commandOwner: CommandOwner,
    activeWorkOrderId: WorkOrderId | null,
  ): void {
    this.states.set(machineId, {
      machineId,
      commandOwner,
      session: null,
      activeWorkOrderId,
    })
  }

  clearAutomation(machineId: MachineId): void {
    this.states.set(machineId, {
      machineId,
      commandOwner: CommandOwner.Player,
      session: null,
      activeWorkOrderId: null,
    })
  }

  clearAll(): void {
    this.states.clear()
  }

  toSaveData(): MachineAutomationSaveData[] {
    return [...this.states.values()]
      .filter(
        (state) =>
          state.commandOwner !== CommandOwner.Player ||
          state.activeWorkOrderId !== null,
      )
      .map((state) => ({
        machineId: state.machineId,
        commandOwner: state.commandOwner,
        activeWorkOrderId: state.activeWorkOrderId,
      }))
  }

  applySave(saved: MachineAutomationSaveData[] | undefined): void {
    this.states.clear()
    if (!saved) {
      return
    }
    for (const entry of saved) {
      if (!entry.machineId) {
        continue
      }
      const commandOwner = isCommandOwner(entry.commandOwner)
        ? entry.commandOwner
        : CommandOwner.Player
      this.states.set(entry.machineId, {
        machineId: entry.machineId,
        commandOwner,
        session: normalizeSession(entry.session),
        activeWorkOrderId: entry.activeWorkOrderId ?? null,
      })
    }
  }
}

function isCommandOwner(value: string): value is CommandOwner {
  return (
    value === CommandOwner.Player ||
    value === CommandOwner.Gps ||
    value === CommandOwner.Worker
  )
}

function normalizeSession(
  session: AutomationSession | null | undefined,
): AutomationSession | null {
  if (!session || !session.fieldId || !session.taskKind) {
    return null
  }
  if (!isCommandOwner(session.owner)) {
    return null
  }
  if (!GPS_FIELD_TASKS.includes(session.taskKind)) {
    return null
  }
  return {
    owner: session.owner,
    fieldId: session.fieldId,
    taskKind: session.taskKind,
    cropId: session.cropId,
    startedAtDay: session.startedAtDay,
    workOrderId: session.workOrderId,
  }
}
