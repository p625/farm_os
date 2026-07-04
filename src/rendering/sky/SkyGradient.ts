import {
  Color3,
  Effect,
  Mesh,
  MeshBuilder,
  ShaderMaterial,
  type Scene,
} from '@babylonjs/core'
import { getActiveSkyProfile } from '@/config/rendering/sky/sky-profiles.ts'
import { SKY_SYSTEM_CONFIG } from '@/config/rendering/sky/sky-config.ts'
import type { SkyProfileDefinition } from '@/types/sky-rendering.ts'
import {
  FARMOS_SKY_FRAGMENT_SHADER,
  FARMOS_SKY_VERTEX_SHADER,
} from '@/rendering/sky/shaders/skyShaderSources.ts'

const SKY_SHADER_NAME = 'farmosSkyGradient'
let shadersRegistered = false

function ensureSkyShadersRegistered(): void {
  if (shadersRegistered) {
    return
  }
  Effect.ShadersStore[`${SKY_SHADER_NAME}VertexShader`] = FARMOS_SKY_VERTEX_SHADER
  Effect.ShadersStore[`${SKY_SHADER_NAME}FragmentShader`] = FARMOS_SKY_FRAGMENT_SHADER
  shadersRegistered = true
}

export class SkyGradient {
  private mesh: Mesh | null = null
  private material: ShaderMaterial | null = null

  build(scene: Scene, profile: SkyProfileDefinition): Mesh {
    this.dispose()
    ensureSkyShadersRegistered()

    const config = SKY_SYSTEM_CONFIG
    this.mesh = MeshBuilder.CreateSphere(
      'farmos_sky_dome',
      {
        diameter: config.domeDiameter,
        segments: config.domeSegments,
        sideOrientation: Mesh.BACKSIDE,
      },
      scene,
    )
    this.mesh.infiniteDistance = true
    this.mesh.isPickable = false
    this.mesh.receiveShadows = false
    this.mesh.renderingGroupId = 0
    this.mesh.alwaysSelectAsActiveMesh = false

    this.material = new ShaderMaterial(
      'farmos_sky_material',
      scene,
      { vertex: SKY_SHADER_NAME, fragment: SKY_SHADER_NAME },
      {
        attributes: ['position'],
        uniforms: [
          'worldViewProjection',
          'uZenithColor',
          'uHorizonColor',
          'uGradientPower',
          'uHorizonSoftness',
          'uHazeIntensity',
        ],
      },
    )
    this.material.backFaceCulling = false
    this.material.fogEnabled = false
    this.material.disableDepthWrite = true
    this.material.depthFunction = 519 // Engine.ALWAYS — sky draws behind scene
    this.material.metadata = { farmosSkyGradient: true }

    this.mesh.material = this.material
    this.applyProfile(profile)
    return this.mesh
  }

  applyProfile(profile: SkyProfileDefinition): void {
    if (!this.material) {
      return
    }
    const { gradient } = profile
    this.material.setColor3('uZenithColor', new Color3(...gradient.zenithColor))
    this.material.setColor3('uHorizonColor', new Color3(...gradient.horizonColor))
    this.material.setFloat('uGradientPower', gradient.gradientPower)
    this.material.setFloat('uHorizonSoftness', gradient.horizonSoftness)
    this.material.setFloat('uHazeIntensity', profile.hazeIntensity)
  }

  refreshFromConfig(): void {
    const profile = getActiveSkyProfile(SKY_SYSTEM_CONFIG.activeSkyProfileId)
    this.applyProfile(profile)
  }

  getMesh(): Mesh | null {
    return this.mesh
  }

  dispose(): void {
    this.material?.dispose()
    this.mesh?.dispose()
    this.material = null
    this.mesh = null
  }
}
