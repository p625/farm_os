import type { FarmStoreType } from './farm-store.ts'
import type { MachineTemplateId } from './machine-template.ts'
import type { AttachmentCatalogIdValue, AttachmentIdValue } from './attachment.ts'

export const ProductCategory = {
  Tractors: 'tractors',
  Harvesters: 'harvesters',
  Attachments: 'attachments',
  Trailers: 'trailers',
  Fertilizers: 'fertilizers',
  Chemicals: 'chemicals',
} as const

export type ProductCategory =
  (typeof ProductCategory)[keyof typeof ProductCategory]

export const ProductFulfillmentKind = {
  Machine: 'machine',
  Attachment: 'attachment',
  Inventory: 'inventory',
  Pallet: 'pallet',
} as const

export type ProductFulfillmentKind =
  (typeof ProductFulfillmentKind)[keyof typeof ProductFulfillmentKind]

export type ProductFulfillment =
  | { kind: typeof ProductFulfillmentKind.Machine; machineTemplateId: MachineTemplateId }
  | {
      kind: typeof ProductFulfillmentKind.Attachment
      attachmentCatalogId: AttachmentCatalogIdValue
      attachmentInstanceId: AttachmentIdValue
    }
  | { kind: typeof ProductFulfillmentKind.Inventory; itemId: string }
  | { kind: typeof ProductFulfillmentKind.Pallet; palletId: string }

export const ProductId = {
  SmallTractor: 'product_small_tractor',
  FertilizerSpreader: 'product_fertilizer_spreader',
  Sprayer: 'product_sprayer',
} as const

export type ProductIdValue = (typeof ProductId)[keyof typeof ProductId] | string

export const ProductAvailability = {
  Available: 'available',
  Unaffordable: 'unaffordable',
  LimitReached: 'limit_reached',
  ComingSoon: 'coming_soon',
} as const

export type ProductAvailability =
  (typeof ProductAvailability)[keyof typeof ProductAvailability]

export interface ProductDefinition {
  id: ProductIdValue
  storeType: FarmStoreType
  category: ProductCategory
  name: string
  description: string
  price: number
  imageKey: string
  specifications: readonly string[]
  fulfillment: ProductFulfillment
  maxOwned?: number
  deliveryDelayDays?: number
}

export interface ProductCardSnapshot {
  id: ProductIdValue
  category: ProductCategory
  name: string
  description: string
  price: number
  imageKey: string
  specifications: readonly string[]
  availability: ProductAvailability
  ownedCount: number
  maxOwned: number | null
  canPurchase: boolean
}
