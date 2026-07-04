import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import type { IMachineController } from '@/types/machine-controller.ts'
import type { MachineCommand, MachineId } from '@/types/machine.ts'

export class MachineRegistry {
  private readonly controllers = new Map<MachineId, IMachineController>()

  register(controller: IMachineController): void {
    this.controllers.set(controller.machineId, controller)
  }

  get(machineId: MachineId): IMachineController | undefined {
    return this.controllers.get(machineId)
  }

  getAll(): readonly IMachineController[] {
    return [...this.controllers.values()]
  }

  issueCommand(machineId: MachineId, command: MachineCommand): boolean {
    const controller = this.controllers.get(machineId)
    if (!controller) {
      return false
    }

    if (!getMachineCatalogEntry(machineId)) {
      return false
    }

    return controller.issueCommand(command)
  }
}
