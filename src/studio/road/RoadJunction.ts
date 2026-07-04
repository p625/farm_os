import type { WorldMapDocument } from '@/types/world-map.ts'
import type { RoadControlPoint, RoadKind, RoadPointJunction } from '@/types/road.ts'
import { getRoadKind, getRoadObjects, getRoadPoints } from '@/studio/road/roadObject.ts'
import { getRoadTypeDefinition } from '@/studio/road/RoadTypePalette.ts'
import { sampleRoadSpline } from '@/studio/road/RoadSpline.ts'

const CONTROL_SNAP_RADIUS = 1.8
const SPLINE_SNAP_RADIUS = 3.5
const SPLINE_SAMPLES_PER_SEGMENT = 14

export function isAsphaltKind(kind: RoadKind): boolean {
  return kind === 'asphalt_wide' || kind === 'asphalt_narrow'
}

export function resolveJunctionJoin(
  newRoadKind: RoadKind,
  existingRoadKind: RoadKind,
): RoadPointJunction['join'] {
  if (isAsphaltKind(newRoadKind) && isAsphaltKind(existingRoadKind)) {
    return 'merge'
  }
  return 'edge'
}

export function getJunctionTrimDistance(junction: RoadPointJunction): number {
  if (junction.join === 'merge') {
    return 0
  }
  return getRoadTypeDefinition(junction.roadKind).width * 0.5
}

export interface RoadSnapHit {
  roadId: string
  roadKind: RoadKind
  x: number
  z: number
  distance: number
}

export function findNearestRoadSnap(
  map: WorldMapDocument,
  worldX: number,
  worldZ: number,
  options: {
    excludeRoadIds?: readonly string[]
    maxDistance?: number
  } = {},
): RoadSnapHit | null {
  const exclude = new Set(options.excludeRoadIds ?? [])
  let best: RoadSnapHit | null = null
  const maxDistance = options.maxDistance ?? SPLINE_SNAP_RADIUS

  for (const road of getRoadObjects(map)) {
    if (exclude.has(road.id)) {
      continue
    }
    const roadKind = getRoadKind(road)
    const points = getRoadPoints(road)
    if (!roadKind || !points || points.length < 2) {
      continue
    }

    for (const point of points) {
      const distance = Math.hypot(point.x - worldX, point.z - worldZ)
      if (distance > CONTROL_SNAP_RADIUS) {
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
      if (distance > maxDistance) {
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

export function buildSnappedRoadPoint(
  baseY: number,
  newRoadKind: RoadKind,
  snap: RoadSnapHit,
): RoadControlPoint {
  const join = resolveJunctionJoin(newRoadKind, snap.roadKind)
  return {
    x: snap.x,
    y: baseY,
    z: snap.z,
    junction: {
      roadId: snap.roadId,
      roadKind: snap.roadKind,
      join,
    },
  }
}

export function trySnapRoadPoint(
  map: WorldMapDocument,
  point: RoadControlPoint,
  newRoadKind: RoadKind,
  excludeRoadIds: readonly string[] = [],
): RoadControlPoint {
  const snap = findNearestRoadSnap(map, point.x, point.z, { excludeRoadIds })
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

/** Mesh-only trim: keeps junction anchor on centerline, shortens ribbon past road edges. */
export function trimControlPointsForMesh(
  points: readonly RoadControlPoint[],
  _roadKind: RoadKind,
): RoadControlPoint[] {
  if (points.length < 2) {
    return points.map((point) => ({ ...point }))
  }

  const result = points.map((point) => ({ ...point }))

  const startJunction = result[0].junction
  if (startJunction) {
    const trim = getJunctionTrimDistance(startJunction)
    if (trim > 0) {
      const outgoing = planarUnitDir(result[0], result[1])
      result[0].x += outgoing.x * trim
      result[0].z += outgoing.z * trim
    }
  }

  const endIndex = result.length - 1
  const endJunction = result[endIndex].junction
  if (endJunction) {
    const trim = getJunctionTrimDistance(endJunction)
    if (trim > 0) {
      const incoming = planarUnitDir(result[endIndex], result[endIndex - 1])
      result[endIndex].x += incoming.x * trim
      result[endIndex].z += incoming.z * trim
    }
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

export function isJunctionPoint(point: RoadControlPoint): boolean {
  return Boolean(point.junction)
}
