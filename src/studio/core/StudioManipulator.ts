import type { Scene } from '@babylonjs/core'
import { Vector3 } from '@babylonjs/core'
import type { MapObject } from '@/types/world-map.ts'
import { pickGroundPoint } from '@/studio/core/StudioGroundPicker.ts'
import {
  type BoxCorner,
  OPPOSITE_BOX_CORNER,
  boxFromFixedAndDraggedCorner,
  canMoveObject,
  canResizeObject,
  getBoxCornerWorld,
} from '@/studio/core/StudioBoxMath.ts'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import {
  MapSceneBuilder,
  findStudioMeshByObjectId,
  getStudioMetadata,
} from '@/studio/io/MapSceneBuilder.ts'
import type { StudioSelection } from '@/studio/core/StudioSelection.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { StudioTransformHandles } from '@/studio/core/StudioTransformHandles.ts'

const DRAG_THRESHOLD_PX = 4

type ManipulatorMode = 'idle' | 'move' | 'resize'

interface MoveSession {
  objectId: string
  startObject: MapObject
  startGround: Vector3
}

interface ResizeSession {
  objectId: string
  corner: BoxCorner
  fixedCornerWorld: Vector3
  startObject: MapObject
}

export interface StudioManipulatorDeps {
  store: StudioStore
  selection: StudioSelection
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  onCommit: () => void
}

export class StudioManipulator {
  private readonly handles = new StudioTransformHandles()
  private readonly deps: StudioManipulatorDeps
  private readonly canvas: HTMLCanvasElement
  private mode: ManipulatorMode = 'idle'
  private moveSession: MoveSession | null = null
  private resizeSession: ResizeSession | null = null
  private pointerDown: { x: number; y: number; canvasX: number; canvasY: number } | null =
    null
  private pendingObjectId: string | null = null
  private attached = false

  constructor(canvas: HTMLCanvasElement, deps: StudioManipulatorDeps) {
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
    this.handles.dispose()
  }

  syncSelection(scene: Scene | null): void {
    if (!scene) {
      this.handles.clear()
      return
    }
    const selected = this.deps.store.getSnapshot().selectedObject
    this.handles.sync(scene, selected)
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'transform') {
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

    const handle = this.handles.pickHandle(scene, coords.x, coords.y)
    if (handle) {
      const object = this.deps.store.findObject(handle.objectId)
      if (!object || !canResizeObject(object)) {
        return
      }

      const fixedCorner = OPPOSITE_BOX_CORNER[handle.corner]
      const fixedWorld = getBoxCornerWorld(object, fixedCorner)
      if (!fixedWorld) {
        return
      }

      event.preventDefault()
      this.canvas.setPointerCapture(event.pointerId)
      this.deps.cameraController.getCamera().detachControl()
      this.deps.store.selectObject(object)
      this.deps.selection.highlightByObjectId(scene, object.id)
      this.handles.sync(scene, object)

      this.mode = 'resize'
      this.resizeSession = {
        objectId: object.id,
        corner: handle.corner,
        fixedCornerWorld: fixedWorld.clone(),
        startObject: object,
      }
      this.canvas.classList.add('studio-shell__canvas--manipulating')
      return
    }

    const picked = this.deps.selection.pick(scene, coords.x, coords.y)
    this.pendingObjectId = picked?.id ?? null
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.deps.store.getSnapshot().activeModuleId !== 'transform') {
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

    if (this.mode === 'resize' && this.resizeSession) {
      event.preventDefault()
      this.applyResize(scene, coords.x, coords.y)
      return
    }

    const dx = event.clientX - this.pointerDown.x
    const dy = event.clientY - this.pointerDown.y
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return
    }

    if (!this.pendingObjectId) {
      return
    }

    const object = this.deps.store.findObject(this.pendingObjectId)
    if (!object || !canMoveObject(object)) {
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

    event.preventDefault()
    this.canvas.setPointerCapture(event.pointerId)
    this.deps.cameraController.getCamera().detachControl()
    this.deps.store.selectObject(object)
    this.deps.selection.highlightByObjectId(scene, object.id)
    this.handles.sync(scene, object)

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
    if (this.deps.store.getSnapshot().activeModuleId !== 'transform') {
      this.pointerDown = null
      this.pendingObjectId = null
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
        const picked = this.deps.selection.pick(scene, coords.x, coords.y)
        this.deps.store.selectObject(picked)
        this.handles.sync(scene, picked)
      }
    }

    this.pointerDown = null
    this.pendingObjectId = null

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
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
    const draft: MapObject = {
      ...this.moveSession.startObject,
      transform: {
        ...this.moveSession.startObject.transform,
        position: {
          x: start.x + delta.x,
          y: start.y,
          z: start.z + delta.z,
        },
      },
    }

    this.deps.mapSceneBuilder.upsertObjectMesh(scene, draft)
    this.deps.selection.highlightByObjectId(scene, draft.id)
    this.handles.sync(scene, draft)
  }

  private applyResize(scene: Scene, canvasX: number, canvasY: number): void {
    if (!this.resizeSession) {
      return
    }

    const start = this.resizeSession.startObject
    const groundY = start.transform.position.y
    const dragged = pickGroundPoint(scene, canvasX, canvasY, groundY)
    if (!dragged) {
      return
    }

    const next = boxFromFixedAndDraggedCorner(
      this.resizeSession.fixedCornerWorld,
      dragged,
      start.transform.rotationY ?? 0,
      groundY,
    )

    if (start.shape?.type !== 'box') {
      return
    }

    const draft: MapObject = {
      ...start,
      transform: {
        ...start.transform,
        position: next.position,
      },
      shape: {
        ...start.shape,
        width: next.width,
        depth: next.depth,
      },
    }

    this.deps.mapSceneBuilder.upsertObjectMesh(scene, draft)
    this.deps.selection.highlightByObjectId(scene, draft.id)
    this.handles.sync(scene, draft)
  }

  private commitDraft(): void {
    const session = this.moveSession ?? this.resizeSession
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

    const shape =
      draft.shape?.type === 'box'
        ? {
            width: draft.shape.width,
            depth: draft.shape.depth,
            height: draft.shape.height,
          }
        : undefined

    this.deps.store.updateObject(session.objectId, {
      transform: {
        position: { ...draft.transform.position },
        rotationY: draft.transform.rotationY,
      },
      shape,
    })
    this.deps.onCommit()
  }

  private endInteraction(): void {
    this.mode = 'idle'
    this.moveSession = null
    this.resizeSession = null
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
