import { FieldOwnership } from '@/types/ownership.ts'
import type { FieldBlockId } from '@/config/map-01-layout.ts'
import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'

export type FieldDevelopmentTier = 'starter' | 'early' | 'mid' | 'late'

export interface FieldCatalogEntry {
  id: string
  name: string
  purchasePrice: number
  leasePrice: number
  area: number
  fertility: number
  initialOwnership: FieldOwnership
  blockId: FieldBlockId
  developmentTier: FieldDevelopmentTier
}

/** Static catalog — used for Studio export and builtin fallback. */
export const FIELD_CATALOG: readonly FieldCatalogEntry[] = [
  {
    id: 'field_1',
    name: 'Domácí pole',
    purchasePrice: 0,
    leasePrice: 0,
    area: 10,
    fertility: 85,
    initialOwnership: FieldOwnership.Owned,
    blockId: 'A',
    developmentTier: 'starter',
  },
  {
    id: 'field_2',
    name: 'U rybníka',
    purchasePrice: 0,
    leasePrice: 0,
    area: 11,
    fertility: 80,
    initialOwnership: FieldOwnership.Owned,
    blockId: 'A',
    developmentTier: 'starter',
  },
  {
    id: 'field_3',
    name: 'Přední svah',
    purchasePrice: 0,
    leasePrice: 0,
    area: 9,
    fertility: 75,
    initialOwnership: FieldOwnership.Owned,
    blockId: 'A',
    developmentTier: 'starter',
  },
  {
    id: 'field_4',
    name: 'Východní lán',
    purchasePrice: 3500,
    leasePrice: 550,
    area: 12,
    fertility: 78,
    initialOwnership: FieldOwnership.Available,
    blockId: 'A',
    developmentTier: 'early',
  },
  {
    id: 'field_5',
    name: 'B-01 Horní lán',
    purchasePrice: 8000,
    leasePrice: 1200,
    area: 16,
    fertility: 82,
    initialOwnership: FieldOwnership.Available,
    blockId: 'B',
    developmentTier: 'mid',
  },
  {
    id: 'field_6',
    name: 'B-01 Dolní lán',
    purchasePrice: 9500,
    leasePrice: 1400,
    area: 18,
    fertility: 88,
    initialOwnership: FieldOwnership.Available,
    blockId: 'B',
    developmentTier: 'mid',
  },
  {
    id: 'field_7',
    name: 'B-02 Údolní pole',
    purchasePrice: 11000,
    leasePrice: 1600,
    area: 20,
    fertility: 80,
    initialOwnership: FieldOwnership.Available,
    blockId: 'B',
    developmentTier: 'mid',
  },
  {
    id: 'field_8',
    name: 'B-03 U cesty',
    purchasePrice: 7000,
    leasePrice: 1000,
    area: 14,
    fertility: 76,
    initialOwnership: FieldOwnership.Available,
    blockId: 'B',
    developmentTier: 'mid',
  },
  {
    id: 'field_9',
    name: 'C-01 Přes údolí',
    purchasePrice: 18000,
    leasePrice: 2600,
    area: 22,
    fertility: 84,
    initialOwnership: FieldOwnership.Available,
    blockId: 'C',
    developmentTier: 'late',
  },
] as const

export function getFieldCatalog(): readonly FieldCatalogEntry[] {
  return tryGetActiveMapContext()?.fields ?? FIELD_CATALOG
}

export function getFieldIds(): readonly string[] {
  return getFieldCatalog().map((entry) => entry.id)
}

/** @deprecated Use getFieldIds() — static ids from bundled catalog. */
export const FIELD_IDS = FIELD_CATALOG.map((entry) => entry.id)

export function getFieldCatalogEntry(id: string): FieldCatalogEntry | undefined {
  return getFieldCatalog().find((entry) => entry.id === id)
}
