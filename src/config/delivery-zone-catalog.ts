import {
  DeliveryZoneId,
  type DeliveryZoneDefinition,
} from '@/types/delivery.ts'
import { FARM_HUB } from '@/config/map-01-layout.ts'

/**
 * Delivery zones place purchased world objects (machines, attachments).
 *
 * Phase 14: Dealer lot only. This catalog will evolve into a generic Spawn Zone
 * architecture (see docs/Architecture/009_Phase14_WorldExpansion.md).
 */
export const DELIVERY_ZONE_CATALOG: readonly DeliveryZoneDefinition[] = [
  {
    id: DeliveryZoneId.DealerLot,
    label: 'Dealer Delivery Zone',
    clearanceRadius: 2.5,
    slots: FARM_HUB.deliverySlots.map((slot) => ({ ...slot })),
  },
] as const

const zoneById = new Map(DELIVERY_ZONE_CATALOG.map((zone) => [zone.id, zone]))

export function getDeliveryZoneDefinition(
  zoneId: DeliveryZoneId,
): DeliveryZoneDefinition | undefined {
  return zoneById.get(zoneId)
}

export function findOpenDeliverySlot(
  zoneId: DeliveryZoneId,
  occupiedPositions: readonly { x: number; z: number }[],
): DeliveryZoneDefinition['slots'][number] | null {
  const zone = getDeliveryZoneDefinition(zoneId)
  if (!zone) {
    return null
  }

  for (const slot of zone.slots) {
    const blocked = occupiedPositions.some((position) => {
      const dx = position.x - slot.x
      const dz = position.z - slot.z
      return Math.hypot(dx, dz) < zone.clearanceRadius
    })
    if (!blocked) {
      return slot
    }
  }

  return null
}
