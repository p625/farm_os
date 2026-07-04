import type { TerrainPipelineLayerState } from '@/types/terrain-rendering.ts'
import { TERRAIN_LAYER_IDS } from '@/types/terrain-rendering.ts'
import { TERRAIN_PIPELINE_CONFIG } from '@/config/rendering/terrain-pipeline-config.ts'

export function getTerrainLayerStack(): readonly TerrainPipelineLayerState[] {
  return TERRAIN_PIPELINE_CONFIG.layers
}

export function isTerrainLayerEnabled(layerId: (typeof TERRAIN_LAYER_IDS)[number]): boolean {
  return TERRAIN_PIPELINE_CONFIG.layers.find((layer) => layer.id === layerId)?.enabled ?? false
}

export function getActiveTerrainShaderDefines(): string[] {
  return TERRAIN_PIPELINE_CONFIG.layers
    .filter((layer) => layer.enabled && layer.shaderDefine)
    .map((layer) => layer.shaderDefine as string)
}
