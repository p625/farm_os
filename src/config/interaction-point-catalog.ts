import {
  InteractionPointId,
  InteractionPointType,
  type InteractionPointId as InteractionPointIdValue,
  type InteractionPointType as InteractionPointTypeValue,
} from '@/types/interaction-point.ts'

export interface InteractionPointDefinition {
  id: InteractionPointIdValue
  type: InteractionPointTypeValue
  label: string
  meshName: string
  position: { x: number; y: number; z: number }
  arrivalRadius: number
}

export const INTERACTION_POINT_CATALOG: readonly InteractionPointDefinition[] = [
  {
    id: InteractionPointId.SiloEntry,
    type: InteractionPointType.Silo,
    label: 'Silo Entry',
    meshName: 'interaction_point_silo_entry',
    position: { x: 20, y: 0, z: 14 },
    arrivalRadius: 2.5,
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
