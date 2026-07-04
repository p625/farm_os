import type { WorldMapDocument } from '@/types/world-map.ts'
import type { FarmHubLayout } from '@/config/map-01-layout.ts'
import { FARM_HUB } from '@/config/map-01-layout.ts'
import { getSceneAnchors, parseSceneAnchorProperties } from '@/types/scene-anchor.ts'
import { parseBuildingProperties } from '@/types/building.ts'
import { getBuildingAssetDefinition, getRequiredAnchorTemplates } from '@/config/gameplay-asset-catalog.ts'
import { MachineId } from '@/types/machine.ts'

function hubPlacementFromAnchor(
  anchor: ReturnType<typeof getSceneAnchors>[number],
): { position: { x: number; y: number; z: number }; rotationY?: number } {
  return {
    position: { ...anchor.transform.position },
    ...(anchor.transform.rotationY !== undefined
      ? { rotationY: anchor.transform.rotationY }
      : {}),
  }
}

/** Map scene anchors into runtime farm hub layout for game export. */
export function buildFarmHubFromAnchors(map: WorldMapDocument): Partial<FarmHubLayout> {
  const partial: Partial<FarmHubLayout> = {}
  const equipmentYard: Record<string, { x: number; y: number; z: number }> = {}
  const deliverySlots: Array<{ x: number; y: number; z: number; rotationY: number }> = []

  for (const anchor of getSceneAnchors(map.objects)) {
    const props = parseSceneAnchorProperties(anchor.properties)
    if (!props || props.active === false) {
      continue
    }

    const placement = hubPlacementFromAnchor(anchor)

    if (props.anchorKind === 'spawn') {
      if (props.entityId === MachineId.Tractor1 || props.entityId === 'tractor') {
        partial.tractorHome = placement
      } else if (
        props.entityId === MachineId.GrainCombine1 ||
        props.entityId === 'grain_combine'
      ) {
        partial.grainCombineHome = placement
      } else if (
        props.entityId === MachineId.CornCombine1 ||
        props.entityId === 'corn_combine'
      ) {
        partial.cornCombineHome = placement
      } else if (!partial.tractorHome && props.label.toLowerCase().includes('tractor')) {
        partial.tractorHome = placement
      }
    }

    if (props.anchorKind === 'interaction' || props.anchorKind === 'entry') {
      if (props.entityId === 'silo_entry') {
        partial.siloEntry = placement
      }
      if (props.entityId === 'dealer_entry') {
        partial.dealerEntry = placement
      }
    }

    if (props.anchorKind === 'parking' && props.parentObjectId) {
      const key = props.entityId ?? props.label.replace(/\s+/g, '_').toLowerCase()
      equipmentYard[key] = {
        x: placement.position.x,
        y: placement.position.y,
        z: placement.position.z,
      }
    }

    if (props.anchorKind === 'loading' || props.anchorKind === 'unload') {
      deliverySlots.push({
        x: placement.position.x,
        y: placement.position.y,
        z: placement.position.z,
        rotationY: placement.rotationY ?? 0,
      })
    }
  }

  if (Object.keys(equipmentYard).length > 0) {
    partial.equipmentYard = equipmentYard
  }
  if (deliverySlots.length > 0) {
    partial.deliverySlots = deliverySlots
  }

  return partial
}

export function getBuildingsMissingRequiredAnchors(
  map: WorldMapDocument,
): Array<{ buildingId: string; name: string }> {
  const missing: Array<{ buildingId: string; name: string }> = []
  for (const object of map.objects) {
    if (object.layer !== 'buildings') {
      continue
    }
    const props = parseBuildingProperties(object.properties)
    if (!props) {
      continue
    }
    const anchors = getSceneAnchors(map.objects).filter(
      (anchor) =>
        parseSceneAnchorProperties(anchor.properties)?.parentObjectId === object.id,
    )
    const asset = getBuildingAssetDefinition(props.buildingType)
    const missingRequired = getRequiredAnchorTemplates(asset.defaultAnchors).filter(
      (template) =>
        !anchors.some((anchor) => {
          const anchorProps = parseSceneAnchorProperties(anchor.properties)
          return (
            anchorProps?.anchorKind === template.anchorKind &&
            (template.entityId
              ? anchorProps.entityId === template.entityId
              : anchorProps?.label === template.label)
          )
        }),
    )
    if (missingRequired.length > 0) {
      missing.push({ buildingId: object.id, name: object.name ?? object.id })
    }
  }
  return missing
}

export function getVehiclesMissingParking(
  map: WorldMapDocument,
): Array<{ vehicleId: string; name: string }> {
  const missing: Array<{ vehicleId: string; name: string }> = []
  for (const object of map.objects) {
    if (object.layer !== 'vehicles') {
      continue
    }
    const hasParking = getSceneAnchors(map.objects).some((anchor) => {
      const props = parseSceneAnchorProperties(anchor.properties)
      return (
        props?.parentObjectId === object.id && props.anchorKind === 'parking'
      )
    })
    if (!hasParking) {
      missing.push({ vehicleId: object.id, name: object.name ?? object.id })
    }
  }
  return missing
}

export { FARM_HUB }
