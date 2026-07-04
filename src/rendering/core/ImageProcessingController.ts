import {
  ColorCurves,
  ImageProcessingConfiguration,
  type Scene,
} from '@babylonjs/core'
import {
  IMAGE_PROCESSING_CONFIG,
  type ToneMappingKind,
} from '@/config/rendering/image-processing-config.ts'

function resolveToneMappingType(
  kind: ToneMappingKind,
): number {
  switch (kind) {
    case 'aces':
      return ImageProcessingConfiguration.TONEMAPPING_ACES
    case 'khronos_pbr_neutral':
      return ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL
    case 'standard':
    default:
      return ImageProcessingConfiguration.TONEMAPPING_STANDARD
  }
}

export class ImageProcessingController {
  apply(scene: Scene): void {
    const config = IMAGE_PROCESSING_CONFIG
    const ipc = scene.imageProcessingConfiguration

    ipc.isEnabled = config.enabled
    if (!config.enabled) {
      return
    }

    ipc.exposure = config.exposure
    ipc.contrast = config.contrast
    ipc.toneMappingEnabled = config.toneMapping.enabled
    ipc.toneMappingType = resolveToneMappingType(config.toneMapping.kind)

    const curves = ipc.colorCurves ?? new ColorCurves()
    curves.globalDensity = config.colorCurves.globalDensity
    curves.globalExposure = config.colorCurves.globalExposure
    curves.globalHue = config.colorCurves.globalHue
    curves.globalSaturation = config.colorCurves.globalSaturation
    curves.highlightsDensity = config.colorCurves.highlightsDensity
    curves.shadowsDensity = config.colorCurves.shadowsDensity
    ipc.colorCurves = curves
    ipc.colorCurvesEnabled = config.colorCurves.enabled
  }
}
