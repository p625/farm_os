import type { SceneManager } from '@/rendering/SceneManager.ts'
import type { RenderingSystem } from '@/rendering/RenderingSystem.ts'
import type { CameraController } from '@/rendering/CameraController.ts'
import {
  getVisualBenchmarkPresetById,
  listVisualBenchmarkPresets,
  VISUAL_BENCHMARK_CONFIG,
  type VisualBenchmarkPreset,
} from '@/config/rendering/visual-benchmark-config.ts'
import type { RenderingQualityPreset } from '@/config/rendering/rendering-quality-config.ts'
import { RENDERING_QUALITY_CONFIG } from '@/config/rendering/rendering-quality-config.ts'
import {
  formatBenchmarkScreenshotFilename,
  getBenchmarkMilestone,
} from '@/rendering/debug/benchmark-capture-config.ts'
import {
  formatBatchCaptureCompleteLog,
  formatSavedScreenshotLog,
} from '@/rendering/debug/benchmarkExportClient.ts'
import {
  ScreenshotCaptureManager,
  type BenchmarkScreenshotCapture,
} from '@/rendering/debug/ScreenshotCaptureManager.ts'

export interface BenchmarkApplyResult {
  preset: VisualBenchmarkPreset
  index: number
  renderQuality: RenderingQualityPreset
}

export interface BenchmarkCaptureBatchResult {
  saved: string[]
  total: number
}

export class BenchmarkRunner {
  private activeIndex = 0
  private batchRunning = false
  private readonly sceneManager: SceneManager
  private readonly cameraController: CameraController
  private readonly renderingSystem: RenderingSystem
  private readonly screenshotCapture: ScreenshotCaptureManager

  constructor(
    sceneManager: SceneManager,
    cameraController: CameraController,
    renderingSystem: RenderingSystem,
    screenshotCapture?: ScreenshotCaptureManager,
  ) {
    this.sceneManager = sceneManager
    this.cameraController = cameraController
    this.renderingSystem = renderingSystem
    this.screenshotCapture =
      screenshotCapture ??
      new ScreenshotCaptureManager(sceneManager, renderingSystem)
  }

  getPresetCount(): number {
    return listVisualBenchmarkPresets().length
  }

  getActiveIndex(): number {
    return this.activeIndex
  }

  getActivePreset(): VisualBenchmarkPreset {
    const presets = listVisualBenchmarkPresets()
    return presets[this.activeIndex] ?? presets[0]
  }

  isBatchRunning(): boolean {
    return this.batchRunning
  }

  applyPresetById(id: string, options: { log?: boolean } = {}): BenchmarkApplyResult | null {
    const presets = listVisualBenchmarkPresets()
    const index = presets.findIndex((preset) => preset.id === id)
    if (index < 0) {
      return null
    }
    return this.applyPresetByIndex(index, options)
  }

  applyPresetByIndex(
    index: number,
    options: { log?: boolean } = {},
  ): BenchmarkApplyResult {
    const presets = listVisualBenchmarkPresets()
    const clamped = ((index % presets.length) + presets.length) % presets.length
    this.activeIndex = clamped
    const preset = presets[clamped]

    this.applyCamera(preset)
    this.applyRenderQuality(preset.renderQuality)
    this.sceneManager.getScene().render()

    if (options.log !== false) {
      this.logActivePreset(preset, clamped)
    }

    return { preset, index: clamped, renderQuality: preset.renderQuality }
  }

  next(): BenchmarkApplyResult {
    return this.applyPresetByIndex(this.activeIndex + 1)
  }

  previous(): BenchmarkApplyResult {
    return this.applyPresetByIndex(this.activeIndex - 1)
  }

  async captureActivePreset(): Promise<string> {
    const preset = this.getActivePreset()
    const filename = formatBenchmarkScreenshotFilename(this.activeIndex, preset.id)

    const savedPath = await this.screenshotCapture.withCleanCapture(async () => {
      await this.screenshotCapture.waitForSceneSettle()
      return this.screenshotCapture.captureAndSave(filename, {
        report: {
          screenshotCount: 1,
          resolution: this.screenshotCapture.getResolution(),
          presetIds: [preset.id],
        },
      })
    })

    console.info(formatSavedScreenshotLog(filename))
    return savedPath
  }

  async captureAllPresets(): Promise<BenchmarkCaptureBatchResult> {
    if (this.batchRunning || this.screenshotCapture.isCapturing()) {
      throw new Error('Benchmark batch capture is already running.')
    }

    this.batchRunning = true
    const presets = listVisualBenchmarkPresets()
    const savedCamera = this.cameraController.captureBenchmarkState()
    const captures: BenchmarkScreenshotCapture[] = []
    const savedFilenames: string[] = []

    try {
      await this.screenshotCapture.withCleanCapture(async () => {
        for (let index = 0; index < presets.length; index += 1) {
          this.applyPresetByIndex(index, { log: false })
          await this.screenshotCapture.waitForSceneSettle()

          const preset = presets[index]
          const filename = formatBenchmarkScreenshotFilename(index, preset.id)
          const capture = await this.screenshotCapture.capturePng(filename)
          captures.push(capture)
          savedFilenames.push(filename)
        }

        const resolution = this.screenshotCapture.getResolution()
        await this.screenshotCapture.saveCaptures(captures, {
          clearFolder: true,
          report: {
            screenshotCount: captures.length,
            resolution,
            presetIds: presets.map((preset) => preset.id),
          },
        })
      })
    } finally {
      this.cameraController.restoreBenchmarkState(savedCamera)
      this.batchRunning = false
    }

    console.info(formatBatchCaptureCompleteLog(savedFilenames.length, presets.length))
    return { saved: savedFilenames, total: presets.length }
  }

  logActivePreset(preset = this.getActivePreset(), index = this.activeIndex): void {
    const camera = this.cameraController.getCamera()
    console.info('[FarmOS Visual Benchmark]', {
      index: index + 1,
      total: this.getPresetCount(),
      id: preset.id,
      displayName: preset.displayName,
      description: preset.description,
      cameraPosition: preset.cameraPosition,
      cameraTarget: preset.cameraTarget,
      fov: preset.fov,
      timeOfDay: preset.timeOfDay,
      weatherProfile: preset.weatherProfile,
      renderQuality: preset.renderQuality,
      validationFocus: preset.validationFocus,
      notes: preset.notes,
      baseline: VISUAL_BENCHMARK_CONFIG.baselineMilestone,
      actualCamera: {
        position: camera.position.asArray(),
        target: camera.target.asArray(),
        fov: camera.fov,
      },
    })
  }

  private applyCamera(preset: VisualBenchmarkPreset): void {
    this.cameraController.applyBenchmarkView(
      preset.cameraPosition,
      preset.cameraTarget,
      preset.fov,
    )
  }

  private applyRenderQuality(quality: RenderingQualityPreset): void {
    if (quality !== RENDERING_QUALITY_CONFIG.preset) {
      console.info(
        `[FarmOS Visual Benchmark] Preset requests render quality "${quality}"; runtime default is "${RENDERING_QUALITY_CONFIG.preset}".`,
      )
    }
    this.renderingSystem.reapplyBenchmarkRenderSettings()
  }
}

export function createBenchmarkRunner(
  sceneManager: SceneManager,
  cameraController: CameraController,
  renderingSystem: RenderingSystem,
): BenchmarkRunner {
  return new BenchmarkRunner(sceneManager, cameraController, renderingSystem)
}

export {
  getVisualBenchmarkPresetById,
  getBenchmarkMilestone,
  listVisualBenchmarkPresets,
}
