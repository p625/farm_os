import type { VehiclePlacementTypeId } from '@/types/vehicle-placement.ts'
import { MachineId } from '@/types/machine.ts'

export interface VehicleTypeDefinition {
  id: VehiclePlacementTypeId
  label: string
  width: number
  depth: number
  height: number
  defaultMachineId?: string
  color: [number, number, number]
}

export const VEHICLE_TYPES: readonly VehicleTypeDefinition[] = [
  {
    id: 'tractor',
    label: 'Tractor',
    width: 2.4,
    depth: 4.2,
    height: 2.6,
    defaultMachineId: MachineId.Tractor1,
    color: [0.15, 0.42, 0.15],
  },
  {
    id: 'grain_combine',
    label: 'Grain Combine',
    width: 3.2,
    depth: 6.5,
    height: 3.4,
    defaultMachineId: MachineId.GrainCombine1,
    color: [0.55, 0.35, 0.12],
  },
  {
    id: 'corn_combine',
    label: 'Corn Combine',
    width: 3.4,
    depth: 6.8,
    height: 3.6,
    defaultMachineId: MachineId.CornCombine1,
    color: [0.5, 0.3, 0.1],
  },
  {
    id: 'trailer',
    label: 'Trailer',
    width: 2.2,
    depth: 5.5,
    height: 1.8,
    color: [0.35, 0.35, 0.38],
  },
  {
    id: 'implement',
    label: 'Implement',
    width: 2.5,
    depth: 3.5,
    height: 1.4,
    color: [0.25, 0.3, 0.32],
  },
  {
    id: 'static_vehicle',
    label: 'Static Vehicle',
    width: 2.2,
    depth: 4.5,
    height: 2.2,
    color: [0.4, 0.4, 0.42],
  },
] as const

export const DEFAULT_VEHICLE_TYPE: VehiclePlacementTypeId = 'tractor'

export function getVehicleTypeDefinition(
  id: VehiclePlacementTypeId,
): VehicleTypeDefinition {
  const found = VEHICLE_TYPES.find((entry) => entry.id === id)
  if (!found) {
    return VEHICLE_TYPES[0]
  }
  return found
}
