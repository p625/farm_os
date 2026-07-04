import { TERRAIN_PIPELINE_CONFIG } from '@/config/rendering/terrain-pipeline-config.ts'
import type { TerrainLodResolution } from '@/types/terrain-rendering.ts'

export function resolveTerrainLod(
  widthMeters: number,
  heightMeters: number,
  requestedResolution?: number,
): TerrainLodResolution {
  const mapEdge = Math.max(widthMeters, heightMeters)
  const tiers = TERRAIN_PIPELINE_CONFIG.lodTiers

  let tier = tiers[tiers.length - 1]
  for (const candidate of tiers) {
    if (mapEdge <= candidate.maxMapEdgeMeters) {
      tier = candidate
      break
    }
  }

  const targetResolution = clampResolution(
    requestedResolution ?? tier.defaultResolution,
    tier.maxResolution,
    tier.maxVertices,
  )

  return {
    tier: tier.tier,
    resolution: targetResolution,
    subdivisions: Math.max(1, targetResolution - 1),
    maxVertices: targetResolution * targetResolution,
  }
}

function clampResolution(
  resolution: number,
  maxResolution: number,
  maxVertices: number,
): number {
  const maxFromVertices = Math.floor(Math.sqrt(maxVertices))
  const capped = Math.min(resolution, maxResolution, maxFromVertices)
  return Math.max(2, capped)
}

export function estimateTerrainChunkCount(
  widthMeters: number,
  heightMeters: number,
  chunkEdgeMeters: number,
): { chunksX: number; chunksZ: number } {
  return {
    chunksX: Math.ceil(widthMeters / chunkEdgeMeters),
    chunksZ: Math.ceil(heightMeters / chunkEdgeMeters),
  }
}
