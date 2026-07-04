import type { EnvironmentEcologyRule } from '@/types/environment-art.ts'

/**
 * Data-driven ecology relationships for Central European landscape composition.
 * Effects modify placement density near existing asset categories.
 */
export const ENVIRONMENT_ECOLOGY_RULES: readonly EnvironmentEcologyRule[] = [
  {
    id: 'tree_tall_grass_ring',
    displayName: 'Tree → tall grass around trunk',
    effects: [
      {
        id: 'tree_grass_ring',
        sourceAssetCategory: 'Tree',
        radius: 2.5,
        targetAssetCategories: ['Grass'],
        densityMultiplier: 1.65,
        description: 'Taller grass ring around tree bases',
      },
    ],
  },
  {
    id: 'bush_reduced_grass',
    displayName: 'Bush → less grass inside',
    effects: [
      {
        id: 'bush_grass_suppress',
        sourceAssetCategory: 'Bush',
        radius: 1.8,
        targetAssetCategories: ['Grass'],
        densityMultiplier: 0.35,
        description: 'Reduced grass density under shrub canopy',
      },
    ],
  },
  {
    id: 'rock_dry_grass',
    displayName: 'Rock → dry grass',
    effects: [
      {
        id: 'rock_dry_ring',
        sourceAssetCategory: 'Rock',
        radius: 1.6,
        targetAssetCategories: ['Grass', 'GroundClutter'],
        densityMultiplier: 0.55,
        description: 'Dry, sparse grass near exposed stone',
      },
    ],
  },
  {
    id: 'forest_edge_more_bushes',
    displayName: 'Forest edge → more shrubs',
    biomeId: 'forest_edge',
    effects: [
      {
        id: 'edge_shrub_boost',
        sourceAssetCategory: 'Tree',
        radius: 8,
        targetAssetCategories: ['Bush'],
        densityMultiplier: 1.8,
        description: 'Shrub thickening at forest margins',
      },
    ],
  },
  {
    id: 'field_no_bushes',
    displayName: 'Field → no shrubs',
    biomeId: 'field',
    effects: [
      {
        id: 'field_shrub_block',
        sourceAssetCategory: 'Grass',
        radius: 0.5,
        targetAssetCategories: ['Bush'],
        densityMultiplier: 0,
        description: 'Arable field interior excludes shrubs',
      },
    ],
  },
  {
    id: 'meadow_more_flowers',
    displayName: 'Meadow → more flowers',
    biomeId: 'meadow',
    effects: [
      {
        id: 'meadow_flower_boost',
        sourceAssetCategory: 'Grass',
        radius: 4,
        targetAssetCategories: ['Flower'],
        densityMultiplier: 1.75,
        description: 'Wildflower enrichment in open meadow',
      },
    ],
  },
  {
    id: 'log_ground_clutter',
    displayName: 'Log → ground clutter nearby',
    effects: [
      {
        id: 'log_clutter_ring',
        sourceAssetCategory: 'Log',
        radius: 2.2,
        targetAssetCategories: ['GroundClutter'],
        densityMultiplier: 1.5,
        description: 'Twigs and leaf litter near fallen wood',
      },
    ],
  },
  {
    id: 'reed_wet_margin',
    displayName: 'Reed → wetland margin (future)',
    biomeId: 'wetland',
    effects: [
      {
        id: 'reed_cluster',
        sourceAssetCategory: 'Reed',
        radius: 3,
        targetAssetCategories: ['Reed', 'Grass'],
        densityMultiplier: 1.4,
        description: 'Reed beds along future wetland edges',
      },
    ],
  },
] as const

export function getEcologyRulesForBiome(
  biomeId: string,
): readonly EnvironmentEcologyRule[] {
  return ENVIRONMENT_ECOLOGY_RULES.filter(
    (rule) => !rule.biomeId || rule.biomeId === biomeId,
  )
}
