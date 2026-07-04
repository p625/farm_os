import type { Scene } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  pickVehiclePlacementPoint,
} from '@/studio/vehicle/VehiclePlacementPick.ts'
import { getVehicleTypeDefinition } from '@/studio/vehicle/VehicleTypePalette.ts'
import { getBuildingTypeDefinition } from '@/studio/building/BuildingTypePalette.ts'

export interface StudioVehicleEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioVehicleEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioVehicleEditorDeps
  private attached = false

  constructor(canvas: HTMLCanvasElement, deps: StudioVehicleEditorDeps) {
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
  }

  syncModuleState(_scene: Scene | null): void {
    // Vehicle preview uses building preview mesh slot — disposed on leave.
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'vehicles') {
      return
    }
    if (this.deps.store.getSnapshot().vehicleTool === 'anchors') {
      return
    }
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }
    const coords = this.canvasCoords(event)
    const { vehicleTool } = this.deps.store.getSnapshot()

    if (vehicleTool === 'select') {
      return
    }

    const hit = pickVehiclePlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }
    event.preventDefault()
    const placed = this.deps.store.placeVehicle(hit.x, hit.z)
    if (placed) {
      for (const object of this.deps.store.getMap().objects) {
        if (object.layer === 'poi' && object.properties?.parentObjectId === placed.id) {
          this.deps.mapSceneBuilder.upsertObjectMesh(scene, object)
        }
      }
      this.deps.mapSceneBuilder.upsertObjectMesh(scene, placed)
      this.deps.onRefresh()
    }
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const scene = this.deps.getScene()
    if (!scene) {
      return
    }
    const snapshot = this.deps.store.getSnapshot()
    if (snapshot.activeModuleId !== 'vehicles' || snapshot.vehicleTool !== 'place') {
      return
    }
    const coords = this.canvasCoords(event)
    const hit = pickVehiclePlacementPoint(scene, coords.x, coords.y)
    if (!hit) {
      this.deps.mapSceneBuilder.disposeBuildingPreviewMesh(scene)
      this.deps.requestRender()
      return
    }
    const map = this.deps.store.getMap()
    const surfaceY = this.deps.mapSceneBuilder.sampleBuildingGroundY(map, hit.x, hit.z)
    const vehicleDef = getVehicleTypeDefinition(snapshot.vehicleType)
    const previewShape = getBuildingTypeDefinition('farm_shed')
    this.deps.mapSceneBuilder.refreshBuildingPreviewMesh(
      scene,
      {
        ...previewShape,
        label: vehicleDef.label,
        width: vehicleDef.width,
        depth: vehicleDef.depth,
        wallHeight: vehicleDef.height * 0.7,
        roofHeight: vehicleDef.height * 0.3,
        wallColor: vehicleDef.color,
        roofColor: vehicleDef.color,
      },
      hit.x,
      surfaceY,
      hit.z,
      snapshot.vehicleRotationY,
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
