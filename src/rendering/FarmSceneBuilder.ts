import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { FarmDecorationsBuilder } from './FarmDecorationsBuilder.ts'
import { FarmEnvironment } from './FarmEnvironment.ts'
import { MILL_POSITION } from '@/config/production-catalog.ts'
import { FIELD_POSITIONS } from '@/config/farm-layout.ts'
import { INTERACTION_POINT_CATALOG } from '@/config/interaction-point-catalog.ts'

const TERRAIN_COLOR = new Color3(0.26, 0.46, 0.18)
const FIELD_BASE_COLOR = new Color3(0.42, 0.28, 0.16)
const FARMYARD_COLOR = new Color3(0.58, 0.48, 0.34)
const TRACTOR_BODY_COLOR = new Color3(0.15, 0.42, 0.15)
const TRACTOR_CABIN_COLOR = new Color3(0.2, 0.5, 0.2)
const TRACTOR_WHEEL_COLOR = new Color3(0.12, 0.12, 0.12)

export class FarmSceneBuilder {
  private readonly environment = new FarmEnvironment()
  private readonly decorations = new FarmDecorationsBuilder()

  build(scene: Scene): void {
    this.environment.apply(scene)

    this.createTerrain(scene)
    this.decorations.build(scene)
    this.createFields(scene)
    this.createFarmyard(scene)
    this.createBarn(scene)
    this.createMill(scene)
    this.createTractor(scene)
    this.createCombines(scene)
    this.createInteractionPoints(scene)
  }

  private createTerrain(scene: Scene): void {
    const terrain = MeshBuilder.CreateGround(
      'terrain',
      { width: 60, height: 60 },
      scene,
    )
    const material = new StandardMaterial('terrainMaterial', scene)
    material.diffuseColor = TERRAIN_COLOR
    material.specularColor = new Color3(0.04, 0.06, 0.03)
    material.emissiveColor = new Color3(0.02, 0.03, 0.01)
    terrain.material = material
    terrain.receiveShadows = true
  }

  private createFields(scene: Scene): void {
    for (const [fieldId, position] of Object.entries(FIELD_POSITIONS)) {
      const field = MeshBuilder.CreateBox(
        fieldId,
        { width: 10, height: 0.08, depth: 14 },
        scene,
      )
      field.position = new Vector3(position.x, 0.04, position.z)

      const material = new StandardMaterial(`fieldMaterial_${fieldId}`, scene)
      material.diffuseColor = FIELD_BASE_COLOR.clone()
      material.specularColor = new Color3(0.05, 0.04, 0.02)
      field.material = material
      field.receiveShadows = true
    }
  }

  private createFarmyard(scene: Scene): void {
    const farmyard = MeshBuilder.CreateBox(
      'farmyard',
      { width: 26, height: 0.06, depth: 18 },
      scene,
    )
    farmyard.position = new Vector3(18, 0.03, 22)
    farmyard.isPickable = false

    const farmyardMaterial = new StandardMaterial('farmyardMaterial', scene)
    farmyardMaterial.diffuseColor = FARMYARD_COLOR
    farmyardMaterial.specularColor = new Color3(0.06, 0.05, 0.03)
    farmyard.material = farmyardMaterial
    farmyard.receiveShadows = true
  }

