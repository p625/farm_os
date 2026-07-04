import type { MachineId } from '@/types/machine.ts'

export const CommandOwner = {
  Player: 'player',
  Gps: 'gps',
  /** Reserved — Phase 16C workers. */
  Worker: 'worker',
} as const

export type CommandOwner = (typeof CommandOwner)[keyof typeof CommandOwner]

export const AutomationTaskKind = {
  Plow: 'plow',
  Seed: 'seed',
  Fertilize: 'fertilize',
  Spray: 'spray',
  Harvest: 'harvest',
} as const

export type AutomationTaskKind =
  (typeof AutomationTaskKind)[keyof typeof AutomationTaskKind]

export interface AutomationSession {
  owner: CommandOwner
  fieldId: string
  taskKind: AutomationTaskKind
  cropId?: string
  startedAtDay: number
}

/**
 * Reserved — future pause when work cannot continue (e.g. full grain bin).
 * Not implemented in Phase 16B.
 */
export const AutomationPauseReason = {
  GrainBinFull: 'grain_bin_full',
} as const

export type AutomationPauseReason =
  (typeof AutomationPauseReason)[keyof typeof AutomationPauseReason]

export interface MachineAutomationState {
  machineId: MachineId
  commandOwner: CommandOwner
  session: AutomationSession | null
}

export interface MachineAutomationSaveData {
  machineId: string
  commandOwner: CommandOwner
  session: AutomationSession | null
}

export interface IssueMachineCommandContext {
  commandOwner?: CommandOwner
}
