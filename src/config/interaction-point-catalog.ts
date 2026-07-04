import {
  InteractionPointId,
  InteractionPointType,
  type InteractionPointId as InteractionPointIdValue,
  type InteractionPointType as InteractionPointTypeValue,
} from '@/types/interaction-point.ts'
import { FarmStoreId } from '@/types/farm-store.ts'
import { FARM_HUB } from '@/config/map-01-layout.ts'

export interface InteractionPointDefinition {
  id: InteractionPointIdValue
  type: InteractionPointTypeValue
  label: string
  meshName: string
  position: { x: number; y: number; z: number }
  arrivalRadius: number
  farmStoreId?: FarmStoreId
  /**
   * Reserved for future radial-menu / marker visibility ordering.
   * Higher values surface first when multiple POIs overlap. No effect in Phase 14.
   */
  visibilityPriority?: number
}

export const INTERACTION_POINT_CATALOG: readonly InteractionPointDefinition[] = [
  {
    id: InteractionPointId.SiloEntry,
    type: InteractionPointType.Silo,
    label: 'Silo Entry',
    meshName: 'interaction_point_silo_entry',
    position: FARM_HUB.siloEntry.position,
    arrivalRadius: 2.5,
    visibilityPriority: 10,
  },
  {
    id: InteractionPointId.DealerEntry,
    type: InteractionPointType.Shop,
    label: 'Farm Dealer',
    meshName: 'interaction_point_dealer_entry',
    position: FARM_HUB.dealerEntry.position,
    arrivalRadius: 2.5,
    farmStoreId: FarmStoreId.Dealer,
    visibilityPriority: 20,
  },
] as const

const catalogById = new Map(
  INTERACTION_POINT_CATALOG.map((entry) => [entry.id, entry]),
)

export function getInteractionPointDefinition(
  id: InteractionPointIdValue,
): InteractionPointDefinition | undefined {
  return catalogById.get(id)
}

export function resolveInteractionPointIdFromMesh(
  meshName: string,
): InteractionPointIdValue | null {
  for (const entry of INTERACTION_POINT_CATALOG) {
    if (entry.meshName === meshName) {
      return entry.id
    }
  }
  return null
}

export function isKnownInteractionPointMesh(meshNameChain: string[]): boolean {
  return meshNameChain.some(
    (name) => resolveInteractionPointIdFromMesh(name) !== null,
  )
}
