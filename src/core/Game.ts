import { SoundManager } from '@audio/SoundManager.ts'
import { World } from '@game/World.ts'
import { GameEventLog } from '@game/GameEventLog.ts'
import { SaveGameService } from '@game/SaveGameService.ts'
import { SaveSlotManager } from '@game/SaveSlotManager.ts'
import { SimulationClock } from '@game/SimulationClock.ts'
import { loadGamePreferences } from '@game/GamePreferences.ts'
import type { GameSessionConfig } from '@game/GameSession.ts'
import { defaultMapPackageRegistry } from '@/maps/MapPackageLoader.ts'
import { loadExportedMapsIntoRegistry } from '@/maps/ExportedMapStorage.ts'
import { setActiveMapContext } from '@/maps/MapRuntimeContext.ts'
import { runGameplayPlacementSelfCheck, captureRuntimeSceneSnapshot } from '@/maps/GameplayPlacementSelfCheck.ts'
import type { TimeScale } from '@/types/simulation-clock.ts'
import { TIME_SCALE_OPTIONS } from '@/types/simulation-clock.ts'
import {
  CameraController,
  AttachmentPresentation,
  CropPresentation,
  FieldOverlayPresentation,
  FieldPresentation,
  MachineInputPresentation,
  MachinePresentation,
  OwnershipPresentation,
  ProductionPresentation,
  RenderingSystem,
  SceneManager,
} from '@rendering/index.ts'
import {
  AttachmentSystem,
  CornCombineJobSystem,
  CropSystem,
  FarmShopSystem,
  FieldSystem,
  FarmStoreSystem,
  GrainCombineJobSystem,
  InventorySystem,
  LogisticsSystem,
  MachineRegistry,
  MachineTickSystem,
  MarketSystem,
  MachineAutomationRegistry,
  MachineCapabilityResolver,
  WorkOrderSystem,
  OwnershipSystem,
  ProductionSystem,
  TractorJobSystem,
  WorldObjectFactory,
  initializeMachineInstanceRegistry,
} from '@systems/index.ts'
import { getFarmStoreByInteractionPoint } from '@/config/farm-store-catalog.ts'
import { getProductDefinition } from '@/config/product-catalog.ts'
import { getMachineCatalogEntry } from '@/config/machine-catalog.ts'
import { getFieldCatalogEntry } from '@/config/field-catalog.ts'
import { simulationSecondsToRealSeconds } from '@/config/time-balance.ts'
import { getProcessedProductDefinition } from '@/config/production-catalog.ts'
import { SAVE_VERSION } from '@/config/save.ts'
import { buildFleetSnapshots } from '@core/buildFleetSnapshots.ts'
import { clampRadialAnchor } from '@/utils/radial-menu-position.ts'
import type { GameConfig } from '@/types/index.ts'
import { DEFAULT_GAME_CONFIG } from '@/types/index.ts'
import type { IDisposable } from '@/types/index.ts'
import type { GameSaveData } from '@/types/save.ts'
import type { ShopUpgradeId } from '@/types/shop.ts'
import type { FarmStoreId } from '@/types/farm-store.ts'
import { FieldOwnership } from '@/types/ownership.ts'
import type { ProductCategory } from '@/types/product.ts'
import { isPurchasedTractorInstanceId, MachineTemplateId } from '@/types/machine-template.ts'
import type { IMachineController } from '@/types/machine-controller.ts'
import type { ProcessedProductId } from '@/types/production.ts'
import {
  EMPTY_SELECTED_ENTITY,
  FieldRadialActionKind,
  FieldWorkModeActionKind,
  MachineCapability,
  MachineId,
  MachineRadialActionKind,
  SelectedEntityKind,
  type FieldContextMenuSnapshot,
  type FieldWorkModeMenuSnapshot,
  type MachineCommand,
  type MachineContextMenuSnapshot,
  type SelectedEntitySnapshot,
} from '@/types/machine.ts'
import {
  InteractionPointId,
  InteractionRadialActionKind,
  type InteractionContextMenuSnapshot,
} from '@/types/interaction-point.ts'
import {
  CommandOwner,
  type AutomationTaskKind,
  type IssueMachineCommandContext,
} from '@/types/machine-automation.ts'
import {
  buildFieldWorkCommand,
  fieldRadialActionToAutomationTask,
} from '@systems/MachineAutomationRegistry.ts'
import {
  buildWorkOrderDisplayName,
  resolveWorkOrderFieldQueue,
  type WorkOrderFieldEligibility,
} from '@systems/WorkOrderSystem.ts'
import { WorkOrderScopeKind, WorkOrderStatus, getWorkOrderScopeBlockId } from '@/types/work-order.ts'
import type { WorkOrderScope, WorkOrderSnapshot } from '@/types/work-order.ts'
import { getInteractionPointDefinition } from '@/config/interaction-point-catalog.ts'
import {
  AttachmentLifecycleState,
  AttachmentRadialActionKind,
  AttachmentType,
  type AttachmentContextMenuSnapshot,
  type AttachmentIdValue,
  type MachineSlotIdValue,
} from '@/types/attachment.ts'
import { EMPTY_GAME_SNAPSHOT, buildSelectedMachineSnapshot, type GameSnapshot } from './GameSnapshot.ts'
import { GameLoop } from './GameLoop.ts'

export class Game implements IDisposable {
  private readonly sceneManager: SceneManager
  private readonly renderingSystem: RenderingSystem
  private readonly cameraController: CameraController
  private readonly world: World
  private readonly cropSystem: CropSystem
  private readonly inventorySystem: InventorySystem
  private readonly marketSystem: MarketSystem
  private readonly farmShopSystem: FarmShopSystem
  private readonly farmStoreSystem: FarmStoreSystem
  private readonly worldObjectFactory: WorldObjectFactory
  private readonly productionSystem: ProductionSystem
  private readonly fieldSystem: FieldSystem
  private readonly ownershipSystem: OwnershipSystem
  private readonly tractorJobSystem: TractorJobSystem
  private readonly grainCombineJobSystem: GrainCombineJobSystem
  private readonly cornCombineJobSystem: CornCombineJobSystem
  private readonly attachmentSystem: AttachmentSystem
  private readonly logisticsSystem: LogisticsSystem
  private readonly capabilityResolver: MachineCapabilityResolver
  private readonly machineRegistry: MachineRegistry
  private readonly machineAutomationRegistry: MachineAutomationRegistry
  private readonly workOrderSystem: WorkOrderSystem
  private readonly machineTickSystem: MachineTickSystem
  private readonly eventLog: GameEventLog
  private readonly soundManager: SoundManager
  private readonly saveGameService: SaveGameService
  private readonly saveSlotManager: SaveSlotManager
  private readonly simulationClock: SimulationClock
  private sessionConfig: GameSessionConfig | null = null
  private playTimeSeconds = 0
  private createdAt = new Date().toISOString()
  private lastTimeScale: TimeScale = 1
  private timeHudRefreshAccumulator = 0
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
  private fieldWorkModeMenu: FieldWorkModeMenuSnapshot | null = null
  private attachmentContextMenu: AttachmentContextMenuSnapshot | null = null
  private machineContextMenu: MachineContextMenuSnapshot | null = null
  private interactionContextMenu: InteractionContextMenuSnapshot | null = null
  private autoSaveEnabled = false
  private disposed = false
  private started = false
  private fleetPanelOpen = false
  private pendingPurchasedMachineSave: GameSaveData['machines'] | null = null
  private visualBenchmarkInput: IDisposable | null = null

