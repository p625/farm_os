import {
  MILL_RECIPE_ID,
  getMillRecipe,
  getProcessedProductDefinition,
  PROCESSED_CATALOG,
} from '@/config/production-catalog.ts'
import type { GameEventLog } from '@game/GameEventLog.ts'
import type { World } from '@game/World.ts'
import type { CropSystem } from './CropSystem.ts'
import type { InventorySystem } from './InventorySystem.ts'
import {
  ProductionBuildingId,
  ProductionBuildingState,
  type ProcessedProductId,
  type ProcessedInventorySnapshot,
  type ProductionBuilding,
  type ProductionBuildingSnapshot,
} from '@/types/production.ts'
import type { ProductionSaveData } from '@/types/save.ts'
import { GameSystem } from './GameSystem.ts'

import { SIMULATION_SECONDS_PER_DAY } from '@/types/simulation-clock.ts'
import type { SimulationClock } from '@game/SimulationClock.ts'

function createDefaultMillBuilding(): ProductionBuilding {
  return {
    id: ProductionBuildingId.Mill,
    name: 'Mill',
    state: ProductionBuildingState.Idle,
    queue: null,
  }
}

function createDefaultMillSnapshot(): ProductionBuildingSnapshot {
  const recipe = getMillRecipe()
  const outputProduct = getProcessedProductDefinition(recipe.outputProductId)

  return {
    id: ProductionBuildingId.Mill,
    name: 'Mill',
    state: ProductionBuildingState.Idle,
    progress: 0,
    canStart: false,
    canCollect: false,
    inputCropName: recipe.inputCropId,
    inputRequired: recipe.inputQuantity,
    outputProductName: outputProduct?.name ?? recipe.outputProductId,
    outputAmount: recipe.outputQuantity,
    recipeLabel: `${recipe.inputQuantity} ${recipe.inputCropId} → ${recipe.outputQuantity} ${outputProduct?.name ?? recipe.outputProductId}`,
  }
}

function isProductionBuildingState(
  value: unknown,
): value is ProductionBuildingState {
  return (
    value === ProductionBuildingState.Idle ||
    value === ProductionBuildingState.Processing ||
    value === ProductionBuildingState.Ready
  )
}

export class ProductionSystem extends GameSystem {
  readonly name = 'ProductionSystem'
  private readonly world: World
  private simulationClock: SimulationClock | null = null
  private readonly buildings = new Map<ProductionBuildingId, ProductionBuilding>()
  private readonly processedInventory = new Map<ProcessedProductId, number>()
  private inventorySystem: InventorySystem | null = null
  private cropSystem: CropSystem | null = null
  private getProcessedPrice: ((productId: ProcessedProductId) => number) | null =
    null
  private eventLog: GameEventLog | null = null
  private onChange: (() => void) | null = null

  constructor(world: World) {
    super()
    this.world = world
    this.ensureDefaultState()
  }

  setInventorySystem(inventorySystem: InventorySystem): void {
    this.inventorySystem = inventorySystem
  }

  setCropSystem(cropSystem: CropSystem): void {
    this.cropSystem = cropSystem
  }

  setProcessedPriceLookup(
    lookup: (productId: ProcessedProductId) => number,
  ): void {
    this.getProcessedPrice = lookup
  }

