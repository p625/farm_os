import type { Scene } from '@babylonjs/core'
import type { AbstractMesh, Mesh } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import {
  findStudioMeshByObjectId,
  getStudioMetadata,
} from '@/studio/io/MapSceneBuilder.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import {
  applyTerrainBrush,
  brushRadiusWorldUnits,
  ensureTerrainHeightfield,
  mergeTerrainIntoDocument,
  type TerrainHeightfield,
} from '@/studio/terrain/TerrainHeightmap.ts'
import { TerrainBrushPreview } from '@/studio/terrain/TerrainBrushPreview.ts'
import { syncFieldObjectsFromTerrain } from '@/studio/terrain/TerrainFieldSync.ts'
import { terrainPreviewTint } from '@/studio/terrain/TerrainMeshSync.ts'

export interface StudioTerrainEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  onCommit: () => void
}

export class StudioTerrainEditor {
  private readonly canvas: HTMLCanvasElement
  private readonly deps: StudioTerrainEditorDeps
  private readonly brushPreview = new TerrainBrushPreview()
  private attached = false
  private painting = false
  private draftField: TerrainHeightfield | null = null
  private originX = 0
  private originZ = 0

  constructor(canvas: HTMLCanvasElement, deps: StudioTerrainEditorDeps) {
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
    this.brushPreview.dispose()
    this.endPainting()
  }

  syncModuleState(scene: Scene | null): void {
    const mesh = scene ? findStudioMeshByObjectId(scene, 'terrain_ground') : null
    const active = this.deps.store.getSnapshot().activeModuleId === 'terrain'
    if (mesh) {
      terrainPreviewTint(mesh as Mesh, active)
    }
    if (!active) {
      this.brushPreview.setVisible(scene, false)
    }
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return
    }
    if (this.deps.store.getSnapshot().activeModuleId !== 'terrain') {
      return
    }

    const scene = this.deps.getScene()
    if (!scene) {
      return
    }

    const ground = this.deps.store.findObject('terrain_ground')
    if (!ground) {
      return
    }

    const coords = this.canvasCoords(event)
    const hit = this.pickTerrainPoint(scene, coords.x, coords.y)
    if (!hit) {
      return
    }

    event.preventDefault()
    this.canvas.setPointerCapture(event.pointerId)
    this.deps.cameraController.getCamera().detachControl()
    this.canvas.classList.add('studio-shell__canvas--manipulating')

    this.originX = ground.transform.position.x
    this.originZ = ground.transform.position.z
    this.draftField = ensureTerrainHeightfield(this.deps.store.getMap().terrain)
    this.painting = true
    this.paintAt(scene, hit.x, hit.z)
  }

  private pickTerrainPoint(
    scene: Scene,
    canvasX: number,
    canvasY: number,
  ): import('@babylonjs/core').Vector3 | null {
    const pick = scene.pick(canvasX, canvasY, (mesh) => {
      const metadata = getStudioMetadata(mesh as AbstractMesh)
      return metadata?.objectId === 'terrain_ground'
    })
    return pick?.pickedPoint ?? null
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const scene = this.deps.getScene()
    if (!scene || this.deps.store.getSnapshot().activeModuleId !== 'terrain') {
      this.brushPreview.setVisible(scene, false)
      return
    }

    const coords = this.canvasCoords(event)
    const hit = this.pickTerrainPoint(scene, coords.x, coords.y)
    if (!hit) {
      this.brushPreview.setVisible(scene, false)
      return
    }

    const brush = this.deps.store.getSnapshot().terrainBrush
    const terrainField = this.draftField ?? ensureTerrainHeightfield(this.deps.store.getMap().terrain)
    const worldRadius = brushRadiusWorldUnits(terrainField, brush.radius)
    this.brushPreview.update(scene, hit, worldRadius, brush)
    this.brushPreview.setVisible(scene, true)

    if (!this.painting) {
      return
    }

    event.preventDefault()
    this.paintAt(scene, hit.x, hit.z)
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.painting) {
      return
    }

    this.commitDraft()
    this.endPainting()

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
  }

  private readonly onPointerLeave = (): void => {
    this.brushPreview.setVisible(this.deps.getScene(), false)
  }

  private paintAt(scene: Scene, worldX: number, worldZ: number): void {
    if (!this.draftField) {
      return
    }

    const brush = this.deps.store.getSnapshot().terrainBrush
    applyTerrainBrush(
      this.draftField,
      this.originX,
      this.originZ,
      worldX,
      worldZ,
      brush,
    )

    const draftMap = {
      ...this.deps.store.getMap(),
      terrain: mergeTerrainIntoDocument(this.deps.store.getMap().terrain, this.draftField),
      objects: syncFieldObjectsFromTerrain({
        ...this.deps.store.getMap(),
        terrain: mergeTerrainIntoDocument(this.deps.store.getMap().terrain, this.draftField),
      }),
    }
    this.deps.mapSceneBuilder.refreshTerrainMesh(scene, draftMap)
    this.deps.mapSceneBuilder.refreshFieldMeshes(scene, draftMap)
  }

  private commitDraft(): void {
    if (!this.draftField) {
      return
    }

    this.deps.store.setTerrainField(this.draftField)
    this.deps.onCommit()
    this.deps.store.log('info', 'Terrain updated')
  }

  private endPainting(): void {
    this.painting = false
    this.draftField = null
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
