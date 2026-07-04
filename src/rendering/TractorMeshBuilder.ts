import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  type Scene,
} from '@babylonjs/core'

const TRACTOR_BODY_COLOR = new Color3(0.55, 0.62, 0.18)
const TRACTOR_CABIN_COLOR = new Color3(0.35, 0.4, 0.45)
const TRACTOR_WHEEL_COLOR = new Color3(0.12, 0.12, 0.12)

export function createTractorVisual(
  scene: Scene,
  instanceId: string,
  sceneNodeName: string,
  bodyMeshName: string,
  position: { x: number; y: number; z: number },
  rotationY: number,
): TransformNode {
  const root = new TransformNode(sceneNodeName, scene)
  root.position = new Vector3(position.x, position.y, position.z)
  root.rotation.y = rotationY

  const bodyMaterial = new StandardMaterial(`${instanceId}_body_mat`, scene)
  bodyMaterial.diffuseColor = TRACTOR_BODY_COLOR
  bodyMaterial.specularColor = new Color3(0.08, 0.1, 0.06)

  const cabinMaterial = new StandardMaterial(`${instanceId}_cabin_mat`, scene)
  cabinMaterial.diffuseColor = TRACTOR_CABIN_COLOR

  const wheelMaterial = new StandardMaterial(`${instanceId}_wheel_mat`, scene)
  wheelMaterial.diffuseColor = TRACTOR_WHEEL_COLOR
  wheelMaterial.specularColor = new Color3(0.02, 0.02, 0.02)

  const body = MeshBuilder.CreateBox(
    bodyMeshName,
    { width: 2.2, height: 1.2, depth: 3.6 },
    scene,
  )
  body.position = new Vector3(0, 0.9, 0)
  body.parent = root
  body.material = bodyMaterial
  body.isPickable = true
  body.receiveShadows = true

  const cabin = MeshBuilder.CreateBox(
    `${instanceId}_cabin`,
    { width: 1.4, height: 1.1, depth: 1.4 },
    scene,
  )
  cabin.position = new Vector3(0, 1.85, -0.6)
  cabin.parent = root
  cabin.material = cabinMaterial
  cabin.isPickable = true

  const hood = MeshBuilder.CreateBox(
    `${instanceId}_hood`,
    { width: 1.6, height: 0.8, depth: 1.2 },
    scene,
  )
  hood.position = new Vector3(0, 1.1, 1.3)
  hood.parent = root
  hood.material = bodyMaterial
  hood.isPickable = true

  for (const [index, [x, z]] of [
    [-1.1, 1.2],
    [1.1, 1.2],
    [-1.1, -1.2],
    [1.1, -1.2],
  ].entries()) {
    const wheel = MeshBuilder.CreateCylinder(
      `${instanceId}_wheel_${index + 1}`,
      { height: 0.5, diameter: 1.1 },
      scene,
    )
    wheel.rotation.z = Math.PI / 2
    wheel.position = new Vector3(x, 0.55, z)
    wheel.parent = root
    wheel.material = wheelMaterial
    wheel.isPickable = false
  }

  return root
}

export function disposeTractorVisual(scene: Scene, sceneNodeName: string): void {
  const root = scene.getTransformNodeByName(sceneNodeName)
  root?.dispose(false, true)
}
