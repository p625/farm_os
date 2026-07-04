import {
  getEnvironmentAsset,
  pickRandomVariant,
} from '@/config/environment/index.ts'
import type { EnvironmentPlacementInstance } from '@/types/environment-art.ts'
import {
  distanceToLine,
  distanceToHedgerow,
  distanceToTreeLine,
} from '@/rendering/vegetation/VegetationPlacementRules.ts'
import type { VegetationPlacementContext } from '@/types/vegetation-rendering.ts'
import { resolveInstanceColor, accumulateColorStats } from '@/rendering/environment/EnvironmentColorVariation.ts'
import type { ClusterPlacementAccumulator } from '@/rendering/environment/EnvironmentClusterPlacer.ts'

const HEDGEROW_LINES: Array<{ x1: number; z1: number; x2: number; z2: number }> = [
  { x1: -8, z1: -22, x2: 42, z2: -22 },
  { x1: 35, z1: 16, x2: 72, z2: 16 },
]

const TREE_LINES: Array<{ x1: number; z1: number; x2: number; z2: number }> = [
  { x1: -45, z1: 8, x2: -45, z2: 48 },
  { x1: 68, z1: -10, x2: 68, z2: 35 },
]

export function scatterLinearVegetationFeatures(
  context: VegetationPlacementContext,
  rand: () => number,
  accumulator: ClusterPlacementAccumulator,
): void {
  scatterAlongLines(context, HEDGEROW_LINES, 'hedgerow', 'hedgerow', 3.2, rand, accumulator)
  scatterAlongLines(context, TREE_LINES, 'lime', 'tree_line', 5.5, rand, accumulator)
}

function scatterAlongLines(
  context: VegetationPlacementContext,
  lines: Array<{ x1: number; z1: number; x2: number; z2: number }>,
  assetId: string,
  vegetationLayer: EnvironmentPlacementInstance['vegetationLayer'],
  spacing: number,
  rand: () => number,
  accumulator: ClusterPlacementAccumulator,
): void {
  const asset = getEnvironmentAsset(assetId)
  if (!asset?.enabled) {
    return
  }

  for (const line of lines) {
    const length = Math.hypot(line.x2 - line.x1, line.z2 - line.z1)
    const steps = Math.floor(length / spacing)
    for (let step = 0; step <= steps; step += 1) {
      const t = steps === 0 ? 0 : step / steps
      const x = line.x1 + (line.x2 - line.x1) * t + (rand() - 0.5) * spacing * 0.35
      const z = line.z1 + (line.z2 - line.z1) * t + (rand() - 0.5) * spacing * 0.35

      const dist =
        assetId === 'hedgerow'
          ? distanceToHedgerow(context, x, z)
          : distanceToTreeLine(context, x, z)
      if (dist > 2.5) {
        continue
      }

      const variant = pickRandomVariant(asset, rand)
      const color = resolveInstanceColor(asset, 'forest_cool', rand, variant.colorTintOffset)
      accumulateColorStats(accumulator.colorStats, color)

      const instance: EnvironmentPlacementInstance = {
        x,
        y: 0.02,
        z,
        rotationY: rand() * asset.rotationVariance,
        uniformScale:
          (asset.minScale + rand() * (asset.maxScale - asset.minScale)) * variant.scaleMultiplier,
        colorTint: color.colorTint,
        colorRgb: color.colorRgb,
        assetId: asset.id,
        variantId: variant.id,
        biomeId: 'forest_edge',
        clusterId: `linear_${assetId}`,
        vegetationLayer,
      }

      accumulator.instances.push(instance)
      accumulator.assetCounts[asset.id] = (accumulator.assetCounts[asset.id] ?? 0) + 1
    }
  }
}

export function distanceAlongFeatureLine(
  x: number,
  z: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
): number {
  return distanceToLine(x, z, x1, z1, x2, z2)
}
