import { Color3, Color4, Scene } from '@babylonjs/core'

const SKY_HORIZON = new Color3(0.72, 0.86, 0.96)
const FOG_COLOR = new Color3(0.62, 0.8, 0.9)

export class FarmEnvironment {
  apply(scene: Scene): void {
    scene.clearColor = new Color4(
      SKY_HORIZON.r,
      SKY_HORIZON.g,
      SKY_HORIZON.b,
      1,
    )
    scene.ambientColor = new Color3(0.35, 0.38, 0.32)
    scene.fogMode = Scene.FOGMODE_EXP2
    scene.fogColor = FOG_COLOR
    scene.fogDensity = 0.0065
  }
}
