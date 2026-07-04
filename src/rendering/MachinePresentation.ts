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
import {
  getMachineCatalogEntry,
  MACHINE_CATALOG,
} from '@/config/machine-catalog.ts'
import type { MachineRegistry } from '@systems/MachineRegistry.ts'
import { MachineId } from '@/types/machine.ts'
import { TractorState } from '@/types/tractor.ts'
import {
  createTractorVisual,
  disposeTractorVisual,
} from './TractorMeshBuilder.ts'
import { getMachineTemplateId } from '@systems/MachineInstanceRegistry.ts'
import { MachineTemplateId } from '@/types/machine-template.ts'

const WORK_INDICATOR_PREFIX = 'machine_work_indicator_'
const FULL_BIN_INDICATOR_PREFIX = 'machine_full_bin_indicator_'

const SELECT_EMISSIVE = new Color3(0.22, 0.3, 0.1)
const IDLE_BODY_EMISSIVE = new Color3(0, 0, 0)

export class MachinePresentation {
  private scene: Scene | null = null
  private registry: MachineRegistry | null = null
  private selectedMachineId: MachineId | null = null
  private readonly selectionState = new Map<MachineId, boolean>()
  private readonly workIndicators = new Map<MachineId, Mesh>()
  private readonly fullBinIndicators = new Map<MachineId, Mesh>()
  private readonly spawnedInstances = new Set<MachineId>()

  attach(scene: Scene, registry: MachineRegistry): void {
    this.detach()
    this.scene = scene
    this.registry = registry

    for (const entry of MACHINE_CATALOG) {
      this.ensureIndicators(scene, entry.id)
    }

    this.syncVisuals()
  }

  setSelectedMachine(machineId: MachineId | null): void {
    this.selectedMachineId = machineId
    this.syncSelectionVisuals()
  }

  spawnTractorInstance(
    machineId: MachineId,
    position: { x: number; y: number; z: number },
    rotationY: number,
  ): void {
    if (!this.scene || machineId === MachineId.Tractor1) {
      return
    }

    const catalog = getMachineCatalogEntry(machineId)
    if (!catalog) {
      return
    }

    if (this.scene.getTransformNodeByName(catalog.sceneNodeName)) {
      return
    }

    createTractorVisual(
      this.scene,
      machineId,
      catalog.sceneNodeName,
      catalog.bodyMeshName,
      position,
      rotationY,
    )
    this.spawnedInstances.add(machineId)
    this.ensureIndicators(this.scene, machineId)
    this.syncVisuals()
  }

  despawnInstance(machineId: MachineId): void {
    if (!this.scene || machineId === MachineId.Tractor1) {
      return
    }

    const catalog = getMachineCatalogEntry(machineId)
    if (!catalog) {
      return
    }

    disposeTractorVisual(this.scene, catalog.sceneNodeName)
    this.spawnedInstances.delete(machineId)
    this.selectionState.delete(machineId)

    const workIndicator = this.workIndicators.get(machineId)
    workIndicator?.dispose()
    this.workIndicators.delete(machineId)

    const fullIndicator = this.fullBinIndicators.get(machineId)
    fullIndicator?.dispose()
    this.fullBinIndicators.delete(machineId)
  }

  syncVisuals(): void {
    if (!this.scene || !this.registry) {
      return
    }

    for (const controller of this.registry.getAll()) {
      const catalog = getMachineCatalogEntry(controller.machineId)
      if (!catalog) {
        continue
      }

      const node = this.scene.getTransformNodeByName(
        catalog.sceneNodeName,
      ) as TransformNode | null

      if (!node) {
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
    this.selectionState.clear()
    this.spawnedInstances.clear()
    this.selectedMachineId = null
    this.scene = null
    this.registry = null
  }

  private ensureIndicators(scene: Scene, machineId: MachineId): void {
    if (!this.workIndicators.has(machineId)) {
      this.createWorkIndicator(scene, machineId)
    }
    const templateId = getMachineTemplateId(machineId)
    if (
      templateId === MachineTemplateId.GrainCombine ||
      templateId === MachineTemplateId.CornCombine
    ) {
      if (!this.fullBinIndicators.has(machineId)) {
        this.createFullBinIndicator(scene, machineId)
      }
    }
  }

  private syncSelectionVisuals(): void {
    if (!this.scene || !this.registry) {
      return
    }

    for (const controller of this.registry.getAll()) {
      const catalog = getMachineCatalogEntry(controller.machineId)
      if (!catalog) {
        continue
      }

      const body = this.scene.getMeshByName(catalog.bodyMeshName)
      const material = body?.material as StandardMaterial | undefined
      if (!material) {
        continue
      }

      const isSelected = this.selectedMachineId === controller.machineId
      if (this.selectionState.get(controller.machineId) === isSelected) {
        continue
      }
      this.selectionState.set(controller.machineId, isSelected)
      material.emissiveColor.copyFrom(
        isSelected ? SELECT_EMISSIVE : IDLE_BODY_EMISSIVE,
      )
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

    for (const controller of this.registry.getAll()) {
      const indicator = this.fullBinIndicators.get(controller.machineId)
      if (!indicator) {
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

    for (const controller of this.registry.getAll()) {
      const indicator = this.workIndicators.get(controller.machineId)
      if (!indicator) {
        continue
      }

      const snapshot = controller.toSnapshot()
      const isWorking = snapshot.state === TractorState.Working
      indicator.setEnabled(isWorking)

      if (!isWorking) {
        continue
      }

      const pulse = 1 + Math.sin(snapshot.workProgress * Math.PI * 6) * 0.12

      if (snapshot.activeJob) {
        const fieldPosition = getFieldPositions()[snapshot.activeJob.fieldId]
        if (!fieldPosition) {
          continue
        }

        indicator.position = new Vector3(
          fieldPosition.x,
          0.35 + snapshot.workProgress * 0.25,
          fieldPosition.z,
        )
        indicator.scaling.setAll(pulse)
        continue
      }

      if (snapshot.activeLogisticsLabel) {
        const position = controller.getPosition()
        indicator.position = new Vector3(
          position.x,
          0.35 + snapshot.workProgress * 0.25,
          position.z,
        )
        indicator.scaling.setAll(pulse)
      }
    }
  }
}

export function resolveMachineIdFromMesh(meshNameChain: string[]): MachineId | null {
  for (const name of meshNameChain) {
    const entry = MACHINE_CATALOG.find((machine) => machine.sceneNodeName === name)
    if (entry) {
      return entry.id
    }
    if (/^tractor_\d+$/.test(name)) {
      return name
    }
  }
  return null
}

export function getMachineSceneNodeName(machineId: MachineId): string {
  return getMachineCatalogEntry(machineId)?.sceneNodeName ?? machineId
}
