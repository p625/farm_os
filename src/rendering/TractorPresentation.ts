import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  type Mesh,
  type Scene,
  type TransformNode,
} from '@babylonjs/core'
import { getFieldPositions } from '@/config/farm-layout.ts'
import type { TractorJobSystem } from '@systems/TractorJobSystem.ts'
import { SelectedEntityKind } from '@/types/machine.ts'
import { TractorState } from '@/types/tractor.ts'

const TRACTOR_NODE_NAME = 'tractor'
const TRACTOR_BODY_NAME = 'tractorBody'
const WORK_INDICATOR_NAME = 'tractor_work_indicator'

const SELECT_EMISSIVE = new Color3(0.22, 0.3, 0.1)
const IDLE_BODY_EMISSIVE = new Color3(0, 0, 0)

export class TractorPresentation {
  private scene: Scene | null = null
  private tractorSystem: TractorJobSystem | null = null
  private workIndicator: Mesh | null = null
  private isSelected = false

  attach(scene: Scene, tractorSystem: TractorJobSystem): void {
    this.detach()
    this.scene = scene
    this.tractorSystem = tractorSystem
    this.createWorkIndicator(scene)
    this.syncVisuals()
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected
    this.syncSelectionVisual()
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

    this.syncSelectionVisual()
    this.syncWorkIndicator()
  }

  detach(): void {
    this.workIndicator?.dispose()
    this.workIndicator = null
    this.isSelected = false
    this.scene = null
    this.tractorSystem = null
  }

  private syncSelectionVisual(): void {
    if (!this.scene) {
      return
    }

    const body = this.scene.getMeshByName(TRACTOR_BODY_NAME)
    const material = body?.material as StandardMaterial | undefined
    if (!material) {
      return
    }

    material.emissiveColor = this.isSelected
      ? SELECT_EMISSIVE.clone()
      : IDLE_BODY_EMISSIVE.clone()
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

    const fieldPosition = getFieldPositions()[snapshot.activeJob.fieldId]
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

export function isTractorSelected(
  selectedEntity: { kind: SelectedEntityKind; machineId: string | null },
  machineId: string,
): boolean {
  return (
    selectedEntity.kind === SelectedEntityKind.Machine &&
    selectedEntity.machineId === machineId
  )
}
