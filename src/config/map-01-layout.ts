/**
 * Map 01 — Central Europe layout data (runtime source of truth).
 * World bounds are configurable; terrain and placement derive from them.
 */

export interface WorldBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export const MAP_01_WORLD_BOUNDS: WorldBounds = {
  minX: -55,
  maxX: 85,
  minZ: -60,
  maxZ: 65,
}

export function getWorldTerrainSize(): { width: number; depth: number } {
  return {
    width: MAP_01_WORLD_BOUNDS.maxX - MAP_01_WORLD_BOUNDS.minX,
    depth: MAP_01_WORLD_BOUNDS.maxZ - MAP_01_WORLD_BOUNDS.minZ,
  }
}

export function getWorldCenter(): { x: number; z: number } {
  return {
    x: (MAP_01_WORLD_BOUNDS.minX + MAP_01_WORLD_BOUNDS.maxX) / 2,
    z: (MAP_01_WORLD_BOUNDS.minZ + MAP_01_WORLD_BOUNDS.maxZ) / 2,
  }
}

export type FieldBlockId = 'A' | 'B' | 'C'

/**
 * Reserved for a future road-access system (Phase 16+). No gameplay effect.
 */
export type MachineApproachHint =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'road_access'

export interface FieldLayoutEntry {
  id: string
  position: { x: number; y: number; z: number }
  meshSize: { width: number; depth: number }
  rotationY?: number
  blockId: FieldBlockId
  /** Reserved — future road network field access id */
  roadAccess?: string
  /** Reserved — future machine approach heuristic */
  preferredMachineApproach?: MachineApproachHint
}

export interface HubPlacement {
  position: { x: number; y: number; z: number }
  rotationY?: number
}

export interface FarmHubLayout {
  farmyard: {
    position: { x: number; y: number; z: number }
    size: { width: number; depth: number }
  }
  barn: HubPlacement
  mill: HubPlacement
  dealership: HubPlacement
  tractorHome: HubPlacement
  grainCombineHome: HubPlacement
  cornCombineHome: HubPlacement
  siloEntry: HubPlacement
  dealerEntry: HubPlacement
  equipmentYard: Record<string, { x: number; y: number; z: number }>
  deliverySlots: Array<{ x: number; y: number; z: number; rotationY: number }>
}

export const FIELD_LAYOUT: readonly FieldLayoutEntry[] = [
  {
    id: 'field_1',
    position: { x: 42, y: 0, z: 22 },
    meshSize: { width: 12, depth: 16 },
    blockId: 'A',
    roadAccess: 'field_access_a01',
    preferredMachineApproach: 'south',
  },
  {
    id: 'field_2',
    position: { x: 58, y: 0, z: 20 },
    meshSize: { width: 14, depth: 18 },
    blockId: 'A',
    roadAccess: 'field_access_a02',
    preferredMachineApproach: 'west',
  },
  {
    id: 'field_3',
    position: { x: 50, y: 0, z: 6 },
    meshSize: { width: 12, depth: 14 },
    blockId: 'A',
    roadAccess: 'field_access_a03',
    preferredMachineApproach: 'north',
  },
  {
    id: 'field_4',
    position: { x: 28, y: 0, z: 14 },
    meshSize: { width: 12, depth: 16 },
    blockId: 'A',
    roadAccess: 'field_access_a04',
    preferredMachineApproach: 'east',
  },
  {
    id: 'field_5',
    position: { x: 18, y: 0, z: -8 },
    meshSize: { width: 18, depth: 22 },
    blockId: 'B',
    roadAccess: 'field_access_b01_upper',
    preferredMachineApproach: 'road_access',
  },
  {
    id: 'field_6',
    position: { x: 2, y: 0, z: -26 },
    meshSize: { width: 20, depth: 24 },
    blockId: 'B',
    roadAccess: 'field_access_b01_lower',
    preferredMachineApproach: 'road_access',
  },
  {
    id: 'field_7',
    position: { x: -22, y: 0, z: -18 },
    meshSize: { width: 22, depth: 26 },
    blockId: 'B',
    roadAccess: 'field_access_b02',
    preferredMachineApproach: 'east',
  },
  {
    id: 'field_8',
    position: { x: 32, y: 0, z: -32 },
    meshSize: { width: 16, depth: 20 },
    blockId: 'B',
    roadAccess: 'field_access_b03',
    preferredMachineApproach: 'north',
  },
  {
    id: 'field_9',
    position: { x: -38, y: 0, z: -42 },
    meshSize: { width: 24, depth: 28 },
    blockId: 'C',
    roadAccess: 'field_access_c01',
    preferredMachineApproach: 'east',
  },
] as const

export const FARM_HUB: FarmHubLayout = {
  farmyard: {
    position: { x: 54, y: 0, z: 48 },
    size: { width: 26, depth: 18 },
  },
  barn: { position: { x: 50, y: 0, z: 38 } },
  mill: { position: { x: 44, y: 0, z: 42 } },
  dealership: { position: { x: 38, y: 0, z: 50 } },
  tractorHome: {
    position: { x: 48, y: 0, z: 44 },
    rotationY: -Math.PI / 6,
  },
  grainCombineHome: {
    position: { x: 58, y: 0, z: 44 },
    rotationY: -Math.PI / 6,
  },
  cornCombineHome: {
    position: { x: 64, y: 0, z: 44 },
    rotationY: -Math.PI / 6,
  },
  siloEntry: { position: { x: 54, y: 0, z: 40 } },
  dealerEntry: { position: { x: 38, y: 0, z: 54 } },
  equipmentYard: {
    plow_1: { x: 46, y: 0, z: 52 },
    seeder_1: { x: 52, y: 0, z: 54 },
    trailer_1: { x: 58, y: 0, z: 52 },
    grain_header_1: { x: 48, y: 0, z: 58 },
    corn_header_1: { x: 56, y: 0, z: 58 },
  },
  deliverySlots: [
    { x: 34, y: 0, z: 56, rotationY: -Math.PI / 6 },
    { x: 38, y: 0, z: 58, rotationY: -Math.PI / 6 },
    { x: 42, y: 0, z: 56, rotationY: -Math.PI / 6 },
  ],
}

const layoutById = new Map(FIELD_LAYOUT.map((entry) => [entry.id, entry]))

export function getFieldLayoutEntry(id: string): FieldLayoutEntry | undefined {
  return layoutById.get(id)
}

export function getFieldHalfExtents(id: string): {
  halfWidth: number
  halfDepth: number
} {
  const layout = layoutById.get(id)
  if (!layout) {
    return { halfWidth: 5, halfDepth: 7 }
  }
  return {
    halfWidth: layout.meshSize.width / 2,
    halfDepth: layout.meshSize.depth / 2,
  }
}

export const FIELD_POSITIONS: Record<string, { x: number; y: number; z: number }> =
  Object.fromEntries(
    FIELD_LAYOUT.map((entry) => [entry.id, { ...entry.position }]),
  )
