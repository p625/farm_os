import { getEnvironmentColorVariationProfile } from '@/config/environment/index.ts'
import type { EnvironmentAssetDefinition, EnvironmentColorVariance } from '@/types/environment-art.ts'
import { VEGETATION_BIOME_CONFIG } from '@/config/rendering/vegetation/vegetation-biome-config.ts'

export interface ResolvedEnvironmentColor {
  colorTint: number
  colorRgb: readonly [number, number, number]
  hueDelta: number
  brightnessDelta: number
  saturationDelta: number
}

export function resolveInstanceColor(
  asset: EnvironmentAssetDefinition,
  profileId: string,
  rand: () => number,
  variantTintOffset: readonly [number, number, number],
): ResolvedEnvironmentColor {
  const profile = getEnvironmentColorVariationProfile(profileId)
  const merged: EnvironmentColorVariance = {
    hue: Math.max(asset.colorVariation.hue, profile.variance.hue),
    brightness: Math.max(asset.colorVariation.brightness, profile.variance.brightness),
    saturation: Math.max(asset.colorVariation.saturation, profile.variance.saturation),
  }

  const hueDelta = (rand() * 2 - 1) * merged.hue
  const brightnessDelta = (rand() * 2 - 1) * merged.brightness
  const saturationDelta = (rand() * 2 - 1) * merged.saturation
  const colorTint = brightnessDelta

  const base = resolveBaseRgbForAsset(asset)
  const colorRgb: [number, number, number] = [
    clamp01(base[0] + hueDelta + variantTintOffset[0]),
    clamp01(base[1] + saturationDelta + variantTintOffset[1]),
    clamp01(base[2] + brightnessDelta + variantTintOffset[2]),
  ]

  return { colorTint, colorRgb, hueDelta, brightnessDelta, saturationDelta }
}

function resolveBaseRgbForAsset(asset: EnvironmentAssetDefinition): readonly [number, number, number] {
  const palette = VEGETATION_BIOME_CONFIG.palette
  switch (asset.category) {
    case 'Grass':
      return palette.grass
    case 'Flower':
      return palette.meadow
    case 'Bush':
      return palette.shrub
    case 'Tree':
    case 'DeadTree':
      return palette.tree
    case 'Rock':
    case 'GroundClutter':
    case 'Log':
      return palette.dryGrass
    case 'Reed':
      return palette.meadow
    default:
      return palette.grass
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(VEGETATION_BIOME_CONFIG.summerSaturationCap, value))
}

export function accumulateColorStats(
  stats: {
    hueMin: number
    hueMax: number
    brightnessMin: number
    brightnessMax: number
    saturationMin: number
    saturationMax: number
  },
  color: ResolvedEnvironmentColor,
): void {
  stats.hueMin = Math.min(stats.hueMin, color.hueDelta)
  stats.hueMax = Math.max(stats.hueMax, color.hueDelta)
  stats.brightnessMin = Math.min(stats.brightnessMin, color.brightnessDelta)
  stats.brightnessMax = Math.max(stats.brightnessMax, color.brightnessDelta)
  stats.saturationMin = Math.min(stats.saturationMin, color.saturationDelta)
  stats.saturationMax = Math.max(stats.saturationMax, color.saturationDelta)
}

export function createEmptyColorStats(): {
  hueMin: number
  hueMax: number
  brightnessMin: number
  brightnessMax: number
  saturationMin: number
  saturationMax: number
} {
  return {
    hueMin: Number.POSITIVE_INFINITY,
    hueMax: Number.NEGATIVE_INFINITY,
    brightnessMin: Number.POSITIVE_INFINITY,
    brightnessMax: Number.NEGATIVE_INFINITY,
    saturationMin: Number.POSITIVE_INFINITY,
    saturationMax: Number.NEGATIVE_INFINITY,
  }
}

export function finalizeColorStats(
  stats: ReturnType<typeof createEmptyColorStats>,
): EnvironmentPlacementColorStats {
  if (!Number.isFinite(stats.hueMin)) {
    return {
      hueMin: 0,
      hueMax: 0,
      brightnessMin: 0,
      brightnessMax: 0,
      saturationMin: 0,
      saturationMax: 0,
    }
  }
  return stats
}

export interface EnvironmentPlacementColorStats {
  hueMin: number
  hueMax: number
  brightnessMin: number
  brightnessMax: number
  saturationMin: number
  saturationMax: number
}
