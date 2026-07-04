import { getActiveFarmHub, getActiveFieldLayout, getActiveWorldBounds } from '@/config/farm-layout.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import { parseVegetationProperties } from '@/types/vegetation.ts'
import type {
  VegetationFieldRect,
  VegetationForestRect,
  VegetationLayerType,
  VegetationMapPoint,
  VegetationPlacementContext,
  VegetationRoadRect,
} from '@/types/vegetation-rendering.ts'

const FOREST_ZONES: readonly VegetationForestRect[] = [
  { minX: -52, maxX: -28, minZ: -48, maxZ: -18 },
  { minX: 58, maxX: 82, minZ: 20, maxZ: 58 },
  { minX: -18, maxX: 8, minZ: 42, maxZ: 62 },
] as const

const HEDGEROW_LINES: Array<{ x1: number; z1: number; x2: number; z2: number }> = [
  { x1: -8, z1: -22, x2: 42, z2: -22 },
  { x1: 35, z1: 16, x2: 72, z2: 16 },
] as const

const TREE_LINES: Array<{ x1: number; z1: number; x2: number; z2: number }> = [
  { x1: -45, z1: 8, x2: -45, z2: 48 },
  { x1: 68, z1: -10, x2: 68, z2: 35 },
] as const

export function buildVegetationPlacementContext(
  worldMap?: WorldMapDocument | null,
): VegetationPlacementContext {
  const bounds = getActiveWorldBounds()
  return {
    worldMinX: bounds.minX,
    worldMaxX: bounds.maxX,
    worldMinZ: bounds.minZ,
    worldMaxZ: bounds.maxZ,
    fieldRects: buildFieldRects(),
    roadRects: buildRoadRects(),
    forestRects: FOREST_ZONES,
    mapTreePoints: worldMap ? collectMapVegetationPoints(worldMap) : [],
  }
}

function buildFieldRects(): VegetationFieldRect[] {
  return getActiveFieldLayout().map((field) => {
    const halfW = field.meshSize.width / 2
    const halfD = field.meshSize.depth / 2
    return {
      id: field.id,
      minX: field.position.x - halfW,
      maxX: field.position.x + halfW,
      minZ: field.position.z - halfD,
      maxZ: field.position.z + halfD,
      isArable: true,
    }
  })
}

function buildRoadRects(): VegetationRoadRect[] {
  const hub = getActiveFarmHub().barn.position
  const segments: VegetationRoadRect[] = [
    { x: hub.x - 4, z: hub.z + 10, halfWidth: 7, halfDepth: 1.2 },
    { x: hub.x - 12, z: hub.z, halfWidth: 1.2, halfDepth: 11 },
    { x: 35, z: 16, halfWidth: 20, halfDepth: 1.4 },
    { x: 10, z: -2, halfWidth: 1.1, halfDepth: 14 },
    { x: -8, z: -22, halfWidth: 18, halfDepth: 1.3 },
    { x: 42, z: -18, halfWidth: 1.1, halfDepth: 12 },
  ]
  return segments
}

function collectMapVegetationPoints(worldMap: WorldMapDocument): VegetationMapPoint[] {
  const points: VegetationMapPoint[] = []
  for (const object of worldMap.objects) {
    if (object.layer !== 'vegetation') {
      continue
    }
    const props = parseVegetationProperties(object.properties)
    if (!props) {
      continue
    }
    const layerType = mapVegetationTypeToLayer(props.vegetationType)
    points.push({
      x: object.transform.position.x,
      y: object.transform.position.y,
      z: object.transform.position.z,
      rotationY: object.transform.rotationY ?? 0,
      layerType,
      scale: 1,
    })
  }
  return points
}

function mapVegetationTypeToLayer(typeId: string): VegetationLayerType {
  if (typeId.startsWith('grass_short')) {
    return 'short_grass'
  }
  if (typeId.startsWith('grass_')) {
    return 'meadow_grass'
  }
  if (typeId.startsWith('shrub_')) {
    return 'shrub'
  }
  return 'scattered_tree'
}

export function isInsideRoad(
  context: VegetationPlacementContext,
  x: number,
  z: number,
  padding = 0.8,
): boolean {
  return context.roadRects.some(
    (road) =>
      Math.abs(x - road.x) <= road.halfWidth + padding &&
      Math.abs(z - road.z) <= road.halfDepth + padding,
  )
}

export function distanceToFieldEdge(
  context: VegetationPlacementContext,
  x: number,
  z: number,
): number {
  let best = Number.POSITIVE_INFINITY
  for (const field of context.fieldRects) {
    const dx = Math.max(field.minX - x, 0, x - field.maxX)
    const dz = Math.max(field.minZ - z, 0, z - field.maxZ)
    if (dx === 0 && dz === 0) {
      const innerDx = Math.min(x - field.minX, field.maxX - x)
      const innerDz = Math.min(z - field.minZ, field.maxZ - z)
      best = Math.min(best, Math.min(innerDx, innerDz))
    } else {
      best = Math.min(best, Math.hypot(dx, dz))
    }
  }
  return best
}

