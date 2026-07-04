import {
  DEFAULT_ATTACHMENT_SPAWNS,
  getAttachmentCatalogEntry,
  getAttachmentDisplayName,
} from '@/config/attachment-catalog.ts'
import {
  getMachineCatalogEntry,
  getMachineSlots,
  slotAcceptsAttachmentType,
} from '@/config/machine-catalog.ts'
import {
  ATTACHMENT_SLOT_OFFSETS,
  DETACH_OFFSET,
  getEquipmentYardSpawnPositions,
} from '@/config/farm-layout.ts'
import { getGroundedPosition, groundSavedPosition } from '@/maps/grounding.ts'
import {
  AttachmentId,
  AttachmentLifecycleState,
  AttachmentWorkPosition,
  MachineSlotId,
  type AttachmentCatalogIdValue,
  type AttachmentIdValue,
  type AttachmentLifecycleStateValue,
  type AttachmentMountedOn,
  type AttachmentSnapshot,
  type AttachmentTypeValue,
  type AttachmentWorkPositionValue,
  type MachineAttachmentsSnapshot,
  type MachineSlotIdValue,
} from '@/types/attachment.ts'
import type { MachineId } from '@/types/machine.ts'
import type {
  AttachmentSaveData,
  AttachmentsSaveData,
  AttachmentContainerSaveData,
} from '@/types/save.ts'
import { AttachmentType } from '@/types/attachment.ts'
import { CARGO_KIND_CROP, DEFAULT_TRAILER_CARGO_CAPACITY } from '@/types/cargo.ts'
import { CargoContainer } from './CargoContainer.ts'
import type { CargoContainerSnapshot } from '@/types/cargo.ts'
import { GameSystem } from './GameSystem.ts'

interface Vec3 {
  x: number
  y: number
  z: number
}

interface AttachmentEntity {
  id: AttachmentIdValue
  catalogId: AttachmentCatalogIdValue
  attachmentType: AttachmentTypeValue
  lifecycleState: AttachmentLifecycleStateValue
  workPosition: AttachmentWorkPositionValue
  position: Vec3
  rotationY: number
  mountedOn: AttachmentMountedOn | null
  cargo: CargoContainer | null
}

type MachinePositionProvider = (
  machineId: MachineId,
) => { position: Vec3; rotationY: number } | null

type MachineIdleChecker = (machineId: MachineId) => boolean

export class AttachmentSystem extends GameSystem {
  readonly name = 'AttachmentSystem'
  private readonly attachments = new Map<AttachmentIdValue, AttachmentEntity>()
  private machinePositionProvider: MachinePositionProvider | null = null
  private machineIdleChecker: MachineIdleChecker | null = null
  private onChange: (() => void) | null = null
  private onVisualChange: (() => void) | null = null

  setMachinePositionProvider(provider: MachinePositionProvider): void {
    this.machinePositionProvider = provider
  }

