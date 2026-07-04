import type { ProductCategory, ProductIdValue } from './product.ts'
import type { ProductCardSnapshot } from './product.ts'
import type { DeliveryQueueEntry, DeliveryZoneId } from './delivery.ts'

export const FarmStoreType = {
  Dealer: 'dealer',
  Agronomy: 'agronomy',
  Livestock: 'livestock',
  Forestry: 'forestry',
} as const

export type FarmStoreType =
  (typeof FarmStoreType)[keyof typeof FarmStoreType]

export const FarmStoreId = {
  Dealer: 'dealer_main',
} as const

export type FarmStoreId =
  (typeof FarmStoreId)[keyof typeof FarmStoreId]

export interface FarmStoreDefinition {
  id: FarmStoreId
  storeType: FarmStoreType
  name: string
  interactionPointId: string
  deliveryZoneId: DeliveryZoneId
}

export interface FarmStoreSaveData {
  ownedProducts: Record<string, number>
  deliveryQueue: DeliveryQueueEntry[]
}

export interface FarmStoreSnapshot {
  open: boolean
  storeId: FarmStoreId | null
  storeName: string | null
  activeCategory: ProductCategory
  products: readonly ProductCardSnapshot[]
}

export type OwnedProductCounts = Record<ProductIdValue, number>
