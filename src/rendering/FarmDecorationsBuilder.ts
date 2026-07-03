import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core'
import { FIELD_POSITIONS } from '@/config/farm-layout.ts'

const DECOR_METADATA = { decor: true } as const

export class FarmDecorationsBuilder {
  build(scene: Scene): void {
    const root = new TransformNode('decor_root', scene)
    root.metadata = DECOR_METADATA

    this.createRoads(scene, root)
    this.createFences(scene, root)
    this.createTrees(scene, root)
    this.createBushes(scene, root)
    this.createRocks(scene, root)
    this.createHayBales(scene, root)
    this.createProps(scene, root)
  }

  private createRoads(scene: Scene, root: TransformNode): void {
    const roadMat = this.mat(scene, 'roadMaterial', new Color3(0.45, 0.4, 0.34))
    roadMat.specularColor = new Color3(0.05, 0.05, 0.05)

    const segments: Array<{ x: number; z: number; w: number; d: number }> = [
      { x: 11, z: 12, w: 12, d: 2.4 },
      { x: 6, z: 3, w: 2.4, d: 16 },
      { x: 0, z: -4, w: 28, d: 2.8 },
      { x: -12, z: -1.5, w: 2.2, d: 5 },
      { x: 0, z: -1.5, w: 2.2, d: 5 },
      { x: 12, z: -1.5, w: 2.2, d: 5 },
    ]

    segments.forEach((segment, index) => {
      const road = MeshBuilder.CreateBox(
        `decor_road_${index}`,
        { width: segment.w, height: 0.05, depth: segment.d },
        scene,
      )
      road.position = new Vector3(segment.x, 0.03, segment.z)
      road.material = roadMat
      road.parent = root
      this.decor(road)
    })
  }

  private createFences(scene: Scene, root: TransformNode): void {
    const fenceMat = this.mat(scene, 'fenceMaterial', new Color3(0.55, 0.42, 0.28))

    for (const [fieldId, position] of Object.entries(FIELD_POSITIONS)) {
      const segments = [
        { x: 0, z: -7.5, w: 10.6, d: 0.18 },
        { x: 0, z: 7.5, w: 10.6, d: 0.18 },
        { x: -5.2, z: 0, w: 0.18, d: 14.6 },
        { x: 5.2, z: 0, w: 0.18, d: 14.6 },
      ]

      segments.forEach((segment, index) => {
        const post = MeshBuilder.CreateBox(
          `decor_fence_${fieldId}_${index}`,
          { width: segment.w, height: 0.55, depth: segment.d },
          scene,
        )
        post.position = new Vector3(
          position.x + segment.x,
          0.3,
          position.z + segment.z,
        )
        post.material = fenceMat
        post.parent = root
        this.decor(post)
      })
    }

    const yardFence = [
      { x: 16, z: 19, w: 16, d: 0.2 },
      { x: 23, z: 14, w: 0.2, d: 12 },
    ]
    yardFence.forEach((segment, index) => {
      const fence = MeshBuilder.CreateBox(
        `decor_yard_fence_${index}`,
        { width: segment.w, height: 0.6, depth: segment.d },
        scene,
      )
      fence.position = new Vector3(segment.x, 0.32, segment.z)
      fence.material = fenceMat
      fence.parent = root
      this.decor(fence)
    })
  }

  private createTrees(scene: Scene, root: TransformNode): void {
    const trunkMat = this.mat(scene, 'treeTrunkMaterial', new Color3(0.35, 0.22, 0.12))
    const leafMat = this.mat(scene, 'treeLeafMaterial', new Color3(0.18, 0.42, 0.16))
    leafMat.specularColor = new Color3(0.04, 0.08, 0.03)

    const edgeTrees: Array<[number, number, number]> = [
      [-27, 0, -22],
      [-27, 0, -8],
      [-27, 0, 6],
      [-27, 0, 22],
      [27, 0, -22],
      [27, 0, -8],
      [27, 0, 6],
      [27, 0, 22],
      [-18, 0, -27],
      [-6, 0, -27],
      [6, 0, -27],
      [18, 0, -27],
      [-10, 0, 26],
      [8, 0, 26],
      [24, 0, 26],
      [-22, 0, 18],
      [22, 0, 18],
    ]

    edgeTrees.forEach(([x, , z], index) => {
      const scale = 0.85 + (index % 4) * 0.12
      const trunk = MeshBuilder.CreateCylinder(
        `decor_tree_trunk_${index}`,
        { height: 1.6 * scale, diameter: 0.35 * scale },
        scene,
      )
      trunk.position = new Vector3(x, 0.8 * scale, z)
      trunk.material = trunkMat
      trunk.parent = root
      this.decor(trunk)

      const crown = MeshBuilder.CreateSphere(
        `decor_tree_crown_${index}`,
        { diameter: 2.4 * scale, segments: 8 },
        scene,
      )
      crown.position = new Vector3(x, 2.1 * scale, z)
      crown.material = leafMat
      crown.parent = root
      this.decor(crown)
    })
  }

