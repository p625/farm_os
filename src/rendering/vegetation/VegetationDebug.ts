import { VEGETATION_DENSITY_CONFIG } from '@/config/rendering/vegetation/vegetation-density-config.ts'
import type { VegetationBuildReport, VegetationLayerStats } from '@/types/vegetation-rendering.ts'
import type { VegetationLayerRegistry } from '@/rendering/vegetation/VegetationLayerRegistry.ts'

export function buildVegetationDebugReport(
  registry: VegetationLayerRegistry,
): VegetationBuildReport {
  const layers: VegetationLayerStats[] = registry.getLayers().map((layer) => ({
    id: layer.definition.id,
    instanceCount: layer.getInstanceCount(),
    enabled: layer.isEnabled(),
  }))

  return {
    densityPreset: VEGETATION_DENSITY_CONFIG.preset,
    totalInstances: registry.getTotalInstanceCount(),
    layers,
  }
}

export function logVegetationDebugReport(registry: VegetationLayerRegistry): void {
  if (!import.meta.env?.DEV) {
    return
  }

  const report = buildVegetationDebugReport(registry)
  console.info('[FarmOS Vegetation]', {
    densityPreset: report.densityPreset,
    totalInstances: report.totalInstances,
    layers: report.layers,
  })
}

export function setVegetationLayersEnabled(
  registry: VegetationLayerRegistry,
  enabled: boolean,
): void {
  registry.setAllEnabled(enabled)
  if (import.meta.env?.DEV) {
    console.info(`[FarmOS Vegetation] All layers ${enabled ? 'enabled' : 'disabled'}`)
  }
}
