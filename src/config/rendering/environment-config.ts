/** @deprecated MS4 — scene atmosphere is owned by SkySystem (`src/config/rendering/sky/`). */

export type FogModeKind = 'linear' | 'exponential' | 'height' | 'weather'

export interface DistanceFogConfig {
  enabled: boolean
  /** Active fog mode. Only `linear` is implemented in MS1A.5. */
  mode: FogModeKind
  color: readonly [number, number, number]
  /** Used by linear fog. */
  start: number
  end: number
  /** Used by exponential fog (future). */
  density: number
  /** Used by height fog (future). */
  heightStart?: number
  heightEnd?: number
}

export interface SkyClearColorConfig {
  color: readonly [number, number, number]
  alpha: number
}

export interface EnvironmentRenderingConfig {
  clearColor: SkyClearColorConfig
  ambientColor: readonly [number, number, number]
  fog: DistanceFogConfig
}

/** Soft June midday horizon — readable, not oversaturated. */
export const ENVIRONMENT_RENDERING_CONFIG: EnvironmentRenderingConfig = {
  clearColor: {
    color: [0.72, 0.86, 0.96],
    alpha: 1,
  },
  ambientColor: [0.35, 0.38, 0.32],
  fog: {
    enabled: true,
    mode: 'linear',
    color: [0.68, 0.82, 0.9],
    start: 180,
    end: 2200,
    density: 0.00035,
  },
} as const
