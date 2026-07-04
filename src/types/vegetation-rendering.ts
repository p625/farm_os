export type VegetationLayerType =
  | 'short_grass'
  | 'meadow_grass'
  | 'field_margin'
  | 'roadside_grass'
  | 'shrub'
  | 'hedgerow'
  | 'forest_edge'
  | 'tree_line'
  | 'scattered_tree'

export type VegetationLodBand = 'near' | 'mid' | 'far' | 'hidden'

export type VegetationDensityPreset = 'low' | 'medium' | 'high'

export interface VegetationColorVariation {
  hueShift: number
  saturationShift: number
  brightnessShift: number
}

export interface VegetationHeightVariation {
  min: number
  max: number
}

export interface VegetationPlacementRuleRef {
  id: string
  weight: number
}

export interface VegetationLodProfile {
  nearDistance: number
  midDistance: number
  farDistance: number
  cullDistance: number
  midDensityMultiplier: number
  farDensityMultiplier: number
}

export interface VegetationWindProfile {
  enabled: boolean
  strength: number
  frequency: number
  swayAxis: 'x' | 'z'
}

export interface VegetationMaterialProfile {
  placeholderAssetId: string
  receiveShadows: boolean
  castShadows: boolean
}

export interface VegetationLayerDefinition {
  id: VegetationLayerType
  displayName: string
  type: VegetationLayerType
  enabled: boolean
  density: number
  minScale: number
  maxScale: number
  scatterSpacing: number
  colorVariation: VegetationColorVariation
  heightVariation: VegetationHeightVariation
  placementRules: readonly VegetationPlacementRuleRef[]
  lod: VegetationLodProfile
  windProfile: VegetationWindProfile
  materialProfile: VegetationMaterialProfile
  debugColor: readonly [number, number, number]
  maxInstances: number
}

export interface VegetationInstanceTransform {
  x: number
  y: number
  z: number
  rotationY: number
  uniformScale: number
  colorTint: number
  colorRgb?: readonly [number, number, number]
  assetId?: string
  variantId?: string
  biomeId?: string
}

export interface VegetationPlacementContext {
  worldMinX: number
  worldMaxX: number
  worldMinZ: number
  worldMaxZ: number
  fieldRects: readonly VegetationFieldRect[]
  roadRects: readonly VegetationRoadRect[]
  forestRects: readonly VegetationForestRect[]
  mapTreePoints: readonly VegetationMapPoint[]
}

export interface VegetationFieldRect {
  id: string
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  isArable: boolean
}

export interface VegetationRoadRect {
  x: number
  z: number
  halfWidth: number
  halfDepth: number
}

export interface VegetationForestRect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface VegetationMapPoint {
  x: number
  y: number
  z: number
  rotationY: number
  layerType: VegetationLayerType
  scale: number
}

export interface VegetationLayerStats {
  id: VegetationLayerType
  instanceCount: number
  enabled: boolean
}

export interface VegetationBuildReport {
  densityPreset: VegetationDensityPreset
  totalInstances: number
  layers: readonly VegetationLayerStats[]
}
