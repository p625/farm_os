import { CROP_CATALOG, DEFAULT_CROP_ID } from '@/config/crop-catalog.ts'
import { FIELD_CATALOG } from '@/config/field-catalog.ts'
import {
  TRACTOR_HOME,
  TRACTOR_HOME_ROTATION_Y,
  GRAIN_COMBINE_HOME,
  GRAIN_COMBINE_HOME_ROTATION_Y,
  CORN_COMBINE_HOME,
  CORN_COMBINE_HOME_ROTATION_Y,
  EQUIPMENT_YARD_SPAWN_POSITIONS,
} from '@/config/farm-layout.ts'
import {
  DEFAULT_ATTACHMENT_SPAWNS,
  getAttachmentCatalogEntry,
} from '@/config/attachment-catalog.ts'
import { MachineId } from '@/types/machine.ts'
import { AttachmentLifecycleState, AttachmentWorkPosition } from '@/types/attachment.ts'
import { PROCESSED_CATALOG } from '@/config/production-catalog.ts'
import { SHOP_CATALOG } from '@/config/shop-catalog.ts'
import { SAVE_STORAGE_KEY, SAVE_VERSION } from '@/config/save.ts'
import { FieldOwnership } from '@/types/ownership.ts'
import { ProductionBuildingId, ProductionBuildingState } from '@/types/production.ts'
import { FieldLifecycleState as States } from '@/types/field.ts'
import { TractorState } from '@/types/tractor.ts'
import { isLogisticsSaveCommand } from '@systems/MachineLogisticsSupport.ts'
import { isPurchasedTractorInstanceId } from '@/types/machine-template.ts'
import type { FarmStoreSaveData } from '@/types/farm-store.ts'
import { DEFAULT_GRAIN_BIN_CAPACITY, type GrainBinSaveData } from '@/types/grain-bin.ts'
import type {
  AttachmentsSaveData,
  GameSaveData,
  MachineSaveData,
  MachinesSaveData,
  ProductionSaveData,
} from '@/types/save.ts'

type LegacySaveData = Omit<GameSaveData, 'machines' | 'attachments' | 'farmStore'> & {
  version?: number
  machine?: MachineSaveData
  machines?: MachinesSaveData
  attachments?: AttachmentsSaveData
  farmStore?: FarmStoreSaveData
}

export class SaveGameService {
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
    const position =
      saved.position &&
      typeof saved.position.x === 'number' &&
      typeof saved.position.y === 'number' &&
      typeof saved.position.z === 'number'
        ? saved.position
        : defaults.position

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
        const yardPosition = EQUIPMENT_YARD_SPAWN_POSITIONS[spawn.id] ?? {
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

      const yardPosition = EQUIPMENT_YARD_SPAWN_POSITIONS[spawn.id] ?? {
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

  private repairSave(data: LegacySaveData): GameSaveData {
    const machines = this.resolveMachinesSave(data)

    return {
      version: SAVE_VERSION,
      money: data.money,
      currentDay: data.currentDay,
      gameSpeed: data.gameSpeed,
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
      attachments: this.normalizeAttachmentsSave(data.attachments),
      farmStore: this.normalizeFarmStoreSave(data.farmStore),
      eventLog: data.eventLog,
      eventLogNextId: data.eventLogNextId,
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

  private migrateFromV9(data: LegacySaveData): LegacySaveData {
    return {
      ...data,
      version: SAVE_VERSION,
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

    return FIELD_CATALOG.map((entry) => {
      const saved = byId.get(entry.id)
      if (saved) {
        return saved
      }
      return {
        id: entry.id,
        state: States.Grass,
        growthPercent: 0,
        cropId: null,
        daysGrown: 0,
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

    return FIELD_CATALOG.map((entry) => {
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

    const ownership = FIELD_CATALOG.map((entry) => {
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
    if (machineId === MachineId.Tractor1) {
      return {
        machineId: MachineId.Tractor1,
        position: { ...TRACTOR_HOME },
        rotationY: TRACTOR_HOME_ROTATION_Y,
        state: TractorState.Idle,
        activeCommand: null,
        activeWork: null,
        workTimer: 0,
        workDuration: 1.5,
      }
    }

    if (machineId === MachineId.GrainCombine1) {
      return {
        machineId: MachineId.GrainCombine1,
        position: { ...GRAIN_COMBINE_HOME },
        rotationY: GRAIN_COMBINE_HOME_ROTATION_Y,
        state: TractorState.Idle,
        activeCommand: null,
        activeWork: null,
        workTimer: 0,
        workDuration: 2,
        grainBin: this.emptyGrainBin(),
      }
    }

    if (machineId === MachineId.CornCombine1) {
      return {
        machineId: MachineId.CornCombine1,
        position: { ...CORN_COMBINE_HOME },
        rotationY: CORN_COMBINE_HOME_ROTATION_Y,
        state: TractorState.Idle,
        activeCommand: null,
        activeWork: null,
        workTimer: 0,
        workDuration: 2,
        grainBin: this.emptyGrainBin(),
      }
    }

    if (isPurchasedTractorInstanceId(machineId)) {
      return {
        machineId,
        position: { x: 2, y: 0, z: 18 },
        rotationY: TRACTOR_HOME_ROTATION_Y,
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

  private emptyAttachments(): AttachmentsSaveData {
    return {
      items: DEFAULT_ATTACHMENT_SPAWNS.map((spawn) => {
        const catalog = getAttachmentCatalogEntry(spawn.catalogId)!
        const yardPosition = EQUIPMENT_YARD_SPAWN_POSITIONS[spawn.id] ?? {
          x: 16,
          y: 0,
          z: 18,
        }

        return {
          attachmentId: spawn.id,
          attachmentType: catalog.attachmentType,
          catalogId: spawn.catalogId,
          lifecycleState: AttachmentLifecycleState.Detached,
          position: yardPosition,
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
