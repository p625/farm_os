import { getEnabledEnvironmentBiomes } from '@/config/environment/index.ts'
import type { EnvironmentPlacementInstance, EnvironmentPlacementResult } from '@/types/environment-art.ts'
import type { VegetationLayerType } from '@/types/vegetation-rendering.ts'
import type { VegetationPlacementContext } from '@/types/vegetation-rendering.ts'
import type { VegetationInstanceTransform } from '@/types/vegetation-rendering.ts'
import { buildVegetationPlacementContext } from '@/rendering/vegetation/VegetationPlacementRules.ts'
import {
  createClusterPlacementAccumulator,
  groupInstancesByLayer,
  scatterClustersForBiome,
} from '@/rendering/environment/EnvironmentClusterPlacer.ts'
import { scatterLinearVegetationFeatures } from '@/rendering/environment/EnvironmentLinearFeatures.ts'
import { finalizeColorStats } from '@/rendering/environment/EnvironmentColorVariation.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import type { VegetationLayerDefinition } from '@/types/vegetation-rendering.ts'
import { filterInstancesForLod } from '@/rendering/vegetation/VegetationLodPolicy.ts'
import type { Camera } from '@babylonjs/core'

const PLANNER_SEED = 0x4d533033

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), state | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface EnvironmentPlacementOptions {
  worldMap?: WorldMapDocument | null
  densityMultiplier: number
  camera: Camera | null
  layers: readonly VegetationLayerDefinition[]
}

export class EnvironmentPlacementPlanner {
  plan(options: EnvironmentPlacementOptions): EnvironmentPlacementResult {
    const context = buildVegetationPlacementContext(options.worldMap)
    const accumulator = createClusterPlacementAccumulator()

    for (const biome of getEnabledEnvironmentBiomes()) {
      scatterClustersForBiome(
        biome,
        context,
        options.densityMultiplier,
        PLANNER_SEED,
        accumulator,
      )
    }

    scatterLinearVegetationFeatures(context, mulberry32(PLANNER_SEED ^ 0xabcd), accumulator)

    const mapPoints = this.collectMapInstances(context)
    const grouped = groupInstancesByLayer([...accumulator.instances, ...mapPoints])
    const cappedByLayer = this.applyLayerCaps(grouped, options.layers, options.camera)

    return {
      instancesByLayer: cappedByLayer,
      stats: {
        activeBiomes: [...accumulator.activeBiomes],
        assetCounts: { ...accumulator.assetCounts },
        clusterCount: accumulator.clusterCount,
        instanceCount: Object.values(cappedByLayer).reduce((sum, list) => sum + list.length, 0),
        colorVariation: finalizeColorStats(accumulator.colorStats),
      },
      densityProfile: 'medium',
    }
  }

  toVegetationTransforms(
    result: EnvironmentPlacementResult,
  ): Map<VegetationLayerType, VegetationInstanceTransform[]> {
    const map = new Map<VegetationLayerType, VegetationInstanceTransform[]>()

    for (const [layerId, instances] of Object.entries(result.instancesByLayer)) {
      map.set(
        layerId as VegetationLayerType,
        instances.map((instance) => ({
          x: instance.x,
          y: instance.y,
          z: instance.z,
          rotationY: instance.rotationY,
          uniformScale: instance.uniformScale,
          colorTint: instance.colorTint,
          colorRgb: instance.colorRgb,
          assetId: instance.assetId,
          variantId: instance.variantId,
          biomeId: instance.biomeId,
        })),
      )
    }

    return map
  }

  private applyLayerCaps(
    grouped: Record<VegetationLayerType, EnvironmentPlacementInstance[]>,
    layers: readonly VegetationLayerDefinition[],
    camera: Camera | null,
  ): EnvironmentPlacementResult['instancesByLayer'] {
    const result = {} as Record<VegetationLayerType, EnvironmentPlacementInstance[]>

    for (const layer of layers) {
      const instances = grouped[layer.id] ?? []
      const capped = instances.slice(0, layer.maxInstances)
      const transforms = capped.map((i) => ({
        x: i.x,
        y: i.y,
        z: i.z,
        rotationY: i.rotationY,
        uniformScale: i.uniformScale,
        colorTint: i.colorTint,
      }))
      const filtered = filterInstancesForLod(layer, transforms, camera)
      const filteredSet = new Set(filtered.map((t) => `${t.x},${t.z}`))
      result[layer.id] = capped.filter((i) => filteredSet.has(`${i.x},${i.z}`))
    }

    return result
  }

  private collectMapInstances(
    context: VegetationPlacementContext,
  ): EnvironmentPlacementInstance[] {
    return context.mapTreePoints.map((point) => ({
      x: point.x,
      y: point.y,
      z: point.z,
      rotationY: point.rotationY,
      uniformScale: point.scale,
      colorTint: 0,
      colorRgb: [1, 1, 1] as const,
      assetId: 'map_point',
      variantId: 'map_point_v01',
      biomeId: 'meadow' as const,
      clusterId: null,
      vegetationLayer: point.layerType,
    }))
  }
}

export function planEnvironmentPlacement(
  options: EnvironmentPlacementOptions,
): EnvironmentPlacementResult {
  return new EnvironmentPlacementPlanner().plan(options)
}
