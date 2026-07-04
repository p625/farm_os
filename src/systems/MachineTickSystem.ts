import type { MachineRegistry } from './MachineRegistry.ts'
import { GameSystem } from './GameSystem.ts'
import type { IMachineController } from '@/types/machine-controller.ts'

export class MachineTickSystem extends GameSystem {
  readonly name = 'MachineTickSystem'
  private registry: MachineRegistry | null = null

  constructor(registry: MachineRegistry) {
    super()
    this.registry = registry
  }

  initialize(): void {
    // Controllers are initialized by Game bootstrap.
  }

  update(deltaTime: number): void {
    if (!this.registry) {
      return
    }

    for (const controller of this.registry.getAll()) {
      const updatable = controller as IMachineController & {
        update?: (deltaTime: number) => void
      }
      updatable.update?.(deltaTime)
    }
  }

  dispose(): void {
    this.registry = null
  }
}
