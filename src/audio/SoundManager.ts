import { GameEventKind, type GameEventKind as GameEventKindValue } from '@/types/events.ts'

export const SoundEvent = {
  Plow: 'plow',
  Seed: 'seed',
  Harvest: 'harvest',
  Harvestable: 'harvestable',
  Money: 'money',
} as const

export type SoundEvent = (typeof SoundEvent)[keyof typeof SoundEvent]

export class SoundManager {
  play(event: SoundEvent): void {
    // Audio assets will be loaded and played here in a future milestone.
    void event
  }

  playForGameEvent(kind: GameEventKindValue): void {
    switch (kind) {
      case GameEventKind.FieldPlowed:
        this.play(SoundEvent.Plow)
        break
      case GameEventKind.CropPlanted:
        this.play(SoundEvent.Seed)
        break
      case GameEventKind.CropReady:
        this.play(SoundEvent.Harvestable)
        break
      case GameEventKind.CropHarvested:
        this.play(SoundEvent.Harvest)
        this.play(SoundEvent.Money)
        break
    }
  }
}
