import type { Scene } from '@babylonjs/core'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import { pickAnchorObjectId } from '@/studio/anchor/AnchorPlacementPick.ts'
import { pickBuildingPlacementPoint } from '@/studio/building/BuildingPlacementPick.ts'

export interface StudioAnchorEditorDeps {
  store: StudioStore
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioAnchorEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioAnchorEditorDeps
  private attached = false

  constructor(canvas: HTMLCanvasElement, deps: StudioAnchorEditorDeps) {
    this.canvas = canvas
    this.deps = deps
  }

  attach(): void {
    if (this.attached) {
      return
    }
    this.attached = true
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
  }

  detach(): void {
    if (!this.attached) {
      return
    }
    this.attached = false
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
  }

  private isAnchorMode(): boolean {
    const snapshot = this.deps.store.getSnapshot()
    if (snapshot.activeModuleId === 'buildings' && snapshot.buildingTool === 'anchors') {
      return true
    }
    if (snapshot.activeModuleId === 'vehicles' && snapshot.vehicleTool === 'anchors') {
      return true
    }
    return false
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.isAnchorMode()) {
      return
    }
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }
    const coords = this.canvasCoords(event)
    const anchorId = pickAnchorObjectId(scene, coords.x, coords.y)
    if (anchorId) {
      const object = this.deps.store.findObject(anchorId)
      if (object) {
        this.deps.store.selectObject(object)
      }
      this.deps.requestRender()
      return
    }

    const hit = pickBuildingPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }
    event.preventDefault()
    const parentId =
      this.deps.store.getSnapshot().anchorParentId ??
      this.deps.store.getSnapshot().selectedObject?.id ??
      undefined
    const placed = this.deps.store.placeAnchor(hit.x, hit.z, parentId)
    if (placed) {
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, placed)
      this.deps.onRefresh()
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
