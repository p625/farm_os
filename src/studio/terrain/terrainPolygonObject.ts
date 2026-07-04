import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { MapPolygonPoint } from '@/types/world-map.ts'
import {
  computeTerrainBounds,
  TERRAIN_POLYGON_KIND,
  type TerrainBaseMaterial,
} from '@/types/terrain-polygon.ts'
import { createPolygonShape, polygonCentroid } from '@/studio/polygon/PolygonGeometryUtils.ts'
import { allocateParcelLayoutId } from '@/studio/parcel/allocateParcelLayoutId.ts'

let terrainPolygonCounter = 0

export function createTerrainPolygonId(): string {
  terrainPolygonCounter += 1
  return `terrain_poly_${terrainPolygonCounter}`
}

export function syncTerrainPolygonIdCounterFromMap(map: WorldMapDocument): void {
  let max = 0
  for (const object of map.objects) {
    if (object.kind !== TERRAIN_POLYGON_KIND) {
      continue
    }
    const match = /^terrain_poly_(\d+)$/.exec(object.id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  terrainPolygonCounter = max
}

export interface CreateTerrainPolygonOptions {
  surfaceY: number
  name?: string
  baseHeight?: number
  baseMaterial?: TerrainBaseMaterial
}

export function createTerrainPolygonObject(
  points: readonly MapPolygonPoint[],
  _map: WorldMapDocument,
  options: CreateTerrainPolygonOptions,
): MapObject {
  const id = createTerrainPolygonId()
  const centroid = polygonCentroid(points)
  const bounds = computeTerrainBounds(points)
  return {
    id,
    layer: 'terrain',
    kind: TERRAIN_POLYGON_KIND,
    name: options.name ?? `Terrain Boundary ${id.replace('terrain_poly_', '')}`,
    transform: {
      position: {
        x: centroid.x,
        y: options.surfaceY,
        z: centroid.z,
      },
    },
    shape: createPolygonShape(points, 0.12),
    properties: {
      baseHeight: options.baseHeight ?? 0,
      baseMaterial: options.baseMaterial ?? 'grass',
      bounds,
    },
  }
}

export function allocateTerrainPolygonLabel(map: WorldMapDocument): string {
  return allocateParcelLayoutId(map, 'M').replace('M-', 'T-')
}
