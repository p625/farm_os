import type { MapObject, MapPolygonPoint, MapPolygonShape } from '@/types/world-map.ts'
import type { ParcelFootprint } from '@/types/parcel.ts'
import { isMapPolygonShape } from '@/types/world-map.ts'

export const MIN_PARCEL_POLYGON_POINTS = 3
export const MIN_PARCEL_POLYGON_AREA = 16
export const PARCEL_ROAD_ACCESS_MAX_DISTANCE = 35

export function getFieldPolygonPoints(object: MapObject): MapPolygonPoint[] | null {
  if (object.shape && isMapPolygonShape(object.shape)) {
    return object.shape.points.map((point) => ({ ...point }))
  }
  if (object.shape?.type === 'box') {
    const { width, depth } = object.shape
    const { x, z } = object.transform.position
    const rotationY = object.transform.rotationY ?? 0
    const halfW = width * 0.5
    const halfD = depth * 0.5
    const corners = [
      { x: -halfW, z: -halfD },
      { x: halfW, z: -halfD },
      { x: halfW, z: halfD },
      { x: -halfW, z: halfD },
    ]
    const cos = Math.cos(rotationY)
    const sin = Math.sin(rotationY)
    return corners.map((corner) => ({
      x: x + corner.x * cos - corner.z * sin,
      z: z + corner.x * sin + corner.z * cos,
    }))
  }
  return null
}

export function polygonCentroid(points: readonly MapPolygonPoint[]): MapPolygonPoint {
  if (points.length === 0) {
    return { x: 0, z: 0 }
  }
  let sumX = 0
  let sumZ = 0
  for (const point of points) {
    sumX += point.x
    sumZ += point.z
  }
  return { x: sumX / points.length, z: sumZ / points.length }
}

export function polygonBoundingFootprint(
  points: readonly MapPolygonPoint[],
): ParcelFootprint {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const point of points) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minZ = Math.min(minZ, point.z)
    maxZ = Math.max(maxZ, point.z)
  }
  const width = maxX - minX
  const depth = maxZ - minZ
  const center = polygonCentroid(points)
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width,
    depth,
    centerX: center.x,
    centerZ: center.z,
  }
}

export function polygonSignedArea(points: readonly MapPolygonPoint[]): number {
  if (points.length < 3) {
    return 0
  }
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]
    const next = points[(index + 1) % points.length]
    area += current.x * next.z - next.x * current.z
  }
  return area * 0.5
}

export function polygonArea(points: readonly MapPolygonPoint[]): number {
  return Math.abs(polygonSignedArea(points))
}

function segmentsIntersect(
  a1: MapPolygonPoint,
  a2: MapPolygonPoint,
  b1: MapPolygonPoint,
  b2: MapPolygonPoint,
): boolean {
  const cross = (p: MapPolygonPoint, q: MapPolygonPoint, r: MapPolygonPoint) =>
    (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x)

  const d1 = cross(a1, a2, b1)
  const d2 = cross(a1, a2, b2)
  const d3 = cross(b1, b2, a1)
  const d4 = cross(b1, b2, a2)

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true
  }
  return false
}

export function polygonSelfIntersects(points: readonly MapPolygonPoint[]): boolean {
  if (points.length < 4) {
    return false
  }
  const edgeCount = points.length
  for (let i = 0; i < edgeCount; i += 1) {
    const a1 = points[i]
    const a2 = points[(i + 1) % edgeCount]
    for (let j = i + 1; j < edgeCount; j += 1) {
      if (j === i || j === i + 1 || (i === 0 && j === edgeCount - 1)) {
        continue
      }
      const b1 = points[j]
      const b2 = points[(j + 1) % edgeCount]
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true
      }
    }
  }
  return false
}

export function translatePolygonPoints(
  points: readonly MapPolygonPoint[],
  deltaX: number,
  deltaZ: number,
): MapPolygonPoint[] {
  return points.map((point) => ({
    x: point.x + deltaX,
    z: point.z + deltaZ,
  }))
}

export function distancePointToSegment(
  point: MapPolygonPoint,
  a: MapPolygonPoint,
  b: MapPolygonPoint,
): number {
  const abX = b.x - a.x
  const abZ = b.z - a.z
  const lengthSq = abX * abX + abZ * abZ
  if (lengthSq < 1e-9) {
    return Math.hypot(point.x - a.x, point.z - a.z)
  }
  const t = Math.max(
    0,
    Math.min(1, ((point.x - a.x) * abX + (point.z - a.z) * abZ) / lengthSq),
  )
  const projX = a.x + t * abX
  const projZ = a.z + t * abZ
  return Math.hypot(point.x - projX, point.z - projZ)
}

export function distancePointToPolyline(
  point: MapPolygonPoint,
  polyline: readonly MapPolygonPoint[],
): number {
  if (polyline.length === 0) {
    return Infinity
  }
  if (polyline.length === 1) {
    return Math.hypot(point.x - polyline[0].x, point.z - polyline[0].z)
  }
  let min = Infinity
  for (let index = 0; index < polyline.length - 1; index += 1) {
    min = Math.min(
      min,
      distancePointToSegment(point, polyline[index], polyline[index + 1]),
    )
  }
  return min
}

export function createPolygonShape(
  points: readonly MapPolygonPoint[],
  height: number,
): MapPolygonShape {
  return {
    type: 'polygon',
    points: points.map((point) => ({ x: point.x, z: point.z })),
    height,
  }
}

export function rectToPolygonPoints(rect: {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}): MapPolygonPoint[] {
  return [
    { x: rect.minX, z: rect.minZ },
    { x: rect.maxX, z: rect.minZ },
    { x: rect.maxX, z: rect.maxZ },
    { x: rect.minX, z: rect.maxZ },
  ]
}
