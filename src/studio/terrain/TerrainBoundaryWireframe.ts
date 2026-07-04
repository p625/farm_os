import {
  Color3,
  MeshBuilder,
  TransformNode,
  Vector3,
  type Scene,
} from '@babylonjs/core'
import type { MapObject } from '@/types/world-map.ts'
import { isMapPolygonShape } from '@/types/world-map.ts'
import { TERRAIN_POLYGON_KIND } from '@/types/terrain-polygon.ts'
import { listTerrainBoundaryObjects } from '@/studio/terrain/TerrainBoundarySync.ts'

const BOUNDARY_WIREFRAME_ROOT = 'terrain_boundary_wireframe_root'
const BOUNDARY_COLOR = new Color3(0.95, 0.82, 0.25)

export class TerrainBoundaryWireframeRenderer {
  private root: TransformNode | null = null
  private readonly edgeMeshes = new Map<string, import('@babylonjs/core').LinesMesh>()

  dispose(scene: Scene): void {
    for (const mesh of this.edgeMeshes.values()) {
      mesh.dispose(false, true)
    }
    this.edgeMeshes.clear()
    const orphan = scene.getTransformNodeByName(BOUNDARY_WIREFRAME_ROOT)
    orphan?.dispose()
    this.root = null
  }

  refresh(scene: Scene, map: import('@/types/world-map.ts').WorldMapDocument, visible: boolean): void {
    if (!visible) {
      this.dispose(scene)
      return
    }

    let root =
      this.root ??
      (scene.getTransformNodeByName(BOUNDARY_WIREFRAME_ROOT) as TransformNode | null)
    if (!root) {
      const studioRoot = scene.getTransformNodeByName('studio_map_root')
      if (!studioRoot) {
        return
      }
      root = new TransformNode(BOUNDARY_WIREFRAME_ROOT, scene)
      root.parent = studioRoot
    }
    this.root = root

    const wanted = new Set<string>()
    for (const object of listTerrainBoundaryObjects(map)) {
      if (object.kind !== TERRAIN_POLYGON_KIND) {
        continue
      }
      wanted.add(object.id)
      this.updateBoundaryMesh(scene, object)
    }

    for (const [objectId, mesh] of this.edgeMeshes) {
      if (!wanted.has(objectId)) {
        mesh.dispose(false, true)
        this.edgeMeshes.delete(objectId)
      }
    }
  }

  private updateBoundaryMesh(scene: Scene, object: MapObject): void {
    const shape = object.shape
    if (!shape || !isMapPolygonShape(shape) || shape.points.length < 2) {
      return
    }

    const y = object.transform.position.y + 0.08
    const linePoints = shape.points.map(
      (point) => new Vector3(point.x, y, point.z),
    )
    linePoints.push(linePoints[0].clone())

    let mesh = this.edgeMeshes.get(object.id)
    if (!mesh || mesh.isDisposed()) {
      mesh = MeshBuilder.CreateLines(
        `terrain_boundary_wire_${object.id}`,
        { points: linePoints, updatable: true },
        scene,
      )
      mesh.parent = this.root
      mesh.isPickable = false
      mesh.renderingGroupId = 3
      mesh.color = BOUNDARY_COLOR
      this.edgeMeshes.set(object.id, mesh)
    } else {
      MeshBuilder.CreateLines(
        `terrain_boundary_wire_${object.id}`,
        { points: linePoints, instance: mesh },
        scene,
      )
    }

    mesh.setEnabled(true)
  }
}
