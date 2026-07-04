import { CROP_CATALOG } from '@/config/crop-catalog.ts'
import { ATTACHMENT_CATALOG } from '@/config/attachment-catalog.ts'
import { MACHINE_CATALOG } from '@/config/machine-catalog.ts'
import { AttachmentType } from '@/types/attachment.ts'
import { MachineCapability, type MachineId } from '@/types/machine.ts'
import type { AttachmentCatalogIdValue } from '@/types/attachment.ts'
import { getPlacementAnchorTemplates } from '@/config/gameplay-asset-catalog.ts'
import type { AssetAnchorTemplate } from '@/types/asset-definition.ts'

export type StudioPlacementCategory =
  | 'self_propelled'
  | 'implement'
  | 'trailer'
  | 'header'
  | 'static_equipment'

export type StudioPlacementCatalogKind = 'machine' | 'attachment'

export interface StudioPlacementEntry {
  /** Stable UI id, e.g. machine:tractor_1 */
  id: string
  catalogKind: StudioPlacementCatalogKind
  catalogId: string
  name: string
  category: StudioPlacementCategory
  width: number
  depth: number
  height: number
  color: [number, number, number]
  machineId?: MachineId
  attachmentCatalogId?: AttachmentCatalogIdValue
  capabilities: readonly string[]
  defaultAnchors: readonly AssetAnchorTemplate[]
}

const MACHINE_DIMENSIONS: Record<
  string,
  { width: number; depth: number; height: number; color: [number, number, number] }
> = {
  tractor_1: { width: 2.2, depth: 3.6, height: 2.4, color: [0.15, 0.42, 0.15] },
  grain_combine_1: {
    width: 3.2,
    depth: 5.5,
    height: 3.2,
    color: [0.75, 0.55, 0.12],
  },
  corn_combine_1: {
    width: 3.2,
    depth: 5.5,
    height: 3.2,
    color: [0.7, 0.5, 0.1],
  },
}

const ATTACHMENT_DIMENSIONS: Record<
  string,
  { width: number; depth: number; height: number; color: [number, number, number] }
> = {
  plow: { width: 2.4, depth: 2.8, height: 1.2, color: [0.45, 0.32, 0.18] },
  seeder: { width: 2.6, depth: 3.2, height: 1.6, color: [0.2, 0.45, 0.7] },
  wagon: { width: 2.8, depth: 5.5, height: 1.8, color: [0.55, 0.42, 0.28] },
  grain_header: { width: 4.2, depth: 1.4, height: 1.2, color: [0.7, 0.55, 0.15] },
  corn_header: { width: 4.2, depth: 1.4, height: 1.2, color: [0.65, 0.5, 0.12] },
  fertilizer_spreader: {
    width: 2.4,
    depth: 3,
    height: 1.5,
    color: [0.55, 0.48, 0.22],
  },
  sprayer: { width: 2.6, depth: 3.4, height: 1.7, color: [0.25, 0.5, 0.35] },
}

function machineCategory(machineId: MachineId): StudioPlacementCategory {
  if (machineId.includes('combine')) {
    return 'self_propelled'
  }
  return 'self_propelled'
}

function attachmentCategory(
  attachmentType: string,
  category: string,
): StudioPlacementCategory {
  if (attachmentType === AttachmentType.Trailer) {
    return 'trailer'
  }
  if (attachmentType === AttachmentType.Header) {
    return 'header'
  }
  if (attachmentType === AttachmentType.Implement) {
    return category === 'spraying' || category === 'fertilizing'
      ? 'static_equipment'
      : 'implement'
  }
  return 'implement'
}

function buildMachinePlacementEntry(
  machine: (typeof MACHINE_CATALOG)[number],
): StudioPlacementEntry {
  const dims = MACHINE_DIMENSIONS[machine.id] ?? {
    width: 2.5,
    depth: 4,
    height: 2,
    color: [0.35, 0.35, 0.35] as [number, number, number],
  }
  return {
    id: `machine:${machine.id}`,
    catalogKind: 'machine',
    catalogId: machine.id,
    name: machine.name,
    category: machineCategory(machine.id),
    width: dims.width,
    depth: dims.depth,
    height: dims.height,
    color: dims.color,
    machineId: machine.id,
    capabilities: machine.capabilities,
    defaultAnchors: getPlacementAnchorTemplates('machine', machine.id),
  }
}

function buildAttachmentPlacementEntry(
  attachment: (typeof ATTACHMENT_CATALOG)[number],
): StudioPlacementEntry {
  const dims = ATTACHMENT_DIMENSIONS[attachment.id] ?? {
    width: 2.2,
    depth: 3,
    height: 1.4,
    color: [0.4, 0.4, 0.4] as [number, number, number],
  }
  return {
    id: `attachment:${attachment.id}`,
    catalogKind: 'attachment',
    catalogId: attachment.id,
    name: attachment.name,
    category: attachmentCategory(
      attachment.attachmentType,
      attachment.category,
    ),
    width: dims.width,
    depth: dims.depth,
    height: dims.height,
    color: dims.color,
    attachmentCatalogId: attachment.id,
    capabilities: attachment.providesCapabilities ?? [],
    defaultAnchors: getPlacementAnchorTemplates('attachment', attachment.id),
  }
}

let cachedCatalog: StudioPlacementEntry[] | null = null

/** Built from live game catalogs — no manual Studio duplicate list. */
export function getStudioPlacementCatalog(): readonly StudioPlacementEntry[] {
  if (!cachedCatalog) {
    cachedCatalog = [
      ...MACHINE_CATALOG.map(buildMachinePlacementEntry),
      ...ATTACHMENT_CATALOG.map(buildAttachmentPlacementEntry),
    ]
  }
  return cachedCatalog
}

export function getStudioPlacementEntry(
  placementId: string,
): StudioPlacementEntry | undefined {
  return getStudioPlacementCatalog().find((entry) => entry.id === placementId)
}

export function getDefaultStudioPlacementId(): string {
  return getStudioPlacementCatalog()[0]?.id ?? 'machine:tractor_1'
}

export function isSelfPropelledPlacement(
  entry: StudioPlacementEntry,
): boolean {
  return (
    entry.catalogKind === 'machine' &&
    entry.capabilities.includes(MachineCapability.Move)
  )
}

export function formatPlacementCategory(
  category: StudioPlacementCategory,
): string {
  switch (category) {
    case 'self_propelled':
      return 'Self-propelled'
    case 'implement':
      return 'Implement'
    case 'trailer':
      return 'Trailer'
    case 'header':
      return 'Header'
    case 'static_equipment':
      return 'Equipment'
    default:
      return category
  }
}

export const STUDIO_CROP_OPTIONS = [
  { id: '', label: 'None' },
  ...CROP_CATALOG.map((crop) => ({ id: crop.id, label: crop.name })),
]
