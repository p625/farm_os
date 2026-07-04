import type { Scene } from '@babylonjs/core'
import type { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import type { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { PolygonEditor } from '@/studio/polygon/PolygonEditor.ts'
import { TerrainPolygonAdapter } from '@/studio/polygon/adapters/TerrainPolygonAdapter.ts'

export interface StudioTerrainPolygonEditorDeps {
  store: StudioStore
  cameraController: StudioCameraController
  mapSceneBuilder: MapSceneBuilder
  getScene: () => Scene | null
  requestRender: () => void
  onRefresh: () => void
}

export class StudioTerrainPolygonEditor {
  private readonly deps: StudioTerrainPolygonEditorDeps
  private readonly editor: PolygonEditor

  constructor(canvas: HTMLCanvasElement, deps: StudioTerrainPolygonEditorDeps) {
    this.deps = deps
    this.editor = new PolygonEditor(canvas, {
      adapter: new TerrainPolygonAdapter(deps.store),
      cameraController: deps.cameraController,
      mapSceneBuilder: deps.mapSceneBuilder,
      getScene: deps.getScene,
      requestRender: deps.requestRender,
      onRefresh: deps.onRefresh,
      onDrawingPointsChanged: (count) => {
        deps.store.setPolygonDrawPointCount(count)
      },
    })
  }

  attach(): void {
    this.editor.attach()
  }

  detach(): void {
    this.editor.detach()
  }

  syncModuleState(scene: Scene | null): void {
    const snapshot = this.deps.store.getSnapshot()
    const active =
      snapshot.activeModuleId === 'terrain' &&
      snapshot.terrainToolMode === 'polygon'
    this.editor.syncModuleState(scene, active)
  }

  cancelDrawing(): void {
    this.editor.cancelDrawing()
  }

  finishDrawing(): boolean {
    return this.editor.finishDrawing()
  }

  removeLastPoint(): boolean {
    return this.editor.removeLastPoint()
  }

  isDrawing(): boolean {
    return this.editor.isDrawing()
  }
}
