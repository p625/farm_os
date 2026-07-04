import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import { getAttachmentCatalogEntry } from '@/config/attachment-catalog.ts'
import type { WorldMapDocument } from '@/types/world-map.ts'
import type { MapValidationIssue } from '@/types/map-validation.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import { getAnchorsForParent } from '@/types/scene-anchor.ts'
import { isSelfPropelledPlacement } from '@/studio/catalog/StudioPlacementCatalog.ts'
import { getStudioPlacementEntry } from '@/studio/catalog/StudioPlacementCatalog.ts'

function isResolvableMachineInstanceId(
  machineId: string,
  placementCatalogId?: string,
): boolean {
  if (getMachineCatalogEntry(machineId)) {
    return true
  }

  const placementEntry = placementCatalogId
    ? getStudioPlacementEntry(placementCatalogId)
    : undefined
  const catalogMachineId = placementEntry?.machineId
  if (!catalogMachineId || placementEntry?.catalogKind !== 'machine') {
    return false
  }

  if (machineId === catalogMachineId) {
    return true
  }

  const family = catalogMachineId.replace(/_\d+$/, '')
  const pattern = new RegExp(`^${family}_\\d+$`)
  return pattern.test(machineId)
}

export function validateMachinePlacements(
  map: WorldMapDocument,
  pushIssue: (issue: Omit<MapValidationIssue, 'id'>) => void,
): void {
  const machineIds = new Map<string, string[]>()

  for (const object of map.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const props = parseVehiclePlacementProperties(object.properties)
    if (!props) {
      pushIssue({
        ruleId: 'machine-invalid-properties',
        severity: 'error',
        objectId: object.id,
        message: `Vehicle "${object.name ?? object.id}" has invalid placement metadata.`,
      })
      continue
    }

    if (props.placementKind === 'attachment') {
      if (!props.attachmentCatalogId) {
        pushIssue({
          ruleId: 'attachment-missing-catalog',
          severity: 'error',
          objectId: object.id,
          message: `Attachment placement "${object.name ?? object.id}" is missing attachmentCatalogId.`,
        })
        continue
      }
      if (!getAttachmentCatalogEntry(props.attachmentCatalogId)) {
        pushIssue({
          ruleId: 'attachment-unknown-catalog',
          severity: 'error',
          objectId: object.id,
          message: `Attachment "${props.attachmentCatalogId}" is not in ATTACHMENT_CATALOG.`,
        })
      }
      if (
        props.vehicleType === 'tractor' ||
        props.placementCatalogId?.startsWith('machine:')
      ) {
        pushIssue({
          ruleId: 'implement-wrong-category',
          severity: 'warn',
          objectId: object.id,
          message: `Implement "${object.name ?? object.id}" should use attachment catalog placement.`,
        })
      }
      continue
    }

    const machineId = props.machineId
    if (machineId) {
      if (!isResolvableMachineInstanceId(machineId, props.placementCatalogId)) {
        pushIssue({
          ruleId: 'machine-unknown-id',
          severity: 'error',
          objectId: object.id,
          message: `Machine id "${machineId}" is not registered in MACHINE_CATALOG.`,
        })
      }
      const owners = machineIds.get(machineId) ?? []
      owners.push(object.id)
      machineIds.set(machineId, owners)
    }

    const catalogEntry = props.placementCatalogId
      ? getStudioPlacementEntry(props.placementCatalogId)
      : undefined
    if (catalogEntry && isSelfPropelledPlacement(catalogEntry)) {
      const anchors = getAnchorsForParent(map.objects, object.id)
      const hasParking = anchors.some(
        (anchor) => anchor.properties?.anchorKind === 'parking',
      )
      const hasSpawn = anchors.some(
        (anchor) => anchor.properties?.anchorKind === 'spawn',
      )
      if (!hasParking || !hasSpawn) {
        pushIssue({
          ruleId: 'machine-missing-anchor',
          severity: 'warn',
          objectId: object.id,
          message: `Self-propelled machine "${object.name ?? object.id}" should have parking and spawn anchors.`,
        })
      }
    }
  }

  for (const [machineId, objectIds] of machineIds) {
    if (machineId.endsWith('_1') && objectIds.length > 1) {
      pushIssue({
        ruleId: 'machine-duplicate-id',
        severity: 'warn',
        message: `Machine id "${machineId}" is used by ${objectIds.length} placements (${objectIds.join(', ')}).`,
        objectId: objectIds[1],
      })
    }
  }
}
