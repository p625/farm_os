import { CROP_CATALOG, getCropDefinition } from '@/config/crop-catalog.ts'
import {
  PROCESSED_CATALOG,
  getProcessedProductDefinition,
} from '@/config/production-catalog.ts'
import type { GameEventLog } from '@game/GameEventLog.ts'
import type { MarketPriceSnapshot } from '@/types/market.ts'
import type {
  ProcessedMarketPriceSnapshot,
  ProcessedProductId,
} from '@/types/production.ts'
import { GameSystem } from './GameSystem.ts'

const PRICE_SWING = 0.15

export class MarketSystem extends GameSystem {
  readonly name = 'MarketSystem'
  private readonly prices = new Map<string, number>()
  private readonly processedPrices = new Map<ProcessedProductId, number>()
  private eventLog: GameEventLog | null = null
  private onChange: (() => void) | null = null

  initialize(): void {
    this.prices.clear()
    this.processedPrices.clear()
    for (const crop of CROP_CATALOG) {
      this.prices.set(crop.id, crop.sellingPrice)
    }
    for (const product of PROCESSED_CATALOG) {
      this.processedPrices.set(product.id, product.basePrice)
    }
    this.notifyChange()
  }

  update(_deltaTime: number): void {
    // Prices advance on game day ticks.
  }

  setEventLog(eventLog: GameEventLog): void {
    this.eventLog = eventLog
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  applySave(
    savedPrices: readonly { cropId: string; price: number }[],
    savedProcessedPrices: readonly { productId: string; price: number }[] = [],
  ): void {
    this.initialize()
    for (const saved of savedPrices) {
      if (!getCropDefinition(saved.cropId)) {
        continue
      }
      this.prices.set(saved.cropId, Math.max(1, saved.price))
    }
    for (const saved of savedProcessedPrices) {
      const product = getProcessedProductDefinition(saved.productId)
      if (!product) {
        continue
      }
      this.processedPrices.set(product.id, Math.max(1, saved.price))
    }
    this.notifyChange()
  }

  toSavePrices(): { cropId: string; price: number }[] {
    return CROP_CATALOG.map((crop) => ({
      cropId: crop.id,
      price: this.getPrice(crop.id),
    }))
  }

  toSaveProcessedPrices(): { productId: ProcessedProductId; price: number }[] {
    return PROCESSED_CATALOG.map((product) => ({
      productId: product.id,
      price: this.getProcessedPrice(product.id),
    }))
  }

  getPrice(cropId: string): number {
    const crop = getCropDefinition(cropId)
    if (!crop) {
      return 0
    }
    return this.prices.get(cropId) ?? crop.sellingPrice
  }

  getProcessedPrice(productId: ProcessedProductId): number {
    const product = getProcessedProductDefinition(productId)
    if (!product) {
      return 0
    }
    return this.processedPrices.get(productId) ?? product.basePrice
  }

  advanceDay(day: number): void {
    for (const crop of CROP_CATALOG) {
      const basePrice = crop.sellingPrice
      const swing = this.daySwing(day, crop.id)
      const nextPrice = Math.max(
        1,
        Math.round(basePrice * (1 + swing * PRICE_SWING)),
      )
      const previousPrice = this.getPrice(crop.id)
      this.prices.set(crop.id, nextPrice)

      if (nextPrice !== previousPrice) {
        this.eventLog?.recordPriceChanged(crop.name, day)
      }
    }

    for (const product of PROCESSED_CATALOG) {
      const basePrice = product.basePrice
      const swing = this.daySwing(day, `processed_${product.id}`)
      const nextPrice = Math.max(
        1,
        Math.round(basePrice * (1 + swing * PRICE_SWING)),
      )
      const previousPrice = this.getProcessedPrice(product.id)
      this.processedPrices.set(product.id, nextPrice)

      if (nextPrice !== previousPrice) {
        this.eventLog?.recordPriceChanged(product.name, day)
      }
    }

    this.notifyChange()
  }

  toSnapshots(): MarketPriceSnapshot[] {
    return CROP_CATALOG.map((crop) => ({
      cropId: crop.id,
      cropName: crop.name,
      currentPrice: this.getPrice(crop.id),
      basePrice: crop.sellingPrice,
      displayColor: crop.displayColor,
    }))
  }

  toProcessedSnapshots(): ProcessedMarketPriceSnapshot[] {
    return PROCESSED_CATALOG.map((product) => ({
      productId: product.id,
      productName: product.name,
      currentPrice: this.getProcessedPrice(product.id),
      basePrice: product.basePrice,
      displayColor: product.displayColor,
    }))
  }

  dispose(): void {
    this.prices.clear()
    this.processedPrices.clear()
    this.eventLog = null
    this.onChange = null
  }

  private daySwing(day: number, cropId: string): number {
    let hash = day * 17
    for (const char of cropId) {
      hash = (hash * 31 + char.charCodeAt(0)) | 0
    }
    const normalized = ((hash >>> 0) % 2001) / 1000 - 1
    return normalized
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}
