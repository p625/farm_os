import type { BuildingCategory, BuildingTypeId } from '@/types/building.ts'

export type BuildingMeshStyle =
  | 'gable_house'
  | 'farm_house'
  | 'duplex_house'
  | 'church'
  | 'civic_tower'
  | 'flat_block'
  | 'shop_front'
  | 'barn'
  | 'silo'
  | 'shed'
  | 'mill'

export interface BuildingTypeDefinition {
  id: BuildingTypeId
  label: string
  category: BuildingCategory
  meshStyle: BuildingMeshStyle
  width: number
  depth: number
  wallHeight: number
  roofHeight: number
  wallColor: readonly [number, number, number]
  roofColor: readonly [number, number, number]
  trimColor: readonly [number, number, number]
}

export const BUILDING_TYPES: readonly BuildingTypeDefinition[] = [
  {
    id: 'house_family_small',
    label: 'Rodinný dům malý',
    category: 'house',
    meshStyle: 'gable_house',
    width: 8,
    depth: 9,
    wallHeight: 5.5,
    roofHeight: 2.8,
    wallColor: [0.78, 0.74, 0.68],
    roofColor: [0.42, 0.28, 0.22],
    trimColor: [0.55, 0.42, 0.32],
  },
  {
    id: 'house_family_standard',
    label: 'Rodinný dům standard',
    category: 'house',
    meshStyle: 'gable_house',
    width: 10,
    depth: 11,
    wallHeight: 6.2,
    roofHeight: 3.2,
    wallColor: [0.82, 0.78, 0.72],
    roofColor: [0.38, 0.3, 0.24],
    trimColor: [0.5, 0.38, 0.3],
  },
  {
    id: 'house_family_large',
    label: 'Rodinný dům velký',
    category: 'house',
    meshStyle: 'gable_house',
    width: 12,
    depth: 13,
    wallHeight: 7,
    roofHeight: 3.6,
    wallColor: [0.8, 0.76, 0.7],
    roofColor: [0.36, 0.28, 0.22],
    trimColor: [0.48, 0.36, 0.28],
  },
  {
    id: 'house_family_farm',
    label: 'Usedlost / statkářský dům',
    category: 'house',
    meshStyle: 'farm_house',
    width: 14,
    depth: 12,
    wallHeight: 6.8,
    roofHeight: 4,
    wallColor: [0.72, 0.66, 0.58],
    roofColor: [0.34, 0.26, 0.2],
    trimColor: [0.45, 0.34, 0.26],
  },
  {
    id: 'house_family_duplex',
    label: 'Dvojdomek',
    category: 'house',
    meshStyle: 'duplex_house',
    width: 16,
    depth: 10,
    wallHeight: 6,
    roofHeight: 3,
    wallColor: [0.76, 0.72, 0.66],
    roofColor: [0.4, 0.3, 0.24],
    trimColor: [0.52, 0.4, 0.32],
  },
  {
    id: 'civic_church',
    label: 'Kostel',
    category: 'civic',
    meshStyle: 'church',
    width: 14,
    depth: 22,
    wallHeight: 14,
    roofHeight: 6,
    wallColor: [0.86, 0.84, 0.8],
    roofColor: [0.32, 0.3, 0.34],
    trimColor: [0.62, 0.58, 0.54],
  },
  {
    id: 'civic_town_hall',
    label: 'Radnice',
    category: 'civic',
    meshStyle: 'civic_tower',
    width: 16,
    depth: 14,
    wallHeight: 9,
    roofHeight: 5,
    wallColor: [0.8, 0.76, 0.7],
    roofColor: [0.36, 0.28, 0.24],
    trimColor: [0.58, 0.48, 0.38],
  },
  {
    id: 'civic_hospital',
    label: 'Nemocnice',
    category: 'civic',
    meshStyle: 'flat_block',
    width: 24,
    depth: 18,
    wallHeight: 11,
    roofHeight: 1.2,
    wallColor: [0.88, 0.9, 0.92],
    roofColor: [0.5, 0.52, 0.54],
    trimColor: [0.7, 0.74, 0.78],
  },
  {
    id: 'civic_school',
    label: 'Škola',
    category: 'civic',
    meshStyle: 'civic_tower',
    width: 18,
    depth: 14,
    wallHeight: 7.5,
    roofHeight: 3.5,
    wallColor: [0.84, 0.8, 0.72],
    roofColor: [0.4, 0.32, 0.26],
    trimColor: [0.56, 0.44, 0.34],
  },
  {
    id: 'shop_grocery',
    label: 'Potraviny',
    category: 'commercial',
    meshStyle: 'shop_front',
    width: 8,
    depth: 10,
    wallHeight: 4.2,
    roofHeight: 2.2,
    wallColor: [0.74, 0.78, 0.72],
    roofColor: [0.38, 0.3, 0.24],
    trimColor: [0.52, 0.62, 0.48],
  },
  {
    id: 'shop_general',
    label: 'Smíšené zboží',
    category: 'commercial',
    meshStyle: 'shop_front',
    width: 7,
    depth: 9,
    wallHeight: 4,
    roofHeight: 2,
    wallColor: [0.78, 0.74, 0.68],
    roofColor: [0.4, 0.32, 0.26],
    trimColor: [0.55, 0.45, 0.35],
  },
  {
    id: 'shop_bakery',
    label: 'Pekařství',
    category: 'commercial',
    meshStyle: 'shop_front',
    width: 7,
    depth: 8,
    wallHeight: 4,
    roofHeight: 2.4,
    wallColor: [0.82, 0.72, 0.58],
    roofColor: [0.42, 0.28, 0.2],
    trimColor: [0.62, 0.42, 0.28],
  },
  {
    id: 'shop_butcher',
    label: 'Řeznictví',
    category: 'commercial',
    meshStyle: 'shop_front',
    width: 6,
    depth: 8,
    wallHeight: 3.8,
    roofHeight: 2,
    wallColor: [0.76, 0.7, 0.66],
    roofColor: [0.38, 0.28, 0.22],
    trimColor: [0.58, 0.32, 0.28],
  },
  {
    id: 'shop_cafe',
    label: 'Hospoda / kavárna',
    category: 'commercial',
    meshStyle: 'shop_front',
    width: 10,
    depth: 11,
    wallHeight: 5,
    roofHeight: 2.8,
    wallColor: [0.72, 0.66, 0.58],
    roofColor: [0.36, 0.28, 0.22],
    trimColor: [0.48, 0.38, 0.3],
  },
  {
    id: 'farm_barn',
    label: 'Stodola',
    category: 'farm',
    meshStyle: 'barn',
    width: 16,
    depth: 24,
    wallHeight: 8,
    roofHeight: 4,
    wallColor: [0.62, 0.52, 0.4],
    roofColor: [0.34, 0.28, 0.22],
    trimColor: [0.48, 0.38, 0.28],
  },
  {
    id: 'farm_silo',
    label: 'Silo',
    category: 'farm',
    meshStyle: 'silo',
    width: 6,
    depth: 6,
    wallHeight: 14,
    roofHeight: 2,
    wallColor: [0.72, 0.72, 0.74],
    roofColor: [0.48, 0.5, 0.52],
    trimColor: [0.58, 0.6, 0.62],
  },
  {
    id: 'farm_shed',
    label: 'Přístřešek / kůlna',
    category: 'farm',
    meshStyle: 'shed',
    width: 6,
    depth: 8,
    wallHeight: 3.5,
    roofHeight: 1.8,
    wallColor: [0.58, 0.5, 0.42],
    roofColor: [0.36, 0.3, 0.24],
    trimColor: [0.44, 0.36, 0.28],
  },
  {
    id: 'farm_mill',
    label: 'Mlýn',
    category: 'farm',
    meshStyle: 'mill',
    width: 10,
    depth: 12,
    wallHeight: 7,
    roofHeight: 4,
    wallColor: [0.7, 0.66, 0.6],
    roofColor: [0.38, 0.3, 0.24],
    trimColor: [0.5, 0.42, 0.34],
  },
] as const

export const DEFAULT_BUILDING_TYPE: BuildingTypeId = 'house_family_standard'

export function getBuildingTypeDefinition(
  typeId: BuildingTypeId,
): BuildingTypeDefinition {
  return (
    BUILDING_TYPES.find((entry) => entry.id === typeId) ?? BUILDING_TYPES[1]
  )
}

export function getBuildingTypesByCategory(
  category: BuildingCategory,
): readonly BuildingTypeDefinition[] {
  return BUILDING_TYPES.filter((entry) => entry.category === category)
}

export function getBuildingTotalHeight(definition: BuildingTypeDefinition): number {
  return definition.wallHeight + definition.roofHeight
}
