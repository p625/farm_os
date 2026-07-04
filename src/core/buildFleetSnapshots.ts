import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import { FIELD_LAYOUT, FARM_HUB } from '@/config/map-01-layout.ts'
import { getMachineTemplateDefinition } from '@/config/machine-template-catalog.ts'
import type { AttachmentSystem } from '@systems/AttachmentSystem.ts'
import type { MachineRegistry } from '@systems/MachineRegistry.ts'
import { getMachineTemplateId } from '@systems/MachineInstanceRegistry.ts'
import type { FieldSnapshot } from '@/types/field.ts'
import {
  deriveMachineFleetStatus,
  resolveGpsAvailable,
  type FleetMachineSnapshot,
} from '@/types/machine-fleet.ts'
import type { WorkOrderSnapshot } from '@/types/work-order.ts'
import { CommandOwner } from '@/types/machine-automation.ts'
import {
  MachineTemplateId,
  type MachineTemplateId as MachineTemplateIdValue,
} from '@/types/machine-template.ts'
import type { MachineCapability, MachineId } from '@/types/machine.ts'
import { MachineSlotId } from '@/types/attachment.ts'
import type { MachineAttachmentsSnapshot } from '@/types/attachment.ts'
import { TractorState, type TractorJobSnapshot } from '@/types/tractor.ts'

const TEMPLATE_SORT_ORDER: Record<MachineTemplateIdValue, number> = {
  [MachineTemplateId.SmallTractor]: 0,
  [MachineTemplateId.GrainCombine]: 1,
  [MachineTemplateId.CornCombine]: 2,
}

const SLOT_ATTACHMENT_PRIORITY = [
  MachineSlotId.HeaderSlot,
  MachineSlotId.RearHitch,
  MachineSlotId.TrailerHitch,
  MachineSlotId.FrontHitch,
] as const

function isInsideRect(
  x: number,
  z: number,
  centerX: number,
  centerZ: number,
  halfWidth: number,
  halfDepth: number,
): boolean {
  return (
    x >= centerX - halfWidth &&
    x <= centerX + halfWidth &&
    z >= centerZ - halfDepth &&
    z <= centerZ + halfDepth
  )
}

export function resolveMachineLocationLabel(
  position: { x: number; z: number },
  activeJob: TractorJobSnapshot | null,
  fields: readonly FieldSnapshot[],
): string {
  if (activeJob?.fieldName) {
    return activeJob.fieldName
  }

  for (const entry of FIELD_LAYOUT) {
    const halfW = entry.meshSize.width / 2
    const halfD = entry.meshSize.depth / 2
    if (
      isInsideRect(
        position.x,
        position.z,
        entry.position.x,
        entry.position.z,
        halfW,
        halfD,
      )
    ) {
      const field = fields.find((candidate) => candidate.id === entry.id)
      return field?.name ?? entry.id
    }
  }

  const hub = FARM_HUB.farmyard
  const hubHalfW = hub.size.width / 2
  const hubHalfD = hub.size.depth / 2
  if (
    isInsideRect(
      position.x,
      position.z,
      hub.position.x,
      hub.position.z,
      hubHalfW,
      hubHalfD,
    )
  ) {
    return 'Farmyard'
  }

  let nearestName: string | null = null
  let nearestDistanceSq = Number.POSITIVE_INFINITY
  for (const entry of FIELD_LAYOUT) {
    const dx = position.x - entry.position.x
    const dz = position.z - entry.position.z
    const distanceSq = dx * dx + dz * dz
    if (distanceSq < nearestDistanceSq) {
      nearestDistanceSq = distanceSq
      const field = fields.find((candidate) => candidate.id === entry.id)
      nearestName = field?.name ?? entry.id
    }
  }

  if (nearestName !== null && nearestDistanceSq <= 30 * 30) {
    return nearestName
  }

  return 'Farmyard'
}

function collectAttachmentNames(
  attachments: MachineAttachmentsSnapshot | null,
): string[] {
  if (!attachments) {
    return []
  }

  const names: string[] = []
  for (const slotId of SLOT_ATTACHMENT_PRIORITY) {
    const slot = attachments.slots.find((candidate) => candidate.slotId === slotId)
    if (slot?.attachmentName) {
      names.push(slot.attachmentName)
    }
  }
  return names
}

function resolveDestinationLabel(
  state: (typeof TractorState)[keyof typeof TractorState],
  activeJob: TractorJobSnapshot | null,
): string | null {
  if (state !== TractorState.Moving || !activeJob?.fieldName) {
    return null
  }
  return activeJob.fieldName
}

export function buildFleetSnapshots(options: {
  machineRegistry: MachineRegistry
  attachmentSystem: AttachmentSystem
  fields: readonly FieldSnapshot[]
  selectedMachineId: MachineId | null
  getCropName: (cropId: string) => string
  getCommandOwner: (machineId: MachineId) => CommandOwner
  getEffectiveCapabilities: (machineId: MachineId) => readonly MachineCapability[]
  getWorkOrderForMachine: (machineId: MachineId) => WorkOrderSnapshot | null
}): readonly FleetMachineSnapshot[] {
  const {
    machineRegistry,
    attachmentSystem,
    fields,
    selectedMachineId,
    getCropName,
    getCommandOwner,
    getEffectiveCapabilities,
    getWorkOrderForMachine,
  } = options

  const snapshots: FleetMachineSnapshot[] = []

  for (const controller of machineRegistry.getAll()) {
    const machineId = controller.machineId
    const templateId = getMachineTemplateId(machineId)
    if (!templateId) {
      continue
    }

    const catalog = getMachineCatalogEntry(machineId)
    const template = getMachineTemplateDefinition(templateId)
    const operation = controller.toSnapshot()
    const attachments = attachmentSystem.toMachineAttachmentsSnapshot(machineId)
    const locationLabel = resolveMachineLocationLabel(
      operation.position,
      operation.activeJob,
      fields,
    )

    const commandOwner = getCommandOwner(machineId)
    const capabilities = getEffectiveCapabilities(machineId)

    snapshots.push({
      machineId,
      displayName: catalog?.name ?? machineId,
      templateId,
      templateName: template?.name ?? templateId,
      status: deriveMachineFleetStatus(operation),
      activeJob: operation.activeJob,
      attachmentNames: collectAttachmentNames(attachments),
      fieldName: locationLabel,
      destinationLabel: resolveDestinationLabel(
        operation.state,
        operation.activeJob,
      ),
      logisticsLabel: operation.activeLogisticsLabel,
      workProgress: operation.workProgress,
      workRemainingSeconds: operation.workRemainingSeconds,
      grainBin: controller.getGrainBinSnapshot?.() ?? null,
      trailerFill: attachmentSystem.getMountedTrailerCargoSnapshot(
        machineId,
        getCropName,
      ),
      selected: selectedMachineId === machineId,
      commandOwner,
      gpsAvailable: resolveGpsAvailable(capabilities),
      workerName: null,
      fuelLabel: '—',
      workOrder: getWorkOrderForMachine(machineId),
    })
  }

  snapshots.sort((left, right) => {
    const orderDelta =
      (TEMPLATE_SORT_ORDER[left.templateId] ?? 99) -
      (TEMPLATE_SORT_ORDER[right.templateId] ?? 99)
    if (orderDelta !== 0) {
      return orderDelta
    }
    return left.displayName.localeCompare(right.displayName)
  })

  return snapshots
}
