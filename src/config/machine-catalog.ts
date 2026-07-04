import {
  MachineCapability,
  MachineId,
  type MachineCapability as MachineCapabilityValue,
} from '@/types/machine.ts'
import {
  AttachmentType,
  MachineSlotId,
  type AttachmentTypeValue,
  type MachineSlotIdValue,
} from '@/types/attachment.ts'

export interface MachineSlotDefinition {
  id: MachineSlotIdValue
  label: string
  acceptedTypes: readonly AttachmentTypeValue[]
}

export interface MachineCatalogEntry {
  id: MachineId
  name: string
  capabilities: readonly MachineCapabilityValue[]
  slots: readonly MachineSlotDefinition[]
}

export const MACHINE_CATALOG: readonly MachineCatalogEntry[] = [
  {
    id: MachineId.Tractor1,
    name: 'Tractor',
    capabilities: [MachineCapability.Move, MachineCapability.Tow],
    slots: [
      {
        id: MachineSlotId.FrontHitch,
        label: 'Front Hitch',
        acceptedTypes: [AttachmentType.FrontAttachment],
      },
      {
        id: MachineSlotId.RearHitch,
        label: 'Rear Hitch',
        acceptedTypes: [AttachmentType.Implement],
      },
      {
        id: MachineSlotId.TrailerHitch,
        label: 'Trailer Hitch',
        acceptedTypes: [AttachmentType.Trailer],
      },
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

export function getMachineSlots(
  machineId: MachineId,
): readonly MachineSlotDefinition[] {
  return getMachineCatalogEntry(machineId)?.slots ?? []
}

export function slotAcceptsAttachmentType(
  machineId: MachineId,
  slotId: MachineSlotIdValue,
  attachmentType: AttachmentTypeValue,
): boolean {
  const slot = getMachineSlots(machineId).find((entry) => entry.id === slotId)
  return slot?.acceptedTypes.includes(attachmentType) ?? false
}
