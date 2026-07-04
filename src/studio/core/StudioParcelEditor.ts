import type { Scene } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  pickFieldObjectId,
  pickParcelPlacementPoint,
} from '@/studio/parcel/ParcelPlacementPick.ts'
import {
  footprintFromRect,
  parcelRectFromCorners,
} from '@/studio/parcel/ParcelMath.ts'
import { validateParcelFootprint } from '@/studio/parcel/ParcelValidation.ts'

export interface StudioParcelEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioParcelEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioParcelEditorDeps
  private attached = false
  private drawing = false

  constructor(canvas: HTMLCanvasElement, deps: StudioParcelEditorDeps) {
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
    this.endDrawing()
    const scene = this.deps.getScene()
    if (scene) {
      this.deps.mapSceneBuilder.disposeParcelDraftMesh(scene)
    }
  }

  syncModuleState(scene: Scene | null): void {
    if (!scene || this.deps.store.getSnapshot().activeModuleId !== 'parcels') {
      if (scene) {
        this.deps.mapSceneBuilder.disposeParcelDraftMesh(scene)
      }
      return
    }
    this.syncDraftPreview(scene)
  }

  private syncDraftPreview(scene: Scene): void {
    const { parcelDraft } = this.deps.store.getSnapshot()
    if (!parcelDraft?.cornerB) {
      this.deps.mapSceneBuilder.disposeParcelDraftMesh(scene)
      return
    }

    const rect = parcelRectFromCorners(
      parcelDraft.cornerA.x,
      parcelDraft.cornerA.z,
      parcelDraft.cornerB.x,
      parcelDraft.cornerB.z,
    )
    const footprint = footprintFromRect(rect)
    const validation = validateParcelFootprint(this.deps.store.getMap(), footprint)
    const map = this.deps.store.getMap()
    const surfaceY = this.deps.mapSceneBuilder.sampleFieldSurfaceY(
      map,
      rect.centerX,
      rect.centerZ,
    )

    this.deps.mapSceneBuilder.refreshParcelDraftMesh(
      scene,
      rect,
      surfaceY,
      validation.ok,
    )
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'parcels') {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const { parcelTool } = this.deps.store.getSnapshot()

    if (parcelTool === 'select') {
      const fieldId = pickFieldObjectId(scene, coords.x, coords.y)
      if (!fieldId) {
        this.deps.store.selectObject(null)
        this.deps.requestRender()
        return
      }

      const object = this.deps.store.findObject(fieldId)
      if (object) {
        this.deps.store.selectObject(object)
      }
      this.deps.requestRender()
      return
    }

    const hit = pickParcelPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()
    this.canvas.setPointerCapture(event.pointerId)
    this.deps.cameraController.getCamera().detachControl()
    this.canvas.classList.add('studio-shell__canvas--manipulating')
    this.drawing = true
    this.deps.store.startParcelDraft(hit.x, hit.z)
    this.deps.store.updateParcelDraftCornerB(hit.x, hit.z)
    this.syncModuleState(scene)
    this.deps.requestRender()
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.drawing) {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const hit = pickParcelPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()
    this.deps.store.updateParcelDraftCornerB(hit.x, hit.z)
    this.syncDraftPreview(scene)
    this.deps.requestRender()
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.drawing) {
      return
    }

    const scene = this.deps.getScene()
    if (this.deps.store.commitParcelDraft()) {
      this.deps.onRefresh()
    } else if (scene) {
      this.syncDraftPreview(scene)
    }

    this.endDrawing()
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
    this.deps.requestRender()
  }

  private endDrawing(): void {
    this.drawing = false
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
