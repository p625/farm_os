import type { WorldMapDocument } from '@/types/world-map.ts'
import {
  ensureTerrainHeightfield,
  sampleTerrainHeightBilinear,
} from '@/studio/terrain/TerrainHeightmap.ts'
import { fieldParcelSurfaceY } from '@/studio/parcel/parcelObject.ts'

export function sampleFieldSurfaceY(
  map: WorldMapDocument,
  worldX: number,
  worldZ: number,
): number {
  const ground = map.objects.find((entry) => entry.id === 'terrain_ground')
  const field = ensureTerrainHeightfield(map.terrain)
  const originX = ground?.transform.position.x ?? 0
  const originZ = ground?.transform.position.z ?? 0
  const baseY = ground?.transform.position.y ?? 0
  const terrainY = sampleTerrainHeightBilinear(
    field,
    originX,
    originZ,
    baseY,
    worldX,
    worldZ,
  )
  return fieldParcelSurfaceY(terrainY)
}
