import {
  Color3,
  Color4,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'

const SKY_COLOR = new Color4(0.53, 0.81, 0.92, 1)
const TERRAIN_COLOR = new Color3(0.29, 0.49, 0.19)
const FIELD_COLOR = new Color3(0.45, 0.32, 0.14)
const FARMYARD_COLOR = new Color3(0.62, 0.52, 0.36)
const BARN_COLOR = new Color3(0.7, 0.22, 0.18)
const TRACTOR_BODY_COLOR = new Color3(0.15, 0.42, 0.15)
const TRACTOR_CABIN_COLOR = new Color3(0.2, 0.5, 0.2)
const TRACTOR_WHEEL_COLOR = new Color3(0.12, 0.12, 0.12)

export class FarmSceneBuilder {
  build(scene: Scene): void {
    scene.clearColor = SKY_COLOR

    this.createTerrain(scene)
    this.createFields(scene)
    this.createFarmyard(scene)
    this.createTractor(scene)
  }

  private createTerrain(scene: Scene): void {
    const terrain = MeshBuilder.CreateGround(
      'terrain',
      { width: 60, height: 60 },
      scene,
    )
    const material = new StandardMaterial('terrainMaterial', scene)
    material.diffuseColor = TERRAIN_COLOR
    material.specularColor = new Color3(0.05, 0.05, 0.05)
    terrain.material = material
  }

  private createFields(scene: Scene): void {
    const fieldPositions = [-12, 0, 12]

    for (const [index, x] of fieldPositions.entries()) {
      const field = MeshBuilder.CreateBox(
        `field_${index + 1}`,
        { width: 10, height: 0.08, depth: 14 },
        scene,
      )
      field.position = new Vector3(x, 0.04, -4)

      const material = new StandardMaterial(`fieldMaterial_${index + 1}`, scene)
      material.diffuseColor = FIELD_COLOR
      material.specularColor = new Color3(0.02, 0.02, 0.02)
      field.material = material
    }
  }

  private createFarmyard(scene: Scene): void {
    const farmyard = MeshBuilder.CreateBox(
      'farmyard',
      { width: 14, height: 0.06, depth: 10 },
      scene,
    )
    farmyard.position = new Vector3(16, 0.03, 14)

    const farmyardMaterial = new StandardMaterial('farmyardMaterial', scene)
    farmyardMaterial.diffuseColor = FARMYARD_COLOR
    farmyard.material = farmyardMaterial

    const barn = MeshBuilder.CreateBox(
      'barn',
      { width: 6, height: 4, depth: 5 },
      scene,
    )
    barn.position = new Vector3(16, 2, 12)

    const barnMaterial = new StandardMaterial('barnMaterial', scene)
    barnMaterial.diffuseColor = BARN_COLOR
    barn.material = barnMaterial

    const roof = MeshBuilder.CreateBox(
      'barnRoof',
      { width: 6.6, height: 0.4, depth: 5.6 },
      scene,
    )
    roof.position = new Vector3(16, 4.2, 12)

    const roofMaterial = new StandardMaterial('barnRoofMaterial', scene)
    roofMaterial.diffuseColor = new Color3(0.35, 0.22, 0.12)
    roof.material = roofMaterial
  }

  private createTractor(scene: Scene): void {
    const root = new TransformNode('tractor', scene)
    root.position = new Vector3(6, 0, 10)
    root.rotation.y = -Math.PI / 6

    const body = MeshBuilder.CreateBox(
      'tractorBody',
      { width: 2.2, height: 1.2, depth: 3.6 },
      scene,
    )
    body.position = new Vector3(0, 0.9, 0)
    body.parent = root

    const bodyMaterial = new StandardMaterial('tractorBodyMaterial', scene)
    bodyMaterial.diffuseColor = TRACTOR_BODY_COLOR
    body.material = bodyMaterial

    const cabin = MeshBuilder.CreateBox(
      'tractorCabin',
      { width: 1.4, height: 1.1, depth: 1.4 },
      scene,
    )
    cabin.position = new Vector3(0, 1.85, -0.6)
    cabin.parent = root

    const cabinMaterial = new StandardMaterial('tractorCabinMaterial', scene)
    cabinMaterial.diffuseColor = TRACTOR_CABIN_COLOR
    cabin.material = cabinMaterial

    const hood = MeshBuilder.CreateBox(
      'tractorHood',
      { width: 1.6, height: 0.8, depth: 1.2 },
      scene,
    )
    hood.position = new Vector3(0, 1.1, 1.3)
    hood.parent = root
    hood.material = bodyMaterial

    const wheelPositions: [number, number][] = [
      [-1.1, 1.2],
      [1.1, 1.2],
      [-1.1, -1.2],
      [1.1, -1.2],
    ]

    const wheelMaterial = new StandardMaterial('tractorWheelMaterial', scene)
    wheelMaterial.diffuseColor = TRACTOR_WHEEL_COLOR

    for (const [index, [x, z]] of wheelPositions.entries()) {
      const wheel = MeshBuilder.CreateCylinder(
        `tractorWheel_${index + 1}`,
        { height: 0.5, diameter: 1.1 },
        scene,
      )
      wheel.rotation.z = Math.PI / 2
      wheel.position = new Vector3(x, 0.55, z)
      wheel.parent = root
      wheel.material = wheelMaterial
    }

    const exhaust = MeshBuilder.CreateCylinder(
      'tractorExhaust',
      { height: 0.8, diameter: 0.2 },
      scene,
    )
    exhaust.position = new Vector3(0.5, 2.2, 0.2)
    exhaust.parent = root
    exhaust.material = wheelMaterial
  }
}
