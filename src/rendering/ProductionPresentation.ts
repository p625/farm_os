import { Color3, StandardMaterial, type Scene } from '@babylonjs/core'
import { MILL_POSITION } from '@/config/production-catalog.ts'
import type { ProductionSystem } from '@systems/ProductionSystem.ts'
import { ProductionBuildingState } from '@/types/production.ts'

const IDLE_EMISSIVE = new Color3(0.02, 0.02, 0.015)
const PROCESSING_EMISSIVE = new Color3(0.12, 0.08, 0.03)
const READY_EMISSIVE = new Color3(0.18, 0.14, 0.05)

export class ProductionPresentation {
  private scene: Scene | null = null
  private productionSystem: ProductionSystem | null = null

  attach(scene: Scene, productionSystem: ProductionSystem): void {
    this.scene = scene
    this.productionSystem = productionSystem
    this.syncVisuals()
  }

  syncVisuals(): void {
    if (!this.scene || !this.productionSystem) {
      return
    }

    const mesh = this.scene.getMeshByName('mill_building')
    const material = mesh?.material as StandardMaterial | undefined
    if (!material) {
      return
    }

    try {
      const mill = this.productionSystem.getMillSnapshot()
      switch (mill.state) {
        case ProductionBuildingState.Processing:
          material.emissiveColor = PROCESSING_EMISSIVE.clone()
          break
        case ProductionBuildingState.Ready:
          material.emissiveColor = READY_EMISSIVE.clone()
          break
        case ProductionBuildingState.Idle:
        default:
          material.emissiveColor = IDLE_EMISSIVE.clone()
          break
      }
    } catch {
      material.emissiveColor = IDLE_EMISSIVE.clone()
    }
  }

  detach(): void {
    this.scene = null
    this.productionSystem = null
  }
}

export { MILL_POSITION }
