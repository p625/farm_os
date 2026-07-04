/** MS1B terrain visual tuning — shader parameters only. */

export interface TerrainDetailConfig {
  enabled: boolean
  uvScale: number
  normalStrength: number
  fadeStart: number
  fadeEnd: number
}

export interface TerrainAntiTilingConfig {
  enabled: boolean
  rotationStrength: number
  offsetStrength: number
  octaveMix: number
}

export interface TerrainHeightBlendConfig {
  enabled: boolean
  sharpness: number
  minHeightContrast: number
}

export interface TerrainSlopeRulesConfig {
  enabled: boolean
  /** Rock material id applied on steep slopes. */
  steepMaterialId: string
  grassMaterialId: string
  rockMinSlope: number
  rockMaxSlope: number
  grassMaxSlope: number
}

export interface TerrainVisualConfig {
  atlasTileSize: number
  atlasColumns: number
  atlasRows: number
  splatSoftness: number
  detail: TerrainDetailConfig
  antiTiling: TerrainAntiTilingConfig
  heightBlend: TerrainHeightBlendConfig
  slopeRules: TerrainSlopeRulesConfig
  /** Warm June midday color balance applied in terrain shader. */
  warmth: number
  greenBias: number
}

export const TERRAIN_VISUAL_CONFIG: TerrainVisualConfig = {
  atlasTileSize: 128,
  atlasColumns: 4,
  atlasRows: 3,
  splatSoftness: 0.35,
  detail: {
    enabled: true,
    uvScale: 2.4,
    normalStrength: 0.35,
    fadeStart: 35,
    fadeEnd: 140,
  },
  antiTiling: {
    enabled: true,
    rotationStrength: 1.15,
    offsetStrength: 0.42,
    octaveMix: 0.35,
  },
  heightBlend: {
    enabled: true,
    sharpness: 6,
    minHeightContrast: 0.08,
  },
  slopeRules: {
    enabled: true,
    steepMaterialId: 'rock',
    grassMaterialId: 'meadow',
    rockMinSlope: 0.42,
    rockMaxSlope: 0.82,
    grassMaxSlope: 0.35,
  },
  warmth: 0.04,
  greenBias: -0.02,
} as const
