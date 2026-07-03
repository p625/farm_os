import type { IDisposable } from '@/types/index.ts'

export class DisposableGroup implements IDisposable {
  private readonly disposables: IDisposable[] = []
  private disposed = false

  add(disposable: IDisposable): void {
    if (this.disposed) {
      disposable.dispose()
      return
    }
    this.disposables.push(disposable)
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    for (const disposable of this.disposables.reverse()) {
      disposable.dispose()
    }
    this.disposables.length = 0
    this.disposed = true
  }
}
