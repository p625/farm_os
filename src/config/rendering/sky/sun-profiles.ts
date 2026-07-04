import type { SunProfileDefinition } from '@/types/sky-rendering.ts'

function sunDirectionFromAngles(elevationDegrees: number, azimuthDegrees: number): readonly [number, number, number] {
  const elevation = (elevationDegrees * Math.PI) / 180
  const azimuth = (azimuthDegrees * Math.PI) / 180
  const y = Math.sin(elevation)
  const horizontal = Math.cos(elevation)
  const x = horizontal * Math.sin(azimuth)
  const z = horizontal * Math.cos(azimuth)
  return [-x, -y, -z]
}

function sunPositionFromDirection(
  direction: readonly [number, number, number],
  distance: number,
): readonly [number, number, number] {
  return [
    -direction[0] * distance,
    -direction[1] * distance,
    -direction[2] * distance,
  ]
}

const NOON_DIRECTION = sunDirectionFromAngles(58, 195)
const MORNING_DIRECTION = sunDirectionFromAngles(22, 125)
const AFTERNOON_DIRECTION = sunDirectionFromAngles(34, 245)

export const SUN_PROFILES: readonly SunProfileDefinition[] = [
  {
    id: 'morning',
    displayName: 'Morning',
    enabled: false,
    sunElevationDegrees: 22,
    sunAzimuthDegrees: 125,
    directional: {
      intensity: 0.72,
      diffuse: [1, 0.9, 0.78],
      specular: [0.18, 0.16, 0.12],
      direction: MORNING_DIRECTION,
      position: sunPositionFromDirection(MORNING_DIRECTION, 42),
    },
    hemispheric: {
      intensity: 0.58,
      diffuse: [0.82, 0.88, 0.96],
      groundColor: [0.28, 0.3, 0.18],
      direction: [0.15, 1, 0.1],
    },
    ambientTint: [0.38, 0.4, 0.36],
    exposureBias: 0.98,
  },
  {
    id: 'noon',
    displayName: 'Noon',
    enabled: true,
    sunElevationDegrees: 58,
    sunAzimuthDegrees: 195,
    directional: {
      intensity: 0.98,
      diffuse: [1, 0.97, 0.9],
      specular: [0.22, 0.2, 0.16],
      direction: NOON_DIRECTION,
      position: sunPositionFromDirection(NOON_DIRECTION, 40),
    },
    hemispheric: {
      intensity: 0.64,
      diffuse: [0.86, 0.92, 1],
      groundColor: [0.26, 0.34, 0.16],
      direction: [0.18, 1, 0.12],
    },
    ambientTint: [0.42, 0.46, 0.4],
    exposureBias: 1.04,
  },
  {
    id: 'afternoon',
    displayName: 'Afternoon',
    enabled: false,
    sunElevationDegrees: 34,
    sunAzimuthDegrees: 245,
    directional: {
      intensity: 0.86,
      diffuse: [1, 0.94, 0.82],
      specular: [0.2, 0.18, 0.14],
      direction: AFTERNOON_DIRECTION,
      position: sunPositionFromDirection(AFTERNOON_DIRECTION, 40),
    },
    hemispheric: {
      intensity: 0.6,
      diffuse: [0.9, 0.9, 0.98],
      groundColor: [0.3, 0.32, 0.18],
      direction: [0.2, 1, 0.08],
    },
    ambientTint: [0.4, 0.42, 0.38],
    exposureBias: 1.02,
  },
] as const

const SUN_BY_ID = new Map(SUN_PROFILES.map((profile) => [profile.id, profile]))

export function getSunProfile(id: string): SunProfileDefinition | undefined {
  return SUN_BY_ID.get(id as SunProfileDefinition['id'])
}

export function getActiveSunProfile(activeId: string): SunProfileDefinition {
  const profile = getSunProfile(activeId)
  if (!profile?.enabled) {
    throw new Error(`Sun profile not available: ${activeId}`)
  }
  return profile
}
