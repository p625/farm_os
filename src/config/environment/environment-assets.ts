import type {
  EnvironmentAssetCategory,
  EnvironmentAssetDefinition,
  EnvironmentAssetVariant,
} from '@/types/environment-art.ts'
import type { VegetationLayerType } from '@/types/vegetation-rendering.ts'

function createVariants(
  familyId: string,
  count: number,
  options: {
    weight?: number
    scaleSpread?: number
    tintSpread?: number
  } = {},
): EnvironmentAssetVariant[] {
  const weight = options.weight ?? 1
  const scaleSpread = options.scaleSpread ?? 0.12
  const tintSpread = options.tintSpread ?? 0.04
  const variants: EnvironmentAssetVariant[] = []

  for (let index = 0; index < count; index += 1) {
    const phase = index / Math.max(1, count - 1)
    variants.push({
      id: `${familyId}_v${String(index + 1).padStart(2, '0')}`,
      displayName: `${familyId} variant ${index + 1}`,
      weight,
      scaleMultiplier: 1 + (phase - 0.5) * scaleSpread * 2,
      colorTintOffset: [
        (phase - 0.5) * tintSpread,
        (0.5 - phase) * tintSpread * 0.6,
        (index % 3 - 1) * tintSpread * 0.3,
      ],
    })
  }

  return variants
}

function defineAsset(
  partial: Omit<EnvironmentAssetDefinition, 'variants'> & { variantCount: number },
): EnvironmentAssetDefinition {
  const { variantCount, ...rest } = partial
  return {
    ...rest,
    variants: createVariants(partial.id, variantCount, {
      weight: partial.category === 'Tree' ? 0.85 : 1,
      scaleSpread: partial.category === 'Tree' ? 0.18 : 0.1,
    }),
  }
}

const DEFAULT_LOD = {
  nearDistance: 28,
  midDistance: 55,
  farDistance: 95,
  cullDistance: 140,
} as const

const TREE_LOD = {
  nearDistance: 45,
  midDistance: 90,
  farDistance: 160,
  cullDistance: 220,
} as const

const GROUND_CLUTTER_LOD = {
  nearDistance: 18,
  midDistance: 35,
  farDistance: 55,
  cullDistance: 75,
} as const

function layerForCategory(category: EnvironmentAssetCategory): VegetationLayerType {
  switch (category) {
    case 'Grass':
      return 'short_grass'
    case 'Flower':
      return 'meadow_grass'
    case 'Bush':
      return 'shrub'
    case 'Tree':
    case 'DeadTree':
      return 'scattered_tree'
    case 'Rock':
    case 'GroundClutter':
      return 'field_margin'
    case 'Log':
      return 'forest_edge'
    case 'Reed':
      return 'roadside_grass'
    default:
      return 'short_grass'
  }
}

function defineFamily(
  id: string,
  category: EnvironmentAssetCategory,
  displayName: string,
  placeholder: string,
  options: {
    minScale?: number
    maxScale?: number
    rotationVariance?: number
    variantCount: number
    meshSource?: string | null
    wind?: boolean
    shadowMode?: EnvironmentAssetDefinition['shadowMode']
    collision?: boolean
    enabled?: boolean
    vegetationLayer?: VegetationLayerType
    colorVariance?: EnvironmentAssetDefinition['colorVariation']
  },
): EnvironmentAssetDefinition {
  return defineAsset({
    id,
    category,
    displayName,
    meshSource: options.meshSource ?? null,
    placeholder,
    minScale: options.minScale ?? 0.85,
    maxScale: options.maxScale ?? 1.15,
    rotationVariance: options.rotationVariance ?? Math.PI,
    colorVariation: options.colorVariance ?? { hue: 0.03, brightness: 0.05, saturation: 0.04 },
    windProfile: {
      enabled: options.wind ?? (category === 'Grass' || category === 'Flower' || category === 'Reed'),
      strength: category === 'Tree' ? 0.15 : 0.35,
      frequency: category === 'Tree' ? 0.4 : 1.2,
    },
    lodProfile:
      category === 'Tree' || category === 'DeadTree'
        ? TREE_LOD
        : category === 'GroundClutter' || category === 'Rock'
          ? GROUND_CLUTTER_LOD
          : DEFAULT_LOD,
    shadowMode:
      options.shadowMode ??
      (category === 'Tree' || category === 'DeadTree'
        ? 'cast_and_receive'
        : category === 'Bush'
          ? 'cast_and_receive'
          : 'receive'),
    collision: options.collision ?? (category === 'Tree' || category === 'Rock'),
    enabled: options.enabled ?? true,
    vegetationLayer: options.vegetationLayer ?? layerForCategory(category),
    variantCount: options.variantCount,
  })
}

