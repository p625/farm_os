import type { VegetationLayerDefinition } from '@/types/vegetation-rendering.ts'
import type { VegetationInstanceTransform } from '@/types/vegetation-rendering.ts'
import { resolveVegetationDensityMultiplier } from '@/config/rendering/vegetation/vegetation-density-config.ts'
import { filterInstancesForLod } from '@/rendering/vegetation/VegetationLodPolicy.ts'
import type { Camera } from '@babylonjs/core'
import type { WorldMapDocument } from '@/types/world-map.ts'
import {
  EnvironmentPlacementPlanner,
  type EnvironmentPlacementOptions,
} from '@/rendering/environment/EnvironmentPlacementPlanner.ts'
import type { EnvironmentPlacementResult } from '@/types/environment-art.ts'

export class VegetationInstanceBuilder {
  private readonly planner = new EnvironmentPlacementPlanner()
  private lastPlacementResult: EnvironmentPlacementResult | null = null

  getLastPlacementResult(): EnvironmentPlacementResult | null {
    return this.lastPlacementResult
  }

  buildAll(
    layers: readonly VegetationLayerDefinition[],
    options: {
      worldMap?: WorldMapDocument | null
      densityMultiplier: number
      camera: Camera | null
    },
  ): Map<VegetationLayerDefinition['id'], VegetationInstanceTransform[]> {
    const plannerOptions: EnvironmentPlacementOptions = {
      worldMap: options.worldMap,
      densityMultiplier: options.densityMultiplier,
      camera: options.camera,
      layers,
    }

    this.lastPlacementResult = this.planner.plan(plannerOptions)
    return this.planner.toVegetationTransforms(this.lastPlacementResult)
  }

  buildLayerInstances(
    layer: VegetationLayerDefinition,
    instances: readonly VegetationInstanceTransform[],
    camera: Camera | null,
  ): VegetationInstanceTransform[] {
    return filterInstancesForLod(layer, [...instances], camera)
  }
}

export function resolveVegetationDensityMultiplierFromConfig(): number {
  return resolveVegetationDensityMultiplier()
}
