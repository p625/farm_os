import type { IDisposable, IInitializable } from '@/types/index.ts'

export class AssetManager implements IInitializable, IDisposable {
  initialize(): void | Promise<void> {
    // Asset manifest loading will be implemented later.
  }

  dispose(): void {
    // Release loaded assets.
  }
}
