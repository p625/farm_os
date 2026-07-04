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
  options?: {
    cropId?: string | null
    harvestIncompatibilityMessage?: string | null
  },
): string | null {
  if (options?.harvestIncompatibilityMessage) {
    return options.harvestIncompatibilityMessage
  }

  if (
    fieldState === States.Grass &&
    !effectiveCapabilities.includes(MachineCapability.Plow)
  ) {
    return 'Pro orbu připojte radlici.'
  }

  if (
    fieldState === States.Plowed &&
    !effectiveCapabilities.includes(MachineCapability.Seed)
  ) {
    return 'Pro výsev připojte secí stroj.'
  }

  if (fieldState === States.Harvestable) {
    if (!effectiveCapabilities.includes(MachineCapability.Harvest)) {
      return 'K této plodině potřebujete sklízeč.'
    }
    if (options?.cropId) {
      return 'Pro sklizeň připojte vhodnou lištu.'
    }
  }

  return null
}
