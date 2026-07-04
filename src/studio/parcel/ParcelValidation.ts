import type { WorldMapDocument } from '@/types/world-map.ts'
import type { ParcelFootprint } from '@/types/parcel.ts'
import { getFieldParcelFootprint } from '@/types/parcel.ts'
import {
  footprintsOverlap,
  MIN_PARCEL_FOOTPRINT,
} from '@/studio/parcel/ParcelMath.ts'

export interface ParcelValidationResult {
  ok: boolean
  message?: string
}

export function validateParcelFootprint(
  map: WorldMapDocument,
  footprint: ParcelFootprint,
  excludeFieldId?: string,
): ParcelValidationResult {
  if (footprint.width < MIN_PARCEL_FOOTPRINT || footprint.depth < MIN_PARCEL_FOOTPRINT) {
    return {
      ok: false,
      message: `Parcel must be at least ${MIN_PARCEL_FOOTPRINT}×${MIN_PARCEL_FOOTPRINT} m.`,
    }
  }

  const ground = map.objects.find((object) => object.id === 'terrain_ground')
  if (ground?.shape?.type === 'box') {
    const halfW = ground.shape.width * 0.5
    const halfD = ground.shape.depth * 0.5
    const originX = ground.transform.position.x
    const originZ = ground.transform.position.z
    const terrainMinX = originX - halfW
    const terrainMaxX = originX + halfW
    const terrainMinZ = originZ - halfD
    const terrainMaxZ = originZ + halfD
    if (
      footprint.minX < terrainMinX ||
      footprint.maxX > terrainMaxX ||
      footprint.minZ < terrainMinZ ||
      footprint.maxZ > terrainMaxZ
    ) {
      return { ok: false, message: 'Parcel must stay inside terrain bounds.' }
    }
  }

  for (const object of map.objects) {
    if (object.layer !== 'fields' || object.id === excludeFieldId) {
      continue
    }
    const existing = getFieldParcelFootprint(object)
    if (existing && footprintsOverlap(footprint, existing)) {
      return {
        ok: false,
        message: `Overlaps field "${object.name ?? object.id}".`,
      }
    }
  }

  return { ok: true }
}
