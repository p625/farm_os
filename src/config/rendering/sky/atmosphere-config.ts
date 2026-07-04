import type { AtmosphereConfig } from '@/types/sky-rendering.ts'

/**
 * Atmospheric perspective — not volumetric fog.
 * Fog color is driven by active sky horizon at runtime.
 */
export const ATMOSPHERE_CONFIG: AtmosphereConfig = {
  haze: {
    enabled: true,
    color: [0.76, 0.87, 0.94],
    start: 95,
    end: 1280,
    contrastReduction: 0.34,
  },
  distanceColor: {
    enabled: true,
    nearDistance: 60,
    farDistance: 1100,
    horizonBlend: 0.72,
    saturationFalloff: 0.18,
  },
} as const

export function resolveAtmosphereHazeColor(
  horizonColor: readonly [number, number, number],
): readonly [number, number, number] {
  const blend = ATMOSPHERE_CONFIG.distanceColor.horizonBlend
  return [
    horizonColor[0] * blend + ATMOSPHERE_CONFIG.haze.color[0] * (1 - blend),
    horizonColor[1] * blend + ATMOSPHERE_CONFIG.haze.color[1] * (1 - blend),
    horizonColor[2] * blend + ATMOSPHERE_CONFIG.haze.color[2] * (1 - blend),
  ]
}
