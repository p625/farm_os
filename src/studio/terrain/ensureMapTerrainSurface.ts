import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import { ensureTerrainHeightfield } from '@/studio/terrain/TerrainHeightmap.ts'
import { TERRAIN_POLYGON_KIND } from '@/types/terrain-polygon.ts'
import { createTerrainPolygonObject } from '@/studio/terrain/terrainPolygonObject.ts'
import { rectToPolygonPoints } from '@/studio/parcel/ParcelPolygon.ts'

const DEFAULT_TERRAIN_WIDTH = 4000
const DEFAULT_TERRAIN_DEPTH = 4000
const DEFAULT_TERRAIN_RESOLUTION = 32
const SYSTEM_FALLBACK_PROPERTY = 'systemFallback'

export function hasTerrainGround(map: WorldMapDocument): boolean {
  return map.objects.some((object) => object.id === 'terrain_ground')
}

export function hasTerrainPolygon(map: WorldMapDocument): boolean {
  return map.objects.some((object) => object.kind === TERRAIN_POLYGON_KIND)
}

export function isSystemTerrainPolygon(object: MapObject): boolean {
  return object.properties?.[SYSTEM_FALLBACK_PROPERTY] === true
}

/**
 * Ensures every map has a renderable heightfield ground mesh source (`terrain_ground`)
 * and compatible terrain heightfield dimensions. Optionally adds a non-rendered
 * terrain_polygon bounds record when missing (metadata only).
 */
export function ensureMapTerrainSurface(map: WorldMapDocument): WorldMapDocument {
  let next = syncTerrainHeightfieldWithGround(map)
  next = ensureTerrainGroundObject(next)
  next = ensureTerrainPolygonBoundsFallback(next)
  return next
}

function syncTerrainHeightfieldWithGround(map: WorldMapDocument): WorldMapDocument {
  const ground = map.objects.find((object) => object.id === 'terrain_ground')
  const field = ensureTerrainHeightfield(map.terrain)

  let width = field.width > 0 ? field.width : DEFAULT_TERRAIN_WIDTH
  let depth = field.height > 0 ? field.height : DEFAULT_TERRAIN_DEPTH

  if (ground?.shape?.type === 'box') {
    if (ground.shape.width > 0) {
      width = ground.shape.width
    }
    if (ground.shape.depth > 0) {
      depth = ground.shape.depth
    }
  }

  const resolution = map.terrain.resolution ?? field.resolution ?? DEFAULT_TERRAIN_RESOLUTION
  const terrain = ensureTerrainHeightfield({
    width,
    height: depth,
    resolution,
    heights: map.terrain.heights,
    surfaces: map.terrain.surfaces,
  })

  if (
    terrain.width === map.terrain.width &&
    terrain.height === map.terrain.height &&
    (map.terrain.resolution ?? DEFAULT_TERRAIN_RESOLUTION) === terrain.resolution
  ) {
    return map
  }

  return {
    ...map,
    terrain,
  }
}

function ensureTerrainGroundObject(map: WorldMapDocument): WorldMapDocument {
  const index = map.objects.findIndex((object) => object.id === 'terrain_ground')
  const field = ensureTerrainHeightfield(map.terrain)
  const width = field.width > 0 ? field.width : DEFAULT_TERRAIN_WIDTH
  const depth = field.height > 0 ? field.height : DEFAULT_TERRAIN_DEPTH

  if (index < 0) {
    const ground: MapObject = {
      id: 'terrain_ground',
      layer: 'terrain',
      kind: 'ground',
      name: 'Ground',
      transform: { position: { x: 0, y: 0, z: 0 } },
      shape: { type: 'box', width, height: 0.1, depth },
    }
    return {
      ...map,
      objects: [ground, ...map.objects],
    }
  }

  const ground = map.objects[index]
  if (ground.shape?.type !== 'box') {
    const objects = [...map.objects]
    objects[index] = {
      ...ground,
      layer: 'terrain',
      kind: 'ground',
      shape: { type: 'box', width, height: 0.1, depth },
    }
    return { ...map, objects }
  }

  const needsWidth = ground.shape.width <= 0
  const needsDepth = ground.shape.depth <= 0
  if (!needsWidth && !needsDepth) {
    return map
  }

  const objects = [...map.objects]
  objects[index] = {
    ...ground,
    shape: {
      ...ground.shape,
      width: needsWidth ? width : ground.shape.width,
      depth: needsDepth ? depth : ground.shape.depth,
    },
  }
  return { ...map, objects }
}

function ensureTerrainPolygonBoundsFallback(map: WorldMapDocument): WorldMapDocument {
  if (hasTerrainPolygon(map)) {
    return map
  }

  const ground = map.objects.find((object) => object.id === 'terrain_ground')
  if (!ground || ground.shape?.type !== 'box') {
    return map
  }

  const originX = ground.transform.position.x
  const originZ = ground.transform.position.z
  const halfW = ground.shape.width * 0.5
  const halfD = ground.shape.depth * 0.5
  const points = rectToPolygonPoints({
    minX: originX - halfW,
    maxX: originX + halfW,
    minZ: originZ - halfD,
    maxZ: originZ + halfD,
  })

  const boundsPolygon = createTerrainPolygonObject(points, map, {
    surfaceY: ground.transform.position.y,
    name: 'Terrain Bounds',
    baseHeight: 0,
    baseMaterial: 'grass',
  })

  return {
    ...map,
    objects: [
      ...map.objects,
      {
        ...boundsPolygon,
        properties: {
          ...boundsPolygon.properties,
          [SYSTEM_FALLBACK_PROPERTY]: true,
        },
      },
    ],
  }
}
