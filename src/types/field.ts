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

import type { FieldOwnership } from '@/types/ownership.ts'

export interface FieldData {
  id: string
  name: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
  daysGrown: number
}

export interface FieldSnapshot {
  id: string
  name: string
  state: FieldLifecycleState
  growthPercent: number
  cropId: string | null
  cropName: string | null
  daysGrown: number
  ownership: FieldOwnership
  purchasePrice: number
  leasePrice: number
  area: number
  fertility: number
  usable: boolean
}