  private createBushes(scene: Scene, root: TransformNode): void {
    const bushMat = this.mat(scene, 'bushMaterial', new Color3(0.22, 0.48, 0.18))
    const positions: Array<[number, number, number]> = [
      [10, 0, 16],
      [22, 0, 18],
      [-8, 0, 8],
      [18, 0, 6],
      [-18, 0, -10],
      [20, 0, -12],
      [-6, 0, -18],
      [14, 0, -20],
      [2, 0, 14],
      [-14, 0, 14],
    ]

    positions.forEach(([x, , z], index) => {
      const bush = MeshBuilder.CreateSphere(
        `decor_bush_${index}`,
        { diameter: 1.1 + (index % 3) * 0.2, segments: 6 },
        scene,
      )
      bush.position = new Vector3(x, 0.45, z)
      bush.scaling.y = 0.65
      bush.material = bushMat
      bush.parent = root
      this.decor(bush)
    })
  }

  private createRocks(scene: Scene, root: TransformNode): void {
    const rockMat = this.mat(scene, 'rockMaterial', new Color3(0.42, 0.44, 0.4))
    const positions: Array<[number, number, number, number]> = [
      [-20, 0, -6, 0.3],
      [-4, 0, 12, -0.5],
      [11, 0, 8, 0.8],
      [24, 0, 4, 0.2],
      [-16, 0, -18, 1.1],
      [8, 0, -22, -0.4],
    ]

    positions.forEach(([x, , z, rot], index) => {
      const rock = MeshBuilder.CreateBox(
        `decor_rock_${index}`,
        { width: 0.9, height: 0.5, depth: 0.7 },
        scene,
      )
      rock.position = new Vector3(x, 0.25, z)
      rock.rotation.y = rot
      rock.scaling.set(
        0.8 + (index % 3) * 0.15,
        0.6 + (index % 2) * 0.2,
        0.9 + (index % 4) * 0.1,
      )
      rock.material = rockMat
      rock.parent = root
      this.decor(rock)
    })
  }

  private createHayBales(scene: Scene, root: TransformNode): void {
    const hayMat = this.mat(scene, 'hayMaterial', new Color3(0.78, 0.62, 0.28))
    hayMat.specularColor = new Color3(0.08, 0.06, 0.02)

    const bales: Array<[number, number, number, number]> = [
      [12, 0, 17, 0],
      [13.4, 0, 17.2, 0.4],
      [12.2, 0.55, 17.1, 1.2],
      [20, 0, 15.5, -0.3],
    ]

    bales.forEach(([x, y, z, rot], index) => {
      const bale = MeshBuilder.CreateCylinder(
        `decor_hay_${index}`,
        { height: 0.9, diameter: 0.7 },
        scene,
      )
      bale.rotation.z = Math.PI / 2
      bale.rotation.y = rot
      bale.position = new Vector3(x, 0.35 + y, z)
      bale.material = hayMat
      bale.parent = root
      this.decor(bale)
    })
  }

  private createProps(scene: Scene, root: TransformNode): void {
    const barrelMat = this.mat(scene, 'barrelMaterial', new Color3(0.5, 0.32, 0.18))
    const barrel = MeshBuilder.CreateCylinder(
      'decor_barrel',
      { height: 1.1, diameter: 0.75 },
      scene,
    )
    barrel.position = new Vector3(19, 0.55, 16)
    barrel.material = barrelMat
    barrel.parent = root
    this.decor(barrel)

    const crateMat = this.mat(scene, 'crateMaterial', new Color3(0.48, 0.36, 0.22))
    const crate = MeshBuilder.CreateBox(
      'decor_crate',
      { width: 0.9, height: 0.7, depth: 0.9 },
      scene,
    )
    crate.position = new Vector3(18.2, 0.35, 15.2)
    crate.material = crateMat
    crate.parent = root
    this.decor(crate)

    const signMat = this.mat(scene, 'signMaterial', new Color3(0.62, 0.48, 0.3))
    const signPost = MeshBuilder.CreateBox(
      'decor_sign_post',
      { width: 0.15, height: 1.4, depth: 0.15 },
      scene,
    )
    signPost.position = new Vector3(4, 0.7, 12)
    signPost.material = signMat
    signPost.parent = root
    this.decor(signPost)

    const signBoard = MeshBuilder.CreateBox(
      'decor_sign_board',
      { width: 1.4, height: 0.7, depth: 0.1 },
      scene,
    )
    signBoard.position = new Vector3(4, 1.35, 12)
    signBoard.material = signMat
    signBoard.parent = root
    this.decor(signBoard)
  }

  private mat(scene: Scene, name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, scene)
    material.diffuseColor = color
    material.specularColor = new Color3(0.04, 0.04, 0.04)
    return material
  }

  private decor(mesh: { isPickable: boolean; metadata: unknown }): void {
    mesh.isPickable = false
    mesh.metadata = DECOR_METADATA
  }
}
