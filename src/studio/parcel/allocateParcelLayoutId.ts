import type { WorldMapDocument } from '@/types/world-map.ts'
import type { ParcelBlockId } from '@/types/parcel.ts'
import { parseFieldParcelProperties } from '@/types/parcel.ts'

export function allocateParcelLayoutId(
  map: WorldMapDocument,
  block: ParcelBlockId,
): string {
  let max = 0
  for (const object of map.objects) {
    if (object.layer !== 'fields') {
      continue
    }
    const props = parseFieldParcelProperties(object.properties)
    const parcelId = props?.parcelId
    if (!parcelId) {
      continue
    }
    const match = new RegExp(`^${block}-(\\d+)$`).exec(parcelId)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  const next = max + 1
  return `${block}-${String(next).padStart(2, '0')}`
}

export function isParcelLayoutIdTaken(
  map: WorldMapDocument,
  parcelId: string,
  excludeFieldId?: string,
): boolean {
  for (const object of map.objects) {
    if (object.layer !== 'fields' || object.id === excludeFieldId) {
      continue
    }
    const props = parseFieldParcelProperties(object.properties)
    if (props?.parcelId === parcelId) {
      return true
    }
  }
  return false
}
