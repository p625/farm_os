import type { WorldMapDocument } from '@/types/world-map.ts'
import type { MapValidationIssue } from '@/types/map-validation.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import { getSceneAnchors, parseSceneAnchorProperties } from '@/types/scene-anchor.ts'
import { getBuildingAssetDefinition } from '@/config/gameplay-asset-catalog.ts'
import {
  getAttachmentAssetDefinition,
  getMachineAssetDefinition,
  getRequiredAnchorTemplates,
} from '@/config/gameplay-asset-catalog.ts'
import { getBoxObjectFootprint } from '@/studio/validation/ObjectFootprint.ts'
import { parseSceneAnchorProperties as parseAnchor } from '@/types/scene-anchor.ts'

function childAnchors(
  map: WorldMapDocument,
  parentId: string,
): ReturnType<typeof getSceneAnchors> {
  return getSceneAnchors(map.objects).filter(
    (anchor) =>
      parseSceneAnchorProperties(anchor.properties)?.parentObjectId === parentId,
  )
}

function hasAnchorMatching(
  anchors: ReturnType<typeof getSceneAnchors>,
  template: { anchorKind: string; label: string; entityId?: string },
): boolean {
  return anchors.some((anchor) => {
    const props = parseSceneAnchorProperties(anchor.properties)
    if (!props) {
      return false
    }
    if (props.anchorKind !== template.anchorKind) {
      return false
    }
    if (template.entityId && props.entityId !== template.entityId) {
      return false
    }
    return props.label === template.label || !template.entityId
  })
}

export function validateGameplayAssets(
  map: WorldMapDocument,
  pushIssue: (issue: Omit<MapValidationIssue, 'id'>) => void,
): void {
  const anchorIds = new Set<string>()

  for (const anchor of getSceneAnchors(map.objects)) {
    if (anchorIds.has(anchor.id)) {
      pushIssue({
        ruleId: 'anchor-duplicate-id',
        severity: 'error',
        objectId: anchor.id,
        message: `Duplicate anchor id "${anchor.id}".`,
      })
    }
    anchorIds.add(anchor.id)

    const props = parseAnchor(anchor.properties)
    const parentId = props?.parentObjectId
    if (!parentId) {
      continue
    }
    const parent =
      map.objects.find((object) => object.id === parentId) ?? null
    if (!parent) {
      continue
    }
    const footprint = getBoxObjectFootprint(parent)
    if (!footprint) {
      continue
    }
    const dx = Math.abs(anchor.transform.position.x - footprint.centerX)
    const dz = Math.abs(anchor.transform.position.z - footprint.centerZ)
    const margin = 8
    if (dx > footprint.width * 0.5 + margin || dz > footprint.depth * 0.5 + margin) {
      pushIssue({
        ruleId: 'anchor-outside-parent',
        severity: 'warn',
        objectId: anchor.id,
        message: `Anchor "${props?.label ?? anchor.id}" is far outside parent "${parentId}".`,
        position: anchor.transform.position,
      })
    }
  }

  for (const object of map.objects) {
    if (object.layer === 'buildings') {
      const props = parseBuildingProperties(object.properties)
      if (!props) {
        continue
      }
      const asset = getBuildingAssetDefinition(props.buildingType)
      const anchors = childAnchors(map, object.id)
      for (const template of getRequiredAnchorTemplates(asset.defaultAnchors)) {
        if (!hasAnchorMatching(anchors, template)) {
          pushIssue({
            ruleId: 'building-missing-anchor',
            severity: 'error',
            objectId: object.id,
            message: `${object.name ?? object.id} missing required anchor: ${template.label} (${template.anchorKind}).`,
            layer: 'buildings',
            position: object.transform.position,
          })
        }
      }
    }

    if (object.layer === 'vehicles') {
      const props = parseVehiclePlacementProperties(object.properties)
      if (!props) {
        continue
      }
      const asset =
        props.placementKind === 'attachment' && props.attachmentCatalogId
          ? getAttachmentAssetDefinition(props.attachmentCatalogId)
          : props.machineId
            ? getMachineAssetDefinition(props.machineId)
            : null
      if (!asset) {
        continue
      }
      const anchors = childAnchors(map, object.id)
      for (const template of getRequiredAnchorTemplates(asset.defaultAnchors)) {
        const entityId =
          template.entityId === '{machineId}'
            ? props.machineId
            : template.entityId
        if (
          !hasAnchorMatching(anchors, {
            ...template,
            entityId,
          })
        ) {
          pushIssue({
            ruleId: 'machine-missing-anchor',
            severity: 'error',
            objectId: object.id,
            message: `${object.name ?? object.id} missing required anchor: ${template.label}.`,
            layer: 'vehicles',
            position: object.transform.position,
          })
        }
      }
    }
  }
}
