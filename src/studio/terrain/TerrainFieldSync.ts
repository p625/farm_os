import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import {
  cellIndex,
  ensureTerrainHeightfield,
  type TerrainHeightfield,
  worldToTerrainCell,
} from '@/studio/terrain/TerrainHeightmap.ts'

function fieldFootprintCellRange(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  object: MapObject,
): { minI: number; maxI: number; minJ: number; maxJ: number } | null {
  const shape = object.shape
  if (!shape || shape.type !== 'box') {
    return null
  }

  const halfW = shape.width * 0.5
  const halfD = shape.depth * 0.5
  const cx = object.transform.position.x
  const cz = object.transform.position.z

  const corners = [
    worldToTerrainCell(field, originX, originZ, cx - halfW, cz - halfD),
    worldToTerrainCell(field, originX, originZ, cx + halfW, cz - halfD),
    worldToTerrainCell(field, originX, originZ, cx - halfW, cz + halfD),
    worldToTerrainCell(field, originX, originZ, cx + halfW, cz + halfD),
  ]

  if (corners.some((corner) => corner === null)) {
    return null
  }

  const cells = corners as { i: number; j: number }[]
  const minI = Math.min(...cells.map((corner) => corner.i))
  const maxI = Math.max(...cells.map((corner) => corner.i))
  const minJ = Math.min(...cells.map((corner) => corner.j))
  const maxJ = Math.max(...cells.map((corner) => corner.j))

  return { minI, maxI, minJ, maxJ }
}

function sampleDominantSurface(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  object: MapObject,
): number {
  const range = fieldFootprintCellRange(field, originX, originZ, object)
  if (!range) {
    return 0
  }

  const counts = new Map<number, number>()
  for (let j = range.minJ; j <= range.maxJ; j++) {
    for (let i = range.minI; i <= range.maxI; i++) {
      const surfaceId = field.surfaces[cellIndex(i, j, field.resolution)]
      counts.set(surfaceId, (counts.get(surfaceId) ?? 0) + 1)
    }
  }

  let dominant = 0
  let bestCount = -1
  for (const [surfaceId, count] of counts) {
    if (count > bestCount) {
      dominant = surfaceId
      bestCount = count
    }
  }
  return dominant
}

function sampleAverageHeight(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  object: MapObject,
): number {
  const range = fieldFootprintCellRange(field, originX, originZ, object)
  if (!range) {
    return 0
  }

  let sum = 0
  let count = 0
  for (let j = range.minJ; j <= range.maxJ; j++) {
    for (let i = range.minI; i <= range.maxI; i++) {
      sum += field.heights[cellIndex(i, j, field.resolution)]
      count += 1
    }
  }
  return count > 0 ? sum / count : 0
}

export function syncFieldObjectFromTerrain(
  object: MapObject,
  terrainField: TerrainHeightfield,
  originX: number,
  originZ: number,
  baseY: number,
): MapObject {
  if (object.layer !== 'fields' || object.kind !== 'field') {
    return object
  }

  const surfaceId = sampleDominantSurface(terrainField, originX, originZ, object)
  const avgHeight = sampleAverageHeight(terrainField, originX, originZ, object)
  const fieldHalfH = (object.shape?.height ?? 0.08) * 0.5

  return {
    ...object,
    transform: {
      ...object.transform,
      position: {
        ...object.transform.position,
        y: baseY + avgHeight + fieldHalfH,
      },
    },
    properties: {
      ...object.properties,
      surfaceId,
    },
  }
}

export function syncFieldObjectsFromTerrain(map: WorldMapDocument): MapObject[] {
  const ground = map.objects.find((object) => object.id === 'terrain_ground')
  if (!ground) {
    return map.objects
  }

  const terrainField = ensureTerrainHeightfield(map.terrain)
  const originX = ground.transform.position.x
  const originZ = ground.transform.position.z
  const baseY = ground.transform.position.y

  return map.objects.map((object) =>
    syncFieldObjectFromTerrain(object, terrainField, originX, originZ, baseY),
  )
}
