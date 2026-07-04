import { getFieldCatalog, getFieldCatalogEntry } from '@/config/field-catalog.ts'
import type { FieldBlockId } from '@/config/map-01-layout.ts'
import { CommandOwner } from '@/types/machine-automation.ts'
import type { AutomationTaskKind } from '@/types/machine-automation.ts'
import type { MachineId } from '@/types/machine.ts'
import {
  WorkOrderExecutionStrategy,
  WorkOrderScopeKind,
  WorkOrderStatus,
  type WorkOrder,
  type WorkOrderSaveData,
  type WorkOrderScope,
  type WorkOrderSnapshot,
  type WorkOrderId,
  getWorkOrderScopeBlockId,
} from '@/types/work-order.ts'

export interface WorkOrderFieldEligibility {
  canWorkField(
    machineId: MachineId,
    fieldId: string,
    taskKind: AutomationTaskKind,
    cropId?: string,
  ): boolean
  isFieldUsable(fieldId: string): boolean
}

export interface CreateWorkOrderParams {
  displayName: string
  taskKind: AutomationTaskKind
  cropId?: string
  scope: WorkOrderScope
  executionStrategy?: WorkOrderExecutionStrategy
  commandOwner: CommandOwner
  assignedMachineId?: MachineId | null
  workerId?: string | null
  createdAtDay: number
}

let nextWorkOrderId = 1

export function resetWorkOrderIdCounter(start: number = 1): void {
  nextWorkOrderId = start
}

export function allocateWorkOrderId(): WorkOrderId {
  const id = `work_order_${nextWorkOrderId}`
  nextWorkOrderId += 1
  return id
}

export function buildWorkOrderDisplayName(options: {
  taskKind: AutomationTaskKind
  scope: WorkOrderScope
  cropName?: string
  blockId?: FieldBlockId
}): string {
  const { taskKind, scope, cropName } = options
  const taskLabel = formatTaskKindLabel(taskKind, cropName)

  switch (scope.kind) {
    case WorkOrderScopeKind.Single:
      return taskLabel
    case WorkOrderScopeKind.Fields:
      return scope.fieldIds.length === 1
        ? taskLabel
        : `${taskLabel} (${scope.fieldIds.length} fields)`
    case WorkOrderScopeKind.Block:
      return `${taskLabel} Block ${scope.blockId}`
    case WorkOrderScopeKind.Eligible: {
      if (scope.filter.blockId) {
        return `${taskLabel} Block ${scope.filter.blockId}`
      }
      if (scope.filter.cropId && cropName) {
        return `${taskLabel} ${cropName}`
      }
      if (taskKind === 'spray' || taskKind === 'fertilize') {
        return `${taskLabel} Eligible Fields`
      }
      return `${taskLabel} Eligible Fields`
    }
    case WorkOrderScopeKind.Area:
      return `${taskLabel} Area`
    default:
      return taskLabel
  }
}

function formatTaskKindLabel(
  taskKind: AutomationTaskKind,
  cropName?: string,
): string {
  switch (taskKind) {
    case 'plow':
      return 'Plow'
    case 'seed':
      return cropName ? `Seed ${cropName}` : 'Seed'
    case 'harvest':
      return cropName ? `Harvest ${cropName}` : 'Harvest'
    case 'fertilize':
      return 'Fertilize'
    case 'spray':
      return 'Spray'
    default:
      return taskKind
  }
}

const getCatalogFieldOrder = (): Map<string, number> =>
  new Map(getFieldCatalog().map((entry, index) => [entry.id, index]))

export function sortFieldIdsByCatalogOrder(fieldIds: readonly string[]): string[] {
  const order = getCatalogFieldOrder()
  return [...fieldIds].sort((left, right) => {
    const leftIndex = order.get(left) ?? Number.MAX_SAFE_INTEGER
    const rightIndex = order.get(right) ?? Number.MAX_SAFE_INTEGER
    return leftIndex - rightIndex
  })
}

