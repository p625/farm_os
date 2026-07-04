/** Shadow rendering configuration (MS1A.5). */

export interface CascadeShadowConfig {
  enabled: boolean
  cascadeCount: number
  lambda: number
  stabilizeCascades: boolean
}

export interface ShadowRenderingConfig {
  enabled: boolean
  mapSize: number
  useBlurExponentialShadowMap: boolean
  blurKernel: number
  darkness: number
  transparencyShadow: boolean
  cascade: CascadeShadowConfig
}

export const SHADOW_RENDERING_CONFIG: ShadowRenderingConfig = {
  enabled: true,
  mapSize: 1024,
  useBlurExponentialShadowMap: true,
  blurKernel: 24,
  darkness: 0.35,
  transparencyShadow: true,
  cascade: {
    enabled: false,
    cascadeCount: 4,
    lambda: 0.5,
    stabilizeCascades: true,
  },
} as const
