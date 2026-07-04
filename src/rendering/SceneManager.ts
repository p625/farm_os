import type { Engine, Scene } from '@babylonjs/core'
import { Scene as BabylonScene } from '@babylonjs/core'
import type { GameConfig } from '@/types/index.ts'
import { DEFAULT_GAME_CONFIG } from '@/types/index.ts'
import type { IDisposable } from '@/types/index.ts'
import { FarmSceneBuilder } from './FarmSceneBuilder.ts'
import {
  createWebGLEngine,
  scheduleCanvasWebGLRelease,
} from './webgl-bootstrap.ts'

export class SceneManager implements IDisposable {
  private engine: Engine | null = null
  private scene: Scene | null = null
  private initialized = false
  private disposed = false
  private readonly canvas: HTMLCanvasElement
  private readonly config: GameConfig
  private readonly farmSceneBuilder = new FarmSceneBuilder()
  private readonly onResize = () => {
    this.engine?.resize()
  }

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig = DEFAULT_GAME_CONFIG,
  ) {
    this.canvas = canvas
    this.config = { ...DEFAULT_GAME_CONFIG, ...config }
  }

  async initialize(): Promise<void> {
    if (this.disposed || this.initialized) {
      return
    }

    this.engine = await createWebGLEngine(this.canvas, {
      antialias: this.config.antialias ?? true,
      adaptToDeviceRatio: this.config.adaptToDeviceRatio ?? true,
    })
    if (this.disposed) {
      this.engine.dispose()
      this.engine = null
      return
    }

    this.scene = new BabylonScene(this.engine)

    this.farmSceneBuilder.build(this.scene)

    window.addEventListener('resize', this.onResize)
    this.initialized = true
  }

  isInitialized(): boolean {
    return this.initialized && !this.disposed
  }

  getEngine(): Engine {
    if (!this.initialized || !this.engine) {
      throw new Error(
        'SceneManager.getEngine() called before initialize() completed.',
      )
    }
    return this.engine
  }

  getScene(): Scene {
    if (!this.initialized || !this.scene) {
      throw new Error(
        'SceneManager.getScene() called before initialize() completed.',
      )
    }
    return this.scene
  }

  render(): void {
    if (!this.initialized || !this.scene) {
      return
    }
    this.scene.render()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    window.removeEventListener('resize', this.onResize)
    this.scene?.dispose()
    this.engine?.dispose()
    scheduleCanvasWebGLRelease(this.canvas)
    this.scene = null
    this.engine = null
    this.initialized = false
  }
}