  private createBarn(scene: Scene): void {
    const root = new TransformNode('barn_root', scene)
    root.position = new Vector3(16, 0, 12)

    const wallMat = new StandardMaterial('barnWallMaterial', scene)
    wallMat.diffuseColor = new Color3(0.72, 0.24, 0.18)
    wallMat.specularColor = new Color3(0.08, 0.04, 0.03)

    const trimMat = new StandardMaterial('barnTrimMaterial', scene)
    trimMat.diffuseColor = new Color3(0.48, 0.32, 0.2)

    const roofMat = new StandardMaterial('barnRoofMaterial', scene)
    roofMat.diffuseColor = new Color3(0.32, 0.2, 0.12)
    roofMat.specularColor = new Color3(0.05, 0.04, 0.03)

    const body = MeshBuilder.CreateBox(
      'barn',
      { width: 6.2, height: 3.8, depth: 5.2 },
      scene,
    )
    body.position = new Vector3(0, 1.9, 0)
    body.material = wallMat
    body.parent = root
    body.receiveShadows = true

    const door = MeshBuilder.CreateBox(
      'barnDoor',
      { width: 1.6, height: 2.4, depth: 0.12 },
      scene,
    )
    door.position = new Vector3(0, 1.2, 2.62)
    door.material = trimMat
    door.parent = root

    const loft = MeshBuilder.CreateBox(
      'barnLoft',
      { width: 1.4, height: 0.9, depth: 0.12 },
      scene,
    )
    loft.position = new Vector3(0, 2.8, 2.62)
    loft.material = trimMat
    loft.parent = root

    const roofLeft = MeshBuilder.CreateBox(
      'barnRoofLeft',
      { width: 3.4, height: 0.25, depth: 5.8 },
      scene,
    )
    roofLeft.position = new Vector3(-1.55, 4.15, 0)
    roofLeft.rotation.z = 0.42
    roofLeft.material = roofMat
    roofLeft.parent = root
    roofLeft.receiveShadows = true

    const roofRight = MeshBuilder.CreateBox(
      'barnRoofRight',
      { width: 3.4, height: 0.25, depth: 5.8 },
      scene,
    )
    roofRight.position = new Vector3(1.55, 4.15, 0)
    roofRight.rotation.z = -0.42
    roofRight.material = roofMat
    roofRight.parent = root
    roofRight.receiveShadows = true

    const silo = MeshBuilder.CreateCylinder(
      'barnSilo',
      { height: 5.5, diameter: 2.2 },
      scene,
    )
    silo.position = new Vector3(4.2, 2.75, -0.8)
    silo.material = trimMat
    silo.parent = root
    silo.receiveShadows = true

    const siloCap = MeshBuilder.CreateSphere(
      'barnSiloCap',
      { diameter: 2.3, segments: 10 },
      scene,
    )
    siloCap.position = new Vector3(4.2, 5.6, -0.8)
    siloCap.scaling.y = 0.45
    siloCap.material = roofMat
    siloCap.parent = root
  }

  private createMill(scene: Scene): void {
    const body = MeshBuilder.CreateBox(
      'mill_building',
      { width: 3.2, height: 2.8, depth: 3.6 },
      scene,
    )
    body.position = new Vector3(MILL_POSITION.x, 1.4, MILL_POSITION.z)

    const material = new StandardMaterial('millBuildingMaterial', scene)
    material.diffuseColor = new Color3(0.62, 0.55, 0.42)
    material.specularColor = new Color3(0.06, 0.05, 0.04)
    material.emissiveColor = new Color3(0.02, 0.02, 0.015)
    body.material = material
    body.receiveShadows = true

    const roof = MeshBuilder.CreateBox(
      'mill_roof',
      { width: 3.6, height: 0.35, depth: 4 },
      scene,
    )
    roof.position = new Vector3(MILL_POSITION.x, 2.95, MILL_POSITION.z)
    const roofMat = new StandardMaterial('millRoofMaterial', scene)
    roofMat.diffuseColor = new Color3(0.38, 0.28, 0.2)
    roof.material = roofMat
    roof.receiveShadows = true
  }

