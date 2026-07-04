import type { Engine, Scene } from '@babylonjs/core'
import { SKY_SYSTEM_CONFIG } from '@/config/rendering/sky/sky-config.ts'
import { getActiveSkyProfile } from '@/config/rendering/sky/sky-profiles.ts'
import { getActiveSunProfile } from '@/config/rendering/sky/sun-profiles.ts'
import type { LightingSystem } from '@/rendering/LightingSystem.ts'
import type { ImageProcessingController } from '@/rendering/core/ImageProcessingController.ts'
import type { SkyRuntimeState } from '@/types/sky-rendering.ts'
import { AtmosphereController } from '@/rendering/sky/AtmosphereController.ts'
import { SkyGradient } from '@/rendering/sky/SkyGradient.ts'
import { SunController } from '@/rendering/sky/SunController.ts'
import { logSkyDebugReport } from '@/rendering/sky/SkyDebug.ts'

export interface SkySystemContext {
  lighting: LightingSystem
  imageProcessing: ImageProcessingController
}

export class SkySystem {
  private readonly gradient = new SkyGradient()
  private readonly atmosphere = new AtmosphereController()
  private readonly sun = new SunController()
  private initialized = false
  private runtimeState: SkyRuntimeState | null = null

  initialize(scene: Scene, _engine: Engine, context: SkySystemContext): void {
    if (!SKY_SYSTEM_CONFIG.enabled) {
      return
    }

    const skyProfile = getActiveSkyProfile(SKY_SYSTEM_CONFIG.activeSkyProfileId)
    this.gradient.build(scene, skyProfile)
    this.apply(scene, context)
    this.initialized = true
    logSkyDebugReport(this)
  }

  apply(scene: Scene, context: SkySystemContext): void {
    if (!SKY_SYSTEM_CONFIG.enabled) {
      return
    }

    const skyProfile = getActiveSkyProfile(SKY_SYSTEM_CONFIG.activeSkyProfileId)
    const sunProfile = getActiveSunProfile(SKY_SYSTEM_CONFIG.activeSunProfileId)
    const atmosphereState = this.atmosphere.apply(scene, skyProfile)
    const sunState = this.sun.apply(scene, context.lighting, context.imageProcessing, sunProfile)

    if (this.initialized) {
      this.gradient.refreshFromConfig()
    }

    this.runtimeState = {
      skyProfileId: skyProfile.id,
      sunProfileId: sunProfile.id,
      hazeIntensity: skyProfile.hazeIntensity,
      hazeStart: atmosphereState.hazeStart,
      hazeEnd: atmosphereState.hazeEnd,
      ambientColor: sunState.ambientColor,
      zenithColor: skyProfile.gradient.zenithColor,
      horizonColor: skyProfile.gradient.horizonColor,
    }
  }

  getRuntimeReport(): Record<string, unknown> {
    const skyProfile = getActiveSkyProfile(SKY_SYSTEM_CONFIG.activeSkyProfileId)
    const sunState = this.sun.getLastState()
    const atmosphereState = this.atmosphere.getLastState()

    return {
      skyProfile: {
        id: skyProfile.id,
        displayName: skyProfile.displayName,
        zenithColor: skyProfile.gradient.zenithColor,
        horizonColor: skyProfile.gradient.horizonColor,
        hazeIntensity: skyProfile.hazeIntensity,
        sunElevation: skyProfile.sunElevationDegrees,
      },
      sunProfile: sunState,
      atmosphere: atmosphereState,
      ambientColor: sunState?.ambientColor ?? skyProfile.ambientTint,
      runtimeState: this.runtimeState,
    }
  }

  getRuntimeState(): SkyRuntimeState | null {
    return this.runtimeState
  }

  dispose(): void {
    this.gradient.dispose()
    this.initialized = false
    this.runtimeState = null
  }
}
