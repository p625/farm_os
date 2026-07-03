import type { IGameSystem } from '@/types/index.ts'

export abstract class GameSystem implements IGameSystem {
  abstract readonly name: string

  abstract initialize(): void | Promise<void>

  abstract update(deltaTime: number): void

  abstract dispose(): void
}
