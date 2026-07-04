import { Color3, Scene as BabylonScene, type Scene } from '@babylonjs/core'
import { ENVIRONMENT_RENDERING_CONFIG } from '@/config/rendering/environment-config.ts'

export class FogController {
  apply(scene: Scene): void {
    const fog = ENVIRONMENT_RENDERING_CONFIG.fog

    if (!fog.enabled) {
      scene.fogMode = BabylonScene.FOGMODE_NONE
      return
    }

    scene.fogColor = new Color3(fog.color[0], fog.color[1], fog.color[2])

    switch (fog.mode) {
      case 'linear':
        scene.fogMode = BabylonScene.FOGMODE_LINEAR
        scene.fogStart = fog.start
        scene.fogEnd = fog.end
        break
      case 'exponential':
        scene.fogMode = BabylonScene.FOGMODE_EXP2
        scene.fogDensity = fog.density
        break
      case 'height':
      case 'weather':
        // Architectural placeholders — dedicated shaders/passes in future milestones.
        scene.fogMode = BabylonScene.FOGMODE_LINEAR
        scene.fogStart = fog.start
        scene.fogEnd = fog.end
        break
      default:
        scene.fogMode = BabylonScene.FOGMODE_NONE
    }
  }
}
