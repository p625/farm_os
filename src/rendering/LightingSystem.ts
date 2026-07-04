import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  Vector3,
  type Scene,
} from '@babylonjs/core'
import { LIGHTING_CONFIG } from '@/config/rendering/lighting-config.ts'
import type { RenderingSystem } from '@/rendering/RenderingSystem.ts'
import { syncTerrainShaderLighting } from '@/rendering/terrain/TerrainShaderFramework.ts'
import type { IDisposable, IInitializable } from '@/types/index.ts'

export interface LightingSystemOptions {
  shadows?: boolean
  lightNamePrefix?: string
}

export class LightingSystem implements IInitializable, IDisposable {
  private hemisphericLight: HemisphericLight | null = null
  private directionalLight: DirectionalLight | null = null
  private readonly renderingSystem: RenderingSystem

  constructor(renderingSystem: RenderingSystem) {
    this.renderingSystem = renderingSystem
  }

  initialize(options: LightingSystemOptions = {}): void {
    const scene = this.resolveScene()
    const prefix = options.lightNamePrefix ?? ''
    const config = LIGHTING_CONFIG

    this.hemisphericLight = new HemisphericLight(
      `${prefix}hemisphericLight`,
      new Vector3(...config.hemispheric.direction),
      scene,
    )
    this.hemisphericLight.intensity = config.hemispheric.intensity
    this.hemisphericLight.diffuse = new Color3(...config.hemispheric.diffuse)
    this.hemisphericLight.groundColor = new Color3(...config.hemispheric.groundColor)

    this.directionalLight = new DirectionalLight(
      `${prefix}directionalLight`,
      new Vector3(...config.directional.direction),
      scene,
    )
    this.directionalLight.intensity = config.directional.intensity
    this.directionalLight.position = new Vector3(...config.directional.position)
    this.directionalLight.diffuse = new Color3(...config.directional.diffuse)
    this.directionalLight.specular = new Color3(...config.directional.specular)

    const shadowGenerator = this.renderingSystem.shadows.createGenerator(
      this.directionalLight,
      options.shadows ?? true,
    )

    if (shadowGenerator) {
      this.renderingSystem.shadows.applyToScene(scene)
    }

    syncTerrainShaderLighting(scene, new Vector3(
      -config.directional.direction[0],
      -config.directional.direction[1],
      -config.directional.direction[2],
    ))
  }

  getDirectionalLight(): DirectionalLight | null {
    return this.directionalLight
  }

  dispose(): void {
    this.hemisphericLight?.dispose()
    this.directionalLight?.dispose()
    this.hemisphericLight = null
    this.directionalLight = null
  }

  private resolveScene(): Scene {
    return this.renderingSystem.getScene()
  }
}
