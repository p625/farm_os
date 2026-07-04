import type { Engine, Scene } from '@babylonjs/core'
import type { SceneManager } from '@/rendering/SceneManager.ts'
import { LightingSystem } from '@/rendering/LightingSystem.ts'
import { SkySystem } from '@/rendering/sky/SkySystem.ts'
import { HdrController } from '@/rendering/core/HdrController.ts'
import { ImageProcessingController } from '@/rendering/core/ImageProcessingController.ts'
import { IblEnvironment } from '@/rendering/core/IblEnvironment.ts'
import { ShadowManager } from '@/rendering/core/ShadowManager.ts'
import { syncTerrainShaderLighting } from '@/rendering/terrain/TerrainShaderFramework.ts'
import type { IDisposable, IInitializable } from '@/types/index.ts'

export interface RenderingSystemOptions {
  /** Game enables shadow maps; Studio keeps them off for editor responsiveness. */
  shadows?: boolean
}

/**
 * Central FarmOS renderer orchestrator.
 * Scene content builders must not configure HDR, fog, or image processing directly.
 */
export class RenderingSystem implements IInitializable, IDisposable {
  private scene: Scene | null = null
  private engine: Engine | null = null
  private readonly sceneManager: SceneManager | null
  private initialized = false

  readonly shadows = new ShadowManager()
  readonly lighting: LightingSystem
  readonly ibl = new IblEnvironment()

  readonly sky = new SkySystem()

  private readonly hdr = new HdrController()
  private readonly imageProcessing = new ImageProcessingController()

  constructor(sceneManager?: SceneManager) {
    this.sceneManager = sceneManager ?? null
    this.lighting = new LightingSystem(this)
  }

  attach(scene: Scene, engine: Engine): void {
    this.scene = scene
    this.engine = engine
  }

  initialize(options: RenderingSystemOptions = {}): void {
    const { scene, engine } = this.resolveContext()

    this.hdr.apply(engine, scene)
    this.imageProcessing.apply(scene)
    this.ibl.initialize(scene)

    this.lighting.initialize({
      shadows: options.shadows ?? true,
    })

    this.sky.initialize(scene, engine, {
      lighting: this.lighting,
      imageProcessing: this.imageProcessing,
    })

    syncTerrainShaderLighting(scene)
    this.initialized = true
  }

  /** Re-apply shadow casters and terrain lighting after scene content rebuild. */
  refreshAfterSceneContent(): void {
    if (!this.initialized) {
      return
    }
    const { scene } = this.resolveContext()
    this.shadows.refreshCasters(scene)
    syncTerrainShaderLighting(scene)
  }

  getHdrReport() {
    return this.hdr.getReport()
  }

  getScene(): Scene {
    return this.resolveContext().scene
  }

  getEngine(): Engine {
    return this.resolveContext().engine
  }

  /** Re-apply config-driven render settings before benchmark screenshots. */
  reapplyBenchmarkRenderSettings(): void {
    if (!this.initialized) {
      return
    }
    const { scene, engine } = this.resolveContext()
    this.hdr.apply(engine, scene)
    this.imageProcessing.apply(scene)
    this.sky.apply(scene, {
      lighting: this.lighting,
      imageProcessing: this.imageProcessing,
    })
    syncTerrainShaderLighting(scene)
  }

  dispose(): void {
    this.sky.dispose()
    this.lighting.dispose()
    this.shadows.dispose()
    this.scene = null
    this.engine = null
    this.initialized = false
  }

  private resolveContext(): { scene: Scene; engine: Engine } {
    if (this.sceneManager) {
      return {
        scene: this.sceneManager.getScene(),
        engine: this.sceneManager.getEngine(),
      }
    }

    if (!this.scene || !this.engine) {
      throw new Error('RenderingSystem is not attached to a scene and engine.')
    }

    return { scene: this.scene, engine: this.engine }
  }
}
