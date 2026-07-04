import type { Scene } from '@babylonjs/core'
import { VEGETATION_WIND_CONFIG } from '@/config/rendering/vegetation/vegetation-wind-config.ts'
import type { VegetationLayer } from '@/rendering/vegetation/VegetationLayer.ts'

export class VegetationWindController {
  private elapsed = 0
  private observer: { remove: () => void } | null = null

  attach(scene: Scene, layers: readonly VegetationLayer[]): void {
    if (!VEGETATION_WIND_CONFIG.enabled) {
      return
    }

    this.detach()
    this.observer = scene.onBeforeRenderObservable.add(() => {
      this.elapsed += scene.getEngine().getDeltaTime() * 0.001
      this.applyWind(layers, this.elapsed)
    })
  }

  detach(): void {
    this.observer?.remove()
    this.observer = null
  }

  private applyWind(layers: readonly VegetationLayer[], time: number): void {
    for (const layer of layers) {
      if (!layer.isEnabled() || !layer.definition.windProfile.enabled) {
        continue
      }

      const mesh = layer.getSourceMesh()
      if (!mesh) {
        continue
      }

      const profile = layer.definition.windProfile
      const wave =
        Math.sin(time * profile.frequency * Math.PI * 2 + layer.definition.id.length) *
        profile.strength *
        VEGETATION_WIND_CONFIG.globalStrength

      if (profile.swayAxis === 'x') {
        mesh.rotation.x = wave * 0.08
      } else {
        mesh.rotation.z = wave * 0.06
      }
    }
  }
}
