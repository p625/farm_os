import type { EnvironmentPlacementResult } from '@/types/environment-art.ts'
import type { VegetationLayerRegistry } from '@/rendering/vegetation/VegetationLayerRegistry.ts'

export interface EnvironmentDebugReport {
  activeBiomes: readonly string[]
  assetCounts: Readonly<Record<string, number>>
  clusterCount: number
  instanceCount: number
  vegetationInstanceCount: number
  colorVariation: EnvironmentPlacementResult['stats']['colorVariation']
}

export function buildEnvironmentDebugReport(
  placement: EnvironmentPlacementResult,
  registry: VegetationLayerRegistry,
): EnvironmentDebugReport {
  return {
    activeBiomes: placement.stats.activeBiomes,
    assetCounts: placement.stats.assetCounts,
    clusterCount: placement.stats.clusterCount,
    instanceCount: placement.stats.instanceCount,
    vegetationInstanceCount: registry.getTotalInstanceCount(),
    colorVariation: placement.stats.colorVariation,
  }
}

export function logEnvironmentDebugReport(
  placement: EnvironmentPlacementResult,
  registry: VegetationLayerRegistry,
): void {
  if (!import.meta.env?.DEV) {
    return
  }

  const report = buildEnvironmentDebugReport(placement, registry)
  console.info('[FarmOS Environment]', {
    activeBiomes: report.activeBiomes,
    assetCount: Object.keys(report.assetCounts).length,
    assetCounts: report.assetCounts,
    clusterCount: report.clusterCount,
    instanceCount: report.instanceCount,
    vegetationInstanceCount: report.vegetationInstanceCount,
    colorVariation: report.colorVariation,
  })
}
