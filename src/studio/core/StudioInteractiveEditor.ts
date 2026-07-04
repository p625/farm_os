import type { Scene } from '@babylonjs/core'
import { Vector3 } from '@babylonjs/core'
import type { MapObject } from '@/types/world-map.ts'
import { pickGroundPoint } from '@/studio/core/StudioGroundPicker.ts'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import {
  MapSceneBuilder,
  findStudioMeshByObjectId,
  getStudioMetadata,
} from '@/studio/io/MapSceneBuilder.ts'
import type { StudioSelection } from '@/studio/core/StudioSelection.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { pickAnchorObjectId } from '@/studio/anchor/AnchorPlacementPick.ts'
import { pickBuildingObjectId } from '@/studio/building/BuildingPlacementPick.ts'
import { pickVehicleObjectId } from '@/studio/vehicle/VehiclePlacementPick.ts'
import {
  isGameplayParentObject,
  isSceneAnchorObject,
} from '@/studio/anchor/studioAnchorSync.ts'

const DRAG_THRESHOLD_PX = 4

function eventHasRotateModifier(event: PointerEvent): boolean {
  return event.shiftKey || event.altKey
}

type InteractionMode = 'idle' | 'move' | 'rotate'

interface MoveSession {
  objectId: string
  startObject: MapObject
  startGround: Vector3
}

interface RotateSession {
  objectId: string
  startObject: MapObject
  startRotationY: number
  startAngle: number
  pivotX: number
  pivotZ: number
}

export interface StudioInteractiveEditorDeps {
  store: StudioStore
  selection: StudioSelection
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  onCommit: () => void
}

export class StudioInteractiveEditor {
  private readonly deps: StudioInteractiveEditorDeps
  private readonly canvas: HTMLCanvasElement
  private mode: InteractionMode = 'idle'
  private moveSession: MoveSession | null = null
  private rotateSession: RotateSession | null = null
  private pointerDown: { x: number; y: number; canvasX: number; canvasY: number } | null =
    null
  private pendingRotate = false
  private historyCheckpointed = false
  private attached = false

  constructor(canvas: HTMLCanvasElement, deps: StudioInteractiveEditorDeps) {
    this.canvas = canvas
    this.deps = deps
  }

  attach(): void {
    if (this.attached) {
      return
    }
    this.attached = true
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerup', this.onPointerUp)
    this.canvas.addEventListener('pointercancel', this.onPointerUp)
  }

  detach(): void {
    if (!this.attached) {
      return
    }
    this.attached = false
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
    this.canvas.removeEventListener('pointercancel', this.onPointerUp)
    this.endInteraction()
  }

  syncSelection(scene: Scene | null): void {
    if (!scene) {
      return
    }
    const selected = this.deps.store.getSnapshot().selectedObject
    if (selected) {
      this.deps.selection.highlightByObjectId(scene, selected.id)
    } else {
      this.deps.selection.clear()
    }
  }

  private isInteractiveMode(): boolean {
    const snapshot = this.deps.store.getSnapshot()
    if (snapshot.activeModuleId === 'buildings' && snapshot.buildingTool === 'select') {
      return true
    }
    if (snapshot.activeModuleId === 'vehicles' && snapshot.vehicleTool === 'select') {
      return true
    }
    if (
      snapshot.activeModuleId === 'buildings' &&
      snapshot.buildingTool === 'anchors'
    ) {
      return true
    }
    if (
      snapshot.activeModuleId === 'vehicles' &&
      snapshot.vehicleTool === 'anchors'
    ) {
      return true
    }
    return false
  }

  private pickEditableObjectId(
    scene: Scene,
    canvasX: number,
    canvasY: number,
  ): string | null {
    const anchorId = pickAnchorObjectId(scene, canvasX, canvasY)
    if (anchorId) {
      return anchorId
    }
    const buildingId = pickBuildingObjectId(scene, canvasX, canvasY)
    if (buildingId) {
      return buildingId
    }
    return pickVehicleObjectId(scene, canvasX, canvasY)
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.isInteractiveMode()) {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    this.pointerDown = {
      x: event.clientX,
      y: event.clientY,
      canvasX: coords.x,
      canvasY: coords.y,
    }
    this.pendingRotate = eventHasRotateModifier(event)
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.isInteractiveMode()) {
      return
    }

