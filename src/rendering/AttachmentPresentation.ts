import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  type AbstractMesh,
  type Mesh,
  type Scene,
} from '@babylonjs/core'
import { AttachmentCatalogId } from '@/types/attachment.ts'
import {
  getAttachmentCatalogEntry,
} from '@/config/attachment-catalog.ts'
import { AttachmentId, AttachmentLifecycleState } from '@/types/attachment.ts'
import type { AttachmentSystem } from '@systems/AttachmentSystem.ts'

const ATTACHMENT_NODE_PREFIX = 'attachment_'

const PLOW_COLOR = new Color3(0.45, 0.32, 0.18)
const SEEDER_COLOR = new Color3(0.2, 0.45, 0.7)
const TRAILER_COLOR = new Color3(0.55, 0.42, 0.28)
const HEADER_COLOR = new Color3(0.7, 0.55, 0.15)

export class AttachmentPresentation {
  private scene: Scene | null = null
  private attachmentSystem: AttachmentSystem | null = null
  private readonly nodes = new Map<string, TransformNode>()

  attach(scene: Scene, attachmentSystem: AttachmentSystem): void {
    this.detach()
    this.scene = scene
    this.attachmentSystem = attachmentSystem
    this.createMeshes(scene)
    this.syncVisuals()
  }

  syncVisuals(): void {
    if (!this.scene || !this.attachmentSystem) {
      return
    }

    for (const attachment of this.attachmentSystem.getAllAttachments()) {
      const node = this.nodes.get(attachment.id)
      if (!node) {
        continue
      }

      const transform = this.attachmentSystem.getAttachmentWorldTransform(
        attachment.id,
      )
      if (!transform) {
        continue
      }

      node.position = new Vector3(
        transform.position.x,
        transform.position.y,
        transform.position.z,
      )
      node.rotation.y = transform.rotationY
      node.setEnabled(true)
    }
  }

  detach(): void {
    for (const node of this.nodes.values()) {
      node.dispose()
    }
    this.nodes.clear()
    this.scene = null
    this.attachmentSystem = null
  }

  private createMeshes(scene: Scene): void {
    if (!this.attachmentSystem) {
      return
    }

    for (const attachment of this.attachmentSystem.getAllAttachments()) {
      const nodeName = `${ATTACHMENT_NODE_PREFIX}${attachment.id}`
      const root = new TransformNode(nodeName, scene)
      root.metadata = { attachmentId: attachment.id }

      const body = this.createBodyMesh(
        scene,
        attachment.catalogId,
        `${nodeName}_body`,
      )
      body.parent = root
      body.isPickable = true

      this.nodes.set(attachment.id, root)
    }
  }

  private createBodyMesh(
    scene: Scene,
    catalogId: string,
    meshName: string,
  ): Mesh {
    const catalog = getAttachmentCatalogEntry(
      catalogId as (typeof AttachmentCatalogId)[keyof typeof AttachmentCatalogId],
    )

    switch (catalog?.id) {
      case AttachmentCatalogId.Plow:
        return this.createPlowMesh(scene, meshName)
      case AttachmentCatalogId.Seeder:
        return this.createSeederMesh(scene, meshName)
      case AttachmentCatalogId.Wagon:
        return this.createTrailerMesh(scene, meshName)
      default:
        return this.createGenericMesh(scene, meshName, HEADER_COLOR)
    }
  }

  private createPlowMesh(scene: Scene, meshName: string): Mesh {
    const frame = MeshBuilder.CreateBox(
      meshName,
      { width: 2.4, height: 0.35, depth: 1.2 },
      scene,
    )
    frame.position.y = 0.2

    const blade = MeshBuilder.CreateBox(
      `${meshName}_blade`,
      { width: 2.6, height: 0.12, depth: 0.35 },
      scene,
    )
    blade.position = new Vector3(0, 0.05, -0.55)
    blade.parent = frame

    const material = new StandardMaterial(`${meshName}_mat`, scene)
    material.diffuseColor = PLOW_COLOR
    frame.material = material
    blade.material = material
    return frame
  }

  private createSeederMesh(scene: Scene, meshName: string): Mesh {
    const hopper = MeshBuilder.CreateBox(
      meshName,
      { width: 2.2, height: 0.9, depth: 1.4 },
      scene,
    )
    hopper.position.y = 0.45

    const frame = MeshBuilder.CreateBox(
      `${meshName}_frame`,
      { width: 2.4, height: 0.2, depth: 1.6 },
      scene,
    )
    frame.position.y = 0.1
    frame.parent = hopper

    const material = new StandardMaterial(`${meshName}_mat`, scene)
    material.diffuseColor = SEEDER_COLOR
    hopper.material = material
    frame.material = material
    return hopper
  }

  private createTrailerMesh(scene: Scene, meshName: string): Mesh {
    const bed = MeshBuilder.CreateBox(
      meshName,
      { width: 2.6, height: 0.5, depth: 3.2 },
      scene,
    )
    bed.position.y = 0.35

    const wheelMaterial = new StandardMaterial(`${meshName}_wheel_mat`, scene)
    wheelMaterial.diffuseColor = new Color3(0.12, 0.12, 0.12)

    for (const x of [-0.9, 0.9]) {
      for (const z of [-1.1, 1.1]) {
        const wheel = MeshBuilder.CreateCylinder(
          `${meshName}_wheel_${x}_${z}`,
          { height: 0.2, diameter: 0.7 },
          scene,
        )
        wheel.rotation.z = Math.PI / 2
        wheel.position = new Vector3(x, 0.15, z)
        wheel.parent = bed
        wheel.material = wheelMaterial
        wheel.isPickable = false
      }
    }

    const material = new StandardMaterial(`${meshName}_mat`, scene)
    material.diffuseColor = TRAILER_COLOR
    bed.material = material
    return bed
  }

  private createGenericMesh(scene: Scene, meshName: string, color: Color3): Mesh {
    const mesh = MeshBuilder.CreateBox(
      meshName,
      { width: 2, height: 0.5, depth: 1.5 },
      scene,
    )
    mesh.position.y = 0.25

    const material = new StandardMaterial(`${meshName}_mat`, scene)
    material.diffuseColor = color
    mesh.material = material
    return mesh
  }
}

export function getAttachmentIdFromMesh(
  mesh: AbstractMesh,
): string | null {
  const knownIds = new Set<string>(Object.values(AttachmentId))
  let current: AbstractMesh | null = mesh

  while (current) {
    if (current.name.startsWith(ATTACHMENT_NODE_PREFIX)) {
      const id = current.name.slice(ATTACHMENT_NODE_PREFIX.length)
      if (knownIds.has(id)) {
        return id
      }
    }
    current = current.parent as AbstractMesh | null
  }

  return null
}

export function isAttachmentMesh(mesh: AbstractMesh): boolean {
  return getAttachmentIdFromMesh(mesh) !== null
}

export const DEFAULT_ATTACHMENT_IDS = [
  AttachmentId.Plow1,
  AttachmentId.Seeder1,
  AttachmentId.Trailer1,
] as const

export function isKnownAttachmentLifecycleState(
  state: string,
): state is (typeof AttachmentLifecycleState)[keyof typeof AttachmentLifecycleState] {
  return Object.values(AttachmentLifecycleState).includes(
    state as (typeof AttachmentLifecycleState)[keyof typeof AttachmentLifecycleState],
  )
}
