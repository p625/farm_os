import type { VegetationLodProfile } from '@/types/vegetation-rendering.ts'

export const VEGETATION_LOD_DEFAULTS: VegetationLodProfile = {
  nearDistance: 0,
  midDistance: 55,
  farDistance: 110,
  cullDistance: 180,
  midDensityMultiplier: 0.55,
  farDensityMultiplier: 0.25,
} as const

export const VEGETATION_LOD_CONFIG = {
  shortGrassCullDistance: 95,
  enableBillboardArchitecture: true,
} as const

export const VEGETATION_LAYER_LOD_OVERRIDES: Partial<
  Record<string, Partial<VegetationLodProfile>>
> = {
  short_grass: {
    cullDistance: VEGETATION_LOD_CONFIG.shortGrassCullDistance,
    farDistance: 70,
  },
  scattered_tree: {
    midDistance: 75,
    farDistance: 140,
    cullDistance: 220,
  },
  tree_line: {
    midDistance: 80,
    farDistance: 150,
    cullDistance: 230,
  },
} as const
