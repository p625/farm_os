import type { EnvironmentDensityProfile } from '@/types/environment-art.ts'

export const ENVIRONMENT_DENSITY_PROFILES: readonly EnvironmentDensityProfile[] = [
  {
    id: 'sparse',
    displayName: 'Sparse',
    multiplier: 0.55,
    clusterMultiplier: 0.7,
  },
  {
    id: 'medium',
    displayName: 'Medium',
    multiplier: 1,
    clusterMultiplier: 1,
  },
  {
    id: 'dense',
    displayName: 'Dense',
    multiplier: 1.45,
    clusterMultiplier: 1.25,
  },
  {
    id: 'ultra',
    displayName: 'Ultra',
    multiplier: 2.1,
    clusterMultiplier: 1.55,
  },
] as const

const DENSITY_BY_ID = new Map(
  ENVIRONMENT_DENSITY_PROFILES.map((profile) => [profile.id, profile]),
)

export function getEnvironmentDensityProfile(
  id: EnvironmentDensityProfile['id'],
): EnvironmentDensityProfile {
  const profile = DENSITY_BY_ID.get(id)
  if (!profile) {
    throw new Error(`Unknown environment density profile: ${id}`)
  }
  return profile
}
