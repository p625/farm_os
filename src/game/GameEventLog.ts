import { WHEAT_CROP } from '@/config/wheat.ts'
import {
  GameEventKind,
  type GameEventKind as GameEventKindValue,
  type GameLogEntry,
  type MoneyGainEffect,
} from '@/types/events.ts'

const MAX_ENTRIES = 20

export class GameEventLog {
  private entries: GameLogEntry[] = []
  private nextId = 1
  private latestMoneyGain: MoneyGainEffect | null = null
  private moneyGainSeq = 0
  private readonly onEntry: ((entry: GameLogEntry) => void) | null

  constructor(onEntry?: (entry: GameLogEntry) => void) {
    this.onEntry = onEntry ?? null
  }

  getEntries(): readonly GameLogEntry[] {
    return this.entries
  }

  getLatestMoneyGain(): MoneyGainEffect | null {
    return this.latestMoneyGain
  }

  recordFieldPlowed(day: number): void {
    this.push('Field plowed', GameEventKind.FieldPlowed, day)
  }

  recordWheatSeeded(day: number): void {
    this.push('Wheat seeded', GameEventKind.WheatSeeded, day)
  }

  recordWheatReady(day: number): void {
    this.push('Wheat ready to harvest', GameEventKind.WheatReady, day)
  }

  recordHarvestSold(day: number): void {
    const amount = WHEAT_CROP.harvestReward
    this.push(`Harvest sold for ₡${amount}`, GameEventKind.HarvestSold, day)
    this.latestMoneyGain = {
      amount,
      id: ++this.moneyGainSeq,
    }
  }

  clear(): void {
    this.entries = []
    this.latestMoneyGain = null
  }

  private push(
    message: string,
    kind: GameEventKindValue,
    day: number,
  ): void {
    const entry: GameLogEntry = {
      id: this.nextId++,
      message,
      day,
      kind,
    }
    this.entries = [entry, ...this.entries].slice(0, MAX_ENTRIES)
    this.onEntry?.(entry)
  }
}
