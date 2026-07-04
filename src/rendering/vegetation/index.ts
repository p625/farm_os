export { VegetationSystem } from './VegetationSystem.ts'
export { VegetationLayer } from './VegetationLayer.ts'
export { VegetationLayerRegistry } from './VegetationLayerRegistry.ts'
export { VegetationInstanceBuilder } from './VegetationInstanceBuilder.ts'
export {
  buildVegetationPlacementContext,
  evaluatePlacementWeight,
  shouldRejectPlacement,
} from './VegetationPlacementRules.ts'
export {
  filterInstancesForLod,
  resolveLodBand,
  shouldCullShortGrassLayer,
} from './VegetationLodPolicy.ts'
export { VegetationWindController } from './VegetationWindController.ts'
export { logVegetationDebugReport, buildVegetationDebugReport } from './VegetationDebug.ts'
