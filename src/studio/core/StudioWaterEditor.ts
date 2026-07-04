import type { Scene } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  pickWaterObjectId,
  pickWaterPlacementPoint,
} from '@/studio/water/WaterPlacementPick.ts'
import { waterEllipseFromCorners } from '@/studio/water/WaterAreaMath.ts'
import { isAreaWaterType } from '@/studio/water/WaterTypePalette.ts'

export interface StudioWaterEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioWaterEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioWaterEditorDeps
  private attached = false
  private drawingArea = false

  constructor(canvas: HTMLCanvasElement, deps: StudioWaterEditorDeps) {
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
    this.endAreaDrawing()
    const scene = this.deps.getScene()
    if (scene) {
      this.deps.mapSceneBuilder.disposeWaterDraftMeshes(scene)
    }
  }

  syncModuleState(scene: Scene | null): void {
    if (!scene || this.deps.store.getSnapshot().activeModuleId !== 'water') {
      if (scene) {
        this.deps.mapSceneBuilder.disposeWaterDraftMeshes(scene)
      }
      return
    }
    this.syncDraftPreview(scene)
  }

  private syncDraftPreview(scene: Scene): void {
    const snapshot = this.deps.store.getSnapshot()
    const map = this.deps.store.getMap()

    if (snapshot.waterSplineDraft && snapshot.waterSplineDraft.points.length >= 2) {
      this.deps.mapSceneBuilder.refreshWaterSplineDraftMesh(
        scene,
        map,
        snapshot.waterSplineDraft.points,
        snapshot.waterType,
      )
      return
    }

    if (snapshot.waterAreaDraft?.cornerB) {
      const ellipse = waterEllipseFromCorners(
        snapshot.waterAreaDraft.cornerA.x,
        snapshot.waterAreaDraft.cornerA.z,
        snapshot.waterAreaDraft.cornerB.x,
        snapshot.waterAreaDraft.cornerB.z,
      )
      const surfaceY = this.deps.mapSceneBuilder.sampleWaterSurfaceY(
        map,
        ellipse.centerX,
        ellipse.centerZ,
      )
      this.deps.mapSceneBuilder.refreshWaterAreaDraftMesh(
        scene,
        ellipse,
        surfaceY,
        snapshot.waterType,
      )
      return
    }

    this.deps.mapSceneBuilder.disposeWaterDraftMeshes(scene)
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'water') {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const snapshot = this.deps.store.getSnapshot()

    if (snapshot.waterTool === 'select') {
      const objectId = pickWaterObjectId(scene, coords.x, coords.y)
      if (!objectId) {
        this.deps.store.selectObject(null)
        this.deps.requestRender()
        return
      }
      const object = this.deps.store.findObject(objectId)
      if (object) {
        this.deps.store.selectObject(object)
      }
      this.deps.requestRender()
      return
    }

    const hit = pickWaterPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()
    const map = this.deps.store.getMap()

    if (isAreaWaterType(snapshot.waterType)) {
      this.canvas.setPointerCapture(event.pointerId)
      this.deps.cameraController.getCamera().detachControl()
      this.canvas.classList.add('studio-shell__canvas--manipulating')
      this.drawingArea = true
      this.deps.store.startWaterAreaDraft(hit.x, hit.z)
      this.deps.store.updateWaterAreaDraftCornerB(hit.x, hit.z)
      this.syncDraftPreview(scene)
      this.deps.requestRender()
      return
    }

    const point = this.deps.mapSceneBuilder.sampleWaterPoint(map, hit.x, hit.z)
    this.deps.store.addWaterSplineDraftPoint(point)
    this.syncDraftPreview(scene)
    this.deps.requestRender()
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.drawingArea) {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const hit = pickWaterPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()
    this.deps.store.updateWaterAreaDraftCornerB(hit.x, hit.z)
    this.syncDraftPreview(scene)
    this.deps.requestRender()
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.drawingArea) {
      return
    }

    const scene = this.deps.getScene()
    if (this.deps.store.commitWaterAreaDraft()) {
      this.deps.onRefresh()
    } else if (scene) {
      this.deps.store.cancelWaterAreaDraft()
      this.deps.mapSceneBuilder.disposeWaterDraftMeshes(scene)
    }

    this.endAreaDrawing()
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
    this.deps.requestRender()
  }

  private endAreaDrawing(): void {
    this.drawingArea = false
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
