import type { CargoContainerSnapshot } from '@/types/cargo.ts'
import type { GrainBinSnapshot } from '@/types/grain-bin.ts'
import {
  CommandOwner,
} from '@/types/machine-automation.ts'
import type { MachineTemplateId } from '@/types/machine-template.ts'
import type { MachineId } from '@/types/machine.ts'
import type { MachineCapability } from '@/types/machine.ts'
import { TractorState, type TractorJobSnapshot, type TractorSnapshot } from '@/types/tractor.ts'
import { machineSupportsGpsFieldWork } from '@systems/MachineAutomationRegistry.ts'

export const MachineFleetStatus = {
  Idle: 'idle',
  Moving: 'moving',
  Working: 'working',
  Loading: 'loading',
  Unloading: 'unloading',
  Waiting: 'waiting',
  Blocked: 'blocked',
  Parked: 'parked',
} as const

export type MachineFleetStatus =
  (typeof MachineFleetStatus)[keyof typeof MachineFleetStatus]

export interface FleetMachineSnapshot {
  machineId: MachineId
  displayName: string
  templateId: MachineTemplateId
  templateName: string
  status: MachineFleetStatus
  activeJob: TractorJobSnapshot | null
  attachmentNames: readonly string[]
  fieldName: string | null
  destinationLabel: string | null
  logisticsLabel: string | null
  workProgress: number
  workRemainingSeconds: number | null
  grainBin: GrainBinSnapshot | null
  trailerFill: CargoContainerSnapshot | null
  selected: boolean
  commandOwner: CommandOwner
  gpsAvailable: boolean
  /** Reserved — Phase 16C worker display name. */
  workerName: null
  /** Reserved — future fuel system. Display only. */
  fuelLabel: '—'
}

export function deriveMachineFleetStatus(
  operation: TractorSnapshot,
): MachineFleetStatus {
  const { state, activeLogisticsLabel } = operation

  if (state === TractorState.Moving) {
    return MachineFleetStatus.Moving
  }

  if (state === TractorState.Working) {
    if (activeLogisticsLabel === 'Nakládání') {
      return MachineFleetStatus.Loading
    }
    if (activeLogisticsLabel === 'Vykládání') {
      return MachineFleetStatus.Unloading
    }
    return MachineFleetStatus.Working
  }

  return MachineFleetStatus.Idle
}

export function formatMachineFleetStatus(status: MachineFleetStatus): string {
  switch (status) {
    case MachineFleetStatus.Idle:
      return 'Idle'
    case MachineFleetStatus.Moving:
      return 'Moving'
    case MachineFleetStatus.Working:
      return 'Working'
    case MachineFleetStatus.Loading:
      return 'Loading'
    case MachineFleetStatus.Unloading:
      return 'Unloading'
    case MachineFleetStatus.Waiting:
      return 'Waiting'
    case MachineFleetStatus.Blocked:
      return 'Blocked'
    case MachineFleetStatus.Parked:
      return 'Parked'
    default:
      return status
  }
}

export function getFleetHeadlineLabel(
  status: MachineFleetStatus,
  activeJob: TractorJobSnapshot | null,
  commandOwner: CommandOwner,
): string {
  if (commandOwner === CommandOwner.Gps) {
    if (status === MachineFleetStatus.Moving) {
      return 'GPS Moving'
    }
    if (status === MachineFleetStatus.Working) {
      if (activeJob?.type === 'harvest') {
        return 'GPS Harvesting'
      }
      return 'GPS Working'
    }
  }

  if (status === MachineFleetStatus.Working && activeJob?.type === 'harvest') {
    return 'Harvesting'
  }
  return formatMachineFleetStatus(status)
}

export function getFleetReadyStatusLabel(
  status: MachineFleetStatus,
  commandOwner: CommandOwner,
): string {
  if (status === MachineFleetStatus.Idle && commandOwner === CommandOwner.Player) {
    return 'Ready'
  }
  return formatMachineFleetStatus(status)
}

export function isGpsAutomationActive(
  commandOwner: CommandOwner,
  status: MachineFleetStatus,
): boolean {
  return (
    commandOwner === CommandOwner.Gps &&
    (status === MachineFleetStatus.Moving ||
      status === MachineFleetStatus.Working)
  )
}

export function resolveGpsAvailable(
  capabilities: readonly MachineCapability[],
): boolean {
  return machineSupportsGpsFieldWork(capabilities)
}
