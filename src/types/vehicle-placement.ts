import type { MapObject } from '@/types/world-map.ts'
import type { AttachmentCatalogIdValue } from '@/types/attachment.ts'
import type { MachineId } from '@/types/machine.ts'

export const VEHICLE_PLACEMENT_TYPE_IDS = [
  'tractor',
  'grain_combine',
  'corn_combine',
  'trailer',
  'implement',
  'static_vehicle',
] as const

export type VehiclePlacementTypeId =
  (typeof VEHICLE_PLACEMENT_TYPE_IDS)[number]

export type PlacementCatalogKind = 'machine' | 'attachment'

export function isVehiclePlacementTypeId(
  value: unknown,
): value is VehiclePlacementTypeId {
  return (
    typeof value === 'string' &&
    (VEHICLE_PLACEMENT_TYPE_IDS as readonly string[]).includes(value)
  )
}

export function isPlacementCatalogKind(
  value: unknown,
): value is PlacementCatalogKind {
  return value === 'machine' || value === 'attachment'
}

export interface VehiclePlacementProperties {
  /** Legacy palette id — optional when placementCatalogId is set. */
  vehicleType?: VehiclePlacementTypeId
  /** Studio catalog entry id, e.g. machine:tractor_1 */
  placementCatalogId?: string
  placementKind?: PlacementCatalogKind
  /** Runtime machine id when spawned in game */
  machineId?: string
  /** Attachment catalog id for implements / trailers / headers */
  attachmentCatalogId?: AttachmentCatalogIdValue
  /** Runtime attachment instance id */
  attachmentInstanceId?: string
  /** Linked host building MapObject.id */
  hostBuildingId?: string
  /** Scene anchor id for parking position */
  parkingAnchorId?: string
  defaultState?: 'parked' | 'active' | 'disabled'
  active?: boolean
}

export function parseVehiclePlacementProperties(
  properties: Record<string, unknown> | undefined,
): VehiclePlacementProperties | null {
  if (!properties) {
    return null
  }

  const hasLegacyType = isVehiclePlacementTypeId(properties.vehicleType)
  const hasCatalog =
    typeof properties.placementCatalogId === 'string' &&
    isPlacementCatalogKind(properties.placementKind)

  if (!hasLegacyType && !hasCatalog) {
    return null
  }

  const machineId =
    typeof properties.machineId === 'string' ? properties.machineId : undefined
  const attachmentCatalogId =
    typeof properties.attachmentCatalogId === 'string'
      ? (properties.attachmentCatalogId as AttachmentCatalogIdValue)
      : undefined
  const attachmentInstanceId =
    typeof properties.attachmentInstanceId === 'string'
      ? properties.attachmentInstanceId
      : undefined
  const placementCatalogId =
    typeof properties.placementCatalogId === 'string'
      ? properties.placementCatalogId
      : undefined
  const placementKind = isPlacementCatalogKind(properties.placementKind)
    ? properties.placementKind
    : undefined
  const hostBuildingId =
    typeof properties.hostBuildingId === 'string'
      ? properties.hostBuildingId
      : undefined
  const parkingAnchorId =
    typeof properties.parkingAnchorId === 'string'
      ? properties.parkingAnchorId
      : undefined
  const defaultState =
    properties.defaultState === 'parked' ||
    properties.defaultState === 'active' ||
    properties.defaultState === 'disabled'
      ? properties.defaultState
      : 'parked'
  const active = properties.active !== false

  return {
    ...(hasLegacyType
      ? { vehicleType: properties.vehicleType as VehiclePlacementTypeId }
      : {}),
    defaultState,
    active,
    ...(placementCatalogId ? { placementCatalogId } : {}),
    ...(placementKind ? { placementKind } : {}),
    ...(machineId ? { machineId: machineId as MachineId } : {}),
    ...(attachmentCatalogId ? { attachmentCatalogId } : {}),
    ...(attachmentInstanceId ? { attachmentInstanceId } : {}),
    ...(hostBuildingId ? { hostBuildingId } : {}),
    ...(parkingAnchorId ? { parkingAnchorId } : {}),
  }
}

export function isVehiclePlacementObject(object: MapObject): boolean {
  return object.layer === 'vehicles'
}
