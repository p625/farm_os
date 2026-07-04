/** Contract for future FarmOS Studio editor modules. */

import type { StudioLayerId } from '@/types/world-map.ts'

export interface StudioModuleDefinition {
  id: string
  name: string
  version: string
  layers: readonly StudioLayerId[]
  /** v0.1: metadata only; activate() wired in v0.2+. */
  status: 'planned' | 'active'
  description: string
}

export const STUDIO_MODULES: readonly StudioModuleDefinition[] = [
  {
    id: 'terrain',
    name: 'Terrain Editor',
    version: '0.3',
    layers: ['terrain'],
    status: 'planned',
    description: 'Height paint, smooth, surface materials',
  },
  {
    id: 'roads',
    name: 'Road Editor',
    version: '0.4',
    layers: ['roads'],
    status: 'planned',
    description: 'Spline roads, control points',
  },
  {
    id: 'parcels',
    name: 'Parcel Editor',
    version: '0.5',
    layers: ['fields'],
    status: 'planned',
    description: 'Draw fields, validation, parcel IDs',
  },
  {
    id: 'vegetation',
    name: 'Vegetation Editor',
    version: '0.6',
    layers: ['vegetation'],
    status: 'planned',
    description: 'Paint grass, shrubs, trees',
  },
  {
    id: 'buildings',
    name: 'Building Editor',
    version: '0.7',
    layers: ['buildings'],
    status: 'planned',
    description: 'Place structures and decorations',
  },
  {
    id: 'water',
    name: 'Water Editor',
    version: '0.8',
    layers: ['water'],
    status: 'planned',
    description: 'Rivers, ponds, streams',
  },
  {
    id: 'validation',
    name: 'Validation',
    version: '0.9',
    layers: ['debug'],
    status: 'planned',
    description: 'Map rule checks from art docs',
  },
  {
    id: 'export',
    name: 'Export',
    version: '1.0',
    layers: [
      'terrain',
      'roads',
      'fields',
      'vegetation',
      'buildings',
      'water',
      'poi',
    ],
    status: 'planned',
    description: 'Export to game runtime',
  },
]
