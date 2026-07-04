import { Color3, Scene as BabylonScene, type Scene } from '@babylonjs/core'
import {
  ATMOSPHERE_CONFIG,
  resolveAtmosphereHazeColor,
} from '@/config/rendering/sky/atmosphere-config.ts'
import type { SkyProfileDefinition } from '@/types/sky-rendering.ts'

export interface AtmosphereRuntimeState {
  hazeEnabled: boolean
  hazeColor: readonly [number, number, number]
  hazeStart: number
  hazeEnd: number
  contrastReduction: number
  distanceColorEnabled: boolean
  distanceNear: number
  distanceFar: number
}

export class AtmosphereController {
  private lastState: AtmosphereRuntimeState | null = null

  apply(scene: Scene, skyProfile: SkyProfileDefinition): AtmosphereRuntimeState {
    const haze = ATMOSPHERE_CONFIG.haze
    const distance = ATMOSPHERE_CONFIG.distanceColor
    const hazeColor = resolveAtmosphereHazeColor(skyProfile.gradient.horizonColor)

    if (!haze.enabled) {
      scene.fogMode = BabylonScene.FOGMODE_NONE
    } else {
      scene.fogMode = BabylonScene.FOGMODE_LINEAR
      scene.fogColor = new Color3(hazeColor[0], hazeColor[1], hazeColor[2])
      scene.fogStart = haze.start
      scene.fogEnd = haze.end
    }

    scene.clearColor.set(
      skyProfile.gradient.horizonColor[0],
      skyProfile.gradient.horizonColor[1],
      skyProfile.gradient.horizonColor[2],
      1,
    )

    this.lastState = {
      hazeEnabled: haze.enabled,
      hazeColor,
      hazeStart: haze.start,
      hazeEnd: haze.end,
      contrastReduction: haze.contrastReduction * skyProfile.hazeIntensity,
      distanceColorEnabled: distance.enabled,
      distanceNear: distance.nearDistance,
      distanceFar: distance.farDistance,
    }

    return this.lastState
  }

  getLastState(): AtmosphereRuntimeState | null {
    return this.lastState
  }
}
