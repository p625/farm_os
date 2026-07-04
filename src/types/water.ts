import type { MapVec3 } from '@/types/world-map.ts'

export const WATER_TYPE_IDS = [
  'water_river_medium',
  'water_stream_small',
  'water_pool',
  'water_pond_small',
  'water_pond_large',
] as const

export type WaterTypeId = (typeof WATER_TYPE_IDS)[number]

export const WATER_PLACEMENT_KINDS = ['spline', 'area'] as const
export type WaterPlacementKind = (typeof WATER_PLACEMENT_KINDS)[number]

export interface WaterControlPoint extends MapVec3 {}

export interface WaterSplineProperties {
  waterType: WaterTypeId
  placementKind: 'spline'
  points: WaterControlPoint[]
}

export interface WaterAreaProperties {
  waterType: WaterTypeId
  placementKind: 'area'
  radiusX: number
  radiusZ: number
}

export type WaterProperties = WaterSplineProperties | WaterAreaProperties

export function isWaterTypeId(value: unknown): value is WaterTypeId {
  return (
    typeof value === 'string' &&
    (WATER_TYPE_IDS as readonly string[]).includes(value)
  )
}

export function parseWaterProperties(
  properties: Record<string, unknown> | undefined,
): WaterProperties | null {
  if (!properties || !isWaterTypeId(properties.waterType)) {
    return null
  }
  const placementKind = properties.placementKind
  if (placementKind === 'spline' && Array.isArray(properties.points)) {
    const points: WaterControlPoint[] = []
    for (const entry of properties.points) {
      if (
        entry &&
        typeof entry === 'object' &&
        typeof (entry as WaterControlPoint).x === 'number' &&
        typeof (entry as WaterControlPoint).y === 'number' &&
        typeof (entry as WaterControlPoint).z === 'number'
      ) {
        points.push({
          x: (entry as WaterControlPoint).x,
          y: (entry as WaterControlPoint).y,
          z: (entry as WaterControlPoint).z,
        })
      }
    }
    if (points.length < 2) {
      return null
    }
    return {
      waterType: properties.waterType,
      placementKind: 'spline',
      points,
    }
  }
  if (
    placementKind === 'area' &&
    typeof properties.radiusX === 'number' &&
    typeof properties.radiusZ === 'number'
  ) {
    return {
      waterType: properties.waterType,
      placementKind: 'area',
      radiusX: properties.radiusX,
      radiusZ: properties.radiusZ,
    }
  }
  return null
}

export function getWaterPoints(object: {
  properties?: Record<string, unknown>
}): WaterControlPoint[] | null {
  const props = parseWaterProperties(object.properties)
  if (!props || props.placementKind !== 'spline') {
    return null
  }
  return props.points
}
