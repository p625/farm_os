import {
  FarmStoreId,
  FarmStoreType,
  type FarmStoreId as FarmStoreIdValue,
} from '@/types/farm-store.ts'
import {
  ProductCategory,
  ProductFulfillmentKind,
  ProductId,
  type ProductDefinition,
} from '@/types/product.ts'
import { MachineTemplateId } from '@/types/machine-template.ts'

export const PRODUCT_CATALOG: readonly ProductDefinition[] = [
  {
    id: ProductId.SmallTractor,
    storeType: FarmStoreType.Dealer,
    category: ProductCategory.Tractors,
    name: 'Small Tractor',
    description: 'Compact utility tractor for field work and towing.',
    price: 15000,
    imageKey: 'tractor_small',
    specifications: [
      'Move & tow attachments',
      'Front, rear, and trailer hitches',
      'Ideal for small and medium fields',
    ],
    fulfillment: {
      kind: ProductFulfillmentKind.Machine,
      machineTemplateId: MachineTemplateId.SmallTractor,
    },
    maxOwned: 2,
    deliveryDelayDays: 0,
  },
] as const

const productById = new Map(PRODUCT_CATALOG.map((entry) => [entry.id, entry]))

export function getProductDefinition(
  productId: string,
): ProductDefinition | undefined {
  return productById.get(productId)
}

export function getProductsForStore(
  storeType: FarmStoreType,
): readonly ProductDefinition[] {
  return PRODUCT_CATALOG.filter((entry) => entry.storeType === storeType)
}

export function getStoreIdForProduct(
  productId: string,
): FarmStoreIdValue | null {
  const product = getProductDefinition(productId)
  if (!product) {
    return null
  }

  if (product.storeType === FarmStoreType.Dealer) {
    return FarmStoreId.Dealer
  }

  return null
}

export const PRODUCT_CATEGORIES: readonly ProductCategory[] = [
  ProductCategory.Tractors,
  ProductCategory.Harvesters,
  ProductCategory.Attachments,
  ProductCategory.Trailers,
  ProductCategory.Fertilizers,
  ProductCategory.Chemicals,
]
