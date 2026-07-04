import {
  MachineTemplateId,
  STARTER_MACHINE_INSTANCES,
  type MachineTemplateId as MachineTemplateIdValue,
} from '@/types/machine-template.ts'
import { MachineId } from '@/types/machine.ts'
import {
  getMachineTemplateDefinition,
} from '@/config/machine-template-catalog.ts'
import type { MachineCatalogEntry, MachineSlotDefinition } from '@/types/machine-catalog-entry.ts'

const runtimeInstances = new Map<string, MachineTemplateIdValue>()

export function initializeMachineInstanceRegistry(): void {
  runtimeInstances.clear()
  for (const [instanceId, templateId] of Object.entries(
    STARTER_MACHINE_INSTANCES,
  )) {
    runtimeInstances.set(instanceId, templateId)
  }
}

export function registerMachineInstance(
  instanceId: string,
  templateId: MachineTemplateIdValue,
): void {
  runtimeInstances.set(instanceId, templateId)
}

export function unregisterMachineInstance(instanceId: string): void {
  if (instanceId in STARTER_MACHINE_INSTANCES) {
    return
  }
  runtimeInstances.delete(instanceId)
}

export function getMachineTemplateId(
  instanceId: string,
): MachineTemplateIdValue | null {
  return runtimeInstances.get(instanceId) ?? null
}

export function getAllMachineInstanceIds(): string[] {
  return [...runtimeInstances.keys()]
}

export function getPurchasedTractorInstanceIds(): string[] {
  return getAllMachineInstanceIds().filter(
    (id) => id.startsWith('tractor_') && id !== MachineId.Tractor1,
  )
}

export function allocateNextTractorInstanceId(): string {
  let max = 1
  for (const id of runtimeInstances.keys()) {
    const match = /^tractor_(\d+)$/.exec(id)
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10))
    }
  }
  return `tractor_${max + 1}`
}

export function buildCatalogEntryForInstance(
  instanceId: string,
): MachineCatalogEntry | undefined {
  const templateId = getMachineTemplateId(instanceId)
  if (!templateId) {
    return undefined
  }

  const template = getMachineTemplateDefinition(templateId)
  if (!template) {
    return undefined
  }

  const isStarterTractor =
    instanceId === MachineId.Tractor1 &&
    templateId === MachineTemplateId.SmallTractor

  return {
    id: instanceId,
    name:
      instanceId === MachineId.Tractor1
        ? 'Tractor'
        : `${template.name} #${instanceId.split('_').pop()}`,
    capabilities: [...template.capabilities],
    slots: template.slots.map(
      (slot): MachineSlotDefinition => ({
        id: slot.id,
        label: slot.label,
        acceptedTypes: [...slot.acceptedTypes],
      }),
    ),
    sceneNodeName: isStarterTractor ? 'tractor' : instanceId,
    bodyMeshName: isStarterTractor ? 'tractorBody' : `${instanceId}_body`,
  }
}
