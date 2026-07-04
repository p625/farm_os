import type { IInitializable, IUpdatable, IDisposable } from '@/types/index.ts'
import { STARTING_MONEY } from '@/config/game-balance.ts'

export class World implements IInitializable, IUpdatable, IDisposable {
  money = STARTING_MONEY
  currentDay = 1
  gameSpeed = 1

  initialize(): void {
    this.money = STARTING_MONEY
    this.currentDay = 1
    this.gameSpeed = 1
  }

  applySave(money: number, currentDay: number, gameSpeed: number): void {
    this.money = money
    this.currentDay = currentDay
    this.setGameSpeed(gameSpeed)
  }

  update(_deltaTime: number): void {
    // Global world tick reserved for future systems.
  }

  addMoney(amount: number): void {
    this.money += amount
  }

  spendMoney(amount: number): boolean {
    if (amount < 0 || this.money < amount) {
      return false
    }
    this.money -= amount
    return true
  }

  advanceDay(): void {
    this.currentDay += 1
  }

  setGameSpeed(speed: number): void {
    this.gameSpeed = Math.max(0.25, Math.min(5, speed))
  }

  dispose(): void {
    // Release world resources.
  }
}
