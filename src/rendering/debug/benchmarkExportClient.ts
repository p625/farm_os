import {
  BENCHMARK_EXPORT_FOLDER,
  BENCHMARK_SCREENSHOT_ROOT,
  formatBenchmarkScreenshotPath,
} from '@/rendering/debug/benchmark-capture-config.ts'

export const BENCHMARK_READY_ENDPOINT = '/__farmos_dev/benchmark-ready'
export const BENCHMARK_SAVE_SCREENSHOT_ENDPOINT = '/__farmos_dev/save-benchmark-screenshot'
export const BENCHMARK_SAVE_REPORT_ENDPOINT = '/__farmos_dev/save-benchmark-report'
export const BENCHMARK_CLEAR_FOLDER_ENDPOINT = '/__farmos_dev/clear-benchmark-folder'

export interface SaveScreenshotResponse {
  ok: boolean
  path?: string
  absolutePath?: string
  error?: string
}

export class BenchmarkDevServerUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BenchmarkDevServerUnavailableError'
  }
}

export async function probeBenchmarkDevServer(): Promise<boolean> {
  try {
    const response = await fetch(BENCHMARK_READY_ENDPOINT, { method: 'GET' })
    if (!response.ok) {
      return false
    }
    const payload = (await response.json()) as { ok?: boolean }
    return payload.ok === true
  } catch {
    return false
  }
}

export async function assertBenchmarkDevServer(): Promise<void> {
  const available = await probeBenchmarkDevServer()
  if (!available) {
    throw new BenchmarkDevServerUnavailableError(
      'DEV screenshot endpoint is unavailable. Start FarmOS with `npm run dev` and restart the dev server after pulling benchmark tooling changes.',
    )
  }
}

export async function clearBenchmarkFolder(
  milestone: string = BENCHMARK_EXPORT_FOLDER,
): Promise<void> {
  await assertBenchmarkDevServer()
  const response = await fetch(BENCHMARK_CLEAR_FOLDER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ milestone }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Failed to clear benchmark folder (${response.status}).`)
  }
}

export async function saveBenchmarkScreenshot(
  filename: string,
  dataUrl: string,
  milestone: string = BENCHMARK_EXPORT_FOLDER,
): Promise<string> {
  await assertBenchmarkDevServer()

  const response = await fetch(BENCHMARK_SAVE_SCREENSHOT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      dataUrl,
      milestone,
    }),
  })

  const payload = (await response.json()) as SaveScreenshotResponse
  if (!response.ok || !payload.ok || !payload.path) {
    throw new Error(payload.error || `Failed to save screenshot (${response.status}).`)
  }

  return payload.path
}

export async function saveBenchmarkReport(
  content: string,
  milestone: string = BENCHMARK_EXPORT_FOLDER,
): Promise<string> {
  await assertBenchmarkDevServer()

  const response = await fetch(BENCHMARK_SAVE_REPORT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      milestone,
      content,
    }),
  })

  const payload = (await response.json()) as SaveScreenshotResponse
  if (!response.ok || !payload.ok || !payload.path) {
    throw new Error(payload.error || `Failed to save benchmark report (${response.status}).`)
  }

  return payload.path
}

export function toPngDataUrl(data: string): string {
  if (data.startsWith('data:image/png')) {
    return data
  }
  return `data:image/png;base64,${data}`
}

export function formatSavedScreenshotLog(filename: string): string {
  return `[FarmOS Benchmark] Saved screenshot: ${formatBenchmarkScreenshotPath(filename)}`
}

export function formatBatchCaptureCompleteLog(count: number, total: number): string {
  return `[FarmOS Benchmark] Capture complete: ${count}/${total} screenshots saved to ${BENCHMARK_SCREENSHOT_ROOT}${BENCHMARK_EXPORT_FOLDER}/`
}
