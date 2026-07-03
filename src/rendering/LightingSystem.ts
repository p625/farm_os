import { Color3, DirectionalLight, HemisphericLight, Vector3 } from '@babylonjs/core'
import type { SceneManager } from './SceneManager.ts'
import type { IDisposable, IInitializable } from '@/types/index.ts'

export class LightingSystem implements IInitializable, IDisposable {
  private hemisphericLight: HemisphericLight | null = null
  private directionalLight: DirectionalLight | null = null
  private readonly sceneManager: SceneManager

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }

  initialize(): void {
    const scene = this.sceneManager.getScene()

    this.hemisphericLight = new HemisphericLight(
      'hemisphericLight',
      new Vector3(0, 1, 0),
      scene,
    )
    this.hemisphericLight.intensity = 0.55
    this.hemisphericLight.diffuse = new Color3(0.9, 0.95, 1)
    this.hemisphericLight.groundColor = new Color3(0.2, 0.28, 0.12)

    this.directionalLight = new DirectionalLight(
      'directionalLight',
      new Vector3(-0.8, -1.4, -0.6),
      scene,
    )
    this.directionalLight.intensity = 0.85
    this.directionalLight.position = new Vector3(25, 45, 20)
    this.directionalLight.diffuse = new Color3(1, 0.97, 0.88)
  }

  dispose(): void {
    this.hemisphericLight?.dispose()
    this.directionalLight?.dispose()
    this.hemisphericLight = null
    this.directionalLight = null
  }
}
