import type { EnvironmentClusterProfile } from '@/types/environment-art.ts'

export const ENVIRONMENT_CLUSTER_PROFILES: readonly EnvironmentClusterProfile[] = [
  {
    id: 'grass_clump',
    displayName: 'Grass Clump',
    minInstances: 4,
    maxInstances: 14,
    radius: 1.8,
    gapProbability: 0.22,
    spacing: 2.4,
  },
  {
    id: 'flower_patch',
    displayName: 'Flower Patch',
    minInstances: 3,
    maxInstances: 10,
    radius: 2.2,
    gapProbability: 0.35,
    spacing: 4.5,
  },
  {
    id: 'shrub_group',
    displayName: 'Shrub Group',
    minInstances: 2,
    maxInstances: 6,
    radius: 3.5,
    gapProbability: 0.45,
    spacing: 8,
  },
  {
    id: 'tree_group',
    displayName: 'Tree Group',
    minInstances: 1,
    maxInstances: 4,
    radius: 6,
    gapProbability: 0.55,
    spacing: 18,
  },
  {
    id: 'ground_clutter_scatter',
    displayName: 'Ground Clutter Scatter',
    minInstances: 1,
    maxInstances: 5,
    radius: 1.4,
    gapProbability: 0.6,
    spacing: 5.5,
  },
  {
    id: 'hedgerow_strip',
    displayName: 'Hedgerow Strip',
    minInstances: 3,
    maxInstances: 8,
    radius: 2.8,
    gapProbability: 0.3,
    spacing: 6,
  },
  {
    id: 'forest_edge_band',
    displayName: 'Forest Edge Band',
    minInstances: 4,
    maxInstances: 12,
    radius: 4,
    gapProbability: 0.28,
    spacing: 5,
  },
  {
    id: 'roadside_strip',
    displayName: 'Roadside Strip',
    minInstances: 3,
    maxInstances: 9,
    radius: 2,
    gapProbability: 0.18,
    spacing: 3.2,
  },
] as const

const CLUSTER_BY_ID = new Map(
  ENVIRONMENT_CLUSTER_PROFILES.map((profile) => [profile.id, profile]),
)

export function getEnvironmentClusterProfile(id: string): EnvironmentClusterProfile {
  const profile = CLUSTER_BY_ID.get(id)
  if (!profile) {
    throw new Error(`Unknown environment cluster profile: ${id}`)
  }
  return profile
}
