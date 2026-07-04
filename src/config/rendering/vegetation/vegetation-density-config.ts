import type { VegetationDensityPreset } from '@/types/vegetation-rendering.ts'

export const VEGETATION_DENSITY_PRESETS: Record<
  VegetationDensityPreset,
  { multiplier: number; label: string }
> = {
  low: { multiplier: 0.55, label: 'Low' },
  medium: { multiplier: 1.0, label: 'Medium' },
  high: { multiplier: 1.35, label: 'High' },
} as const

export const VEGETATION_DENSITY_CONFIG = {
  preset: 'medium' as VegetationDensityPreset,
} as const

export function resolveVegetationDensityMultiplier(
  preset: VegetationDensityPreset = VEGETATION_DENSITY_CONFIG.preset,
): number {
  return VEGETATION_DENSITY_PRESETS[preset].multiplier
}
