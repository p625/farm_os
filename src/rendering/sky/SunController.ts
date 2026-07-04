import { Color3, Vector3, type Scene } from '@babylonjs/core'
import { getActiveSunProfile } from '@/config/rendering/sky/sun-profiles.ts'
import { SKY_SYSTEM_CONFIG } from '@/config/rendering/sky/sky-config.ts'
import { GLOBAL_AMBIENT_PROFILE } from '@/config/rendering/sky/ambient-profiles.ts'
import type { LightingSystem } from '@/rendering/LightingSystem.ts'
import type { SunProfileDefinition } from '@/types/sky-rendering.ts'
import { syncTerrainShaderLighting } from '@/rendering/terrain/TerrainShaderFramework.ts'
import type { ImageProcessingController } from '@/rendering/core/ImageProcessingController.ts'

export interface SunRuntimeState {
  profileId: string
  displayName: string
  elevationDegrees: number
  azimuthDegrees: number
  ambientColor: readonly [number, number, number]
  directionalIntensity: number
  exposureBias: number
}

export class SunController {
  private lastState: SunRuntimeState | null = null

  apply(
    scene: Scene,
    lighting: LightingSystem,
    imageProcessing: ImageProcessingController,
    sunProfile?: SunProfileDefinition,
  ): SunRuntimeState {
    const profile = sunProfile ?? getActiveSunProfile(SKY_SYSTEM_CONFIG.activeSunProfileId)
    const ambient = blendAmbient(profile.ambientTint, GLOBAL_AMBIENT_PROFILE.color)

    scene.ambientColor = new Color3(ambient[0], ambient[1], ambient[2])

    const hemispheric = lighting.getHemisphericLight()
    if (hemispheric) {
      hemispheric.intensity = profile.hemispheric.intensity
      hemispheric.diffuse = new Color3(...profile.hemispheric.diffuse)
      hemispheric.groundColor = new Color3(...profile.hemispheric.groundColor)
      hemispheric.direction = new Vector3(...profile.hemispheric.direction).normalize()
    }

    const directional = lighting.getDirectionalLight()
    if (directional) {
      directional.intensity = profile.directional.intensity
      directional.diffuse = new Color3(...profile.directional.diffuse)
      directional.specular = new Color3(...profile.directional.specular)
      directional.position = new Vector3(...profile.directional.position)
      directional.direction = new Vector3(...profile.directional.direction).normalize()

      syncTerrainShaderLighting(scene, new Vector3(
        -profile.directional.direction[0],
        -profile.directional.direction[1],
        -profile.directional.direction[2],
      ))
    }

    imageProcessing.setExposureBias(profile.exposureBias)

    this.lastState = {
      profileId: profile.id,
      displayName: profile.displayName,
      elevationDegrees: profile.sunElevationDegrees,
      azimuthDegrees: profile.sunAzimuthDegrees,
      ambientColor: ambient,
      directionalIntensity: profile.directional.intensity,
      exposureBias: profile.exposureBias,
    }

    return this.lastState
  }

  getLastState(): SunRuntimeState | null {
    return this.lastState
  }
}

function blendAmbient(
  sunAmbient: readonly [number, number, number],
  globalAmbient: readonly [number, number, number],
): readonly [number, number, number] {
  const weight = 0.55
  return [
    sunAmbient[0] * weight + globalAmbient[0] * (1 - weight),
    sunAmbient[1] * weight + globalAmbient[1] * (1 - weight),
    sunAmbient[2] * weight + globalAmbient[2] * (1 - weight),
  ]
}
