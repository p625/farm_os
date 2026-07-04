import type { Mesh, Scene } from '@babylonjs/core'
import { Color3, MeshBuilder, StandardMaterial, TransformNode } from '@babylonjs/core'
import type { SceneAnchorKind } from '@/types/scene-anchor.ts'
import { STUDIO_METADATA_KEY, type StudioMeshMetadata } from '@/studio/io/MapSceneBuilder.ts'
import type { MapObject } from '@/types/world-map.ts'
import { parseSceneAnchorProperties } from '@/types/scene-anchor.ts'

const ANCHOR_COLORS: Record<SceneAnchorKind, Color3> = {
  entry: new Color3(0.2, 0.75, 0.35),
  exit: new Color3(0.85, 0.35, 0.2),
  parking: new Color3(0.25, 0.45, 0.9),
  loading: new Color3(0.9, 0.75, 0.15),
  unload: new Color3(0.95, 0.55, 0.1),
  service: new Color3(0.55, 0.35, 0.85),
  interaction: new Color3(0.2, 0.8, 0.85),
  spawn: new Color3(0.95, 0.2, 0.25),
  trigger: new Color3(0.9, 0.2, 0.9),
}

export function createAnchorGizmoMesh(
  scene: Scene,
  object: MapObject,
  root: TransformNode,
): Mesh | null {
  const props = parseSceneAnchorProperties(object.properties)
  if (!props) {
    return null
  }

  const color = ANCHOR_COLORS[props.anchorKind]
  const meshName = `studio_${object.id}`

  const base =
    props.anchorKind === 'spawn' || props.anchorKind === 'parking'
      ? MeshBuilder.CreateCylinder(
          meshName,
          { height: 0.6, diameter: 1.2, tessellation: 12 },
          scene,
        )
      : MeshBuilder.CreateBox(meshName, { width: 0.8, height: 1.2, depth: 0.8 }, scene)

  base.parent = root
  base.position.x = object.transform.position.x
  base.position.y = object.transform.position.y + 0.35
  base.position.z = object.transform.position.z
  if (object.transform.rotationY !== undefined) {
    base.rotation.y = object.transform.rotationY
  }

  const material = new StandardMaterial(`mat_${object.id}`, scene)
  material.diffuseColor = color
  material.emissiveColor = color.scale(0.45)
  material.alpha = 0.92
  base.material = material
  base.isPickable = true

  const metadata: StudioMeshMetadata = {
    objectId: object.id,
    layer: 'poi',
    kind: 'anchor',
    mapObject: object,
  }
  base.metadata = { [STUDIO_METADATA_KEY]: metadata }
  return base
}

export function anchorKindLabel(kind: SceneAnchorKind): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1)
}
