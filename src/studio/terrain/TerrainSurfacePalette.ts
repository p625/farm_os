export interface TerrainSurfaceDefinition {
  id: number
  name: string
  color: readonly [number, number, number]
}

export const TERRAIN_SURFACES: readonly TerrainSurfaceDefinition[] = [
  { id: 0, name: 'Meadow', color: [0.26, 0.46, 0.18] },
  { id: 1, name: 'Soil', color: [0.42, 0.28, 0.16] },
  { id: 2, name: 'Path', color: [0.45, 0.4, 0.32] },
  { id: 3, name: 'Sand', color: [0.62, 0.56, 0.38] },
] as const

export function getTerrainSurfaceColor(surfaceId: number): readonly [number, number, number] {
  return TERRAIN_SURFACES[surfaceId]?.color ?? TERRAIN_SURFACES[0].color
}
