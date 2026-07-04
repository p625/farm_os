import type { BiomeAmbientProfileDefinition, GlobalAmbientProfileDefinition } from '@/types/sky-rendering.ts'

/** Biome ambient tints — data for future local ambient; MS4 applies global only. */
export const BIOME_AMBIENT_PROFILES: readonly BiomeAmbientProfileDefinition[] = [
  {
    id: 'meadow',
    displayName: 'Meadow Ambient',
    tint: [0.44, 0.48, 0.38],
    weight: 1,
  },
  {
    id: 'forest',
    displayName: 'Forest Ambient',
    tint: [0.34, 0.4, 0.32],
    weight: 0.85,
  },
  {
    id: 'roadside',
    displayName: 'Roadside Ambient',
    tint: [0.4, 0.42, 0.38],
    weight: 0.9,
  },
] as const

export const GLOBAL_AMBIENT_PROFILE: GlobalAmbientProfileDefinition = {
  id: 'june_noon_global',
  displayName: 'June Noon Global Ambient',
  color: [0.42, 0.46, 0.4],
  biomeProfiles: ['meadow', 'forest', 'roadside'],
} as const

const BIOME_AMBIENT_BY_ID = new Map(
  BIOME_AMBIENT_PROFILES.map((profile) => [profile.id, profile]),
)

export function getBiomeAmbientProfile(
  id: string,
): BiomeAmbientProfileDefinition | undefined {
  return BIOME_AMBIENT_BY_ID.get(id as BiomeAmbientProfileDefinition['id'])
}
