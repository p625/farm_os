import { ArcRotateCamera, Vector3 } from '@babylonjs/core'
import type { SceneManager } from './SceneManager.ts'
import {
  DEFAULT_CAMERA_PROFILE_ID,
  getCameraProfile,
  type CameraProfileId,
} from '@/config/camera-profiles.ts'
import type { IDisposable, IInitializable, IUpdatable } from '@/types/index.ts'

export interface CameraBenchmarkState {
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
  fov: number
  alpha: number
  beta: number
  radius: number
}

/** Kept for future input layering; camera always uses LMB pan + RMB rotate. */
export type CameraNavigateMode = 'navigate'
export type CameraCommandMode = 'command'
export type CameraInteractionMode = CameraNavigateMode | CameraCommandMode

export class CameraController implements IInitializable, IUpdatable, IDisposable {
  private camera: ArcRotateCamera | null = null
  private readonly sceneManager: SceneManager
  private activeProfileId: CameraProfileId = DEFAULT_CAMERA_PROFILE_ID
  private interactionMode: CameraInteractionMode = 'navigate'

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }

  initialize(): void {
    this.applyProfile(DEFAULT_CAMERA_PROFILE_ID)

    const canvas = this.sceneManager.getEngine().getRenderingCanvas()
    if (canvas && this.camera) {
      this.attachCameraControls(canvas)
    }
  }

  setInteractionMode(mode: CameraInteractionMode): void {
    if (this.interactionMode === mode) {
      return
    }
    this.interactionMode = mode
    this.configurePointerInputs()
  }

  private attachCameraControls(canvas: HTMLCanvasElement): void {
    if (!this.camera) {
      return
    }

    this.camera.detachControl()
    this.camera.attachControl(canvas, false)
    this.configurePointerInputs()
  }

  private configurePointerInputs(): void {
    if (!this.camera) {
      return
    }

    const input = this.camera.movement.input
    const nonPointerEntries = input.inputMap.filter((entry) => entry.source !== 'pointer')

    const pointerEntries = [
      { source: 'pointer' as const, button: 0, interaction: 'pan' as const },
      { source: 'pointer' as const, button: 2, interaction: 'rotate' as const },
    ]

    input.inputMap = [...pointerEntries, ...nonPointerEntries]

    const pointers = this.camera.inputs.attached.pointers as
      | { buttons?: number[] }
      | undefined

    if (pointers && Array.isArray(pointers.buttons)) {
      pointers.buttons = [0, 2]
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

    this.camera.lowerBetaLimit = profile.lowerBetaLimit
    this.camera.upperBetaLimit = profile.upperBetaLimit
    this.camera.lowerAlphaLimit = null
    this.camera.upperAlphaLimit = null
    this.camera.lowerRadiusLimit = profile.lowerRadiusLimit
    this.camera.upperRadiusLimit = profile.upperRadiusLimit
    this.camera.wheelPrecision = profile.wheelPrecision
    this.camera.panningSensibility = profile.panningSensibility
    this.activeProfileId = profileId
  }

  getActiveProfileId(): CameraProfileId {
    return this.activeProfileId
  }

  applyBenchmarkView(
    position: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number },
    fov: number,
  ): void {
    const camera = this.getCamera()
    camera.setTarget(new Vector3(target.x, target.y, target.z))
    camera.position = new Vector3(position.x, position.y, position.z)
    camera.fov = fov
  }

  captureBenchmarkState(): CameraBenchmarkState {
    const camera = this.getCamera()
    return {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      },
      target: {
        x: camera.target.x,
        y: camera.target.y,
        z: camera.target.z,
      },
      fov: camera.fov,
      alpha: camera.alpha,
      beta: camera.beta,
      radius: camera.radius,
    }
  }

  restoreBenchmarkState(state: CameraBenchmarkState): void {
    const camera = this.getCamera()
    camera.setTarget(new Vector3(state.target.x, state.target.y, state.target.z))
    camera.alpha = state.alpha
    camera.beta = state.beta
    camera.radius = state.radius
    camera.position = new Vector3(state.position.x, state.position.y, state.position.z)
    camera.fov = state.fov
  }

  focusOn(worldX: number, worldZ: number, radius = 42): void {
    if (!this.camera) {
      return
    }

    const profile = getCameraProfile(this.activeProfileId)
    this.camera.setTarget(new Vector3(worldX, 0, worldZ))
    this.camera.radius = Math.min(
      Math.max(radius, profile.lowerRadiusLimit),
      profile.upperRadiusLimit,
    )
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
