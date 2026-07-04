import type { AssetAnchorTemplate } from '@/types/asset-definition.ts'
import { AttachmentCatalogId } from '@/types/attachment.ts'
import { MachineId } from '@/types/machine.ts'
import type { BuildingTypeId } from '@/types/building.ts'

const ENTRY_MAIN: AssetAnchorTemplate = {
  anchorKind: 'entry',
  label: 'Main Entrance',
  localX: 0,
  localZ: 0.55,
  useRatio: true,
  required: true,
}

const CIVIC_SIDE_ENTRY: AssetAnchorTemplate = {
  anchorKind: 'entry',
  label: 'Side Entrance',
  localX: 0.4,
  localZ: 0,
  useRatio: true,
}

function barnAnchors(): AssetAnchorTemplate[] {
  return [
    ENTRY_MAIN,
    {
      anchorKind: 'entry',
      label: 'Vehicle Entrance',
      localX: 0.35,
      localZ: 0.55,
      useRatio: true,
      required: true,
    },
    {
      anchorKind: 'loading',
      label: 'Loading Area',
      localX: -0.25,
      localZ: 0.2,
      useRatio: true,
      triggerRadius: 4,
      required: true,
    },
  ]
}

const BUILDING_ANCHOR_TEMPLATES: Partial<
  Record<BuildingTypeId, readonly AssetAnchorTemplate[]>
> = {
  farm_barn: barnAnchors(),
  farm_shed: barnAnchors(),
  farm_silo: [
    ENTRY_MAIN,
    {
      anchorKind: 'interaction',
      label: 'Silo Entry',
      localX: 0,
      localZ: 0.55,
      useRatio: true,
      entityId: 'silo_entry',
      required: true,
    },
    {
      anchorKind: 'unload',
      label: 'Unload Point',
      localX: 0.4,
      localZ: 0,
      useRatio: true,
      triggerRadius: 5,
      required: true,
    },
    {
      anchorKind: 'loading',
      label: 'Load Point',
      localX: -0.35,
      localZ: 0.15,
      useRatio: true,
      triggerRadius: 4,
      required: true,
    },
  ],
  shop_general: [
    ENTRY_MAIN,
    {
      anchorKind: 'interaction',
      label: 'Shop Entry',
      localX: 0,
      localZ: 0.55,
      useRatio: true,
      entityId: 'dealer_entry',
      required: true,
    },
    {
      anchorKind: 'spawn',
      label: 'Machine Spawn',
      localX: 0.5,
      localZ: 0.35,
      useRatio: true,
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Customer Parking',
      localX: 0.6,
      localZ: 0.28,
      useRatio: true,
    },
  ],
  farm_mill: [
    ENTRY_MAIN,
    {
      anchorKind: 'service',
      label: 'Repair / Service',
      localX: -0.3,
      localZ: 0.33,
      useRatio: true,
      entityId: 'repair',
      required: true,
    },
  ],
  civic_church: [ENTRY_MAIN, CIVIC_SIDE_ENTRY],
  civic_town_hall: [ENTRY_MAIN, CIVIC_SIDE_ENTRY],
  civic_hospital: [ENTRY_MAIN, CIVIC_SIDE_ENTRY],
  civic_school: [ENTRY_MAIN, CIVIC_SIDE_ENTRY],
}

export function getBuildingAnchorTemplates(
  buildingType: BuildingTypeId,
): readonly AssetAnchorTemplate[] {
  return BUILDING_ANCHOR_TEMPLATES[buildingType] ?? [ENTRY_MAIN]
}

