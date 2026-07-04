import {
  ShadowGenerator,
  type AbstractMesh,
  type DirectionalLight,
  type Scene,
} from '@babylonjs/core'
import { SHADOW_RENDERING_CONFIG } from '@/config/rendering/shadow-config.ts'
import {
  RENDERING_QUALITY_CONFIG,
  resolveShadowMapSize,
} from '@/config/rendering/rendering-quality-config.ts'
import { isTerrainMesh } from '@/rendering/resolveTerrainMesh.ts'

export class ShadowManager {
  private shadowGenerator: ShadowGenerator | null = null
  private enabled = SHADOW_RENDERING_CONFIG.enabled

  createGenerator(light: DirectionalLight, enableShadows = true): ShadowGenerator | null {
    this.enabled = enableShadows && SHADOW_RENDERING_CONFIG.enabled
    this.dispose()

    if (!this.enabled) {
      return null
    }

    const mapSize = Math.max(
      SHADOW_RENDERING_CONFIG.mapSize,
      resolveShadowMapSize(RENDERING_QUALITY_CONFIG.preset),
    )

    const generator = new ShadowGenerator(mapSize, light)
    const config = SHADOW_RENDERING_CONFIG

    generator.useBlurExponentialShadowMap = config.useBlurExponentialShadowMap
    generator.blurKernel = config.blurKernel
    generator.darkness = config.darkness
    generator.transparencyShadow = config.transparencyShadow

    if (config.cascade.enabled) {
      // Architectural placeholder — cascade splits arrive with Milestone 2 lighting pass.
      generator.useContactHardeningShadow = false
    }

    this.shadowGenerator = generator
    return generator
  }

  applyToScene(scene: Scene): void {
    if (!this.shadowGenerator) {
      return
    }

    for (const mesh of scene.meshes) {
      if (this.shouldCastShadow(mesh)) {
        this.shadowGenerator.addShadowCaster(mesh, true)
      }
      if (this.shouldReceiveShadow(mesh)) {
        mesh.receiveShadows = true
      }
    }
  }

  refreshCasters(scene: Scene): void {
    this.applyToScene(scene)
  }

  getGenerator(): ShadowGenerator | null {
    return this.shadowGenerator
  }

  dispose(): void {
    this.shadowGenerator?.dispose()
    this.shadowGenerator = null
  }

  private shouldCastShadow(mesh: AbstractMesh): boolean {
    if (mesh.name.startsWith('decor_') || mesh.name.startsWith('field_label_')) {
      return false
    }
    if (mesh.name.startsWith('field_growth_') || mesh.name.startsWith('field_outline_')) {
      return false
    }
    if (mesh.metadata && (mesh.metadata as { decor?: boolean }).decor) {
      return false
    }

    return (
      isTerrainMesh(mesh) ||
      mesh.name.startsWith('studio_terrain_ground') ||
      mesh.name.startsWith('farmos_veg_src_scattered_tree') ||
      mesh.name.startsWith('farmos_veg_src_tree_line') ||
      mesh.name.startsWith('farmos_veg_src_shrub') ||
      mesh.name.startsWith('farmos_veg_src_hedgerow') ||
      mesh.name.startsWith('farmos_veg_src_forest_edge') ||
      mesh.name.startsWith('field_') ||
      mesh.name.startsWith('barn') ||
      mesh.name.startsWith('tractor') ||
      mesh.name === 'farmyard'
    )
  }

  private shouldReceiveShadow(mesh: AbstractMesh): boolean {
    return this.shouldCastShadow(mesh)
  }
}
