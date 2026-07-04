import { ArcRotateCamera, Vector3 } from '@babylonjs/core'
import type { SceneManager } from './SceneManager.ts'
import {
  DEFAULT_CAMERA_PROFILE_ID,
  getCameraProfile,
  type CameraProfileId,
} from '@/config/camera-profiles.ts'
import type { IDisposable, IInitializable, IUpdatable } from '@/types/index.ts'

export class CameraController implements IInitializable, IUpdatable, IDisposable {
  private camera: ArcRotateCamera | null = null
  private readonly sceneManager: SceneManager
  private activeProfileId: CameraProfileId = DEFAULT_CAMERA_PROFILE_ID

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }

  initialize(): void {
    this.applyProfile(DEFAULT_CAMERA_PROFILE_ID)

    const canvas = this.sceneManager.getEngine().getRenderingCanvas()
    if (canvas && this.camera) {
      this.camera.attachControl(canvas, false)
    }
  }

  applyProfile(profileId: CameraProfileId): void {
    const profile = getCameraProfile(profileId)
    const scene = this.sceneManager.getScene()
    const target = new Vector3(
      profile.target.x,
      profile.target.y,
      profile.target.z,
    )

    if (!this.camera) {
      this.camera = new ArcRotateCamera(
        'mainCamera',
        profile.alpha,
        profile.beta,
        profile.radius,
        target,
        scene,
      )
    } else {
      this.camera.setTarget(target)
      this.camera.alpha = profile.alpha
      this.camera.beta = profile.beta
      this.camera.radius = profile.radius
    }

    this.camera.lowerBetaLimit = profile.beta
    this.camera.upperBetaLimit = profile.beta
    this.camera.lowerAlphaLimit = profile.alpha
    this.camera.upperAlphaLimit = profile.alpha
    this.camera.lowerRadiusLimit = profile.lowerRadiusLimit
    this.camera.upperRadiusLimit = profile.upperRadiusLimit
    this.camera.wheelPrecision = profile.wheelPrecision
    this.camera.panningSensibility = profile.panningSensibility
    this.activeProfileId = profileId
  }

  getActiveProfileId(): CameraProfileId {
    return this.activeProfileId
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
