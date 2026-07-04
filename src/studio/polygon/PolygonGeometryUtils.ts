export {
  MIN_PARCEL_POLYGON_POINTS as MIN_POLYGON_POINTS,
  MIN_PARCEL_POLYGON_AREA as MIN_POLYGON_AREA,
  PARCEL_ROAD_ACCESS_MAX_DISTANCE,
  getFieldPolygonPoints as getObjectPolygonPoints,
  polygonCentroid,
  polygonBoundingFootprint,
  polygonSignedArea,
  polygonArea,
  polygonSelfIntersects,
  translatePolygonPoints,
  distancePointToSegment,
  distancePointToPolyline,
  createPolygonShape,
  rectToPolygonPoints,
} from '@/studio/parcel/ParcelPolygon.ts'

import type { MapPolygonPoint } from '@/types/world-map.ts'

const ADJACENT_EPSILON = 0.05

export function hasDuplicateAdjacentVertices(
  points: readonly MapPolygonPoint[],
): boolean {
  if (points.length < 2) {
    return false
  }
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    if (Math.hypot(current.x - next.x, current.z - next.z) < ADJACENT_EPSILON) {
      return true
    }
  }
  return false
}

export function rotatePolygonPoints(
  points: readonly MapPolygonPoint[],
  pivotX: number,
  pivotZ: number,
  deltaRotationY: number,
): MapPolygonPoint[] {
  const cos = Math.cos(deltaRotationY)
  const sin = Math.sin(deltaRotationY)
  return points.map((point) => {
    const offsetX = point.x - pivotX
    const offsetZ = point.z - pivotZ
    return {
      x: pivotX + offsetX * cos - offsetZ * sin,
      z: pivotZ + offsetX * sin + offsetZ * cos,
    }
  })
}

export function isNearPoint(
  x: number,
  z: number,
  point: MapPolygonPoint,
  radius: number,
): boolean {
  return Math.hypot(point.x - x, point.z - z) <= radius
}
