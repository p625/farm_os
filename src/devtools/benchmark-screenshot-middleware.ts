import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

export const BENCHMARK_SAVE_SCREENSHOT_PATH = '/__farmos_dev/save-benchmark-screenshot'
export const BENCHMARK_SAVE_REPORT_PATH = '/__farmos_dev/save-benchmark-report'
export const BENCHMARK_CLEAR_FOLDER_PATH = '/__farmos_dev/clear-benchmark-folder'
export const BENCHMARK_READY_PATH = '/__farmos_dev/benchmark-ready'

const SCREENSHOTS_ROOT_SEGMENTS = [
  'docs',
  'graphics',
  'visual-benchmarks',
  'screenshots',
] as const

const PNG_FILENAME_PATTERN = /^[0-9]{3}_[a-z0-9_]+\.png$/
const MILESTONE_PATTERN = /^[a-zA-Z0-9_-]+$/

export interface SaveBenchmarkScreenshotPayload {
  filename: string
  dataUrl: string
  milestone?: string
}

export interface SaveBenchmarkReportPayload {
  milestone?: string
  content: string
}

export interface ClearBenchmarkFolderPayload {
  milestone?: string
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function getPathname(req: IncomingMessage): string {
  const raw = req.url ?? '/'
  return raw.split('?')[0] ?? '/'
}

function resolveScreenshotsRoot(projectRoot: string): string {
  return path.resolve(projectRoot, ...SCREENSHOTS_ROOT_SEGMENTS)
}

function resolveMilestoneDir(projectRoot: string, milestone: string): string {
  const screenshotsRoot = resolveScreenshotsRoot(projectRoot)
  const targetDir = path.resolve(screenshotsRoot, milestone)
  const normalizedRoot = `${screenshotsRoot}${path.sep}`
  if (targetDir !== screenshotsRoot && !targetDir.startsWith(normalizedRoot)) {
    throw new Error('Refusing to write outside benchmark screenshots directory.')
  }
  return targetDir
}

function isSafeMilestone(value: string): boolean {
  return MILESTONE_PATTERN.test(value)
}

function isSafePngFilename(value: string): boolean {
  return PNG_FILENAME_PATTERN.test(value)
}

function decodePngDataUrl(dataUrl: string): Buffer {
  if (!dataUrl.startsWith('data:image/png')) {
    throw new Error('Only PNG data URLs are accepted.')
  }
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1]! : dataUrl
  if (!base64) {
    throw new Error('PNG data URL is empty.')
  }
  return Buffer.from(base64, 'base64')
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

async function handleSaveScreenshot(
  projectRoot: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let payload: SaveBenchmarkScreenshotPayload
  try {
    payload = JSON.parse(await readRequestBody(req)) as SaveBenchmarkScreenshotPayload
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON body.' })
    return
  }

  const milestone = payload.milestone ?? 'latest'
  if (!isSafeMilestone(milestone) || !isSafePngFilename(payload.filename)) {
    sendJson(res, 400, { ok: false, error: 'Invalid milestone or filename.' })
    return
  }

  try {
    const exportDir = resolveMilestoneDir(projectRoot, milestone)
    fs.mkdirSync(exportDir, { recursive: true })
    const targetPath = path.join(exportDir, payload.filename)
    fs.writeFileSync(targetPath, decodePngDataUrl(payload.dataUrl))

    const relativePath = path
      .join(...SCREENSHOTS_ROOT_SEGMENTS, milestone, payload.filename)
      .replaceAll('\\', '/')

    sendJson(res, 200, {
      ok: true,
      path: relativePath,
      absolutePath: targetPath,
    })
  } catch (error: unknown) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to save screenshot.',
    })
  }
}

async function handleSaveReport(
  projectRoot: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let payload: SaveBenchmarkReportPayload
  try {
    payload = JSON.parse(await readRequestBody(req)) as SaveBenchmarkReportPayload
  } catch {
    sendJson(res, 400, { ok: false, error: 'Invalid JSON body.' })
    return
  }

  const milestone = payload.milestone ?? 'latest'
  if (!isSafeMilestone(milestone) || !payload.content) {
    sendJson(res, 400, { ok: false, error: 'Invalid milestone or report content.' })
    return
  }

  try {
    const exportDir = resolveMilestoneDir(projectRoot, milestone)
    fs.mkdirSync(exportDir, { recursive: true })
    const targetPath = path.join(exportDir, 'benchmark-report.txt')
    fs.writeFileSync(targetPath, payload.content, 'utf8')

    const relativePath = path
      .join(...SCREENSHOTS_ROOT_SEGMENTS, milestone, 'benchmark-report.txt')
      .replaceAll('\\', '/')

    sendJson(res, 200, {
      ok: true,
      path: relativePath,
      absolutePath: targetPath,
    })
  } catch (error: unknown) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to save report.',
    })
  }
}

async function handleClearFolder(
  projectRoot: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  let payload: ClearBenchmarkFolderPayload = {}
  if (req.method === 'POST') {
    try {
      payload = JSON.parse(await readRequestBody(req)) as ClearBenchmarkFolderPayload
    } catch {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON body.' })
      return
    }
  }

  const milestone = payload.milestone ?? 'latest'
  if (!isSafeMilestone(milestone)) {
    sendJson(res, 400, { ok: false, error: 'Invalid milestone.' })
    return
  }

  try {
    const exportDir = resolveMilestoneDir(projectRoot, milestone)
    if (fs.existsSync(exportDir)) {
      for (const entry of fs.readdirSync(exportDir)) {
        fs.unlinkSync(path.join(exportDir, entry))
      }
    } else {
      fs.mkdirSync(exportDir, { recursive: true })
    }

    sendJson(res, 200, { ok: true, milestone })
  } catch (error: unknown) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to clear benchmark folder.',
    })
  }
}

function createBenchmarkMiddleware(projectRoot: string) {
  return (req: IncomingMessage, res: ServerResponse, next: (error?: Error) => void): void => {
    const pathname = getPathname(req)

    if (pathname === BENCHMARK_READY_PATH) {
      if (req.method !== 'GET') {
        sendJson(res, 405, { ok: false, error: 'Method not allowed.' })
        return
      }
      sendJson(res, 200, { ok: true, dev: true })
      return
    }

    if (pathname === BENCHMARK_SAVE_SCREENSHOT_PATH) {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'Method not allowed.' })
        return
      }
      void handleSaveScreenshot(projectRoot, req, res)
      return
    }

    if (pathname === BENCHMARK_SAVE_REPORT_PATH) {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'Method not allowed.' })
        return
      }
      void handleSaveReport(projectRoot, req, res)
      return
    }

    if (pathname === BENCHMARK_CLEAR_FOLDER_PATH) {
      if (req.method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'Method not allowed.' })
        return
      }
      void handleClearFolder(projectRoot, req, res)
      return
    }

    next()
  }
}

export function benchmarkScreenshotMiddlewarePlugin(projectRoot: string): Plugin {
  return {
    name: 'farmos-benchmark-screenshot-middleware',
    apply: 'serve',
    enforce: 'pre',
    configureServer(server) {
      const middleware = createBenchmarkMiddleware(projectRoot)
      server.middlewares.use(middleware)
    },
  }
}
