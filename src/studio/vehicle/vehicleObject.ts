import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { VehiclePlacementTypeId } from '@/types/vehicle-placement.ts'
import {
  getVehicleTypeDefinition,
  type VehicleTypeDefinition,
} from '@/studio/vehicle/VehicleTypePalette.ts'

let vehicleCounter = 0

export function createVehicleId(): string {
  vehicleCounter += 1
  return `veh_${vehicleCounter}`
}

export function resetVehicleIdCounter(next: number): void {
  vehicleCounter = next
}

export function syncVehicleIdCounterFromMap(map: WorldMapDocument): void {
  let max = 0
  for (const object of map.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const match = /^veh_(\d+)$/.exec(object.id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  vehicleCounter = max
}

export interface CreateVehicleOptions {
  vehicleType: VehiclePlacementTypeId
  surfaceY: number
  rotationY?: number
  name?: string
  hostBuildingId?: string
}

export function createVehiclePlacementObject(
  worldX: number,
  worldZ: number,
  options: CreateVehicleOptions,
): MapObject {
  const definition = getVehicleTypeDefinition(options.vehicleType)
  const id = createVehicleId()
  return buildVehicleMapObject(id, worldX, worldZ, definition, options)
}

export function buildVehicleMapObject(
  id: string,
  worldX: number,
  worldZ: number,
  definition: VehicleTypeDefinition,
  options: Omit<CreateVehicleOptions, 'vehicleType'>,
): MapObject {
  return {
    id,
    layer: 'vehicles',
    kind: definition.id,
    name: options.name ?? definition.label,
    transform: {
      position: { x: worldX, y: options.surfaceY, z: worldZ },
      rotationY: options.rotationY ?? 0,
    },
    shape: {
      type: 'box',
      width: definition.width,
      height: definition.height,
      depth: definition.depth,
    },
    properties: {
      vehicleType: definition.id,
      defaultState: 'parked',
      active: true,
      ...(definition.defaultMachineId
        ? { machineId: definition.defaultMachineId }
        : {}),
      ...(options.hostBuildingId ? { hostBuildingId: options.hostBuildingId } : {}),
    },
  }
}
