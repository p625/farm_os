import {
  MachineCapability,
} from '@/types/machine.ts'
import {
  AttachmentType,
  MachineSlotId,
} from '@/types/attachment.ts'
import {
  MachineTemplateId,
  type MachineTemplateDefinition,
} from '@/types/machine-template.ts'

export const MACHINE_TEMPLATE_CATALOG: readonly MachineTemplateDefinition[] = [
  {
    id: MachineTemplateId.SmallTractor,
    name: 'Small Tractor',
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
    visualPrototype: 'tractor',
  },
  {
    id: MachineTemplateId.GrainCombine,
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
    visualPrototype: 'grain_combine',
  },
  {
    id: MachineTemplateId.CornCombine,
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
    visualPrototype: 'corn_combine',
  },
] as const

const templateById = new Map(
  MACHINE_TEMPLATE_CATALOG.map((entry) => [entry.id, entry]),
)

export function getMachineTemplateDefinition(
  templateId: MachineTemplateId,
): MachineTemplateDefinition | undefined {
  return templateById.get(templateId)
}
