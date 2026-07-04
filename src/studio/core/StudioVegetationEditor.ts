import type { Scene } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  pickVegetationObjectId,
  pickVegetationPlacementPoint,
} from '@/studio/vegetation/VegetationPlacementPick.ts'
import { VegetationBrushPreview } from '@/studio/vegetation/VegetationBrushPreview.ts'
import { getVegetationTypeDefinition } from '@/studio/vegetation/VegetationTypePalette.ts'

export interface StudioVegetationEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioVegetationEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioVegetationEditorDeps
  private readonly brushPreview = new VegetationBrushPreview()
  private attached = false
  private painting = false
  private lastPaintX: number | null = null
  private lastPaintZ: number | null = null
  private paintPlacedCount = 0

  constructor(canvas: HTMLCanvasElement, deps: StudioVegetationEditorDeps) {
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
    this.canvas.addEventListener('pointerleave', this.onPointerLeave)
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
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave)
    this.brushPreview.hide()
    this.endPainting()
    const scene = this.deps.getScene()
    if (scene) {
      this.deps.mapSceneBuilder.disposeVegetationPreviewMesh(scene)
    }
  }

  syncModuleState(scene: Scene | null): void {
    if (!scene || this.deps.store.getSnapshot().activeModuleId !== 'vegetation') {
      if (scene) {
        this.deps.mapSceneBuilder.disposeVegetationPreviewMesh(scene)
        this.brushPreview.hide()
      }
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'vegetation') {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const { vegetationTool } = this.deps.store.getSnapshot()

    if (vegetationTool === 'select') {
      const objectId = pickVegetationObjectId(scene, coords.x, coords.y)
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

    const hit = pickVegetationPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()

    if (vegetationTool === 'paint') {
      this.canvas.setPointerCapture(event.pointerId)
      this.deps.cameraController.getCamera().detachControl()
      this.canvas.classList.add('studio-shell__canvas--manipulating')
      this.painting = true
      this.lastPaintX = null
      this.lastPaintZ = null
      this.paintPlacedCount = 0
      this.paintAt(scene, hit.x, hit.z)
      return
    }

    const placed = this.deps.store.placeVegetation(hit.x, hit.z)
    if (placed) {
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, placed)
      this.deps.requestRender()
    }
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const snapshot = this.deps.store.getSnapshot()
    if (snapshot.activeModuleId !== 'vegetation') {
      return
    }

    const coords = this.canvasCoords(event)
    const hit = pickVegetationPlacementPoint(scene, coords.x, coords.y)

    if (this.painting && snapshot.vegetationTool === 'paint') {
      if (hit) {
        event.preventDefault()
        this.paintAt(scene, hit.x, hit.z)
      }
      return
    }

    if (
      snapshot.vegetationTool !== 'place' &&
      snapshot.vegetationTool !== 'paint'
    ) {
      this.brushPreview.hide()
      this.deps.mapSceneBuilder.disposeVegetationPreviewMesh(scene)
      this.deps.requestRender()
      return
    }

    if (!hit) {
      this.brushPreview.hide()
      this.deps.mapSceneBuilder.disposeVegetationPreviewMesh(scene)
      this.deps.requestRender()
      return
    }

    const map = this.deps.store.getMap()
    const surfaceY = this.deps.mapSceneBuilder.sampleVegetationGroundY(map, hit.x, hit.z)
    const definition = getVegetationTypeDefinition(snapshot.vegetationType)

    if (snapshot.vegetationTool === 'paint') {
      this.deps.mapSceneBuilder.disposeVegetationPreviewMesh(scene)
      this.brushPreview.update(
        scene,
        { x: hit.x, y: surfaceY, z: hit.z },
        definition.paintSpacing * 0.5,
      )
    } else {
      this.brushPreview.hide()
      this.deps.mapSceneBuilder.refreshVegetationPreviewMesh(
        scene,
        definition,
        hit.x,
        surfaceY,
        hit.z,
      )
    }
    this.deps.requestRender()
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.painting) {
      return
    }
    this.endPainting()
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
    if (this.paintPlacedCount > 0) {
      this.deps.store.log(
        'success',
        `Painted ${this.paintPlacedCount} vegetation instance(s)`,
      )
    }
    this.deps.requestRender()
  }

  private readonly onPointerLeave = (): void => {
    if (this.painting) {
      return
    }
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }
    this.brushPreview.hide()
    this.deps.mapSceneBuilder.disposeVegetationPreviewMesh(scene)
    this.deps.requestRender()
  }

  private paintAt(scene: Scene, worldX: number, worldZ: number): void {
    const snapshot = this.deps.store.getSnapshot()
    const definition = getVegetationTypeDefinition(snapshot.vegetationType)
    const spacing = definition.paintSpacing

    if (this.lastPaintX !== null && this.lastPaintZ !== null) {
      const dx = worldX - this.lastPaintX
      const dz = worldZ - this.lastPaintZ
      if (dx * dx + dz * dz < spacing * spacing) {
        return
      }
    }

    const placed = this.deps.store.placeVegetation(worldX, worldZ, { silent: true })
    if (!placed) {
      return
    }

    this.deps.mapSceneBuilder.upsertObjectMesh(scene, placed)
    this.lastPaintX = worldX
    this.lastPaintZ = worldZ
    this.paintPlacedCount += 1
    this.deps.requestRender()
  }

  private endPainting(): void {
    this.painting = false
    this.lastPaintX = null
    this.lastPaintZ = null
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
