export const MachineId = {
  Tractor1: 'tractor_1',
  GrainCombine1: 'grain_combine_1',
  CornCombine1: 'corn_combine_1',
} as const

export type MachineId = string

export type KnownMachineId = (typeof MachineId)[keyof typeof MachineId]

export const MachineCapability = {
  Move: 'move',
  Tow: 'tow',
  Plow: 'plow',
  Seed: 'seed',
  Harvest: 'harvest',
  Fertilize: 'fertilize',
  Spray: 'spray',
} as const

export type MachineCapability =
  (typeof MachineCapability)[keyof typeof MachineCapability]

export type CommandDestination =
  | { kind: 'world'; x: number; z: number }
  | { kind: 'field'; fieldId: string }
  | { kind: 'farm'; zoneId: string }
  | { kind: 'building'; buildingId: string }
  | { kind: 'machine'; machineId: MachineId }

export type CommandTask =
  | { kind: 'none' }
  | { kind: 'plow' }
  | { kind: 'seed'; cropId: string }
  | { kind: 'harvest' }
  | { kind: 'fertilize' }
  | { kind: 'spray' }
  | { kind: 'load_from_combine'; sourceMachineId: MachineId }
  | { kind: 'unload_to_silo'; interactionPointId: string }

export interface MachineCommand {
  destination: CommandDestination
  task: CommandTask
}

export const SelectedEntityKind = {
  None: 'none',
  Machine: 'machine',
  Field: 'field',
  Building: 'building',
} as const

export type SelectedEntityKind =
  (typeof SelectedEntityKind)[keyof typeof SelectedEntityKind]

export interface SelectedEntitySnapshot {
  kind: SelectedEntityKind
  machineId: MachineId | null
  fieldId: string | null
  buildingId: string | null
}

export const EMPTY_SELECTED_ENTITY: SelectedEntitySnapshot = {
  kind: SelectedEntityKind.None,
  machineId: null,
  fieldId: null,
  buildingId: null,
}

export const FieldRadialActionKind = {
  Plow: 'plow',
  Seed: 'seed',
  Harvest: 'harvest',
  Fertilize: 'fertilize',
  Spray: 'spray',
  Cancel: 'cancel',
} as const

export type FieldRadialActionKind =
  (typeof FieldRadialActionKind)[keyof typeof FieldRadialActionKind]

export const MachineRadialActionKind = {
  LoadFromCombine: 'load_from_combine',
  Cancel: 'cancel',
} as const

export type MachineRadialActionKind =
  (typeof MachineRadialActionKind)[keyof typeof MachineRadialActionKind]

export interface FieldContextMenuSnapshot {
  fieldId: string
  screenX: number
  screenY: number
  actions: readonly FieldRadialActionKind[]
}

export interface MachineContextMenuSnapshot {
  targetMachineId: MachineId
  screenX: number
  screenY: number
  actions: readonly MachineRadialActionKind[]
  loadActionLabel: string
}
