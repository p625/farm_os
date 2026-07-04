/**
 * Unified building catalog — single source of truth for runtime and FarmOS Studio.
 * Visual definitions live in BuildingTypePalette; anchor templates in asset-anchor-templates.
 */
import type { BuildingCategory, BuildingTypeId } from '@/types/building.ts'
import type { AssetAnchorTemplate } from '@/types/asset-definition.ts'
import { getBuildingAnchorTemplates } from '@/config/asset-anchor-templates.ts'
import {
  BUILDING_TYPES,
  type BuildingMeshStyle,
  type BuildingTypeDefinition,
  getBuildingTypeDefinition,
  getBuildingTypesByCategory,
  getBuildingTotalHeight,
  DEFAULT_BUILDING_TYPE,
} from '@/studio/building/BuildingTypePalette.ts'

export type BuildingCatalogEntry = BuildingTypeDefinition & {
  defaultAnchors: readonly AssetAnchorTemplate[]
}

export const BUILDING_CATALOG: readonly BuildingCatalogEntry[] = BUILDING_TYPES.map(
  (entry) => ({
    ...entry,
    defaultAnchors: getBuildingAnchorTemplates(entry.id),
  }),
)

export {
  BUILDING_TYPES,
  type BuildingMeshStyle,
  type BuildingTypeDefinition,
  getBuildingTypeDefinition,
  getBuildingTypesByCategory,
  getBuildingTotalHeight,
  DEFAULT_BUILDING_TYPE,
}

export function getBuildingCatalog(): readonly BuildingCatalogEntry[] {
  return BUILDING_CATALOG
}

export function getBuildingCatalogEntry(
  typeId: BuildingTypeId,
): BuildingCatalogEntry {
  const visual = getBuildingTypeDefinition(typeId)
  return {
    ...visual,
    defaultAnchors: getBuildingAnchorTemplates(typeId),
  }
}

export function getBuildingCatalogByCategory(
  category: BuildingCategory,
): readonly BuildingCatalogEntry[] {
  return getBuildingCatalog().filter((entry) => entry.category === category)
}
