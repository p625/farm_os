import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import { TERRAIN_POLYGON_KIND, computeTerrainBounds } from '@/types/terrain-polygon.ts'
import { getFieldPolygonPoints } from '@/studio/parcel/ParcelPolygon.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { isSystemTerrainPolygon } from '@/studio/terrain/ensureMapTerrainSurface.ts'

export interface TerrainSurfaceSyncResult {
  map: WorldMapDocument
  changed: boolean
}

/** Terrain Boundary = editor-only `terrain_polygon` objects (never the render surface). */
export function getTerrainBoundaryObject(map: WorldMapDocument): MapObject | null {
  const boundaries = map.objects.filter(
    (object) => object.kind === TERRAIN_POLYGON_KIND,
  )
  const userBoundary = boundaries.find((object) => !isSystemTerrainPolygon(object))
  return userBoundary ?? boundaries[0] ?? null
}

export function listTerrainBoundaryObjects(map: WorldMapDocument): MapObject[] {
  return map.objects.filter((object) => object.kind === TERRAIN_POLYGON_KIND)
}

/**
 * Recompute terrain_ground box + heightfield dimensions from the active Terrain Boundary.
 * Boundary is input; terrain_ground heightfield mesh is the sole render surface.
 */
export function syncTerrainSurfaceFromBoundary(
  map: WorldMapDocument,
): TerrainSurfaceSyncResult {
  const boundary = getTerrainBoundaryObject(map)
  const groundIndex = map.objects.findIndex((object) => object.id === 'terrain_ground')
  if (!boundary || groundIndex < 0) {
    return { map, changed: false }
  }

  const points = getFieldPolygonPoints(boundary)
  if (!points || points.length < 3) {
    return { map, changed: false }
  }

  const bounds = computeTerrainBounds(points)
  if (!bounds) {
    return { map, changed: false }
  }

  const width = bounds.maxX - bounds.minX
  const depth = bounds.maxZ - bounds.minZ
  if (width <= 0 || depth <= 0) {
    return { map, changed: false }
  }

  const centerX = (bounds.minX + bounds.maxX) * 0.5
  const centerZ = (bounds.minZ + bounds.maxZ) * 0.5
  const ground = map.objects[groundIndex]
  const groundBox = ground.shape?.type === 'box' ? ground.shape : null
  const groundHeight = groundBox?.height ?? 0.1

  const terrain = ensureTerrainHeightfield({
    width,
    height: depth,
    resolution: map.terrain.resolution,
    heights: map.terrain.heights,
    surfaces: map.terrain.surfaces,
  })

  const changed =
    !groundBox ||
    Math.abs(groundBox.width - width) > 0.01 ||
    Math.abs(groundBox.depth - depth) > 0.01 ||
    Math.abs(ground.transform.position.x - centerX) > 0.01 ||
    Math.abs(ground.transform.position.z - centerZ) > 0.01 ||
    map.terrain.width !== width ||
    map.terrain.height !== depth

  if (!changed) {
    return { map, changed: false }
  }

  const objects = [...map.objects]
  objects[groundIndex] = {
    ...ground,
    transform: {
      ...ground.transform,
      position: {
        ...ground.transform.position,
        x: centerX,
        z: centerZ,
      },
    },
    shape: {
      type: 'box',
      width,
      height: groundHeight,
      depth,
    },
  }

  return {
    map: {
      ...map,
      objects,
      terrain,
    },
    changed: true,
  }
}
