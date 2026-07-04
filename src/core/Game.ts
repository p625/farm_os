import { SoundManager } from '@audio/SoundManager.ts'
import { World } from '@game/World.ts'
import { GameEventLog } from '@game/GameEventLog.ts'
import { SaveGameService } from '@game/SaveGameService.ts'
import {
  CameraController,
  AttachmentPresentation,
  CropPresentation,
  FieldOverlayPresentation,
  FieldPresentation,
  LightingSystem,
  MachineInputPresentation,
  MachinePresentation,
  OwnershipPresentation,
  ProductionPresentation,
  SceneManager,
} from '@rendering/index.ts'
import {
  AttachmentSystem,
  CornCombineJobSystem,
  CropSystem,
  FarmShopSystem,
  FieldSystem,
  GrainCombineJobSystem,
  InventorySystem,
  MachineRegistry,
  MarketSystem,
  MachineCapabilityResolver,
  OwnershipSystem,
  ProductionSystem,
  TractorJobSystem,
} from '@systems/index.ts'
import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import { getFieldCatalogEntry } from '@/config/field-catalog.ts'
import { getProcessedProductDefinition } from '@/config/production-catalog.ts'
import { SAVE_VERSION } from '@/config/save.ts'
import { clampRadialAnchor } from '@/utils/radial-menu-position.ts'
import type { GameConfig } from '@/types/index.ts'
import { DEFAULT_GAME_CONFIG } from '@/types/index.ts'
import type { IDisposable } from '@/types/index.ts'
import type { GameSaveData } from '@/types/save.ts'
import type { ShopUpgradeId } from '@/types/shop.ts'
import type { ProcessedProductId } from '@/types/production.ts'
import {
  EMPTY_SELECTED_ENTITY,
  FieldRadialActionKind,
  MachineCapability,
  MachineId,
  SelectedEntityKind,
  type FieldContextMenuSnapshot,
  type MachineCommand,
  type SelectedEntitySnapshot,
} from '@/types/machine.ts'
import {
  AttachmentLifecycleState,
  AttachmentRadialActionKind,
  type AttachmentContextMenuSnapshot,
  type AttachmentIdValue,
  type MachineSlotIdValue,
} from '@/types/attachment.ts'
import { EMPTY_GAME_SNAPSHOT, buildSelectedMachineSnapshot, type GameSnapshot } from './GameSnapshot.ts'
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
  private readonly grainCombineJobSystem: GrainCombineJobSystem
  private readonly cornCombineJobSystem: CornCombineJobSystem
  private readonly attachmentSystem: AttachmentSystem
  private readonly capabilityResolver: MachineCapabilityResolver
  private readonly machineRegistry: MachineRegistry
  private readonly eventLog: GameEventLog
  private readonly soundManager: SoundManager
  private readonly saveGameService: SaveGameService
  private readonly fieldPresentation: FieldPresentation
  private readonly cropPresentation: CropPresentation
  private readonly fieldOverlayPresentation: FieldOverlayPresentation
  private readonly ownershipPresentation: OwnershipPresentation
  private readonly productionPresentation: ProductionPresentation
  private readonly machinePresentation: MachinePresentation
  private readonly attachmentPresentation: AttachmentPresentation
  private readonly machineInputPresentation: MachineInputPresentation
  private readonly gameLoop: GameLoop
  private readonly listeners = new Set<() => void>()
  private cachedSnapshot: GameSnapshot = EMPTY_GAME_SNAPSHOT
  private selectedEntity: SelectedEntitySnapshot = EMPTY_SELECTED_ENTITY
  private fieldContextMenu: FieldContextMenuSnapshot | null = null
  private attachmentContextMenu: AttachmentContextMenuSnapshot | null = null
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
    this.grainCombineJobSystem = new GrainCombineJobSystem(this.fieldSystem)
    this.cornCombineJobSystem = new CornCombineJobSystem(this.fieldSystem)
    for (const system of [
      this.tractorJobSystem,
      this.grainCombineJobSystem,
      this.cornCombineJobSystem,
    ]) {
      system.setCropSystem(this.cropSystem)
      system.setFarmShopSystem(this.farmShopSystem)
    }
    this.attachmentSystem = new AttachmentSystem()
    this.attachmentSystem.setMachinePositionProvider((machineId) => {
      const controller = this.machineRegistry.get(machineId)
      if (!controller) {
        return null
      }
      return {
        position: controller.getPosition(),
        rotationY: controller.getRotationY(),
      }
    })
    this.attachmentSystem.setMachineIdleChecker((machineId) => {
      const controller = this.machineRegistry.get(machineId)
      return controller ? !controller.isBusy() : true
    })
    this.capabilityResolver = new MachineCapabilityResolver(this.attachmentSystem)
    for (const system of [
      this.tractorJobSystem,
      this.grainCombineJobSystem,
      this.cornCombineJobSystem,
    ]) {
      system.setCapabilityResolver(this.capabilityResolver)
    }
    this.machineRegistry = new MachineRegistry()
    this.machineRegistry.register(this.tractorJobSystem)
    this.machineRegistry.register(this.grainCombineJobSystem)
    this.machineRegistry.register(this.cornCombineJobSystem)
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
    this.machinePresentation = new MachinePresentation()
    this.attachmentPresentation = new AttachmentPresentation()
    this.machineInputPresentation = new MachineInputPresentation()
    this.gameLoop = new GameLoop([
      this.world,
      this.fieldSystem,
      this.productionSystem,
      this.tractorJobSystem,
      this.grainCombineJobSystem,
      this.cornCombineJobSystem,
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
    this.plowField(fieldId)
  }

  plantSelectedField(cropId: string): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId) {
      return
    }
    this.plantField(fieldId, cropId)
  }

  harvestSelectedField(): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId) {
      return
    }
    this.harvestField(fieldId)
  }

  plowField(fieldId: string): void {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return
    }
    this.closeFieldContextMenu()
    this.syncHudFieldWhileMachineSelected(fieldId)
    this.issueMachineCommand(machineId, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'plow' },
    })
  }

  plantField(fieldId: string, cropId: string): void {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return
    }
    this.closeFieldContextMenu()
    this.syncHudFieldWhileMachineSelected(fieldId)
    this.issueMachineCommand(machineId, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'seed', cropId },
    })
  }

  harvestField(fieldId: string): void {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return
    }
    this.closeFieldContextMenu()
    this.syncHudFieldWhileMachineSelected(fieldId)
    this.issueMachineCommand(machineId, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'harvest' },
    })
  }

  openFieldContextMenu(
    fieldId: string,
    screenX: number,
    screenY: number,
  ): void {
    this.closeAttachmentContextMenu()
    const workActions = this.getFieldRadialWorkActions(fieldId)
    if (workActions.length === 0) {
      return
    }

    const anchor = clampRadialAnchor(screenX, screenY)
    this.fieldContextMenu = {
      fieldId,
      screenX: anchor.x,
      screenY: anchor.y,
      actions: [...workActions, FieldRadialActionKind.Cancel],
    }
    this.notifyListeners()
  }

  closeFieldContextMenu(): void {
    if (!this.fieldContextMenu) {
      return
    }
    this.fieldContextMenu = null
    this.notifyListeners()
  }

  openAttachmentContextMenu(
    attachmentId: AttachmentIdValue,
    screenX: number,
    screenY: number,
  ): void {
    this.closeFieldContextMenu()
    const machineId = this.getSelectedMachineId()
    if (!machineId || this.isMachineBusy(machineId)) {
      return
    }

    const actions = this.getAttachmentRadialActions(attachmentId)
    if (actions.length === 0) {
      return
    }

    const anchor = clampRadialAnchor(screenX, screenY)
    const attachment = this.attachmentSystem.getAttachment(attachmentId)
    let slotId = this.attachmentSystem.findCompatibleSlot(machineId, attachmentId)
    if (attachment?.mountedOn?.machineId === machineId) {
      slotId = attachment.mountedOn.slotId
    }

    this.attachmentContextMenu = {
      attachmentId,
      slotId,
      screenX: anchor.x,
      screenY: anchor.y,
      actions: [...actions, AttachmentRadialActionKind.Cancel],
    }
    this.notifyListeners()
  }

  closeAttachmentContextMenu(): void {
    if (!this.attachmentContextMenu) {
      return
    }
    this.attachmentContextMenu = null
    this.notifyListeners()
  }

  getAttachmentRadialActions(
    attachmentId: AttachmentIdValue,
  ): AttachmentRadialActionKind[] {
    if (this.selectedEntity.kind !== SelectedEntityKind.Machine) {
      return []
    }

    const machineId = this.selectedEntity.machineId
    if (!machineId) {
      return []
    }

    const attachment = this.attachmentSystem.getAttachment(attachmentId)
    if (!attachment) {
      return []
    }

    if (this.isMachineBusy(machineId)) {
      return []
    }

    if (attachment.lifecycleState === AttachmentLifecycleState.Detached) {
      const slotId = this.attachmentSystem.findCompatibleSlot(
        machineId,
        attachmentId,
      )
      if (
        slotId &&
        this.attachmentSystem.canAttach(machineId, slotId, attachmentId)
      ) {
        return [AttachmentRadialActionKind.Attach]
      }
      return []
    }

    if (
      attachment.lifecycleState === AttachmentLifecycleState.Attached &&
      attachment.mountedOn?.machineId === machineId
    ) {
      const slotId = attachment.mountedOn.slotId
      if (this.attachmentSystem.canDetach(machineId, slotId)) {
        return [AttachmentRadialActionKind.Detach]
      }
    }

    return []
  }

  attachAttachment(
    machineId: MachineId,
    slotId: MachineSlotIdValue,
    attachmentId: AttachmentIdValue,
  ): boolean {
    if (this.selectedEntity.kind !== SelectedEntityKind.Machine) {
      return false
    }
    if (this.selectedEntity.machineId !== machineId) {
      return false
    }

    const accepted = this.attachmentSystem.attachAttachment(
      machineId,
      slotId,
      attachmentId,
    )
    if (accepted) {
      this.closeAttachmentContextMenu()
      this.autoSave()
      this.notifyListeners()
      this.attachmentPresentation.syncVisuals()
    }
    return accepted
  }

  detachAttachment(
    machineId: MachineId,
    slotId: MachineSlotIdValue,
  ): boolean {
    if (this.selectedEntity.kind !== SelectedEntityKind.Machine) {
      return false
    }
    if (this.selectedEntity.machineId !== machineId) {
      return false
    }

    const accepted = this.attachmentSystem.detachAttachment(machineId, slotId)
    if (accepted) {
      this.closeAttachmentContextMenu()
      this.autoSave()
      this.notifyListeners()
      this.attachmentPresentation.syncVisuals()
    }
    return accepted
  }

  getFieldRadialWorkActions(fieldId: string): FieldRadialActionKind[] {
    const machineId = this.getSelectedMachineId()
    if (!machineId || this.isMachineBusy(machineId)) {
      return []
    }

    const actions: FieldRadialActionKind[] = []

    if (
      this.capabilityResolver.hasEffectiveCapability(
        machineId,
        MachineCapability.Plow,
      ) &&
      this.fieldSystem.canPlow(fieldId)
    ) {
      actions.push(FieldRadialActionKind.Plow)
    }

    if (
      this.capabilityResolver.hasEffectiveCapability(
        machineId,
        MachineCapability.Seed,
      ) &&
      this.fieldSystem.canSeedField(fieldId)
    ) {
      actions.push(FieldRadialActionKind.Seed)
    }

    if (
      this.capabilityResolver.hasEffectiveCapability(
        machineId,
        MachineCapability.Harvest,
      ) &&
      this.fieldSystem.canHarvest(fieldId)
    ) {
      const cropId = this.fieldSystem.getFieldCropId(fieldId)
      if (cropId && this.capabilityResolver.canHarvestCrop(machineId, cropId)) {
        actions.push(FieldRadialActionKind.Harvest)
      }
    }

    return actions
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
    this.machinePresentation.setSelectedMachine(machineId)
    this.notifyListeners()
  }

  selectField(fieldId: string): void {
    this.fieldSystem.selectField(fieldId)
    if (this.selectedEntity.kind === SelectedEntityKind.Machine) {
      this.selectedEntity = {
        ...this.selectedEntity,
        fieldId,
      }
      this.syncFieldVisuals()
      this.autoSave()
      this.notifyListeners()
      return
    }

    this.selectedEntity = {
      kind: SelectedEntityKind.Field,
      machineId: null,
      fieldId,
      buildingId: null,
    }
    this.machinePresentation.setSelectedMachine(null)
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
    this.grainCombineJobSystem.initialize()
    this.cornCombineJobSystem.initialize()
    this.attachmentSystem.initialize()
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.fieldContextMenu = null
    this.attachmentContextMenu = null
    this.machinePresentation.setSelectedMachine(null)
    this.eventLog.clear()
    this.eventLog.recordFarmReset(this.world.currentDay)
    this.syncFieldVisuals()
    this.syncProductionVisuals()
    this.machinePresentation.syncVisuals()
    this.attachmentPresentation.syncVisuals()
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

    for (const system of [
      this.tractorJobSystem,
      this.grainCombineJobSystem,
      this.cornCombineJobSystem,
    ]) {
      system.setOnChange(() => {
        this.autoSave()
        this.notifyListeners()
      })
      system.setOnVisualChange(() => {
        this.machinePresentation.syncVisuals()
        this.attachmentPresentation.syncVisuals()
      })
    }
    this.attachmentSystem.setOnChange(() => {
      this.autoSave()
      this.notifyListeners()
    })
    this.attachmentSystem.setOnVisualChange(() => {
      this.attachmentPresentation.syncVisuals()
    })
    this.tractorJobSystem.initialize()
    this.grainCombineJobSystem.initialize()
    this.cornCombineJobSystem.initialize()
    this.attachmentSystem.initialize()
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.fieldContextMenu = null
    this.attachmentContextMenu = null
    this.machinePresentation.setSelectedMachine(null)

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
    this.machinePresentation.attach(scene, this.machineRegistry)
    this.attachmentPresentation.attach(scene, this.attachmentSystem)
    this.machineInputPresentation.attach(scene, this)

    this.syncFieldVisuals()
    this.syncProductionVisuals()
    this.machinePresentation.syncVisuals()
    this.attachmentPresentation.syncVisuals()
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
    this.machineInputPresentation.detach()
    this.attachmentPresentation.detach()
    this.machinePresentation.detach()
    this.productionPresentation.detach()
    this.ownershipPresentation.detach()
    this.cropPresentation.detach()
    this.fieldOverlayPresentation.detach()
    this.fieldPresentation.detach()
    this.tractorJobSystem.dispose()
    this.grainCombineJobSystem.dispose()
    this.cornCombineJobSystem.dispose()
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
    const machines = this.saveGameService.resolveMachinesSave(saved)
    this.tractorJobSystem.applySave(machines[MachineId.Tractor1])
    this.grainCombineJobSystem.applySave(machines[MachineId.GrainCombine1])
    this.cornCombineJobSystem.applySave(machines[MachineId.CornCombine1])
    this.attachmentSystem.applySave(
      this.saveGameService.normalizeAttachmentsSave(saved.attachments),
    )
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.fieldContextMenu = null
    this.attachmentContextMenu = null
    this.machinePresentation.setSelectedMachine(null)

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
      machines: {
        [MachineId.Tractor1]: this.tractorJobSystem.toSaveData(),
        [MachineId.GrainCombine1]: this.grainCombineJobSystem.toSaveData(),
        [MachineId.CornCombine1]: this.cornCombineJobSystem.toSaveData(),
      },
      attachments: this.attachmentSystem.toSaveData(),
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

  private syncHudFieldWhileMachineSelected(fieldId: string): void {
    if (this.selectedEntity.kind !== SelectedEntityKind.Machine) {
      return
    }

    this.fieldSystem.selectField(fieldId)
    this.selectedEntity = {
      ...this.selectedEntity,
      fieldId,
    }
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
      fieldContextMenu: this.fieldContextMenu,
      attachmentContextMenu: this.attachmentContextMenu,
      fields: this.buildFieldSnapshots(),
      crops: this.cropSystem.toSnapshots(),
      inventory: this.inventorySystem.toSnapshots(),
      processedInventory,
      processedMarketPrices,
      mill,
      marketPrices: this.marketSystem.toSnapshots(),
      shopUpgrades: this.farmShopSystem.toSnapshots(this.world.money),
      ...this.buildSelectedMachineSnapshotFields(),
      eventLog: this.eventLog.getEntries(),
      moneyGain: this.eventLog.getLatestMoneyGain(),
    }
  }

  private getSelectedMachineId(): MachineId | null {
    if (this.selectedEntity.kind !== SelectedEntityKind.Machine) {
      return null
    }
    return this.selectedEntity.machineId
  }

  private isMachineBusy(machineId: MachineId): boolean {
    return this.machineRegistry.get(machineId)?.isBusy() ?? false
  }

  private buildSelectedMachineSnapshotFields(): Pick<
    GameSnapshot,
    | 'selectedMachine'
    | 'machineAttachments'
    | 'effectiveCapabilities'
    | 'headerSupportedCrops'
    | 'harvestCompatibilityHint'
  > {
    const machineId = this.getSelectedMachineId() ?? MachineId.Tractor1
    const controller = this.machineRegistry.get(machineId)
    const catalog = getMachineCatalogEntry(machineId)
    const operation = controller?.toSnapshot() ?? {
      state: EMPTY_GAME_SNAPSHOT.selectedMachine.state,
      activeJob: null,
      workProgress: 0,
      position: EMPTY_GAME_SNAPSHOT.selectedMachine.position,
      rotationY: EMPTY_GAME_SNAPSHOT.selectedMachine.rotationY,
    }

    const supportedIds = this.capabilityResolver.getHeaderSupportedCropIds(machineId)
    const supportedCrops = supportedIds.map(
      (cropId) => this.cropSystem.getCropName(cropId),
    )

    const harvestCompatibilityHint = this.buildHarvestCompatibilityHint(machineId)

    return {
      selectedMachine: buildSelectedMachineSnapshot(
        machineId,
        catalog?.name ?? machineId,
        operation,
        controller?.getGrainBinSnapshot?.() ?? null,
      ),
      machineAttachments:
        this.attachmentSystem.toMachineAttachmentsSnapshot(machineId),
      effectiveCapabilities:
        this.capabilityResolver.getEffectiveCapabilities(machineId),
      headerSupportedCrops: supportedCrops,
      harvestCompatibilityHint,
    }
  }

  private buildHarvestCompatibilityHint(machineId: MachineId): string | null {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (!fieldId || !this.fieldSystem.canHarvest(fieldId)) {
      return null
    }

    const cropId = this.fieldSystem.getFieldCropId(fieldId)
    if (!cropId) {
      return null
    }

    if (!this.capabilityResolver.hasEffectiveCapability(machineId, MachineCapability.Harvest)) {
      return 'This crop requires a harvesting machine.'
    }

    return this.capabilityResolver.getHarvestIncompatibilityMessage(machineId, cropId)
  }

  private notifyListeners(): void {
    this.invalidateSnapshot()
    for (const listener of this.listeners) {
      listener()
    }
  }
}
