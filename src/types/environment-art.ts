import type { VegetationLayerType } from '@/types/vegetation-rendering.ts'

export type EnvironmentBiomeId =
  | 'meadow'
  | 'field'
  | 'forest'
  | 'forest_edge'
  | 'roadside'
  | 'farm_yard'
  | 'wetland'
  | 'village'

export type EnvironmentDensityProfileId = 'sparse' | 'medium' | 'dense' | 'ultra'

export type EnvironmentAssetCategory =
  | 'Grass'
  | 'Flower'
  | 'Bush'
  | 'Tree'
  | 'DeadTree'
  | 'Rock'
  | 'Log'
  | 'Reed'
  | 'GroundClutter'

export type EnvironmentShadowMode = 'none' | 'receive' | 'cast' | 'cast_and_receive'

export interface EnvironmentColorVariance {
  hue: number
  brightness: number
  saturation: number
}

export interface EnvironmentColorVariationProfile {
  id: string
  displayName: string
  variance: EnvironmentColorVariance
}

export interface EnvironmentDensityProfile {
  id: EnvironmentDensityProfileId
  displayName: string
  multiplier: number
  clusterMultiplier: number
}

export interface EnvironmentAssetVariant {
  id: string
  displayName: string
  weight: number
  scaleMultiplier: number
  colorTintOffset: readonly [number, number, number]
}

export interface EnvironmentAssetLodProfile {
  nearDistance: number
  midDistance: number
  farDistance: number
  cullDistance: number
}

export interface EnvironmentAssetWindProfile {
  enabled: boolean
  strength: number
  frequency: number
}

export interface EnvironmentAssetDefinition {
  id: string
  category: EnvironmentAssetCategory
  displayName: string
  meshSource: string | null
  placeholder: string
  minScale: number
  maxScale: number
  rotationVariance: number
  colorVariation: EnvironmentColorVariance
  windProfile: EnvironmentAssetWindProfile
  lodProfile: EnvironmentAssetLodProfile
  shadowMode: EnvironmentShadowMode
  collision: boolean
  enabled: boolean
  vegetationLayer: VegetationLayerType
  variants: readonly EnvironmentAssetVariant[]
}

export interface EnvironmentClusterProfile {
  id: string
  displayName: string
  minInstances: number
  maxInstances: number
  radius: number
  gapProbability: number
  spacing: number
}

export interface EnvironmentBiomeLayerWeight {
  assetId: string
  weight: number
}

export interface EnvironmentBiomeDefinition {
  id: EnvironmentBiomeId
  displayName: string
  enabled: boolean
  priority: number
  vegetationLayers: readonly EnvironmentBiomeLayerWeight[]
  densityProfile: EnvironmentDensityProfileId
  colorVariation: string
  clusterProfile: string
  allowedAssets: readonly string[]
}

export interface EnvironmentEcologyEffect {
  id: string
  sourceAssetCategory: EnvironmentAssetCategory
  radius: number
  targetAssetCategories: readonly EnvironmentAssetCategory[]
  densityMultiplier: number
  description: string
}

export interface EnvironmentEcologyRule {
  id: string
  displayName: string
  biomeId?: EnvironmentBiomeId
  effects: readonly EnvironmentEcologyEffect[]
}

export interface EnvironmentPlacementInstance {
  x: number
  y: number
  z: number
  rotationY: number
  uniformScale: number
  colorTint: number
  colorRgb: readonly [number, number, number]
  assetId: string
  variantId: string
  biomeId: EnvironmentBiomeId
  clusterId: string | null
  vegetationLayer: VegetationLayerType
}

export interface EnvironmentPlacementStats {
  activeBiomes: readonly EnvironmentBiomeId[]
  assetCounts: Readonly<Record<string, number>>
  clusterCount: number
  instanceCount: number
  colorVariation: {
    hueMin: number
    hueMax: number
    brightnessMin: number
    brightnessMax: number
    saturationMin: number
    saturationMax: number
  }
}

export interface EnvironmentPlacementResult {
  instancesByLayer: Readonly<Record<VegetationLayerType, readonly EnvironmentPlacementInstance[]>>
  stats: EnvironmentPlacementStats
  densityProfile: EnvironmentDensityProfileId
}
