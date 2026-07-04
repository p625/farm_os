import { getCapabilitiesFromMountedAttachment } from '@/config/attachment-capabilities.ts'
import { getAttachmentCatalogEntry } from '@/config/attachment-catalog.ts'
import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import {
  AttachmentLifecycleState,
  type MachineSlotIdValue,
} from '@/types/attachment.ts'
import {
  type MachineId,
  type MachineCapability as MachineCapabilityValue,
} from '@/types/machine.ts'
import type { AttachmentSystem } from './AttachmentSystem.ts'

export class MachineCapabilityResolver {
  private readonly attachmentSystem: AttachmentSystem

  constructor(attachmentSystem: AttachmentSystem) {
    this.attachmentSystem = attachmentSystem
  }

  getEffectiveCapabilities(
    machineId: MachineId,
  ): readonly MachineCapabilityValue[] {
    const machine = getMachineCatalogEntry(machineId)
    if (!machine) {
      return []
    }

    const capabilities = new Set(machine.capabilities)

    for (const slot of machine.slots) {
      for (const capability of this.getSlotCapabilities(machineId, slot.id)) {
        capabilities.add(capability)
      }
    }

    return [...capabilities]
  }

  hasEffectiveCapability(
    machineId: MachineId,
    capability: MachineCapabilityValue,
  ): boolean {
    return this.getEffectiveCapabilities(machineId).includes(capability)
  }

  private getSlotCapabilities(
    machineId: MachineId,
    slotId: MachineSlotIdValue,
  ): readonly MachineCapabilityValue[] {
    const attachmentId = this.attachmentSystem.getSlotAttachmentId(
      machineId,
      slotId,
    )
    if (!attachmentId) {
      return []
    }

    const attachment = this.attachmentSystem.getAttachment(attachmentId)
    if (
      !attachment ||
      attachment.lifecycleState !== AttachmentLifecycleState.Attached
    ) {
      return []
    }

    const catalog = getAttachmentCatalogEntry(attachment.catalogId)
    if (!catalog) {
      return []
    }

    return getCapabilitiesFromMountedAttachment(slotId, catalog.category)
  }
}