  private createTractor(scene: Scene): void {
    const root = new TransformNode('tractor', scene)
    root.position = new Vector3(6, 0, 10)
    root.rotation.y = -Math.PI / 6

    const bodyMaterial = new StandardMaterial('tractorBodyMaterial', scene)
    bodyMaterial.diffuseColor = TRACTOR_BODY_COLOR
    bodyMaterial.specularColor = new Color3(0.08, 0.1, 0.06)

    const cabinMaterial = new StandardMaterial('tractorCabinMaterial', scene)
    cabinMaterial.diffuseColor = TRACTOR_CABIN_COLOR

    const wheelMaterial = new StandardMaterial('tractorWheelMaterial', scene)
    wheelMaterial.diffuseColor = TRACTOR_WHEEL_COLOR
    wheelMaterial.specularColor = new Color3(0.02, 0.02, 0.02)

    const body = MeshBuilder.CreateBox(
      'tractorBody',
      { width: 2.2, height: 1.2, depth: 3.6 },
      scene,
    )
    body.position = new Vector3(0, 0.9, 0)
    body.parent = root
    body.material = bodyMaterial
    body.receiveShadows = true

    const cabin = MeshBuilder.CreateBox(
      'tractorCabin',
      { width: 1.4, height: 1.1, depth: 1.4 },
      scene,
    )
    cabin.position = new Vector3(0, 1.85, -0.6)
    cabin.parent = root
    cabin.material = cabinMaterial
    cabin.receiveShadows = true

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
      wheel.receiveShadows = true
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

  private createCombines(scene: Scene): void {
    this.createCombine(
      scene,
      'grain_combine_1',
      new Vector3(22, 0, 10),
      -Math.PI / 6,
      new Color3(0.75, 0.55, 0.12),
      new Color3(0.85, 0.2, 0.12),
    )
    this.createCombine(
      scene,
      'corn_combine_1',
      new Vector3(30, 0, 10),
      -Math.PI / 6,
      new Color3(0.7, 0.5, 0.1),
      new Color3(0.2, 0.55, 0.2),
    )
  }

  private createCombine(
    scene: Scene,
    nodeName: string,
    position: Vector3,
    rotationY: number,
    bodyColor: Color3,
    accentColor: Color3,
  ): void {
    const root = new TransformNode(nodeName, scene)
    root.position = position
    root.rotation.y = rotationY

    const bodyMaterial = new StandardMaterial(`${nodeName}_body_mat`, scene)
    bodyMaterial.diffuseColor = bodyColor

    const accentMaterial = new StandardMaterial(`${nodeName}_accent_mat`, scene)
    accentMaterial.diffuseColor = accentColor

    const wheelMaterial = new StandardMaterial(`${nodeName}_wheel_mat`, scene)
    wheelMaterial.diffuseColor = TRACTOR_WHEEL_COLOR

    const body = MeshBuilder.CreateBox(
      `${nodeName}_body`,
      { width: 3.2, height: 2.4, depth: 5.5 },
      scene,
    )
    body.position = new Vector3(0, 1.4, 0)
    body.parent = root
    body.material = bodyMaterial
    body.isPickable = true
    body.receiveShadows = true

    const cab = MeshBuilder.CreateBox(
      `${nodeName}_cab`,
      { width: 1.8, height: 1.6, depth: 1.8 },
      scene,
    )
    cab.position = new Vector3(0, 2.8, -1.2)
    cab.parent = root
    cab.material = accentMaterial
    cab.isPickable = true

    const hopper = MeshBuilder.CreateBox(
      `${nodeName}_hopper`,
      { width: 2.4, height: 1.2, depth: 2.2 },
      scene,
    )
    hopper.position = new Vector3(0, 3.2, 0.8)
    hopper.parent = root
    hopper.material = bodyMaterial
    hopper.isPickable = true

    for (const [index, [x, z]] of [
      [-1.3, 1.8],
      [1.3, 1.8],
      [-1.3, -1.8],
      [1.3, -1.8],
    ].entries()) {
      const wheel = MeshBuilder.CreateCylinder(
        `${nodeName}_wheel_${index}`,
        { height: 0.55, diameter: 1.2 },
        scene,
      )
      wheel.rotation.z = Math.PI / 2
      wheel.position = new Vector3(x, 0.6, z)
      wheel.parent = root
      wheel.material = wheelMaterial
    }
  }

  private createInteractionPoints(scene: Scene): void {
    const padMaterial = new StandardMaterial('interactionPadMaterial', scene)
    padMaterial.diffuseColor = new Color3(0.75, 0.62, 0.2)
    padMaterial.emissiveColor = new Color3(0.2, 0.15, 0.02)

    const markerMaterial = new StandardMaterial('interactionMarkerMaterial', scene)
    markerMaterial.diffuseColor = new Color3(0.9, 0.75, 0.2)
    markerMaterial.emissiveColor = new Color3(0.35, 0.25, 0.05)

    for (const point of INTERACTION_POINT_CATALOG) {
      const root = new TransformNode(`interaction_root_${point.id}`, scene)
      root.position = new Vector3(
        point.position.x,
        point.position.y,
        point.position.z,
      )

      const pad = MeshBuilder.CreateCylinder(
        point.meshName,
        { height: 0.08, diameter: 3.2 },
        scene,
      )
      pad.position.y = 0.04
      pad.material = padMaterial
      pad.parent = root
      pad.isPickable = true
      pad.receiveShadows = true

      const marker = MeshBuilder.CreateBox(
        `${point.meshName}_marker`,
        { width: 0.4, height: 1.6, depth: 0.4 },
        scene,
      )
      marker.position.y = 0.9
      marker.material = markerMaterial
      marker.parent = root
      marker.isPickable = true
    }
  }
}
