import { getFieldCatalog, getFieldCatalogEntry } from '@/config/field-catalog.ts'
import type { GameEventLog } from '@game/GameEventLog.ts'
import type { World } from '@game/World.ts'
import { FieldOwnership } from '@/types/ownership.ts'
import type { FieldOwnership as FieldOwnershipValue } from '@/types/ownership.ts'
import { GameSystem } from './GameSystem.ts'

export class OwnershipSystem extends GameSystem {
  readonly name = 'OwnershipSystem'
  private readonly world: World
  private readonly ownership = new Map<string, FieldOwnershipValue>()
  private eventLog: GameEventLog | null = null
  private onChange: (() => void) | null = null

  constructor(world: World) {
    super()
    this.world = world
  }

  setEventLog(eventLog: GameEventLog): void {
    this.eventLog = eventLog
  }

  setOnChange(listener: () => void): void {
    this.onChange = listener
  }

  initialize(): void {
    this.ownership.clear()
    for (const entry of getFieldCatalog()) {
      this.ownership.set(entry.id, entry.initialOwnership)
    }
    this.notifyChange()
  }

  update(_deltaTime: number): void {
    // Ownership changes are event-driven.
  }

  applySave(
    savedOwnership: readonly { id: string; ownership: FieldOwnershipValue }[],
  ): void {
    for (const entry of getFieldCatalog()) {
      this.ownership.set(entry.id, entry.initialOwnership)
    }

    for (const saved of savedOwnership) {
      if (!this.ownership.has(saved.id)) {
        continue
      }
      if (
        saved.ownership === FieldOwnership.Owned ||
        saved.ownership === FieldOwnership.Available ||
        saved.ownership === FieldOwnership.Leased
      ) {
        this.ownership.set(saved.id, saved.ownership)
      }
    }

    this.notifyChange()
  }

  toSaveOwnership(): { id: string; ownership: FieldOwnershipValue }[] {
    return getFieldCatalog().map((entry) => ({
      id: entry.id,
      ownership: this.getOwnership(entry.id),
    }))
  }

  getOwnership(fieldId: string): FieldOwnershipValue {
    return this.ownership.get(fieldId) ?? FieldOwnership.Available
  }

  canUseField(fieldId: string): boolean {
    const ownership = this.getOwnership(fieldId)
    return (
      ownership === FieldOwnership.Owned || ownership === FieldOwnership.Leased
    )
  }

  canPurchase(fieldId: string): boolean {
    const entry = getFieldCatalogEntry(fieldId)
    if (!entry || this.getOwnership(fieldId) !== FieldOwnership.Available) {
      return false
    }
    return this.world.money >= entry.purchasePrice
  }

  canLease(fieldId: string): boolean {
    const entry = getFieldCatalogEntry(fieldId)
    if (!entry || this.getOwnership(fieldId) !== FieldOwnership.Available) {
      return false
    }
    return this.world.money >= entry.leasePrice
  }

  purchaseField(fieldId: string): boolean {
    const entry = getFieldCatalogEntry(fieldId)
    if (!entry || this.getOwnership(fieldId) !== FieldOwnership.Available) {
      return false
    }
    if (!this.world.spendMoney(entry.purchasePrice)) {
      return false
    }

    this.ownership.set(fieldId, FieldOwnership.Owned)
    this.eventLog?.recordFieldPurchased(entry.name, this.world.currentDay)
    this.notifyChange()
    return true
  }

  leaseField(fieldId: string): boolean {
    const entry = getFieldCatalogEntry(fieldId)
    if (!entry || this.getOwnership(fieldId) !== FieldOwnership.Available) {
      return false
    }
    if (!this.world.spendMoney(entry.leasePrice)) {
      return false
    }

    this.ownership.set(fieldId, FieldOwnership.Leased)
    this.eventLog?.recordFieldLeased(entry.name, this.world.currentDay)
    this.notifyChange()
    return true
  }

  dispose(): void {
    this.ownership.clear()
    this.eventLog = null
    this.onChange = null
  }

  private notifyChange(): void {
    this.onChange?.()
  }
}

export function formatFieldOwnership(ownership: FieldOwnershipValue): string {
  switch (ownership) {
    case FieldOwnership.Owned:
      return 'Owned'
    case FieldOwnership.Available:
      return 'Available'
    case FieldOwnership.Leased:
      return 'Leased'
    default:
      return ownership
  }
}