export function isInsideFieldCenter(
  context: VegetationPlacementContext,
  x: number,
  z: number,
  inset = 2.5,
): boolean {
  for (const field of context.fieldRects) {
    if (
      x > field.minX + inset &&
      x < field.maxX - inset &&
      z > field.minZ + inset &&
      z < field.maxZ - inset
    ) {
      return true
    }
  }
  return false
}

export function distanceToForestEdge(
  context: VegetationPlacementContext,
  x: number,
  z: number,
): number {
  let best = Number.POSITIVE_INFINITY
  for (const forest of context.forestRects) {
    const dx = Math.max(forest.minX - x, 0, x - forest.maxX)
    const dz = Math.max(forest.minZ - z, 0, z - forest.maxZ)
    if (dx === 0 && dz === 0) {
      const innerDx = Math.min(x - forest.minX, forest.maxX - x)
      const innerDz = Math.min(z - forest.minZ, forest.maxZ - z)
      best = Math.min(best, Math.min(innerDx, innerDz))
    } else {
      best = Math.min(best, Math.hypot(dx, dz))
    }
  }
  return best
}

export function distanceToLine(
  x: number,
  z: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
): number {
  const dx = x2 - x1
  const dz = z2 - z1
  const lengthSq = dx * dx + dz * dz
  if (lengthSq <= 0.0001) {
    return Math.hypot(x - x1, z - z1)
  }
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (z - z1) * dz) / lengthSq))
  const px = x1 + t * dx
  const pz = z1 + t * dz
  return Math.hypot(x - px, z - pz)
}

export function distanceToHedgerow(_context: VegetationPlacementContext, x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY
  for (const line of HEDGEROW_LINES) {
    best = Math.min(best, distanceToLine(x, z, line.x1, line.z1, line.x2, line.z2))
  }
  return best
}

export function distanceToTreeLine(_context: VegetationPlacementContext, x: number, z: number): number {
  let best = Number.POSITIVE_INFINITY
  for (const line of TREE_LINES) {
    best = Math.min(best, distanceToLine(x, z, line.x1, line.z1, line.x2, line.z2))
  }
  return best
}

export function evaluatePlacementWeight(
  layerId: VegetationLayerType,
  context: VegetationPlacementContext,
  x: number,
  z: number,
): number {
  if (isInsideRoad(context, x, z)) {
    return layerId === 'roadside_grass' ? 1 : 0
  }

  const fieldEdge = distanceToFieldEdge(context, x, z)
  const forestEdge = distanceToForestEdge(context, x, z)
  const hedgerow = distanceToHedgerow(context, x, z)
  const treeLine = distanceToTreeLine(context, x, z)

  switch (layerId) {
    case 'short_grass':
      if (isInsideFieldCenter(context, x, z)) {
        return 0.08
      }
      return 0.55 + (forestEdge < 8 ? 0.15 : 0)
  case 'meadow_grass':
      if (isInsideFieldCenter(context, x, z, 4)) {
        return 0.05
      }
      return 0.45
    case 'field_margin':
      return fieldEdge < 2.8 ? 1 - fieldEdge / 2.8 : 0
    case 'roadside_grass':
      return context.roadRects.reduce((best, road) => {
        const dist = Math.hypot(x - road.x, z - road.z) - Math.max(road.halfWidth, road.halfDepth)
        return Math.max(best, dist < 3.5 ? 1 - Math.max(0, dist) / 3.5 : 0)
      }, 0)
    case 'shrub':
      return Math.max(
        fieldEdge < 3.5 ? 0.75 : 0,
        forestEdge < 5 ? 0.55 : 0,
        hedgerow < 2.5 ? 0.65 : 0,
      )
    case 'hedgerow':
      return hedgerow < 2.2 ? 1 - hedgerow / 2.2 : 0
    case 'forest_edge':
      return forestEdge < 6 ? 1 - forestEdge / 6 : 0
    case 'tree_line':
      return treeLine < 3.5 ? 1 - treeLine / 3.5 : 0
    case 'scattered_tree':
      if (isInsideFieldCenter(context, x, z, 3)) {
        return 0
      }
      if (forestEdge < 18 && forestEdge > 1.5) {
        return 0.35
      }
      return treeLine < 5 ? 0.25 : 0.08
    default:
      return 0
  }
}

export function shouldRejectPlacement(
  layerId: VegetationLayerType,
  context: VegetationPlacementContext,
  x: number,
  z: number,
): boolean {
  if (layerId !== 'roadside_grass' && isInsideRoad(context, x, z, 0.5)) {
    return true
  }
  if (
    (layerId === 'short_grass' || layerId === 'meadow_grass' || layerId === 'scattered_tree') &&
    isInsideFieldCenter(context, x, z, 1.5)
  ) {
    return true
  }
  return evaluatePlacementWeight(layerId, context, x, z) <= 0.001
}
