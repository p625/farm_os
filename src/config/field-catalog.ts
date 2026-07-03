import { FieldOwnership } from '@/types/ownership.ts'

export interface FieldCatalogEntry {
  id: string
  name: string
  purchasePrice: number
  leasePrice: number
  area: number
  fertility: number
  initialOwnership: FieldOwnership
}

export const FIELD_CATALOG: readonly FieldCatalogEntry[] = [
  {
    id: 'field_1',
    name: 'North Field',
    purchasePrice: 0,
    leasePrice: 0,
    area: 10,
    fertility: 85,
    initialOwnership: FieldOwnership.Owned,
  },
  {
    id: 'field_2',
    name: 'Center Field',
    purchasePrice: 0,
    leasePrice: 0,
    area: 11,
    fertility: 80,
    initialOwnership: FieldOwnership.Owned,
  },
  {
    id: 'field_3',
    name: 'South Field',
    purchasePrice: 0,
    leasePrice: 0,
    area: 9,
    fertility: 75,
    initialOwnership: FieldOwnership.Owned,
  },
  {
    id: 'field_4',
    name: 'East Field',
    purchasePrice: 2500,
    leasePrice: 400,
    area: 12,
    fertility: 78,
    initialOwnership: FieldOwnership.Available,
  },
  {
    id: 'field_5',
    name: 'West Field',
    purchasePrice: 2200,
    leasePrice: 350,
    area: 9,
    fertility: 72,
    initialOwnership: FieldOwnership.Available,
  },
  {
    id: 'field_6',
    name: 'Northeast Field',
    purchasePrice: 3000,
    leasePrice: 500,
    area: 14,
    fertility: 90,
    initialOwnership: FieldOwnership.Available,
  },
] as const

export const FIELD_IDS = FIELD_CATALOG.map((entry) => entry.id)

const catalogById = new Map(FIELD_CATALOG.map((entry) => [entry.id, entry]))

export function getFieldCatalogEntry(id: string): FieldCatalogEntry | undefined {
  return catalogById.get(id)
}
