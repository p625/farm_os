import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  ShadowGenerator,
  Vector3,
  type AbstractMesh,
  type Scene,
} from '@babylonjs/core'
import type { SceneManager } from './SceneManager.ts'
import type { IDisposable, IInitializable } from '@/types/index.ts'

export class LightingSystem implements IInitializable, IDisposable {
  private hemisphericLight: HemisphericLight | null = null
  private directionalLight: DirectionalLight | null = null
  private shadowGenerator: ShadowGenerator | null = null
  private readonly sceneManager: SceneManager

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager
  }

  initialize(): void {
    const scene = this.sceneManager.getScene()

    this.hemisphericLight = new HemisphericLight(
      'hemisphericLight',
      new Vector3(0.2, 1, 0.15),
      scene,
    )
    this.hemisphericLight.intensity = 0.62
    this.hemisphericLight.diffuse = new Color3(0.88, 0.93, 1)
    this.hemisphericLight.groundColor = new Color3(0.24, 0.32, 0.14)

    this.directionalLight = new DirectionalLight(
      'directionalLight',
      new Vector3(-0.65, -1.2, -0.45),
      scene,
    )
    this.directionalLight.intensity = 0.95
    this.directionalLight.position = new Vector3(18, 38, 16)
    this.directionalLight.diffuse = new Color3(1, 0.96, 0.86)
    this.directionalLight.specular = new Color3(0.25, 0.22, 0.18)

    this.shadowGenerator = new ShadowGenerator(1024, this.directionalLight)
    this.shadowGenerator.useBlurExponentialShadowMap = true
    this.shadowGenerator.blurKernel = 24
    this.shadowGenerator.darkness = 0.35
    this.shadowGenerator.transparencyShadow = true

    this.applyShadows(scene)
  }

  dispose(): void {
    this.shadowGenerator?.dispose()
    this.hemisphericLight?.dispose()
    this.directionalLight?.dispose()
    this.shadowGenerator = null
    this.hemisphericLight = null
    this.directionalLight = null
  }

  private applyShadows(scene: Scene): void {
    if (!this.shadowGenerator) {
      return
    }

    for (const mesh of scene.meshes) {
      if (this.shouldCastShadow(mesh)) {
        this.shadowGenerator.addShadowCaster(mesh, true)
      }
      if (this.shouldReceiveShadow(mesh)) {
        mesh.receiveShadows = true
      }
    }
  }

  private shouldCastShadow(mesh: AbstractMesh): boolean {
    if (mesh.name.startsWith('decor_') || mesh.name.startsWith('field_label_')) {
      return false
    }
    if (mesh.name.startsWith('field_growth_') || mesh.name.startsWith('field_outline_')) {
      return false
    }
    if (mesh.metadata && (mesh.metadata as { decor?: boolean }).decor) {
      return false
    }
    return (
      mesh.name === 'terrain' ||
      mesh.name.startsWith('field_') ||
      mesh.name.startsWith('barn') ||
      mesh.name.startsWith('tractor') ||
      mesh.name === 'farmyard'
    )
  }

  private shouldReceiveShadow(mesh: AbstractMesh): boolean {
    return this.shouldCastShadow(mesh)
  }
}
