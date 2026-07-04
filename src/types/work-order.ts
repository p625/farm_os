import type { FieldBlockId } from '@/config/map-01-layout.ts'
import type { CommandOwner } from '@/types/machine-automation.ts'
import type { AutomationTaskKind as AutomationTaskKindValue } from '@/types/machine-automation.ts'
import type { MachineId } from '@/types/machine.ts'

export type WorkOrderId = string

export const WorkOrderStatus = {
  Active: 'active',
  /** Reserved — pause gameplay (e.g. full grain bin). */
  Paused: 'paused',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const

export type WorkOrderStatus =
  (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus]

export const WorkOrderExecutionStrategy = {
  CatalogOrder: 'catalog_order',
  /** Reserved — sort by distance from machine. */
  NearestFirst: 'nearest_first',
  /** Reserved — player-defined sequence. */
  Custom: 'custom',
} as const

export type WorkOrderExecutionStrategy =
  (typeof WorkOrderExecutionStrategy)[keyof typeof WorkOrderExecutionStrategy]

export type WorkOrderTaskKind = AutomationTaskKindValue

export const WorkOrderScopeKind = {
  Single: 'single',
  Fields: 'fields',
  Block: 'block',
  Eligible: 'eligible',
  /** Reserved — geographic area scope (Phase 17+). */
  Area: 'area',
} as const

export type WorkOrderScopeKind =
  (typeof WorkOrderScopeKind)[keyof typeof WorkOrderScopeKind]

export interface WorkOrderFieldFilter {
  taskKind: WorkOrderTaskKind
  blockId?: FieldBlockId
  cropId?: string
  requireOwned?: boolean
}

export type WorkOrderScope =
  | { kind: typeof WorkOrderScopeKind.Single; fieldId: string }
  | { kind: typeof WorkOrderScopeKind.Fields; fieldIds: readonly string[] }
  | { kind: typeof WorkOrderScopeKind.Block; blockId: FieldBlockId }
  | { kind: typeof WorkOrderScopeKind.Eligible; filter: WorkOrderFieldFilter }
  /** Reserved — no runtime support in Phase 16C. */
  | {
      kind: typeof WorkOrderScopeKind.Area
      areaId: string
      filter: WorkOrderFieldFilter
    }

export interface WorkOrder {
  id: WorkOrderId
  displayName: string
  taskKind: WorkOrderTaskKind
  cropId?: string
  scope: WorkOrderScope
  executionStrategy: WorkOrderExecutionStrategy
  status: WorkOrderStatus
  /** Assignment — not permanent ownership of the order by the machine. */
  assignedMachineId: MachineId | null
  commandOwner: CommandOwner
  /** Convenience field for 16E — conceptually separate from order definition. */
  workerId: string | null
  pendingFieldIds: readonly string[]
  completedFieldIds: readonly string[]
  currentFieldId: string | null
  createdAtDay: number
  startedAtDay: number | null
}

export interface WorkOrderSnapshot {
  id: WorkOrderId
  displayName: string
  taskKind: WorkOrderTaskKind
  status: WorkOrderStatus
  assignedMachineId: MachineId | null
  commandOwner: CommandOwner
  workerId: string | null
  currentFieldId: string | null
  currentFieldName: string | null
  completedFieldCount: number
  remainingFieldCount: number
  totalFieldCount: number
  remainingArea: number
  totalArea: number
  blockId: FieldBlockId | null
}

export interface WorkOrderSaveData {
  id: string
  displayName: string
  taskKind: WorkOrderTaskKind
  cropId?: string
  scope: WorkOrderScope
  executionStrategy: WorkOrderExecutionStrategy
  status: WorkOrderStatus
  assignedMachineId: string | null
  commandOwner: CommandOwner
  workerId: string | null
  pendingFieldIds: string[]
  completedFieldIds: string[]
  currentFieldId: string | null
  createdAtDay: number
  startedAtDay: number | null
}

export { AutomationTaskKind as WorkOrderTaskKindEnum } from '@/types/machine-automation.ts'

export function isActiveWorkOrderStatus(status: WorkOrderStatus): boolean {
  return status === WorkOrderStatus.Active
}

export function getWorkOrderScopeBlockId(
  scope: WorkOrderScope,
): FieldBlockId | null {
  if (scope.kind === WorkOrderScopeKind.Block) {
    return scope.blockId
  }
  return null
}
