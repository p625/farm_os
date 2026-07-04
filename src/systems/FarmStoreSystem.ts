import {
  PRODUCT_CATALOG,
  PRODUCT_CATEGORIES,
  getProductDefinition,
  getProductsForStore,
} from '@/config/product-catalog.ts'
import {
  getFarmStoreDefinition,
} from '@/config/farm-store-catalog.ts'
import {
  findOpenDeliverySlot,
} from '@/config/delivery-zone-catalog.ts'
import {
  DeliveryStatus,
  type DeliveryQueueEntry,
  type MachineDeliveryFulfillment,
} from '@/types/delivery.ts'
import {
  type FarmStoreId,
  type FarmStoreSaveData,
  type FarmStoreSnapshot,
  type OwnedProductCounts,
} from '@/types/farm-store.ts'
import {
  ProductAvailability,
  ProductCategory,
  ProductFulfillmentKind,
  type ProductCardSnapshot,
  type ProductIdValue,
} from '@/types/product.ts'
import { MachineTemplateId } from '@/types/machine-template.ts'
import { getPurchasedTractorInstanceIds } from './MachineInstanceRegistry.ts'

export interface PurchaseContext {
  money: number
  currentDay: number
  machinePositions: readonly { x: number; z: number }[]
}

export interface PurchaseResult {
  productId: ProductIdValue
  price: number
  fulfillment: MachineDeliveryFulfillment
}

export class FarmStoreSystem {
  private ownedProducts: OwnedProductCounts = {}
  private deliveryQueue: DeliveryQueueEntry[] = []
  private open = false
  private activeStoreId: FarmStoreId | null = null
  private activeCategory: ProductCategory = ProductCategory.Tractors
  private nextDeliveryId = 1

  initialize(): void {
    this.ownedProducts = {}
    this.deliveryQueue = []
    this.open = false
    this.activeStoreId = null
    this.activeCategory = ProductCategory.Tractors
    this.nextDeliveryId = 1
  }

  applySave(saved: FarmStoreSaveData | undefined): void {
    this.ownedProducts = { ...(saved?.ownedProducts ?? {}) }
    this.deliveryQueue = [...(saved?.deliveryQueue ?? [])]
    this.open = false
    this.activeStoreId = null
    this.activeCategory = ProductCategory.Tractors
    this.nextDeliveryId =
      this.deliveryQueue.reduce((max, entry) => Math.max(max, Number(entry.id)), 0) + 1
  }

  toSaveData(): FarmStoreSaveData {
    return {
      ownedProducts: { ...this.ownedProducts },
      deliveryQueue: [...this.deliveryQueue],
    }
  }

  openStore(storeId: FarmStoreId): boolean {
    if (!getFarmStoreDefinition(storeId)) {
      return false
    }
    this.open = true
    this.activeStoreId = storeId
    this.activeCategory = ProductCategory.Tractors
    return true
  }

  closeStore(): void {
    this.open = false
    this.activeStoreId = null
  }

  isOpen(): boolean {
    return this.open
  }

  setActiveCategory(category: ProductCategory): void {
    this.activeCategory = category
  }

  getActiveCategory(): ProductCategory {
    return this.activeCategory
  }

  getOwnedCount(productId: ProductIdValue): number {
    return this.ownedProducts[productId] ?? 0
  }

  buildSnapshot(money: number): FarmStoreSnapshot {
    const store = this.activeStoreId
      ? getFarmStoreDefinition(this.activeStoreId)
      : null

    return {
      open: this.open,
      storeId: this.activeStoreId,
      storeName: store?.name ?? null,
      activeCategory: this.activeCategory,
      products: this.buildProductCards(money),
    }
  }

  buildProductCards(money: number): ProductCardSnapshot[] {
    if (!this.activeStoreId) {
      return []
    }

    const store = getFarmStoreDefinition(this.activeStoreId)
    if (!store) {
      return []
    }

    const products = getProductsForStore(store.storeType).filter(
      (product) => product.category === this.activeCategory,
    )

    return products.map((product) => this.toProductCard(product, money))
  }

  getProductCategories(): readonly ProductCategory[] {
    return PRODUCT_CATEGORIES
  }

