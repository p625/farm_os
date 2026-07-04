import { VISUAL_BENCHMARK_CONFIG } from '@/config/rendering/visual-benchmark-config.ts'

export const BENCHMARK_EXPORT_FOLDER = 'latest' as const

export const BENCHMARK_SCREENSHOT_ROOT = 'docs/graphics/visual-benchmarks/screenshots/'

export const BENCHMARK_CAPTURE_SETTLE_MS = 48

export const BENCHMARK_CAPTURE_FRAME_COUNT = 2

export const BENCHMARK_SCREENSHOT_MIME_TYPE = 'image/png'

export function formatBenchmarkScreenshotFilename(
  index: number,
  presetId: string,
): string {
  const order = String(index + 1).padStart(3, '0')
  return `${order}_${presetId}.png`
}

export function formatBenchmarkScreenshotPath(filename: string): string {
  return `${BENCHMARK_SCREENSHOT_ROOT}${BENCHMARK_EXPORT_FOLDER}/${filename}`
}

export function getBenchmarkMilestone(): string {
  return VISUAL_BENCHMARK_CONFIG.baselineMilestone
}
