import type { MachineCapability as MachineCapabilityValue } from './machine.ts'
import {
  type AttachmentTypeValue,
  type MachineSlotIdValue,
} from './attachment.ts'

export const MachineTemplateId = {
  SmallTractor: 'small_tractor',
  GrainCombine: 'grain_combine',
  CornCombine: 'corn_combine',
} as const

export type MachineTemplateId =
  (typeof MachineTemplateId)[keyof typeof MachineTemplateId]

export interface MachineTemplateSlotDefinition {
  id: MachineSlotIdValue
  label: string
  acceptedTypes: readonly AttachmentTypeValue[]
}

export interface MachineTemplateDefinition {
  id: MachineTemplateId
  name: string
  capabilities: readonly MachineCapabilityValue[]
  slots: readonly MachineTemplateSlotDefinition[]
  visualPrototype: 'tractor' | 'grain_combine' | 'corn_combine'
}

export const STARTER_MACHINE_INSTANCES: Record<string, MachineTemplateId> = {
  tractor_1: MachineTemplateId.SmallTractor,
  grain_combine_1: MachineTemplateId.GrainCombine,
  corn_combine_1: MachineTemplateId.CornCombine,
}

export function isPurchasedTractorInstanceId(instanceId: string): boolean {
  return /^tractor_\d+$/.test(instanceId) && instanceId !== 'tractor_1'
}

export function isMachineInstanceId(value: string): boolean {
  return (
    value in STARTER_MACHINE_INSTANCES || isPurchasedTractorInstanceId(value)
  )
}
