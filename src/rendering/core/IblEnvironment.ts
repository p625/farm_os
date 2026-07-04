import type { Scene } from '@babylonjs/core'
import { IBL_RENDERING_CONFIG } from '@/config/rendering/ibl-config.ts'

export interface IblEnvironmentState {
  enabled: boolean
  environmentMapUrl: string | null
  intensity: number
  rotationY: number
  loaded: boolean
}

/**
 * Architectural IBL API — HDRI binding arrives with Milestone 2.
 * No environment textures are loaded in MS1A.5.
 */
export class IblEnvironment {
  private state: IblEnvironmentState = {
    enabled: IBL_RENDERING_CONFIG.enabled,
    environmentMapUrl: IBL_RENDERING_CONFIG.environmentMapUrl,
    intensity: IBL_RENDERING_CONFIG.intensity,
    rotationY: IBL_RENDERING_CONFIG.rotationY,
    loaded: false,
  }

  initialize(_scene: Scene): IblEnvironmentState {
    const config = IBL_RENDERING_CONFIG
    this.state = {
      enabled: config.enabled,
      environmentMapUrl: config.environmentMapUrl,
      intensity: config.intensity,
      rotationY: config.rotationY,
      loaded: false,
    }

    if (!config.enabled || !config.environmentMapUrl) {
      return this.state
    }

    // Future: CubeTexture.CreateFromPrefilteredData / HDR loader.
    return this.state
  }

  getState(): IblEnvironmentState {
    return this.state
  }

  /** Future hook for runtime HDRI swap (weather, time of day). */
  setEnvironmentMapUrl(url: string | null): void {
    this.state.environmentMapUrl = url
    this.state.loaded = false
  }
}
