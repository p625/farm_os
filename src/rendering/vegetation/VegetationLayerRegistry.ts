import { VEGETATION_LAYER_CATALOG } from '@/config/rendering/vegetation/vegetation-layer-catalog.ts'
import type { VegetationLayerDefinition } from '@/types/vegetation-rendering.ts'
import { VegetationLayer } from '@/rendering/vegetation/VegetationLayer.ts'

export class VegetationLayerRegistry {
  private readonly layers: VegetationLayer[]

  constructor(definitions: readonly VegetationLayerDefinition[] = VEGETATION_LAYER_CATALOG) {
    this.layers = definitions.map((definition) => new VegetationLayer(definition))
  }

  getLayers(): readonly VegetationLayer[] {
    return this.layers
  }

  getLayer(id: VegetationLayerDefinition['id']): VegetationLayer | undefined {
    return this.layers.find((layer) => layer.definition.id === id)
  }

  setAllEnabled(enabled: boolean): void {
    for (const layer of this.layers) {
      layer.setEnabled(enabled)
    }
  }

  getTotalInstanceCount(): number {
    return this.layers.reduce((sum, layer) => sum + layer.getInstanceCount(), 0)
  }

  dispose(): void {
    for (const layer of this.layers) {
      layer.dispose()
    }
  }
}
