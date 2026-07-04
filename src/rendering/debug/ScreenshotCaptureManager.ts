import {
  CreateScreenshotAsync,
  CreateScreenshotUsingRenderTargetAsync,
} from '@babylonjs/core/Misc/screenshotTools'
import type { SceneManager } from '@/rendering/SceneManager.ts'
import type { RenderingSystem } from '@/rendering/RenderingSystem.ts'
import { RENDERING_QUALITY_CONFIG } from '@/config/rendering/rendering-quality-config.ts'
import {
  listVisualBenchmarkPresets,
  VISUAL_BENCHMARK_CONFIG,
} from '@/config/rendering/visual-benchmark-config.ts'
import {
  BENCHMARK_CAPTURE_FRAME_COUNT,
  BENCHMARK_CAPTURE_SETTLE_MS,
  BENCHMARK_EXPORT_FOLDER,
  BENCHMARK_SCREENSHOT_MIME_TYPE,
  getBenchmarkMilestone,
} from '@/rendering/debug/benchmark-capture-config.ts'
import {
  clearBenchmarkFolder,
  saveBenchmarkReport,
  saveBenchmarkScreenshot,
  toPngDataUrl,
} from '@/rendering/debug/benchmarkExportClient.ts'
import { BenchmarkUiVisibility } from '@/rendering/debug/BenchmarkUiVisibility.ts'

export interface BenchmarkScreenshotCapture {
  filename: string
  dataUrl: string
}

export interface BenchmarkCaptureReportContext {
  screenshotCount: number
  resolution: { width: number; height: number }
  presetIds?: readonly string[]
}

export class ScreenshotCaptureManager {
  private capturing = false
  private readonly uiVisibility = new BenchmarkUiVisibility()
  private readonly sceneManager: SceneManager
  private readonly renderingSystem: RenderingSystem

  constructor(sceneManager: SceneManager, renderingSystem: RenderingSystem) {
    this.sceneManager = sceneManager
    this.renderingSystem = renderingSystem
  }

  isCapturing(): boolean {
    return this.capturing
  }

  async capturePng(filename: string): Promise<BenchmarkScreenshotCapture> {
    const dataUrl = await this.captureSceneScreenshotDataUrl()
    return { filename, dataUrl }
  }

  async captureAndSave(
    filename: string,
    options: { report?: BenchmarkCaptureReportContext } = {},
  ): Promise<string> {
    const capture = await this.capturePng(filename)
    const savedPath = await saveBenchmarkScreenshot(
      capture.filename,
      capture.dataUrl,
      BENCHMARK_EXPORT_FOLDER,
    )

    if (options.report) {
      await saveBenchmarkReport(this.buildReport(options.report), BENCHMARK_EXPORT_FOLDER)
    }

    return savedPath
  }

  async saveCaptures(
    captures: BenchmarkScreenshotCapture[],
    options: { clearFolder?: boolean; report?: BenchmarkCaptureReportContext } = {},
  ): Promise<string[]> {
    if (options.clearFolder) {
      await clearBenchmarkFolder(BENCHMARK_EXPORT_FOLDER)
    }

    const savedPaths: string[] = []
    for (const capture of captures) {
      savedPaths.push(
        await saveBenchmarkScreenshot(
          capture.filename,
          capture.dataUrl,
          BENCHMARK_EXPORT_FOLDER,
        ),
      )
    }

    if (options.report) {
      savedPaths.push(
        await saveBenchmarkReport(this.buildReport(options.report), BENCHMARK_EXPORT_FOLDER),
      )
    }

    return savedPaths
  }

  async withCleanCapture<T>(action: () => Promise<T>): Promise<T> {
    if (this.capturing) {
      throw new Error('Benchmark screenshot capture is already running.')
    }

    this.capturing = true
    this.uiVisibility.hideForCapture()
    try {
      return await action()
    } finally {
      this.uiVisibility.restoreAfterCapture()
      this.capturing = false
    }
  }

  async waitForSceneSettle(): Promise<void> {
    await wait(BENCHMARK_CAPTURE_SETTLE_MS)
    for (let frame = 0; frame < BENCHMARK_CAPTURE_FRAME_COUNT; frame += 1) {
      this.sceneManager.getScene().render()
      await waitForAnimationFrame()
    }
  }

  getResolution(): { width: number; height: number } {
    const engine = this.sceneManager.getEngine()
    return {
      width: engine.getRenderWidth(),
      height: engine.getRenderHeight(),
    }
  }

  private async captureSceneScreenshotDataUrl(): Promise<string> {
    const engine = this.sceneManager.getEngine()
    const scene = this.sceneManager.getScene()
    const camera = scene.activeCamera
    if (!camera) {
      throw new Error('Benchmark capture requires an active scene camera.')
    }

    this.renderingSystem.reapplyBenchmarkRenderSettings()
    scene.render()

    const size = {
      width: engine.getRenderWidth(),
      height: engine.getRenderHeight(),
      precision: 1,
    }

    let screenshotData: string
    try {
      screenshotData = await CreateScreenshotAsync(
        engine,
        camera,
        size,
        BENCHMARK_SCREENSHOT_MIME_TYPE,
      )
    } catch {
      screenshotData = await CreateScreenshotUsingRenderTargetAsync(
        engine,
        camera,
        size,
        BENCHMARK_SCREENSHOT_MIME_TYPE,
        1,
        engine.getCreationOptions().antialias ?? true,
      )
    }

    if (typeof screenshotData !== 'string' || screenshotData.length === 0) {
      throw new Error('ScreenshotTools returned an empty screenshot payload.')
    }

    return toPngDataUrl(screenshotData)
  }

  private buildReport(context: BenchmarkCaptureReportContext): string {
    const engine = this.sceneManager.getEngine()
    const presetIds = context.presetIds ?? listVisualBenchmarkPresets().map((preset) => preset.id)
    const lines = [
      'FarmOS Benchmark Report',
      '=======================',
      `Export date: ${new Date().toISOString()}`,
      `Milestone: ${getBenchmarkMilestone()}`,
      `Screenshot count: ${context.screenshotCount}`,
      `Render quality: ${RENDERING_QUALITY_CONFIG.preset}`,
      `Benchmark config quality: ${VISUAL_BENCHMARK_CONFIG.renderQuality}`,
      `Active renderer: RenderingSystem (Babylon.js ${engine.version})`,
      `Resolution: ${context.resolution.width}x${context.resolution.height}`,
      `Export folder: docs/graphics/visual-benchmarks/screenshots/${BENCHMARK_EXPORT_FOLDER}/`,
      'Presets:',
      ...presetIds.map((presetId) => `- ${presetId}`),
    ]
    return `${lines.join('\n')}\n`
  }
}

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs)
  })
}

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export function createScreenshotCaptureManager(
  sceneManager: SceneManager,
  renderingSystem: RenderingSystem,
): ScreenshotCaptureManager {
  return new ScreenshotCaptureManager(sceneManager, renderingSystem)
}
