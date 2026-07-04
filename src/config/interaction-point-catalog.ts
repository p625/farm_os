import {
  InteractionPointId,
  InteractionPointType,
  type InteractionPointId as InteractionPointIdValue,
  type InteractionPointType as InteractionPointTypeValue,
} from '@/types/interaction-point.ts'
import { FarmStoreId } from '@/types/farm-store.ts'
import { getActiveFarmHub } from '@/config/farm-layout.ts'

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

const BASE_INTERACTION_POINTS = [
  {
    id: InteractionPointId.SiloEntry,
    type: InteractionPointType.Silo,
    label: 'Silo Entry',
    meshName: 'interaction_point_silo_entry',
    arrivalRadius: 2.5,
    visibilityPriority: 10,
    hubKey: 'siloEntry' as const,
  },
  {
    id: InteractionPointId.DealerEntry,
    type: InteractionPointType.Shop,
    label: 'Farm Dealer',
    meshName: 'interaction_point_dealer_entry',
    arrivalRadius: 2.5,
    farmStoreId: FarmStoreId.Dealer,
    visibilityPriority: 20,
    hubKey: 'dealerEntry' as const,
  },
] as const

function buildInteractionPointCatalog(): InteractionPointDefinition[] {
  const hub = getActiveFarmHub()
  return BASE_INTERACTION_POINTS.map((entry) => ({
    id: entry.id,
    type: entry.type,
    label: entry.label,
    meshName: entry.meshName,
    position: hub[entry.hubKey].position,
    arrivalRadius: entry.arrivalRadius,
    farmStoreId: 'farmStoreId' in entry ? entry.farmStoreId : undefined,
    visibilityPriority: entry.visibilityPriority,
  }))
}

/** @deprecated Use getInteractionPointCatalog() */
export const INTERACTION_POINT_CATALOG: readonly InteractionPointDefinition[] =
  buildInteractionPointCatalog()

export function getInteractionPointCatalog(): readonly InteractionPointDefinition[] {
  return buildInteractionPointCatalog()
}

export function getInteractionPointDefinition(
  id: InteractionPointIdValue,
): InteractionPointDefinition | undefined {
  return getInteractionPointCatalog().find((entry) => entry.id === id)
}

export function resolveInteractionPointIdFromMesh(
  meshName: string,
): InteractionPointIdValue | null {
  for (const entry of BASE_INTERACTION_POINTS) {
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
