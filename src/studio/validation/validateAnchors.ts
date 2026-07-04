import type { WorldMapDocument } from '@/types/world-map.ts'
import type { MapValidationIssue } from '@/types/map-validation.ts'
import { getSceneAnchors, parseSceneAnchorProperties } from '@/types/scene-anchor.ts'
import {
  getBuildingsMissingRequiredAnchors,
  getVehiclesMissingParking,
} from '@/studio/anchor/anchorHubExport.ts'
import { getBoxObjectFootprint } from '@/studio/validation/ObjectFootprint.ts'

let anchorIssueCounter = 0

function pushAnchorIssue(
  issues: MapValidationIssue[],
  issue: Omit<MapValidationIssue, 'id'>,
): void {
  anchorIssueCounter += 1
  issues.push({
    id: `${issue.ruleId}_${issue.objectId ?? anchorIssueCounter}`,
    ...issue,
  })
}

export function validateSceneAnchors(
  map: WorldMapDocument,
  issues: MapValidationIssue[],
): void {
  for (const building of getBuildingsMissingRequiredAnchors(map)) {
    pushAnchorIssue(issues, {
      ruleId: 'building-missing-entry',
      severity: 'error',
      message: `Building "${building.name}" has no Entry or Interaction anchor.`,
      objectId: building.buildingId,
      layer: 'buildings',
    })
  }

  for (const vehicle of getVehiclesMissingParking(map)) {
    pushAnchorIssue(issues, {
      ruleId: 'vehicle-missing-parking',
      severity: 'error',
      message: `Vehicle "${vehicle.name}" has no Parking anchor.`,
      objectId: vehicle.vehicleId,
      layer: 'vehicles',
    })
  }

  for (const anchor of getSceneAnchors(map.objects)) {
    const props = parseSceneAnchorProperties(anchor.properties)
    if (!props?.parentObjectId) {
      continue
    }
    const parent = map.objects.find((object) => object.id === props.parentObjectId)
    if (!parent) {
      pushAnchorIssue(issues, {
        ruleId: 'anchor-orphan',
        severity: 'warn',
        message: `Anchor "${anchor.name ?? anchor.id}" references missing parent "${props.parentObjectId}".`,
        objectId: anchor.id,
        layer: 'poi',
        position: anchor.transform.position,
      })
      continue
    }

    if (parent.layer === 'buildings') {
      const parentFootprint = getBoxObjectFootprint(parent)
      if (parentFootprint) {
        const ax = anchor.transform.position.x
        const az = anchor.transform.position.z
        const margin = 8
        if (
          ax < parentFootprint.minX - margin ||
          ax > parentFootprint.maxX + margin ||
          az < parentFootprint.minZ - margin ||
          az > parentFootprint.maxZ + margin
        ) {
          pushAnchorIssue(issues, {
            ruleId: 'anchor-outside-building',
            severity: 'warn',
            message: `Anchor "${props.label}" is far from building "${parent.name ?? parent.id}".`,
            objectId: anchor.id,
            layer: 'poi',
            position: anchor.transform.position,
          })
        }
      }
    }
  }
}
