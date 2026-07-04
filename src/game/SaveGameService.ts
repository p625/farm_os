import { STARTING_MONEY } from '@/config/game-balance.ts'
import { CROP_CATALOG, DEFAULT_CROP_ID } from '@/config/crop-catalog.ts'
import { getFieldCatalog, getFieldCatalogEntry } from '@/config/field-catalog.ts'
import {
  getEquipmentYardSpawnPositions,
  getTractorHome,
  getTractorHomeRotationY,
} from '@/config/farm-layout.ts'
import { findOpenDeliverySlot } from '@/config/delivery-zone-catalog.ts'
import { getGroundedPosition, groundSavedPosition } from '@/maps/grounding.ts'
import { fieldTestStateToSaveSlice } from '@/types/field-test-state.ts'
import { resolveMachineHome } from '@/maps/resolveMachineHome.ts'
import { tryGetActiveMapContext } from '@/maps/MapRuntimeContext.ts'
import {
  hasStudioMachinePlacements,
  resolveRuntimeMachineSpawns,
} from '@/maps/resolveRuntimeMachineSpawns.ts'
import { resolveRuntimeAttachmentSpawns } from '@/maps/resolveRuntimeAttachmentSpawns.ts'
import { parseVehiclePlacementProperties } from '@/types/vehicle-placement.ts'
import {
  DEFAULT_ATTACHMENT_SPAWNS,
  getAttachmentCatalogEntry,
} from '@/config/attachment-catalog.ts'
import type { WorkOrderSaveData } from '@/types/work-order.ts'
import { WorkOrderScopeKind, WorkOrderStatus } from '@/types/work-order.ts'
import { CommandOwner } from '@/types/machine-automation.ts'
import type { MachineAutomationSaveData } from '@/types/machine-automation.ts'
import { MachineId } from '@/types/machine.ts'
import { AttachmentLifecycleState, AttachmentWorkPosition } from '@/types/attachment.ts'
import { PROCESSED_CATALOG } from '@/config/production-catalog.ts'
import { SHOP_CATALOG } from '@/config/shop-catalog.ts'
import { SAVE_STORAGE_KEY, SAVE_VERSION } from '@/config/save.ts'
import { FieldOwnership } from '@/types/ownership.ts'
import { ProductionBuildingId, ProductionBuildingState } from '@/types/production.ts'
import { emptyFieldCropCare, normalizeFieldCropCare } from '@/types/crop-care.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { TractorState } from '@/types/tractor.ts'
import { isLogisticsSaveCommand } from '@systems/MachineLogisticsSupport.ts'
import { isPurchasedTractorInstanceId } from '@/types/machine-template.ts'
import type { FarmStoreSaveData } from '@/types/farm-store.ts'
import { DeliveryZoneId } from '@/types/delivery.ts'
import { DEFAULT_GRAIN_BIN_CAPACITY, type GrainBinSaveData } from '@/types/grain-bin.ts'
import type {
  AttachmentsSaveData,
  GameSaveData,
  MachineSaveData,
  MachinesSaveData,
  ProductionSaveData,
} from '@/types/save.ts'

type LegacySaveData = Omit<
  GameSaveData,
  | 'machines'
  | 'attachments'
  | 'farmStore'
  | 'machineAutomation'
  | 'workOrders'
  | 'mapId'
  | 'farmName'
  | 'playTimeSeconds'
  | 'createdAt'
  | 'dayFraction'
> & {
  version?: number
  machine?: MachineSaveData
  machines?: MachinesSaveData
  attachments?: AttachmentsSaveData
  farmStore?: FarmStoreSaveData
  machineAutomation?: MachineAutomationSaveData[]
  workOrders?: WorkOrderSaveData[]
  mapId?: string
  farmName?: string
  playTimeSeconds?: number
  createdAt?: string
  dayFraction?: number
}

export class SaveGameService {
  normalizeSaveData(data: unknown): GameSaveData | null {
    if (!data || typeof data !== 'object') {
      return null
    }
    return this.normalizeSave(data as LegacySaveData)
  }

