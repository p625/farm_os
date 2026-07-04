import type { MapPolygonPoint } from '@/types/world-map.ts'

/** Editor-only Terrain Boundary (`terrain_polygon`). Never the render surface. */
export const TERRAIN_POLYGON_KIND = 'terrain_polygon'
/** Alias — boundary metadata object kind (same persisted value). */
export const TERRAIN_BOUNDARY_KIND = TERRAIN_POLYGON_KIND

export const TERRAIN_BASE_MATERIALS = [
  'grass',
  'soil',
  'rock',
  'sand',
] as const

export type TerrainBaseMaterial = (typeof TERRAIN_BASE_MATERIALS)[number]

export interface TerrainPolygonProperties {
  baseHeight: number
  baseMaterial: TerrainBaseMaterial
  bounds?: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  }
}

export function parseTerrainPolygonProperties(
  properties: Record<string, unknown> | undefined,
): TerrainPolygonProperties | null {
  if (!properties) {
    return null
  }
  const baseHeight =
    typeof properties.baseHeight === 'number' ? properties.baseHeight : 0
  const baseMaterial =
    typeof properties.baseMaterial === 'string' &&
    (TERRAIN_BASE_MATERIALS as readonly string[]).includes(properties.baseMaterial)
      ? (properties.baseMaterial as TerrainBaseMaterial)
      : 'grass'
  const boundsRaw = properties.bounds
  const bounds =
    boundsRaw &&
    typeof boundsRaw === 'object' &&
    typeof (boundsRaw as { minX?: unknown }).minX === 'number'
      ? (boundsRaw as TerrainPolygonProperties['bounds'])
      : undefined
  return { baseHeight, baseMaterial, ...(bounds ? { bounds } : {}) }
}

export function patchTerrainPolygonProperties(
  properties: Record<string, unknown>,
  patch: Partial<TerrainPolygonProperties>,
): Record<string, unknown> {
  const next = { ...properties, ...patch }
  return next
}

export function computeTerrainBounds(
  points: readonly MapPolygonPoint[],
): TerrainPolygonProperties['bounds'] {
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
  return { minX, maxX, minZ, maxZ }
}
