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
import { getCargoColorForCrop } from '@/config/cargo-appearance.ts'
import { AttachmentId, AttachmentLifecycleState, AttachmentType } from '@/types/attachment.ts'
import type { AttachmentSystem } from '@systems/AttachmentSystem.ts'

const ATTACHMENT_NODE_PREFIX = 'attachment_'

const PLOW_COLOR = new Color3(0.45, 0.32, 0.18)
const SEEDER_COLOR = new Color3(0.2, 0.45, 0.7)
const TRAILER_COLOR = new Color3(0.55, 0.42, 0.28)
const HEADER_COLOR = new Color3(0.7, 0.55, 0.15)
const SPREADER_COLOR = new Color3(0.55, 0.48, 0.22)
const SPRAYER_COLOR = new Color3(0.25, 0.5, 0.35)

export class AttachmentPresentation {
  private scene: Scene | null = null
  private attachmentSystem: AttachmentSystem | null = null
  private readonly nodes = new Map<string, TransformNode>()
  private readonly cargoFillMeshes = new Map<string, Mesh>()
  private readonly cargoVisualState = new Map<
    string,
    { cropId: string | null; fillPercent: number; enabled: boolean }
  >()

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

      this.syncTrailerCargoVisual(attachment.id, attachment.attachmentType)
    }
  }

  private syncTrailerCargoVisual(
    attachmentId: string,
    attachmentType: string,
  ): void {
    if (attachmentType !== AttachmentType.Trailer || !this.attachmentSystem) {
      return
    }

    const fillMesh = this.cargoFillMeshes.get(attachmentId)
    if (!fillMesh) {
      return
    }

    const cargo = this.attachmentSystem.getTrailerCargo(
      attachmentId as (typeof AttachmentId)[keyof typeof AttachmentId],
    )
    const nextState = {
      cropId: cargo?.getCropId() ?? null,
      fillPercent:
        cargo && cargo.getCapacity() > 0
          ? cargo.getQuantity() / cargo.getCapacity()
          : 0,
      enabled: Boolean(cargo?.hasCargo()),
    }
    const previous = this.cargoVisualState.get(attachmentId)
    if (
      previous &&
      previous.enabled === nextState.enabled &&
      previous.cropId === nextState.cropId &&
      Math.abs(previous.fillPercent - nextState.fillPercent) < 0.001
    ) {
      return
    }
    this.cargoVisualState.set(attachmentId, nextState)

    if (!cargo || !cargo.hasCargo()) {
      fillMesh.setEnabled(false)
      return
    }

    const fillPercent = nextState.fillPercent
    fillMesh.setEnabled(true)
    fillMesh.scaling.y = Math.max(0.05, fillPercent)

    const material = fillMesh.material as StandardMaterial | undefined
    if (material) {
      material.diffuseColor = getCargoColorForCrop(cargo.getCropId())
      material.emissiveColor = material.diffuseColor.scale(0.15)
    }
  }

  detach(): void {
    for (const node of this.nodes.values()) {
      node.dispose()
    }
    this.nodes.clear()
    this.cargoFillMeshes.clear()
    this.cargoVisualState.clear()
    this.scene = null
    this.attachmentSystem = null
  }

  ensureAttachmentMesh(attachmentId: string): void {
    const scene = this.scene
    const attachmentSystem = this.attachmentSystem
    if (!scene || !attachmentSystem || this.nodes.has(attachmentId)) {
      return
    }

    const attachment = attachmentSystem.getAttachment(
      attachmentId as (typeof AttachmentId)[keyof typeof AttachmentId],
    )
    if (!attachment) {
      return
    }

    const nodeName = `${ATTACHMENT_NODE_PREFIX}${attachment.id}`
    const root = new TransformNode(nodeName, scene)
    root.metadata = { attachmentId: attachment.id }

    const body = this.createBodyMesh(
      scene,
      attachment.catalogId,
      `${nodeName}_body`,
      attachment.id,
    )
    body.parent = root
    body.isPickable = true

    this.nodes.set(attachment.id, root)
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
        attachment.id,
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
    attachmentId: string,
  ): Mesh {
    const catalog = getAttachmentCatalogEntry(
      catalogId as (typeof AttachmentCatalogId)[keyof typeof AttachmentCatalogId],
    )

    switch (catalog?.id) {
      case AttachmentCatalogId.Plow:
        return this.createPlowMesh(scene, meshName)
      case AttachmentCatalogId.Seeder:
        return this.createSeederMesh(scene, meshName)
      case AttachmentCatalogId.FertilizerSpreader:
        return this.createSpreaderMesh(scene, meshName)
      case AttachmentCatalogId.Sprayer:
        return this.createSprayerMesh(scene, meshName)
      case AttachmentCatalogId.Wagon:
        return this.createTrailerMesh(scene, meshName, attachmentId)
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

  private createSpreaderMesh(scene: Scene, meshName: string): Mesh {
    const hopper = MeshBuilder.CreateBox(
      meshName,
      { width: 2.4, height: 0.85, depth: 1.5 },
      scene,
    )
    hopper.position.y = 0.42

    const spreader = MeshBuilder.CreateBox(
      `${meshName}_bars`,
      { width: 2.8, height: 0.15, depth: 0.5 },
      scene,
    )
    spreader.position = new Vector3(0, 0.05, -0.75)
    spreader.parent = hopper

    const material = new StandardMaterial(`${meshName}_mat`, scene)
    material.diffuseColor = SPREADER_COLOR
    hopper.material = material
    spreader.material = material
    return hopper
  }

  private createSprayerMesh(scene: Scene, meshName: string): Mesh {
    const tank = MeshBuilder.CreateCylinder(
      meshName,
      { height: 1.1, diameter: 1.2 },
      scene,
    )
    tank.position.y = 0.55

    const boom = MeshBuilder.CreateBox(
      `${meshName}_boom`,
      { width: 3.2, height: 0.12, depth: 0.2 },
      scene,
    )
    boom.position = new Vector3(0, 0.35, -0.9)
    boom.parent = tank

    const material = new StandardMaterial(`${meshName}_mat`, scene)
    material.diffuseColor = SPRAYER_COLOR
    tank.material = material
    boom.material = material
    return tank
  }

  private createTrailerMesh(
    scene: Scene,
    meshName: string,
    attachmentId: string,
  ): Mesh {
    const bed = MeshBuilder.CreateBox(
      meshName,
      { width: 2.6, height: 0.5, depth: 3.2 },
      scene,
    )
    bed.position.y = 0.35

    const cargoFill = MeshBuilder.CreateBox(
      `${meshName}_cargo_fill`,
      { width: 2.2, height: 0.42, depth: 2.8 },
      scene,
    )
    cargoFill.position.y = 0.12
    cargoFill.parent = bed
    cargoFill.isPickable = false
    cargoFill.setEnabled(false)
    cargoFill.scaling.y = 0.05

    const cargoMaterial = new StandardMaterial(`${meshName}_cargo_mat`, scene)
    cargoMaterial.diffuseColor = getCargoColorForCrop(null)
    cargoFill.material = cargoMaterial
    this.cargoFillMeshes.set(attachmentId, cargoFill)

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
