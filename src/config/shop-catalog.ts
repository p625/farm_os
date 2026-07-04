import {
  ShopUpgradeId,
  UpgradeEffectType,
  type ShopUpgradeDefinition,
} from '@/types/shop.ts'

export const SHOP_CATALOG: readonly ShopUpgradeDefinition[] = [
  {
    id: ShopUpgradeId.FasterTractor,
    name: 'Faster Tractor',
    description: 'Increase tractor travel speed between fields.',
    maxLevel: 3,
    basePrice: 800,
    pricePerLevel: 400,
    effectType: UpgradeEffectType.TractorSpeed,
    effectPerLevel: 0.2,
  },
  {
    id: ShopUpgradeId.LargerTrailer,
    name: 'Larger Trailer',
    description: 'Expand hauling capacity. Visual upgrade planned.',
    maxLevel: 2,
    basePrice: 1000,
    pricePerLevel: 500,
    effectType: UpgradeEffectType.TrailerVisual,
    effectPerLevel: 0,
  },
  {
    id: ShopUpgradeId.BetterSeeds,
    name: 'Better Seeds',
    description: 'Improve harvest yield from every crop.',
    maxLevel: 3,
    basePrice: 500,
    pricePerLevel: 250,
    effectType: UpgradeEffectType.YieldBonus,
    effectPerLevel: 0.15,
  },
  {
    id: ShopUpgradeId.FieldWorkEfficiency,
    name: 'Field Work Efficiency',
    description: 'Reduce time the tractor spends working each field.',
    maxLevel: 3,
    basePrice: 600,
    pricePerLevel: 300,
    effectType: UpgradeEffectType.WorkDuration,
    effectPerLevel: 0.15,
  },
] as const

const catalogById = new Map(SHOP_CATALOG.map((entry) => [entry.id, entry]))

export function getShopUpgradeDefinition(
  id: string,
): ShopUpgradeDefinition | undefined {
  return catalogById.get(id as ShopUpgradeId)
}
