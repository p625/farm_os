import {
  PointerEventTypes,
  type AbstractMesh,
  type PickingInfo,
  type Scene,
  type Vector3,
} from '@babylonjs/core'
import type { Game } from '@core/Game.ts'
import { DEFAULT_MACHINE_ID } from '@/config/machine-catalog.ts'
import { FIELD_IDS } from '@/config/field-catalog.ts'
import { FIELD_POSITIONS } from '@/config/farm-layout.ts'
import {
  getAttachmentIdFromMesh,
  isAttachmentMesh,
} from '@rendering/AttachmentPresentation.ts'
import {
  SelectedEntityKind,
  type MachineCommand,
} from '@/types/machine.ts'
import type { AttachmentIdValue } from '@/types/attachment.ts'

const TRACTOR_NODE_NAME = 'tractor'
const TERRAIN_MESH_NAME = 'terrain'
const FARMYARD_MESH_NAME = 'farmyard'
const RIGHT_CLICK_DRAG_THRESHOLD_PX = 6
const FIELD_HALF_WIDTH = 5
const FIELD_HALF_DEPTH = 7

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
        const attachmentPick = this.pickFromClient(
          start.x,
          start.y,
          (mesh) => isAttachmentMesh(mesh),
        )

        let mesh = attachmentPick.mesh ?? start.mesh
        let point = attachmentPick.point ?? start.point

        if (!mesh) {
          const retry = this.pickFromClient(
            start.x,
            start.y,
            this.buildMachineSelectedPredicate(true),
          )
          mesh = retry.mesh
          point = retry.point
        }

        this.handleRightClick(mesh, point, start.x, start.y)
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
    if (this.isTractorMesh(mesh)) {
      this.game?.selectMachine(DEFAULT_MACHINE_ID)
    }
  }

  private handleRightClick(
    mesh: AbstractMesh | null,
    point: Vector3 | null,
    screenX: number,
    screenY: number,
  ): void {
    const snapshot = this.game?.getSnapshot()
    if (snapshot?.selectedEntity.kind !== SelectedEntityKind.Machine) {
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
      snapshot.tractor.position,
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

    this.game?.issueMachineCommand(DEFAULT_MACHINE_ID, command)
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

      const fieldPick = this.pickFromClient(
        event.clientX,
        event.clientY,
        (mesh) =>
          !this.isTractorMesh(mesh) &&
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
      if (this.isTractorMesh(mesh)) {
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

  private isTractorMesh(mesh: AbstractMesh): boolean {
    let current: AbstractMesh | null = mesh
    while (current) {
      if (current.name === TRACTOR_NODE_NAME) {
        return true
      }
      current = current.parent as AbstractMesh | null
    }
    return false
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
      if (
        Math.abs(position.x - center.x) <= FIELD_HALF_WIDTH &&
        Math.abs(position.z - center.z) <= FIELD_HALF_DEPTH
      ) {
        return fieldId
      }
    }
    return null
  }
}

export { MachineInputPresentation as TractorInputPresentation }
