import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { WaterControlPoint, WaterTypeId } from '@/types/water.ts'
import {
  getWaterTypeDefinition,
  type WaterTypeDefinition,
} from '@/studio/water/WaterTypePalette.ts'
import type { WaterEllipse } from '@/studio/water/WaterAreaMath.ts'

let waterCounter = 0

export function createWaterId(): string {
  waterCounter += 1
  return `water_${waterCounter}`
}

export function resetWaterIdCounter(next: number): void {
  waterCounter = next
}

export function syncWaterIdCounterFromMap(map: WorldMapDocument): void {
  let max = 0
  for (const object of map.objects) {
    if (object.layer !== 'water') {
      continue
    }
    const match = /^water_(\d+)$/.exec(object.id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  waterCounter = max
}

export function createWaterSplineObject(
  points: WaterControlPoint[],
  waterType: WaterTypeId,
): MapObject {
  const definition = getWaterTypeDefinition(waterType)
  const id = createWaterId()
  return {
    id,
    layer: 'water',
    kind: waterType === 'water_stream_small' ? 'stream' : 'river',
    name: definition.label,
    transform: {
      position: { x: points[0].x, y: points[0].y, z: points[0].z },
    },
    properties: {
      waterType,
      placementKind: 'spline',
      points: points.map((point) => ({ ...point })),
    },
  }
}

export function createWaterAreaObject(
  ellipse: WaterEllipse,
  surfaceY: number,
  waterType: WaterTypeId,
): MapObject {
  const definition = getWaterTypeDefinition(waterType)
  const id = createWaterId()
  const kind = resolveAreaKind(definition)
  return {
    id,
    layer: 'water',
    kind,
    name: definition.label,
    transform: {
      position: { x: ellipse.centerX, y: surfaceY, z: ellipse.centerZ },
    },
    shape: {
      type: 'box',
      width: ellipse.radiusX * 2,
      height: 0.2,
      depth: ellipse.radiusZ * 2,
    },
    properties: {
      waterType,
      placementKind: 'area',
      radiusX: ellipse.radiusX,
      radiusZ: ellipse.radiusZ,
    },
  }
}

function resolveAreaKind(definition: WaterTypeDefinition): string {
  if (definition.id === 'water_pool') {
    return 'pool'
  }
  if (definition.id === 'water_pond_small') {
    return 'pond'
  }
  return 'pond_large'
}
