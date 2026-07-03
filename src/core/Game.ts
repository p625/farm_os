import { SoundManager } from '@audio/SoundManager.ts'
import { World } from '@game/World.ts'
import { GameEventLog } from '@game/GameEventLog.ts'
import {
  CameraController,
  FieldOverlayPresentation,
  FieldPresentation,
  LightingSystem,
  SceneManager,
  TractorPresentation,
} from '@rendering/index.ts'
import { FieldSystem, TractorJobSystem } from '@systems/index.ts'
import type { GameConfig } from '@/types/index.ts'
import { DEFAULT_GAME_CONFIG } from '@/types/index.ts'
import type { IDisposable } from '@/types/index.ts'
import { EMPTY_GAME_SNAPSHOT, type GameSnapshot } from './GameSnapshot.ts'
import { GameLoop } from './GameLoop.ts'

export class Game implements IDisposable {
  private readonly sceneManager: SceneManager
  private readonly cameraController: CameraController
  private readonly lightingSystem: LightingSystem
  private readonly world: World
  private readonly fieldSystem: FieldSystem
  private readonly tractorJobSystem: TractorJobSystem
  private readonly eventLog: GameEventLog
  private readonly soundManager: SoundManager
  private readonly fieldPresentation: FieldPresentation
  private readonly fieldOverlayPresentation: FieldOverlayPresentation
  private readonly tractorPresentation: TractorPresentation
  private readonly gameLoop: GameLoop
  private readonly listeners = new Set<() => void>()
  private cachedSnapshot: GameSnapshot = EMPTY_GAME_SNAPSHOT
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
    this.fieldSystem = new FieldSystem(this.world)
    this.tractorJobSystem = new TractorJobSystem(this.fieldSystem)
    this.fieldPresentation = new FieldPresentation()
    this.fieldOverlayPresentation = new FieldOverlayPresentation()
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

  seedSelectedField(): void {
    const fieldId = this.fieldSystem.getSelectedFieldId()
    if (fieldId) {
      this.tractorJobSystem.enqueueSeed(fieldId)
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

  setGameSpeed(speed: number): void {
    this.world.setGameSpeed(speed)
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

    this.fieldSystem.setEventLog(this.eventLog)
    this.fieldSystem.setOnChange(() => {
      this.syncFieldVisuals()
      this.notifyListeners()
    })
    this.fieldSystem.initialize()

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

    const scene = this.sceneManager.getScene()
    this.fieldPresentation.attach(scene, this.fieldSystem)
    this.fieldOverlayPresentation.attach(
      scene,
      this.fieldSystem,
      this.fieldPresentation,
    )
    this.tractorPresentation.attach(scene, this.tractorJobSystem)

    this.invalidateSnapshot()
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
    this.stop()
    this.tractorPresentation.detach()
    this.fieldOverlayPresentation.detach()
    this.fieldPresentation.detach()
    this.tractorJobSystem.dispose()
    this.fieldSystem.dispose()
    this.eventLog.clear()
    this.world.dispose()
    this.cameraController.dispose()
    this.lightingSystem.dispose()
    this.sceneManager.dispose()
    this.listeners.clear()
    this.cachedSnapshot = EMPTY_GAME_SNAPSHOT
    this.started = false
  }

  private syncFieldVisuals(): void {
    this.fieldPresentation.syncVisuals()
    this.fieldOverlayPresentation.syncVisuals()
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
      fields: this.fieldSystem.getFields().map((field) => field.toSnapshot()),
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
