import type { MachineId } from '@/types/machine.ts'

export const AttachmentType = {
  Implement: 'implement',
  Trailer: 'trailer',
  Header: 'header',
  FrontAttachment: 'frontAttachment',
} as const

export type AttachmentTypeValue =
  (typeof AttachmentType)[keyof typeof AttachmentType]

export const AttachmentCategory = {
  Tillage: 'tillage',
  Seeding: 'seeding',
  Harvesting: 'harvesting',
  Transport: 'transport',
  Fertilizing: 'fertilizing',
  Spraying: 'spraying',
} as const

export type AttachmentCategoryValue =
  (typeof AttachmentCategory)[keyof typeof AttachmentCategory]

export const AttachmentLifecycleState = {
  Detached: 'detached',
  Approaching: 'approaching',
  Attaching: 'attaching',
  Attached: 'attached',
  Detaching: 'detaching',
} as const

export type AttachmentLifecycleStateValue =
  (typeof AttachmentLifecycleState)[keyof typeof AttachmentLifecycleState]

export const AttachmentWorkPosition = {
  Transport: 'transport',
  Working: 'working',
} as const

export type AttachmentWorkPositionValue =
  (typeof AttachmentWorkPosition)[keyof typeof AttachmentWorkPosition]

export const AttachmentBehavior = {
  Passive: 'passive',
  Active: 'active',
} as const

export type AttachmentBehaviorValue =
  (typeof AttachmentBehavior)[keyof typeof AttachmentBehavior]

export const AttachmentId = {
  Plow1: 'plow_1',
  Seeder1: 'seeder_1',
  Trailer1: 'trailer_1',
  GrainHeader1: 'grain_header_1',
  CornHeader1: 'corn_header_1',
  FertilizerSpreader1: 'fertilizer_spreader_1',
  Sprayer1: 'sprayer_1',
} as const

export type AttachmentIdValue =
  (typeof AttachmentId)[keyof typeof AttachmentId]

export const AttachmentCatalogId = {
  Plow: 'plow',
  Seeder: 'seeder',
  Wagon: 'wagon',
  GrainHeader: 'grain_header',
  CornHeader: 'corn_header',
  FertilizerSpreader: 'fertilizer_spreader',
  Sprayer: 'sprayer',
} as const

export type AttachmentCatalogIdValue =
  (typeof AttachmentCatalogId)[keyof typeof AttachmentCatalogId]

export const MachineSlotId = {
  FrontHitch: 'front_hitch',
  RearHitch: 'rear_hitch',
  TrailerHitch: 'trailer_hitch',
  HeaderSlot: 'header_slot',
} as const

export type MachineSlotIdValue =
  (typeof MachineSlotId)[keyof typeof MachineSlotId]

export const AttachmentRadialActionKind = {
  Attach: 'attach',
  Detach: 'detach',
  Cancel: 'cancel',
} as const

export type AttachmentRadialActionKind =
  (typeof AttachmentRadialActionKind)[keyof typeof AttachmentRadialActionKind]

export interface AttachmentMountedOn {
  machineId: MachineId
  slotId: MachineSlotIdValue
}

export interface AttachmentSnapshot {
  id: AttachmentIdValue
  name: string
  catalogId: AttachmentCatalogIdValue
  attachmentType: AttachmentTypeValue
  lifecycleState: AttachmentLifecycleStateValue
  mountedOn: AttachmentMountedOn | null
}

export interface MachineSlotSnapshot {
  slotId: MachineSlotIdValue
  label: string
  attachmentId: AttachmentIdValue | null
  attachmentName: string | null
}

export interface MachineAttachmentsSnapshot {
  machineId: MachineId
  machineName: string
  slots: readonly MachineSlotSnapshot[]
}

export interface AttachmentContextMenuSnapshot {
  attachmentId: AttachmentIdValue
  slotId: MachineSlotIdValue | null
  screenX: number
  screenY: number
  actions: readonly AttachmentRadialActionKind[]
}
