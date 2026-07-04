import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'

export interface TerrainBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export function getTerrainGroundObject(
  map: WorldMapDocument,
): MapObject | null {
  return map.objects.find((object) => object.id === 'terrain_ground') ?? null
}

export function getTerrainBounds(map: WorldMapDocument): TerrainBounds | null {
  const ground = getTerrainGroundObject(map)
  if (ground?.shape?.type !== 'box') {
    return null
  }
  const halfW = ground.shape.width * 0.5
  const halfD = ground.shape.depth * 0.5
  const originX = ground.transform.position.x
  const originZ = ground.transform.position.z
  return {
    minX: originX - halfW,
    maxX: originX + halfW,
    minZ: originZ - halfD,
    maxZ: originZ + halfD,
  }
}

export function isPointInsideTerrainBounds(
  bounds: TerrainBounds,
  x: number,
  z: number,
  margin = 0,
): boolean {
  return (
    x >= bounds.minX + margin &&
    x <= bounds.maxX - margin &&
    z >= bounds.minZ + margin &&
    z <= bounds.maxZ - margin
  )
}

export function isFootprintInsideTerrainBounds(
  bounds: TerrainBounds,
  footprint: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  },
): boolean {
  return (
    footprint.minX >= bounds.minX &&
    footprint.maxX <= bounds.maxX &&
    footprint.minZ >= bounds.minZ &&
    footprint.maxZ <= bounds.maxZ
  )
}
