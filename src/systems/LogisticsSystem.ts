import { MachineId } from '@/types/machine.ts'
import type { InteractionPointId } from '@/types/interaction-point.ts'
import type { AttachmentSystem } from './AttachmentSystem.ts'
import type { InventorySystem } from './InventorySystem.ts'
import type { MachineRegistry } from './MachineRegistry.ts'
import { MachineSlotId, type AttachmentIdValue } from '@/types/attachment.ts'
import { GrainBin } from './GrainBin.ts'

const COMBINE_MACHINE_IDS = new Set<MachineId>([
  MachineId.GrainCombine1,
  MachineId.CornCombine1,
])

export interface LogisticsTransferResult {
  success: boolean
  amount: number
  cropId: string | null
}

export class LogisticsSystem {
  private registry: MachineRegistry | null = null
  private attachmentSystem: AttachmentSystem | null = null
  private inventorySystem: InventorySystem | null = null
  private getCurrentDay: (() => number) | null = null
  private onTransfer: (() => void) | null = null
  private onTransferFailed: (() => void) | null = null

  setOnTransfer(listener: () => void): void {
    this.onTransfer = listener
  }

  setOnTransferFailed(listener: () => void): void {
    this.onTransferFailed = listener
  }

  setMachineRegistry(registry: MachineRegistry): void {
    this.registry = registry
  }

  setAttachmentSystem(attachmentSystem: AttachmentSystem): void {
    this.attachmentSystem = attachmentSystem
  }

  setInventorySystem(inventorySystem: InventorySystem): void {
    this.inventorySystem = inventorySystem
  }

  setCurrentDayProvider(provider: () => number): void {
    this.getCurrentDay = provider
  }

  getMountedTrailerId(machineId: MachineId): AttachmentIdValue | null {
    return this.attachmentSystem?.getSlotAttachmentId(
      machineId,
      MachineSlotId.TrailerHitch,
    ) ?? null
  }

  machineHasTrailer(machineId: MachineId): boolean {
    return this.getMountedTrailerId(machineId) !== null
  }

  computeLoadAmount(
    sourceMachineId: MachineId,
    haulerMachineId: MachineId,
  ): number {
    const sourceBin = this.getCombineGrainBin(sourceMachineId)
    const trailerCargo = this.getTrailerCargoForMachine(haulerMachineId)
    if (!sourceBin || !trailerCargo || !sourceBin.hasCargo()) {
      return 0
    }
    return sourceBin.getContainer().computeTransferAmount(trailerCargo)
  }

  canLoadFromCombine(
    sourceMachineId: MachineId,
    haulerMachineId: MachineId,
  ): boolean {
    if (sourceMachineId === haulerMachineId) {
      return false
    }
    if (!this.machineHasTrailer(haulerMachineId)) {
      return false
    }
    const sourceBin = this.getCombineGrainBin(sourceMachineId)
    if (!sourceBin?.hasCargo()) {
      return false
    }
    return this.computeLoadAmount(sourceMachineId, haulerMachineId) > 0
  }

  loadFromCombine(
    sourceMachineId: MachineId,
    haulerMachineId: MachineId,
  ): LogisticsTransferResult {
    const sourceBin = this.getCombineGrainBin(sourceMachineId)
    const trailerCargo = this.getTrailerCargoForMachine(haulerMachineId)
    if (!sourceBin || !trailerCargo) {
      return { success: false, amount: 0, cropId: null }
    }

    const cropId = sourceBin.getCropId()
    const amount = sourceBin.transferTo(trailerCargo)
    if (amount > 0) {
      this.onTransfer?.()
    } else {
      this.onTransferFailed?.()
    }
    return {
      success: amount > 0,
      amount,
      cropId: amount > 0 ? cropId : null,
    }
  }

  canUnloadToSilo(haulerMachineId: MachineId): boolean {
    const trailerCargo = this.getTrailerCargoForMachine(haulerMachineId)
    return trailerCargo?.hasCargo() ?? false
  }

  unloadTrailerToSilo(
    haulerMachineId: MachineId,
    _interactionPointId: InteractionPointId,
  ): LogisticsTransferResult {
    const trailerCargo = this.getTrailerCargoForMachine(haulerMachineId)
    const inventory = this.inventorySystem
    if (!trailerCargo || !inventory || !trailerCargo.hasCargo()) {
      return { success: false, amount: 0, cropId: null }
    }

    const cropId = trailerCargo.getCropId()
    if (!cropId) {
      return { success: false, amount: 0, cropId: null }
    }

    const amount = trailerCargo.getQuantity()
    const removed = trailerCargo.remove(amount)
    if (removed <= 0) {
      return { success: false, amount: 0, cropId: null }
    }

    const day = this.getCurrentDay?.() ?? 1
    if (!inventory.addCrop(cropId, removed, day)) {
      trailerCargo.add(cropId, removed)
      this.onTransferFailed?.()
      return { success: false, amount: 0, cropId: null }
    }

    this.onTransfer?.()

    return { success: true, amount: removed, cropId }
  }

  private getCombineGrainBin(machineId: MachineId): GrainBin | null {
    if (!COMBINE_MACHINE_IDS.has(machineId)) {
      return null
    }
    const controller = this.registry?.get(machineId)
    if (!controller?.getGrainBinForLogistics) {
      return null
    }
    return controller.getGrainBinForLogistics()
  }

  private getTrailerCargoForMachine(machineId: MachineId) {
    const trailerId = this.getMountedTrailerId(machineId)
    if (!trailerId || !this.attachmentSystem) {
      return null
    }
    return this.attachmentSystem.getTrailerCargo(trailerId)
  }
}
