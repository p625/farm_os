import {
  MachineCapability,
  MachineId,
  type MachineCapability as MachineCapabilityValue,
} from '@/types/machine.ts'

export interface MachineCatalogEntry {
  id: MachineId
  name: string
  capabilities: readonly MachineCapabilityValue[]
}

export const MACHINE_CATALOG: readonly MachineCatalogEntry[] = [
  {
    id: MachineId.Tractor1,
    name: 'Tractor',
    capabilities: [
      MachineCapability.Move,
      MachineCapability.Plow,
      MachineCapability.Seed,
      MachineCapability.Harvest,
    ],
  },
] as const

export const DEFAULT_MACHINE_ID = MachineId.Tractor1

const catalogById = new Map(MACHINE_CATALOG.map((entry) => [entry.id, entry]))

export function getMachineCatalogEntry(
  machineId: MachineId,
): MachineCatalogEntry | undefined {
  return catalogById.get(machineId)
}

export function machineHasCapability(
  machineId: MachineId,
  capability: MachineCapabilityValue,
): boolean {
  return getMachineCatalogEntry(machineId)?.capabilities.includes(capability) ?? false
}
