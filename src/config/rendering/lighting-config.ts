/** Scene light rig configuration (MS1A.5). */

export interface HemisphericLightConfig {
  direction: readonly [number, number, number]
  intensity: number
  diffuse: readonly [number, number, number]
  groundColor: readonly [number, number, number]
}

export interface DirectionalLightConfig {
  direction: readonly [number, number, number]
  position: readonly [number, number, number]
  intensity: number
  diffuse: readonly [number, number, number]
  specular: readonly [number, number, number]
}

export interface LightingConfig {
  hemispheric: HemisphericLightConfig
  directional: DirectionalLightConfig
}

/** Soft Central European summer lighting baseline. */
export const LIGHTING_CONFIG: LightingConfig = {
  hemispheric: {
    direction: [0.2, 1, 0.15],
    intensity: 0.62,
    diffuse: [0.88, 0.93, 1],
    groundColor: [0.24, 0.32, 0.14],
  },
  directional: {
    direction: [-0.65, -1.2, -0.45],
    position: [18, 38, 16],
    intensity: 0.95,
    diffuse: [1, 0.96, 0.86],
    specular: [0.25, 0.22, 0.18],
  },
} as const
