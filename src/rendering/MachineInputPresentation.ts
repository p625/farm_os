import {
  PointerEventTypes,
  type AbstractMesh,
  type Node,
  type PickingInfo,
  type Scene,
  type Vector3,
} from '@babylonjs/core'
import type { Game } from '@core/Game.ts'
import { isKnownMachineSceneNode, resolveMachineIdFromMeshName } from '@/config/machine-catalog.ts'
import { getInteractionPointDefinition } from '@/config/interaction-point-catalog.ts'
import { InteractionPointType } from '@/types/interaction-point.ts'
import { getMachineTemplateId } from '@systems/MachineInstanceRegistry.ts'
import { MachineTemplateId } from '@/types/machine-template.ts'
import { FIELD_IDS } from '@/config/field-catalog.ts'
import { resolveInteractionPointIdFromMesh } from '@/config/interaction-point-catalog.ts'
import {
  FIELD_POSITIONS,
  getFieldHalfExtents,
} from '@/config/farm-layout.ts'
import {
  getAttachmentIdFromMesh,
  isAttachmentMesh,
} from '@rendering/AttachmentPresentation.ts'
import {
  MachineId,
  SelectedEntityKind,
  type MachineCommand,
} from '@/types/machine.ts'
import type { AttachmentIdValue } from '@/types/attachment.ts'

const TERRAIN_MESH_NAME = 'terrain'
const FARMYARD_MESH_NAME = 'farmyard'
const RIGHT_CLICK_DRAG_THRESHOLD_PX = 6

interface PointerStart {
  x: number
  y: number
  button: number
  mesh: AbstractMesh | null
  point: Vector3 | null
}

type PickPredicate = (mesh: AbstractMesh) => boolean

export class MachineInputPresentation {
  private scene: Scene | null = null
  private game: Game | null = null
  private pointerObserver: ReturnType<Scene['onPointerObservable']['add']> | null =
    null
  private pointerStart: PointerStart | null = null

  attach(scene: Scene, game: Game): void {
    this.detach()
    this.scene = scene
    this.game = game

    this.pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
      const event = pointerInfo.event as PointerEvent

      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        const pick = this.resolvePick(pointerInfo, event)
        this.pointerStart = {
          x: event.clientX,
          y: event.clientY,
          button: event.button,
          mesh: pick.mesh,
          point: pick.point,
        }
        return
      }

      if (pointerInfo.type !== PointerEventTypes.POINTERUP) {
        return
      }

      const start = this.pointerStart
      this.pointerStart = null
      if (!start || start.button !== event.button) {
        return
      }

      const dragDistance = Math.hypot(
        event.clientX - start.x,
        event.clientY - start.y,
      )
      if (dragDistance > RIGHT_CLICK_DRAG_THRESHOLD_PX) {
        return
      }

      if (event.button === 0) {
        if (!start.mesh) {
          return
        }
        this.handleLeftClick(start.mesh)
        return
      }

