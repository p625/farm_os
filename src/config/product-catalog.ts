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
import { AttachmentCatalogId, AttachmentId } from '@/types/attachment.ts'

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
  {
    id: ProductId.FertilizerSpreader,
    storeType: FarmStoreType.Dealer,
    category: ProductCategory.Attachments,
    name: 'Rozmetadlo hnojiva',
    description: 'Zadní rozmetadlo pro hnojení porostu během růstu.',
    price: 0,
    imageKey: 'fertilizer_spreader',
    specifications: [
      'Hnojení během růstu plodiny',
      'Zvyšuje výnos až o 12 %',
      'Vyžaduje traktor se zadním závěsem',
    ],
    fulfillment: {
      kind: ProductFulfillmentKind.Attachment,
      attachmentCatalogId: AttachmentCatalogId.FertilizerSpreader,
      attachmentInstanceId: AttachmentId.FertilizerSpreader1,
    },
    maxOwned: 1,
    deliveryDelayDays: 0,
  },
  {
    id: ProductId.Sprayer,
    storeType: FarmStoreType.Dealer,
    category: ProductCategory.Attachments,
    name: 'Postřikovač',
    description: 'Zadní postřikovač pro ochranu a podporu porostu.',
    price: 0,
    imageKey: 'sprayer',
    specifications: [
      'Postřik během růstu plodiny',
      'Zvyšuje výnos až o 8 %',
      'Kombinuje se s hnojením pro vyšší bonus',
    ],
    fulfillment: {
      kind: ProductFulfillmentKind.Attachment,
      attachmentCatalogId: AttachmentCatalogId.Sprayer,
      attachmentInstanceId: AttachmentId.Sprayer1,
    },
    maxOwned: 1,
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
