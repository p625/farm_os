export const MachineId = {
  Tractor1: 'tractor_1',
} as const

export type MachineId = (typeof MachineId)[keyof typeof MachineId]

export const MachineCapability = {
  Move: 'move',
  Plow: 'plow',
  Seed: 'seed',
  Harvest: 'harvest',
} as const

export type MachineCapability =
  (typeof MachineCapability)[keyof typeof MachineCapability]

export type CommandDestination =
  | { kind: 'world'; x: number; z: number }
  | { kind: 'field'; fieldId: string }
  | { kind: 'farm'; zoneId: string }
  | { kind: 'building'; buildingId: string }

export type CommandTask =
  | { kind: 'none' }
  | { kind: 'plow' }
  | { kind: 'seed'; cropId: string }
  | { kind: 'harvest' }
  | { kind: 'unload'; targetBuildingId?: string }

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
  Cancel: 'cancel',
} as const

export type FieldRadialActionKind =
  (typeof FieldRadialActionKind)[keyof typeof FieldRadialActionKind]

export interface FieldContextMenuSnapshot {
  fieldId: string
  screenX: number
  screenY: number
  actions: readonly FieldRadialActionKind[]
}
