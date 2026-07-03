import type { World } from '@game/World.ts'
import { GameSystem } from './GameSystem.ts'

export class VehicleSystem extends GameSystem {
  readonly name = 'VehicleSystem'
  private readonly world: World

  constructor(world: World) {
    super()
    this.world = world
  }

  initialize(): void {
    void this.world
  }

  update(_deltaTime: number): void {
    // Vehicle tick logic will be implemented later.
  }

  dispose(): void {
    // Release vehicle resources.
  }
}
