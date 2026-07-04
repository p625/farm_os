import type { EnvironmentColorVariationProfile } from '@/types/environment-art.ts'

/** Central European summer palette — subtle per-instance variation. */
export const ENVIRONMENT_COLOR_VARIATION_PROFILES: readonly EnvironmentColorVariationProfile[] = [
  {
    id: 'default',
    displayName: 'Default Summer',
    variance: { hue: 0.03, brightness: 0.05, saturation: 0.04 },
  },
  {
    id: 'meadow_warm',
    displayName: 'Warm Meadow',
    variance: { hue: 0.04, brightness: 0.06, saturation: 0.05 },
  },
  {
    id: 'forest_cool',
    displayName: 'Cool Forest Understory',
    variance: { hue: 0.025, brightness: 0.04, saturation: 0.035 },
  },
  {
    id: 'field_dry',
    displayName: 'Dry Field Margin',
    variance: { hue: 0.02, brightness: 0.07, saturation: 0.03 },
  },
  {
    id: 'roadside_neutral',
    displayName: 'Roadside Neutral',
    variance: { hue: 0.02, brightness: 0.04, saturation: 0.03 },
  },
  {
    id: 'farm_yard_muted',
    displayName: 'Farm Yard Muted',
    variance: { hue: 0.015, brightness: 0.035, saturation: 0.025 },
  },
] as const

const COLOR_PROFILE_BY_ID = new Map(
  ENVIRONMENT_COLOR_VARIATION_PROFILES.map((profile) => [profile.id, profile]),
)

export function getEnvironmentColorVariationProfile(
  id: string,
): EnvironmentColorVariationProfile {
  return COLOR_PROFILE_BY_ID.get(id) ?? ENVIRONMENT_COLOR_VARIATION_PROFILES[0]
}
