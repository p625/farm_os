import { getAttachmentCatalogEntry } from '@/config/attachment-catalog.ts'
import { getCropDefinition } from '@/config/crop-catalog.ts'
import { getCapabilitiesFromMountedAttachment } from '@/config/attachment-capabilities.ts'
import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import {
  AttachmentLifecycleState,
  MachineSlotId,
  type MachineSlotIdValue,
} from '@/types/attachment.ts'
import {
  MachineCapability,
  type MachineId,
  type MachineCapability as MachineCapabilityValue,
} from '@/types/machine.ts'
import type { AttachmentCatalogIdValue } from '@/types/attachment.ts'
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

  getAttachedHeaderCatalogId(
    machineId: MachineId,
  ): AttachmentCatalogIdValue | null {
    const attachmentId = this.attachmentSystem.getSlotAttachmentId(
      machineId,
      MachineSlotId.HeaderSlot,
    )
    if (!attachmentId) {
      return null
    }

    const attachment = this.attachmentSystem.getAttachment(attachmentId)
    if (
      !attachment ||
      attachment.lifecycleState !== AttachmentLifecycleState.Attached
    ) {
      return null
    }

    return attachment.catalogId
  }

  getHeaderSupportedCropIds(machineId: MachineId): readonly string[] {
    const catalogId = this.getAttachedHeaderCatalogId(machineId)
    if (!catalogId) {
      return []
    }

    return getAttachmentCatalogEntry(catalogId)?.supportedCropIds ?? []
  }

  canHarvestCrop(machineId: MachineId, cropId: string): boolean {
    if (!this.hasEffectiveCapability(machineId, MachineCapability.Harvest)) {
      return false
    }

    const catalogId = this.getAttachedHeaderCatalogId(machineId)
    if (!catalogId) {
      return false
    }

    const supported = getAttachmentCatalogEntry(catalogId)?.supportedCropIds ?? []
    return supported.includes(cropId)
  }

  getHarvestIncompatibilityMessage(
    machineId: MachineId,
    cropId: string,
  ): string | null {
    if (!this.hasEffectiveCapability(machineId, MachineCapability.Harvest)) {
      return null
    }

    if (this.canHarvestCrop(machineId, cropId)) {
      return null
    }

    const catalogId = this.getAttachedHeaderCatalogId(machineId)
    const headerName =
      (catalogId ? getAttachmentCatalogEntry(catalogId)?.name : null) ?? 'Header'
    const cropName = getCropDefinition(cropId)?.name ?? cropId
    return `${headerName} cannot harvest ${cropName}.`
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
