import { getInteractionPointDefinition } from '@/config/interaction-point-catalog.ts'
import { FIELD_POSITIONS, JOB_WORK_DURATION } from '@/config/farm-layout.ts'
import type { LogisticsSystem } from './LogisticsSystem.ts'
import type { MachineRegistry } from './MachineRegistry.ts'
import {
  MachineCapability,
  type CommandTask,
  type MachineCommand,
  type MachineId,
} from '@/types/machine.ts'
import { InteractionPointId } from '@/types/interaction-point.ts'

interface Vec3 {
  x: number
  y: number
  z: number
}

export function isLogisticsTask(task: CommandTask): boolean {
  return task.kind === 'load_from_combine' || task.kind === 'unload_to_silo'
}

export function validateLogisticsCommand(
  machineId: MachineId,
  command: MachineCommand,
  logistics: LogisticsSystem | null,
): boolean {
  if (!logistics) {
    return false
  }

  switch (command.task.kind) {
    case 'load_from_combine': {
      if (command.destination.kind !== 'machine') {
        return false
      }
      if (command.destination.machineId !== command.task.sourceMachineId) {
        return false
      }
      return logistics.canLoadFromCombine(
        command.task.sourceMachineId,
        machineId,
      )
    }
    case 'unload_to_silo': {
      if (command.destination.kind !== 'building') {
        return false
      }
      if (command.task.interactionPointId !== InteractionPointId.SiloEntry) {
        return false
      }
      if (command.destination.buildingId !== InteractionPointId.SiloEntry) {
        return false
      }
      return logistics.canUnloadToSilo(machineId)
    }
    default:
      return false
  }
}

export function resolveLogisticsMoveTarget(
  command: MachineCommand,
  registry: MachineRegistry | null,
  fallback: Vec3,
): Vec3 {
  switch (command.destination.kind) {
    case 'machine': {
      const controller = registry?.get(command.destination.machineId)
      if (controller) {
        const position = controller.getPosition()
        return { x: position.x, y: position.y, z: position.z }
      }
      return { ...fallback }
    }
    case 'building': {
      const point = getInteractionPointDefinition(
        command.destination.buildingId as InteractionPointId,
      )
      if (point) {
        return { x: point.position.x, y: point.position.y, z: point.position.z }
      }
      return { ...fallback }
    }
    case 'field':
      return FIELD_POSITIONS[command.destination.fieldId] ?? { ...fallback }
    case 'world':
      return { x: command.destination.x, y: 0, z: command.destination.z }
    default:
      return { ...fallback }
  }
}

export function getLogisticsWorkDuration(task: CommandTask): number {
  if (task.kind === 'load_from_combine') {
    return JOB_WORK_DURATION.load_from_combine ?? 1
  }
  if (task.kind === 'unload_to_silo') {
    return JOB_WORK_DURATION.unload_to_silo ?? 1
  }
  return 1
}

export function getLogisticsRequiredCapability(
  task: CommandTask,
): MachineCapability | null {
  switch (task.kind) {
    case 'load_from_combine':
    case 'unload_to_silo':
      return MachineCapability.Move
    default:
      return null
  }
}

export function applyLogisticsWork(
  machineId: MachineId,
  command: MachineCommand,
  logistics: LogisticsSystem | null,
): boolean {
  if (!logistics || !command) {
    return false
  }

  switch (command.task.kind) {
    case 'load_from_combine':
      return logistics.loadFromCombine(command.task.sourceMachineId, machineId)
        .success
    case 'unload_to_silo':
      return logistics.unloadTrailerToSilo(
        machineId,
        command.task.interactionPointId as InteractionPointId,
      ).success
    default:
      return false
  }
}
