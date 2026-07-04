import {
  DEFAULT_GRAIN_BIN_CAPACITY,
  type GrainBinSaveData,
  type GrainBinSnapshot,
} from '@/types/grain-bin.ts'
import { CargoContainer } from './CargoContainer.ts'

export class GrainBin {
  private readonly container: CargoContainer

  constructor(capacity = DEFAULT_GRAIN_BIN_CAPACITY) {
    this.container = new CargoContainer(capacity)
  }

  static fromSave(saved: GrainBinSaveData | undefined): GrainBin {
    const bin = new GrainBin()
    bin.restoreFromSave(saved)
    return bin
  }

  restoreFromSave(saved: GrainBinSaveData | undefined): void {
    this.container.restoreFromSave(saved)
  }

  canAccept(cropId: string, amount: number): boolean {
    return this.container.canAccept(cropId, amount)
  }

  add(cropId: string, amount: number): boolean {
    return this.container.add(cropId, amount)
  }

  remove(amount: number): number {
    return this.container.remove(amount)
  }

  hasCargo(): boolean {
    return this.container.hasCargo()
  }

  isFull(): boolean {
    return this.container.isFull()
  }

  getQuantity(): number {
    return this.container.getQuantity()
  }

  getCropId(): string | null {
    return this.container.getCropId()
  }

  getFreeCapacity(): number {
    return this.container.getFreeCapacity()
  }

  getContainer(): CargoContainer {
    return this.container
  }

  transferTo(target: CargoContainer, amount?: number): number {
    return this.container.transferTo(target, amount)
  }

  toSaveData(): GrainBinSaveData {
    return this.container.toSaveData()
  }

  toSnapshot(getCropName: (cropId: string) => string): GrainBinSnapshot {
    return this.container.toSnapshot(getCropName)
  }
}
