import {
  DeliveryZoneId,
  type DeliveryZoneDefinition,
} from '@/types/delivery.ts'

export const DELIVERY_ZONE_CATALOG: readonly DeliveryZoneDefinition[] = [
  {
    id: DeliveryZoneId.DealerLot,
    label: 'Dealer Delivery Zone',
    clearanceRadius: 2.5,
    slots: [
      { x: 2, y: 0, z: 18, rotationY: -Math.PI / 6 },
      { x: 6, y: 0, z: 20, rotationY: -Math.PI / 6 },
      { x: 10, y: 0, z: 18, rotationY: -Math.PI / 6 },
    ],
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
