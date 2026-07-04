import type { TerrainLodTier, TerrainPipelineLayerState } from '@/types/terrain-rendering.ts'

export interface TerrainMacroVariationConfig {
  enabled: boolean
  colorScale: number
  colorStrength: number
  roughnessStrength: number
  normalStrength: number
  noiseScale: number
  noiseOctaves: number
}

export interface TerrainSplatConfig {
  /** Number of RGBA splat maps in the stack. */
  mapCount: number
  /** Blend sharpness for height-aware mixing (MS1B). */
  heightBlendSharpness: number
  /** Enables future biome layer without shader rewrite. */
  biomeBlendingEnabled: boolean
}

export interface TerrainColorGradingConfig {
  saturation: number
  contrast: number
  brightness: number
  /** Prevents crushed shadows on terrain. */
  shadowLift: number
}

export interface TerrainLodTierConfig {
  tier: TerrainLodTier
  /** Max map edge length in meters for this tier. */
  maxMapEdgeMeters: number
  defaultResolution: number
  maxResolution: number
  maxVertices: number
}

export interface TerrainPipelineConfig {
  shaderName: string
  splat: TerrainSplatConfig
  macroVariation: TerrainMacroVariationConfig
  colorGrading: TerrainColorGradingConfig
  lodTiers: readonly TerrainLodTierConfig[]
  layers: readonly TerrainPipelineLayerState[]
}

export const TERRAIN_PIPELINE_CONFIG: TerrainPipelineConfig = {
  shaderName: 'farmosTerrain',
  splat: {
    mapCount: 3,
    heightBlendSharpness: 8,
    biomeBlendingEnabled: false,
  },
  macroVariation: {
    enabled: true,
    colorScale: 0.018,
    colorStrength: 0.07,
    roughnessStrength: 0.05,
    normalStrength: 0.15,
    noiseScale: 0.0045,
    noiseOctaves: 3,
  },
  colorGrading: {
    saturation: 0.94,
    contrast: 0.98,
    brightness: 1.02,
    shadowLift: 0.04,
  },
  lodTiers: [
    { tier: 'prototype', maxMapEdgeMeters: 256, defaultResolution: 32, maxResolution: 64, maxVertices: 4096 },
    { tier: 'small', maxMapEdgeMeters: 1024, defaultResolution: 64, maxResolution: 128, maxVertices: 16384 },
    { tier: 'medium', maxMapEdgeMeters: 2048, defaultResolution: 64, maxResolution: 192, maxVertices: 36864 },
    { tier: 'large', maxMapEdgeMeters: 4096, defaultResolution: 64, maxResolution: 256, maxVertices: 65536 },
    { tier: 'xlarge', maxMapEdgeMeters: 8192, defaultResolution: 96, maxResolution: 384, maxVertices: 147456 },
  ],
  layers: [
    { id: 'baseTerrain', enabled: true },
    { id: 'terrainMaterials', enabled: true, shaderDefine: 'TERRAIN_MATERIALS' },
    { id: 'macroVariation', enabled: true, shaderDefine: 'TERRAIN_MACRO' },
    { id: 'normalMaps', enabled: true, shaderDefine: 'TERRAIN_NORMALS' },
    { id: 'detailMaps', enabled: true, shaderDefine: 'TERRAIN_DETAIL' },
    { id: 'decals', enabled: false, shaderDefine: 'TERRAIN_DECALS' },
    { id: 'vegetationMasks', enabled: false, shaderDefine: 'TERRAIN_VEG_MASK' },
    { id: 'weatherMasks', enabled: false, shaderDefine: 'TERRAIN_WEATHER_MASK' },
    { id: 'snowMasks', enabled: false, shaderDefine: 'TERRAIN_SNOW_MASK' },
    { id: 'runtimeOverlays', enabled: false, shaderDefine: 'TERRAIN_OVERLAYS' },
  ],
} as const
