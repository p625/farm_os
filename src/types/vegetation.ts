export const VEGETATION_HEIGHT_CLASSES = ['low', 'medium', 'tall'] as const
export const VEGETATION_SPREAD_CLASSES = ['narrow', 'wide'] as const
export const VEGETATION_KINDS = ['shrub', 'tree', 'grass'] as const

export type VegetationHeightClass = (typeof VEGETATION_HEIGHT_CLASSES)[number]
export type VegetationSpreadClass = (typeof VEGETATION_SPREAD_CLASSES)[number]
export type VegetationKind = (typeof VEGETATION_KINDS)[number]

export const VEGETATION_TYPE_IDS = [
  'shrub_low_narrow',
  'shrub_low_wide',
  'shrub_medium_narrow',
  'shrub_medium_wide',
  'tree_medium_narrow',
  'tree_medium_wide',
  'tree_tall_narrow',
  'tree_tall_wide',
  'grass_short',
  'grass_medium',
  'grass_tall',
] as const

export type VegetationTypeId = (typeof VEGETATION_TYPE_IDS)[number]

export interface VegetationProperties {
  vegetationType: VegetationTypeId
  heightClass: VegetationHeightClass
  spreadClass: VegetationSpreadClass
}

export function isVegetationTypeId(value: unknown): value is VegetationTypeId {
  return (
    typeof value === 'string' &&
    (VEGETATION_TYPE_IDS as readonly string[]).includes(value)
  )
}

export function parseVegetationProperties(
  properties: Record<string, unknown> | undefined,
): VegetationProperties | null {
  if (!properties || !isVegetationTypeId(properties.vegetationType)) {
    return null
  }
  const heightClass = properties.heightClass
  const spreadClass = properties.spreadClass
  if (
    typeof heightClass !== 'string' ||
    !(VEGETATION_HEIGHT_CLASSES as readonly string[]).includes(heightClass) ||
    typeof spreadClass !== 'string' ||
    !(VEGETATION_SPREAD_CLASSES as readonly string[]).includes(spreadClass)
  ) {
    return null
  }
  return {
    vegetationType: properties.vegetationType,
    heightClass: heightClass as VegetationHeightClass,
    spreadClass: spreadClass as VegetationSpreadClass,
  }
}
