import type { SkyProfileDefinition } from '@/types/sky-rendering.ts'

/**
 * Central European summer sky — calm, not cinematic.
 * Darker zenith, brighter horizon, soft natural transition.
 */
export const SKY_PROFILES: readonly SkyProfileDefinition[] = [
  {
    id: 'june_noon_central_europe',
    displayName: 'June Noon — Central Europe',
    enabled: true,
    sunElevationDegrees: 58,
    sunAzimuthDegrees: 195,
    gradient: {
      zenithColor: [0.38, 0.56, 0.78],
      horizonColor: [0.76, 0.87, 0.94],
      gradientPower: 0.62,
      horizonSoftness: 0.38,
    },
    hazeIntensity: 0.42,
    ambientTint: [0.42, 0.46, 0.4],
  },
] as const

const PROFILE_BY_ID = new Map(SKY_PROFILES.map((profile) => [profile.id, profile]))

export function getSkyProfile(id: string): SkyProfileDefinition | undefined {
  return PROFILE_BY_ID.get(id as SkyProfileDefinition['id'])
}

export function getActiveSkyProfile(activeId: string): SkyProfileDefinition {
  const profile = getSkyProfile(activeId)
  if (!profile?.enabled) {
    throw new Error(`Sky profile not available: ${activeId}`)
  }
  return profile
}
