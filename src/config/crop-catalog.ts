import { FieldLifecycleState as States } from '@/types/field.ts'
import { GrowthCurve, type CropDefinition } from '@/types/crop.ts'

export const DEFAULT_CROP_ID = 'wheat'

export const CROP_CATALOG: readonly CropDefinition[] = [
  {
    id: 'wheat',
    name: 'Wheat',
    seedCost: 50,
    growingDays: 5,
    yield: 10,
    sellingPrice: 45,
    requiredFieldState: States.Plowed,
    growthCurve: GrowthCurve.Linear,
    displayColor: '#d4b830',
    palette: {
      seeded: { r: 0.36, g: 0.29, b: 0.16 },
      growing: { r: 0.42, g: 0.62, b: 0.23 },
      harvestable: { r: 0.83, g: 0.72, b: 0.19 },
    },
  },
  {
    id: 'barley',
    name: 'Barley',
    seedCost: 40,
    growingDays: 4,
    yield: 12,
    sellingPrice: 38,
    requiredFieldState: States.Plowed,
    growthCurve: GrowthCurve.Early,
    displayColor: '#c8b060',
    palette: {
      seeded: { r: 0.29, g: 0.27, b: 0.16 },
      growing: { r: 0.54, g: 0.67, b: 0.28 },
      harvestable: { r: 0.78, g: 0.69, b: 0.38 },
    },
  },
  {
    id: 'canola',
    name: 'Canola',
    seedCost: 80,
    growingDays: 6,
    yield: 8,
    sellingPrice: 62,
    requiredFieldState: States.Plowed,
    growthCurve: GrowthCurve.Late,
    displayColor: '#e8d020',
    palette: {
      seeded: { r: 0.24, g: 0.29, b: 0.13 },
      growing: { r: 0.6, g: 0.72, b: 0.25 },
      harvestable: { r: 0.91, g: 0.82, b: 0.13 },
    },
  },
  {
    id: 'corn',
    name: 'Corn',
    seedCost: 100,
    growingDays: 7,
    yield: 15,
    sellingPrice: 40,
    requiredFieldState: States.Plowed,
    growthCurve: GrowthCurve.Linear,
    displayColor: '#d4a818',
    palette: {
      seeded: { r: 0.29, g: 0.22, b: 0.13 },
      growing: { r: 0.29, g: 0.54, b: 0.19 },
      harvestable: { r: 0.83, g: 0.66, b: 0.09 },
    },
  },
  {
    id: 'potato',
    name: 'Potato',
    seedCost: 60,
    growingDays: 5,
    yield: 18,
    sellingPrice: 28,
    requiredFieldState: States.Plowed,
    growthCurve: GrowthCurve.Early,
    displayColor: '#a89068',
    palette: {
      seeded: { r: 0.29, g: 0.22, b: 0.16 },
      growing: { r: 0.42, g: 0.48, b: 0.28 },
      harvestable: { r: 0.66, g: 0.56, b: 0.41 },
    },
  },
  {
    id: 'soybean',
    name: 'Soybean',
    seedCost: 70,
    growingDays: 6,
    yield: 11,
    sellingPrice: 48,
    requiredFieldState: States.Plowed,
    growthCurve: GrowthCurve.Late,
    displayColor: '#90b048',
    palette: {
      seeded: { r: 0.23, g: 0.28, b: 0.16 },
      growing: { r: 0.35, g: 0.54, b: 0.25 },
      harvestable: { r: 0.56, g: 0.69, b: 0.28 },
    },
  },
] as const

const catalogById = new Map(CROP_CATALOG.map((crop) => [crop.id, crop]))

export function getCropDefinition(id: string): CropDefinition | undefined {
  return catalogById.get(id)
}
