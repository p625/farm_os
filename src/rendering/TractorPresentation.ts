import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  type Mesh,
  type Scene,
  type TransformNode,
} from '@babylonjs/core'
import { FIELD_POSITIONS } from '@/config/farm-layout.ts'
import type { TractorJobSystem } from '@systems/TractorJobSystem.ts'
import { TractorState } from '@/types/tractor.ts'

const TRACTOR_NODE_NAME = 'tractor'
const WORK_INDICATOR_NAME = 'tractor_work_indicator'

export class TractorPresentation {
  private scene: Scene | null = null
  private tractorSystem: TractorJobSystem | null = null
  private workIndicator: Mesh | null = null

  attach(scene: Scene, tractorSystem: TractorJobSystem): void {
    this.detach()
    this.scene = scene
    this.tractorSystem = tractorSystem
    this.createWorkIndicator(scene)
    this.syncVisuals()
  }

  syncVisuals(): void {
    if (!this.scene || !this.tractorSystem) {
      return
    }

    const node = this.scene.getTransformNodeByName(
      TRACTOR_NODE_NAME,
    ) as TransformNode | null
    if (node) {
      const position = this.tractorSystem.getPosition()
      node.position = new Vector3(position.x, position.y, position.z)
      node.rotation.y = this.tractorSystem.getRotationY()
    }

    this.syncWorkIndicator()
  }

  detach(): void {
    this.workIndicator?.dispose()
    this.workIndicator = null
    this.scene = null
    this.tractorSystem = null
  }

  private createWorkIndicator(scene: Scene): void {
    const indicator = MeshBuilder.CreateCylinder(
      WORK_INDICATOR_NAME,
      { height: 0.15, diameter: 1.4 },
      scene,
    )
    indicator.isPickable = false
    indicator.setEnabled(false)

    const material = new StandardMaterial('tractor_work_indicator_mat', scene)
    material.diffuseColor = new Color3(0.95, 0.8, 0.2)
    material.emissiveColor = new Color3(0.45, 0.35, 0.05)
    indicator.material = material
    this.workIndicator = indicator
  }

  private syncWorkIndicator(): void {
    if (!this.workIndicator || !this.tractorSystem) {
      return
    }

    const snapshot = this.tractorSystem.toSnapshot()
    const isWorking = snapshot.state === TractorState.Working
    this.workIndicator.setEnabled(isWorking)

    if (!isWorking || !snapshot.activeJob) {
      return
    }

    const fieldPosition = FIELD_POSITIONS[snapshot.activeJob.fieldId]
    if (!fieldPosition) {
      return
    }

    const pulse = 1 + Math.sin(snapshot.workProgress * Math.PI * 6) * 0.12
    this.workIndicator.position = new Vector3(
      fieldPosition.x,
      0.35 + snapshot.workProgress * 0.25,
      fieldPosition.z,
    )
    this.workIndicator.scaling.setAll(pulse)
  }
}
