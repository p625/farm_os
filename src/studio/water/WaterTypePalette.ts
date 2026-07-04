import type { WaterPlacementKind, WaterTypeId } from '@/types/water.ts'

export interface WaterTypeDefinition {
  id: WaterTypeId
  label: string
  placementKind: WaterPlacementKind
  /** Ribbon width for spline types (meters). */
  width?: number
  /** Default ellipse radii for area types (meters). */
  defaultRadiusX?: number
  defaultRadiusZ?: number
  minAreaRadius?: number
  color: readonly [number, number, number]
  depthOffset: number
}

export const WATER_TYPES: readonly WaterTypeDefinition[] = [
  {
    id: 'water_river_medium',
    label: 'Střední řeka',
    placementKind: 'spline',
    width: 14,
    color: [0.16, 0.34, 0.52],
    depthOffset: 0.12,
  },
  {
    id: 'water_stream_small',
    label: 'Malý potok',
    placementKind: 'spline',
    width: 3,
    color: [0.2, 0.38, 0.5],
    depthOffset: 0.06,
  },
  {
    id: 'water_pool',
    label: 'Tůň',
    placementKind: 'area',
    defaultRadiusX: 4,
    defaultRadiusZ: 3,
    minAreaRadius: 2,
    color: [0.18, 0.36, 0.48],
    depthOffset: 0.08,
  },
  {
    id: 'water_pond_small',
    label: 'Malé jezírko',
    placementKind: 'area',
    defaultRadiusX: 9,
    defaultRadiusZ: 7,
    minAreaRadius: 4,
    color: [0.15, 0.32, 0.5],
    depthOffset: 0.1,
  },
  {
    id: 'water_pond_large',
    label: 'Menší rybník',
    placementKind: 'area',
    defaultRadiusX: 16,
    defaultRadiusZ: 13,
    minAreaRadius: 6,
    color: [0.14, 0.3, 0.48],
    depthOffset: 0.14,
  },
] as const

export const DEFAULT_WATER_TYPE: WaterTypeId = 'water_river_medium'

export function getWaterTypeDefinition(typeId: WaterTypeId): WaterTypeDefinition {
  return WATER_TYPES.find((entry) => entry.id === typeId) ?? WATER_TYPES[0]
}

export function isSplineWaterType(typeId: WaterTypeId): boolean {
  return getWaterTypeDefinition(typeId).placementKind === 'spline'
}

export function isAreaWaterType(typeId: WaterTypeId): boolean {
  return getWaterTypeDefinition(typeId).placementKind === 'area'
}