/** Central European environment asset library — variant families, not numbered meshes. */
export const ENVIRONMENT_ASSETS: readonly EnvironmentAssetDefinition[] = [
  defineFamily('grass', 'Grass', 'Meadow Grass', 'placeholder_short_grass', {
    variantCount: 12,
    minScale: 0.75,
    maxScale: 1.2,
    rotationVariance: Math.PI * 2,
  }),
  defineFamily('meadow_grass', 'Grass', 'Tall Meadow Grass', 'placeholder_meadow_grass', {
    variantCount: 8,
    minScale: 0.9,
    maxScale: 1.35,
    vegetationLayer: 'meadow_grass',
  }),
  defineFamily('roadside_grass', 'Grass', 'Roadside Grass', 'placeholder_short_grass', {
    variantCount: 6,
    minScale: 0.7,
    maxScale: 1.05,
    vegetationLayer: 'roadside_grass',
    colorVariance: { hue: 0.02, brightness: 0.04, saturation: 0.03 },
  }),
  defineFamily('flower', 'Flower', 'Wildflower', 'placeholder_meadow_grass', {
    variantCount: 12,
    minScale: 0.8,
    maxScale: 1.1,
    vegetationLayer: 'meadow_grass',
    colorVariance: { hue: 0.05, brightness: 0.06, saturation: 0.06 },
  }),
  defineFamily('bush', 'Bush', 'Hawthorn Bush', 'placeholder_shrub_small', {
    variantCount: 6,
    minScale: 0.9,
    maxScale: 1.4,
    vegetationLayer: 'shrub',
  }),
  defineFamily('hedgerow', 'Bush', 'Hedgerow Shrub', 'placeholder_shrub_large', {
    variantCount: 5,
    minScale: 1.1,
    maxScale: 1.8,
    vegetationLayer: 'hedgerow',
  }),
  defineFamily('forest_edge_shrub', 'Bush', 'Forest Edge Shrub', 'placeholder_forest_edge', {
    variantCount: 6,
    minScale: 1,
    maxScale: 1.6,
    vegetationLayer: 'forest_edge',
    colorVariance: { hue: 0.025, brightness: 0.04, saturation: 0.035 },
  }),
  defineFamily('oak', 'Tree', 'Pedunculate Oak', 'placeholder_young_tree', {
    variantCount: 8,
    minScale: 0.85,
    maxScale: 1.25,
    rotationVariance: Math.PI * 0.25,
    wind: true,
  }),
  defineFamily('lime', 'Tree', 'Small-leaved Lime', 'placeholder_young_tree', {
    variantCount: 6,
    minScale: 0.9,
    maxScale: 1.3,
    vegetationLayer: 'tree_line',
  }),
  defineFamily('dead_tree', 'DeadTree', 'Standing Deadwood', 'placeholder_young_tree', {
    variantCount: 4,
    minScale: 0.75,
    maxScale: 1.1,
    shadowMode: 'cast_and_receive',
  }),
  defineFamily('rock', 'Rock', 'Field Boulder', 'placeholder_dry_grass', {
    variantCount: 5,
    minScale: 0.6,
    maxScale: 1.4,
    rotationVariance: Math.PI * 2,
    wind: false,
    collision: true,
    colorVariance: { hue: 0.015, brightness: 0.06, saturation: 0.02 },
  }),
  defineFamily('log', 'Log', 'Fallen Log', 'placeholder_forest_edge', {
    variantCount: 4,
    minScale: 0.8,
    maxScale: 1.2,
    rotationVariance: Math.PI * 2,
    wind: false,
    vegetationLayer: 'forest_edge',
  }),
  defineFamily('reed', 'Reed', 'Common Reed', 'placeholder_meadow_grass', {
    variantCount: 5,
    minScale: 0.85,
    maxScale: 1.2,
    enabled: false,
    vegetationLayer: 'roadside_grass',
  }),
  defineFamily('twig', 'GroundClutter', 'Twig', 'placeholder_dry_grass', {
    variantCount: 6,
    minScale: 0.4,
    maxScale: 0.9,
    rotationVariance: Math.PI * 2,
    wind: false,
    shadowMode: 'receive',
    collision: false,
  }),
  defineFamily('leaf_litter', 'GroundClutter', 'Leaf Litter', 'placeholder_dry_grass', {
    variantCount: 5,
    minScale: 0.5,
    maxScale: 1,
    wind: false,
    shadowMode: 'none',
  }),
  defineFamily('stump', 'GroundClutter', 'Tree Stump', 'placeholder_dry_grass', {
    variantCount: 3,
    minScale: 0.7,
    maxScale: 1.1,
    wind: false,
    shadowMode: 'cast_and_receive',
    collision: true,
  }),
  defineFamily('stick', 'GroundClutter', 'Stick', 'placeholder_dry_grass', {
    variantCount: 4,
    minScale: 0.35,
    maxScale: 0.75,
    wind: false,
    shadowMode: 'none',
  }),
  defineFamily('dry_grass_clump', 'GroundClutter', 'Dry Grass Clump', 'placeholder_dry_grass', {
    variantCount: 5,
    minScale: 0.6,
    maxScale: 1,
    colorVariance: { hue: 0.02, brightness: 0.07, saturation: 0.025 },
  }),
] as const

const ASSET_BY_ID = new Map(ENVIRONMENT_ASSETS.map((asset) => [asset.id, asset]))

export function getEnvironmentAsset(id: string): EnvironmentAssetDefinition | undefined {
  return ASSET_BY_ID.get(id)
}

export function getEnabledEnvironmentAssets(): readonly EnvironmentAssetDefinition[] {
  return ENVIRONMENT_ASSETS.filter((asset) => asset.enabled)
}

export function pickRandomVariant(
  asset: EnvironmentAssetDefinition,
  rand: () => number,
): EnvironmentAssetVariant {
  const totalWeight = asset.variants.reduce((sum, variant) => sum + variant.weight, 0)
  let roll = rand() * totalWeight
  for (const variant of asset.variants) {
    roll -= variant.weight
    if (roll <= 0) {
      return variant
    }
  }
  return asset.variants[asset.variants.length - 1]
}
