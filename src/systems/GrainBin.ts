import {
  DEFAULT_GRAIN_BIN_CAPACITY,
  type GrainBinSaveData,
  type GrainBinSnapshot,
} from '@/types/grain-bin.ts'

export class GrainBin {
  private capacity: number
  private quantity: number
  private cropId: string | null

  constructor(capacity = DEFAULT_GRAIN_BIN_CAPACITY) {
    this.capacity = capacity
    this.quantity = 0
    this.cropId = null
  }

  static fromSave(saved: GrainBinSaveData | undefined): GrainBin {
    const bin = new GrainBin()
    bin.restoreFromSave(saved)
    return bin
  }

  restoreFromSave(saved: GrainBinSaveData | undefined): void {
    this.capacity =
      typeof saved?.capacity === 'number' && saved.capacity > 0
        ? saved.capacity
        : DEFAULT_GRAIN_BIN_CAPACITY
    this.quantity =
      typeof saved?.quantity === 'number' && saved.quantity >= 0
        ? saved.quantity
        : 0
    this.cropId = typeof saved?.cropId === 'string' ? saved.cropId : null
    if (this.quantity === 0) {
      this.cropId = null
    }
  }

  canAccept(cropId: string, amount: number): boolean {
    if (amount <= 0) {
      return false
    }
    if (this.quantity === 0) {
      return amount <= this.capacity
    }
    if (this.cropId !== cropId) {
      return false
    }
    return this.quantity + amount <= this.capacity
  }

  add(cropId: string, amount: number): boolean {
    if (!this.canAccept(cropId, amount)) {
      return false
    }

    if (this.quantity === 0) {
      this.cropId = cropId
    }

    this.quantity += amount
    return true
  }

  toSaveData(): GrainBinSaveData {
    return {
      capacity: this.capacity,
      quantity: this.quantity,
      cropId: this.quantity > 0 ? this.cropId : null,
    }
  }

  toSnapshot(getCropName: (cropId: string) => string): GrainBinSnapshot {
    return {
      capacity: this.capacity,
      quantity: this.quantity,
      cropId: this.cropId,
      cropName: this.cropId ? getCropName(this.cropId) : null,
      fillPercent:
        this.capacity > 0 ? Math.min(1, this.quantity / this.capacity) : 0,
    }
  }
}
