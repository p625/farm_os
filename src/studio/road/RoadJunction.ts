import type { WorldMapDocument } from '@/types/world-map.ts'
import type { RoadControlPoint, RoadKind, RoadPointJunction } from '@/types/road.ts'
import { getRoadKind, getRoadObjects, getRoadPoints } from '@/studio/road/roadObject.ts'
import { getRoadTypeDefinition } from '@/studio/road/RoadTypePalette.ts'
import { sampleRoadSpline, type SplineSample } from '@/studio/road/RoadSpline.ts'

const CONTROL_SNAP_RADIUS = 2.5
const BASE_SPLINE_SNAP_RADIUS = 6
const SPLINE_SAMPLES_PER_SEGMENT = 24
const EDGE_OVERLAP_FACTOR = 0.55

export interface JunctionMeshContext {
  map: WorldMapDocument
  roadId?: string
}

export function isAsphaltKind(kind: RoadKind): boolean {
  return kind === 'asphalt_wide' || kind === 'asphalt_narrow'
}

export function resolveJunctionJoin(
  newRoadKind: RoadKind,
  existingRoadKind: RoadKind,
): RoadPointJunction['join'] {
  if (newRoadKind === existingRoadKind) {
    return 'merge'
  }
  if (isAsphaltKind(newRoadKind) && isAsphaltKind(existingRoadKind)) {
    return 'merge'
  }
  return 'edge'
}

export function snapSearchRadius(newRoadKind: RoadKind): number {
  const ownHalf = getRoadTypeDefinition(newRoadKind).width * 0.5
  return Math.max(BASE_SPLINE_SNAP_RADIUS, ownHalf + 5)
}

function planarUnitDir(
  from: { x: number; z: number },
  to: { x: number; z: number },
): { x: number; z: number } {
  const dx = to.x - from.x
  const dz = to.z - from.z
  const length = Math.hypot(dx, dz)
  if (length < 1e-4) {
    return { x: 0, z: 1 }
  }
  return { x: dx / length, z: dz / length }
}

function edgeOverlapFill(ownHalf: number, partnerHalf: number): number {
  return Math.min(ownHalf * EDGE_OVERLAP_FACTOR, partnerHalf * 0.22)
}

function meshOffsetAtEndpoint(
  junction: RoadPointJunction,
  ownRoadKind: RoadKind,
): number {
  if (junction.join === 'merge') {
    // End ribbon at junction center — no miter past partner (avoids bleed on far side).
    return 0
  }

  const ownHalf = getRoadTypeDefinition(ownRoadKind).width * 0.5
  const partnerHalf = getRoadTypeDefinition(junction.roadKind).width * 0.5
  const overlap = edgeOverlapFill(ownHalf, partnerHalf)
  return Math.max(0, partnerHalf - overlap)
}

/** Mesh-only adjustment: merge ends at centerline; edge trims with overlap fill. */
export function adjustControlPointsForJunctionMesh(
  points: readonly RoadControlPoint[],
  roadKind: RoadKind,
  _context?: JunctionMeshContext,
): RoadControlPoint[] {
  if (points.length < 2) {
    return points.map((point) => ({ ...point }))
  }

  const result = points.map((point) => ({ ...point }))

  const startJunction = result[0].junction
  if (startJunction) {
    const intoRoad = planarUnitDir(result[0], result[1])
    const offset = meshOffsetAtEndpoint(startJunction, roadKind)
    result[0].x += intoRoad.x * offset
    result[0].z += intoRoad.z * offset
  }

  const endIndex = result.length - 1
  const endJunction = result[endIndex].junction
  if (endJunction) {
    const intoRoad = planarUnitDir(result[endIndex], result[endIndex - 1])
    const offset = meshOffsetAtEndpoint(endJunction, roadKind)
    result[endIndex].x += intoRoad.x * offset
    result[endIndex].z += intoRoad.z * offset
  }

  if (
    Math.hypot(
      result[0].x - result[endIndex].x,
      result[0].z - result[endIndex].z,
    ) < 0.05 &&
    result.length === 2
  ) {
    return points.map((point) => ({ ...point }))
  }

  return result
}

export function trimControlPointsForMesh(
  points: readonly RoadControlPoint[],
  roadKind: RoadKind,
  context?: JunctionMeshContext,
): RoadControlPoint[] {
  return adjustControlPointsForJunctionMesh(points, roadKind, context)
}

export interface RoadSnapHit {
  roadId: string
  roadKind: RoadKind
  x: number
  z: number
  distance: number
}

function roadSnapTolerance(roadKind: RoadKind, baseRadius: number): number {
  return baseRadius + getRoadTypeDefinition(roadKind).width * 0.5
}

