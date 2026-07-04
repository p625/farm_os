import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  Vector3,
  type Scene,
} from '@babylonjs/core'

/** Scene lighting for Studio — mirrors game LightingSystem without SceneManager. */
export class StudioLighting {
  private hemisphericLight: HemisphericLight | null = null
  private directionalLight: DirectionalLight | null = null

  initialize(scene: Scene): void {
    this.hemisphericLight = new HemisphericLight(
      'studioHemisphericLight',
      new Vector3(0.2, 1, 0.15),
      scene,
    )
    this.hemisphericLight.intensity = 0.62
    this.hemisphericLight.diffuse = new Color3(0.88, 0.93, 1)
    this.hemisphericLight.groundColor = new Color3(0.24, 0.32, 0.14)

    this.directionalLight = new DirectionalLight(
      'studioDirectionalLight',
      new Vector3(-0.65, -1.2, -0.45),
      scene,
    )
    this.directionalLight.intensity = 0.95
    this.directionalLight.position = new Vector3(18, 38, 16)
    this.directionalLight.diffuse = new Color3(1, 0.96, 0.86)
    this.directionalLight.specular = new Color3(0.25, 0.22, 0.18)
  }

  dispose(): void {
    this.hemisphericLight?.dispose()
    this.directionalLight?.dispose()
    this.hemisphericLight = null
    this.directionalLight = null
  }
}
