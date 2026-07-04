import {
  FarmStoreId,
  FarmStoreType,
  type FarmStoreDefinition,
} from '@/types/farm-store.ts'
import { InteractionPointId } from '@/types/interaction-point.ts'
import { DeliveryZoneId } from '@/types/delivery.ts'

export const FARM_STORE_CATALOG: readonly FarmStoreDefinition[] = [
  {
    id: FarmStoreId.Dealer,
    storeType: FarmStoreType.Dealer,
    name: 'Farm Dealer',
    interactionPointId: InteractionPointId.DealerEntry,
    deliveryZoneId: DeliveryZoneId.DealerLot,
  },
] as const

const storeById = new Map(FARM_STORE_CATALOG.map((entry) => [entry.id, entry]))
const storeByInteraction = new Map(
  FARM_STORE_CATALOG.map((entry) => [entry.interactionPointId, entry]),
)

export function getFarmStoreDefinition(
  storeId: FarmStoreId,
): FarmStoreDefinition | undefined {
  return storeById.get(storeId)
}

export function getFarmStoreByInteractionPoint(
  interactionPointId: string,
): FarmStoreDefinition | undefined {
  return storeByInteraction.get(interactionPointId)
}
