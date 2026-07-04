import { Engine, Scene } from '@babylonjs/core'
import type { StudioLayerId, WorldMapDocument } from '@/types/world-map.ts'
import { MapSceneBuilder } from '@/studio/io/MapSceneBuilder.ts'
import { StudioCameraController } from '@/studio/core/StudioCameraController.ts'
import { StudioLighting } from '@/studio/core/StudioLighting.ts'
import { StudioSelection } from '@/studio/core/StudioSelection.ts'
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
  private pointerDown: { x: number; y: number } | null = null

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

    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointerup', this.onPointerUp)
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

    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    this.canvas.removeEventListener('pointerup', this.onPointerUp)
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

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.pointerDown = { x: event.clientX, y: event.clientY }
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.scene || !this.pointerDown) {
      return
    }
    const dx = event.clientX - this.pointerDown.x
    const dy = event.clientY - this.pointerDown.y
    this.pointerDown = null
    if (Math.hypot(dx, dy) > 4) {
      return
    }

    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const picked = this.selection.pick(this.scene, x, y)
    this.store.selectObject(picked)
  }
}
