import { VEGETATION_DENSITY_CONFIG } from './vegetation-density-config.ts'

export const VEGETATION_CONFIG = {
  enabled: true,
  densityPreset: VEGETATION_DENSITY_CONFIG.preset,
  rootNodeName: 'farmos_vegetation_root',
  placeholderLabel: 'MS2_PLACEHOLDER',
  useProceduralScatter: true,
  ingestMapVegetationObjects: true,
} as const
