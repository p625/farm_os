/**
 * Unified gameplay asset catalog — buildings, machines, attachments.
 * Studio and runtime both consume these catalogs; no duplicate asset lists in Studio.
 */
import { BUILDING_CATALOG, getBuildingCatalogEntry } from '@/config/building-catalog.ts'
import { MACHINE_CATALOG } from '@/config/machine-catalog.ts'
import { ATTACHMENT_CATALOG } from '@/config/attachment-catalog.ts'
import {
  getAttachmentAnchorTemplates,
  getBuildingAnchorTemplates,
  getMachineAnchorTemplates,
  getPlacementAnchorTemplates,
} from '@/config/asset-anchor-templates.ts'
import type { AssetAnchorTemplate, GameplayAssetDefinition } from '@/types/asset-definition.ts'
import type { BuildingTypeId } from '@/types/building.ts'

export function getMachineAssetDefinition(
  machineId: string,
): GameplayAssetDefinition {
  const entry = MACHINE_CATALOG.find((item) => item.id === machineId)
  return {
    id: machineId,
    category: 'machine',
    name: entry?.name ?? machineId,
    defaultAnchors: getMachineAnchorTemplates(machineId),
  }
}

export function getAttachmentAssetDefinition(
  catalogId: string,
): GameplayAssetDefinition {
  const entry = ATTACHMENT_CATALOG.find((item) => item.id === catalogId)
  return {
    id: catalogId,
    category: 'attachment',
    name: entry?.name ?? catalogId,
    defaultAnchors: getAttachmentAnchorTemplates(catalogId),
  }
}

export function getBuildingAssetDefinition(
  buildingType: BuildingTypeId,
): GameplayAssetDefinition {
  const entry = getBuildingCatalogEntry(buildingType)
  return {
    id: buildingType,
    category: 'building',
    name: entry.label,
    defaultAnchors: entry.defaultAnchors,
  }
}

export function getAllGameplayAssetDefinitions(): GameplayAssetDefinition[] {
  return [
    ...BUILDING_CATALOG.map((building) => ({
      id: building.id,
      category: 'building' as const,
      name: building.label,
      defaultAnchors: building.defaultAnchors,
    })),
    ...MACHINE_CATALOG.map((machine) => getMachineAssetDefinition(machine.id)),
    ...ATTACHMENT_CATALOG.map((attachment) =>
      getAttachmentAssetDefinition(attachment.id),
    ),
  ]
}

export function getRequiredAnchorTemplates(
  templates: readonly AssetAnchorTemplate[],
): readonly AssetAnchorTemplate[] {
  return templates.filter((template) => template.required)
}

export {
  getPlacementAnchorTemplates,
  getBuildingAnchorTemplates,
  getMachineAnchorTemplates,
  getAttachmentAnchorTemplates,
}