export function resolveWorkOrderFieldQueue(
  scope: WorkOrderScope,
  taskKind: AutomationTaskKind,
  cropId: string | undefined,
  machineId: MachineId | null,
  eligibility: WorkOrderFieldEligibility,
): string[] {
  let candidates: string[] = []

  switch (scope.kind) {
    case WorkOrderScopeKind.Single:
      candidates = [scope.fieldId]
      break
    case WorkOrderScopeKind.Fields:
      candidates = [...scope.fieldIds]
      break
    case WorkOrderScopeKind.Block:
      candidates = getFieldCatalog()
        .filter((entry) => entry.blockId === scope.blockId)
        .map((entry) => entry.id)
      break
    case WorkOrderScopeKind.Eligible:
      candidates = getFieldCatalog().map((entry) => entry.id)
      if (scope.filter.blockId) {
        candidates = candidates.filter(
          (fieldId) => getFieldCatalogEntry(fieldId)?.blockId === scope.filter.blockId,
        )
      }
      break
    case WorkOrderScopeKind.Area:
      return []
    default:
      return []
  }

  const requireOwned = scope.kind === WorkOrderScopeKind.Eligible
    ? scope.filter.requireOwned !== false
    : true

  const filtered = candidates.filter((fieldId) => {
    if (requireOwned && !eligibility.isFieldUsable(fieldId)) {
      return false
    }
    if (!machineId) {
      return true
    }
    return eligibility.canWorkField(machineId, fieldId, taskKind, cropId)
  })

  return sortFieldIdsByCatalogOrder(filtered)
}

export function sumFieldAreas(fieldIds: readonly string[]): number {
  let total = 0
  for (const fieldId of fieldIds) {
    total += getFieldCatalogEntry(fieldId)?.area ?? 0
  }
  return total
}

export class WorkOrderSystem {
  private readonly orders = new Map<WorkOrderId, WorkOrder>()

  createOrder(params: CreateWorkOrderParams, pendingFieldIds: string[]): WorkOrder | null {
    if (pendingFieldIds.length === 0) {
      return null
    }

    const order: WorkOrder = {
      id: allocateWorkOrderId(),
      displayName: params.displayName,
      taskKind: params.taskKind,
      cropId: params.cropId,
      scope: params.scope,
      executionStrategy:
        params.executionStrategy ?? WorkOrderExecutionStrategy.CatalogOrder,
      status: WorkOrderStatus.Active,
      assignedMachineId: params.assignedMachineId ?? null,
      commandOwner: params.commandOwner,
      workerId: params.workerId ?? null,
      pendingFieldIds: [...pendingFieldIds],
      completedFieldIds: [],
      currentFieldId: null,
      createdAtDay: params.createdAtDay,
      startedAtDay: null,
    }

    this.orders.set(order.id, order)
    return order
  }

  get(orderId: WorkOrderId): WorkOrder | undefined {
    return this.orders.get(orderId)
  }

  getActiveOrders(): readonly WorkOrder[] {
    return [...this.orders.values()].filter(
      (order) => order.status === WorkOrderStatus.Active,
    )
  }

  getActiveOrderForMachine(machineId: MachineId): WorkOrder | undefined {
    return [...this.orders.values()].find(
      (order) =>
        order.status === WorkOrderStatus.Active &&
        order.assignedMachineId === machineId,
    )
  }

  markStarted(orderId: WorkOrderId, day: number): void {
    const order = this.orders.get(orderId)
    if (!order || order.startedAtDay !== null) {
      return
    }
    this.orders.set(orderId, { ...order, startedAtDay: day })
  }

  beginFieldLeg(orderId: WorkOrderId, fieldId: string): void {
    const order = this.orders.get(orderId)
    if (!order) {
      return
    }
    const pendingFieldIds = order.pendingFieldIds.filter((id) => id !== fieldId)
    this.orders.set(orderId, {
      ...order,
      currentFieldId: fieldId,
      pendingFieldIds,
    })
  }

  completeFieldLeg(orderId: WorkOrderId, fieldId: string): void {
    const order = this.orders.get(orderId)
    if (!order || order.currentFieldId !== fieldId) {
      return
    }
    this.orders.set(orderId, {
      ...order,
      currentFieldId: null,
      completedFieldIds: [...order.completedFieldIds, fieldId],
    })
  }

  skipField(orderId: WorkOrderId, fieldId: string): void {
    const order = this.orders.get(orderId)
    if (!order) {
      return
    }
    this.orders.set(orderId, {
      ...order,
      pendingFieldIds: order.pendingFieldIds.filter((id) => id !== fieldId),
      currentFieldId:
        order.currentFieldId === fieldId ? null : order.currentFieldId,
    })
  }

