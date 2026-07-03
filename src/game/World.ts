import type { IInitializable, IUpdatable, IDisposable } from '@/types/index.ts'

export class World implements IInitializable, IUpdatable, IDisposable {
  money = 0
  currentDay = 1
  gameSpeed = 1

  initialize(): void {
    this.money = 0
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
