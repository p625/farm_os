/** FarmOS terrain rendering pipeline — shared types (MS1A / MS1B). */

export const TERRAIN_LAYER_IDS = [
  'baseTerrain',
  'terrainMaterials',
  'macroVariation',
  'normalMaps',
  'detailMaps',
  'decals',
  'vegetationMasks',
  'weatherMasks',
  'snowMasks',
  'runtimeOverlays',
] as const

export type TerrainLayerId = (typeof TERRAIN_LAYER_IDS)[number]

export type TerrainSplatChannel = 'r' | 'g' | 'b' | 'a'

export interface TerrainSplatChannelRef {
  mapIndex: number
  channel: TerrainSplatChannel
}

export interface TerrainMaterialTexturePaths {
  albedo: string
  normal: string
  roughness: string
  ambientOcclusion: string
  height: string
  macroTexture: string
  detail?: string
}

export type TerrainSeasonProfile = 'summer' | 'autumn' | 'winter' | 'spring' | 'all'
export type TerrainWeatherProfile = 'dry' | 'wet' | 'snow' | 'all'

export interface TerrainMaterialDefinition {
  id: string
  displayName: string
  /** @deprecated Use displayName */
  label: string
  legacySurfaceId?: number
  splat: TerrainSplatChannelRef
  textures: TerrainMaterialTexturePaths
  /** Fallback tint when procedural placeholder is blended (MS1B). */
  tint: readonly [number, number, number]
  uvScale: number
  macroScale: number
  normalStrength: number
  roughnessMultiplier: number
  heightScale: number
  seasonProfile: TerrainSeasonProfile
  weatherProfile: TerrainWeatherProfile
  /** @deprecated MS1A fallback fields */
  albedo: readonly [number, number, number]
  roughness: number
  metallic: number
  ao: number
  macroColorStrength: number
  macroRoughnessStrength: number
}

export type TerrainLodTier = 'prototype' | 'small' | 'medium' | 'large' | 'xlarge'

export interface TerrainLodResolution {
  tier: TerrainLodTier
  resolution: number
  subdivisions: number
  maxVertices: number
}

export interface TerrainSplatMapDescriptor {
  index: number
  label: string
  channels: Partial<Record<TerrainSplatChannel, string>>
}

export interface TerrainPipelineLayerState {
  id: TerrainLayerId
  enabled: boolean
  shaderDefine?: string
}

export interface TerrainSlopeRule {
  id: string
  materialId: string
  /** Minimum slope factor 0=flat … 1=vertical */
  minSlope: number
  maxSlope: number
  blendWeight: number
}

export interface TerrainSlopeEvaluation {
  slope: number
  weights: Readonly<Record<string, number>>
}
