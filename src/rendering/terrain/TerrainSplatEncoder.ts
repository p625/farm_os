import { TERRAIN_PIPELINE_CONFIG } from '@/config/rendering/terrain-pipeline-config.ts'
import type { TerrainSplatChannel } from '@/types/terrain-rendering.ts'
import { getTerrainMaterialForLegacySurface } from '@/rendering/terrain/TerrainMaterialRegistry.ts'

const CHANNEL_OFFSET: Record<TerrainSplatChannel, number> = {
  r: 0,
  g: 1,
  b: 2,
  a: 3,
}

export interface TerrainSplatWeights {
  /** Packed RGBA weights for splat map 0 (vertex color). */
  map0: readonly [number, number, number, number]
  /** Packed RGBA weights for splat map 1 (UV2 xy + custom data later). */
  map1: readonly [number, number, number, number]
  /** Packed RGBA weights for splat map 2. */
  map2: readonly [number, number, number, number]
}

const EMPTY_WEIGHTS: TerrainSplatWeights = {
  map0: [0, 0, 0, 0],
  map1: [0, 0, 0, 0],
  map2: [0, 0, 0, 0],
}

export function createEmptySplatWeights(): TerrainSplatWeights {
  return {
    map0: [...EMPTY_WEIGHTS.map0],
    map1: [...EMPTY_WEIGHTS.map1],
    map2: [...EMPTY_WEIGHTS.map2],
  }
}

export function splatWeightsForLegacySurface(surfaceId: number): TerrainSplatWeights {
  const weights = createEmptySplatWeights()
  const material = getTerrainMaterialForLegacySurface(surfaceId)
  const mapKey = `map${material.splat.mapIndex}` as 'map0' | 'map1' | 'map2'
  const channelOffset = CHANNEL_OFFSET[material.splat.channel]
  const map = [...weights[mapKey]] as [number, number, number, number]
  map[channelOffset] = 1
  weights[mapKey] = map
  return weights
}

export function writeSplatWeightsToVertexColor(
  weights: TerrainSplatWeights,
): readonly [number, number, number, number] {
  return weights.map0
}

export function writeSplatMap1ToUv2(
  weights: TerrainSplatWeights,
): readonly [number, number] {
  return [weights.map1[0], weights.map1[1]]
}

export function getSplatMapCount(): number {
  return TERRAIN_PIPELINE_CONFIG.splat.mapCount
}

export function encodeSurfaceGridToSplatColors(
  resolution: number,
  surfaces: readonly number[],
): Float32Array {
  const vertexCount = resolution * resolution
  const colors = new Float32Array(vertexCount * 4)

  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const surfaceIndex = j * resolution + i
      const meshVertex = (resolution - 1 - j) * resolution + i
      const weights = splatWeightsForLegacySurface(surfaces[surfaceIndex] ?? 0)
      const color = writeSplatWeightsToVertexColor(weights)
      const base = meshVertex * 4
      colors[base] = color[0]
      colors[base + 1] = color[1]
      colors[base + 2] = color[2]
      colors[base + 3] = color[3]
    }
  }

  return colors
}
