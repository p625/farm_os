import type { Scene } from '@babylonjs/core'
import { Vector3 } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { PolygonObjectAdapter } from '@/studio/polygon/PolygonEditorTypes.ts'
import { PolygonDrawingSession } from '@/studio/polygon/PolygonDrawingSession.ts'
import { PolygonPreviewRenderer } from '@/studio/polygon/PolygonPreviewRenderer.ts'
import { validatePolygonGeometry } from '@/studio/polygon/PolygonValidation.ts'
import { isNearPoint } from '@/studio/polygon/PolygonGeometryUtils.ts'

const DRAG_THRESHOLD_PX = 4
const VERTEX_PICK_RADIUS = 1.8
const CLOSE_RADIUS = 1.8

type InteractionMode = 'idle' | 'move-polygon' | 'move-vertex' | 'rotate'

export interface PolygonEditorDeps {
  adapter: PolygonObjectAdapter
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
  onDrawingPointsChanged?: (pointCount: number) => void
}

interface MovePolygonSession {
  objectId: string
  startGround: Vector3
  startPoints: { x: number; z: number }[]
}

interface MoveVertexSession {
  objectId: string
  vertexIndex: number
  startPoints: { x: number; z: number }[]
}

export class PolygonEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: PolygonEditorDeps
  private readonly session = new PolygonDrawingSession()
  private readonly preview = new PolygonPreviewRenderer()
  private attached = false
  private previewAttached = false
  private mode: InteractionMode = 'idle'
  private movePolygonSession: MovePolygonSession | null = null
  private moveVertexSession: MoveVertexSession | null = null
  private pointerDown: { x: number; y: number; canvasX: number; canvasY: number } | null = null
  private historyCheckpointed = false
  private suppressNextClick = false

  constructor(canvas: HTMLCanvasElement, deps: PolygonEditorDeps) {
    this.canvas = canvas
    this.deps = deps
  }

  getDrawingPointCount(): number {
    return this.session.pointCount
  }

  isDrawing(): boolean {
    return this.session.isActive
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
    this.canvas.addEventListener('dblclick', this.onDoubleClick)
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
    this.canvas.removeEventListener('dblclick', this.onDoubleClick)
    this.endInteraction()
    this.clearPreview()
  }

  syncModuleState(scene: Scene | null, active: boolean): void {
    if (!scene || !active) {
      this.clearPreview()
      return
    }
    if (this.deps.adapter.getTool() !== 'draw' && this.session.isActive) {
      this.cancelDrawing()
      return
    }
    this.ensurePreview(scene)
    this.syncPreview()
  }

  cancelDrawing(): void {
    this.session.clear()
    this.deps.onDrawingPointsChanged?.(0)
    this.clearPreview()
    this.deps.requestRender()
  }

  finishDrawing(): boolean {
    return this.commitDrawing()
  }

  removeLastPoint(): boolean {
    if (!this.session.removeLastPoint()) {
      return false
    }
    this.deps.onDrawingPointsChanged?.(this.session.pointCount)
    this.syncPreview()
    this.deps.requestRender()
    return true
  }

  private ensurePreview(scene: Scene): void {
    if (this.previewAttached) {
      return
    }
    const root =
      scene.getTransformNodeByName('studio_map_root') as import('@babylonjs/core').TransformNode | null
    if (!root) {
      return
    }
    this.preview.attach(scene, root)
    this.previewAttached = true
  }

  private clearPreview(): void {
    this.preview.clear()
    if (this.previewAttached) {
      this.preview.dispose()
      this.previewAttached = false
    }
  }

  private syncPreview(): void {
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }
    this.ensurePreview(scene)
    const state = this.session.getState()
    if (state.points.length === 0) {
      this.preview.clear()
      return
    }
    const draftForValidation = state.cursor
      ? [...state.points, state.cursor]
      : state.points
    const geometry =
      draftForValidation.length >= 3
        ? validatePolygonGeometry(this.deps.adapter.getMap(), draftForValidation)
        : { ok: true as const }
    const domain =
      draftForValidation.length >= 3
        ? this.deps.adapter.validatePolygon(
            this.deps.adapter.getMap(),
            draftForValidation,
          )
        : { ok: true as const }
    const isValid = geometry.ok && domain.ok
    const surfaceY = this.deps.adapter.getPreviewSurfaceY(state.points)
    this.preview.update(state.points, state.cursor, isValid, { surfaceY })
  }

  private commitDrawing(): boolean {
    if (!this.session.beginFinish()) {
      return false
    }

    const points = this.session.committedPoints()
    if (points.length < 3) {
      this.session.endFinish()
      this.deps.adapter.logValidationError('Polygon needs at least 3 vertices.')
      return false
    }

    const geometry = validatePolygonGeometry(this.deps.adapter.getMap(), points)
    if (!geometry.ok) {
      this.session.endFinish()
      this.deps.adapter.logValidationError(geometry.message ?? 'Invalid polygon.')
      return false
    }

    const domain = this.deps.adapter.validatePolygon(this.deps.adapter.getMap(), points)
    if (!domain.ok) {
      this.session.endFinish()
      this.deps.adapter.logValidationError(domain.message ?? 'Invalid polygon.')
      return false
    }

    const created = this.deps.adapter.createFromPolygon(points)
    this.session.endFinish()
    if (!created) {
      return false
    }

    this.session.clear()
    this.deps.onDrawingPointsChanged?.(0)
    this.clearPreview()
    this.deps.adapter.selectObject(created)
    this.deps.onRefresh()
    this.deps.requestRender()
    return true
  }

  private readonly onDoubleClick = (event: MouseEvent): void => {
    if (this.deps.adapter.getTool() !== 'draw') {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this.suppressNextClick = true
    this.commitDrawing()
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.suppressNextClick) {
      this.suppressNextClick = false
      event.preventDefault()
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const tool = this.deps.adapter.getTool()

    if (tool === 'select' || tool === 'edit' || tool === 'rotate') {
      this.handleSelectDown(scene, coords, tool, event)
      return
    }

    if (tool !== 'draw') {
      return
    }

    const hit = this.deps.adapter.pickGround(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()

    const state = this.session.getState()
    if (
      state.points.length >= 3 &&
      isNearPoint(hit.x, hit.z, state.points[0], CLOSE_RADIUS)
    ) {
      this.commitDrawing()
      return
    }

    this.session.addPoint(hit.x, hit.z)
    this.deps.onDrawingPointsChanged?.(this.session.pointCount)
    this.syncPreview()
    this.deps.requestRender()
  }

  private handleSelectDown(
    scene: Scene,
    coords: { x: number; y: number },
    tool: string,
    event: PointerEvent,
  ): void {
    const objectId = this.deps.adapter.pickObject(scene, coords.x, coords.y)
    if (!objectId) {
      this.deps.adapter.selectObject(null)
      this.deps.requestRender()
      return
    }

    const object = this.deps.adapter.findObject(objectId)
    if (!object) {
      return
    }

    this.deps.adapter.selectObject(object)

    const points = this.deps.adapter.getObjectPolygon(object)
    const hit = this.deps.adapter.pickGround(scene, coords.x, coords.y)
    if (!points || !hit) {
      this.deps.requestRender()
      return
    }

    if (tool === 'edit') {
      const vertexIndex = this.findNearestVertex(points, hit.x, hit.z)
      if (vertexIndex >= 0) {
        this.beginDrag(event, coords, 'move-vertex', {
          objectId,
          vertexIndex,
          startPoints: points.map((point) => ({ ...point })),
        })
        return
      }
    }

    this.beginDrag(event, coords, 'move-polygon', {
      objectId,
      startGround: new Vector3(hit.x, 0, hit.z),
      startPoints: points.map((point) => ({ ...point })),
    })
    this.deps.requestRender()
  }

  private beginDrag(
    event: PointerEvent,
    coords: { x: number; y: number },
    mode: 'move-polygon' | 'move-vertex',
    session: MovePolygonSession | MoveVertexSession,
  ): void {
    event.preventDefault()
    this.canvas.setPointerCapture(event.pointerId)
    this.deps.cameraController.getCamera().detachControl()
    this.canvas.classList.add('studio-shell__canvas--manipulating')
    this.mode = mode
    this.historyCheckpointed = false
    this.pointerDown = {
      x: event.clientX,
      y: event.clientY,
      canvasX: coords.x,
      canvasY: coords.y,
    }
    if (mode === 'move-polygon') {
      this.movePolygonSession = session as MovePolygonSession
      this.moveVertexSession = null
    } else {
      this.moveVertexSession = session as MoveVertexSession
      this.movePolygonSession = null
    }
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)

    if (this.mode === 'move-polygon' && this.movePolygonSession && this.pointerDown) {
      this.handleMovePolygon(scene, coords, event)
      return
    }

    if (this.mode === 'move-vertex' && this.moveVertexSession && this.pointerDown) {
      this.handleMoveVertex(scene, coords, event)
      return
    }

    if (this.deps.adapter.getTool() === 'draw' && this.session.isActive) {
      const hit = this.deps.adapter.pickGround(scene, coords.x, coords.y)
      if (!hit) {
        return
      }
      this.session.setCursor(hit.x, hit.z)
      this.syncPreview()
      this.deps.requestRender()
    }
  }

  private handleMovePolygon(
    scene: Scene,
    coords: { x: number; y: number },
    event: PointerEvent,
  ): void {
    if (!this.movePolygonSession || !this.exceededDragThreshold(event)) {
      return
    }
    if (!this.historyCheckpointed) {
      this.deps.adapter.checkpointHistory('move')
      this.historyCheckpointed = true
    }
    const hit = this.deps.adapter.pickGround(scene, coords.x, coords.y)
    if (!hit) {
      return
    }
    const deltaX = hit.x - this.movePolygonSession.startGround.x
    const deltaZ = hit.z - this.movePolygonSession.startGround.z
    const moved = this.movePolygonSession.startPoints.map((point) => ({
      x: point.x + deltaX,
      z: point.z + deltaZ,
    }))
    this.deps.adapter.updatePolygon(this.movePolygonSession.objectId, moved, {
      checkpoint: false,
    })
    const object = this.deps.adapter.findObject(this.movePolygonSession.objectId)
    if (object) {
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, object)
    }
    this.deps.requestRender()
  }

  private handleMoveVertex(
    scene: Scene,
    coords: { x: number; y: number },
    event: PointerEvent,
  ): void {
    if (!this.moveVertexSession || !this.exceededDragThreshold(event)) {
      return
    }
    if (!this.historyCheckpointed) {
      this.deps.adapter.checkpointHistory('edit')
      this.historyCheckpointed = true
    }
    const hit = this.deps.adapter.pickGround(scene, coords.x, coords.y)
    if (!hit) {
      return
    }
    const moved = this.moveVertexSession.startPoints.map((point, index) =>
      index === this.moveVertexSession!.vertexIndex
        ? { x: hit.x, z: hit.z }
        : point,
    )
    this.deps.adapter.updatePolygon(this.moveVertexSession.objectId, moved, {
      checkpoint: false,
    })
    const object = this.deps.adapter.findObject(this.moveVertexSession.objectId)
    if (object) {
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, object)
    }
    this.deps.requestRender()
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (this.mode === 'idle') {
      return
    }
    this.endInteraction()
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
    this.deps.onRefresh()
    this.deps.requestRender()
  }

  private endInteraction(): void {
    this.mode = 'idle'
    this.movePolygonSession = null
    this.moveVertexSession = null
    this.pointerDown = null
    this.historyCheckpointed = false
    this.canvas.classList.remove('studio-shell__canvas--manipulating')
    try {
      this.deps.cameraController.getCamera().attachControl(this.canvas, false)
    } catch {
      // Camera may be disposed during teardown.
    }
  }

  private exceededDragThreshold(event: PointerEvent): boolean {
    if (!this.pointerDown) {
      return false
    }
    return (
      Math.hypot(event.clientX - this.pointerDown.x, event.clientY - this.pointerDown.y) >=
      DRAG_THRESHOLD_PX
    )
  }

  private findNearestVertex(
    points: readonly { x: number; z: number }[],
    x: number,
    z: number,
  ): number {
    let best = -1
    let bestDistance = VERTEX_PICK_RADIUS
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index]
      const distance = Math.hypot(point.x - x, point.z - z)
      if (distance <= bestDistance) {
        bestDistance = distance
        best = index
      }
    }
    return best
  }

  private canvasCoords(event: PointerEvent | MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }
}
