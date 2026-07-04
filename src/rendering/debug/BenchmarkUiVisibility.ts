import './benchmark-capture.css'

const BENCHMARK_CAPTURE_CLASS = 'farmos-benchmark-capture'

export class BenchmarkUiVisibility {
  private hiddenDepth = 0

  hideForCapture(): void {
    this.hiddenDepth += 1
    if (this.hiddenDepth === 1) {
      document.documentElement.classList.add(BENCHMARK_CAPTURE_CLASS)
    }
  }

  restoreAfterCapture(): void {
    if (this.hiddenDepth <= 0) {
      return
    }
    this.hiddenDepth -= 1
    if (this.hiddenDepth === 0) {
      document.documentElement.classList.remove(BENCHMARK_CAPTURE_CLASS)
    }
  }
}
