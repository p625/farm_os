import {
  AttachmentCategory,
  MachineSlotId,
  type AttachmentCategoryValue,
  type MachineSlotIdValue,
} from '@/types/attachment.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import {
  MachineCapability,
  type MachineCapability as MachineCapabilityValue,
} from '@/types/machine.ts'

const REAR_HITCH_CATEGORY_CAPABILITIES: Partial<
  Record<AttachmentCategoryValue, readonly MachineCapabilityValue[]>
> = {
  [AttachmentCategory.Tillage]: [MachineCapability.Plow],
  [AttachmentCategory.Seeding]: [MachineCapability.Seed],
}

const HEADER_SLOT_CATEGORY_CAPABILITIES: Partial<
  Record<AttachmentCategoryValue, readonly MachineCapabilityValue[]>
> = {
  [AttachmentCategory.Harvesting]: [MachineCapability.Harvest],
}

export function getCapabilitiesFromMountedAttachment(
  slotId: MachineSlotIdValue,
  category: AttachmentCategoryValue,
): readonly MachineCapabilityValue[] {
  if (slotId === MachineSlotId.RearHitch) {
    return REAR_HITCH_CATEGORY_CAPABILITIES[category] ?? []
  }

  if (slotId === MachineSlotId.HeaderSlot) {
    return HEADER_SLOT_CATEGORY_CAPABILITIES[category] ?? []
  }

  return []
}

export function formatMachineCapability(
  capability: MachineCapabilityValue,
): string {
  switch (capability) {
    case MachineCapability.Move:
      return 'Move'
    case MachineCapability.Tow:
      return 'Tow'
    case MachineCapability.Plow:
      return 'Plow'
    case MachineCapability.Seed:
      return 'Seed'
    case MachineCapability.Harvest:
      return 'Harvest'
    default:
      return capability
  }
}

export function getFieldWorkRequirementHint(
  fieldState: string,
  effectiveCapabilities: readonly MachineCapabilityValue[],
): string | null {
  if (
    fieldState === States.Grass &&
    !effectiveCapabilities.includes(MachineCapability.Plow)
  ) {
    return 'Attach a tillage implement to plow fields.'
  }

  if (
    fieldState === States.Plowed &&
    !effectiveCapabilities.includes(MachineCapability.Seed)
  ) {
    return 'Attach a seeding implement to plant crops.'
  }

  if (fieldState === States.Harvestable) {
    return 'This crop requires a harvesting machine.'
  }

  return null
}