    const scene = this.deps.getScene()
    if (!scene || !this.pointerDown) {
      return
    }

    const coords = this.canvasCoords(event)

    if (this.mode === 'move' && this.moveSession) {
      event.preventDefault()
      this.applyMove(scene, coords.x, coords.y)
      return
    }

    if (this.mode === 'rotate' && this.rotateSession) {
      event.preventDefault()
      this.applyRotate(scene, coords.x, coords.y)
      return
    }

    const dx = event.clientX - this.pointerDown.x
    const dy = event.clientY - this.pointerDown.y
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return
    }

    const objectId = this.pickEditableObjectId(
      scene,
      this.pointerDown.canvasX,
      this.pointerDown.canvasY,
    )
    if (!objectId) {
      return
    }

    const object = this.deps.store.findObject(objectId)
    if (!object) {
      return
    }

    if (!this.historyCheckpointed) {
      this.deps.store.checkpointHistory(this.pendingRotate ? 'rotate' : 'move')
      this.historyCheckpointed = true
    }

    event.preventDefault()
    this.canvas.setPointerCapture(event.pointerId)
    this.deps.cameraController.getCamera().detachControl()

    if (
      this.pendingRotate &&
      (isGameplayParentObject(object) || isSceneAnchorObject(object))
    ) {
      const ground = pickGroundPoint(
        scene,
        coords.x,
        coords.y,
        object.transform.position.y,
      )
      if (!ground) {
        return
      }
      const pivotX = object.transform.position.x
      const pivotZ = object.transform.position.z
      const startAngle = Math.atan2(ground.z - pivotZ, ground.x - pivotX)
      this.mode = 'rotate'
      this.rotateSession = {
        objectId: object.id,
        startObject: object,
        startRotationY: object.transform.rotationY ?? 0,
        startAngle,
        pivotX,
        pivotZ,
      }
      this.canvas.classList.add('studio-shell__canvas--manipulating')
      this.applyRotate(scene, coords.x, coords.y)
      return
    }

    const ground = pickGroundPoint(
      scene,
      coords.x,
      coords.y,
      object.transform.position.y,
    )
    const startGround = pickGroundPoint(
      scene,
      this.pointerDown.canvasX,
      this.pointerDown.canvasY,
      object.transform.position.y,
    )
    if (!ground || !startGround) {
      return
    }

    this.mode = 'move'
    this.moveSession = {
      objectId: object.id,
      startObject: object,
      startGround,
    }
    this.canvas.classList.add('studio-shell__canvas--manipulating')
    this.applyMove(scene, coords.x, coords.y)
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.isInteractiveMode()) {
      this.resetPointerState()
      return
    }

    const scene = this.deps.getScene()
    const wasManipulating = this.mode !== 'idle'

    if (wasManipulating) {
      this.commitDraft()
      this.endInteraction()
    } else if (this.pointerDown && scene) {
      const dx = event.clientX - this.pointerDown.x
      const dy = event.clientY - this.pointerDown.y
      if (Math.hypot(dx, dy) <= DRAG_THRESHOLD_PX) {
        const coords = this.canvasCoords(event)
        const objectId = this.pickEditableObjectId(scene, coords.x, coords.y)
        const object = objectId ? this.deps.store.findObject(objectId) : null
        this.deps.store.selectObject(object ?? null)
        if (object) {
          this.deps.selection.highlightByObjectId(scene, object.id)
          if (isGameplayParentObject(object)) {
            this.deps.store.setAnchorParentId(object.id)
          }
        } else {
          this.deps.selection.clear()
        }
      }
    }

    this.resetPointerState()

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
  }

  private resetPointerState(): void {
    this.pointerDown = null
    this.pendingRotate = false
    this.historyCheckpointed = false
  }

  private applyMove(scene: Scene, canvasX: number, canvasY: number): void {
    if (!this.moveSession) {
      return
    }

    const ground = pickGroundPoint(
      scene,
      canvasX,
      canvasY,
      this.moveSession.startObject.transform.position.y,
    )
    if (!ground) {
      return
    }

    const delta = ground.subtract(this.moveSession.startGround)
    const start = this.moveSession.startObject.transform.position
    const draftPosition = {
      x: start.x + delta.x,
      y: start.y,
      z: start.z + delta.z,
    }

    const object = this.moveSession.startObject
    if (isSceneAnchorObject(object)) {
      const draft: MapObject = {
        ...object,
        transform: {
          ...object.transform,
          position: { ...object.transform.position, ...draftPosition },
        },
      }
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, draft)
      this.deps.selection.highlightByObjectId(scene, draft.id)
      return
    }

    const drafts = this.deps.store.previewMoveObjectWithAnchors(
      object.id,
      draftPosition,
    )
    for (const draft of drafts) {
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, draft)
    }
    this.deps.selection.highlightByObjectId(scene, object.id)
  }

  private applyRotate(scene: Scene, canvasX: number, canvasY: number): void {
    if (!this.rotateSession) {
      return
    }

    const ground = pickGroundPoint(
      scene,
      canvasX,
      canvasY,
      this.rotateSession.startObject.transform.position.y,
    )
    if (!ground) {
      return
    }

    const angle = Math.atan2(
      ground.z - this.rotateSession.pivotZ,
      ground.x - this.rotateSession.pivotX,
    )
    const delta = angle - this.rotateSession.startAngle
    const nextRotationY = this.rotateSession.startRotationY + delta
    const object = this.rotateSession.startObject

    if (isSceneAnchorObject(object)) {
      const draft: MapObject = {
        ...object,
        transform: {
          ...object.transform,
          rotationY: nextRotationY,
        },
      }
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, draft)
      this.deps.selection.highlightByObjectId(scene, draft.id)
      return
    }

    const drafts = this.deps.store.previewRotateObjectWithAnchors(
      object.id,
      nextRotationY,
    )
    for (const draft of drafts) {
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, draft)
    }
    this.deps.selection.highlightByObjectId(scene, object.id)
  }

  private commitDraft(): void {
    const session = this.moveSession ?? this.rotateSession
    if (!session) {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const mesh = findStudioMeshByObjectId(scene, session.objectId)
    const draft = mesh ? getStudioMetadata(mesh)?.mapObject : null
    if (!draft) {
      return
    }

    if (this.moveSession) {
      if (isSceneAnchorObject(draft)) {
        this.deps.store.updateAnchor(draft.id, {
          position: {
            x: draft.transform.position.x,
            z: draft.transform.position.z,
          },
          rotationY: draft.transform.rotationY,
        })
      } else {
        this.deps.store.moveObjectWithAnchors(draft.id, {
          x: draft.transform.position.x,
          z: draft.transform.position.z,
        })
      }
    } else if (this.rotateSession) {
      if (isSceneAnchorObject(draft)) {
        this.deps.store.updateAnchor(draft.id, {
          rotationY: draft.transform.rotationY ?? 0,
        })
      } else {
        this.deps.store.rotateObjectWithAnchors(
          draft.id,
          draft.transform.rotationY ?? 0,
        )
      }
    }

    this.deps.onCommit()
  }

  private endInteraction(): void {
    this.mode = 'idle'
    this.moveSession = null
    this.rotateSession = null
    this.canvas.classList.remove('studio-shell__canvas--manipulating')
    try {
      this.deps.cameraController.getCamera().attachControl(this.canvas, false)
    } catch {
      // Camera may be disposed during teardown.
    }
  }

  private canvasCoords(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }
}
