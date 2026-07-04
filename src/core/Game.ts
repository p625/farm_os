import { SoundManager } from '@audio/SoundManager.ts'
import { World } from '@game/World.ts'
import { GameEventLog } from '@game/GameEventLog.ts'
import { SaveGameService } from '@game/SaveGameService.ts'
import {
  CameraController,
  CropPresentation,
  FieldOverlayPresentation,
  FieldPresentation,
  LightingSystem,
  OwnershipPresentation,
  ProductionPresentation,
  SceneManager,
  TractorInputPresentation,
  TractorPresentation,
} from '@rendering/index.ts'
import {
  CropSystem,
  FarmShopSystem,
  FieldSystem,
  InventorySystem,
  MachineRegistry,
  MarketSystem,
  OwnershipSystem,
  ProductionSystem,
  TractorJobSystem,
} from '@systems/index.ts'
import { DEFAULT_MACHINE_ID } from '@/config/machine-catalog.ts'
import { getFieldCatalogEntry } from '@/config/field-catalog.ts'
import { getProcessedProductDefinition } from '@/config/production-catalog.ts'
import { SAVE_VERSION } from '@/config/save.ts'
import type { GameConfig } from '@/types/index.ts'
import { DEFAULT_GAME_CONFIG } from '@/types/index.ts'
import type { IDisposable } from '@/types/index.ts'
import type { GameSaveData } from '@/types/save.ts'
import type { ShopUpgradeId } from '@/types/shop.ts'
import type { ProcessedProductId } from '@/types/production.ts'
import {
  EMPTY_SELECTED_ENTITY,
  SelectedEntityKind,
  type MachineCommand,
  type MachineId,
  type SelectedEntitySnapshot,
} from '@/types/machine.ts'
import { EMPTY_GAME_SNAPSHOT, type GameSnapshot } from './GameSnapshot.ts'
import { GameLoop } from './GameLoop.ts'

