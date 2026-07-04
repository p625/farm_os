import type { Engine, Scene } from '@babylonjs/core'
import { HDR_RENDERING_CONFIG } from '@/config/rendering/hdr-config.ts'

export interface HdrCapabilityReport {
  requested: boolean
  active: boolean
  floatTextures: boolean
  halfFloatTextures: boolean
  colorBufferFloat: boolean
}

export class HdrController {
  private report: HdrCapabilityReport = {
    requested: false,
    active: false,
    floatTextures: false,
    halfFloatTextures: false,
    colorBufferFloat: false,
  }

  apply(engine: Engine, scene: Scene): HdrCapabilityReport {
    const config = HDR_RENDERING_CONFIG
    const caps = engine.getCaps()

    this.report = {
      requested: config.enabled,
      active: false,
      floatTextures: caps.textureFloat,
      halfFloatTextures: caps.textureHalfFloat,
      colorBufferFloat: caps.colorBufferFloat,
    }

    if (!config.enabled) {
      return this.report
    }

    const hardwareReady =
      caps.textureHalfFloatRender ||
      caps.textureFloatRender ||
      caps.colorBufferFloat

    if (hardwareReady || !config.fallbackToLdr) {
      scene.imageProcessingConfiguration.isEnabled = true
      this.report.active = true
    } else if (config.fallbackToLdr) {
      scene.imageProcessingConfiguration.isEnabled = true
      this.report.active = false
    }

    return this.report
  }

  getReport(): HdrCapabilityReport {
    return this.report
  }
}
