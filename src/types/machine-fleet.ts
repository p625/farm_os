import type { CargoContainerSnapshot } from '@/types/cargo.ts'
import type { GrainBinSnapshot } from '@/types/grain-bin.ts'
import type { MachineTemplateId } from '@/types/machine-template.ts'
import type { MachineId } from '@/types/machine.ts'
import { TractorState, type TractorJobSnapshot, type TractorSnapshot } from '@/types/tractor.ts'

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

/**
 * Reserved for Phase 16B — manual vs GPS/worker control. No effect in 16A.
 */
export type MachineFleetControlMode = 'manual'

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
  grainBin: GrainBinSnapshot | null
  trailerFill: CargoContainerSnapshot | null
  selected: boolean
  /** Reserved — Phase 16B worker assignment. */
  controlMode: MachineFleetControlMode
  /** Reserved — Phase 16B worker display name. */
  workerName: null
  /** Reserved — Phase 16B GPS availability. */
  gpsAvailable: false
  /** Reserved — future fuel system. Display only in 16A. */
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
): string {
  if (status === MachineFleetStatus.Working && activeJob?.type === 'harvest') {
    return 'Harvesting'
  }
  return formatMachineFleetStatus(status)
}

export function getFleetReadyStatusLabel(status: MachineFleetStatus): string {
  if (status === MachineFleetStatus.Idle) {
    return 'Ready'
  }
  return formatMachineFleetStatus(status)
}