  preparePurchase(
    productId: ProductIdValue,
    context: PurchaseContext,
  ): PurchaseResult | null {
    const product = getProductDefinition(productId)
    if (!product) {
      return null
    }

    const store = this.activeStoreId
      ? getFarmStoreDefinition(this.activeStoreId)
      : null
    if (!store || product.storeType !== store.storeType) {
      return null
    }

    const availability = this.resolveAvailability(product.id, product.price, context.money, product.maxOwned)
    if (availability !== ProductAvailability.Available) {
      return null
    }

    if (product.fulfillment.kind !== ProductFulfillmentKind.Machine) {
      return null
    }

    if (product.fulfillment.machineTemplateId !== MachineTemplateId.SmallTractor) {
      return null
    }

    const slot = findOpenDeliverySlot(
      store.deliveryZoneId,
      context.machinePositions,
    )
    if (!slot) {
      return null
    }

    const fulfillment: MachineDeliveryFulfillment = {
      kind: 'machine',
      machineTemplateId: product.fulfillment.machineTemplateId,
      machineInstanceId: '',
      position: { x: slot.x, y: slot.y, z: slot.z },
      rotationY: slot.rotationY,
    }

    return {
      productId: product.id,
      price: product.price,
      fulfillment,
    }
  }

  commitPurchase(
    result: PurchaseResult,
    instanceId: string,
    currentDay: number,
  ): void {
    const product = getProductDefinition(result.productId)
    if (!product) {
      return
    }

    this.ownedProducts[result.productId] =
      (this.ownedProducts[result.productId] ?? 0) + 1

    const entry: DeliveryQueueEntry = {
      id: String(this.nextDeliveryId++),
      productId: result.productId,
      orderedDay: currentDay,
      deliverOnDay: currentDay + (product.deliveryDelayDays ?? 0),
      status: DeliveryStatus.Pending,
      fulfillment: {
        ...result.fulfillment,
        machineInstanceId: instanceId,
      },
    }

    this.deliveryQueue.push(entry)
    this.processInstantDeliveries(currentDay)
  }

  processInstantDeliveries(currentDay: number): DeliveryQueueEntry[] {
    const ready: DeliveryQueueEntry[] = []

    this.deliveryQueue = this.deliveryQueue.filter((entry) => {
      if (entry.deliverOnDay > currentDay) {
        return true
      }

      const completed: DeliveryQueueEntry = {
        ...entry,
        status: DeliveryStatus.Delivered,
      }
      ready.push(completed)
      return false
    })

    return ready
  }

  hasDeliveryZoneSpace(
    storeId: FarmStoreId,
    machinePositions: readonly { x: number; z: number }[],
  ): boolean {
    const store = getFarmStoreDefinition(storeId)
    if (!store) {
      return false
    }
    return findOpenDeliverySlot(store.deliveryZoneId, machinePositions) !== null
  }

  private toProductCard(
    product: (typeof PRODUCT_CATALOG)[number],
    money: number,
  ): ProductCardSnapshot {
    const ownedCount = this.getOwnedCount(product.id)
    const availability = this.resolveAvailability(
      product.id,
      product.price,
      money,
      product.maxOwned,
    )

    return {
      id: product.id,
      category: product.category,
      name: product.name,
      description: product.description,
      price: product.price,
      imageKey: product.imageKey,
      specifications: product.specifications,
      availability,
      ownedCount,
      maxOwned: product.maxOwned ?? null,
      canPurchase: availability === ProductAvailability.Available,
    }
  }

  private resolveAvailability(
    productId: ProductIdValue,
    price: number,
    money: number,
    maxOwned?: number,
  ): ProductAvailability {
    const product = getProductDefinition(productId)
    if (!product) {
      return ProductAvailability.ComingSoon
    }

    if (product.fulfillment.kind !== ProductFulfillmentKind.Machine) {
      return ProductAvailability.ComingSoon
    }

    if (maxOwned !== undefined && this.getOwnedCount(productId) >= maxOwned) {
      return ProductAvailability.LimitReached
    }

    if (money < price) {
      return ProductAvailability.Unaffordable
    }

    return ProductAvailability.Available
  }

  reconcileOwnedProductsFromMachines(): void {
    const purchasedTractors = getPurchasedTractorInstanceIds().length
    const productId = 'product_small_tractor'
    const current = this.ownedProducts[productId] ?? 0
    if (purchasedTractors > current) {
      this.ownedProducts[productId] = purchasedTractors
    }
  }
}
