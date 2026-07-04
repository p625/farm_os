import type { WorldMapDocument } from '@/types/world-map.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import type { StudioPlacementEntry } from '@/studio/catalog/StudioPlacementCatalog.ts'
import { MachineId } from '@/types/machine.ts'

function collectUsedMachineIds(map: WorldMapDocument): Set<string> {
  const used = new Set<string>()
  for (const object of map.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const props = parseVehiclePlacementProperties(object.properties)
    if (props?.machineId) {
      used.add(props.machineId)
    }
  }
  return used
}

function collectUsedAttachmentInstanceIds(map: WorldMapDocument): Set<string> {
  const used = new Set<string>()
  for (const object of map.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const props = parseVehiclePlacementProperties(object.properties)
    if (props?.attachmentInstanceId) {
      used.add(props.attachmentInstanceId)
    }
  }
  return used
}

export function allocateMapMachineInstanceId(
  map: WorldMapDocument,
  entry: StudioPlacementEntry,
): string | undefined {
  if (entry.catalogKind !== 'machine' || !entry.machineId) {
    return undefined
  }

  const used = collectUsedMachineIds(map)
  const base = entry.machineId
  if (!used.has(base)) {
    return base
  }

  if (base.startsWith('tractor_')) {
    let max = 1
    for (const id of used) {
      const match = /^tractor_(\d+)$/.exec(id)
      if (match) {
        max = Math.max(max, Number.parseInt(match[1], 10))
      }
    }
    return `tractor_${max + 1}`
  }

  return base
}

export function allocateMapAttachmentInstanceId(
  map: WorldMapDocument,
  catalogId: string,
): string {
  const used = collectUsedAttachmentInstanceIds(map)
  const base = `${catalogId}_1`
  if (!used.has(base)) {
    return base
  }

  let max = 1
  const prefix = `${catalogId}_`
  for (const id of used) {
    if (!id.startsWith(prefix)) {
      continue
    }
    const match = /^(.+)_(\d+)$/.exec(id)
    if (match && match[1] === catalogId) {
      max = Math.max(max, Number.parseInt(match[2], 10))
    }
  }
  return `${catalogId}_${max + 1}`
}

export function starterMachineIds(): readonly string[] {
  return [
    MachineId.Tractor1,
    MachineId.GrainCombine1,
    MachineId.CornCombine1,
  ]
}
