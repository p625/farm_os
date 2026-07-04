import type { EnvironmentBiomeDefinition, EnvironmentBiomeId } from '@/types/environment-art.ts'

/**
 * Biome definitions — placement rule sets, not renderer configuration.
 * Central European landscape character: meadows, fields, forest margins, farm yards.
 */
export const ENVIRONMENT_BIOMES: readonly EnvironmentBiomeDefinition[] = [
  {
    id: 'meadow',
    displayName: 'Meadow',
    enabled: true,
    priority: 10,
    densityProfile: 'medium',
    colorVariation: 'meadow_warm',
    clusterProfile: 'flower_patch',
    allowedAssets: ['grass', 'meadow_grass', 'flower', 'bush', 'oak', 'rock', 'twig', 'leaf_litter'],
    vegetationLayers: [
      { assetId: 'grass', weight: 0.45 },
      { assetId: 'meadow_grass', weight: 0.25 },
      { assetId: 'flower', weight: 0.18 },
      { assetId: 'bush', weight: 0.06 },
      { assetId: 'oak', weight: 0.04 },
      { assetId: 'twig', weight: 0.02 },
    ],
  },
  {
    id: 'field',
    displayName: 'Field',
    enabled: true,
    priority: 40,
    densityProfile: 'sparse',
    colorVariation: 'field_dry',
    clusterProfile: 'grass_clump',
    allowedAssets: ['grass', 'dry_grass_clump', 'rock', 'stick'],
    vegetationLayers: [
      { assetId: 'grass', weight: 0.15 },
      { assetId: 'dry_grass_clump', weight: 0.7 },
      { assetId: 'rock', weight: 0.1 },
      { assetId: 'stick', weight: 0.05 },
    ],
  },
  {
    id: 'forest',
    displayName: 'Forest',
    enabled: true,
    priority: 35,
    densityProfile: 'dense',
    colorVariation: 'forest_cool',
    clusterProfile: 'tree_group',
    allowedAssets: [
      'meadow_grass',
      'forest_edge_shrub',
      'oak',
      'lime',
      'dead_tree',
      'log',
      'stump',
      'leaf_litter',
      'rock',
    ],
    vegetationLayers: [
      { assetId: 'meadow_grass', weight: 0.2 },
      { assetId: 'forest_edge_shrub', weight: 0.25 },
      { assetId: 'oak', weight: 0.3 },
      { assetId: 'lime', weight: 0.12 },
      { assetId: 'dead_tree', weight: 0.04 },
      { assetId: 'log', weight: 0.04 },
      { assetId: 'leaf_litter', weight: 0.03 },
      { assetId: 'stump', weight: 0.02 },
    ],
  },
  {
    id: 'forest_edge',
    displayName: 'Forest Edge',
    enabled: true,
    priority: 30,
    densityProfile: 'dense',
    colorVariation: 'forest_cool',
    clusterProfile: 'forest_edge_band',
    allowedAssets: [
      'grass',
      'meadow_grass',
      'forest_edge_shrub',
      'bush',
      'oak',
      'lime',
      'flower',
      'log',
      'twig',
    ],
    vegetationLayers: [
      { assetId: 'grass', weight: 0.2 },
      { assetId: 'meadow_grass', weight: 0.15 },
      { assetId: 'forest_edge_shrub', weight: 0.28 },
      { assetId: 'bush', weight: 0.12 },
      { assetId: 'oak', weight: 0.15 },
      { assetId: 'flower', weight: 0.06 },
      { assetId: 'twig', weight: 0.04 },
    ],
  },
  {
    id: 'roadside',
    displayName: 'Roadside',
    enabled: true,
    priority: 50,
    densityProfile: 'medium',
    colorVariation: 'roadside_neutral',
    clusterProfile: 'roadside_strip',
    allowedAssets: ['roadside_grass', 'grass', 'bush', 'rock', 'stick', 'dry_grass_clump'],
    vegetationLayers: [
      { assetId: 'roadside_grass', weight: 0.55 },
      { assetId: 'grass', weight: 0.2 },
      { assetId: 'bush', weight: 0.1 },
      { assetId: 'rock', weight: 0.08 },
      { assetId: 'stick', weight: 0.07 },
    ],
  },
  {
    id: 'farm_yard',
    displayName: 'Farm Yard',
    enabled: true,
    priority: 45,
    densityProfile: 'sparse',
    colorVariation: 'farm_yard_muted',
    clusterProfile: 'grass_clump',
    allowedAssets: ['grass', 'roadside_grass', 'bush', 'oak', 'rock', 'stick', 'stump'],
    vegetationLayers: [
      { assetId: 'grass', weight: 0.5 },
      { assetId: 'roadside_grass', weight: 0.2 },
      { assetId: 'bush', weight: 0.08 },
      { assetId: 'rock', weight: 0.1 },
      { assetId: 'stick', weight: 0.08 },
      { assetId: 'stump', weight: 0.04 },
    ],
  },
  {
    id: 'wetland',
    displayName: 'Wetland',
    enabled: false,
    priority: 20,
    densityProfile: 'dense',
    colorVariation: 'forest_cool',
    clusterProfile: 'ground_clutter_scatter',
    allowedAssets: ['reed', 'meadow_grass', 'rock', 'twig'],
    vegetationLayers: [
      { assetId: 'reed', weight: 0.5 },
      { assetId: 'meadow_grass', weight: 0.3 },
      { assetId: 'rock', weight: 0.12 },
      { assetId: 'twig', weight: 0.08 },
    ],
  },
  {
    id: 'village',
    displayName: 'Village',
    enabled: false,
    priority: 25,
    densityProfile: 'sparse',
    colorVariation: 'farm_yard_muted',
    clusterProfile: 'grass_clump',
    allowedAssets: ['grass', 'bush', 'lime', 'rock', 'stick'],
    vegetationLayers: [
      { assetId: 'grass', weight: 0.55 },
      { assetId: 'bush', weight: 0.15 },
      { assetId: 'lime', weight: 0.12 },
      { assetId: 'rock', weight: 0.1 },
      { assetId: 'stick', weight: 0.08 },
    ],
  },
] as const

const BIOME_BY_ID = new Map<EnvironmentBiomeId, EnvironmentBiomeDefinition>(
  ENVIRONMENT_BIOMES.map((biome) => [biome.id, biome]),
)

export function getEnvironmentBiome(id: EnvironmentBiomeId): EnvironmentBiomeDefinition | undefined {
  return BIOME_BY_ID.get(id)
}

export function getEnabledEnvironmentBiomes(): readonly EnvironmentBiomeDefinition[] {
  return ENVIRONMENT_BIOMES.filter((biome) => biome.enabled)
}

export const DEFAULT_ENVIRONMENT_BIOME_ID = 'meadow' as const
