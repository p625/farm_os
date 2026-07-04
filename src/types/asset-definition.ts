import type { SceneAnchorKind } from '@/types/scene-anchor.ts'

/** Shared anchor template used by buildings, machines, and attachments. */
export interface AssetAnchorTemplate {
  anchorKind: SceneAnchorKind
  label: string
  /** Local X offset in meters, or ratio of parent width when |value| <= 1 and useRatio is true. */
  localX: number
  /** Local Z offset in meters, or ratio of parent depth when |value| <= 1 and useRatio is true. */
  localZ: number
  /** When true, localX/localZ are multiplied by parent width/depth. */
  useRatio?: boolean
  entityId?: string
  triggerRadius?: number
  required?: boolean
}

export type GameplayAssetCategory =
  | 'building'
  | 'machine'
  | 'attachment'

export interface GameplayAssetDefinition {
  id: string
  category: GameplayAssetCategory
  name: string
  defaultAnchors: readonly AssetAnchorTemplate[]
}

export function resolveAnchorLocalOffset(
  template: AssetAnchorTemplate,
  parentWidth: number,
  parentDepth: number,
): { localX: number; localZ: number } {
  if (template.useRatio) {
    return {
      localX: template.localX * parentWidth,
      localZ: template.localZ * parentDepth,
    }
  }
  return { localX: template.localX, localZ: template.localZ }
}

export function resolveAnchorEntityId(
  template: AssetAnchorTemplate,
  context: { machineId?: string; buildingId?: string },
): string | undefined {
  if (!template.entityId) {
    return undefined
  }
  if (template.entityId === '{machineId}' && context.machineId) {
    return context.machineId
  }
  return template.entityId
}
