import {
  DEFAULT_TERRAIN_RESOLUTION,
  type WorldMapTerrain,
} from '@/types/world-map.ts'

export type TerrainBrushMode = 'raise' | 'lower' | 'smooth' | 'paint'

export interface TerrainBrushSettings {
  mode: TerrainBrushMode
  radius: number
  strength: number
  surfaceId: number
}

export const DEFAULT_TERRAIN_BRUSH: TerrainBrushSettings = {
  mode: 'paint',
  radius: 3,
  strength: 0.08,
  surfaceId: 1,
}

export interface TerrainHeightfield {
  width: number
  height: number
  resolution: number
  heights: number[]
  surfaces: number[]
}

export function ensureTerrainHeightfield(
  terrain: WorldMapTerrain,
): TerrainHeightfield {
  const resolution = terrain.resolution ?? DEFAULT_TERRAIN_RESOLUTION
  const cellCount = resolution * resolution
  const heights =
    terrain.heights?.length === cellCount
      ? [...terrain.heights]
      : new Array<number>(cellCount).fill(0)
  const surfaces =
    terrain.surfaces?.length === cellCount
      ? [...terrain.surfaces]
      : new Array<number>(cellCount).fill(0)

  return {
    width: terrain.width,
    height: terrain.height,
    resolution,
    heights,
    surfaces,
  }
}

export function cellIndex(i: number, j: number, resolution: number): number {
  return j * resolution + i
}

export function worldToTerrainCell(
  terrain: WorldMapTerrain,
  originX: number,
  originZ: number,
  worldX: number,
  worldZ: number,
): { i: number; j: number } | null {
  const resolution = terrain.resolution ?? DEFAULT_TERRAIN_RESOLUTION
  const halfW = terrain.width * 0.5
  const halfH = terrain.height * 0.5
  const localX = worldX - originX + halfW
  const localZ = worldZ - originZ + halfH

  if (localX < 0 || localZ < 0 || localX > terrain.width || localZ > terrain.height) {
    return null
  }

  const i = Math.min(
    resolution - 1,
    Math.floor((localX / terrain.width) * resolution),
  )
  const j = Math.min(
    resolution - 1,
    Math.floor((localZ / terrain.height) * resolution),
  )
  return { i, j }
}

function brushFalloff(distance: number, radius: number): number {
  if (distance > radius) {
    return 0
  }
  const t = 1 - distance / radius
  return t * t
}

export function applyTerrainBrush(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  worldX: number,
  worldZ: number,
  brush: TerrainBrushSettings,
): void {
  const center = worldToTerrainCell(field, originX, originZ, worldX, worldZ)
  if (!center) {
    return
  }

  const { resolution, heights, surfaces } = field
  const radiusCells = Math.max(1, Math.ceil(brush.radius))
  const minI = Math.max(0, center.i - radiusCells)
  const maxI = Math.min(resolution - 1, center.i + radiusCells)
  const minJ = Math.max(0, center.j - radiusCells)
  const maxJ = Math.min(resolution - 1, center.j + radiusCells)

  for (let j = minJ; j <= maxJ; j++) {
    for (let i = minI; i <= maxI; i++) {
      const distance = Math.hypot(i - center.i, j - center.j)
      const falloff = brushFalloff(distance, brush.radius)
      if (falloff <= 0) {
        continue
      }

      const index = cellIndex(i, j, resolution)
      if (brush.mode === 'paint') {
        surfaces[index] = brush.surfaceId
        continue
      }

      if (brush.mode === 'raise') {
        heights[index] += brush.strength * falloff
      } else if (brush.mode === 'lower') {
        heights[index] -= brush.strength * falloff
      } else if (brush.mode === 'smooth') {
        let sum = 0
        let count = 0
        for (let nj = j - 1; nj <= j + 1; nj++) {
          for (let ni = i - 1; ni <= i + 1; ni++) {
            if (ni < 0 || nj < 0 || ni >= resolution || nj >= resolution) {
              continue
            }
            sum += heights[cellIndex(ni, nj, resolution)]
            count += 1
          }
        }
        const average = sum / count
        heights[index] += (average - heights[index]) * brush.strength * falloff
      }
    }
  }
}

export function brushRadiusWorldUnits(
  terrain: Pick<TerrainHeightfield, 'width' | 'height' | 'resolution'>,
  radiusCells: number,
): number {
  const cellW = terrain.width / terrain.resolution
  const cellH = terrain.height / terrain.resolution
  const cellSize = (cellW + cellH) * 0.5
  return Math.max(0.1, radiusCells * cellSize)
}

export function sampleTerrainHeightAt(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  worldX: number,
  worldZ: number,
  baseY: number,
): number {
  const cell = worldToTerrainCell(field, originX, originZ, worldX, worldZ)
  if (!cell) {
    return baseY
  }
  const index = cellIndex(cell.i, cell.j, field.resolution)
  return baseY + field.heights[index]
}

export function mergeTerrainIntoDocument(
  terrain: WorldMapTerrain,
  field: TerrainHeightfield,
): WorldMapTerrain {
  return {
    ...terrain,
    resolution: field.resolution,
    heights: [...field.heights],
    surfaces: [...field.surfaces],
  }
}