const MACHINE_ANCHOR_TEMPLATES: Record<string, readonly AssetAnchorTemplate[]> = {
  [MachineId.Tractor1]: [
    {
      anchorKind: 'interaction',
      label: 'Driver Seat',
      localX: 0,
      localZ: 0,
      entityId: 'driver_seat',
      required: true,
    },
    {
      anchorKind: 'service',
      label: 'Attach Front',
      localX: 0,
      localZ: 1.8,
      entityId: 'attach_front',
      required: true,
    },
    {
      anchorKind: 'service',
      label: 'Attach Rear',
      localX: 0,
      localZ: -1.5,
      entityId: 'attach_rear',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 2.5,
      entityId: 'vehicle_parking',
      required: true,
    },
    {
      anchorKind: 'spawn',
      label: 'Spawn',
      localX: 0,
      localZ: 0,
      entityId: '{machineId}',
      required: true,
    },
  ],
  [MachineId.GrainCombine1]: [
    {
      anchorKind: 'interaction',
      label: 'Driver Seat',
      localX: 0,
      localZ: -0.8,
      entityId: 'driver_seat',
      required: true,
    },
    {
      anchorKind: 'unload',
      label: 'Pipe Unload',
      localX: 0,
      localZ: 2.2,
      entityId: 'pipe_unload',
      required: true,
    },
    {
      anchorKind: 'service',
      label: 'Header Attach',
      localX: 0,
      localZ: 2.8,
      entityId: 'header_attach',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 2.5,
      entityId: 'vehicle_parking',
      required: true,
    },
    {
      anchorKind: 'spawn',
      label: 'Spawn',
      localX: 0,
      localZ: 0,
      entityId: '{machineId}',
      required: true,
    },
  ],
  [MachineId.CornCombine1]: [
    {
      anchorKind: 'interaction',
      label: 'Driver Seat',
      localX: 0,
      localZ: -0.8,
      entityId: 'driver_seat',
      required: true,
    },
    {
      anchorKind: 'unload',
      label: 'Pipe Unload',
      localX: 0,
      localZ: 2.2,
      entityId: 'pipe_unload',
      required: true,
    },
    {
      anchorKind: 'service',
      label: 'Header Attach',
      localX: 0,
      localZ: 2.8,
      entityId: 'header_attach',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 2.5,
      entityId: 'vehicle_parking',
      required: true,
    },
    {
      anchorKind: 'spawn',
      label: 'Spawn',
      localX: 0,
      localZ: 0,
      entityId: '{machineId}',
      required: true,
    },
  ],
}

const ATTACHMENT_ANCHOR_TEMPLATES: Record<string, readonly AssetAnchorTemplate[]> = {
  [AttachmentCatalogId.Plow]: [
    {
      anchorKind: 'service',
      label: 'Hitch',
      localX: 0,
      localZ: -1.2,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 1.5,
      required: true,
    },
  ],
  [AttachmentCatalogId.Seeder]: [
    {
      anchorKind: 'service',
      label: 'Hitch',
      localX: 0,
      localZ: -1.2,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'loading',
      label: 'Fill Point',
      localX: 0,
      localZ: 0.4,
      entityId: 'fill_point',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 1.5,
      required: true,
    },
  ],
  [AttachmentCatalogId.Wagon]: [
    {
      anchorKind: 'service',
      label: 'Hitch',
      localX: 0,
      localZ: -2.2,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 2,
      required: true,
    },
    {
      anchorKind: 'loading',
      label: 'Load Area',
      localX: 0,
      localZ: 0.5,
      triggerRadius: 3,
      required: true,
    },
  ],
  [AttachmentCatalogId.GrainHeader]: [
    {
      anchorKind: 'service',
      label: 'Attach',
      localX: 0,
      localZ: -0.8,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 1.2,
      required: true,
    },
  ],
  [AttachmentCatalogId.CornHeader]: [
    {
      anchorKind: 'service',
      label: 'Attach',
      localX: 0,
      localZ: -0.8,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 1.2,
      required: true,
    },
  ],
  [AttachmentCatalogId.FertilizerSpreader]: [
    {
      anchorKind: 'service',
      label: 'Hitch',
      localX: 0,
      localZ: -1.2,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'loading',
      label: 'Fill Point',
      localX: 0,
      localZ: 0.3,
      entityId: 'fill_point',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 1.5,
      required: true,
    },
  ],
  [AttachmentCatalogId.Sprayer]: [
    {
      anchorKind: 'service',
      label: 'Hitch',
      localX: 0,
      localZ: -1.2,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'loading',
      label: 'Fill Point',
      localX: 0,
      localZ: 0.3,
      entityId: 'fill_point',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 1.5,
      required: true,
    },
  ],
}

export function getMachineAnchorTemplates(
  machineId: string,
): readonly AssetAnchorTemplate[] {
  if (machineId.startsWith('tractor_')) {
    return MACHINE_ANCHOR_TEMPLATES[MachineId.Tractor1] ?? []
  }
  return MACHINE_ANCHOR_TEMPLATES[machineId] ?? []
}

export function getAttachmentAnchorTemplates(
  catalogId: string,
): readonly AssetAnchorTemplate[] {
  return ATTACHMENT_ANCHOR_TEMPLATES[catalogId] ?? [
    {
      anchorKind: 'service',
      label: 'Hitch',
      localX: 0,
      localZ: -1,
      entityId: 'hitch',
      required: true,
    },
    {
      anchorKind: 'parking',
      label: 'Parking',
      localX: 0,
      localZ: 1.5,
      required: true,
    },
  ]
}

export function getPlacementAnchorTemplates(
  catalogKind: 'machine' | 'attachment',
  catalogId: string,
): readonly AssetAnchorTemplate[] {
  if (catalogKind === 'machine') {
    return getMachineAnchorTemplates(catalogId)
  }
  return getAttachmentAnchorTemplates(catalogId)
}
