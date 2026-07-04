import type { ArcRotateCamera } from '@babylonjs/core'
import { Vector3 } from '@babylonjs/core'
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

export interface VisualBenchmarkApplyResult {
  preset: VisualBenchmarkPreset
  index: number
  renderQuality: RenderingQualityPreset
}

export class VisualBenchmarkRunner {
  private activeIndex = 0

  constructor(
    private readonly sceneManager: SceneManager,
    private readonly cameraController: CameraController,
    private readonly renderingSystem: RenderingSystem,
  ) {}

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

  applyPresetById(id: string): VisualBenchmarkApplyResult | null {
    const presets = listVisualBenchmarkPresets()
    const index = presets.findIndex((preset) => preset.id === id)
    if (index < 0) {
      return null
    }
    return this.applyPresetByIndex(index)
  }

  applyPresetByIndex(index: number): VisualBenchmarkApplyResult {
    const presets = listVisualBenchmarkPresets()
    const clamped = ((index % presets.length) + presets.length) % presets.length
    this.activeIndex = clamped
    const preset = presets[clamped]

    this.applyCamera(preset)
    this.applyRenderQuality(preset.renderQuality)
    this.sceneManager.getScene().render()
    this.logActivePreset(preset, clamped)

    return { preset, index: clamped, renderQuality: preset.renderQuality }
  }

  next(): VisualBenchmarkApplyResult {
    return this.applyPresetByIndex(this.activeIndex + 1)
  }

  previous(): VisualBenchmarkApplyResult {
    return this.applyPresetByIndex(this.activeIndex - 1)
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

  async captureCurrentBenchmarkFrame(): Promise<string | null> {
    const scene = this.sceneManager.getScene()
    scene.render()
    const canvas = this.sceneManager.getEngine().getRenderingCanvas()
    if (!canvas) {
      return null
    }
    try {
      return canvas.toDataURL('image/png')
    } catch {
      console.warn('[FarmOS Visual Benchmark] Canvas capture failed — use OS screenshot instead.')
      return null
    }
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
        `[FarmOS Visual Benchmark] Preset requests render quality "${quality}"; runtime default is "${RENDERING_QUALITY_CONFIG.preset}". Re-apply engine quality after restart if needed.`,
      )
    }
    this.renderingSystem.reapplyBenchmarkRenderSettings()
  }
}

export function createVisualBenchmarkRunner(
  sceneManager: SceneManager,
  cameraController: CameraController,
  renderingSystem: RenderingSystem,
): VisualBenchmarkRunner {
  return new VisualBenchmarkRunner(sceneManager, cameraController, renderingSystem)
}

export { getVisualBenchmarkPresetById, listVisualBenchmarkPresets }
