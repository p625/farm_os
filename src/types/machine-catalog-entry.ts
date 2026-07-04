import type { MachineId, MachineCapability } from './machine.ts'
import type { AttachmentTypeValue, MachineSlotIdValue } from './attachment.ts'

export interface MachineSlotDefinition {
  id: MachineSlotIdValue
  label: string
  acceptedTypes: readonly AttachmentTypeValue[]
}

export interface MachineCatalogEntry {
  id: MachineId
  name: string
  capabilities: readonly MachineCapability[]
  slots: readonly MachineSlotDefinition[]
  sceneNodeName: string
  bodyMeshName: string
}