export function findNearestRoadSnap(
  map: WorldMapDocument,
  worldX: number,
  worldZ: number,
  options: {
    excludeRoadIds?: readonly string[]
    maxDistance?: number
    newRoadKind?: RoadKind
  } = {},
): RoadSnapHit | null {
  const exclude = new Set(options.excludeRoadIds ?? [])
  const baseRadius =
    options.maxDistance ??
    (options.newRoadKind ? snapSearchRadius(options.newRoadKind) : BASE_SPLINE_SNAP_RADIUS)
  let best: RoadSnapHit | null = null

  for (const road of getRoadObjects(map)) {
    if (exclude.has(road.id)) {
      continue
    }
    const roadKind = getRoadKind(road)
    const points = getRoadPoints(road)
    if (!roadKind || !points || points.length < 2) {
      continue
    }

    const tolerance = roadSnapTolerance(roadKind, baseRadius)

    for (const point of points) {
      const distance = Math.hypot(point.x - worldX, point.z - worldZ)
      if (distance > Math.max(CONTROL_SNAP_RADIUS, tolerance * 0.35)) {
        continue
      }
      if (!best || distance < best.distance) {
        best = {
          roadId: road.id,
          roadKind,
          x: point.x,
          z: point.z,
          distance,
        }
      }
    }

    const samples = sampleRoadSpline(points, SPLINE_SAMPLES_PER_SEGMENT)
    for (const sample of samples) {
      const distance = Math.hypot(sample.x - worldX, sample.z - worldZ)
      if (distance > tolerance) {
        continue
      }
      if (!best || distance < best.distance) {
        best = {
          roadId: road.id,
          roadKind,
          x: sample.x,
          z: sample.z,
          distance,
        }
      }
    }
  }

  return best
}

export function trySnapRoadPoint(
  map: WorldMapDocument,
  point: RoadControlPoint,
  newRoadKind: RoadKind,
  excludeRoadIds: readonly string[] = [],
): RoadControlPoint {
  const snap = findNearestRoadSnap(map, point.x, point.z, {
    excludeRoadIds,
    newRoadKind,
  })
  if (!snap) {
    const { junction: _junction, ...rest } = point
    return rest
  }
  return {
    ...point,
    x: snap.x,
    z: snap.z,
    junction: {
      roadId: snap.roadId,
      roadKind: snap.roadKind,
      join: resolveJunctionJoin(newRoadKind, snap.roadKind),
    },
  }
}

export function isJunctionPoint(point: RoadControlPoint): boolean {
  return Boolean(point.junction)
}

function distanceSquaredXZ(
  a: { x: number; z: number },
  b: { x: number; z: number },
): number {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return dx * dx + dz * dz
}

function findInsertIndexOnPolyline(
  points: readonly RoadControlPoint[],
  worldX: number,
  worldZ: number,
): number {
  if (points.length < 2) {
    return points.length
  }

  let bestIndex = 1
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1]
    const end = points[index]
    const dx = end.x - start.x
    const dz = end.z - start.z
    const lengthSquared = dx * dx + dz * dz
    let t = 0.5
    if (lengthSquared > 1e-6) {
      t = ((worldX - start.x) * dx + (worldZ - start.z) * dz) / lengthSquared
      t = Math.min(1, Math.max(0, t))
    }
    const projected = {
      x: start.x + dx * t,
      z: start.z + dz * t,
    }
    const distance = distanceSquaredXZ(projected, { x: worldX, z: worldZ })
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }

  return bestIndex
}

/** Mirror junction onto anchor road so connection points appear on both roads. */
export function applyJunctionsToAnchorRoads(
  map: WorldMapDocument,
  sourceRoadId: string,
  sourceKind: RoadKind,
  points: readonly RoadControlPoint[],
): WorldMapDocument {
  let objects = [...map.objects]

  for (const point of points) {
    if (!point.junction) {
      continue
    }

    const anchorId = point.junction.roadId
    if (anchorId === sourceRoadId) {
      continue
    }

    const anchorIndex = objects.findIndex((object) => object.id === anchorId)
    if (anchorIndex < 0) {
      continue
    }

    const anchor = objects[anchorIndex]
    const anchorKind = getRoadKind(anchor)
    const anchorPoints = getRoadPoints(anchor)
    if (!anchorKind || !anchorPoints) {
      continue
    }

    const reciprocalJoin = resolveJunctionJoin(anchorKind, sourceKind)
    const reciprocal: RoadPointJunction = {
      roadId: sourceRoadId,
      roadKind: sourceKind,
      join: reciprocalJoin,
    }

    const nextPoints = anchorPoints.map((entry) => ({ ...entry }))
    const nearIndex = nextPoints.findIndex(
      (entry) => distanceSquaredXZ(entry, point) < 1.5 * 1.5,
    )

    if (nearIndex >= 0) {
      nextPoints[nearIndex] = {
        ...nextPoints[nearIndex],
        x: point.x,
        z: point.z,
        y: point.y,
        junction: reciprocal,
      }
    } else {
      const insertAt = findInsertIndexOnPolyline(nextPoints, point.x, point.z)
      nextPoints.splice(insertAt, 0, {
        x: point.x,
        y: point.y,
        z: point.z,
        junction: reciprocal,
      })
    }

    objects = [...objects]
    objects[anchorIndex] = {
      ...anchor,
      properties: {
        ...anchor.properties,
        points: nextPoints,
      },
    }
  }

  return { ...map, objects }
}

export function previewSnap(
  map: WorldMapDocument,
  worldX: number,
  worldZ: number,
  newRoadKind: RoadKind,
  excludeRoadIds: readonly string[] = [],
): { snap: RoadSnapHit; join: RoadPointJunction['join'] } | null {
  const snap = findNearestRoadSnap(map, worldX, worldZ, {
    excludeRoadIds,
    newRoadKind,
  })
  if (!snap) {
    return null
  }
  return {
    snap,
    join: resolveJunctionJoin(newRoadKind, snap.roadKind),
  }
}

export function splineSamplesForRoad(points: readonly RoadControlPoint[]): SplineSample[] {
  return sampleRoadSpline(points, SPLINE_SAMPLES_PER_SEGMENT)
}
