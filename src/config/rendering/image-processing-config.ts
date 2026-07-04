/** Babylon ImageProcessingConfiguration values (MS1A.5). */

export type ToneMappingKind = 'aces' | 'standard' | 'khronos_pbr_neutral'

export interface ToneMappingConfig {
  enabled: boolean
  kind: ToneMappingKind
}

export interface ColorCurvesConfig {
  enabled: boolean
  globalDensity: number
  globalExposure: number
  globalHue: number
  globalSaturation: number
  highlightsDensity: number
  shadowsDensity: number
}

export interface ImageProcessingConfig {
  enabled: boolean
  toneMapping: ToneMappingConfig
  exposure: number
  contrast: number
  colorCurves: ColorCurvesConfig
}

/** Natural June midday — no Instagram look. */
export const IMAGE_PROCESSING_CONFIG: ImageProcessingConfig = {
  enabled: true,
  toneMapping: {
    enabled: true,
    kind: 'aces',
  },
  exposure: 1.04,
  contrast: 1.02,
  colorCurves: {
    enabled: true,
    globalDensity: 0,
    globalExposure: 0,
    globalHue: 0,
    globalSaturation: -0.02,
    highlightsDensity: -0.02,
    shadowsDensity: 0.06,
  },
} as const
