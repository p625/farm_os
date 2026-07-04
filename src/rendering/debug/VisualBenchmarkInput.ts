import type { VisualBenchmarkRunner } from '@/rendering/debug/VisualBenchmarkRunner.ts'
import type { IDisposable } from '@/types/index.ts'

const BENCHMARK_KEY = 'F8'

export class VisualBenchmarkInput implements IDisposable {
  private attached = false

  constructor(private readonly runner: VisualBenchmarkRunner) {}

  attach(): void {
    if (!import.meta.env.DEV || this.attached) {
      return
    }

    window.addEventListener('keydown', this.onKeyDown)
    this.attached = true
    console.info(
      `[FarmOS Visual Benchmark] DEV tooling active — ${BENCHMARK_KEY}: next preset, Shift+${BENCHMARK_KEY}: previous preset`,
    )
  }

  dispose(): void {
    if (!this.attached) {
      return
    }
    window.removeEventListener('keydown', this.onKeyDown)
    this.attached = false
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== BENCHMARK_KEY) {
      return
    }

    event.preventDefault()
    if (event.shiftKey) {
      this.runner.previous()
    } else {
      this.runner.next()
    }
  }
}
