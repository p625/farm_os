import type { ProductIdValue } from './product.ts'
import type { MachineTemplateId } from './machine-template.ts'
import type { AttachmentCatalogIdValue, AttachmentIdValue } from './attachment.ts'

export const DeliveryStatus = {
  Pending: 'pending',
  Ready: 'ready',
  Delivered: 'delivered',
} as const

export type DeliveryStatus =
  (typeof DeliveryStatus)[keyof typeof DeliveryStatus]

export const DeliveryZoneId = {
  DealerLot: 'dealer_delivery_zone',
} as const

export type DeliveryZoneId =
  (typeof DeliveryZoneId)[keyof typeof DeliveryZoneId]

export interface DeliveryZoneSlot {
  x: number
  y: number
  z: number
  rotationY: number
}

export interface DeliveryZoneDefinition {
  id: DeliveryZoneId
  label: string
  slots: readonly DeliveryZoneSlot[]
  clearanceRadius: number
}

export interface MachineDeliveryFulfillment {
  kind: 'machine'
  machineTemplateId: MachineTemplateId
  machineInstanceId: string
  position: { x: number; y: number; z: number }
  rotationY: number
}

export interface AttachmentDeliveryFulfillment {
  kind: 'attachment'
  attachmentCatalogId: AttachmentCatalogIdValue
  attachmentInstanceId: AttachmentIdValue
  position: { x: number; y: number; z: number }
  rotationY: number
}

export type PurchaseDeliveryFulfillment =
  | MachineDeliveryFulfillment
  | AttachmentDeliveryFulfillment

export interface DeliveryQueueEntry {
  id: string
  productId: ProductIdValue
  orderedDay: number
  deliverOnDay: number
  status: DeliveryStatus
  fulfillment: PurchaseDeliveryFulfillment
}
