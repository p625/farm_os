import { Color3, type Scene } from '@babylonjs/core'
import { ENVIRONMENT_RENDERING_CONFIG } from '@/config/rendering/environment-config.ts'

export class EnvironmentLightingController {
  apply(scene: Scene): void {
    const config = ENVIRONMENT_RENDERING_CONFIG

    scene.clearColor.set(
      config.clearColor.color[0],
      config.clearColor.color[1],
      config.clearColor.color[2],
      config.clearColor.alpha,
    )

    scene.ambientColor = new Color3(
      config.ambientColor[0],
      config.ambientColor[1],
      config.ambientColor[2],
    )
  }
}
