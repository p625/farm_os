import {
  SHOP_CATALOG,
  getShopUpgradeDefinition,
} from '@/config/shop-catalog.ts'
import type { GameEventLog } from '@game/GameEventLog.ts'
import type { World } from '@game/World.ts'
import {
  ShopUpgradeId,
  UpgradeEffectType,
  type ShopUpgradeSnapshot,
} from '@/types/shop.ts'
import { GameSystem } from './GameSystem.ts'

export class FarmShopSystem extends GameSystem {
  readonly name = 'FarmShopSystem'
  private readonly levels = new Map<ShopUpgradeId, number>()
  private readonly world: World
  private eventLog: GameEventLog | null = null
  private onChange: (() => void) | null = null

  constructor(world: World) {
    super()
    this.world = world
  }

  initialize(): void {
    this.levels.clear()
    for (const upgrade of SHOP_CATALOG) {
      this.levels.set(upgrade.id, 0)
    }
    this.notifyChange()
  }

  update(_deltaTime: number): void {
    // Upgrades are purchased on demand.
  }

  setEventLog(eventLog: GameEventLog): void {
    this.eventLog = eventLog
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  applySave(savedUpgrades: readonly { id: string; level: number }[]): void {
    this.initialize()
    for (const saved of savedUpgrades) {
      const definition = getShopUpgradeDefinition(saved.id)
      if (!definition) {
        continue
      }
      this.levels.set(
        definition.id,
        Math.max(0, Math.min(definition.maxLevel, saved.level)),
      )
    }
    this.notifyChange()
  }

  toSaveUpgrades(): { id: ShopUpgradeId; level: number }[] {
    return SHOP_CATALOG.map((upgrade) => ({
      id: upgrade.id,
      level: this.getLevel(upgrade.id),
    }))
  }

  getLevel(upgradeId: ShopUpgradeId): number {
    return this.levels.get(upgradeId) ?? 0
  }

  getNextPrice(upgradeId: ShopUpgradeId): number | null {
    const definition = getShopUpgradeDefinition(upgradeId)
    if (!definition) {
      return null
    }
    const level = this.getLevel(upgradeId)
    if (level >= definition.maxLevel) {
      return null
    }
    return definition.basePrice + level * definition.pricePerLevel
  }

  canPurchase(upgradeId: ShopUpgradeId): boolean {
    const price = this.getNextPrice(upgradeId)
    return price !== null && this.world.money >= price
  }

  purchase(upgradeId: ShopUpgradeId): boolean {
    const definition = getShopUpgradeDefinition(upgradeId)
    if (!definition) {
      return false
    }

    const price = this.getNextPrice(upgradeId)
    if (price === null || !this.world.spendMoney(price)) {
      return false
    }

    const nextLevel = this.getLevel(upgradeId) + 1
    this.levels.set(upgradeId, nextLevel)
    this.eventLog?.recordUpgradePurchased(
      definition.name,
      nextLevel,
      this.world.currentDay,
    )
    this.notifyChange()
    return true
  }

  getTractorSpeedMultiplier(): number {
    const definition = getShopUpgradeDefinition(ShopUpgradeId.FasterTractor)
    if (!definition) {
      return 1
    }
    return 1 + this.getLevel(ShopUpgradeId.FasterTractor) * definition.effectPerLevel
  }

  getWorkDurationMultiplier(): number {
    const definition = getShopUpgradeDefinition(
      ShopUpgradeId.FieldWorkEfficiency,
    )
    if (!definition) {
      return 1
    }
    const reduction =
      this.getLevel(ShopUpgradeId.FieldWorkEfficiency) *
      definition.effectPerLevel
    return Math.max(0.4, 1 - reduction)
  }

  getYieldMultiplier(): number {
    const definition = getShopUpgradeDefinition(ShopUpgradeId.BetterSeeds)
    if (!definition) {
      return 1
    }
    return 1 + this.getLevel(ShopUpgradeId.BetterSeeds) * definition.effectPerLevel
  }

  getTrailerLevel(): number {
    return this.getLevel(ShopUpgradeId.LargerTrailer)
  }

  toSnapshots(money: number): ShopUpgradeSnapshot[] {
    return SHOP_CATALOG.map((upgrade) => {
      const level = this.getLevel(upgrade.id)
      const nextPrice = this.getNextPrice(upgrade.id)
      const isMaxed = level >= upgrade.maxLevel

      return {
        id: upgrade.id,
        name: upgrade.name,
        description: upgrade.description,
        level,
        maxLevel: upgrade.maxLevel,
        nextPrice,
        canAfford: nextPrice !== null && money >= nextPrice,
        isMaxed,
        effectSummary: formatEffectSummary(upgrade, level),
      }
    })
  }

  dispose(): void {
    this.levels.clear()
    this.eventLog = null
    this.onChange = null
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}

function formatEffectSummary(
  upgrade: (typeof SHOP_CATALOG)[number],
  level: number,
): string {
  if (level <= 0) {
    return describeEffect(upgrade, 1)
  }
  return describeEffect(upgrade, level)
}

function describeEffect(
  upgrade: (typeof SHOP_CATALOG)[number],
  level: number,
): string {
  const percent = Math.round(upgrade.effectPerLevel * 100)

  switch (upgrade.effectType) {
    case UpgradeEffectType.TractorSpeed:
      return `+${percent * level}% tractor speed`
    case UpgradeEffectType.WorkDuration:
      return `-${percent * level}% work time`
    case UpgradeEffectType.YieldBonus:
      return `+${percent * level}% crop yield`
    case UpgradeEffectType.TrailerVisual:
      return level > 0 ? 'Trailer upgraded' : 'Planned visual upgrade'
    default:
      return upgrade.description
  }
}
