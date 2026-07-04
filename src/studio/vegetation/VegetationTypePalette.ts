import type {
  VegetationHeightClass,
  VegetationKind,
  VegetationSpreadClass,
  VegetationTypeId,
} from '@/types/vegetation.ts'

export interface VegetationTypeDefinition {
  id: VegetationTypeId
  label: string
  kind: VegetationKind
  heightClass: VegetationHeightClass
  spreadClass: VegetationSpreadClass
  /** Total height in meters (grass blade/patch height). */
  height: number
  /** Canopy or patch diameter in meters. */
  canopyWidth: number
  /** Minimum spacing when painting (meters). */
  paintSpacing: number
  foliageColor: readonly [number, number, number]
  trunkColor: readonly [number, number, number]
}

export const VEGETATION_TYPES: readonly VegetationTypeDefinition[] = [
  {
    id: 'shrub_low_narrow',
    label: 'Keř nízký úzký',
    kind: 'shrub',
    heightClass: 'low',
    spreadClass: 'narrow',
    height: 1.2,
    canopyWidth: 1.0,
    paintSpacing: 1.4,
    foliageColor: [0.22, 0.48, 0.2],
    trunkColor: [0.35, 0.28, 0.18],
  },
  {
    id: 'shrub_low_wide',
    label: 'Keř nízký široký',
    kind: 'shrub',
    heightClass: 'low',
    spreadClass: 'wide',
    height: 1.2,
    canopyWidth: 2.2,
    paintSpacing: 2.0,
    foliageColor: [0.24, 0.5, 0.22],
    trunkColor: [0.35, 0.28, 0.18],
  },
  {
    id: 'shrub_medium_narrow',
    label: 'Keř střední úzký',
    kind: 'shrub',
    heightClass: 'medium',
    spreadClass: 'narrow',
    height: 2.0,
    canopyWidth: 1.6,
    paintSpacing: 1.8,
    foliageColor: [0.2, 0.46, 0.19],
    trunkColor: [0.38, 0.3, 0.2],
  },
  {
    id: 'shrub_medium_wide',
    label: 'Keř střední široký',
    kind: 'shrub',
    heightClass: 'medium',
    spreadClass: 'wide',
    height: 2.0,
    canopyWidth: 2.8,
    paintSpacing: 2.4,
    foliageColor: [0.22, 0.48, 0.2],
    trunkColor: [0.38, 0.3, 0.2],
  },
  {
    id: 'tree_medium_narrow',
    label: 'Strom střední úzký',
    kind: 'tree',
    heightClass: 'medium',
    spreadClass: 'narrow',
    height: 5.5,
    canopyWidth: 2.8,
    paintSpacing: 3.5,
    foliageColor: [0.18, 0.42, 0.16],
    trunkColor: [0.42, 0.32, 0.22],
  },
  {
    id: 'tree_medium_wide',
    label: 'Strom střední široký',
    kind: 'tree',
    heightClass: 'medium',
    spreadClass: 'wide',
    height: 5.5,
    canopyWidth: 4.5,
    paintSpacing: 5.0,
    foliageColor: [0.2, 0.44, 0.17],
    trunkColor: [0.42, 0.32, 0.22],
  },
  {
    id: 'tree_tall_narrow',
    label: 'Strom vysoký úzký',
    kind: 'tree',
    heightClass: 'tall',
    spreadClass: 'narrow',
    height: 9.0,
    canopyWidth: 3.2,
    paintSpacing: 4.0,
    foliageColor: [0.16, 0.4, 0.15],
    trunkColor: [0.45, 0.34, 0.24],
  },
  {
    id: 'tree_tall_wide',
    label: 'Strom vysoký široký',
    kind: 'tree',
    heightClass: 'tall',
    spreadClass: 'wide',
    height: 9.0,
    canopyWidth: 6.0,
    paintSpacing: 6.5,
    foliageColor: [0.18, 0.42, 0.16],
    trunkColor: [0.45, 0.34, 0.24],
  },
  {
    id: 'grass_short',
    label: 'Tráva nízká',
    kind: 'grass',
    heightClass: 'low',
    spreadClass: 'wide',
    height: 0.14,
    canopyWidth: 1.2,
    paintSpacing: 0.65,
    foliageColor: [0.3, 0.56, 0.24],
    trunkColor: [0.22, 0.4, 0.18],
  },
  {
    id: 'grass_medium',
    label: 'Tráva střední',
    kind: 'grass',
    heightClass: 'medium',
    spreadClass: 'wide',
    height: 0.28,
    canopyWidth: 1.5,
    paintSpacing: 0.8,
    foliageColor: [0.26, 0.52, 0.22],
    trunkColor: [0.2, 0.38, 0.17],
  },
  {
    id: 'grass_tall',
    label: 'Tráva vysoká',
    kind: 'grass',
    heightClass: 'tall',
    spreadClass: 'wide',
    height: 0.48,
    canopyWidth: 1.8,
    paintSpacing: 1.0,
    foliageColor: [0.24, 0.5, 0.2],
    trunkColor: [0.18, 0.36, 0.16],
  },
] as const

export const DEFAULT_VEGETATION_TYPE: VegetationTypeId = 'tree_medium_narrow'

export function getVegetationTypeDefinition(
  typeId: VegetationTypeId,
): VegetationTypeDefinition {
  return (
    VEGETATION_TYPES.find((entry) => entry.id === typeId) ?? VEGETATION_TYPES[4]
  )
}

export function getVegetationTypesByKind(
  kind: VegetationKind,
): readonly VegetationTypeDefinition[] {
  return VEGETATION_TYPES.filter((entry) => entry.kind === kind)
}
