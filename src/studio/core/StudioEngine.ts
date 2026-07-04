import { Engine, Scene } from '@babylonjs/core'
import type { StudioLayerId, WorldMapDocument } from '@/types/world-map.ts'
import { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import { StudioLighting } from '@/studio/core/StudioLighting.ts'
import { StudioManipulator } from '@/studio/core/StudioManipulator.ts'
import { StudioSelection } from '@/studio/core/StudioSelection.ts'
import { StudioTerrainEditor } from '@/studio/core/StudioTerrainEditor.ts'
import type { StudioStore } from '@/studio/core/StudioStore.ts'
import { getStudioMetadata } from '@/studio/io/MapSceneBuilder.ts'

export class StudioEngine {
  private engine: Engine | null = null
  private scene: Scene | null = null
  private disposed = false
  private readonly canvas: HTMLCanvasElement
  private readonly store: StudioStore
  private readonly mapSceneBuilder = new MapSceneBuilder()
  private readonly cameraController = new StudioCameraController()
  private readonly lighting = new StudioLighting()
  private readonly selection = new StudioSelection()
  private manipulator: StudioManipulator | null = null
  private terrainEditor: StudioTerrainEditor | null = null

  constructor(canvas: HTMLCanvasElement, store: StudioStore) {
    this.canvas = canvas
    this.store = store
  }

  async start(): Promise<void> {
    if (this.disposed) {
      return
    }

    this.engine = new Engine(this.canvas, true, {
      adaptToDeviceRatio: true,
    })
    this.scene = new Scene(this.engine)
    const camera = this.cameraController.initialize(this.scene, this.canvas)
    this.scene.activeCamera = camera
    this.lighting.initialize(this.scene)

    this.rebuildScene(this.store.getMap())
    this.applyLayerVisibility(this.store.getSnapshot().layerVisibility)

    const editorDeps = {
      store: this.store,
      cameraController: this.cameraController,
      mapSceneBuilder: this.mapSceneBuilder,
      getScene: () => this.scene,
      onCommit: () => this.syncAfterTerrainEdit(),
    }

    this.manipulator = new StudioManipulator(this.canvas, {
      ...editorDeps,
      selection: this.selection,
      onCommit: () => this.refreshMap(),
    })
    this.terrainEditor = new StudioTerrainEditor(this.canvas, editorDeps)

    this.manipulator.attach()
    this.terrainEditor.attach()
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
    this.terrainEditor?.syncModuleState(this.scene)
  }

  deleteSelectedObject(): boolean {
    if (this.store.getSnapshot().activeModuleId !== 'transform') {
      return false
    }
    const selected = this.store.getSnapshot().selectedObject
    if (!selected) {
      return false
    }
    if (!this.store.deleteObject(selected.id)) {
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
    this.manipulator = null
    this.terrainEditor = null

    window.removeEventListener('resize', this.onResize)

    this.selection.dispose()
    this.lighting.dispose()
    this.cameraController.dispose()
    if (this.scene) {
      this.mapSceneBuilder.dispose(this.scene)
      this.scene.dispose()
    }
    this.engine?.dispose()
    this.scene = null
    this.engine = null
  }

  private syncAfterTerrainEdit(): void {
    if (!this.scene) {
      return
    }
    const map = this.store.getMap()
    this.mapSceneBuilder.refreshTerrainMesh(this.scene, map)
    this.syncModules()
  }

  private rebuildScene(map: WorldMapDocument): void {
    if (!this.scene) {
      return
    }
    this.mapSceneBuilder.dispose(this.scene)
    this.mapSceneBuilder.build(this.scene, map)
  }

  resize(): void {
    this.engine?.resize()
  }

  private readonly onResize = (): void => {
    this.resize()
  }
}
