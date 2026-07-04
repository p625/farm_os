import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { RoadControlPoint, RoadKind } from '@/types/road.ts'
import { parseRoadProperties } from '@/types/road.ts'
import { getRoadTypeDefinition } from '@/studio/road/RoadTypePalette.ts'

let roadCounter = 0

export function createRoadObjectId(): string {
  roadCounter += 1
  return `road_${roadCounter}`
}

export function createRoadObject(
  points: readonly RoadControlPoint[],
  roadKind: RoadKind,
): MapObject {
  const roadType = getRoadTypeDefinition(roadKind)
  return {
    id: createRoadObjectId(),
    layer: 'roads',
    kind: 'road',
    name: roadType.label,
    transform: { position: { x: 0, y: 0, z: 0 } },
    properties: {
      roadKind,
      points: points.map((point) => ({ ...point })),
    },
  }
}

export function getRoadObjects(map: WorldMapDocument): MapObject[] {
  return map.objects.filter(
    (object) => object.layer === 'roads' && object.kind === 'road',
  )
}

export function getRoadPoints(object: MapObject): RoadControlPoint[] | null {
  return parseRoadProperties(object.properties)?.points ?? null
}

export function getRoadKind(object: MapObject): RoadKind | null {
  return parseRoadProperties(object.properties)?.roadKind ?? null
}
