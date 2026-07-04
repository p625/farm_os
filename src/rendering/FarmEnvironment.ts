import type { Scene } from '@babylonjs/core'

/**
 * @deprecated Scene environment is owned by RenderingSystem.
 */
export class FarmEnvironment {
  apply(_scene: Scene): void {
    // No-op — RenderingSystem configures fog, ambient, and clear color.
  }
}
