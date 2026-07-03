import type { FieldLifecycleState } from '@/types/field.ts'

export const GrowthCurve = {
  Linear: 'linear',
  Early: 'early',
  Late: 'late',
} as const

export type GrowthCurve = (typeof GrowthCurve)[keyof typeof GrowthCurve]

export interface CropColorPalette {
  seeded: { r: number; g: number; b: number }
  growing: { r: number; g: number; b: number }
  harvestable: { r: number; g: number; b: number }
}

export interface CropDefinition {
  id: string
  name: string
  seedCost: number
  growingDays: number
  yield: number
  sellingPrice: number
  requiredFieldState: FieldLifecycleState
  growthCurve: GrowthCurve
  palette: CropColorPalette
  displayColor: string
}

export interface CropSnapshot {
  id: string
  name: string
  seedCost: number
  growingDays: number
  yield: number
  sellingPrice: number
  profitEstimate: number
  harvestValue: number
  displayColor: string
}
