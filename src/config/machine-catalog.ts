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
  sceneNodeName: string
  bodyMeshName: string
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
    sceneNodeName: 'tractor',
    bodyMeshName: 'tractorBody',
  },
  {
    id: MachineId.GrainCombine1,
    name: 'Grain Combine',
    capabilities: [MachineCapability.Move],
    slots: [
      {
        id: MachineSlotId.HeaderSlot,
        label: 'Header',
        acceptedTypes: [AttachmentType.Header],
      },
      {
        id: MachineSlotId.TrailerHitch,
        label: 'Trailer Hitch',
        acceptedTypes: [AttachmentType.Trailer],
      },
    ],
    sceneNodeName: 'grain_combine_1',
    bodyMeshName: 'grain_combine_1_body',
  },
  {
    id: MachineId.CornCombine1,
    name: 'Corn Combine',
    capabilities: [MachineCapability.Move],
    slots: [
      {
        id: MachineSlotId.HeaderSlot,
        label: 'Header',
        acceptedTypes: [AttachmentType.Header],
      },
      {
        id: MachineSlotId.TrailerHitch,
        label: 'Trailer Hitch',
        acceptedTypes: [AttachmentType.Trailer],
      },
    ],
    sceneNodeName: 'corn_combine_1',
    bodyMeshName: 'corn_combine_1_body',
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

export function isKnownMachineSceneNode(nodeName: string): MachineId | null {
  for (const entry of MACHINE_CATALOG) {
    if (entry.sceneNodeName === nodeName) {
      return entry.id
    }
  }
  return null
}

export function getMachineBodyMeshName(machineId: MachineId): string {
  return getMachineCatalogEntry(machineId)?.bodyMeshName ?? `${machineId}_body`
}
