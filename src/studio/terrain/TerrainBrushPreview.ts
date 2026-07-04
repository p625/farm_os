import {
  Color3,
  Material,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  type Scene,
  type Vector3,
} from '@babylonjs/core'
import type { TerrainBrushSettings } from '@/studio/terrain/TerrainHeightmap.ts'
import { getTerrainSurfaceColor } from '@/studio/terrain/TerrainSurfacePalette.ts'

export class TerrainBrushPreview {
  private disc: Mesh | null = null
  private ring: Mesh | null = null

  dispose(): void {
    this.disc?.dispose(false, true)
    this.ring?.dispose(false, true)
    this.disc = null
    this.ring = null
  }

  setVisible(scene: Scene | null, visible: boolean): void {
    if (!scene) {
      return
    }
    this.ensureMeshes(scene)
    if (this.disc) {
      this.disc.setEnabled(visible)
    }
    if (this.ring) {
      this.ring.setEnabled(visible)
    }
  }

  update(
    scene: Scene,
    center: Vector3,
    worldRadius: number,
    brush: TerrainBrushSettings,
  ): void {
    this.ensureMeshes(scene)
    if (!this.disc || !this.ring) {
      return
    }

    const y = center.y + 0.06
    this.disc.position.set(center.x, y, center.z)
    this.ring.position.set(center.x, y + 0.001, center.z)

    const scale = Math.max(0.05, worldRadius)
    this.disc.scaling.set(scale, scale, scale)
    this.ring.scaling.set(scale, scale, scale)

    const discMaterial = this.disc.material as StandardMaterial
    const ringMaterial = this.ring.material as StandardMaterial

    if (brush.mode === 'paint') {
      const [r, g, b] = getTerrainSurfaceColor(brush.surfaceId)
      discMaterial.diffuseColor = new Color3(r, g, b)
      discMaterial.emissiveColor = new Color3(r * 0.35, g * 0.35, b * 0.35)
      ringMaterial.diffuseColor = new Color3(r, g, b)
    } else {
      const color =
        brush.mode === 'raise'
          ? new Color3(0.35, 0.85, 0.4)
          : brush.mode === 'lower'
            ? new Color3(0.85, 0.45, 0.3)
            : new Color3(0.45, 0.65, 0.95)
      discMaterial.diffuseColor = color
      discMaterial.emissiveColor = color.scale(0.25)
      ringMaterial.diffuseColor = color
    }
  }

  private ensureMeshes(scene: Scene): void {
    if (!this.disc || this.disc.isDisposed()) {
      this.disc = MeshBuilder.CreateDisc(
        'studio_terrain_brush_fill',
        { radius: 1, tessellation: 48, sideOrientation: Mesh.DOUBLESIDE },
        scene,
      )
      this.disc.rotation.x = Math.PI * 0.5
      this.disc.isPickable = false
      this.disc.renderingGroupId = 2
      this.disc.material = this.createFillMaterial(scene)
    }

    if (!this.ring || this.ring.isDisposed()) {
      this.ring = MeshBuilder.CreateTorus(
        'studio_terrain_brush_ring',
        { diameter: 2, thickness: 0.04, tessellation: 48 },
        scene,
      )
      this.ring.rotation.x = Math.PI * 0.5
      this.ring.isPickable = false
      this.ring.renderingGroupId = 2
      this.ring.material = this.createRingMaterial(scene)
    }
  }

  private createFillMaterial(scene: Scene): StandardMaterial {
    const material = new StandardMaterial('studio_terrain_brush_fill_mat', scene)
    material.diffuseColor = new Color3(0.35, 0.85, 0.4)
    material.emissiveColor = new Color3(0.08, 0.2, 0.1)
    material.alpha = 0.28
    material.transparencyMode = Material.MATERIAL_ALPHABLEND
    material.backFaceCulling = false
    material.disableLighting = true
    return material
  }

  private createRingMaterial(scene: Scene): StandardMaterial {
    const material = new StandardMaterial('studio_terrain_brush_ring_mat', scene)
    material.diffuseColor = new Color3(0.95, 0.95, 0.4)
    material.emissiveColor = new Color3(0.25, 0.25, 0.08)
    material.alpha = 0.85
    material.transparencyMode = Material.MATERIAL_ALPHABLEND
    material.wireframe = false
    material.disableLighting = true
    return material
  }
}