  constructor(
    canvas: HTMLCanvasElement,
    config: GameConfig = DEFAULT_GAME_CONFIG,
  ) {
    this.sceneManager = new SceneManager(canvas, config)
    this.renderingSystem = new RenderingSystem(this.sceneManager)
    this.cameraController = new CameraController(this.sceneManager)
    this.world = new World()
    this.soundManager = new SoundManager()
    this.eventLog = new GameEventLog((entry) => {
      this.soundManager.playForGameEvent(entry.kind)
    })
    this.saveGameService = new SaveGameService()
    this.saveSlotManager = new SaveSlotManager()
    this.simulationClock = new SimulationClock()
    initializeMachineInstanceRegistry()
    this.cropSystem = new CropSystem()
    this.inventorySystem = new InventorySystem()
    this.marketSystem = new MarketSystem()
    this.farmShopSystem = new FarmShopSystem(this.world)
    this.farmStoreSystem = new FarmStoreSystem()
    this.worldObjectFactory = new WorldObjectFactory()
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
    this.logisticsSystem = new LogisticsSystem()
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
    this.machineAutomationRegistry = new MachineAutomationRegistry()
    this.workOrderSystem = new WorkOrderSystem()
    this.machineRegistry.register(this.tractorJobSystem)
    this.machineRegistry.register(this.grainCombineJobSystem)
    this.machineRegistry.register(this.cornCombineJobSystem)
    this.worldObjectFactory.setFieldSystem(this.fieldSystem)
    this.worldObjectFactory.setCropSystem(this.cropSystem)
    this.worldObjectFactory.setFarmShopSystem(this.farmShopSystem)
    this.worldObjectFactory.setCapabilityResolver(this.capabilityResolver)
    this.worldObjectFactory.setLogisticsSystem(this.logisticsSystem)
    this.worldObjectFactory.setMachineRegistry(this.machineRegistry)
    this.machineTickSystem = new MachineTickSystem(this.machineRegistry)
    this.logisticsSystem.setMachineRegistry(this.machineRegistry)
    this.logisticsSystem.setAttachmentSystem(this.attachmentSystem)
    this.logisticsSystem.setInventorySystem(this.inventorySystem)
    this.logisticsSystem.setCurrentDayProvider(() => this.world.currentDay)
    this.logisticsSystem.setOnTransfer(() => {
      this.autoSave()
      this.notifyListeners()
      this.machinePresentation.syncVisuals()
      this.attachmentPresentation.syncVisuals()
    })
    this.logisticsSystem.setOnTransferFailed(() => {
      this.eventLog.recordLogisticsTransferFailed(this.world.currentDay)
      this.notifyListeners()
    })
    for (const system of [
      this.tractorJobSystem,
      this.grainCombineJobSystem,
      this.cornCombineJobSystem,
    ]) {
      system.setLogisticsSystem(this.logisticsSystem)
      system.setMachineRegistry(this.machineRegistry)
    }
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
      {
        update: (realDeltaTime) => this.tickSimulation(realDeltaTime),
      },
    ])
  }

  private tickSimulation(realDeltaTime: number): void {
    if (this.simulationClock.getTimeScale() > 0) {
      this.playTimeSeconds += realDeltaTime
    }
    this.simulationClock.tick(realDeltaTime)
    const simulationDeltaTime = this.simulationClock.getLastSimulationDeltaTime()
    this.fieldSystem.update(simulationDeltaTime)
    this.productionSystem.update(simulationDeltaTime)
    this.machineTickSystem.update(simulationDeltaTime)
    this.cameraController.update(realDeltaTime)
    if (this.simulationClock.getTimeScale() > 0) {
      this.timeHudRefreshAccumulator += realDeltaTime
      if (this.timeHudRefreshAccumulator >= 0.5) {
        this.timeHudRefreshAccumulator = 0
        this.notifyListeners()
      }
    }
  }

  getSimulationClock(): SimulationClock {
    return this.simulationClock
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

  fertilizeField(fieldId: string): void {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return
    }
    this.closeFieldContextMenu()
    this.syncHudFieldWhileMachineSelected(fieldId)
    this.issueMachineCommand(machineId, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'fertilize' },
    })
  }

  sprayField(fieldId: string): void {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return
    }
    this.closeFieldContextMenu()
    this.syncHudFieldWhileMachineSelected(fieldId)
    this.issueMachineCommand(machineId, {
      destination: { kind: 'field', fieldId },
      task: { kind: 'spray' },
    })
  }

  openFieldContextMenu(
    fieldId: string,
    screenX: number,
    screenY: number,
  ): void {
    this.closeFieldWorkModeMenu()
    this.closeAttachmentContextMenu()
    this.closeMachineContextMenu()
    this.closeInteractionContextMenu()
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

  openFieldWorkModeMenu(
    fieldId: string,
    taskKind: FieldRadialActionKind,
    screenX: number,
    screenY: number,
  ): void {
    if (taskKind === FieldRadialActionKind.Cancel) {
      return
    }

    const machineId = this.getSelectedMachineId()
    if (!machineId || this.isMachineBusy(machineId)) {
      return
    }

    this.closeFieldContextMenu()
    const anchor = clampRadialAnchor(screenX, screenY)
    const actions: FieldWorkModeActionKind[] = [
      FieldWorkModeActionKind.PerformManually,
      FieldWorkModeActionKind.GpsThisField,
    ]
    if (this.fieldSystem.getSelectedFieldIds().length > 0) {
      actions.push(FieldWorkModeActionKind.GpsSelectedFields)
    }
    if (getFieldCatalogEntry(fieldId)?.blockId) {
      actions.push(FieldWorkModeActionKind.GpsEntireBlock)
    }
    actions.push(FieldWorkModeActionKind.Cancel)
    this.fieldWorkModeMenu = {
      fieldId,
      taskKind,
      screenX: anchor.x,
      screenY: anchor.y,
      actions,
    }
    this.notifyListeners()
  }

  closeFieldWorkModeMenu(): void {
    if (!this.fieldWorkModeMenu) {
      return
    }
    this.fieldWorkModeMenu = null
    this.notifyListeners()
  }

  performFieldWorkManually(
    fieldId: string,
    taskKind: FieldRadialActionKind,
  ): void {
    this.closeFieldWorkModeMenu()
    switch (taskKind) {
      case FieldRadialActionKind.Plow:
        this.plowField(fieldId)
        break
      case FieldRadialActionKind.Harvest:
        this.harvestField(fieldId)
        break
      case FieldRadialActionKind.Fertilize:
        this.fertilizeField(fieldId)
        break
      case FieldRadialActionKind.Spray:
        this.sprayField(fieldId)
        break
      default:
        break
    }
  }

  performFieldWorkGps(
    contextFieldId: string,
    taskKind: FieldRadialActionKind,
    options?: {
      cropId?: string
      gpsScope?: 'this_field' | 'selected_fields' | 'entire_block'
    },
  ): void {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return
    }

    const automationTask = fieldRadialActionToAutomationTask(taskKind)
    if (!automationTask) {
      return
    }

    this.closeFieldWorkModeMenu()

    const gpsScope = options?.gpsScope ?? 'this_field'
    const cropId = options?.cropId
    let scope: WorkOrderScope

    switch (gpsScope) {
      case 'selected_fields':
        scope = {
          kind: WorkOrderScopeKind.Fields,
          fieldIds: this.fieldSystem.getSelectedFieldIds(),
        }
        break
      case 'entire_block': {
        const blockId = getFieldCatalogEntry(contextFieldId)?.blockId
        if (!blockId) {
          return
        }
        scope = {
          kind: WorkOrderScopeKind.Block,
          blockId,
        }
        break
      }
      default:
        scope = {
          kind: WorkOrderScopeKind.Single,
          fieldId: contextFieldId,
        }
        break
    }

    const cropName = cropId ? this.cropSystem.getCropName(cropId) : undefined
    const displayName = buildWorkOrderDisplayName({
      taskKind: automationTask,
      scope,
      cropName,
    })

    this.createAndAssignWorkOrder({
      displayName,
      taskKind: automationTask,
      cropId,
      scope,
      commandOwner: CommandOwner.Gps,
      assignedMachineId: machineId,
    })
  }

  createAndAssignWorkOrder(params: {
    displayName: string
    taskKind: AutomationTaskKind
    cropId?: string
    scope: WorkOrderScope
    commandOwner: CommandOwner
    assignedMachineId: MachineId
    workerId?: string | null
  }): boolean {
    const { assignedMachineId } = params
    if (this.isMachineBusy(assignedMachineId)) {
      return false
    }
    if (this.workOrderSystem.getActiveOrderForMachine(assignedMachineId)) {
      return false
    }

    const pendingFieldIds = resolveWorkOrderFieldQueue(
      params.scope,
      params.taskKind,
      params.cropId,
      assignedMachineId,
      this.getWorkOrderEligibility(),
    )
    if (pendingFieldIds.length === 0) {
      return false
    }

    const order = this.workOrderSystem.createOrder(
      {
        displayName: params.displayName,
        taskKind: params.taskKind,
        cropId: params.cropId,
        scope: params.scope,
        commandOwner: params.commandOwner,
        assignedMachineId,
        workerId: params.workerId ?? null,
        createdAtDay: this.world.currentDay,
      },
      pendingFieldIds,
    )
    if (!order) {
      return false
    }

    this.eventLog.recordWorkOrderCreated(order.displayName, this.world.currentDay)
    this.machineAutomationRegistry.setAutomation(
      assignedMachineId,
      params.commandOwner,
      order.id,
    )
    this.advanceWorkOrder(assignedMachineId)
    this.autoSave()
    this.notifyListeners()
    return true
  }

  cancelWorkOrder(workOrderId: string): void {
    const order = this.workOrderSystem.get(workOrderId)
    if (!order || order.status !== WorkOrderStatus.Active) {
      return
    }

    const machineId = order.assignedMachineId
    if (machineId) {
      const controller = this.machineRegistry.get(machineId)
      if (controller?.isBusy()) {
        controller.cancelActiveCommand()
      }
      this.machineAutomationRegistry.clearAutomation(machineId)
    }

    this.workOrderSystem.cancelOrder(workOrderId)
    this.eventLog.recordWorkOrderCancelled(order.displayName, this.world.currentDay, {
      blockId: getWorkOrderScopeBlockId(order.scope),
    })
    this.autoSave()
    this.notifyListeners()
  }

  /** @deprecated Use createAndAssignWorkOrder */
  startGpsFieldWork(
    machineId: MachineId,
    fieldId: string,
    taskKind: AutomationTaskKind,
    cropId?: string,
  ): boolean {
    const scope: WorkOrderScope = {
      kind: WorkOrderScopeKind.Single,
      fieldId,
    }
    const cropName = cropId ? this.cropSystem.getCropName(cropId) : undefined
    return this.createAndAssignWorkOrder({
      displayName: buildWorkOrderDisplayName({
        taskKind,
        scope,
        cropName,
      }),
      taskKind,
      cropId,
      scope,
      commandOwner: CommandOwner.Gps,
      assignedMachineId: machineId,
    })
  }

  cancelMachineCommand(machineId: MachineId): void {
    const workOrderId = this.machineAutomationRegistry.getActiveWorkOrderId(machineId)
    if (workOrderId) {
      this.cancelWorkOrder(workOrderId)
      return
    }

    const controller = this.machineRegistry.get(machineId)
    if (!controller) {
      return
    }

    controller.cancelActiveCommand()
    this.machineAutomationRegistry.clearAutomation(machineId)
    this.autoSave()
    this.notifyListeners()
  }

  openAttachmentContextMenu(
    attachmentId: AttachmentIdValue,
    screenX: number,
    screenY: number,
  ): void {
    this.closeFieldContextMenu()
    this.closeMachineContextMenu()
    this.closeInteractionContextMenu()
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

  openMachineContextMenu(
    targetMachineId: MachineId,
    screenX: number,
    screenY: number,
  ): void {
    this.closeFieldContextMenu()
    this.closeAttachmentContextMenu()
    this.closeInteractionContextMenu()

    const actions = this.getMachineRadialActions(targetMachineId)
    if (actions.length === 0) {
      return
    }

    const anchor = clampRadialAnchor(screenX, screenY)
    this.machineContextMenu = {
      targetMachineId,
      screenX: anchor.x,
      screenY: anchor.y,
      actions: [...actions, MachineRadialActionKind.Cancel],
      loadActionLabel: this.getLoadActionLabel(targetMachineId),
    }
    this.notifyListeners()
  }

  private getLoadActionLabel(targetMachineId: MachineId): string {
    const bin =
      this.machineRegistry.get(targetMachineId)?.getGrainBinSnapshot?.()
    if (bin?.hasCargo) {
      return 'Vysypat'
    }
    return 'Naložit'
  }

  resolveAttachmentHostMachineId(
    attachmentId: AttachmentIdValue,
  ): MachineId | null {
    const attachment = this.attachmentSystem.getAttachment(attachmentId)
    if (
      !attachment ||
      attachment.lifecycleState !== AttachmentLifecycleState.Attached ||
      !attachment.mountedOn
    ) {
      return null
    }
    return attachment.mountedOn.machineId
  }

  closeMachineContextMenu(): void {
    if (!this.machineContextMenu) {
      return
    }
    this.machineContextMenu = null
    this.notifyListeners()
  }

  openInteractionContextMenu(
    interactionPointId: InteractionPointId,
    screenX: number,
    screenY: number,
  ): void {
    this.closeFieldContextMenu()
    this.closeAttachmentContextMenu()
    this.closeMachineContextMenu()

    const actions = this.getInteractionRadialActions(interactionPointId)
    if (actions.length === 0) {
      return
    }

    const definition = getInteractionPointDefinition(interactionPointId)
    if (!definition) {
      return
    }

    const anchor = clampRadialAnchor(screenX, screenY)
    this.interactionContextMenu = {
      interactionPointId,
      interactionType: definition.type,
      label: definition.label,
      screenX: anchor.x,
      screenY: anchor.y,
      actions: [...actions, InteractionRadialActionKind.Cancel],
    }
    this.notifyListeners()
  }

  closeInteractionContextMenu(): void {
    if (!this.interactionContextMenu) {
      return
    }
    this.interactionContextMenu = null
    this.notifyListeners()
  }

  loadFromCombine(targetMachineId: MachineId): void {
    const selectedMachineId = this.getSelectedMachineId()
    if (!selectedMachineId) {
      return
    }

    this.closeMachineContextMenu()

    if (
      this.logisticsSystem.machineHasTrailer(selectedMachineId) &&
      this.logisticsSystem.canLoadFromCombine(targetMachineId, selectedMachineId)
    ) {
      this.issueLoadCommand(targetMachineId, selectedMachineId)
      return
    }

    if (
      this.logisticsSystem.machineHasTrailer(targetMachineId) &&
      this.logisticsSystem.canLoadFromCombine(selectedMachineId, targetMachineId)
    ) {
      this.issueLoadCommand(selectedMachineId, targetMachineId)
    }
  }

  private issueLoadCommand(
    sourceMachineId: MachineId,
    haulerMachineId: MachineId,
  ): void {
    this.issueMachineCommand(haulerMachineId, {
      destination: { kind: 'machine', machineId: sourceMachineId },
      task: { kind: 'load_from_combine', sourceMachineId },
    })
  }

  unloadToSilo(interactionPointId: InteractionPointId): void {
    const haulerMachineId = this.getSelectedMachineId()
    if (!haulerMachineId) {
      return
    }

    this.closeInteractionContextMenu()
    this.issueMachineCommand(haulerMachineId, {
      destination: { kind: 'building', buildingId: interactionPointId },
      task: { kind: 'unload_to_silo', interactionPointId },
    })
  }

  getMachineRadialActions(targetMachineId: MachineId): MachineRadialActionKind[] {
    const selectedMachineId = this.getSelectedMachineId()
    if (!selectedMachineId || this.isMachineBusy(selectedMachineId)) {
      return []
    }

    if (selectedMachineId === targetMachineId) {
      return []
    }

    if (
      this.logisticsSystem.machineHasTrailer(selectedMachineId) &&
      this.logisticsSystem.canLoadFromCombine(targetMachineId, selectedMachineId)
    ) {
      return [MachineRadialActionKind.LoadFromCombine]
    }

    if (
      this.logisticsSystem.machineHasTrailer(targetMachineId) &&
      this.logisticsSystem.canLoadFromCombine(selectedMachineId, targetMachineId)
    ) {
      return [MachineRadialActionKind.LoadFromCombine]
    }

    return []
  }

  resolveLogisticsTargetMachineId(
    attachmentId: AttachmentIdValue,
  ): MachineId | null {
    const attachment = this.attachmentSystem.getAttachment(attachmentId)
    if (
      !attachment ||
      attachment.attachmentType !== AttachmentType.Trailer ||
      attachment.lifecycleState !== AttachmentLifecycleState.Attached ||
      !attachment.mountedOn
    ) {
      return null
    }
    return attachment.mountedOn.machineId
  }

  tryOpenMachineLogisticsMenu(
    targetMachineId: MachineId,
    screenX: number,
    screenY: number,
  ): boolean {
    const actions = this.getMachineRadialActions(targetMachineId)
    if (actions.length === 0) {
      return false
    }
    this.openMachineContextMenu(targetMachineId, screenX, screenY)
    return true
  }

  getInteractionRadialActions(
    interactionPointId: InteractionPointId,
  ): InteractionRadialActionKind[] {
    const store = getFarmStoreByInteractionPoint(interactionPointId)
    if (store) {
      return [InteractionRadialActionKind.OpenStore]
    }

    const haulerMachineId = this.getSelectedMachineId()
    if (!haulerMachineId || this.isMachineBusy(haulerMachineId)) {
      return []
    }

    if (interactionPointId !== InteractionPointId.SiloEntry) {
      return []
    }

    if (!this.logisticsSystem.canUnloadToSilo(haulerMachineId)) {
      return []
    }

    return [InteractionRadialActionKind.UnloadToSilo]
  }

  openFarmStore(storeId: FarmStoreId): void {
    this.closeInteractionContextMenu()
    this.fleetPanelOpen = false
    if (this.farmStoreSystem.openStore(storeId)) {
      this.notifyListeners()
    }
  }

  closeFarmStore(): void {
    if (!this.farmStoreSystem.isOpen()) {
      return
    }
    this.farmStoreSystem.closeStore()
    this.notifyListeners()
  }

  openFleetPanel(): void {
    this.closeFarmStore()
    this.closeFieldContextMenu()
    this.closeAttachmentContextMenu()
    this.closeMachineContextMenu()
    this.closeInteractionContextMenu()
    this.fleetPanelOpen = true
    this.notifyListeners()
  }

  closeFleetPanel(): void {
    if (!this.fleetPanelOpen) {
      return
    }
    this.fleetPanelOpen = false
    this.notifyListeners()
  }

  selectMachineFromFleet(machineId: MachineId): void {
    this.closeFleetPanel()
    this.selectMachine(machineId)
    const controller = this.machineRegistry.get(machineId)
    if (controller) {
      const position = controller.getPosition()
      this.cameraController.focusOn(position.x, position.z)
    }
  }

  setFarmStoreCategory(category: ProductCategory): void {
    this.farmStoreSystem.setActiveCategory(category)
    this.notifyListeners()
  }

  purchaseProduct(productId: string): void {
    const occupiedPositions = [
      ...this.machineRegistry.getAll().map((controller) => {
        const position = controller.getPosition()
        return { x: position.x, z: position.z }
      }),
      ...this.attachmentSystem.getDetachedOccupiedPositions(),
    ]

    const prepared = this.farmStoreSystem.preparePurchase(productId, {
      money: this.world.money,
      currentDay: this.world.currentDay,
      occupiedPositions,
    })

    if (!prepared) {
      return
    }

    if (!this.world.spendMoney(prepared.price)) {
      return
    }

    if (prepared.fulfillment.kind === 'machine') {
      const controller = this.worldObjectFactory.createPurchasedTractor({
        x: prepared.fulfillment.position.x,
        y: prepared.fulfillment.position.y,
        z: prepared.fulfillment.position.z,
        rotationY: prepared.fulfillment.rotationY,
      })

      if (!controller) {
        this.world.addMoney(prepared.price)
        return
      }

      this.wireMachineController(controller)
      this.machineRegistry.register(controller)
      this.machinePresentation.spawnTractorInstance(
        controller.machineId,
        prepared.fulfillment.position,
        prepared.fulfillment.rotationY,
      )
      this.farmStoreSystem.commitPurchase(
        prepared,
        controller.machineId,
        this.world.currentDay,
      )
    } else if (prepared.fulfillment.kind === 'attachment') {
      const delivered = this.attachmentSystem.deliverAttachment(
        prepared.fulfillment.attachmentInstanceId,
        prepared.fulfillment.attachmentCatalogId,
        prepared.fulfillment.position,
        prepared.fulfillment.rotationY,
      )

      if (!delivered) {
        this.world.addMoney(prepared.price)
        return
      }

      this.attachmentPresentation.ensureAttachmentMesh(
        prepared.fulfillment.attachmentInstanceId,
      )
      this.farmStoreSystem.commitPurchase(
        prepared,
        prepared.fulfillment.attachmentInstanceId,
        this.world.currentDay,
      )
      this.attachmentPresentation.syncVisuals()
    } else {
      this.world.addMoney(prepared.price)
      return
    }

    const product = getProductDefinition(productId)
    if (product) {
      this.eventLog.recordProductPurchased(product.name, this.world.currentDay)
    }

    this.autoSave()
    this.notifyListeners()
    this.machinePresentation.syncVisuals()
  }

  openFarmStoreFromInteraction(interactionPointId: InteractionPointId): void {
    const store = getFarmStoreByInteractionPoint(interactionPointId)
    if (!store) {
      return
    }
    this.openFarmStore(store.id)
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
      if (
        cropId &&
        this.capabilityResolver.canHarvestCrop(machineId, cropId) &&
        this.canHarvestIntoBin(machineId, cropId, fieldId)
      ) {
        actions.push(FieldRadialActionKind.Harvest)
      }
    }

    if (
      this.capabilityResolver.hasEffectiveCapability(
        machineId,
        MachineCapability.Fertilize,
      ) &&
      this.fieldSystem.canFertilize(fieldId)
    ) {
      actions.push(FieldRadialActionKind.Fertilize)
    }

    if (
      this.capabilityResolver.hasEffectiveCapability(
        machineId,
        MachineCapability.Spray,
      ) &&
      this.fieldSystem.canSpray(fieldId)
    ) {
      actions.push(FieldRadialActionKind.Spray)
    }

    return actions
  }

  private canHarvestIntoBin(
    machineId: MachineId,
    cropId: string,
    fieldId: string,
  ): boolean {
    const bin = this.machineRegistry.get(machineId)?.getGrainBinSnapshot?.()
    if (!bin) {
      return false
    }
    if (bin.isFull) {
      return false
    }
    const yieldAmount =
      this.cropSystem.getYield(
        cropId,
        this.fieldSystem.getCropCareContext(fieldId) ?? undefined,
      )
    return bin.quantity + yieldAmount <= bin.capacity
  }

  issueMachineCommand(
    machineId: MachineId,
    command: MachineCommand,
    context?: IssueMachineCommandContext,
  ): boolean {
    const commandOwner = context?.commandOwner ?? CommandOwner.Player

    if (commandOwner === CommandOwner.Player) {
      if (
        this.isMachineBusy(machineId) ||
        this.machineAutomationRegistry.getActiveWorkOrderId(machineId)
      ) {
        this.cancelMachineCommand(machineId)
      }
    } else if (this.isMachineBusy(machineId)) {
      return false
    }

    const accepted = this.machineRegistry.issueCommand(machineId, command)
    if (accepted) {
      if (commandOwner !== CommandOwner.Player) {
        this.machineAutomationRegistry.setAutomation(
          machineId,
          commandOwner,
          this.machineAutomationRegistry.getActiveWorkOrderId(machineId),
        )
      }
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
    this.syncCameraInteractionMode()
    this.notifyListeners()
  }

  clearMapSelection(): void {
    this.machinePresentation.setSelectedMachine(null)
    this.fieldSystem.clearSelection()
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.syncCameraInteractionMode()
    this.syncFieldVisuals()
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
    this.syncCameraInteractionMode()
    this.syncFieldVisuals()
    this.autoSave()
    this.notifyListeners()
  }

  toggleFieldSelection(fieldId: string): void {
    this.fieldSystem.toggleFieldSelection(fieldId)
    this.syncFieldVisuals()
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

  /**
   * Reserved — future global work-order orchestration (priorities, manager mode).
   * Phase 16C advances orders per machine via advanceWorkOrder on controller onChange.
   */
  private evaluateWorkOrders(): void {
    // No-op in Phase 16C.
  }

  private advanceWorkOrder(machineId: MachineId): void {
    this.evaluateWorkOrders()

    const workOrderId =
      this.machineAutomationRegistry.getActiveWorkOrderId(machineId)
    if (!workOrderId) {
      return
    }

    let order = this.workOrderSystem.get(workOrderId)
    if (!order || order.status !== WorkOrderStatus.Active) {
      return
    }

    const controller = this.machineRegistry.get(machineId)
    if (!controller || controller.isBusy()) {
      return
    }

    const machineName =
      getMachineCatalogEntry(machineId)?.name ?? machineId
    const workOrderEventContext = {
      commandOwner: order.commandOwner,
      blockId: getWorkOrderScopeBlockId(order.scope),
    }

    if (order.currentFieldId) {
      const completedFieldId = order.currentFieldId
      const field = this.fieldSystem.getField(completedFieldId)
      this.workOrderSystem.completeFieldLeg(workOrderId, completedFieldId)
      this.eventLog.recordWorkOrderFieldCompleted(
        order.displayName,
        field?.name ?? completedFieldId,
        this.world.currentDay,
        workOrderEventContext,
      )
      order = this.workOrderSystem.get(workOrderId)!
    }

    while (order.pendingFieldIds.length > 0) {
      const nextFieldId = order.pendingFieldIds[0]!
      if (
        !this.canMachineWorkField(
          machineId,
          nextFieldId,
          order.taskKind,
          order.cropId,
        )
      ) {
        this.workOrderSystem.skipField(workOrderId, nextFieldId)
        order = this.workOrderSystem.get(workOrderId)!
        continue
      }

      const command = buildFieldWorkCommand(
        nextFieldId,
        order.taskKind,
        order.cropId,
      )
      if (!command) {
        this.workOrderSystem.skipField(workOrderId, nextFieldId)
        order = this.workOrderSystem.get(workOrderId)!
        continue
      }

      if (order.startedAtDay === null) {
        this.workOrderSystem.markStarted(workOrderId, this.world.currentDay)
        this.eventLog.recordWorkOrderStarted(
          order.displayName,
          machineName,
          this.world.currentDay,
          workOrderEventContext,
        )
      }

      this.workOrderSystem.beginFieldLeg(workOrderId, nextFieldId)
      const accepted = this.issueMachineCommand(machineId, command, {
        commandOwner: order.commandOwner,
      })
      if (!accepted) {
        this.workOrderSystem.skipField(workOrderId, nextFieldId)
        order = this.workOrderSystem.get(workOrderId)!
        continue
      }
      return
    }

    this.workOrderSystem.completeOrder(workOrderId)
    this.eventLog.recordWorkOrderCompleted(
      order.displayName,
      machineName,
      this.world.currentDay,
      workOrderEventContext,
    )
    this.machineAutomationRegistry.clearAutomation(machineId)
    this.workOrderSystem.clearCompletedAndCancelled()
  }

  private getWorkOrderEligibility(): WorkOrderFieldEligibility {
    return {
      canWorkField: (machineId, fieldId, taskKind, cropId) =>
        this.canMachineWorkField(machineId, fieldId, taskKind, cropId),
      isFieldUsable: (fieldId) => {
        const ownership = this.ownershipSystem.getOwnership(fieldId)
        return (
          ownership === FieldOwnership.Owned ||
          ownership === FieldOwnership.Leased
        )
      },
    }
  }

  private canMachineWorkField(
    machineId: MachineId,
    fieldId: string,
    taskKind: AutomationTaskKind,
    cropId?: string,
  ): boolean {
    switch (taskKind) {
      case 'plow':
        return this.fieldSystem.canPlow(fieldId)
      case 'seed':
        return cropId
          ? this.fieldSystem.canSeed(fieldId, cropId)
          : this.fieldSystem.canSeedField(fieldId)
      case 'harvest': {
        if (!this.fieldSystem.canHarvest(fieldId)) {
          return false
        }
        const harvestCropId = this.fieldSystem.getFieldCropId(fieldId)
        if (!harvestCropId) {
          return false
        }
        if (
          !this.capabilityResolver.canHarvestCrop(machineId, harvestCropId)
        ) {
          return false
        }
        return this.canHarvestIntoBin(machineId, harvestCropId, fieldId)
      }
      case 'fertilize':
        return this.fieldSystem.canFertilize(fieldId)
      case 'spray':
        return this.fieldSystem.canSpray(fieldId)
      default:
        return false
    }
  }

  private wireMachineController(controller: IMachineController): void {
    const system = controller as TractorJobSystem & {
      setOnChange?: (listener: () => void) => void
      setOnVisualChange?: (listener: () => void) => void
    }

    system.setOnChange?.(() => {
      this.advanceWorkOrder(controller.machineId)
      this.autoSave()
      this.notifyListeners()
    })
    system.setOnVisualChange?.(() => {
      this.machinePresentation.syncVisuals()
      this.attachmentPresentation.syncVisuals()
    })
  }

  private hydratePurchasedMachines(machines: GameSaveData['machines']): void {
    for (const [machineId, machineSave] of Object.entries(machines)) {
      if (!isPurchasedTractorInstanceId(machineId)) {
        continue
      }
      if (this.machineRegistry.get(machineId)) {
        continue
      }

      const controller = this.worldObjectFactory.createMachineFromTemplate(
        MachineTemplateId.SmallTractor,
        machineId,
        {
          x: machineSave.position.x,
          y: machineSave.position.y,
          z: machineSave.position.z,
          rotationY: machineSave.rotationY,
        },
      )

      if (!controller) {
        continue
      }

      this.wireMachineController(controller)
      this.machineRegistry.register(controller)
      controller.applySave(machineSave)
      this.machinePresentation.spawnTractorInstance(
        machineId,
        machineSave.position,
        machineSave.rotationY,
      )
    }

    this.farmStoreSystem.reconcileOwnedProductsFromMachines()
  }

  private removePurchasedMachines(): void {
    for (const controller of [...this.machineRegistry.getAll()]) {
      if (!isPurchasedTractorInstanceId(controller.machineId)) {
        continue
      }
      this.machineRegistry.unregister(controller.machineId)
      this.machinePresentation.despawnInstance(controller.machineId)
      if (controller instanceof TractorJobSystem) {
        controller.dispose()
      }
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
    const normalized = TIME_SCALE_OPTIONS.includes(speed as TimeScale)
      ? (speed as TimeScale)
      : 1
    if (normalized > 0) {
      this.lastTimeScale = normalized
    }
    this.simulationClock.setTimeScale(normalized)
    this.world.setGameSpeed(normalized)
    this.autoSave()
    this.notifyListeners()
  }

  setPaused(paused: boolean): void {
    if (paused) {
      if (this.simulationClock.getTimeScale() > 0) {
        this.lastTimeScale = this.simulationClock.getTimeScale() as TimeScale
      }
      this.simulationClock.setTimeScale(0)
      this.world.setGameSpeed(0)
    } else {
      this.setGameSpeed(this.lastTimeScale)
    }
    this.autoSave()
    this.notifyListeners()
  }

  togglePause(): void {
    this.setPaused(this.simulationClock.getTimeScale() !== 0)
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
    this.farmStoreSystem.initialize()
    this.productionSystem.initialize()
    this.ownershipSystem.initialize()
    this.fieldSystem.initialize()
    this.tractorJobSystem.initialize()
    this.grainCombineJobSystem.initialize()
    this.cornCombineJobSystem.initialize()
    this.removePurchasedMachines()
    this.pendingPurchasedMachineSave = null
    this.attachmentSystem.initialize()
    this.selectedEntity = EMPTY_SELECTED_ENTITY
    this.fieldContextMenu = null
    this.fieldWorkModeMenu = null
    this.attachmentContextMenu = null
    this.machineContextMenu = null
    this.interactionContextMenu = null
    this.machinePresentation.setSelectedMachine(null)
    this.syncCameraInteractionMode()
    this.machineAutomationRegistry.clearAll()
    this.workOrderSystem.clear()
    this.eventLog.clear()
    this.eventLog.recordFarmReset(this.world.currentDay)
    this.syncFieldVisuals()
    this.syncProductionVisuals()
    this.machinePresentation.syncVisuals()
    this.attachmentPresentation.syncVisuals()
    this.persistSave()
    this.notifyListeners()
  }

  async start(session: GameSessionConfig): Promise<void> {
    if (this.disposed || this.started) {
      return
    }

    this.sessionConfig = session
    loadExportedMapsIntoRegistry(defaultMapPackageRegistry)

    const mapId = this.resolveStartupMapId(session)
    const mapContext = await defaultMapPackageRegistry.load(mapId)
    if (this.disposed) {
      return
    }

    setActiveMapContext(mapContext)

    if (import.meta.env.DEV && mapContext.worldMap) {
      const placementCheck = runGameplayPlacementSelfCheck(mapContext.worldMap)
      ;(
        globalThis as { farmosPlacementCheck?: typeof placementCheck }
      ).farmosPlacementCheck = placementCheck
      console.info('[FarmOS] Gameplay placement self-check', placementCheck)
    }

    const preferences = loadGamePreferences()
    this.simulationClock.setRealMinutesPerGameDay(preferences.realMinutesPerGameDay)

    await this.sceneManager.initialize()
    if (this.disposed || !this.sceneManager.isInitialized()) {
      return
    }

    this.renderingSystem.initialize({ shadows: true })
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

    this.fieldSystem.setSimulationClock(this.simulationClock)
    this.productionSystem.setSimulationClock(this.simulationClock)

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
      this.wireMachineController(system)
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
    this.fieldWorkModeMenu = null
    this.attachmentContextMenu = null
    this.machineContextMenu = null
    this.interactionContextMenu = null
    this.machinePresentation.setSelectedMachine(null)

    if (session.isNewGame) {
      const freshSave = this.saveSlotManager.createNewGameSave(
        session.mapId,
        session.farmName,
      )
      this.applySaveData(freshSave)
    } else {
      const saved = this.saveSlotManager.loadSlot(session.slotId)
      if (!saved) {
        throw new Error(`Save slot ${session.slotId} is empty or corrupt`)
      }
      this.applySaveData(saved)
    }

    this.saveSlotManager.setLastPlayedSlotId(session.slotId)

    if (this.disposed) {
      return
    }

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
    this.syncCameraInteractionMode()

    if (import.meta.env.DEV && mapContext.worldMap) {
      const runtimeSnapshot = captureRuntimeSceneSnapshot(scene)
      ;(
        globalThis as {
          farmosRuntimeSnapshot?: typeof runtimeSnapshot
        }
      ).farmosRuntimeSnapshot = runtimeSnapshot
      console.info('[FarmOS] Runtime placement snapshot', runtimeSnapshot)
    }

    if (this.pendingPurchasedMachineSave) {
      this.hydratePurchasedMachines(this.pendingPurchasedMachineSave)
      this.pendingPurchasedMachineSave = null
    }

    this.syncFieldVisuals()
    this.syncProductionVisuals()
    this.machinePresentation.syncVisuals()
    this.attachmentPresentation.syncVisuals()
    this.invalidateSnapshot()
    this.autoSaveEnabled = true
    this.started = true
    this.gameLoop.start(() => this.sceneManager.render())

    if (import.meta.env.DEV) {
      const { createBenchmarkRunner } = await import('@/rendering/debug/BenchmarkRunner.ts')
      const { VisualBenchmarkInput } = await import('@/rendering/debug/VisualBenchmarkInput.ts')
      const runner = createBenchmarkRunner(
        this.sceneManager,
        this.cameraController,
        this.renderingSystem,
      )
      const input = new VisualBenchmarkInput(runner)
      input.attach()
      this.visualBenchmarkInput = input
    }
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
    setActiveMapContext(null)
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
    this.visualBenchmarkInput?.dispose()
    this.visualBenchmarkInput = null
    this.cameraController.dispose()
    this.renderingSystem.dispose()
    this.sceneManager.dispose()
    this.listeners.clear()
    this.cachedSnapshot = EMPTY_GAME_SNAPSHOT
    this.started = false
  }

  private resolveStartupMapId(session: GameSessionConfig): string {
    if (session.isNewGame) {
      return session.mapId
    }

    const saved = this.saveSlotManager.loadSlot(session.slotId)
    return saved?.mapId || session.mapId
  }

  private applySaveData(saved: GameSaveData): void {
    this.autoSaveEnabled = false
    this.createdAt = saved.createdAt ?? new Date().toISOString()
    this.playTimeSeconds = saved.playTimeSeconds ?? 0

    const timeScale = TIME_SCALE_OPTIONS.includes(saved.gameSpeed as TimeScale)
      ? (saved.gameSpeed as TimeScale)
      : 1
    if (timeScale > 0) {
      this.lastTimeScale = timeScale
    }
    this.simulationClock.setTimeScale(timeScale)
    this.simulationClock.setDayFraction(saved.dayFraction ?? 0)

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
    this.farmStoreSystem.applySave(saved.farmStore)
    this.machineAutomationRegistry.applySave(saved.machineAutomation)
    this.workOrderSystem.applySave(saved.workOrders)
    this.pendingPurchasedMachineSave = machines
    this.attachmentSystem.applySave(
      this.saveGameService.normalizeAttachmentsSave(saved.attachments),
    )
    const restoredFieldId = saved.selectedFieldId
    if (restoredFieldId) {
      this.selectedEntity = {
        kind: SelectedEntityKind.Field,
        machineId: null,
        fieldId: restoredFieldId,
        buildingId: null,
      }
    } else {
      this.selectedEntity = EMPTY_SELECTED_ENTITY
    }
    this.fieldContextMenu = null
    this.fieldWorkModeMenu = null
    this.attachmentContextMenu = null
    this.machineContextMenu = null
    this.interactionContextMenu = null
    this.machinePresentation.setSelectedMachine(null)
    this.syncCameraInteractionMode()
    this.reconcileAutomationAfterLoad()

    this.autoSaveEnabled = true
  }

  private reconcileAutomationAfterLoad(): void {
    for (const controller of this.machineRegistry.getAll()) {
      const machineId = controller.machineId
      const workOrderId =
        this.machineAutomationRegistry.getActiveWorkOrderId(machineId)
      if (!workOrderId) {
        continue
      }
      if (!this.workOrderSystem.get(workOrderId)) {
        this.machineAutomationRegistry.clearAutomation(machineId)
        continue
      }
      if (!controller.isBusy()) {
        this.advanceWorkOrder(machineId)
      }
    }
  }

  private captureSaveData(): GameSaveData {
    return {
      version: SAVE_VERSION,
      mapId: this.sessionConfig?.mapId ?? 'map_01',
      farmName: this.sessionConfig?.farmName ?? 'My Farm',
      playTimeSeconds: Math.floor(this.playTimeSeconds),
      createdAt: this.createdAt,
      dayFraction: this.simulationClock.getDayFraction(),
      money: this.world.money,
      currentDay: this.world.currentDay,
      gameSpeed: this.simulationClock.getTimeScale(),
      selectedFieldId: this.fieldSystem.getSelectedFieldId(),
      fields: this.fieldSystem.toSaveFields(),
      ownership: this.ownershipSystem.toSaveOwnership(),
      inventory: this.inventorySystem.toSaveInventory(),
      marketPrices: this.marketSystem.toSavePrices(),
      processedMarketPrices: this.marketSystem.toSaveProcessedPrices(),
      production: this.productionSystem.toSaveData(),
      upgrades: this.farmShopSystem.toSaveUpgrades(),
      machines: Object.fromEntries(
        this.machineRegistry
          .getAll()
          .map((controller) => [controller.machineId, controller.toSaveData()]),
      ),
      attachments: this.attachmentSystem.toSaveData(),
      farmStore: this.farmStoreSystem.toSaveData(),
      machineAutomation: this.machineAutomationRegistry.toSaveData(),
      workOrders: this.workOrderSystem.toSaveData(),
      eventLog: [...this.eventLog.getEntries()],
      eventLogNextId: this.eventLog.getNextId(),
    }
  }

  private persistSave(): void {
    if (!this.sessionConfig) {
      return
    }
    this.saveSlotManager.saveSlot(
      this.sessionConfig.slotId,
      this.captureSaveData(),
      { timeOfDay: this.simulationClock.getTimeOfDayLabel() },
    )
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

  private syncCameraInteractionMode(): void {
    this.cameraController.setInteractionMode(
      this.selectedEntity.kind === SelectedEntityKind.Machine
        ? 'command'
        : 'navigate',
    )
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
        cropCare: { applied: [...field.cropCare.applied] },
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
      gameSpeed: this.simulationClock.getTimeScale(),
      timeOfDay: this.simulationClock.getTimeOfDayLabel(),
      seasonLabel: '—',
      isPaused: this.simulationClock.isPaused(),
      selectedFieldId: this.fieldSystem.getSelectedFieldId(),
      selectedFieldIds: this.fieldSystem.getSelectedFieldIds(),
      selectedEntity: this.selectedEntity,
      fieldContextMenu: this.fieldContextMenu,
      fieldWorkModeMenu: this.fieldWorkModeMenu,
      attachmentContextMenu: this.attachmentContextMenu,
      machineContextMenu: this.machineContextMenu,
      interactionContextMenu: this.interactionContextMenu,
      fields: this.buildFieldSnapshots(),
      crops: this.cropSystem.toSnapshots(),
      inventory: this.inventorySystem.toSnapshots(),
      processedInventory,
      processedMarketPrices,
      mill,
      marketPrices: this.marketSystem.toSnapshots(),
      shopUpgrades: this.farmShopSystem.toSnapshots(this.world.money),
      ...this.buildSelectedMachineSnapshotFields(),
      farmStore: this.farmStoreSystem.buildSnapshot(this.world.money),
      fleetPanelOpen: this.fleetPanelOpen,
      fleet: buildFleetSnapshots({
        machineRegistry: this.machineRegistry,
        attachmentSystem: this.attachmentSystem,
        fields: this.buildFieldSnapshots(),
        selectedMachineId: this.getSelectedMachineId(),
        getCropName: (cropId) => this.cropSystem.getCropName(cropId),
        getCommandOwner: (machineId) =>
          this.machineAutomationRegistry.getCommandOwner(machineId),
        getEffectiveCapabilities: (machineId) =>
          this.capabilityResolver.getEffectiveCapabilities(machineId),
        getWorkOrderForMachine: (machineId) =>
          this.buildWorkOrderSnapshotForMachine(machineId),
      }),
      activeWorkOrder: this.buildActiveWorkOrderSnapshot(),
      eventLog: this.eventLog.getEntries(),
      moneyGain: this.eventLog.getLatestMoneyGain(),
    }
  }

  private buildWorkOrderSnapshotForMachine(
    machineId: MachineId,
  ): WorkOrderSnapshot | null {
    const workOrderId =
      this.machineAutomationRegistry.getActiveWorkOrderId(machineId)
    if (!workOrderId) {
      return null
    }
    const order = this.workOrderSystem.get(workOrderId)
    if (!order || order.status !== WorkOrderStatus.Active) {
      return null
    }
    return this.workOrderSystem.toSnapshot(order, (fieldId) => {
      const field = this.fieldSystem.getField(fieldId)
      return field?.name ?? fieldId
    })
  }

  private buildActiveWorkOrderSnapshot(): WorkOrderSnapshot | null {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return null
    }
    return this.buildWorkOrderSnapshotForMachine(machineId)
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
    | 'logisticsHint'
    | 'trailerCargo'
  > {
    const machineId = this.getSelectedMachineId()
    if (!machineId) {
      return {
        selectedMachine: { ...EMPTY_GAME_SNAPSHOT.selectedMachine },
        machineAttachments: null,
        effectiveCapabilities: [],
        headerSupportedCrops: [],
        harvestCompatibilityHint: null,
        logisticsHint: null,
        trailerCargo: null,
      }
    }

    const controller = this.machineRegistry.get(machineId)
    const catalog = getMachineCatalogEntry(machineId)
    const operation = controller?.toSnapshot() ?? {
      state: EMPTY_GAME_SNAPSHOT.selectedMachine.state,
      activeJob: null,
      activeLogisticsLabel: null,
      workProgress: 0,
      workRemainingSeconds: null,
      position: EMPTY_GAME_SNAPSHOT.selectedMachine.position,
      rotationY: EMPTY_GAME_SNAPSHOT.selectedMachine.rotationY,
    }

    const displayTimeScale = this.simulationClock.isPaused()
      ? this.lastTimeScale
      : this.simulationClock.getTimeScale()
    const workRemainingSeconds =
      operation.workRemainingSeconds != null
        ? simulationSecondsToRealSeconds(
            operation.workRemainingSeconds,
            this.simulationClock.getRealMinutesPerGameDay(),
            displayTimeScale,
          )
        : null

    const displayOperation = {
      ...operation,
      workRemainingSeconds:
        workRemainingSeconds === Infinity ? null : workRemainingSeconds,
    }

    const supportedIds = this.capabilityResolver.getHeaderSupportedCropIds(machineId)
    const supportedCrops = supportedIds.map(
      (cropId) => this.cropSystem.getCropName(cropId),
    )

    const harvestCompatibilityHint = this.buildHarvestCompatibilityHint(machineId)
    const logisticsHint = this.buildLogisticsHint(machineId)
    const trailerCargo = this.attachmentSystem.getMountedTrailerCargoSnapshot(
      machineId,
      (cropId) => this.cropSystem.getCropName(cropId),
    )

    return {
      selectedMachine: buildSelectedMachineSnapshot(
        machineId,
        catalog?.name ?? machineId,
        displayOperation,
        controller?.getGrainBinSnapshot?.() ?? null,
        this.machineAutomationRegistry.getCommandOwner(machineId),
      ),
      machineAttachments:
        this.attachmentSystem.toMachineAttachmentsSnapshot(machineId),
      effectiveCapabilities:
        this.capabilityResolver.getEffectiveCapabilities(machineId),
      headerSupportedCrops: supportedCrops,
      harvestCompatibilityHint,
      logisticsHint,
      trailerCargo,
    }
  }

  private buildLogisticsHint(machineId: MachineId): string | null {
    const bin = this.machineRegistry.get(machineId)?.getGrainBinSnapshot?.()
    if (bin?.isFull) {
      return 'Zásobník plný — pravým tlačítkem na stroj s přívěsem zvolte Naložit.'
    }
    if (bin?.hasCargo) {
      return 'Pravým tlačítkem na stroj s přívěsem zvolte Naložit.'
    }

    const trailer = this.attachmentSystem.getMountedTrailerCargoSnapshot(
      machineId,
      (cropId) => this.cropSystem.getCropName(cropId),
    )
    if (trailer?.isFull) {
      return 'Přívěs plný — u sila zvolte Vyložit.'
    }
    if (trailer?.hasCargo) {
      return 'U vstupu do sila pravým tlačítkem zvolte Vyložit.'
    }

    if (this.logisticsSystem.machineHasTrailer(machineId)) {
      for (const combineId of [MachineId.GrainCombine1, MachineId.CornCombine1]) {
        if (
          this.logisticsSystem.canLoadFromCombine(combineId, machineId)
        ) {
          return 'Pravým tlačítkem na sklízecí stroj zvolte Vysypat.'
        }
      }
    }

    const binOnSelected =
      this.machineRegistry.get(machineId)?.getGrainBinSnapshot?.()
    if (binOnSelected?.hasCargo) {
      return 'Pravým tlačítkem na stroj s přívěsem zvolte Naložit.'
    }

    return null
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
      return 'K této plodině potřebujete sklízeč.'
    }

    const bin = this.machineRegistry.get(machineId)?.getGrainBinSnapshot?.()
    if (bin?.isFull) {
      return 'Zásobník plný — naložte na přívěs a pokračujte ve sklizni.'
    }

    if (cropId && bin && fieldId && !this.canHarvestIntoBin(machineId, cropId, fieldId)) {
      const cropName = this.cropSystem.getCropName(cropId)
      return `Zásobník nepojme celou sklizeň: ${cropName}.`
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
