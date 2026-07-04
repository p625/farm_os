import {
  AttachmentBehavior,
  AttachmentCatalogId,
  AttachmentCategory,
  AttachmentId,
  AttachmentType,
  type AttachmentBehaviorValue,
  type AttachmentCatalogIdValue,
  type AttachmentCategoryValue,
  type AttachmentIdValue,
  type AttachmentTypeValue,
} from '@/types/attachment.ts'
import { MachineCapability, type MachineCapability as MachineCapabilityValue } from '@/types/machine.ts'

export interface AttachmentCatalogEntry {
  id: AttachmentCatalogIdValue
  name: string
  attachmentType: AttachmentTypeValue
  category: AttachmentCategoryValue
  behavior: AttachmentBehaviorValue
  workingWidth: number
  providesCapabilities?: readonly MachineCapabilityValue[]
  supportedCropIds?: readonly string[]
}

export const ATTACHMENT_CATALOG: readonly AttachmentCatalogEntry[] = [
  {
    id: AttachmentCatalogId.Plow,
    name: 'Plow',
    attachmentType: AttachmentType.Implement,
    category: AttachmentCategory.Tillage,
    behavior: AttachmentBehavior.Passive,
    workingWidth: 3,
    providesCapabilities: [MachineCapability.Plow],
  },
  {
    id: AttachmentCatalogId.Seeder,
    name: 'Seeder',
    attachmentType: AttachmentType.Implement,
    category: AttachmentCategory.Seeding,
    behavior: AttachmentBehavior.Active,
    workingWidth: 3,
    providesCapabilities: [MachineCapability.Seed],
  },
  {
    id: AttachmentCatalogId.Wagon,
    name: 'Trailer',
    attachmentType: AttachmentType.Trailer,
    category: AttachmentCategory.Transport,
    behavior: AttachmentBehavior.Passive,
    workingWidth: 0,
  },
  {
    id: AttachmentCatalogId.GrainHeader,
    name: 'Grain Header',
    attachmentType: AttachmentType.Header,
    category: AttachmentCategory.Harvesting,
    behavior: AttachmentBehavior.Passive,
    workingWidth: 6,
    providesCapabilities: [MachineCapability.Harvest],
    supportedCropIds: ['wheat', 'barley', 'canola', 'soybean'],
  },
  {
    id: AttachmentCatalogId.CornHeader,
    name: 'Corn Header',
    attachmentType: AttachmentType.Header,
    category: AttachmentCategory.Harvesting,
    behavior: AttachmentBehavior.Passive,
    workingWidth: 6,
    providesCapabilities: [MachineCapability.Harvest],
    supportedCropIds: ['corn'],
  },
] as const

export interface DefaultAttachmentSpawn {
  id: AttachmentIdValue
  catalogId: AttachmentCatalogIdValue
}

export const DEFAULT_ATTACHMENT_SPAWNS: readonly DefaultAttachmentSpawn[] = [
  { id: AttachmentId.Plow1, catalogId: AttachmentCatalogId.Plow },
  { id: AttachmentId.Seeder1, catalogId: AttachmentCatalogId.Seeder },
  { id: AttachmentId.Trailer1, catalogId: AttachmentCatalogId.Wagon },
  { id: AttachmentId.GrainHeader1, catalogId: AttachmentCatalogId.GrainHeader },
  { id: AttachmentId.CornHeader1, catalogId: AttachmentCatalogId.CornHeader },
] as const

const catalogById = new Map(
  ATTACHMENT_CATALOG.map((entry) => [entry.id, entry]),
)

export function getAttachmentCatalogEntry(
  catalogId: AttachmentCatalogIdValue,
): AttachmentCatalogEntry | undefined {
  return catalogById.get(catalogId)
}

export function getAttachmentDisplayName(
  catalogId: AttachmentCatalogIdValue,
): string {
  return getAttachmentCatalogEntry(catalogId)?.name ?? catalogId
}

export function headerSupportsCrop(
  catalogId: AttachmentCatalogIdValue,
  cropId: string,
): boolean {
  const entry = getAttachmentCatalogEntry(catalogId)
  return entry?.supportedCropIds?.includes(cropId) ?? false
}
