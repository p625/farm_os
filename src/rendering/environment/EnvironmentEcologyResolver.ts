import { getEcologyRulesForBiome, getEnvironmentAsset } from '@/config/environment/index.ts'
import type {
  EnvironmentAssetCategory,
  EnvironmentBiomeId,
  EnvironmentPlacementInstance,
} from '@/types/environment-art.ts'

export interface EcologyDensityContext {
  placedInstances: readonly EnvironmentPlacementInstance[]
}

export function evaluateEcologyDensityMultiplier(
  biomeId: EnvironmentBiomeId,
  targetCategory: EnvironmentAssetCategory,
  x: number,
  z: number,
  context: EcologyDensityContext,
): number {
  const rules = getEcologyRulesForBiome(biomeId)
  let multiplier = 1

  for (const rule of rules) {
    for (const effect of rule.effects) {
      if (!effect.targetAssetCategories.includes(targetCategory)) {
        continue
      }

      for (const placed of context.placedInstances) {
        if (placed.assetId === '' || placed.x === x) {
          continue
        }
        const assetCategory = getEnvironmentAsset(placed.assetId)?.category ?? null
        if (assetCategory !== effect.sourceAssetCategory) {
          continue
        }
        const dist = Math.hypot(x - placed.x, z - placed.z)
        if (dist <= effect.radius) {
          const falloff = 1 - dist / effect.radius
          const blend = effect.densityMultiplier * falloff + (1 - falloff)
          multiplier *= blend
        }
      }
    }
  }

  return Math.max(0, Math.min(2.5, multiplier))
}

export function shouldRejectByEcology(
  biomeId: EnvironmentBiomeId,
  targetCategory: EnvironmentAssetCategory,
  x: number,
  z: number,
  context: EcologyDensityContext,
): boolean {
  return evaluateEcologyDensityMultiplier(biomeId, targetCategory, x, z, context) <= 0.001
}
