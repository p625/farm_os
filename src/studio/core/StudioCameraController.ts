import { ArcRotateCamera, Vector3 } from '@babylonjs/core'
import type { Engine, Scene } from '@babylonjs/core'

const DEFAULT_ALPHA = -Math.PI / 4
const DEFAULT_BETA = 1.05
const DEFAULT_RADIUS = 42
const DEFAULT_TARGET = new Vector3(4, 0, 4)

/** Studio camera — same defaults as game, unlocked rotation limits. */
export class StudioCameraController {
  private camera: ArcRotateCamera | null = null

  initialize(scene: Scene, canvas: HTMLCanvasElement): ArcRotateCamera {
    this.camera = new ArcRotateCamera(
      'studioCamera',
      DEFAULT_ALPHA,
      DEFAULT_BETA,
      DEFAULT_RADIUS,
      DEFAULT_TARGET.clone(),
      scene,
    )

    this.camera.lowerBetaLimit = 0.15
    this.camera.upperBetaLimit = Math.PI / 2.2
    this.camera.lowerRadiusLimit = 8
    this.camera.upperRadiusLimit = 120
    this.camera.wheelPrecision = 12
    this.camera.panningSensibility = 80
    this.camera.attachControl(canvas, false)

    return this.camera
  }

  getCamera(): ArcRotateCamera {
    if (!this.camera) {
      throw new Error('StudioCameraController is not initialized.')
    }
    return this.camera
  }

  dispose(): void {
    this.camera?.detachControl()
    this.camera?.dispose()
    this.camera = null
  }
}

export function getStudioCameraDefaults(): {
  alpha: number
  beta: number
  radius: number
  target: Vector3
} {
  return {
    alpha: DEFAULT_ALPHA,
    beta: DEFAULT_BETA,
    radius: DEFAULT_RADIUS,
    target: DEFAULT_TARGET.clone(),
  }
}

export type StudioEngineHost = {
  getScene(): Scene
  getEngine(): Engine
}
