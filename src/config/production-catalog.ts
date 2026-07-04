import {
  ProcessedProductId,
  ProductionBuildingId,
  type ProcessedProductDefinition,
  type ProductionRecipe,
} from '@/types/production.ts'

export const MILL_RECIPE_ID = 'mill_wheat_to_flour'

export const PROCESSED_CATALOG: readonly ProcessedProductDefinition[] = [
  {
    id: ProcessedProductId.Flour,
    name: 'Flour',
    basePrice: 75,
    displayColor: '#f5e6c8',
  },
] as const

export const PRODUCTION_RECIPES: readonly ProductionRecipe[] = [
  {
    buildingId: ProductionBuildingId.Mill,
    inputCropId: 'wheat',
    inputQuantity: 10,
    outputProductId: ProcessedProductId.Flour,
    outputQuantity: 8,
    durationDays: 1.5,
  },
] as const

const processedById = new Map(
  PROCESSED_CATALOG.map((product) => [product.id, product]),
)

const recipeByBuilding = new Map(
  PRODUCTION_RECIPES.map((recipe) => [recipe.buildingId, recipe]),
)

export function getProcessedProductDefinition(
  id: string,
): ProcessedProductDefinition | undefined {
  return processedById.get(id as ProcessedProductId)
}

export function getMillRecipe(): ProductionRecipe {
  return recipeByBuilding.get(ProductionBuildingId.Mill)!
}

export const MILL_POSITION = { x: 10, y: 0, z: 14 } as const
