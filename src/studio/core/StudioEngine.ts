import { Scene } from '@babylonjs/core'
import type { Engine } from '@babylonjs/core'
import type { StudioLayerId, WorldMapDocument } from '@/types/world-map.ts'
import { RenderingSystem } from '@/rendering/RenderingSystem.ts'
import { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import { StudioManipulator } from '@/studio/core/StudioManipulator.ts'
import { StudioSelection } from '@/studio/core/StudioSelection.ts'
import { StudioTerrainEditor } from '@/studio/core/StudioTerrainEditor.ts'
import { StudioTerrainPolygonEditor } from '@/studio/core/StudioTerrainPolygonEditor.ts'
import { StudioRoadEditor } from '@/studio/core/StudioRoadEditor.ts'
import { StudioParcelEditor } from '@/studio/core/StudioParcelEditor.ts'
import { StudioVegetationEditor } from '@/studio/core/StudioVegetationEditor.ts'
import { StudioBuildingEditor } from '@/studio/core/StudioBuildingEditor.ts'
import { StudioVehicleEditor } from '@/studio/core/StudioVehicleEditor.ts'
import { StudioAnchorEditor } from '@/studio/core/StudioAnchorEditor.ts'
import { StudioInteractiveEditor } from '@/studio/core/StudioInteractiveEditor.ts'
import { StudioWaterEditor } from '@/studio/core/StudioWaterEditor.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'
import {
  createWebGLEngine,
  scheduleCanvasWebGLRelease,
} from '@/rendering/webgl-bootstrap.ts'

export class StudioEngine {
  private engine: Engine | null = null
  private scene: Scene | null = null
  private disposed = false
  private readonly canvas: HTMLCanvasElement
  private readonly store: StudioStore
  private readonly mapSceneBuilder = new MapSceneBuilder()
  private readonly cameraController = new StudioCameraController()
  private readonly renderingSystem = new RenderingSystem()
  private readonly selection = new StudioSelection()
  private manipulator: StudioManipulator | null = null
  private terrainEditor: StudioTerrainEditor | null = null
  private terrainPolygonEditor: StudioTerrainPolygonEditor | null = null
  private roadEditor: StudioRoadEditor | null = null
  private parcelEditor: StudioParcelEditor | null = null
  private vegetationEditor: StudioVegetationEditor | null = null
  private buildingEditor: StudioBuildingEditor | null = null
  private vehicleEditor: StudioVehicleEditor | null = null
  private anchorEditor: StudioAnchorEditor | null = null
  private interactiveEditor: StudioInteractiveEditor | null = null
  private waterEditor: StudioWaterEditor | null = null

  constructor(canvas: HTMLCanvasElement, store: StudioStore) {
    this.canvas = canvas
    this.store = store
  }

  async start(): Promise<void> {
    if (this.disposed) {
      return
    }

    this.engine = await createWebGLEngine(this.canvas, {
      antialias: true,
      adaptToDeviceRatio: true,
    })
    if (this.disposed) {
      this.engine.dispose()
      this.engine = null
      return
    }

    this.scene = new Scene(this.engine)
    const camera = this.cameraController.initialize(this.scene, this.canvas)
    this.scene.activeCamera = camera
    this.renderingSystem.attach(this.scene, this.engine)
    this.renderingSystem.initialize({ shadows: false })

    this.rebuildScene(this.store.getMap())
    this.applyLayerVisibility(this.store.getSnapshot().layerVisibility)

    const editorDeps = {
      store: this.store,
      cameraController: this.cameraController,
      mapSceneBuilder: this.mapSceneBuilder,
      getScene: () => this.scene,
      requestRender: () => {
        this.scene?.render()
      },
      onCommit: () => this.syncAfterTerrainEdit(),
    }

    this.manipulator = new StudioManipulator(this.canvas, {
      ...editorDeps,
      selection: this.selection,
      onCommit: () => this.refreshMap(),
    })
    this.terrainEditor = new StudioTerrainEditor(this.canvas, editorDeps)
    this.terrainPolygonEditor = new StudioTerrainPolygonEditor(this.canvas, {
      ...editorDeps,
      onRefresh: () => this.refreshMap(),
    })
    this.roadEditor = new StudioRoadEditor(this.canvas, {
      ...editorDeps,
      onRefresh: () => this.refreshMap(),
    })
    this.parcelEditor = new StudioParcelEditor(this.canvas, {
      ...editorDeps,
      onRefresh: () => this.refreshMap(),
    })
    this.vegetationEditor = new StudioVegetationEditor(this.canvas, {
      ...editorDeps,
      onRefresh: () => this.refreshMap(),
    })
    this.buildingEditor = new StudioBuildingEditor(this.canvas, {
      ...editorDeps,
      onRefresh: () => this.refreshMap(),
    })
    this.vehicleEditor = new StudioVehicleEditor(this.canvas, {
      ...editorDeps,
      onRefresh: () => this.refreshMap(),
    })
    this.anchorEditor = new StudioAnchorEditor(this.canvas, {
      store: this.store,
      mapSceneBuilder: this.mapSceneBuilder,
      getScene: () => this.scene,
      requestRender: () => {
        this.scene?.render()
      },
      onRefresh: () => this.refreshMap(),
    })
    this.interactiveEditor = new StudioInteractiveEditor(this.canvas, {
      store: this.store,
      selection: this.selection,
      cameraController: this.cameraController,
      mapSceneBuilder: this.mapSceneBuilder,
      getScene: () => this.scene,
      onCommit: () => this.refreshMap(),
    })
    this.waterEditor = new StudioWaterEditor(this.canvas, {
      ...editorDeps,
      onRefresh: () => this.refreshMap(),
    })

    this.manipulator.attach()
    this.terrainEditor.attach()
    this.terrainPolygonEditor.attach()
    this.roadEditor.attach()
    this.parcelEditor.attach()
    this.vegetationEditor.attach()
    this.buildingEditor.attach()
    this.vehicleEditor.attach()
    this.anchorEditor.attach()
    this.interactiveEditor.attach()
    this.waterEditor.attach()
    this.syncModules()

    window.addEventListener('resize', this.onResize)

    this.engine.runRenderLoop(() => {
      if (this.disposed || !this.scene) {
        return
      }
      this.scene.render()
    })

    this.engine.resize()
  }

  loadMap(map: WorldMapDocument): void {
    this.rebuildScene(map)
    this.applyLayerVisibility(this.store.getSnapshot().layerVisibility)
    this.selection.clear()
    this.store.selectObject(null)
    this.syncModules()
  }

  refreshMap(): void {
    const selectedId = this.store.getSnapshot().selectedObject?.id ?? null
    this.rebuildScene(this.store.getMap())
    this.applyLayerVisibility(this.store.getSnapshot().layerVisibility)
    if (selectedId && this.scene) {
      this.selection.highlightByObjectId(this.scene, selectedId)
    } else {
      this.selection.clear()
    }
    this.syncModules()
  }

  syncModules(): void {
    this.manipulator?.syncSelection(this.scene)
    this.interactiveEditor?.syncSelection(this.scene)
    this.terrainEditor?.syncModuleState(this.scene)
    this.terrainPolygonEditor?.syncModuleState(this.scene)
    this.roadEditor?.syncModuleState(this.scene)
    this.parcelEditor?.syncModuleState(this.scene)
    this.vegetationEditor?.syncModuleState(this.scene)
    this.buildingEditor?.syncModuleState(this.scene)
    this.vehicleEditor?.syncModuleState(this.scene)
    this.waterEditor?.syncModuleState(this.scene)
    this.syncValidationOverlay()
  }

  private syncValidationOverlay(): void {
    if (!this.scene) {
      return
    }
    const snapshot = this.store.getSnapshot()
    if (snapshot.activeModuleId !== 'validation') {
      this.mapSceneBuilder.disposeValidationMarkers(this.scene)
      return
    }
    this.mapSceneBuilder.refreshValidationMarkers(
      this.scene,
      snapshot.validationReport,
      snapshot.validationFocusIssueId,
    )
    for (const mesh of this.scene.meshes) {
      if (mesh.name.startsWith('validation_')) {
        mesh.setEnabled(true)
      }
    }
    if (snapshot.validationFocusIssueId && snapshot.selectedObject?.id) {
      this.selection.highlightByObjectId(
        this.scene,
        snapshot.selectedObject.id,
      )
    }
  }

  deleteSelectedRoad(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'roads') {
      return false
    }
    const selection = this.store.getSnapshot().roadSelection
    if (!selection) {
      return false
    }
    if (!this.store.deleteRoad(selection.roadId)) {
      return false
    }
    this.refreshMap()
    return true
  }

  deleteSelectedParcel(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'parcels') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected || selected.layer !== 'fields') {
      return false
    }
    if (!this.store.deleteField(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  isPolygonDrawingActive(): boolean {
    return this.getActivePolygonEditor()?.isDrawing() ?? false
  }

  cancelActivePolygonDrawing(): void {
    this.getActivePolygonEditor()?.cancelDrawing()
    this.scene?.render()
  }

  finishActivePolygonDrawing(): boolean {
    if (!this.getActivePolygonEditor()?.finishDrawing()) {
      return false
    }
    this.refreshMap()
    return true
  }

  removeLastPolygonPoint(): boolean {
    if (!this.getActivePolygonEditor()?.removeLastPoint()) {
      return false
    }
    this.scene?.render()
    return true
  }

  deleteSelectedTerrainPolygon(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'terrain') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected || selected.kind !== 'terrain_polygon') {
      return false
    }
    if (!this.store.deleteTerrainPolygon(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  private getActivePolygonEditor():
    | StudioParcelEditor
    | StudioTerrainPolygonEditor
    | null {
    const snapshot = this.store.getSnapshot()
    if (snapshot.activeModuleId === 'parcels') {
      return this.parcelEditor
    }
    if (
      snapshot.activeModuleId === 'terrain' &&
      snapshot.terrainToolMode === 'polygon'
    ) {
      return this.terrainPolygonEditor
    }
    return null
  }

  deleteSelectedVegetation(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'vegetation') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected || selected.layer !== 'vegetation') {
      return false
    }
    if (!this.store.deleteVegetation(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  deleteSelectedBuilding(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'buildings') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected || selected.layer !== 'buildings') {
      return false
    }
    if (!this.store.deleteBuilding(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  deleteSelectedVehicle(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'vehicles') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected || selected.layer !== 'vehicles') {
      return false
    }
    if (!this.store.deleteVehicle(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  deleteSelectedWater(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'water') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected || selected.layer !== 'water') {
      return false
    }
    if (!this.store.deleteWater(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  deleteSelectedObject(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'transform') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected) {
      return false
    }
    if (!this.store.deleteGameplayObject(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  deleteSelectedGameplayObject(): boolean {
    const selected = this.store.getSnapshot().selectedObject
    if (!selected) {
      return false
    }
    if (!this.store.deleteGameplayObject(selected.id)) {
      return false
    }
    this.refreshMap()
    return true
  }

  duplicateSelectedObject(): boolean {
    const selected = this.store.getSnapshot().selectedObject
    if (!selected) {
      return false
    }
    const duplicated = this.store.duplicateObject(selected.id)
    if (!duplicated) {
      return false
    }
    this.refreshMap()
    return true
  }

  undo(): boolean {
    if (!this.store.undo()) {
      return false
    }
    this.refreshMap()
    return true
  }

  redo(): boolean {
    if (!this.store.redo()) {
      return false
    }
    this.refreshMap()
    return true
  }

  applyLayerVisibility(visibility: Record<StudioLayerId, boolean>): void {
    if (!this.scene) {
      return
    }
    for (const mesh of this.scene.meshes) {
      const metadata = getStudioMetadata(mesh)
      if (!metadata) {
        continue
      }
      mesh.setEnabled(visibility[metadata.layer] ?? true)
    }
  }

  dispose(): void {
    if (this.disposed) {
      return
    }
    this.disposed = true

    this.engine?.stopRenderLoop()
    this.manipulator?.detach()
    this.terrainEditor?.detach()
    this.terrainPolygonEditor?.detach()
    this.roadEditor?.detach()
    this.parcelEditor?.detach()
    this.vegetationEditor?.detach()
    this.buildingEditor?.detach()
    this.vehicleEditor?.detach()
    this.anchorEditor?.detach()
    this.interactiveEditor?.detach()
    this.waterEditor?.detach()
    this.manipulator = null
    this.terrainEditor = null
    this.terrainPolygonEditor = null
    this.roadEditor = null
    this.parcelEditor = null
    this.vegetationEditor = null
    this.buildingEditor = null
    this.vehicleEditor = null
    this.anchorEditor = null
    this.waterEditor = null

    window.removeEventListener('resize', this.onResize)

    this.selection.dispose()
    this.renderingSystem.dispose()
    this.cameraController.dispose()
    if (this.scene) {
      this.mapSceneBuilder.dispose(this.scene)
      this.scene.dispose()
    }
    this.engine?.dispose()
    scheduleCanvasWebGLRelease(this.canvas)
    this.scene = null
    this.engine = null
  }

  private syncAfterTerrainEdit(): void {
    if (!this.scene) {
      return
    }
    const map = this.store.getMap()
    this.mapSceneBuilder.refreshTerrainMesh(this.scene, map, { normals: false })
    this.scene.render()
    this.syncModules()
  }

  private rebuildScene(map: WorldMapDocument): void {
    if (!this.scene) {
      return
    }
    this.mapSceneBuilder.dispose(this.scene)
    this.mapSceneBuilder.build(this.scene, map, {
      renderGameplayAnchors: this.store.getSnapshot().gameplayDebugEnabled,
    })
    this.renderingSystem.refreshAfterSceneContent()
  }

  resize(): void {
    this.engine?.resize()
  }

  refreshMapScene(): void {
    this.rebuildScene(this.store.getMap())
    this.scene?.render()
    this.syncModules()
  }

  private readonly onResize = (): void => {
    this.resize()
  }
}
