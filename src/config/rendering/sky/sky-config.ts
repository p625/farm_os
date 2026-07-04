import type { SkySystemConfig } from '@/types/sky-rendering.ts'

export const SKY_SYSTEM_CONFIG: SkySystemConfig = {
  enabled: true,
  activeSkyProfileId: 'june_noon_central_europe',
  activeSunProfileId: 'noon',
  domeDiameter: 12000,
  domeSegments: 48,
} as const
