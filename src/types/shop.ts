export const ShopUpgradeId = {
  FasterTractor: 'faster_tractor',
  LargerTrailer: 'larger_trailer',
  BetterSeeds: 'better_seeds',
  FieldWorkEfficiency: 'field_work_efficiency',
} as const

export type ShopUpgradeId =
  (typeof ShopUpgradeId)[keyof typeof ShopUpgradeId]

export const UpgradeEffectType = {
  TractorSpeed: 'tractor_speed',
  WorkDuration: 'work_duration',
  YieldBonus: 'yield_bonus',
  TrailerVisual: 'trailer_visual',
} as const

export type UpgradeEffectType =
  (typeof UpgradeEffectType)[keyof typeof UpgradeEffectType]

export interface ShopUpgradeDefinition {
  id: ShopUpgradeId
  name: string
  description: string
  maxLevel: number
  basePrice: number
  pricePerLevel: number
  effectType: UpgradeEffectType
  effectPerLevel: number
}

export interface ShopUpgradeSnapshot {
  id: ShopUpgradeId
  name: string
  description: string
  level: number
  maxLevel: number
  nextPrice: number | null
  canAfford: boolean
  isMaxed: boolean
  effectSummary: string
}
