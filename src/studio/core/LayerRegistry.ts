import type { StudioLayerId } from '@/types/world-map.ts'
import { STUDIO_LAYER_IDS } from '@/types/world-map.ts'

export interface LayerDefinition {
  id: StudioLayerId
  label: string
  description: string
  editableInFuture: string
}

export const STUDIO_LAYER_DEFINITIONS: readonly LayerDefinition[] = [
  {
    id: 'terrain',
    label: 'Terrain',
    description: 'Ground surface and height',
    editableInFuture: 'Terrain Editor (v0.3)',
  },
  {
    id: 'roads',
    label: 'Roads',
    description: 'Movement network',
    editableInFuture: 'Road Editor (v0.4)',
  },
  {
    id: 'fields',
    label: 'Fields',
    description: 'Agricultural parcels',
    editableInFuture: 'Parcel Editor (v0.5)',
  },
  {
    id: 'vegetation',
    label: 'Vegetation',
    description: 'Grass, shrubs, trees',
    editableInFuture: 'Vegetation Editor (v0.6)',
  },
  {
    id: 'buildings',
    label: 'Buildings',
    description: 'Structures and farm infrastructure',
    editableInFuture: 'Building Editor (v0.7)',
  },
  {
    id: 'water',
    label: 'Water',
    description: 'Rivers, ponds, streams',
    editableInFuture: 'Water Editor (v0.8)',
  },
  {
    id: 'poi',
    label: 'POI',
    description: 'Points of interest and spawns',
    editableInFuture: 'POI module (v1.0)',
  },
  {
    id: 'debug',
    label: 'Debug',
    description: 'Development markers',
    editableInFuture: 'Validation (v0.9)',
  },
] as const

export function createDefaultLayerVisibility(): Record<StudioLayerId, boolean> {
  return STUDIO_LAYER_IDS.reduce(
    (acc, id) => {
      acc[id] = id !== 'debug'
      return acc
    },
    {} as Record<StudioLayerId, boolean>,
  )
}
