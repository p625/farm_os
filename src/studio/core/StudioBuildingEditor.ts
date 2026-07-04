import type { Scene } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  pickBuildingObjectId,
  pickBuildingPlacementPoint,
} from '@/studio/building/BuildingPlacementPick.ts'
import { getBuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'

export interface StudioBuildingEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioBuildingEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioBuildingEditorDeps
  private attached = false

  constructor(canvas: HTMLCanvasElement, deps: StudioBuildingEditorDeps) {
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
    this.canvas.addEventListener('pointerleave', this.onPointerLeave)
  }

  detach(): void {
    if (!this.attached) {
      return
    }
    this.attached = false
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave)
    const scene = this.deps.getScene()
    if (scene) {
      this.deps.mapSceneBuilder.disposeBuildingPreviewMesh(scene)
    }
  }

  syncModuleState(scene: Scene | null): void {
    if (!scene || this.deps.store.getSnapshot().activeModuleId !== 'buildings') {
      if (scene) {
        this.deps.mapSceneBuilder.disposeBuildingPreviewMesh(scene)
      }
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'buildings') {
      return
    }
    if (this.deps.store.getSnapshot().buildingTool === 'anchors') {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const coords = this.canvasCoords(event)
    const { buildingTool } = this.deps.store.getSnapshot()

    if (buildingTool === 'select') {
      const objectId = pickBuildingObjectId(scene, coords.x, coords.y)
      if (!objectId) {
        this.deps.store.selectObject(null)
        this.deps.requestRender()
        return
      }
      const object = this.deps.store.findObject(objectId)
      if (object) {
        this.deps.store.selectObject(object)
        if (object.layer === 'buildings') {
          this.deps.store.setAnchorParentId(object.id)
        }
      }
      this.deps.requestRender()
      return
    }

    const hit = pickBuildingPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()
    const placed = this.deps.store.placeBuilding(hit.x, hit.z)
    if (placed) {
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, placed)
      for (const object of this.deps.store.getMap().objects) {
        if (
          object.layer === 'poi' &&
          object.kind === 'anchor' &&
          object.properties?.parentObjectId === placed.id
        ) {
          this.deps.mapSceneBuilder.upsertObjectMesh(scene, object)
        }
      }
      this.deps.requestRender()
    }
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const snapshot = this.deps.store.getSnapshot()
    if (snapshot.activeModuleId !== 'buildings' || snapshot.buildingTool !== 'place') {
      return
    }

    const coords = this.canvasCoords(event)
    const hit = pickBuildingPlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      this.deps.mapSceneBuilder.disposeBuildingPreviewMesh(scene)
      this.deps.requestRender()
      return
    }

    const map = this.deps.store.getMap()
    const surfaceY = this.deps.mapSceneBuilder.sampleBuildingGroundY(map, hit.x, hit.z)
    const definition = getBuildingTypeDefinition(snapshot.buildingType)
    this.deps.mapSceneBuilder.refreshBuildingPreviewMesh(
      scene,
      definition,
      hit.x,
      surfaceY,
      hit.z,
      snapshot.buildingRotationY,
    )
    this.deps.requestRender()
  }

  private readonly onPointerLeave = (): void => {
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }
    this.deps.mapSceneBuilder.disposeBuildingPreviewMesh(scene)
    this.deps.requestRender()
  }

  private canvasCoords(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }
}