      if (event.button === 2) {
        const pick = this.resolveRightClickPick(start.x, start.y, start.mesh, start.point)
        this.handleRightClick(pick.mesh, pick.point, start.x, start.y)
      }
    })
  }

  detach(): void {
    if (this.scene && this.pointerObserver) {
      this.scene.onPointerObservable.remove(this.pointerObserver)
    }
    this.pointerObserver = null
    this.pointerStart = null
    this.scene = null
    this.game = null
  }

  private handleLeftClick(mesh: AbstractMesh): void {
    const machineId = this.resolveMachineId(mesh)
    if (machineId) {
      this.game?.selectMachine(machineId)
    }
  }

  private handleRightClick(
    mesh: AbstractMesh | null,
    point: Vector3 | null,
    screenX: number,
    screenY: number,
  ): void {
    const interactionPointId = mesh
      ? this.resolveInteractionPointId(mesh)
      : null
    if (interactionPointId) {
      const definition = getInteractionPointDefinition(interactionPointId)
      if (definition?.type === InteractionPointType.Shop) {
        this.game?.openInteractionContextMenu(
          interactionPointId,
          screenX,
          screenY,
        )
        return
      }
    }

    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return
    }

    const snapshot = this.game?.getSnapshot()
    const machineSnapshot = snapshot?.selectedMachine
    const machinePosition = machineSnapshot?.position ?? { x: 0, z: 0 }

    if (interactionPointId) {
      this.game?.openInteractionContextMenu(
        interactionPointId,
        screenX,
        screenY,
      )
      return
    }

    const logisticsTarget = mesh
      ? this.resolveLogisticsTargetMachine(mesh)
      : null
    if (
      logisticsTarget &&
      logisticsTarget !== machineId &&
      this.game?.tryOpenMachineLogisticsMenu(logisticsTarget, screenX, screenY)
    ) {
      return
    }

    const attachmentId = mesh ? getAttachmentIdFromMesh(mesh) : null
    if (attachmentId) {
      this.game?.openAttachmentContextMenu(
        attachmentId as AttachmentIdValue,
        screenX,
        screenY,
      )
      return
    }

    const fieldId = this.resolveFieldTarget(
      mesh,
      point,
      machinePosition,
    )
    if (fieldId) {
      this.game?.openFieldContextMenu(fieldId, screenX, screenY)
      return
    }

    if (!mesh || !this.isTerrainMesh(mesh) || !point) {
      return
    }

    const command: MachineCommand = {
      destination: { kind: 'world', x: point.x, z: point.z },
      task: { kind: 'none' },
    }

    this.game?.issueMachineCommand(machineId, command)
  }

  private getSelectedMachineId(): MachineId | null {
    const snapshot = this.game?.getSnapshot()
    if (snapshot?.selectedEntity.kind !== SelectedEntityKind.Machine) {
      return null
    }
    return snapshot.selectedEntity.machineId
  }

  private resolveRightClickPick(
    clientX: number,
    clientY: number,
    fallbackMesh: AbstractMesh | null,
    fallbackPoint: Vector3 | null,
  ): { mesh: AbstractMesh | null; point: Vector3 | null } {
    const attachmentPick = this.pickFromClient(clientX, clientY, (mesh) =>
      isAttachmentMesh(mesh),
    )
    if (attachmentPick.mesh) {
      return attachmentPick
    }

    const machinePick = this.pickFromClient(clientX, clientY, (mesh) =>
      this.isMachineMesh(mesh),
    )
    if (machinePick.mesh) {
      return machinePick
    }

    const interactionPick = this.pickFromClient(clientX, clientY, (mesh) =>
      this.isInteractionPointMesh(mesh),
    )
    if (interactionPick.mesh) {
      return interactionPick
    }

    if (fallbackMesh) {
      return { mesh: fallbackMesh, point: fallbackPoint }
    }

    return this.pickFromClient(
      clientX,
      clientY,
      this.buildMachineSelectedPredicate(true),
    )
  }

  private resolveLogisticsTargetMachine(mesh: AbstractMesh): MachineId | null {
    const machineId = this.resolveMachineId(mesh)
    if (machineId) {
      return machineId
    }

    const attachmentId = getAttachmentIdFromMesh(mesh)
    if (!attachmentId) {
      return null
    }

    const haulerMachineId = this.game?.resolveLogisticsTargetMachineId(
      attachmentId as AttachmentIdValue,
    )
    if (haulerMachineId) {
      return haulerMachineId
    }

    return (
      this.game?.resolveAttachmentHostMachineId(
        attachmentId as AttachmentIdValue,
      ) ?? null
    )
  }

  private isInteractionPointMesh(mesh: AbstractMesh): boolean {
    let current: AbstractMesh | null = mesh
    while (current) {
      if (resolveInteractionPointIdFromMesh(current.name)) {
        return true
      }
      current = current.parent as AbstractMesh | null
    }
    return false
  }

  private resolveFieldTarget(
    mesh: AbstractMesh | null,
    point: Vector3 | null,
    tractorPosition: { x: number; z: number },
  ): string | null {
    if (mesh && this.isFieldMesh(mesh)) {
      return this.resolveFieldId(mesh)
    }

    if (mesh && this.isTractorMesh(mesh)) {
      return this.resolveFieldAtPosition(tractorPosition)
    }

    if (point) {
      return this.resolveFieldAtPosition({
        x: point.x,
        z: point.z,
      })
    }

    return null
  }

  private resolvePick(
    pointerInfo: { pickInfo?: PickingInfo | null },
    event: PointerEvent,
  ): { mesh: AbstractMesh | null; point: Vector3 | null } {
    const machineSelected =
      this.game?.getSnapshot().selectedEntity.kind === SelectedEntityKind.Machine

    if (machineSelected && event.button === 2) {
      const attachmentPick = this.pickFromClient(
        event.clientX,
        event.clientY,
        (mesh) => isAttachmentMesh(mesh),
      )
      if (attachmentPick.mesh) {
        return attachmentPick
      }

      const machinePick = this.pickFromClient(
        event.clientX,
        event.clientY,
        (mesh) => this.isMachineMesh(mesh),
      )
      if (machinePick.mesh) {
        return machinePick
      }

      const interactionPick = this.pickFromClient(
        event.clientX,
        event.clientY,
        (mesh) => this.isInteractionPointMesh(mesh),
      )
      if (interactionPick.mesh) {
        return interactionPick
      }

      const fieldPick = this.pickFromClient(
        event.clientX,
        event.clientY,
        (mesh) =>
          !this.isMachineMesh(mesh) &&
          !isAttachmentMesh(mesh) &&
          !this.isFarmyardMesh(mesh),
      )
      if (fieldPick.mesh) {
        return fieldPick
      }
    }

    const pickInfo = pointerInfo.pickInfo
    if (pickInfo?.hit && pickInfo.pickedMesh) {
      return {
        mesh: pickInfo.pickedMesh,
        point: pickInfo.pickedPoint ?? null,
      }
    }

    return this.pickFromClient(
      event.clientX,
      event.clientY,
      machineSelected && event.button === 2
        ? this.buildMachineSelectedPredicate(false)
        : undefined,
    )
  }

  private buildMachineSelectedPredicate(
    includeAttachments: boolean,
  ): PickPredicate {
    return (mesh) => {
      if (this.isMachineMesh(mesh)) {
        return false
      }
      if (this.isFarmyardMesh(mesh)) {
        return false
      }
      if (!includeAttachments && isAttachmentMesh(mesh)) {
        return false
      }
      return true
    }
  }

  private isFarmyardMesh(mesh: AbstractMesh): boolean {
    let current: AbstractMesh | null = mesh
    while (current) {
      if (current.name === FARMYARD_MESH_NAME) {
        return true
      }
      current = current.parent as AbstractMesh | null
    }
    return false
  }

  private pickFromClient(
    clientX: number,
    clientY: number,
    predicate?: PickPredicate,
  ): { mesh: AbstractMesh | null; point: Vector3 | null } {
    const scene = this.scene
    if (!scene) {
      return { mesh: null, point: null }
    }

    const canvas = scene.getEngine().getRenderingCanvas()
    if (!canvas) {
      return { mesh: null, point: null }
    }

    const rect = canvas.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * canvas.width
    const y = ((clientY - rect.top) / rect.height) * canvas.height
    const pick = scene.pick(x, y, predicate)

    if (!pick?.hit || !pick.pickedMesh) {
      return { mesh: null, point: null }
    }

    return {
      mesh: pick.pickedMesh,
      point: pick.pickedPoint ?? null,
    }
  }

  private isMachineMesh(mesh: AbstractMesh): boolean {
    return this.resolveMachineId(mesh) !== null
  }

  private resolveMachineId(mesh: AbstractMesh): MachineId | null {
    let current: Node | null = mesh
    while (current) {
      const machineId = resolveMachineIdFromMeshName(current.name)
      if (machineId) {
        return machineId
      }
      const fromScene = isKnownMachineSceneNode(current.name)
      if (fromScene) {
        return fromScene
      }
      current = current.parent
    }
    return null
  }

  private resolveInteractionPointId(
    mesh: AbstractMesh,
  ): import('@/types/interaction-point.ts').InteractionPointId | null {
    let current: AbstractMesh | null = mesh
    while (current) {
      const pointId = resolveInteractionPointIdFromMesh(current.name)
      if (pointId) {
        return pointId
      }
      current = current.parent as AbstractMesh | null
    }
    return null
  }

  private isTractorMesh(mesh: AbstractMesh): boolean {
    const machineId = this.resolveMachineId(mesh)
    if (!machineId) {
      return false
    }
    return getMachineTemplateId(machineId) === MachineTemplateId.SmallTractor
  }

  private isTerrainMesh(mesh: AbstractMesh): boolean {
    return mesh.name === TERRAIN_MESH_NAME
  }

  private isFieldMesh(mesh: AbstractMesh): boolean {
    return this.resolveFieldId(mesh) !== null
  }

  private resolveFieldId(mesh: AbstractMesh): string | null {
    let current: AbstractMesh | null = mesh
    while (current) {
      if (FIELD_IDS.includes(current.name as (typeof FIELD_IDS)[number])) {
        return current.name
      }
      current = current.parent as AbstractMesh | null
    }
    return null
  }

  private resolveFieldAtPosition(position: {
    x: number
    z: number
  }): string | null {
    for (const [fieldId, center] of Object.entries(FIELD_POSITIONS)) {
      const { halfWidth, halfDepth } = getFieldHalfExtents(fieldId)
      if (
        Math.abs(position.x - center.x) <= halfWidth &&
        Math.abs(position.z - center.z) <= halfDepth
      ) {
        return fieldId
      }
    }
    return null
  }
}

export { MachineInputPresentation as TractorInputPresentation }