  setMachineIdleChecker(checker: MachineIdleChecker): void {
    this.machineIdleChecker = checker
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  setOnVisualChange(listener: () => void): void {
    this.onVisualChange = listener
  }

  initialize(): void {
    this.attachments.clear()
    for (const spawn of DEFAULT_ATTACHMENT_SPAWNS) {
      const catalog = getAttachmentCatalogEntry(spawn.catalogId)
      if (!catalog) {
        continue
      }

      const yardPosition = getEquipmentYardSpawnPositions()[spawn.id] ?? {
        x: 16,
        y: 0,
        z: 18,
      }
      const grounded = getGroundedPosition(yardPosition.x, yardPosition.z)

      this.attachments.set(spawn.id, {
        id: spawn.id,
        catalogId: spawn.catalogId,
        attachmentType: catalog.attachmentType,
        lifecycleState: AttachmentLifecycleState.Detached,
        workPosition: AttachmentWorkPosition.Transport,
        position: { ...grounded },
        rotationY: 0,
        mountedOn: null,
        cargo: this.createCargoForCatalog(catalog.id, catalog.attachmentType),
      })
    }
    this.notifyChange()
  }

  update(_deltaTime: number): void {
    // Attachments follow machine transforms via presentation sync.
  }

  dispose(): void {
    this.attachments.clear()
    this.onChange = null
    this.onVisualChange = null
    this.machinePositionProvider = null
    this.machineIdleChecker = null
  }

  applySave(saved: AttachmentsSaveData): void {
    this.attachments.clear()

    const savedItems = Array.isArray(saved.items) ? saved.items : []
    const knownIds = new Set<AttachmentIdValue>()

    for (const item of savedItems) {
      const normalized = this.normalizeAttachmentSave(item)
      if (!normalized) {
        continue
      }
      this.attachments.set(normalized.id, normalized)
      knownIds.add(normalized.id)
    }

    for (const spawn of DEFAULT_ATTACHMENT_SPAWNS) {
      if (knownIds.has(spawn.id)) {
        continue
      }

      const catalog = getAttachmentCatalogEntry(spawn.catalogId)
      if (!catalog) {
        continue
      }

      const yardPosition = getEquipmentYardSpawnPositions()[spawn.id] ?? {
        x: 16,
        y: 0,
        z: 18,
      }
      const grounded = getGroundedPosition(yardPosition.x, yardPosition.z)

      this.attachments.set(spawn.id, {
        id: spawn.id,
        catalogId: spawn.catalogId,
        attachmentType: catalog.attachmentType,
        lifecycleState: AttachmentLifecycleState.Detached,
        workPosition: AttachmentWorkPosition.Transport,
        position: { ...grounded },
        rotationY: 0,
        mountedOn: null,
        cargo: this.createCargoForCatalog(catalog.id, catalog.attachmentType),
      })
    }

    this.reconcileMounts()
    this.notifyChange()
  }

  getTrailerCargo(attachmentId: AttachmentIdValue): CargoContainer | null {
    const attachment = this.attachments.get(attachmentId)
    if (!attachment || attachment.attachmentType !== AttachmentType.Trailer) {
      return null
    }
    return attachment.cargo
  }

  getTrailerCargoSnapshot(
    attachmentId: AttachmentIdValue,
    getCropName: (cropId: string) => string,
  ): CargoContainerSnapshot | null {
    const cargo = this.getTrailerCargo(attachmentId)
    return cargo ? cargo.toSnapshot(getCropName) : null
  }

  getMountedTrailerCargoSnapshot(
    machineId: MachineId,
    getCropName: (cropId: string) => string,
  ): CargoContainerSnapshot | null {
    const trailerId = this.getSlotAttachmentId(
      machineId,
      MachineSlotId.TrailerHitch,
    )
    if (!trailerId) {
      return null
    }
    return this.getTrailerCargoSnapshot(trailerId, getCropName)
  }

  private createCargoForCatalog(
    catalogId: AttachmentCatalogIdValue,
    attachmentType: AttachmentTypeValue,
  ): CargoContainer | null {
    if (attachmentType !== AttachmentType.Trailer) {
      return null
    }
    const catalog = getAttachmentCatalogEntry(catalogId)
    const capacity = catalog?.cargoCapacity ?? DEFAULT_TRAILER_CARGO_CAPACITY
    return new CargoContainer(capacity)
  }

  private restoreCargoFromContainers(
    attachmentType: AttachmentTypeValue,
    catalogId: AttachmentCatalogIdValue,
    containers: AttachmentContainerSaveData[] | undefined,
  ): CargoContainer | null {
    if (attachmentType !== AttachmentType.Trailer) {
      return null
    }
    const catalog = getAttachmentCatalogEntry(catalogId)
    const capacity = catalog?.cargoCapacity ?? DEFAULT_TRAILER_CARGO_CAPACITY
    const cargo = new CargoContainer(capacity)
    const cropContainer = containers?.find(
      (entry) => entry.cargoKind === CARGO_KIND_CROP,
    )
    if (cropContainer) {
      cargo.restoreFromSave({
        capacity,
        quantity: cropContainer.quantity,
        cropId: cropContainer.itemId ?? null,
      })
    }
    return cargo
  }

  private cargoToContainers(
    cargo: CargoContainer | null,
  ): AttachmentContainerSaveData[] | undefined {
    if (!cargo) {
      return undefined
    }
    const save = cargo.toSaveData()
    if (save.quantity <= 0) {
      return []
    }
    return [
      {
        cargoKind: CARGO_KIND_CROP,
        itemId: save.cropId ?? undefined,
        quantity: save.quantity,
      },
    ]
  }

  toSaveData(): AttachmentsSaveData {
    return {
      items: [...this.attachments.values()].map((attachment) =>
        this.toAttachmentSave(attachment),
      ),
    }
  }

  getAttachment(id: AttachmentIdValue): AttachmentEntity | undefined {
    return this.attachments.get(id)
  }

  getAllAttachments(): readonly AttachmentEntity[] {
    return [...this.attachments.values()]
  }

  hasAttachment(id: AttachmentIdValue): boolean {
    return this.attachments.has(id)
  }

  getDetachedOccupiedPositions(): { x: number; z: number }[] {
    return this.getAllAttachments()
      .filter(
        (attachment) =>
          attachment.lifecycleState === AttachmentLifecycleState.Detached,
      )
      .map((attachment) => ({
        x: attachment.position.x,
        z: attachment.position.z,
      }))
  }

  deliverAttachment(
    instanceId: AttachmentIdValue,
    catalogId: AttachmentCatalogIdValue,
    position: Vec3,
    rotationY: number,
  ): boolean {
    if (this.attachments.has(instanceId)) {
      return false
    }

    const catalog = getAttachmentCatalogEntry(catalogId)
    if (!catalog) {
      return false
    }

    this.attachments.set(instanceId, {
      id: instanceId,
      catalogId,
      attachmentType: catalog.attachmentType,
      lifecycleState: AttachmentLifecycleState.Detached,
      workPosition: AttachmentWorkPosition.Transport,
      position: { ...position },
      rotationY,
      mountedOn: null,
      cargo: this.createCargoForCatalog(catalog.id, catalog.attachmentType),
    })
    this.notifyChange()
    this.onVisualChange?.()
    return true
  }

  getSlotAttachmentId(
    machineId: MachineId,
    slotId: MachineSlotIdValue,
  ): AttachmentIdValue | null {
    for (const attachment of this.attachments.values()) {
      if (
        attachment.lifecycleState === AttachmentLifecycleState.Attached &&
        attachment.mountedOn?.machineId === machineId &&
        attachment.mountedOn.slotId === slotId
      ) {
        return attachment.id
      }
    }
    return null
  }

  findCompatibleSlot(
    machineId: MachineId,
    attachmentId: AttachmentIdValue,
  ): MachineSlotIdValue | null {
    const attachment = this.attachments.get(attachmentId)
    if (!attachment) {
      return null
    }

    for (const slot of getMachineSlots(machineId)) {
      if (!slot.acceptedTypes.includes(attachment.attachmentType)) {
        continue
      }
      if (this.getSlotAttachmentId(machineId, slot.id)) {
        continue
      }
      return slot.id
    }

    return null
  }

  canAttach(
    machineId: MachineId,
    slotId: MachineSlotIdValue,
    attachmentId: AttachmentIdValue,
  ): boolean {
    if (!this.isMachineIdle(machineId)) {
      return false
    }

    const attachment = this.attachments.get(attachmentId)
    if (!attachment || attachment.lifecycleState !== AttachmentLifecycleState.Detached) {
      return false
    }

    if (this.getSlotAttachmentId(machineId, slotId)) {
      return false
    }

    return slotAcceptsAttachmentType(
      machineId,
      slotId,
      attachment.attachmentType,
    )
  }

  canDetach(machineId: MachineId, slotId: MachineSlotIdValue): boolean {
    if (!this.isMachineIdle(machineId)) {
      return false
    }
    return this.getSlotAttachmentId(machineId, slotId) !== null
  }

  attachAttachment(
    machineId: MachineId,
    slotId: MachineSlotIdValue,
    attachmentId: AttachmentIdValue,
  ): boolean {
    if (!this.canAttach(machineId, slotId, attachmentId)) {
      return false
    }

    const attachment = this.attachments.get(attachmentId)
    if (!attachment) {
      return false
    }

    attachment.lifecycleState = AttachmentLifecycleState.Attached
    attachment.mountedOn = { machineId, slotId }
    attachment.workPosition = AttachmentWorkPosition.Transport
    this.notifyChange()
    this.notifyVisualChange()
    return true
  }

  detachAttachment(machineId: MachineId, slotId: MachineSlotIdValue): boolean {
    if (!this.canDetach(machineId, slotId)) {
      return false
    }

    const attachmentId = this.getSlotAttachmentId(machineId, slotId)
    if (!attachmentId) {
      return false
    }

    const attachment = this.attachments.get(attachmentId)
    if (!attachment) {
      return false
    }

    const machineTransform = this.machinePositionProvider?.(machineId)
    if (machineTransform) {
      attachment.position = this.computeDetachPosition(machineTransform)
      attachment.rotationY = machineTransform.rotationY
    } else {
      const yardPosition = getEquipmentYardSpawnPositions()[attachmentId] ?? {
        x: 16,
        y: 0,
        z: 18,
      }
      attachment.position = getGroundedPosition(yardPosition.x, yardPosition.z)
      attachment.rotationY = 0
    }

    attachment.lifecycleState = AttachmentLifecycleState.Detached
    attachment.mountedOn = null
    attachment.workPosition = AttachmentWorkPosition.Transport
    this.notifyChange()
    this.notifyVisualChange()
    return true
  }

  toAttachmentSnapshots(): readonly AttachmentSnapshot[] {
    return [...this.attachments.values()].map((attachment) => ({
      id: attachment.id,
      name: getAttachmentDisplayName(attachment.catalogId),
      catalogId: attachment.catalogId,
      attachmentType: attachment.attachmentType,
      lifecycleState: attachment.lifecycleState,
      mountedOn: attachment.mountedOn,
    }))
  }

  toMachineAttachmentsSnapshot(
    machineId: MachineId,
  ): MachineAttachmentsSnapshot | null {
    const machine = getMachineCatalogEntry(machineId)
    if (!machine) {
      return null
    }

    const slots = machine.slots.map((slot) => {
      const attachmentId = this.getSlotAttachmentId(machineId, slot.id)
      const attachment = attachmentId
        ? this.attachments.get(attachmentId)
        : undefined

      return {
        slotId: slot.id,
        label: slot.label,
        attachmentId: attachmentId,
        attachmentName: attachment
          ? getAttachmentDisplayName(attachment.catalogId)
          : null,
      }
    })

    return {
      machineId,
      machineName: machine.name,
      slots,
    }
  }

  getAttachmentWorldTransform(attachmentId: AttachmentIdValue): {
    position: Vec3
    rotationY: number
  } | null {
    const attachment = this.attachments.get(attachmentId)
    if (!attachment) {
      return null
    }

    if (
      attachment.lifecycleState === AttachmentLifecycleState.Attached &&
      attachment.mountedOn
    ) {
      const machineTransform = this.machinePositionProvider?.(
        attachment.mountedOn.machineId,
      )
      if (!machineTransform) {
        return null
      }

      const offset =
        ATTACHMENT_SLOT_OFFSETS[attachment.mountedOn.slotId] ??
        ATTACHMENT_SLOT_OFFSETS[MachineSlotId.RearHitch]
      const cos = Math.cos(machineTransform.rotationY)
      const sin = Math.sin(machineTransform.rotationY)
      const localX = offset.x
      const localZ = offset.z

      return {
        position: {
          x:
            machineTransform.position.x +
            localX * cos +
            localZ * sin,
          y: machineTransform.position.y + offset.y,
          z:
            machineTransform.position.z +
            (-localX * sin + localZ * cos),
        },
        rotationY: machineTransform.rotationY,
      }
    }

    return {
      position: { ...attachment.position },
      rotationY: attachment.rotationY,
    }
  }

  private computeDetachPosition(machineTransform: {
    position: Vec3
    rotationY: number
  }): Vec3 {
    const cos = Math.cos(machineTransform.rotationY)
    const sin = Math.sin(machineTransform.rotationY)
    const localX = DETACH_OFFSET.x
    const localZ = DETACH_OFFSET.z

    return {
      x:
        machineTransform.position.x +
        localX * cos +
        localZ * sin,
      y: machineTransform.position.y,
      z:
        machineTransform.position.z +
        (-localX * sin + localZ * cos),
    }
  }

  private reconcileMounts(): void {
    const occupiedSlots = new Set<string>()

    for (const attachment of this.attachments.values()) {
      if (attachment.lifecycleState !== AttachmentLifecycleState.Attached) {
        attachment.mountedOn = null
        if (attachment.lifecycleState !== AttachmentLifecycleState.Detached) {
          attachment.lifecycleState = AttachmentLifecycleState.Detached
        }
        continue
      }

      if (!attachment.mountedOn) {
        attachment.lifecycleState = AttachmentLifecycleState.Detached
        this.placeAtYard(attachment)
        continue
      }

      const { machineId, slotId } = attachment.mountedOn
      const slotKey = `${machineId}:${slotId}`

      if (
        occupiedSlots.has(slotKey) ||
        !getMachineCatalogEntry(machineId) ||
        !slotAcceptsAttachmentType(
          machineId,
          slotId,
          attachment.attachmentType,
        )
      ) {
        attachment.lifecycleState = AttachmentLifecycleState.Detached
        attachment.mountedOn = null
        this.placeAtYard(attachment)
        continue
      }

      occupiedSlots.add(slotKey)
    }
  }

  private placeAtYard(attachment: AttachmentEntity): void {
    const yardPosition = getEquipmentYardSpawnPositions()[attachment.id] ?? {
      x: 16,
      y: 0,
      z: 18,
    }
    attachment.position = getGroundedPosition(yardPosition.x, yardPosition.z)
    attachment.rotationY = 0
  }

  private isMachineIdle(machineId: MachineId): boolean {
    return this.machineIdleChecker?.(machineId) ?? true
  }

  private normalizeAttachmentSave(
    item: AttachmentSaveData,
  ): AttachmentEntity | null {
    if (!item || typeof item !== 'object') {
      return null
    }

    const id = isAttachmentId(item.attachmentId) ? item.attachmentId : null
    if (!id) {
      return null
    }

    const spawn = DEFAULT_ATTACHMENT_SPAWNS.find((entry) => entry.id === id)
    const catalogId = (spawn?.catalogId ?? item.catalogId) as AttachmentCatalogIdValue
    const catalog = getAttachmentCatalogEntry(catalogId)
    if (!catalog) {
      return null
    }

    const lifecycleState =
      item.lifecycleState === AttachmentLifecycleState.Attached
        ? AttachmentLifecycleState.Attached
        : AttachmentLifecycleState.Detached

    const position =
      item.position &&
      typeof item.position.x === 'number' &&
      typeof item.position.y === 'number' &&
      typeof item.position.z === 'number'
        ? groundSavedPosition(item.position)
        : getGroundedPosition(
            (getEquipmentYardSpawnPositions()[id] ?? { x: 16, z: 18 }).x,
            (getEquipmentYardSpawnPositions()[id] ?? { x: 16, z: 18 }).z,
          )

    const rotationY =
      typeof item.rotationY === 'number' ? item.rotationY : 0

    const workPosition =
      item.workPosition === AttachmentWorkPosition.Working
        ? AttachmentWorkPosition.Working
        : AttachmentWorkPosition.Transport

    let mountedOn: AttachmentMountedOn | null = null
    if (
      lifecycleState === AttachmentLifecycleState.Attached &&
      item.mountedOn &&
      typeof item.mountedOn.machineId === 'string' &&
      typeof item.mountedOn.slotId === 'string'
    ) {
      mountedOn = {
        machineId: item.mountedOn.machineId as MachineId,
        slotId: item.mountedOn.slotId as MachineSlotIdValue,
      }
    }

    return {
      id,
      catalogId: catalog.id,
      attachmentType: catalog.attachmentType,
      lifecycleState,
      workPosition,
      position: { ...position },
      rotationY,
      mountedOn,
      cargo: this.restoreCargoFromContainers(
        catalog.attachmentType,
        catalog.id,
        item.containers,
      ),
    }
  }

  private toAttachmentSave(attachment: AttachmentEntity): AttachmentSaveData {
    return {
      attachmentId: attachment.id,
      attachmentType: attachment.attachmentType,
      catalogId: attachment.catalogId,
      lifecycleState: attachment.lifecycleState,
      position: { ...attachment.position },
      rotationY: attachment.rotationY,
      workPosition: attachment.workPosition,
      mountedOn: attachment.mountedOn
        ? {
            machineId: attachment.mountedOn.machineId,
            slotId: attachment.mountedOn.slotId,
          }
        : null,
      containers: this.cargoToContainers(attachment.cargo),
    }
  }

  private notifyChange(): void {
    this.onChange?.()
  }

  private notifyVisualChange(): void {
    this.onVisualChange?.()
  }
}

function isAttachmentId(value: string): value is AttachmentIdValue {
  return Object.values(AttachmentId).includes(value as AttachmentIdValue)
}
