import type { AbstractMesh, Scene } from '@babylonjs/core'
import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { FarmEnvironment } from '@rendering/FarmEnvironment.ts'
import type { MapObject, StudioLayerId, WorldMapDocument } from '@/types/world-map.ts'

export const STUDIO_METADATA_KEY = 'farmosStudio'

export interface StudioMeshMetadata {
  objectId: string
  layer: StudioLayerId
  kind: string
  mapObject: MapObject
}

const LAYER_COLORS: Record<StudioLayerId, Color3> = {
  terrain: new Color3(0.26, 0.46, 0.18),
  roads: new Color3(0.45, 0.4, 0.32),
  fields: new Color3(0.42, 0.28, 0.16),
  vegetation: new Color3(0.2, 0.5, 0.22),
  buildings: new Color3(0.58, 0.48, 0.34),
  water: new Color3(0.2, 0.35, 0.55),
  poi: new Color3(0.85, 0.75, 0.2),
  debug: new Color3(0.9, 0.2, 0.9),
}

export class MapSceneBuilder {
  private readonly environment = new FarmEnvironment()
  private rootNode: TransformNode | null = null

  build(scene: Scene, map: WorldMapDocument): TransformNode {
    this.dispose(scene)
    this.environment.apply(scene)

    const root = new TransformNode('studio_map_root', scene)
    this.rootNode = root

    for (const object of map.objects) {
      this.createObjectMesh(scene, root, object)
    }

    return root
  }

  dispose(scene: Scene): void {
    if (this.rootNode) {
      this.rootNode.dispose(false, true)
      this.rootNode = null
    }
    const orphan = scene.getTransformNodeByName('studio_map_root')
    orphan?.dispose(false, true)
  }

  private createObjectMesh(
    scene: Scene,
    root: TransformNode,
    object: MapObject,
  ): void {
    const shape = object.shape ?? {
      type: 'box' as const,
      width: 1,
      height: 1,
      depth: 1,
    }

    if (shape.type !== 'box') {
      return
    }

    const mesh =
      object.layer === 'terrain'
        ? MeshBuilder.CreateGround(
            `studio_${object.id}`,
            { width: shape.width, height: shape.depth },
            scene,
          )
        : MeshBuilder.CreateBox(
            `studio_${object.id}`,
            {
              width: shape.width,
              height: shape.height,
              depth: shape.depth,
            },
            scene,
          )

    mesh.parent = root
    mesh.position = new Vector3(
      object.transform.position.x,
      object.transform.position.y,
      object.transform.position.z,
    )
    if (object.transform.rotationY !== undefined) {
      mesh.rotation.y = object.transform.rotationY
    }
    if (object.transform.scale) {
      mesh.scaling = new Vector3(
        object.transform.scale.x,
        object.transform.scale.y,
        object.transform.scale.z,
      )
    }

    const material = new StandardMaterial(`mat_${object.id}`, scene)
    const base = LAYER_COLORS[object.layer].clone()
    material.diffuseColor = base
    material.specularColor = base.scale(0.15)
    if (object.layer === 'poi' || object.layer === 'debug') {
      material.emissiveColor = base.scale(0.25)
    }
    mesh.material = material
    mesh.receiveShadows = object.layer === 'terrain' || object.layer === 'fields'

    const metadata: StudioMeshMetadata = {
      objectId: object.id,
      layer: object.layer,
      kind: object.kind,
      mapObject: object,
    }
    mesh.metadata = { [STUDIO_METADATA_KEY]: metadata }
  }
}

export function getStudioMetadata(mesh: AbstractMesh): StudioMeshMetadata | null {
  const raw = mesh.metadata?.[STUDIO_METADATA_KEY] as
    | StudioMeshMetadata
    | undefined
  return raw ?? null
}
