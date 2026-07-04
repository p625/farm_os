import type { Mesh, Scene, TransformNode } from '@babylonjs/core'
import type { VegetationLayerDefinition } from '@/types/vegetation-rendering.ts'
import type { VegetationInstanceTransform } from '@/types/vegetation-rendering.ts'
import { composeInstanceMatrix, createVegetationPlaceholderMesh } from '@/rendering/vegetation/VegetationPlaceholderMeshes.ts'

export class VegetationLayer {
  readonly definition: VegetationLayerDefinition
  private root: TransformNode | null = null
  private sourceMesh: Mesh | null = null
  private instanceCount = 0
  private enabled = true

  constructor(definition: VegetationLayerDefinition) {
    this.definition = definition
    this.enabled = definition.enabled
  }

  getInstanceCount(): number {
    return this.instanceCount
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(value: boolean): void {
    this.enabled = value
    if (this.root) {
      this.root.setEnabled(value)
    }
  }

  build(scene: Scene, parent: TransformNode, instances: readonly VegetationInstanceTransform[]): void {
    this.dispose()
    if (!this.enabled || instances.length === 0) {
      this.instanceCount = 0
      return
    }

    const placeholder = createVegetationPlaceholderMesh(scene, this.definition)
    this.root = placeholder.root
    this.sourceMesh = placeholder.mesh
    this.root.parent = parent

    const matrixBuffer = new Float32Array(instances.length * 16)
    for (let index = 0; index < instances.length; index += 1) {
      const matrix = composeInstanceMatrix(instances[index])
      matrixBuffer.set(matrix, index * 16)
    }

    this.sourceMesh.thinInstanceSetBuffer('matrix', matrixBuffer, 16, false)

    const hasPerInstanceColor = instances.some((instance) => instance.colorRgb !== undefined)
    if (hasPerInstanceColor) {
      const colorBuffer = new Float32Array(instances.length * 4)
      for (let index = 0; index < instances.length; index += 1) {
        const rgb = instances[index].colorRgb ?? [1, 1, 1]
        colorBuffer[index * 4] = rgb[0]
        colorBuffer[index * 4 + 1] = rgb[1]
        colorBuffer[index * 4 + 2] = rgb[2]
        colorBuffer[index * 4 + 3] = 1
      }
      this.sourceMesh.thinInstanceSetBuffer('color', colorBuffer, 4, false)
    }

    this.sourceMesh.thinInstanceCount = instances.length
    this.sourceMesh.isVisible = true
    this.instanceCount = instances.length
  }

  getSourceMesh(): Mesh | null {
    return this.sourceMesh
  }

  dispose(): void {
    this.sourceMesh?.dispose()
    this.root?.dispose()
    this.sourceMesh = null
    this.root = null
    this.instanceCount = 0
  }
}
