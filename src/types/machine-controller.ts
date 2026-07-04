import type { MachineCommand, MachineCapability, MachineId } from '@/types/machine.ts'
import type { MachineSaveData } from '@/types/save.ts'
import type { TractorSnapshot } from '@/types/tractor.ts'

export interface IMachineController {
  readonly machineId: MachineId
  issueCommand(command: MachineCommand): boolean
  getCapabilities(): readonly MachineCapability[]
  toSnapshot(): TractorSnapshot
  toSaveData(): MachineSaveData
  applySave(saved: MachineSaveData): void
  getPosition(): Readonly<{ x: number; y: number; z: number }>
  getRotationY(): number
}
