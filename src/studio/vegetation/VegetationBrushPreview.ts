import type { Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  type Mesh,
} from '@babylonjs/core'

export class VegetationBrushPreview {
  private mesh: Mesh | null = null

  dispose(): void {
    this.mesh?.dispose(false, true)
    this.mesh = null
  }

  update(
    scene: Scene,
    position: { x: number; y: number; z: number } | null,
    radius: number,
  ): void {
    if (!position || radius <= 0) {
      this.dispose()
      return
    }

    if (!this.mesh || this.mesh.isDisposed()) {
      this.mesh = MeshBuilder.CreateDisc(
        'vegetation_brush_preview',
        { radius: 1, tessellation: 28 },
        scene,
      )
      this.mesh.rotation.x = Math.PI * 0.5
      this.mesh.isPickable = false
      this.mesh.renderingGroupId = 3
      const material = new StandardMaterial('vegetation_brush_preview_mat', scene)
      material.diffuseColor = new Color3(0.45, 0.82, 0.48)
      material.emissiveColor = new Color3(0.12, 0.22, 0.1)
      material.disableLighting = true
      material.alpha = 0.75
      this.mesh.material = material
    }

    this.mesh.position = new Vector3(position.x, position.y + 0.06, position.z)
    this.mesh.scaling = new Vector3(radius, radius, radius)
  }

  hide(): void {
    this.dispose()
  }
}
