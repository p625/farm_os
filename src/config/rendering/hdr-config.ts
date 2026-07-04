/** HDR render path configuration (MS1A.5). */

export interface HdrRenderingConfig {
  /** Enables HDR-oriented image processing path when hardware supports it. */
  enabled: boolean
  /** Prefer float/half-float render targets when available. */
  preferFloatRenderTargets: boolean
  /** Fall back to LDR instead of failing on weak GPUs. */
  fallbackToLdr: boolean
}

export const HDR_RENDERING_CONFIG: HdrRenderingConfig = {
  enabled: true,
  preferFloatRenderTargets: true,
  fallbackToLdr: true,
} as const
