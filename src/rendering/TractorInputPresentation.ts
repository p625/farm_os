import {
  PointerEventTypes,
  type AbstractMesh,
  type Scene,
} from '@babylonjs/core'
import type { Game } from '@core/Game.ts'
import { DEFAULT_MACHINE_ID } from '@/config/machine-catalog.ts'
import { FIELD_IDS } from '@/config/field-catalog.ts'
import {
  SelectedEntityKind,
  type MachineCommand,
} from '@/types/machine.ts'

const TRACTOR_NODE_NAME = 'tractor'
const TERRAIN_MESH_NAME = 'terrain'
const RIGHT_CLICK_DRAG_THRESHOLD_PX = 6

interface PointerStart {
  x: number
  y: number
  button: number
}

export class TractorInputPresentation {
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
        this.pointerStart = {
          x: event.clientX,
          y: event.clientY,
          button: event.button,
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

      const pick = pointerInfo.pickInfo
      if (!pick?.hit || !pick.pickedMesh) {
        return
      }

      if (event.button === 0) {
        this.handleLeftClick(pick.pickedMesh)
        return
      }

      if (event.button === 2) {
        this.handleRightClick(pick.pickedMesh, pick)
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
    mesh: AbstractMesh,
    pick: NonNullable<import('@babylonjs/core').PointerInfo['pickInfo']>,
  ): void {
    const snapshot = this.game?.getSnapshot()
    if (snapshot?.selectedEntity.kind !== SelectedEntityKind.Machine) {
      return
    }

    if (this.isFieldMesh(mesh) || this.isTractorMesh(mesh)) {
      return
    }

    if (!this.isTerrainMesh(mesh)) {
      return
    }

    const point = pick.pickedPoint
    if (!point) {
      return
    }

    const command: MachineCommand = {
      destination: { kind: 'world', x: point.x, z: point.z },
      task: { kind: 'none' },
    }

    this.game?.issueMachineCommand(DEFAULT_MACHINE_ID, command)
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
    let current: AbstractMesh | null = mesh
    while (current) {
      if (FIELD_IDS.includes(current.name as (typeof FIELD_IDS)[number])) {
        return true
      }
      current = current.parent as AbstractMesh | null
    }
    return false
  }
}
