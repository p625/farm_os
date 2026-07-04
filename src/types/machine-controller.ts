import type { MachineCommand, MachineCapability, MachineId } from '@/types/machine.ts'
import type { MachineSaveData } from '@/types/save.ts'
import type { TractorSnapshot } from '@/types/tractor.ts'
import type { GrainBinSnapshot } from '@/types/grain-bin.ts'
import type { GrainBin } from '@systems/GrainBin.ts'

export interface IMachineController {
  readonly machineId: MachineId
  issueCommand(command: MachineCommand): boolean
  cancelActiveCommand(): void
  getCapabilities(): readonly MachineCapability[]
  isBusy(): boolean
  toSnapshot(): TractorSnapshot
  toSaveData(): MachineSaveData
  applySave(saved: MachineSaveData): void
  getPosition(): Readonly<{ x: number; y: number; z: number }>
  getRotationY(): number
  getGrainBinSnapshot?(): GrainBinSnapshot | null
  getGrainBinForLogistics?(): GrainBin | null
}