  createDefaultSave(mapId: string, farmName: string): GameSaveData {
    const base: LegacySaveData = {
      version: SAVE_VERSION,
      mapId,
      farmName,
      playTimeSeconds: 0,
      createdAt: new Date().toISOString(),
      dayFraction: 0,
      money: STARTING_MONEY,
      currentDay: 1,
      gameSpeed: 1,
      selectedFieldId: 'field_1',
      fields: this.mergeFieldSaveSlices([]),
      ownership: this.mergeOwnershipSaveSlices([]),
      inventory: this.emptyInventory(),
      marketPrices: this.baseMarketPrices(),
      processedMarketPrices: this.baseProcessedMarketPrices(),
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machines: this.buildInitialMachinesSave(),
      attachments: this.buildInitialAttachmentsSave(),
      farmStore: this.normalizeFarmStoreSave(undefined),
      eventLog: [],
      eventLogNextId: 1,
      machineAutomation: [],
      workOrders: [],
    }
    return this.repairSave(base)
  }

  save(data: GameSaveData): void {
    const payload: GameSaveData = {
      ...data,
      version: SAVE_VERSION,
    }
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload))
  }

  load(): GameSaveData | null {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      const parsed = JSON.parse(raw) as LegacySaveData
      return this.normalizeSave(parsed)
    } catch {
      return null
    }
  }

  clear(): void {
    localStorage.removeItem(SAVE_STORAGE_KEY)
  }

  private normalizeSave(data: LegacySaveData): GameSaveData | null {
    if (data.version === 1) {
      const migrated = this.migrateFromV1(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 2) {
      const migrated = this.migrateFromV2(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 3) {
      const migrated = this.migrateFromV3(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 4) {
      const migrated = this.migrateFromV4(data)
      return migrated ? this.normalizeSave(migrated) : null
    }
    if (data.version === 5) {
      const migrated = this.migrateFromV5(data)
      return migrated ? this.repairSave(migrated) : null
    }
    if (data.version === 6) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(data as LegacySaveData)
    }
    if (data.version === 7) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(this.migrateFromV7(data as LegacySaveData))
    }
    if (data.version === 9) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(this.migrateFromV9(data as LegacySaveData))
    }
    if (data.version === 10) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(this.migrateFromV10(data as LegacySaveData))
    }
    if (data.version === 11) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(this.migrateFromV11(data as LegacySaveData))
    }
    if (data.version === 12) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(this.migrateFromV12(data as LegacySaveData))
    }
    if (data.version === 13) {
      if (!this.isValidCoreSave(data)) {
        return null
      }
      return this.repairSave(this.migrateFromV13(data as LegacySaveData))
    }
    if (!this.isValidCoreSave(data)) {
      return null
    }
    return this.repairSave(data as LegacySaveData)
  }

  normalizeMachineSave(
    machine: unknown,
    machineId: MachineId = MachineId.Tractor1,
  ): MachineSaveData {
    const defaults = this.emptyMachineFor(machineId)

    if (!machine || typeof machine !== 'object') {
      return defaults
    }

    const saved = machine as Partial<MachineSaveData>
    const rawPosition =
      saved.position &&
      typeof saved.position.x === 'number' &&
      typeof saved.position.y === 'number' &&
      typeof saved.position.z === 'number'
        ? saved.position
        : defaults.position
    const position = groundSavedPosition(rawPosition)

    const state =
      saved.state === TractorState.Idle ||
      saved.state === TractorState.Moving ||
      saved.state === TractorState.Working
        ? saved.state
        : defaults.state

    const rotationY =
      typeof saved.rotationY === 'number' ? saved.rotationY : defaults.rotationY

    let activeCommand = defaults.activeCommand
    let activeWork = defaults.activeWork
    let workTimer = defaults.workTimer
    let workDuration = defaults.workDuration

    if (saved.activeCommand && typeof saved.activeCommand === 'object') {
      activeCommand = saved.activeCommand
      activeWork =
        saved.activeWork && typeof saved.activeWork === 'object'
          ? saved.activeWork
          : null
      workTimer =
        typeof saved.workTimer === 'number' && saved.workTimer >= 0
          ? saved.workTimer
          : 0
      workDuration =
        typeof saved.workDuration === 'number' && saved.workDuration > 0
          ? saved.workDuration
          : defaults.workDuration

      if (state === TractorState.Working) {
        const hasFieldWork =
          activeWork !== null && typeof activeWork.fieldId === 'string'
        const hasLogistics = isLogisticsSaveCommand(activeCommand)
        if (!hasFieldWork && !hasLogistics) {
          return defaults
        }
      }
    } else if (state !== TractorState.Idle) {
      return defaults
    }

    const savedMachineId =
      saved.machineId === MachineId.Tractor1 ||
      saved.machineId === MachineId.GrainCombine1 ||
      saved.machineId === MachineId.CornCombine1
        ? saved.machineId
        : machineId

    const result: MachineSaveData = {
      machineId: savedMachineId,
      position,
      rotationY,
      state,
      activeCommand,
      activeWork,
      workTimer,
      workDuration,
    }

    if (savedMachineId !== MachineId.Tractor1) {
      result.grainBin = this.normalizeGrainBin(saved.grainBin)
    }

    return result
  }

  private normalizeGrainBin(bin: unknown): GrainBinSaveData {
    if (!bin || typeof bin !== 'object') {
      return this.emptyGrainBin()
    }

    const saved = bin as Partial<GrainBinSaveData>
    const capacity =
      typeof saved.capacity === 'number' && saved.capacity > 0
        ? saved.capacity
        : DEFAULT_GRAIN_BIN_CAPACITY
    const quantity =
      typeof saved.quantity === 'number' && saved.quantity >= 0
        ? saved.quantity
        : 0
    const cropId =
      typeof saved.cropId === 'string' && quantity > 0 ? saved.cropId : null

    return {
      capacity,
      quantity,
      cropId,
    }
  }

  normalizeProductionSave(production: unknown): ProductionSaveData {
    const defaults = this.emptyProduction()

    if (!production || typeof production !== 'object') {
      return defaults
    }

    const saved = production as Partial<ProductionSaveData>
    if (
      !Array.isArray(saved.buildings) ||
      !Array.isArray(saved.processedInventory)
    ) {
      return defaults
    }

    const savedMill = saved.buildings.find(
      (building) => building?.id === ProductionBuildingId.Mill,
    )

    const buildings = savedMill
      ? [
          {
            id: ProductionBuildingId.Mill,
            state: this.normalizeBuildingState(savedMill.state),
            queue: this.normalizeQueue(savedMill.queue),
          },
        ]
      : defaults.buildings

    const processedInventory = defaults.processedInventory.map((defaultItem) => {
      const savedItem = saved.processedInventory!.find(
        (item) => item?.productId === defaultItem.productId,
      )
      const quantity =
        typeof savedItem?.quantity === 'number' && savedItem.quantity >= 0
          ? savedItem.quantity
          : 0

      return {
        productId: defaultItem.productId,
        quantity,
      }
    })

    return {
      buildings,
      processedInventory,
    }
  }

  normalizeAttachmentsSave(attachments: unknown): AttachmentsSaveData {
    const worldMap = tryGetActiveMapContext()?.worldMap
    if (
      worldMap &&
      resolveRuntimeAttachmentSpawns(worldMap).length > 0 &&
      attachments &&
      typeof attachments === 'object' &&
      Array.isArray((attachments as AttachmentsSaveData).items)
    ) {
      return attachments as AttachmentsSaveData
    }

    const defaults = this.emptyAttachments()

    if (!attachments || typeof attachments !== 'object') {
      return defaults
    }

    const saved = attachments as Partial<AttachmentsSaveData>
    if (!Array.isArray(saved.items)) {
      return defaults
    }

    const knownIds = new Set<string>()
    const items = saved.items
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const spawn = DEFAULT_ATTACHMENT_SPAWNS.find(
          (entry) => entry.id === item.attachmentId,
        )
        if (!spawn) {
          return null
        }

        const catalog = getAttachmentCatalogEntry(spawn.catalogId)
        if (!catalog) {
          return null
        }

        knownIds.add(spawn.id)
        const yardPosition = getEquipmentYardSpawnPositions()[spawn.id] ?? {
          x: 16,
          y: 0,
          z: 18,
        }

        const lifecycleState =
          item.lifecycleState === AttachmentLifecycleState.Attached
            ? AttachmentLifecycleState.Attached
            : AttachmentLifecycleState.Detached

        const position =
          item.position &&
          typeof item.position.x === 'number' &&
          typeof item.position.y === 'number' &&
          typeof item.position.z === 'number'
            ? item.position
            : yardPosition

        return {
          attachmentId: spawn.id,
          attachmentType: catalog.attachmentType,
          catalogId: spawn.catalogId,
          lifecycleState,
          position,
          rotationY:
            typeof item.rotationY === 'number' ? item.rotationY : 0,
          workPosition:
            item.workPosition === AttachmentWorkPosition.Working
              ? AttachmentWorkPosition.Working
              : AttachmentWorkPosition.Transport,
          mountedOn:
            lifecycleState === AttachmentLifecycleState.Attached &&
            item.mountedOn &&
            typeof item.mountedOn.machineId === 'string' &&
            typeof item.mountedOn.slotId === 'string'
              ? {
                  machineId: item.mountedOn.machineId,
                  slotId: item.mountedOn.slotId,
                }
              : null,
          containers:
            catalog.attachmentType === 'trailer' ? (item.containers ?? []) : undefined,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    for (const spawn of DEFAULT_ATTACHMENT_SPAWNS) {
      if (knownIds.has(spawn.id)) {
        continue
      }

      const catalog = getAttachmentCatalogEntry(spawn.catalogId)
      if (!catalog) {
        continue
      }

      const yardPosition = getEquipmentYardSpawnPositions()[spawn.id] ?? {
        x: 16,
        y: 0,
        z: 18,
      }

      items.push({
        attachmentId: spawn.id,
        attachmentType: catalog.attachmentType,
        catalogId: spawn.catalogId,
        lifecycleState: AttachmentLifecycleState.Detached,
        position: yardPosition,
        rotationY: 0,
        workPosition: AttachmentWorkPosition.Transport,
        mountedOn: null,
        containers: catalog.attachmentType === 'trailer' ? [] : undefined,
      })
    }

    return { items }
  }

  private migrateFromV13(data: LegacySaveData): LegacySaveData {
    return {
      ...data,
      version: 14,
      mapId: data.mapId ?? 'map_01',
      farmName: data.farmName ?? 'My Farm',
      playTimeSeconds: data.playTimeSeconds ?? 0,
      createdAt: data.createdAt ?? new Date().toISOString(),
      dayFraction: data.dayFraction ?? 0,
      gameSpeed: this.normalizeLegacyGameSpeed(data.gameSpeed),
    }
  }

  private normalizeLegacyGameSpeed(gameSpeed: number): number {
    if (gameSpeed <= 0) {
      return 0
    }
    if (gameSpeed <= 1.5) {
      return 1
    }
    if (gameSpeed <= 3) {
      return 2
    }
    return 4
  }

  private repairSave(data: LegacySaveData): GameSaveData {
    const worldMap = tryGetActiveMapContext()?.worldMap
    const studioMachines =
      worldMap &&
      hasStudioMachinePlacements(worldMap) &&
      data.machines &&
      Object.keys(data.machines).length > 0
    const machines = studioMachines
      ? data.machines!
      : this.resolveMachinesSave(data)

    const studioAttachments =
      worldMap &&
      resolveRuntimeAttachmentSpawns(worldMap).length > 0 &&
      data.attachments &&
      Array.isArray(data.attachments.items)
    const attachments = studioAttachments
      ? data.attachments!
      : this.normalizeAttachmentsSave(data.attachments)

    return {
      version: SAVE_VERSION,
      mapId: data.mapId ?? 'map_01',
      farmName: data.farmName ?? 'My Farm',
      playTimeSeconds: data.playTimeSeconds ?? 0,
      createdAt: data.createdAt ?? new Date().toISOString(),
      dayFraction: data.dayFraction ?? 0,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: this.normalizeLegacyGameSpeed(data.gameSpeed),
      selectedFieldId: data.selectedFieldId ?? null,
      fields: this.mergeFieldSaveSlices(data.fields),
      ownership: this.mergeOwnershipSaveSlices(data.ownership),
      inventory: data.inventory,
      marketPrices: data.marketPrices,
      processedMarketPrices: Array.isArray(data.processedMarketPrices)
        ? data.processedMarketPrices
        : this.baseProcessedMarketPrices(),
      production: this.normalizeProductionSave(data.production),
      upgrades: data.upgrades,
      machines,
      attachments,
      farmStore: this.normalizeFarmStoreSave(data.farmStore),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
      machineAutomation: this.normalizeMachineAutomationSave(data.machineAutomation),
      workOrders: this.normalizeWorkOrdersSave(data.workOrders),
    }
  }

  private normalizeWorkOrdersSave(saved: unknown): WorkOrderSaveData[] {
    if (!Array.isArray(saved)) {
      return []
    }
    return saved.filter(
      (entry): entry is WorkOrderSaveData =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as WorkOrderSaveData).id === 'string' &&
        (entry as WorkOrderSaveData).status === WorkOrderStatus.Active,
    )
  }

  private migrateFromV12(data: LegacySaveData): LegacySaveData {
    const workOrders: WorkOrderSaveData[] = []
    const machineAutomation: MachineAutomationSaveData[] = []

    for (const entry of data.machineAutomation ?? []) {
      const session = entry.session
      if (session && entry.commandOwner === CommandOwner.Gps && session.fieldId) {
        const workOrderId = `work_order_migrated_${entry.machineId}`
        const isCurrentLeg = session.fieldId
        workOrders.push({
          id: workOrderId,
          displayName: session.taskKind,
          taskKind: session.taskKind,
          cropId: session.cropId,
          scope: { kind: WorkOrderScopeKind.Single, fieldId: session.fieldId },
          executionStrategy: 'catalog_order',
          status: WorkOrderStatus.Active,
          assignedMachineId: entry.machineId,
          commandOwner: CommandOwner.Gps,
          workerId: null,
          pendingFieldIds: [],
          completedFieldIds: [],
          currentFieldId: isCurrentLeg,
          createdAtDay: session.startedAtDay,
          startedAtDay: session.startedAtDay,
        })
        machineAutomation.push({
          machineId: entry.machineId,
          commandOwner: CommandOwner.Gps,
          activeWorkOrderId: workOrderId,
        })
      } else if (entry.activeWorkOrderId) {
        machineAutomation.push(entry)
      }
    }

    return {
      ...data,
      version: SAVE_VERSION,
      workOrders,
      machineAutomation,
    }
  }

  private normalizeMachineAutomationSave(
    saved: unknown,
  ): MachineAutomationSaveData[] {
    if (!Array.isArray(saved)) {
      return []
    }
    return saved.filter(
      (entry): entry is MachineAutomationSaveData =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as MachineAutomationSaveData).machineId === 'string',
    )
  }

  private migrateFromV11(data: LegacySaveData): LegacySaveData {
    return {
      ...data,
      version: SAVE_VERSION,
      machineAutomation: [],
    }
  }

  private migrateFromV7(data: LegacySaveData): LegacySaveData {
    const machine = this.normalizeMachineSave(data.machine)
    return {
      ...data,
      version: SAVE_VERSION,
      machines: {
        [MachineId.Tractor1]: machine,
      },
      attachments: this.emptyAttachments(),
    }
  }

  private migrateFromV10(data: LegacySaveData): LegacySaveData {
    return {
      ...data,
      version: SAVE_VERSION,
      fields: this.mergeFieldSaveSlices(data.fields),
    }
  }

  private migrateFromV9(data: LegacySaveData): LegacySaveData {
    return {
      ...data,
      version: 10,
      fields: this.mergeFieldSaveSlices(data.fields),
      ownership: this.mergeOwnershipSaveSlices(data.ownership),
    }
  }

  private mergeFieldSaveSlices(
    fields: LegacySaveData['fields'],
  ): LegacySaveData['fields'] {
    const byId = new Map(
      (Array.isArray(fields) ? fields : []).map((field) => [field.id, field]),
    )

    return getFieldCatalog().map((entry) => {
      const saved = byId.get(entry.id)
      if (saved) {
        return {
          ...saved,
          cropCare: normalizeFieldCropCare(
            (saved as { cropCare?: unknown }).cropCare,
          ),
        }
      }
      const catalogEntry = getFieldCatalogEntry(entry.id)
      if (catalogEntry?.initialFieldState) {
        return fieldTestStateToSaveSlice(
          entry.id,
          catalogEntry.initialFieldState,
        )
      }
      return {
        id: entry.id,
        state: States.Grass,
        growthPercent: 0,
        cropId: null,
        daysGrown: 0,
        cropCare: emptyFieldCropCare(),
      }
    })
  }

  private mergeOwnershipSaveSlices(
    ownership: LegacySaveData['ownership'],
  ): LegacySaveData['ownership'] {
    const byId = new Map(
      (Array.isArray(ownership) ? ownership : []).map((entry) => [
        entry.id,
        entry,
      ]),
    )

    return getFieldCatalog().map((entry) => {
      const saved = byId.get(entry.id)
      if (saved) {
        return saved
      }
      return { id: entry.id, ownership: entry.initialOwnership }
    })
  }

  resolveMachinesSave(data: LegacySaveData): MachinesSaveData {
    const legacyTractor = data.machines?.[MachineId.Tractor1] ?? data.machine

    const machines: MachinesSaveData = {
      [MachineId.Tractor1]: this.normalizeMachineSave(
        legacyTractor,
        MachineId.Tractor1,
      ),
      [MachineId.GrainCombine1]: this.normalizeMachineSave(
        data.machines?.[MachineId.GrainCombine1],
        MachineId.GrainCombine1,
      ),
      [MachineId.CornCombine1]: this.normalizeMachineSave(
        data.machines?.[MachineId.CornCombine1],
        MachineId.CornCombine1,
      ),
    }

    for (const [machineId, machineSave] of Object.entries(data.machines ?? {})) {
      if (machineId in machines) {
        continue
      }
      if (isPurchasedTractorInstanceId(machineId)) {
        machines[machineId] = this.normalizeMachineSave(machineSave, machineId)
      }
    }

    return machines
  }

  normalizeFarmStoreSave(farmStore: unknown): FarmStoreSaveData {
    if (!farmStore || typeof farmStore !== 'object') {
      return {
        ownedProducts: {},
        deliveryQueue: [],
      }
    }

    const saved = farmStore as Partial<FarmStoreSaveData>
    const ownedProducts =
      saved.ownedProducts && typeof saved.ownedProducts === 'object'
        ? { ...saved.ownedProducts }
        : {}

    const deliveryQueue = Array.isArray(saved.deliveryQueue)
      ? saved.deliveryQueue.filter(
          (entry) =>
            entry &&
            typeof entry === 'object' &&
            typeof entry.id === 'string' &&
            typeof entry.productId === 'string',
        )
      : []

    return {
      ownedProducts,
      deliveryQueue,
    }
  }

  private normalizeBuildingState(state: unknown): string {
    if (
      state === ProductionBuildingState.Idle ||
      state === ProductionBuildingState.Processing ||
      state === ProductionBuildingState.Ready
    ) {
      return state
    }
    return ProductionBuildingState.Idle
  }

  private normalizeQueue(
    queue: ProductionSaveData['buildings'][number]['queue'],
  ): ProductionSaveData['buildings'][number]['queue'] {
    if (!queue || typeof queue !== 'object') {
      return null
    }

    const progress =
      typeof queue.progress === 'number' && Number.isFinite(queue.progress)
        ? Math.min(1, Math.max(0, queue.progress))
        : 0

    if (
      typeof queue.recipeId !== 'string' ||
      typeof queue.inputCropId !== 'string' ||
      typeof queue.inputQuantity !== 'number' ||
      typeof queue.outputProductId !== 'string' ||
      typeof queue.outputQuantity !== 'number' ||
      typeof queue.durationDays !== 'number' ||
      queue.durationDays <= 0
    ) {
      return null
    }

    return {
      recipeId: queue.recipeId,
      inputCropId: queue.inputCropId,
      inputQuantity: queue.inputQuantity,
      outputProductId: queue.outputProductId,
      outputQuantity: queue.outputQuantity,
      progress,
      durationDays: queue.durationDays,
    }
  }

  private migrateFromV1(data: LegacySaveData): LegacySaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    const ownership = getFieldCatalog().map((entry) => {
      const savedField = data.fields.find((field) => field.id === entry.id)
      if (savedField) {
        return { id: entry.id, ownership: FieldOwnership.Owned }
      }
      return { id: entry.id, ownership: entry.initialOwnership }
    })

    return {
      version: 2,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership,
      inventory: [],
      marketPrices: [],
      processedMarketPrices: [],
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV2(data: LegacySaveData): LegacySaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    const fields = data.fields.map((field) => {
      const needsCrop =
        field.cropId === null &&
        (field.state === States.Seeded ||
          field.state === States.Growing ||
          field.state === States.Harvestable)

      return {
        ...field,
        cropId: needsCrop ? DEFAULT_CROP_ID : field.cropId,
      }
    })

    return {
      version: 3,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields,
      ownership: data.ownership,
      inventory: [],
      marketPrices: [],
      processedMarketPrices: [],
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV3(data: LegacySaveData): LegacySaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    return {
      version: 4,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership: data.ownership,
      inventory: this.emptyInventory(),
      marketPrices: this.baseMarketPrices(),
      processedMarketPrices: this.baseProcessedMarketPrices(),
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV4(data: LegacySaveData): LegacySaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.inventory) ||
      !Array.isArray(data.marketPrices) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    return {
      version: 5,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership: data.ownership,
      inventory: data.inventory,
      marketPrices: data.marketPrices,
      processedMarketPrices: this.baseProcessedMarketPrices(),
      production: this.emptyProduction(),
      upgrades: this.emptyUpgrades(),
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private migrateFromV5(data: LegacySaveData): LegacySaveData | null {
    if (
      typeof data.money !== 'number' ||
      typeof data.currentDay !== 'number' ||
      typeof data.gameSpeed !== 'number' ||
      !Array.isArray(data.fields) ||
      !Array.isArray(data.ownership) ||
      !Array.isArray(data.inventory) ||
      !Array.isArray(data.marketPrices) ||
      !Array.isArray(data.upgrades) ||
      !Array.isArray(data.eventLog) ||
      typeof data.eventLogNextId !== 'number'
    ) {
      return null
    }

    return {
      version: SAVE_VERSION,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
      selectedFieldId: data.selectedFieldId ?? null,
      fields: data.fields,
      ownership: data.ownership,
      inventory: data.inventory,
      marketPrices: data.marketPrices,
      processedMarketPrices: this.baseProcessedMarketPrices(),
      production: this.emptyProduction(),
      upgrades: data.upgrades,
      machine: this.emptyMachine(),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
    }
  }

  private emptyInventory() {
    return CROP_CATALOG.map((crop) => ({ cropId: crop.id, quantity: 0 }))
  }

  private baseMarketPrices() {
    return CROP_CATALOG.map((crop) => ({
      cropId: crop.id,
      price: crop.sellingPrice,
    }))
  }

  private baseProcessedMarketPrices() {
    return PROCESSED_CATALOG.map((product) => ({
      productId: product.id,
      price: product.basePrice,
    }))
  }

  private emptyProduction() {
    return {
      buildings: [
        {
          id: ProductionBuildingId.Mill,
          state: ProductionBuildingState.Idle,
          queue: null,
        },
      ],
      processedInventory: PROCESSED_CATALOG.map((product) => ({
        productId: product.id,
        quantity: 0,
      })),
    }
  }

  private emptyMachine(): MachineSaveData {
    return this.emptyMachineFor(MachineId.Tractor1)
  }

  private emptyMachineFor(machineId: MachineId): MachineSaveData {
    if (
      machineId === MachineId.Tractor1 ||
      machineId === MachineId.GrainCombine1 ||
      machineId === MachineId.CornCombine1
    ) {
      const home = resolveMachineHome(machineId)
      const base = {
        machineId,
        position: { ...home.position },
        rotationY: home.rotationY,
        state: TractorState.Idle,
        activeCommand: null,
        activeWork: null,
        workTimer: 0,
        workDuration:
          machineId === MachineId.Tractor1 ? 1.5 : 2,
      }
      if (
        machineId === MachineId.GrainCombine1 ||
        machineId === MachineId.CornCombine1
      ) {
        return { ...base, grainBin: this.emptyGrainBin() }
      }
      return base
    }

    if (isPurchasedTractorInstanceId(machineId)) {
      const slot = findOpenDeliverySlot(DeliveryZoneId.DealerLot, [])
      const spawn = slot
        ? getGroundedPosition(slot.x, slot.z)
        : getGroundedPosition(getTractorHome().x, getTractorHome().z)
      return {
        machineId,
        position: spawn,
        rotationY: slot?.rotationY ?? getTractorHomeRotationY(),
        state: TractorState.Idle,
        activeCommand: null,
        activeWork: null,
        workTimer: 0,
        workDuration: 1.5,
      }
    }

    return this.emptyMachineFor(MachineId.Tractor1)
  }

  private emptyGrainBin(): GrainBinSaveData {
    return {
      capacity: DEFAULT_GRAIN_BIN_CAPACITY,
      quantity: 0,
      cropId: null,
    }
  }

  private buildInitialMachinesSave(): MachinesSaveData {
    const worldMap = tryGetActiveMapContext()?.worldMap
    if (!worldMap) {
      return this.resolveMachinesSave({} as LegacySaveData)
    }

    const spawns = resolveRuntimeMachineSpawns(worldMap)
    if (spawns.length === 0) {
      return this.resolveMachinesSave({} as LegacySaveData)
    }

    const studioPlacements = worldMap.objects.some((object) => {
      if (object.layer !== 'vehicles') {
        return false
      }
      const props = parseVehiclePlacementProperties(object.properties)
      return Boolean(
        props &&
          props.placementKind !== 'attachment' &&
          (props.machineId || props.placementKind === 'machine'),
      )
    })

    if (studioPlacements) {
      const machines: MachinesSaveData = {}
      for (const spawn of spawns) {
        machines[spawn.machineId] = {
          ...this.emptyMachineFor(spawn.machineId),
          position: { ...spawn.position },
          rotationY: spawn.rotationY,
        }
      }
      return machines
    }

    const machines = this.resolveMachinesSave({} as LegacySaveData)
    for (const spawn of spawns) {
      machines[spawn.machineId] = {
        ...this.emptyMachineFor(spawn.machineId),
        position: { ...spawn.position },
        rotationY: spawn.rotationY,
      }
    }

    return machines
  }

  private buildInitialAttachmentsSave(): AttachmentsSaveData {
    const worldMap = tryGetActiveMapContext()?.worldMap
    const mapSpawns = worldMap
      ? resolveRuntimeAttachmentSpawns(worldMap)
      : []

    if (mapSpawns.length === 0) {
      return this.emptyAttachments()
    }

    const items = []
    for (const spawn of mapSpawns) {
      const catalog = getAttachmentCatalogEntry(spawn.catalogId)
      if (!catalog) {
        continue
      }
      items.push({
        attachmentId: spawn.attachmentInstanceId,
        attachmentType: catalog.attachmentType,
        catalogId: spawn.catalogId,
        lifecycleState: AttachmentLifecycleState.Detached,
        position: { ...spawn.position },
        rotationY: spawn.rotationY,
        workPosition: AttachmentWorkPosition.Transport,
        mountedOn: null,
        containers:
          catalog.attachmentType === 'trailer' ? [] : undefined,
      })
    }

    return { items }
  }

  private emptyAttachments(): AttachmentsSaveData {
    return {
      items: DEFAULT_ATTACHMENT_SPAWNS.map((spawn) => {
        const catalog = getAttachmentCatalogEntry(spawn.catalogId)!
        const yardPosition = getEquipmentYardSpawnPositions()[spawn.id] ?? {
          x: 16,
          y: 0,
          z: 18,
        }
        const groundedYard = getGroundedPosition(yardPosition.x, yardPosition.z)

        return {
          attachmentId: spawn.id,
          attachmentType: catalog.attachmentType,
          catalogId: spawn.catalogId,
          lifecycleState: AttachmentLifecycleState.Detached,
          position: groundedYard,
          rotationY: 0,
          workPosition: AttachmentWorkPosition.Transport,
          mountedOn: null,
          containers:
            catalog.attachmentType === 'trailer' ? [] : undefined,
        }
      }),
    }
  }

  private emptyUpgrades() {
    return SHOP_CATALOG.map((upgrade) => ({ id: upgrade.id, level: 0 }))
  }

  private isValidCoreSave(data: LegacySaveData): boolean {
    return (
      typeof data.version === 'number' &&
      data.version >= 6 &&
      typeof data.money === 'number' &&
      typeof data.currentDay === 'number' &&
      typeof data.gameSpeed === 'number' &&
      Array.isArray(data.fields) &&
      Array.isArray(data.ownership) &&
      Array.isArray(data.inventory) &&
      Array.isArray(data.marketPrices) &&
      Array.isArray(data.upgrades) &&
      Array.isArray(data.eventLog) &&
      typeof data.eventLogNextId === 'number'
    )
  }
}
