export const InteractionPointType = {
  Silo: 'silo',
  Shop: 'shop',
  Fuel: 'fuel',
  Workshop: 'workshop',
  Production: 'production',
} as const

export type InteractionPointType =
  (typeof InteractionPointType)[keyof typeof InteractionPointType]

export const InteractionPointId = {
  SiloEntry: 'silo_entry',
} as const

export type InteractionPointId =
  (typeof InteractionPointId)[keyof typeof InteractionPointId]

export const InteractionRadialActionKind = {
  UnloadToSilo: 'unload_to_silo',
  Cancel: 'cancel',
} as const

export type InteractionRadialActionKind =
  (typeof InteractionRadialActionKind)[keyof typeof InteractionRadialActionKind]

export interface InteractionContextMenuSnapshot {
  interactionPointId: InteractionPointId
  interactionType: InteractionPointType
  label: string
  screenX: number
  screenY: number
  actions: readonly InteractionRadialActionKind[]
}
