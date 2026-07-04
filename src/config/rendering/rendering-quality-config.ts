/** Scalable rendering quality presets (MS1A.5). */

export type RenderingQualityPreset = 'low' | 'medium' | 'high' | 'ultra'

export interface RenderingQualityConfig {
  preset: RenderingQualityPreset
  antialias: boolean
  adaptToDeviceRatio: boolean
  shadowMapSize: number
}

const PRESET_SHADOW_MAP: Record<RenderingQualityPreset, number> = {
  low: 512,
  medium: 1024,
  high: 2048,
  ultra: 4096,
}

export const RENDERING_QUALITY_CONFIG: RenderingQualityConfig = {
  preset: 'high',
  antialias: true,
  adaptToDeviceRatio: true,
  shadowMapSize: PRESET_SHADOW_MAP.high,
} as const

export function resolveShadowMapSize(
  preset: RenderingQualityPreset = RENDERING_QUALITY_CONFIG.preset,
): number {
  return PRESET_SHADOW_MAP[preset]
}
