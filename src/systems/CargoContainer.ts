import type {
  CargoContainerSaveData,
  CargoContainerSnapshot,
} from '@/types/cargo.ts'

export class CargoContainer {
  private capacity: number
  private quantity: number
  private cropId: string | null

  constructor(capacity: number) {
    this.capacity = capacity > 0 ? capacity : 0
    this.quantity = 0
    this.cropId = null
  }

  static fromSave(
    saved: CargoContainerSaveData | undefined,
    defaultCapacity: number,
  ): CargoContainer {
    const container = new CargoContainer(defaultCapacity)
    container.restoreFromSave(saved)
    return container
  }

  restoreFromSave(saved: CargoContainerSaveData | undefined): void {
    this.capacity =
      typeof saved?.capacity === 'number' && saved.capacity > 0
        ? saved.capacity
        : this.capacity
    this.quantity =
      typeof saved?.quantity === 'number' && saved.quantity >= 0
        ? Math.min(saved.quantity, this.capacity)
        : 0
    this.cropId = typeof saved?.cropId === 'string' ? saved.cropId : null
    if (this.quantity === 0) {
      this.cropId = null
    }
  }

  getCapacity(): number {
    return this.capacity
  }

  getQuantity(): number {
    return this.quantity
  }

  getCropId(): string | null {
    return this.cropId
  }

  getFreeCapacity(): number {
    return Math.max(0, this.capacity - this.quantity)
  }

  hasCargo(): boolean {
    return this.quantity > 0
  }

  isFull(): boolean {
    return this.capacity > 0 && this.quantity >= this.capacity
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

  remove(amount: number): number {
    if (amount <= 0 || this.quantity <= 0) {
      return 0
    }

    const removed = Math.min(amount, this.quantity)
    this.quantity -= removed
    if (this.quantity === 0) {
      this.cropId = null
    }
    return removed
  }

  computeTransferAmount(target: CargoContainer): number {
    if (!this.hasCargo() || !this.cropId) {
      return 0
    }

    const free = target.getFreeCapacity()
    if (free <= 0) {
      return 0
    }

    if (target.hasCargo() && target.getCropId() !== this.cropId) {
      return 0
    }

    if (!target.canAccept(this.cropId, 1)) {
      return 0
    }

    return Math.min(this.quantity, free)
  }

  transferTo(target: CargoContainer, amount?: number): number {
    const transferAmount = Math.min(
      amount ?? this.quantity,
      this.computeTransferAmount(target),
    )
    if (transferAmount <= 0 || !this.cropId) {
      return 0
    }

    if (!target.add(this.cropId, transferAmount)) {
      return 0
    }

    return this.remove(transferAmount)
  }

  toSaveData(): CargoContainerSaveData {
    return {
      capacity: this.capacity,
      quantity: this.quantity,
      cropId: this.quantity > 0 ? this.cropId : null,
    }
  }

  toSnapshot(getCropName: (cropId: string) => string): CargoContainerSnapshot {
    const fillPercent =
      this.capacity > 0 ? Math.min(1, this.quantity / this.capacity) : 0

    return {
      capacity: this.capacity,
      quantity: this.quantity,
      cropId: this.cropId,
      cropName: this.cropId ? getCropName(this.cropId) : null,
      fillPercent,
      hasCargo: this.hasCargo(),
      isFull: this.isFull(),
    }
  }
}
