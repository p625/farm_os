import {
  MAP_01_ORIGIN,
  MAP_01_SIZE_M,
  MAP_01_TERRAIN_RESOLUTION,
} from '@/maps/map-01-blockout/constants.ts'
import type { Map01TerrainData } from '@/maps/map-01-blockout/types.ts'

/** Deterministic height sample for Variant A — návrší a údolí. */
export function sampleMap01TerrainHeight(worldX: number, worldZ: number): number {
  const rolling =
    Math.sin(worldX * 0.0012) * 3.5 +
    Math.cos(worldZ * 0.0009) * 4.2 +
    Math.sin((worldX + worldZ) * 0.0006) * 2

  const farmRidge =
    20 * Math.exp(-((worldZ + 1050) ** 2) / (520 ** 2)) *
    (0.85 + 0.15 * Math.cos(worldX * 0.002))

  const northRidge =
    24 * Math.exp(-((worldZ - 1450) ** 2) / (480 ** 2)) *
    (0.8 + 0.2 * Math.sin(worldX * 0.0015))

  const valleyFloor =
    14 *
    Math.exp(-((worldZ - 320) ** 2) / (720 ** 2)) *
    (0.7 + 0.3 * Math.exp(-(worldX ** 2) / (1600 ** 2)))

  const westForest =
    10 * Math.exp(-((worldX + 1500) ** 2) / (380 ** 2))
  const eastForest =
    9 * Math.exp(-((worldX - 1400) ** 2) / (420 ** 2))

  return (
    rolling +
    farmRidge +
    northRidge -
    valleyFloor +
    westForest * 0.6 +
    eastForest * 0.5
  )
}

export function buildMap01TerrainHeightfield(
  terrain: Map01TerrainData,
): { heights: number[]; surfaces: number[] } {
  const resolution = terrain.resolution
  const cellCount = resolution * resolution
  const heights = new Array<number>(cellCount)
  const surfaces = new Array<number>(cellCount).fill(0)

  const halfW = terrain.width * 0.5
  const halfH = terrain.height * 0.5

  for (let j = 0; j < resolution; j += 1) {
    for (let i = 0; i < resolution; i += 1) {
      const localX = (i / (resolution - 1)) * terrain.width
      const localZ = (j / (resolution - 1)) * terrain.height
      const worldX = terrain.origin.x - halfW + localX
      const worldZ = terrain.origin.z - halfH + localZ
      heights[j * resolution + i] = sampleMap01TerrainHeight(worldX, worldZ)
    }
  }

  return { heights, surfaces }
}

export function defaultMap01TerrainData(): Map01TerrainData {
  return {
    width: MAP_01_SIZE_M,
    height: MAP_01_SIZE_M,
    resolution: MAP_01_TERRAIN_RESOLUTION,
    origin: { ...MAP_01_ORIGIN },
    profile: 'variant_a_hillside_valley',
  }
}

/** Surface Y at world XZ for object placement. */
export function sampleMap01SurfaceY(worldX: number, worldZ: number): number {
  return sampleMap01TerrainHeight(worldX, worldZ)
}
