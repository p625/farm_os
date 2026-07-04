export const BUILDING_CATEGORIES = [
  'house',
  'civic',
  'commercial',
  'farm',
] as const

export type BuildingCategory = (typeof BUILDING_CATEGORIES)[number]

export const BUILDING_TYPE_IDS = [
  'house_family_small',
  'house_family_standard',
  'house_family_large',
  'house_family_farm',
  'house_family_duplex',
  'civic_church',
  'civic_town_hall',
  'civic_hospital',
  'civic_school',
  'shop_grocery',
  'shop_general',
  'shop_bakery',
  'shop_butcher',
  'shop_cafe',
  'farm_barn',
  'farm_silo',
  'farm_shed',
  'farm_mill',
] as const

export type BuildingTypeId = (typeof BUILDING_TYPE_IDS)[number]

export function isBuildingTypeId(value: unknown): value is BuildingTypeId {
  return (
    typeof value === 'string' &&
    (BUILDING_TYPE_IDS as readonly string[]).includes(value)
  )
}

export interface BuildingProperties {
  buildingType: BuildingTypeId
  category: BuildingCategory
  owner?: string
  active?: boolean
  /** Scene anchor MapObject ids owned by this building */
  anchorIds?: string[]
}

export function parseBuildingProperties(
  properties: Record<string, unknown> | undefined,
): BuildingProperties | null {
  if (!properties || !isBuildingTypeId(properties.buildingType)) {
    return null
  }
  const category = properties.category
  if (
    typeof category !== 'string' ||
    !(BUILDING_CATEGORIES as readonly string[]).includes(category)
  ) {
    return null
  }
  return {
    buildingType: properties.buildingType,
    category: category as BuildingCategory,
    owner: typeof properties.owner === 'string' ? properties.owner : undefined,
    active: properties.active !== false,
    anchorIds: Array.isArray(properties.anchorIds)
      ? properties.anchorIds.filter((id): id is string => typeof id === 'string')
      : undefined,
  }
}
