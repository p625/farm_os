import { ArcRotateCamera, Vector3 } from '@babylonjs/core'
import type { SceneManager } from './SceneManager.ts'
import type { IDisposable, IInitializable, IUpdatable } from '@/types/index.ts'

const ISOMETRIC_ALPHA = -Math.PI / 4
const ISOMETRIC_BETA = 1.05
const ISOMETRIC_RADIUS = 42
const LOOK_AT_TARGET = new Vector3(4, 0, 4)

export class CameraController implements IInitializable, IUpdatable, IDisposable {
  private camera: ArcRotateCamera | null = null
  private readonly sceneManager: SceneManager

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }

  initialize(): void {
    const scene = this.sceneManager.getScene()
    this.camera = new ArcRotateCamera(
      'mainCamera',
      ISOMETRIC_ALPHA,
      ISOMETRIC_BETA,
      ISOMETRIC_RADIUS,
      LOOK_AT_TARGET,
      scene,
    )

    this.camera.lowerBetaLimit = ISOMETRIC_BETA
    this.camera.upperBetaLimit = ISOMETRIC_BETA
    this.camera.lowerAlphaLimit = ISOMETRIC_ALPHA
    this.camera.upperAlphaLimit = ISOMETRIC_ALPHA
    this.camera.lowerRadiusLimit = 25
    this.camera.upperRadiusLimit = 70
    this.camera.wheelPrecision = 12
    this.camera.panningSensibility = 80

    const canvas = this.sceneManager.getEngine().getRenderingCanvas()
    if (canvas) {
      this.camera.attachControl(canvas, false)
    }
  }

  getCamera(): ArcRotateCamera {
    if (!this.camera) {
      throw new Error('CameraController is not initialized.')
    }
    return this.camera
  }

  update(_deltaTime: number): void {
    // Camera smoothing and input handling will be implemented later.
  }

  dispose(): void {
    this.camera?.detachControl()
    this.camera?.dispose()
    this.camera = null
  }
}
