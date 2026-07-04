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
import {
  getMachineCatalogEntry,
  MACHINE_CATALOG,
} from '@/config/machine-catalog.ts'
import type { MachineRegistry } from '@systems/MachineRegistry.ts'
import { MachineId } from '@/types/machine.ts'
import { TractorState } from '@/types/tractor.ts'

const WORK_INDICATOR_PREFIX = 'machine_work_indicator_'
const FULL_BIN_INDICATOR_PREFIX = 'machine_full_bin_indicator_'

const SELECT_EMISSIVE = new Color3(0.22, 0.3, 0.1)
const IDLE_BODY_EMISSIVE = new Color3(0, 0, 0)

export class MachinePresentation {
  private scene: Scene | null = null
  private registry: MachineRegistry | null = null
  private selectedMachineId: MachineId | null = null
  private readonly workIndicators = new Map<MachineId, Mesh>()
  private readonly fullBinIndicators = new Map<MachineId, Mesh>()

  attach(scene: Scene, registry: MachineRegistry): void {
    this.detach()
    this.scene = scene
    this.registry = registry

    for (const entry of MACHINE_CATALOG) {
      this.createWorkIndicator(scene, entry.id)
      this.createFullBinIndicator(scene, entry.id)
    }

    this.syncVisuals()
  }

  setSelectedMachine(machineId: MachineId | null): void {
    this.selectedMachineId = machineId
    this.syncSelectionVisuals()
  }

  syncVisuals(): void {
    if (!this.scene || !this.registry) {
      return
    }

    for (const entry of MACHINE_CATALOG) {
      const controller = this.registry.get(entry.id)
      const node = this.scene.getTransformNodeByName(
        entry.sceneNodeName,
      ) as TransformNode | null

      if (!controller || !node) {
        continue
      }

      const position = controller.getPosition()
      node.position = new Vector3(position.x, position.y, position.z)
      node.rotation.y = controller.getRotationY()
    }

    this.syncSelectionVisuals()
    this.syncWorkIndicators()
    this.syncFullBinIndicators()
  }

  detach(): void {
    for (const indicator of this.workIndicators.values()) {
      indicator.dispose()
    }
    this.workIndicators.clear()
    for (const indicator of this.fullBinIndicators.values()) {
      indicator.dispose()
    }
    this.fullBinIndicators.clear()
    this.selectedMachineId = null
    this.scene = null
    this.registry = null
  }

  private syncSelectionVisuals(): void {
    if (!this.scene) {
      return
    }

    for (const entry of MACHINE_CATALOG) {
      const body = this.scene.getMeshByName(entry.bodyMeshName)
      const material = body?.material as StandardMaterial | undefined
      if (!material) {
        continue
      }

      const isSelected = this.selectedMachineId === entry.id
      material.emissiveColor = isSelected
        ? SELECT_EMISSIVE.clone()
        : IDLE_BODY_EMISSIVE.clone()
    }
  }

  private createWorkIndicator(scene: Scene, machineId: MachineId): void {
    const indicator = MeshBuilder.CreateCylinder(
      `${WORK_INDICATOR_PREFIX}${machineId}`,
      { height: 0.15, diameter: 1.4 },
      scene,
    )
    indicator.isPickable = false
    indicator.setEnabled(false)

    const material = new StandardMaterial(
      `${WORK_INDICATOR_PREFIX}${machineId}_mat`,
      scene,
    )
    material.diffuseColor = new Color3(0.95, 0.8, 0.2)
    material.emissiveColor = new Color3(0.45, 0.35, 0.05)
    indicator.material = material
    this.workIndicators.set(machineId, indicator)
  }

  private createFullBinIndicator(scene: Scene, machineId: MachineId): void {
    const indicator = MeshBuilder.CreateBox(
      `${FULL_BIN_INDICATOR_PREFIX}${machineId}`,
      { width: 0.9, height: 0.9, depth: 0.08 },
      scene,
    )
    indicator.isPickable = false
    indicator.setEnabled(false)

    const material = new StandardMaterial(
      `${FULL_BIN_INDICATOR_PREFIX}${machineId}_mat`,
      scene,
    )
    material.diffuseColor = new Color3(0.95, 0.25, 0.15)
    material.emissiveColor = new Color3(0.5, 0.12, 0.05)
    indicator.material = material
    this.fullBinIndicators.set(machineId, indicator)
  }

  private syncFullBinIndicators(): void {
    if (!this.registry) {
      return
    }

    for (const entry of MACHINE_CATALOG) {
      const indicator = this.fullBinIndicators.get(entry.id)
      const controller = this.registry.get(entry.id)
      if (!indicator || !controller) {
        continue
      }

      const bin = controller.getGrainBinSnapshot?.()
      const isFull = bin?.isFull ?? false
      indicator.setEnabled(isFull)

      if (!isFull) {
        continue
      }

      const position = controller.getPosition()
      indicator.position = new Vector3(position.x, 4.2, position.z)
    }
  }

  private syncWorkIndicators(): void {
    if (!this.registry) {
      return
    }

    for (const entry of MACHINE_CATALOG) {
      const indicator = this.workIndicators.get(entry.id)
      const controller = this.registry.get(entry.id)
      if (!indicator || !controller) {
        continue
      }

      const snapshot = controller.toSnapshot()
      const isWorking = snapshot.state === TractorState.Working
      indicator.setEnabled(isWorking)

      if (!isWorking || !snapshot.activeJob) {
        continue
      }

      const fieldPosition = FIELD_POSITIONS[snapshot.activeJob.fieldId]
      if (!fieldPosition) {
        continue
      }

      const pulse = 1 + Math.sin(snapshot.workProgress * Math.PI * 6) * 0.12
      indicator.position = new Vector3(
        fieldPosition.x,
        0.35 + snapshot.workProgress * 0.25,
        fieldPosition.z,
      )
      indicator.scaling.setAll(pulse)
    }
  }
}

export function resolveMachineIdFromMesh(meshNameChain: string[]): MachineId | null {
  for (const name of meshNameChain) {
    const entry = MACHINE_CATALOG.find((machine) => machine.sceneNodeName === name)
    if (entry) {
      return entry.id
    }
  }
  return null
}

export function getMachineSceneNodeName(machineId: MachineId): string {
  return getMachineCatalogEntry(machineId)?.sceneNodeName ?? machineId
}
