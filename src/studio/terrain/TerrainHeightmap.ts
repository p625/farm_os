import {
  DEFAULT_TERRAIN_RESOLUTION,
  type WorldMapTerrain,
} from '@/types/world-map.ts'
import {
  terrainGridSteps,
  terrainVertexWorldPosition,
} from '@/studio/terrain/TerrainGridMapping.ts'

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

export interface TerrainCellBounds {
  minI: number
  maxI: number
  minJ: number
  maxJ: number
}

export function applyTerrainBrush(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  worldX: number,
  worldZ: number,
  brush: TerrainBrushSettings,
): TerrainCellBounds | null {
  if (
    worldX < originX - field.width * 0.5 ||
    worldX > originX + field.width * 0.5 ||
    worldZ < originZ - field.height * 0.5 ||
    worldZ > originZ + field.height * 0.5
  ) {
    return null
  }

  if (brush.mode === 'paint') {
    const worldRadius = brushRadiusWorldUnits(field, brush.radius)
    return applyPaintBrush(
      field,
      originX,
      originZ,
      worldX,
      worldZ,
      worldRadius,
      brush.surfaceId,
    )
  }

  const center = worldToTerrainCell(field, originX, originZ, worldX, worldZ)
  if (!center) {
    return null
  }

  const { resolution, heights } = field
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

  return { minI, maxI, minJ, maxJ }
}

export function brushRadiusWorldUnits(
  terrain: Pick<TerrainHeightfield, 'width' | 'height' | 'resolution'>,
  radiusCells: number,
): number {
  const { stepX, stepZ } = terrainGridSteps(terrain as TerrainHeightfield)
  const step = (stepX + stepZ) * 0.5
  return Math.max(0.1, radiusCells * step)
}

function paintBrushBounds(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  worldX: number,
  worldZ: number,
  worldRadius: number,
): TerrainCellBounds {
  const { stepX, stepZ } = terrainGridSteps(field)
  const halfW = field.width * 0.5
  const halfH = field.height * 0.5
  const localX = worldX - originX + halfW
  const localZ = worldZ - originZ + halfH
  const resolution = field.resolution

  const minI = Math.max(0, Math.floor((localX - worldRadius) / stepX))
  const maxI = Math.min(resolution - 1, Math.ceil((localX + worldRadius) / stepX))
  const minJ = Math.max(0, Math.floor((localZ - worldRadius) / stepZ))
  const maxJ = Math.min(resolution - 1, Math.ceil((localZ + worldRadius) / stepZ))

  return { minI, maxI, minJ, maxJ }
}

function applyPaintBrush(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  worldX: number,
  worldZ: number,
  worldRadius: number,
  surfaceId: number,
): TerrainCellBounds {
  const { resolution, surfaces } = field
  const bounds = paintBrushBounds(
    field,
    originX,
    originZ,
    worldX,
    worldZ,
    worldRadius,
  )

  for (let j = bounds.minJ; j <= bounds.maxJ; j++) {
    for (let i = bounds.minI; i <= bounds.maxI; i++) {
      const vertex = terrainVertexWorldPosition(field, originX, originZ, i, j)
      const distance = Math.hypot(vertex.x - worldX, vertex.z - worldZ)
      const { stepX, stepZ } = terrainGridSteps(field)
      const gridPad = Math.max(stepX, stepZ) * 0.5
      if (distance > worldRadius + gridPad) {
        continue
      }
      surfaces[cellIndex(i, j, resolution)] = surfaceId
    }
  }

  return bounds
}

export function sampleTerrainHeightBilinear(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  baseY: number,
  worldX: number,
  worldZ: number,
): number {
  const halfW = field.width * 0.5
  const halfH = field.height * 0.5
  const localX = worldX - originX + halfW
  const localZ = worldZ - originZ + halfH

  if (localX < 0 || localZ < 0 || localX > field.width || localZ > field.height) {
    return baseY
  }

  const resolution = field.resolution
  const subdivisions = Math.max(1, resolution - 1)
  const gx = (localX / field.width) * subdivisions
  const gz = (localZ / field.height) * subdivisions
  const i0 = Math.min(resolution - 1, Math.max(0, Math.floor(gx)))
  const j0 = Math.min(resolution - 1, Math.max(0, Math.floor(gz)))
  const i1 = Math.min(resolution - 1, i0 + 1)
  const j1 = Math.min(resolution - 1, j0 + 1)
  const tx = Math.min(1, Math.max(0, gx - i0))
  const tz = Math.min(1, Math.max(0, gz - j0))

  const h00 = field.heights[cellIndex(i0, j0, resolution)]
  const h10 = field.heights[cellIndex(i1, j0, resolution)]
  const h01 = field.heights[cellIndex(i0, j1, resolution)]
  const h11 = field.heights[cellIndex(i1, j1, resolution)]
  const hx0 = h00 * (1 - tx) + h10 * tx
  const hx1 = h01 * (1 - tx) + h11 * tx
  return baseY + hx0 * (1 - tz) + hx1 * tz
}

export function applyTerrainHeightToPoint(
  field: TerrainHeightfield,
  originX: number,
  originZ: number,
  baseY: number,
  worldX: number,
  worldZ: number,
  surfaceOffset = 0.06,
): { x: number; y: number; z: number } {
  const y = sampleTerrainHeightBilinear(field, originX, originZ, baseY, worldX, worldZ)
  return { x: worldX, y: y + surfaceOffset, z: worldZ }
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
