import type { MapObject } from '@/types/world-map.ts'

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

export function isVehiclePlacementTypeId(
  value: unknown,
): value is VehiclePlacementTypeId {
  return (
    typeof value === 'string' &&
    (VEHICLE_PLACEMENT_TYPE_IDS as readonly string[]).includes(value)
  )
}

export interface VehiclePlacementProperties {
  vehicleType: VehiclePlacementTypeId
  /** Runtime machine id when spawned in game */
  machineId?: string
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
  if (!properties || !isVehiclePlacementTypeId(properties.vehicleType)) {
    return null
  }
  const machineId =
    typeof properties.machineId === 'string' ? properties.machineId : undefined
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
    vehicleType: properties.vehicleType,
    defaultState,
    active,
    ...(machineId ? { machineId } : {}),
    ...(hostBuildingId ? { hostBuildingId } : {}),
    ...(parkingAnchorId ? { parkingAnchorId } : {}),
  }
}

export function isVehiclePlacementObject(object: MapObject): boolean {
  return object.layer === 'vehicles'
}
