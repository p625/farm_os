import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'
import {
  ensureTerrainHeightfield,
  sampleTerrainHeightBilinear,
} from '@/studio/terrain/TerrainHeightmap.ts'

/** Root transform Y offset — machine meshes are authored with wheels at local y≈0. */
export const DEFAULT_MACHINE_GROUND_OFFSET = 0

const FLOATING_Y_REPAIR_TOLERANCE = 1.5

export function getTerrainHeightAt(worldX: number, worldZ: number): number {
  const worldMap = tryGetActiveMapContext()?.worldMap
  if (!worldMap) {
    return 0
  }

  const ground = worldMap.objects.find((entry) => entry.id === 'terrain_ground')
  const field = ensureTerrainHeightfield(worldMap.terrain)
  const originX = ground?.transform.position.x ?? 0
  const originZ = ground?.transform.position.z ?? 0
  const baseY = ground?.transform.position.y ?? 0

  return sampleTerrainHeightBilinear(
    field,
    originX,
    originZ,
    baseY,
    worldX,
    worldZ,
  )
}

export function getGroundedPosition(
  x: number,
  z: number,
  offset = DEFAULT_MACHINE_GROUND_OFFSET,
): { x: number; y: number; z: number } {
  return {
    x,
    y: getTerrainHeightAt(x, z) + offset,
    z,
  }
}

export function groundVec3(
  position: { x: number; y?: number; z: number },
  offset = DEFAULT_MACHINE_GROUND_OFFSET,
): { x: number; y: number; z: number } {
  return getGroundedPosition(position.x, position.z, offset)
}

export function groundSavedPosition(position: {
  x: number
  y: number
  z: number
}): { x: number; y: number; z: number } {
  const grounded = getGroundedPosition(position.x, position.z)
  if (Math.abs(position.y - grounded.y) <= FLOATING_Y_REPAIR_TOLERANCE) {
    return { ...position }
  }
  return grounded
}