  completeOrder(orderId: WorkOrderId): void {
    const order = this.orders.get(orderId)
    if (!order) {
      return
    }
    this.orders.set(orderId, {
      ...order,
      status: WorkOrderStatus.Completed,
      currentFieldId: null,
      pendingFieldIds: [],
    })
  }

  cancelOrder(orderId: WorkOrderId): void {
    const order = this.orders.get(orderId)
    if (!order) {
      return
    }
    this.orders.set(orderId, {
      ...order,
      status: WorkOrderStatus.Cancelled,
      currentFieldId: null,
      pendingFieldIds: [],
    })
  }

  clearCompletedAndCancelled(): void {
    for (const [id, order] of this.orders) {
      if (
        order.status === WorkOrderStatus.Completed ||
        order.status === WorkOrderStatus.Cancelled
      ) {
        this.orders.delete(id)
      }
    }
  }

  toSnapshot(
    order: WorkOrder,
    getFieldName: (fieldId: string) => string,
  ): WorkOrderSnapshot {
    const remainingIds = [
      ...order.pendingFieldIds,
      ...(order.currentFieldId ? [order.currentFieldId] : []),
    ]
    const allFieldIds = [
      ...order.completedFieldIds,
      ...remainingIds,
    ]
    const totalFieldCount = allFieldIds.length
    const remainingFieldCount = remainingIds.length
    const completedFieldCount = order.completedFieldIds.length

    return {
      id: order.id,
      displayName: order.displayName,
      taskKind: order.taskKind,
      status: order.status,
      assignedMachineId: order.assignedMachineId,
      commandOwner: order.commandOwner,
      workerId: order.workerId,
      currentFieldId: order.currentFieldId,
      currentFieldName: order.currentFieldId
        ? getFieldName(order.currentFieldId)
        : null,
      completedFieldCount,
      remainingFieldCount,
      totalFieldCount,
      remainingArea: sumFieldAreas(remainingIds),
      totalArea: sumFieldAreas(allFieldIds),
      blockId: getWorkOrderScopeBlockId(order.scope),
    }
  }

  toSaveData(): WorkOrderSaveData[] {
    return [...this.orders.values()]
      .filter((order) => order.status === WorkOrderStatus.Active)
      .map((order) => ({
        id: order.id,
        displayName: order.displayName,
        taskKind: order.taskKind,
        cropId: order.cropId,
        scope: order.scope,
        executionStrategy: order.executionStrategy,
        status: order.status,
        assignedMachineId: order.assignedMachineId,
        commandOwner: order.commandOwner,
        workerId: order.workerId,
        pendingFieldIds: [...order.pendingFieldIds],
        completedFieldIds: [...order.completedFieldIds],
        currentFieldId: order.currentFieldId,
        createdAtDay: order.createdAtDay,
        startedAtDay: order.startedAtDay,
      }))
  }

  applySave(saved: WorkOrderSaveData[] | undefined): void {
    this.orders.clear()
    if (!saved) {
      return
    }

    let maxId = 0
    for (const entry of saved) {
      if (!entry.id || entry.status !== WorkOrderStatus.Active) {
        continue
      }
      const match = /^work_order_(\d+)$/.exec(entry.id)
      if (match) {
        maxId = Math.max(maxId, Number.parseInt(match[1], 10))
      }
      this.orders.set(entry.id, {
        id: entry.id,
        displayName: entry.displayName,
        taskKind: entry.taskKind,
        cropId: entry.cropId,
        scope: entry.scope,
        executionStrategy:
          entry.executionStrategy ?? WorkOrderExecutionStrategy.CatalogOrder,
        status: WorkOrderStatus.Active,
        assignedMachineId: entry.assignedMachineId,
        commandOwner: entry.commandOwner,
        workerId: entry.workerId ?? null,
        pendingFieldIds: [...entry.pendingFieldIds],
        completedFieldIds: [...entry.completedFieldIds],
        currentFieldId: entry.currentFieldId,
        createdAtDay: entry.createdAtDay,
        startedAtDay: entry.startedAtDay,
      })
    }
    if (maxId > 0) {
      nextWorkOrderId = maxId + 1
    }
  }

  clear(): void {
    this.orders.clear()
  }
}
