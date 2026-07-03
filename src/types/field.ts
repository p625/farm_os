export const FieldLifecycleState = {
  Grass: 'grass',
  Plowed: 'plowed',
  Seeded: 'seeded',
  Growing: 'growing',
  Harvestable: 'harvestable',
  Harvested: 'harvested',
} as const

export type FieldLifecycleState =
  (typeof FieldLifecycleState)[keyof typeof FieldLifecycleState]

export interface FieldData {
  id: string
  name: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
}

export interface FieldSnapshot {
  id: string
  name: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
}
