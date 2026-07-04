import type { FieldSystem } from './FieldSystem.ts'
import type { MachineCapabilityResolver } from './MachineCapabilityResolver.ts'
import type { FarmShopSystem } from './FarmShopSystem.ts'
import type { CropSystem } from './CropSystem.ts'
import type { LogisticsSystem } from './LogisticsSystem.ts'
import type { MachineRegistry } from './MachineRegistry.ts'
import { TractorJobSystem } from './TractorJobSystem.ts'
import { MachineTemplateId } from '@/types/machine-template.ts'
import type { MachineId } from '@/types/machine.ts'
import {
  allocateNextTractorInstanceId,
  registerMachineInstance,
} from './MachineInstanceRegistry.ts'

export interface MachineSpawnTransform {
  x: number
  y: number
  z: number
  rotationY: number
}

export class WorldObjectFactory {
  private fieldSystem: FieldSystem | null = null
  private cropSystem: CropSystem | null = null
  private farmShopSystem: FarmShopSystem | null = null
  private capabilityResolver: MachineCapabilityResolver | null = null
  private logisticsSystem: LogisticsSystem | null = null
  private machineRegistry: MachineRegistry | null = null

  setFieldSystem(fieldSystem: FieldSystem): void {
    this.fieldSystem = fieldSystem
  }

  setCropSystem(cropSystem: CropSystem): void {
    this.cropSystem = cropSystem
  }

  setFarmShopSystem(farmShopSystem: FarmShopSystem): void {
    this.farmShopSystem = farmShopSystem
  }

  setCapabilityResolver(resolver: MachineCapabilityResolver): void {
    this.capabilityResolver = resolver
  }

  setLogisticsSystem(logisticsSystem: LogisticsSystem): void {
    this.logisticsSystem = logisticsSystem
  }

  setMachineRegistry(registry: MachineRegistry): void {
    this.machineRegistry = registry
  }

  createMachineFromTemplate(
    templateId: MachineTemplateId,
    instanceId: MachineId,
    transform: MachineSpawnTransform,
  ): TractorJobSystem | null {
    if (!this.fieldSystem) {
      return null
    }

    switch (templateId) {
      case MachineTemplateId.SmallTractor: {
        registerMachineInstance(instanceId, templateId)
        const controller = new TractorJobSystem(
          this.fieldSystem,
          instanceId,
          { x: transform.x, y: transform.y, z: transform.z },
          transform.rotationY,
        )
        this.wireTractorController(controller)
        return controller
      }
      default:
        return null
    }
  }

  createPurchasedTractor(
    transform: MachineSpawnTransform,
  ): TractorJobSystem | null {
    const instanceId = allocateNextTractorInstanceId()
    return this.createMachineFromTemplate(
      MachineTemplateId.SmallTractor,
      instanceId,
      transform,
    )
  }

  private wireTractorController(controller: TractorJobSystem): void {
    if (this.cropSystem) {
      controller.setCropSystem(this.cropSystem)
    }
    if (this.farmShopSystem) {
      controller.setFarmShopSystem(this.farmShopSystem)
    }
    if (this.capabilityResolver) {
      controller.setCapabilityResolver(this.capabilityResolver)
    }
    if (this.logisticsSystem) {
      controller.setLogisticsSystem(this.logisticsSystem)
    }
    if (this.machineRegistry) {
      controller.setMachineRegistry(this.machineRegistry)
    }
  }
}
