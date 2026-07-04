import type { BenchmarkRunner } from '@/rendering/debug/BenchmarkRunner.ts'
import {
  assertBenchmarkDevServer,
  BenchmarkDevServerUnavailableError,
} from '@/rendering/debug/benchmarkExportClient.ts'
import type { IDisposable } from '@/types/index.ts'

const PRESET_NEXT_KEY = 'F8'
const CAPTURE_KEY = 'F9'

export class VisualBenchmarkInput implements IDisposable {
  private attached = false
  private readonly runner: BenchmarkRunner

  constructor(runner: BenchmarkRunner) {
    this.runner = runner
  }

  attach(): void {
    if (!import.meta.env.DEV || this.attached) {
      return
    }

    window.addEventListener('keydown', this.onKeyDown)
    this.attached = true
    console.info(
      `[FarmOS Benchmark] DEV tooling active — ${PRESET_NEXT_KEY}: next, Shift+${PRESET_NEXT_KEY}: previous, ${CAPTURE_KEY}: save screenshot, Shift+${CAPTURE_KEY}: capture all`,
    )

    void assertBenchmarkDevServer().catch((error: unknown) => {
      if (error instanceof BenchmarkDevServerUnavailableError) {
        console.error(`[FarmOS Benchmark] ${error.message}`)
      }
    })
  }

  dispose(): void {
    if (!this.attached) {
      return
    }
    window.removeEventListener('keydown', this.onKeyDown)
    this.attached = false
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === PRESET_NEXT_KEY) {
      event.preventDefault()
      if (event.shiftKey) {
        this.runner.previous()
      } else {
        this.runner.next()
      }
      return
    }

    if (event.code !== CAPTURE_KEY) {
      return
    }

    event.preventDefault()
    if (this.runner.isBatchRunning()) {
      return
    }

    if (event.shiftKey) {
      void this.runner.captureAllPresets().catch((error: unknown) => {
        this.logCaptureError('Batch capture failed.', error)
      })
      return
    }

    void this.runner.captureActivePreset().catch((error: unknown) => {
      this.logCaptureError('Screenshot capture failed.', error)
    })
  }

  private logCaptureError(prefix: string, error: unknown): void {
    if (error instanceof BenchmarkDevServerUnavailableError) {
      console.error(`[FarmOS Benchmark] ${error.message}`)
      return
    }
    console.error(`[FarmOS Benchmark] ${prefix}`, error)
  }
}