  setEventLog(eventLog: GameEventLog): void {
    this.eventLog = eventLog
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  setSimulationClock(clock: SimulationClock): void {
    this.simulationClock = clock
  }

  initialize(): void {
    this.ensureDefaultState()
    this.notifyChange()
  }

  private ensureDefaultState(): void {
    this.buildings.clear()
    this.processedInventory.clear()

    for (const product of PROCESSED_CATALOG) {
      this.processedInventory.set(product.id, 0)
    }

    this.buildings.set(ProductionBuildingId.Mill, createDefaultMillBuilding())
  }

  private ensureMillBuilding(): ProductionBuilding {
    let building = this.buildings.get(ProductionBuildingId.Mill)
    if (!building) {
      building = createDefaultMillBuilding()
      this.buildings.set(ProductionBuildingId.Mill, building)
    }

    for (const product of PROCESSED_CATALOG) {
      if (!this.processedInventory.has(product.id)) {
        this.processedInventory.set(product.id, 0)
      }
    }

    return building
  }

  update(simulationDeltaTime: number): void {
    if (!this.simulationClock || this.simulationClock.isPaused()) {
      return
    }

    const mill = this.ensureMillBuilding()
    if (!mill?.queue || mill.state !== ProductionBuildingState.Processing) {
      return
    }

    const dayProgress =
      simulationDeltaTime /
      SIMULATION_SECONDS_PER_DAY /
      mill.queue.durationDays
    mill.queue.progress = Math.min(1, mill.queue.progress + dayProgress)

    if (mill.queue.progress >= 1) {
      mill.state = ProductionBuildingState.Ready
      this.eventLog?.recordMillFinishedFlour(this.world.currentDay)
      this.notifyChange()
      return
    }

    this.notifyChange()
  }

  applySave(saved?: ProductionSaveData | null): void {
    this.ensureDefaultState()

    if (!saved) {
      this.notifyChange()
      return
    }

    const buildings = Array.isArray(saved.buildings) ? saved.buildings : []
    const processedInventory = Array.isArray(saved.processedInventory)
      ? saved.processedInventory
      : []

    for (const savedBuilding of buildings) {
      if (!savedBuilding || savedBuilding.id !== ProductionBuildingId.Mill) {
        continue
      }

      const building = this.ensureMillBuilding()
      building.state = isProductionBuildingState(savedBuilding.state)
        ? savedBuilding.state
        : ProductionBuildingState.Idle

      if (savedBuilding.queue && typeof savedBuilding.queue === 'object') {
        const queue = savedBuilding.queue
        const outputProductId = getProcessedProductDefinition(
          queue.outputProductId,
        )?.id

        if (
          typeof queue.recipeId === 'string' &&
          typeof queue.inputCropId === 'string' &&
          typeof queue.inputQuantity === 'number' &&
          outputProductId &&
          typeof queue.outputQuantity === 'number' &&
          typeof queue.durationDays === 'number' &&
          queue.durationDays > 0
        ) {
          building.queue = {
            recipeId: queue.recipeId,
            inputCropId: queue.inputCropId,
            inputQuantity: queue.inputQuantity,
            outputProductId,
            outputQuantity: queue.outputQuantity,
            progress: Math.min(
              1,
              Math.max(0, Number(queue.progress) || 0),
            ),
            durationDays: queue.durationDays,
          }
        } else {
          building.queue = null
          building.state = ProductionBuildingState.Idle
        }
      } else {
        building.queue = null
        if (building.state === ProductionBuildingState.Processing) {
          building.state = ProductionBuildingState.Idle
        }
      }
    }

    for (const savedProduct of processedInventory) {
      if (!savedProduct || typeof savedProduct.productId !== 'string') {
        continue
      }

      const definition = getProcessedProductDefinition(savedProduct.productId)
      if (!definition) {
        continue
      }

      this.processedInventory.set(
        definition.id,
        Math.max(0, Number(savedProduct.quantity) || 0),
      )
    }

    this.notifyChange()
  }

  toSaveData() {
    this.ensureMillBuilding()
    return {
      buildings: [...this.buildings.values()].map((building) => ({
        id: building.id,
        state: building.state,
        queue: building.queue ? { ...building.queue } : null,
      })),
      processedInventory: PROCESSED_CATALOG.map((product) => ({
        productId: product.id,
        quantity: this.getProcessedQuantity(product.id),
      })),
    }
  }

  getMillSnapshot(): ProductionBuildingSnapshot {
    const building = this.ensureMillBuilding()
    const recipe = getMillRecipe()
    const inputCropName =
      this.cropSystem?.getCropName(recipe.inputCropId) ?? recipe.inputCropId
    const outputProduct = getProcessedProductDefinition(recipe.outputProductId)

    if (!building) {
      return createDefaultMillSnapshot()
    }

    return {
      id: building.id ?? ProductionBuildingId.Mill,
      name: building.name ?? 'Mill',
      state: isProductionBuildingState(building.state)
        ? building.state
        : ProductionBuildingState.Idle,
      progress: Math.min(1, Math.max(0, building.queue?.progress ?? 0)),
      canStart: this.canStartMilling(),
      canCollect: building.state === ProductionBuildingState.Ready,
      inputCropName,
      inputRequired: recipe.inputQuantity,
      outputProductName: outputProduct?.name ?? recipe.outputProductId,
      outputAmount: recipe.outputQuantity,
      recipeLabel: `${recipe.inputQuantity} ${inputCropName} → ${recipe.outputQuantity} ${outputProduct?.name ?? recipe.outputProductId}`,
    }
  }

  canStartMilling(): boolean {
    const mill = this.ensureMillBuilding()
    if (!mill || mill.state !== ProductionBuildingState.Idle) {
      return false
    }

    const recipe = getMillRecipe()
    const wheatAvailable =
      this.inventorySystem?.getQuantity(recipe.inputCropId) ?? 0
    return wheatAvailable >= recipe.inputQuantity
  }

  startMilling(): boolean {
    const mill = this.ensureMillBuilding()
    if (!mill || !this.canStartMilling() || !this.inventorySystem) {
      return false
    }

    const recipe = getMillRecipe()
    if (
      !this.inventorySystem.removeCrop(recipe.inputCropId, recipe.inputQuantity)
    ) {
      return false
    }

    const inputCropName =
      this.cropSystem?.getCropName(recipe.inputCropId) ?? recipe.inputCropId

    mill.state = ProductionBuildingState.Processing
    mill.queue = {
      recipeId: MILL_RECIPE_ID,
      inputCropId: recipe.inputCropId,
      inputQuantity: recipe.inputQuantity,
      outputProductId: recipe.outputProductId,
      outputQuantity: recipe.outputQuantity,
      progress: 0,
      durationDays: recipe.durationDays,
    }

    this.eventLog?.recordMillingStarted(inputCropName, this.world.currentDay)
    this.notifyChange()
    return true
  }

  collectFlour(): boolean {
    const mill = this.ensureMillBuilding()
    if (!mill || mill.state !== ProductionBuildingState.Ready || !mill.queue) {
      return false
    }

    const current = this.getProcessedQuantity(mill.queue.outputProductId)
    this.processedInventory.set(
      mill.queue.outputProductId,
      current + mill.queue.outputQuantity,
    )

    mill.state = ProductionBuildingState.Idle
    mill.queue = null
    this.notifyChange()
    return true
  }

  getProcessedQuantity(productId: ProcessedProductId): number {
    return this.processedInventory.get(productId) ?? 0
  }

  removeProcessed(productId: ProcessedProductId, quantity: number): boolean {
    const current = this.getProcessedQuantity(productId)
    if (quantity <= 0 || current < quantity) {
      return false
    }
    this.processedInventory.set(productId, current - quantity)
    this.notifyChange()
    return true
  }

  toProcessedSnapshots(): ProcessedInventorySnapshot[] {
    this.ensureMillBuilding()
    const priceLookup = this.getProcessedPrice

    return PROCESSED_CATALOG.filter(
      (product) => this.getProcessedQuantity(product.id) > 0,
    ).map((product) => {
      const quantity = this.getProcessedQuantity(product.id)
      const unitPrice = priceLookup?.(product.id) ?? product.basePrice
      return {
        productId: product.id,
        productName: product.name,
        quantity,
        displayColor: product.displayColor,
        unitPrice,
        totalValue: quantity * unitPrice,
      }
    })
  }

  dispose(): void {
    this.buildings.clear()
    this.processedInventory.clear()
    this.inventorySystem = null
    this.cropSystem = null
    this.getProcessedPrice = null
    this.eventLog = null
    this.onChange = null
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}
