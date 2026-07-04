import {
  Color3,
  LinesMesh,
  Material,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  type Scene,
} from '@babylonjs/core'
import type { TerrainBrushSettings } from '@/studio/terrain/TerrainHeightmap.ts'
import { getTerrainSurfaceColor } from '@/studio/terrain/TerrainSurfacePalette.ts'

const CIRCLE_SEGMENTS = 64

function buildCirclePoints(): Vector3[] {
  const points: Vector3[] = []
  for (let i = 0; i <= CIRCLE_SEGMENTS; i++) {
    const angle = (i / CIRCLE_SEGMENTS) * Math.PI * 2
    points.push(new Vector3(Math.cos(angle), 0, Math.sin(angle)))
  }
  return points
}

export class TerrainBrushPreview {
  private ring: LinesMesh | null = null
  private readonly circlePoints = buildCirclePoints()

  dispose(): void {
    this.ring?.dispose(false, true)
    this.ring = null
  }

  setVisible(scene: Scene | null, visible: boolean): void {
    if (!scene) {
      return
    }
    this.ensureMesh(scene)
    this.ring?.setEnabled(visible)
  }

  update(
    scene: Scene,
    center: Vector3,
    worldRadius: number,
    brush: TerrainBrushSettings,
  ): void {
    this.ensureMesh(scene)
    if (!this.ring) {
      return
    }

    const y = center.y + 0.05
    this.ring.position.set(center.x, y, center.z)

    const scale = Math.max(0.05, worldRadius)
    this.ring.scaling.set(scale, scale, scale)

    const lineColor = this.ring.color
    if (brush.mode === 'paint') {
      const [r, g, b] = getTerrainSurfaceColor(brush.surfaceId)
      lineColor.set(r, g, b)
    } else {
      const color =
        brush.mode === 'raise'
          ? new Color3(0.35, 0.85, 0.4)
          : brush.mode === 'lower'
            ? new Color3(0.85, 0.45, 0.3)
            : new Color3(0.45, 0.65, 0.95)
      lineColor.copyFrom(color)
    }
  }

  private ensureMesh(scene: Scene): void {
    if (this.ring && !this.ring.isDisposed()) {
      return
    }

    this.ring = MeshBuilder.CreateLines(
      'studio_terrain_brush_ring',
      { points: this.circlePoints },
      scene,
    )
    this.ring.isPickable = false
    this.ring.renderingGroupId = 2
    this.ring.color = new Color3(0.95, 0.95, 0.35)

    const material = new StandardMaterial('studio_terrain_brush_ring_mat', scene)
    material.emissiveColor = new Color3(0.95, 0.95, 0.35)
    material.disableLighting = true
    material.alpha = 0.9
    material.transparencyMode = Material.MATERIAL_ALPHABLEND
    this.ring.material = material
  }
}
