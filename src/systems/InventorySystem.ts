import { CROP_CATALOG, getCropDefinition } from '@/config/crop-catalog.ts'
import type { GameEventLog } from '@game/GameEventLog.ts'
import type { InventoryItemSnapshot } from '@/types/market.ts'
import { GameSystem } from './GameSystem.ts'

export class InventorySystem extends GameSystem {
  readonly name = 'InventorySystem'
  private readonly quantities = new Map<string, number>()
  private eventLog: GameEventLog | null = null
  private onChange: (() => void) | null = null

  initialize(): void {
    this.quantities.clear()
    this.notifyChange()
  }

  update(_deltaTime: number): void {
    // Inventory changes are event-driven.
  }

  setEventLog(eventLog: GameEventLog): void {
    this.eventLog = eventLog
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  applySave(
    savedInventory: readonly { cropId: string; quantity: number }[],
  ): void {
    this.quantities.clear()
    for (const entry of CROP_CATALOG) {
      this.quantities.set(entry.id, 0)
    }
    for (const saved of savedInventory) {
      if (!getCropDefinition(saved.cropId)) {
        continue
      }
      this.quantities.set(saved.cropId, Math.max(0, saved.quantity))
    }
    this.notifyChange()
  }

  toSaveInventory(): { cropId: string; quantity: number }[] {
    return CROP_CATALOG.map((crop) => ({
      cropId: crop.id,
      quantity: this.getQuantity(crop.id),
    }))
  }

  getQuantity(cropId: string): number {
    return this.quantities.get(cropId) ?? 0
  }

  addCrop(cropId: string, quantity: number, day: number): boolean {
    const crop = getCropDefinition(cropId)
    if (!crop || quantity <= 0) {
      return false
    }

    const current = this.getQuantity(cropId)
    this.quantities.set(cropId, current + quantity)
    this.eventLog?.recordHarvestStored(crop.name, quantity, day)
    this.notifyChange()
    return true
  }

  removeCrop(cropId: string, quantity: number): boolean {
    const current = this.getQuantity(cropId)
    if (quantity <= 0 || current < quantity) {
      return false
    }
    this.quantities.set(cropId, current - quantity)
    this.notifyChange()
    return true
  }

  toSnapshots(): InventoryItemSnapshot[] {
    return CROP_CATALOG.filter((crop) => this.getQuantity(crop.id) > 0).map(
      (crop) => ({
        cropId: crop.id,
        cropName: crop.name,
        quantity: this.getQuantity(crop.id),
        displayColor: crop.displayColor,
      }),
    )
  }

  dispose(): void {
    this.quantities.clear()
    this.eventLog = null
    this.onChange = null
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}
