import type { MapVec3 } from '@/types/world-map.ts'

export const ROAD_KINDS = [
  'asphalt_wide',
  'asphalt_narrow',
  'field_path',
] as const

export type RoadKind = (typeof ROAD_KINDS)[number]

export interface RoadPointJunction {
  roadId: string
  roadKind: RoadKind
  /** merge = centerline join (asphalt↔asphalt); edge = stop at partner road width */
  join: 'merge' | 'edge'
}

export interface RoadControlPoint extends MapVec3 {
  junction?: RoadPointJunction
}

export interface RoadObjectProperties {
  roadKind: RoadKind
  points: RoadControlPoint[]
}

export function isRoadKind(value: unknown): value is RoadKind {
  return typeof value === 'string' && (ROAD_KINDS as readonly string[]).includes(value)
}

function parseJunction(value: unknown): RoadPointJunction | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const entry = value as Record<string, unknown>
  if (typeof entry.roadId !== 'string' || !isRoadKind(entry.roadKind)) {
    return undefined
  }
  if (entry.join !== 'merge' && entry.join !== 'edge') {
    return undefined
  }
  return {
    roadId: entry.roadId,
    roadKind: entry.roadKind,
    join: entry.join,
  }
}

export function parseRoadProperties(
  properties: Record<string, unknown> | undefined,
): RoadObjectProperties | null {
  if (!properties || !isRoadKind(properties.roadKind)) {
    return null
  }
  const rawPoints = properties.points
  if (!Array.isArray(rawPoints) || rawPoints.length < 2) {
    return null
  }
  const points: RoadControlPoint[] = []
  for (const entry of rawPoints) {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof (entry as MapVec3).x !== 'number' ||
      typeof (entry as MapVec3).y !== 'number' ||
      typeof (entry as MapVec3).z !== 'number'
    ) {
      return null
    }
    const raw = entry as RoadControlPoint
    const junction = parseJunction(raw.junction)
    points.push({
      x: raw.x,
      y: raw.y,
      z: raw.z,
      ...(junction ? { junction } : {}),
    })
  }
  return { roadKind: properties.roadKind, points }
}