export class Game implements IDisposable {
  private readonly sceneManager: SceneManager
  private readonly cameraController: CameraController
  private readonly lightingSystem: LightingSystem
  private readonly world: World
  private readonly cropSystem: CropSystem
  private readonly inventorySystem: InventorySystem
  private readonly marketSystem: MarketSystem
  private readonly farmShopSystem: FarmShopSystem
  private readonly productionSystem: ProductionSystem
  private readonly fieldSystem: FieldSystem
  private readonly ownershipSystem: OwnershipSystem
  private readonly tractorJobSystem: TractorJobSystem
  private readonly machineRegistry: MachineRegistry
  private readonly eventLog: GameEventLog
  private readonly soundManager: SoundManager
  private readonly saveGameService: SaveGameService
  private readonly fieldPresentation: FieldPresentation
  private readonly cropPresentation: CropPresentation
  private readonly fieldOverlayPresentation: FieldOverlayPresentation
  private readonly ownershipPresentation: OwnershipPresentation
  private readonly productionPresentation: ProductionPresentation
  private readonly tractorPresentation: TractorPresentation
  private readonly tractorInputPresentation: TractorInputPresentation
  private readonly gameLoop: GameLoop
  private readonly listeners = new Set<() => void>()
  private cachedSnapshot: GameSnapshot = EMPTY_GAME_SNAPSHOT
  private selectedEntity: SelectedEntitySnapshot = EMPTY_SELECTED_ENTITY
  private autoSaveEnabled = false
  private disposed = false
  private started = false

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig = DEFAULT_GAME_CONFIG,
  ) {
    this.sceneManager = new SceneManager(canvas, config)
    this.cameraController = new CameraController(this.sceneManager)
    this.lightingSystem = new LightingSystem(this.sceneManager)
    this.world = new World()
    this.soundManager = new SoundManager()
    this.eventLog = new GameEventLog((entry) => {
      this.soundManager.playForGameEvent(entry.kind)
    })
    this.saveGameService = new SaveGameService()
    this.cropSystem = new CropSystem()
    this.inventorySystem = new InventorySystem()
    this.marketSystem = new MarketSystem()
    this.farmShopSystem = new FarmShopSystem(this.world)
    this.productionSystem = new ProductionSystem(this.world)
    this.ownershipSystem = new OwnershipSystem(this.world)
    this.fieldSystem = new FieldSystem(this.world)
    this.fieldSystem.setOwnershipSystem(this.ownershipSystem)
    this.fieldSystem.setCropSystem(this.cropSystem)
    this.fieldSystem.setInventorySystem(this.inventorySystem)
    this.fieldSystem.setMarketSystem(this.marketSystem)
    this.cropSystem.setFarmShopSystem(this.farmShopSystem)
    this.tractorJobSystem = new TractorJobSystem(this.fieldSystem)
    this.tractorJobSystem.setCropSystem(this.cropSystem)
    this.tractorJobSystem.setFarmShopSystem(this.farmShopSystem)
    this.machineRegistry = new MachineRegistry()
    this.machineRegistry.register(this.tractorJobSystem)
    this.productionSystem.setInventorySystem(this.inventorySystem)
    this.productionSystem.setCropSystem(this.cropSystem)
    this.productionSystem.setProcessedPriceLookup((productId) =>
      this.marketSystem.getProcessedPrice(productId),
    )
    this.fieldPresentation = new FieldPresentation()
    this.cropPresentation = new CropPresentation()
    this.fieldOverlayPresentation = new FieldOverlayPresentation()
    this.ownershipPresentation = new OwnershipPresentation()
    this.productionPresentation = new ProductionPresentation()
    this.tractorPresentation = new TractorPresentation()
    this.tractorInputPresentation = new TractorInputPresentation()
    this.gameLoop = new GameLoop([
      this.world,
      this.fieldSystem,
      this.productionSystem,
      this.tractorJobSystem,
      this.cameraController,
    ])
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot(): GameSnapshot {
    if (this.disposed) {
      return EMPTY_GAME_SNAPSHOT
    }
    return this.cachedSnapshot
  }

  plowSelectedField(): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId) {
      return
    }
    this.issueMachineCommand(DEFAULT_MACHINE_ID, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'plow' },
    })
  }

  plantSelectedField(cropId: string): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId) {
      return
    }
    this.issueMachineCommand(DEFAULT_MACHINE_ID, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'seed', cropId },
    })
  }

  harvestSelectedField(): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId) {
      return
    }
    this.issueMachineCommand(DEFAULT_MACHINE_ID, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'harvest' },
    })
  }

  issueMachineCommand(machineId: MachineId, command: MachineCommand): boolean {
    const accepted = this.machineRegistry.issueCommand(machineId, command)
    if (accepted) {
      this.autoSave()
      this.notifyListeners()
    }
    return accepted
  }

  selectMachine(machineId: MachineId): void {
    this.selectedEntity = {
      kind: SelectedEntityKind.Machine,
      machineId,
      fieldId: this.fieldSystem.getSelectedFieldId(),
      buildingId: null,
    }
    this.tractorPresentation.setSelected(true)
    this.notifyListeners()
  }

  selectField(fieldId: string): void {
    this.fieldSystem.selectField(fieldId)
    this.selectedEntity = {
      kind: SelectedEntityKind.Field,
      machineId: null,
      fieldId,
      buildingId: null,
    }
    this.tractorPresentation.setSelected(false)
    this.syncFieldVisuals()
    this.autoSave()
    this.notifyListeners()
  }

  sellStoredCrop(cropId: string): void {
    const quantity = this.inventorySystem.getQuantity(cropId)
    if (quantity <= 0) {
      return
    }

    const unitPrice = this.marketSystem.getPrice(cropId)
    const total = quantity * unitPrice
    const cropName = this.cropSystem.getCropName(cropId)

    if (!this.inventorySystem.removeCrop(cropId, quantity)) {
      return
    }

    this.world.addMoney(total)
    this.eventLog.recordCropSold(
      cropName,
      quantity,
      total,
      this.world.currentDay,
    )
    this.autoSave()
    this.notifyListeners()
  }

  purchaseSelectedField(): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId) {
      return
    }
    if (this.ownershipSystem.purchaseField(fieldId)) {
      this.syncFieldVisuals()
      this.autoSave()
      this.notifyListeners()
    }
  }

  leaseSelectedField(): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId) {
      return
    }
    if (this.ownershipSystem.leaseField(fieldId)) {
      this.syncFieldVisuals()
      this.autoSave()
      this.notifyListeners()
    }
  }

  cancelFieldExpansion(): void {
    this.fieldSystem.clearSelection()
    this.syncFieldVisuals()
    this.notifyListeners()
  }

  purchaseUpgrade(upgradeId: ShopUpgradeId): void {
    if (this.farmShopSystem.purchase(upgradeId)) {
      this.autoSave()
      this.notifyListeners()
    }
  }

  startMilling(): void {
    if (this.productionSystem.startMilling()) {
      this.syncProductionVisuals()
      this.autoSave()
      this.notifyListeners()
    }
  }

  collectFlour(): void {
    if (this.productionSystem.collectFlour()) {
      this.syncProductionVisuals()
      this.autoSave()
      this.notifyListeners()
    }
  }

  sellProcessedProduct(productId: ProcessedProductId): void {
    const quantity = this.productionSystem.getProcessedQuantity(productId)
    if (quantity <= 0) {
      return
    }

    const unitPrice = this.marketSystem.getProcessedPrice(productId)
    const total = quantity * unitPrice
    const productName =
      getProcessedProductDefinition(productId)?.name ?? productId

    if (!this.productionSystem.removeProcessed(productId, quantity)) {
      return
    }

    this.world.addMoney(total)
    this.eventLog.recordProductSold(
      productName,
      quantity,
      total,
      this.world.currentDay,
    )
    this.autoSave()
    this.notifyListeners()
  }

  setGameSpeed(speed: number): void {
    this.world.setGameSpeed(speed)
    this.autoSave()
    this.notifyListeners()
  }

  saveGame(): void {
    this.eventLog.recordGameSaved(this.world.currentDay)
    this.persistSave()
    this.notifyListeners()
  }

  resetFarm(): void {
    this.saveGameService.clear()
    this.world.initialize()
    this.cropSystem.initialize()
    this.inventorySystem.initialize()
    this.marketSystem.initialize()
    this.farmShopSystem.initialize()
    this.productionSystem.initialize()
    this.ownershipSystem.initialize()
    this.fieldSystem.initialize()
    this.tractorJobSystem.initialize()
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.tractorPresentation.setSelected(false)
    this.eventLog.clear()
    this.eventLog.recordFarmReset(this.world.currentDay)
    this.syncFieldVisuals()
    this.syncProductionVisuals()
    this.tractorPresentation.syncVisuals()
    this.persistSave()
    this.notifyListeners()
  }

  async start(): Promise<void> {
    if (this.disposed || this.started) {
      return
    }

    await this.sceneManager.initialize()
    if (this.disposed) {
      return
    }

    this.lightingSystem.initialize()
    this.cameraController.initialize()
    this.world.initialize()
    this.cropSystem.initialize()

    this.inventorySystem.setEventLog(this.eventLog)
    this.inventorySystem.setOnChange(() => {
      this.autoSave()
      this.notifyListeners()
    })
    this.inventorySystem.initialize()

    this.marketSystem.setEventLog(this.eventLog)
    this.marketSystem.setOnChange(() => {
      this.autoSave()
      this.notifyListeners()
    })
    this.marketSystem.initialize()

    this.farmShopSystem.setEventLog(this.eventLog)
    this.farmShopSystem.setOnChange(() => {
      this.autoSave()
      this.notifyListeners()
    })
    this.farmShopSystem.initialize()

    this.productionSystem.setEventLog(this.eventLog)
    this.productionSystem.setOnChange(() => {
      this.syncProductionVisuals()
      this.autoSave()
      this.notifyListeners()
    })
    this.productionSystem.initialize()

    this.fieldSystem.setEventLog(this.eventLog)
    this.fieldSystem.setOnChange(() => {
      this.syncFieldVisuals()
      this.autoSave()
      this.notifyListeners()
    })
    this.fieldSystem.initialize()

    this.ownershipSystem.setEventLog(this.eventLog)
    this.ownershipSystem.setOnChange(() => {
      this.syncFieldVisuals()
      this.autoSave()
      this.notifyListeners()
    })
    this.ownershipSystem.initialize()

    this.fieldPresentation.setCropSystem(this.cropSystem)
    this.fieldPresentation.setOnVisualChange(() => {
      this.fieldOverlayPresentation.syncVisuals()
    })

    this.tractorJobSystem.setOnChange(() => {
      this.autoSave()
      this.notifyListeners()
    })
    this.tractorJobSystem.setOnVisualChange(() => {
      this.tractorPresentation.syncVisuals()
    })
    this.tractorJobSystem.initialize()
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.tractorPresentation.setSelected(false)

    this.loadSavedGame()

    if (this.disposed) {
      return
    }

    this.fieldPresentation.setOnFieldSelected((fieldId) => {
      this.selectField(fieldId)
    })

    const scene = this.sceneManager.getScene()
    this.fieldPresentation.attach(scene, this.fieldSystem)
    this.cropPresentation.attach(scene, this.fieldSystem, this.cropSystem)
    this.fieldOverlayPresentation.attach(
      scene,
      this.fieldSystem,
      this.fieldPresentation,
      this.ownershipSystem,
      this.cropSystem,
    )
    this.ownershipPresentation.attach(
      scene,
      this.fieldSystem,
      this.ownershipSystem,
    )
    this.productionPresentation.attach(scene, this.productionSystem)
    this.tractorPresentation.attach(scene, this.tractorJobSystem)
    this.tractorInputPresentation.attach(scene, this)

    this.syncFieldVisuals()
    this.syncProductionVisuals()
    this.tractorPresentation.syncVisuals()
    this.invalidateSnapshot()
    this.autoSaveEnabled = true
    this.started = true
    this.gameLoop.start(() => this.sceneManager.render())
  }

  stop(): void {
    this.gameLoop.stop()
  }

  dispose(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.autoSaveEnabled = false
    this.stop()
    this.tractorInputPresentation.detach()
    this.tractorPresentation.detach()
    this.productionPresentation.detach()
    this.ownershipPresentation.detach()
    this.cropPresentation.detach()
    this.fieldOverlayPresentation.detach()
    this.fieldPresentation.detach()
    this.tractorJobSystem.dispose()
    this.fieldSystem.dispose()
    this.ownershipSystem.dispose()
    this.inventorySystem.dispose()
    this.marketSystem.dispose()
    this.farmShopSystem.dispose()
    this.productionSystem.dispose()
    this.cropSystem.dispose()
    this.eventLog.clear()
    this.world.dispose()
    this.cameraController.dispose()
    this.lightingSystem.dispose()
    this.sceneManager.dispose()
    this.listeners.clear()
    this.cachedSnapshot = EMPTY_GAME_SNAPSHOT
    this.started = false
  }

  private loadSavedGame(): void {
    const saved = this.saveGameService.load()
    if (!saved) {
      return
    }

    this.applySaveData(saved)
  }

  private applySaveData(saved: GameSaveData): void {
    this.autoSaveEnabled = false

    this.world.applySave(saved.money, saved.currentDay, saved.gameSpeed)
    this.ownershipSystem.applySave(saved.ownership)
    this.inventorySystem.applySave(saved.inventory)
    this.marketSystem.applySave(
      saved.marketPrices,
      saved.processedMarketPrices ?? [],
    )

    try {
      this.productionSystem.applySave(
        this.saveGameService.normalizeProductionSave(saved.production),
      )
    } catch {
      this.productionSystem.initialize()
    }
    this.farmShopSystem.applySave(saved.upgrades)
    this.fieldSystem.applySave(saved.fields, saved.selectedFieldId)
    this.eventLog.restore(saved.eventLog, saved.eventLogNextId)
    this.tractorJobSystem.applySave(
      this.saveGameService.normalizeMachineSave(saved.machine),
    )
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.tractorPresentation.setSelected(false)

    this.autoSaveEnabled = true
  }

  private captureSaveData(): GameSaveData {
    return {
      version: SAVE_VERSION,
      money: this.world.money,
      currentDay: this.world.currentDay,
      gameSpeed: this.world.gameSpeed,
      selectedFieldId: this.fieldSystem.getSelectedFieldId(),
      fields: this.fieldSystem.toSaveFields(),
      ownership: this.ownershipSystem.toSaveOwnership(),
      inventory: this.inventorySystem.toSaveInventory(),
      marketPrices: this.marketSystem.toSavePrices(),
      processedMarketPrices: this.marketSystem.toSaveProcessedPrices(),
      production: this.productionSystem.toSaveData(),
      upgrades: this.farmShopSystem.toSaveUpgrades(),
      machine: this.tractorJobSystem.toSaveData(),
      eventLog: [...this.eventLog.getEntries()],
      eventLogNextId: this.eventLog.getNextId(),
    }
  }

  private persistSave(): void {
    this.saveGameService.save(this.captureSaveData())
  }

  private autoSave(): void {
    if (!this.autoSaveEnabled) {
      return
    }
    this.persistSave()
  }

  private syncProductionVisuals(): void {
    this.productionPresentation.syncVisuals()
  }

  private syncFieldVisuals(): void {
    this.fieldPresentation.syncBaseVisuals()
    this.cropPresentation.syncVisuals()
    this.ownershipPresentation.syncVisuals()
    this.fieldPresentation.syncSelectionOverlay()
    this.fieldOverlayPresentation.syncVisuals()
  }

  private buildFieldSnapshots() {
    return this.fieldSystem.getFields().map((field) => {
      const catalog = getFieldCatalogEntry(field.id)
      const ownership = this.ownershipSystem.getOwnership(field.id)
      const cropId = this.cropSystem.normalizePlantedCropId(
        field.cropId,
        field.state,
      )
      return {
        ...field.toSnapshot(),
        cropId,
        cropName: cropId ? this.cropSystem.getCropName(cropId) : null,
        ownership,
        purchasePrice: catalog?.purchasePrice ?? 0,
        leasePrice: catalog?.leasePrice ?? 0,
        area: catalog?.area ?? 0,
        fertility: catalog?.fertility ?? 0,
        usable: this.ownershipSystem.canUseField(field.id),
      }
    })
  }

  private invalidateSnapshot(): void {
    if (this.disposed) {
      return
    }

    let processedInventory = EMPTY_GAME_SNAPSHOT.processedInventory
    let processedMarketPrices = EMPTY_GAME_SNAPSHOT.processedMarketPrices
    let mill = EMPTY_GAME_SNAPSHOT.mill

    try {
      processedInventory = this.productionSystem.toProcessedSnapshots()
      mill = this.productionSystem.getMillSnapshot()
    } catch {
      this.productionSystem.initialize()
      try {
        processedInventory = this.productionSystem.toProcessedSnapshots()
        mill = this.productionSystem.getMillSnapshot()
      } catch {
        // Keep fallback snapshot values.
      }
    }

    try {
      processedMarketPrices = this.marketSystem.toProcessedSnapshots()
    } catch {
      // Keep fallback processed market prices.
    }

    this.cachedSnapshot = {
      money: this.world.money,
      currentDay: this.world.currentDay,
      gameSpeed: this.world.gameSpeed,
      selectedFieldId: this.fieldSystem.getSelectedFieldId(),
      selectedEntity: this.selectedEntity,
      fields: this.buildFieldSnapshots(),
      crops: this.cropSystem.toSnapshots(),
      inventory: this.inventorySystem.toSnapshots(),
      processedInventory,
      processedMarketPrices,
      mill,
      marketPrices: this.marketSystem.toSnapshots(),
      shopUpgrades: this.farmShopSystem.toSnapshots(this.world.money),
      tractor: this.tractorJobSystem.toSnapshot(),
      eventLog: this.eventLog.getEntries(),
      moneyGain: this.eventLog.getLatestMoneyGain(),
    }
  }

  private notifyListeners(): void {
    this.invalidateSnapshot()
    for (const listener of this.listeners) {
      listener()
    }
  }
}
