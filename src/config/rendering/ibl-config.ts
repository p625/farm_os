/** Image-based lighting configuration — API only until HDRI assets exist (MS1A.5). */

export interface IblRenderingConfig {
  enabled: boolean
  environmentMapUrl: string | null
  intensity: number
  rotationY: number
  createDefaultSkybox: boolean
}

export const IBL_RENDERING_CONFIG: IblRenderingConfig = {
  enabled: false,
  environmentMapUrl: null,
  intensity: 1,
  rotationY: 0,
  createDefaultSkybox: false,
} as const
