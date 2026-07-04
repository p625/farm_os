import { TransformNode, type Camera, type Scene } from '@babylonjs/core'
import type { WorldMapDocument } from '@/types/world-map.ts'
import type { IDisposable } from '@/types/index.ts'
import { VEGETATION_CONFIG } from '@/config/rendering/vegetation/vegetation-config.ts'
import { resolveVegetationDensityMultiplier } from '@/config/rendering/vegetation/vegetation-density-config.ts'
import { VEGETATION_LOD_CONFIG } from '@/config/rendering/vegetation/vegetation-lod-config.ts'
import type { RenderingSystem } from '@/rendering/RenderingSystem.ts'
import { VegetationInstanceBuilder } from '@/rendering/vegetation/VegetationInstanceBuilder.ts'
import { VegetationLayerRegistry } from '@/rendering/vegetation/VegetationLayerRegistry.ts'
import { shouldCullShortGrassLayer } from '@/rendering/vegetation/VegetationLodPolicy.ts'
import { logVegetationDebugReport } from '@/rendering/vegetation/VegetationDebug.ts'
import { logEnvironmentDebugReport } from '@/rendering/environment/EnvironmentDebug.ts'
import { VegetationWindController } from '@/rendering/vegetation/VegetationWindController.ts'

export interface VegetationBuildOptions {
  worldMap?: WorldMapDocument | null
  camera?: Camera | null
}

export class VegetationSystem implements IDisposable {
  private readonly registry = new VegetationLayerRegistry()
  private readonly instanceBuilder = new VegetationInstanceBuilder()
  private readonly wind = new VegetationWindController()
  private root: TransformNode | null = null
  private built = false

  build(scene: Scene, options: VegetationBuildOptions = {}): void {
    if (!VEGETATION_CONFIG.enabled) {
      return
    }

    this.disposeContent()

    this.root = new TransformNode(VEGETATION_CONFIG.rootNodeName, scene)
    const densityMultiplier = resolveVegetationDensityMultiplier()
    const camera = options.camera ?? scene.activeCamera
    const instancesByLayer = this.instanceBuilder.buildAll(this.registry.getLayers().map((l) => l.definition), {
      worldMap: options.worldMap,
      densityMultiplier,
      camera,
    })

    for (const layer of this.registry.getLayers()) {
      const instances = instancesByLayer.get(layer.definition.id) ?? []
      layer.build(scene, this.root, instances)
    }

    this.wind.attach(scene, this.registry.getLayers())
    this.updateLodVisibility(camera)
    this.built = true
    logVegetationDebugReport(this.registry)
    const placement = this.instanceBuilder.getLastPlacementResult()
    if (placement) {
      logEnvironmentDebugReport(placement, this.registry)
    }
  }

  attachRenderingSystem(renderingSystem: RenderingSystem): void {
    if (this.built) {
      renderingSystem.refreshAfterSceneContent()
    }
  }

  update(camera: Camera | null): void {
    if (!this.built) {
      return
    }
    this.updateLodVisibility(camera)
  }

  getRegistry(): VegetationLayerRegistry {
    return this.registry
  }

  getTotalInstanceCount(): number {
    return this.registry.getTotalInstanceCount()
  }

  dispose(): void {
    this.wind.detach()
    this.disposeContent()
    this.built = false
  }

  private disposeContent(): void {
    this.registry.dispose()
    this.root?.dispose()
    this.root = null
  }

  private updateLodVisibility(camera: Camera | null): void {
    const shortGrass = this.registry.getLayer('short_grass')
    if (shortGrass) {
      const cull = shouldCullShortGrassLayer(camera, VEGETATION_LOD_CONFIG.shortGrassCullDistance)
      shortGrass.setEnabled(!cull && shortGrass.definition.enabled)
    }
  }
}
