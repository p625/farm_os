import type { IDisposable } from '@/types/index.ts'

export abstract class Entity implements IDisposable {
  readonly id: string

  constructor(id?: string) {
    this.id = id ?? crypto.randomUUID()
  }

  abstract dispose(): void
}
