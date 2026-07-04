import {
  DeliveryZoneId,
  type DeliveryZoneDefinition,
} from '@/types/delivery.ts'
import { getActiveFarmHub } from '@/config/farm-layout.ts'

/**
 * Delivery zones place purchased world objects (machines, attachments).
 *
 * Phase 14: Dealer lot only. This catalog will evolve into a generic Spawn Zone
 * architecture (see docs/Architecture/009_Phase14_WorldExpansion.md).
 */
function buildDeliveryZoneCatalog(): DeliveryZoneDefinition[] {
  const hub = getActiveFarmHub()
  return [
    {
      id: DeliveryZoneId.DealerLot,
      label: 'Dealer Delivery Zone',
      clearanceRadius: 2.5,
      slots: hub.deliverySlots.map((slot) => ({ ...slot })),
    },
  ]
}

/** @deprecated Use getDeliveryZoneCatalog() */
export const DELIVERY_ZONE_CATALOG: readonly DeliveryZoneDefinition[] =
  buildDeliveryZoneCatalog()

export function getDeliveryZoneCatalog(): readonly DeliveryZoneDefinition[] {
  return buildDeliveryZoneCatalog()
}

export function getDeliveryZoneDefinition(
  zoneId: DeliveryZoneId,
): DeliveryZoneDefinition | undefined {
  return getDeliveryZoneCatalog().find((zone) => zone.id === zoneId)
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
