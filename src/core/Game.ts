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
  SceneManager,
  TractorPresentation,
} from '@rendering/index.ts'
import {
  CropSystem,
  FieldSystem,
  OwnershipSystem,
  TractorJobSystem,
} from '@systems/index.ts'
import { getFieldCatalogEntry } from '@/config/field-catalog.ts'
import { SAVE_VERSION } from '@/config/save.ts'
import type { GameConfig } from '@/types/index.ts'
import { DEFAULT_GAME_CONFIG } from '@/types/index.ts'
import type { IDisposable } from '@/types/index.ts'
import type { GameSaveData } from '@/types/save.ts'
import { EMPTY_GAME_SNAPSHOT, type GameSnapshot } from './GameSnapshot.ts'
import { GameLoop } from './GameLoop.ts'

export class Game implements IDisposable {
  private readonly sceneManager: SceneManager
  private readonly cameraController: CameraController
  private readonly lightingSystem: LightingSystem
  private readonly world: World
  private readonly cropSystem: CropSystem
  private readonly fieldSystem: FieldSystem
  private readonly ownershipSystem: OwnershipSystem
  private readonly tractorJobSystem: TractorJobSystem
  private readonly eventLog: GameEventLog
  private readonly soundManager: SoundManager
  private readonly saveGameService: SaveGameService
  private readonly fieldPresentation: FieldPresentation
  private readonly cropPresentation: CropPresentation
  private readonly fieldOverlayPresentation: FieldOverlayPresentation
  private readonly ownershipPresentation: OwnershipPresentation
  private readonly tractorPresentation: TractorPresentation
  private readonly gameLoop: GameLoop
  private readonly listeners = new Set<() => void>()
  private cachedSnapshot: GameSnapshot = EMPTY_GAME_SNAPSHOT
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
    this.ownershipSystem = new OwnershipSystem(this.world)
    this.fieldSystem = new FieldSystem(this.world)
    this.fieldSystem.setOwnershipSystem(this.ownershipSystem)
    this.fieldSystem.setCropSystem(this.cropSystem)
    this.tractorJobSystem = new TractorJobSystem(this.fieldSystem)
    this.tractorJobSystem.setCropSystem(this.cropSystem)
    this.fieldPresentation = new FieldPresentation()
    this.cropPresentation = new CropPresentation()
    this.fieldOverlayPresentation = new FieldOverlayPresentation()
    this.ownershipPresentation = new OwnershipPresentation()
    this.tractorPresentation = new TractorPresentation()
    this.gameLoop = new GameLoop([
      this.world,
      this.fieldSystem,
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
    if (fieldId) {
      this.tractorJobSystem.enqueuePlow(fieldId)
    }
  }

  plantSelectedField(cropId: string): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (fieldId) {
      this.tractorJobSystem.enqueueSeed(fieldId, cropId)
    }
  }

  harvestSelectedField(): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (fieldId) {
      this.tractorJobSystem.enqueueHarvest(fieldId)
    }
  }

  selectField(fieldId: string): void {
    this.fieldSystem.selectField(fieldId)
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
    this.ownershipSystem.initialize()
    this.fieldSystem.initialize()
    this.tractorJobSystem.initialize()
    this.eventLog.clear()
    this.eventLog.recordFarmReset(this.world.currentDay)
    this.syncFieldVisuals()
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
      this.notifyListeners()
    })
    this.tractorJobSystem.setOnVisualChange(() => {
      this.tractorPresentation.syncVisuals()
    })
    this.tractorJobSystem.initialize()

    this.loadSavedGame()

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
    this.tractorPresentation.attach(scene, this.tractorJobSystem)

    this.syncFieldVisuals()
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
    this.tractorPresentation.detach()
    this.ownershipPresentation.detach()
    this.cropPresentation.detach()
    this.fieldOverlayPresentation.detach()
    this.fieldPresentation.detach()
    this.tractorJobSystem.dispose()
    this.fieldSystem.dispose()
    this.ownershipSystem.dispose()
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
    this.fieldSystem.applySave(saved.fields, saved.selectedFieldId)
    this.eventLog.restore(saved.eventLog, saved.eventLogNextId)
    this.tractorJobSystem.initialize()

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

    this.cachedSnapshot = {
      money: this.world.money,
      currentDay: this.world.currentDay,
      gameSpeed: this.world.gameSpeed,
      selectedFieldId: this.fieldSystem.getSelectedFieldId(),
      fields: this.buildFieldSnapshots(),
      crops: this.cropSystem.toSnapshots(),
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
