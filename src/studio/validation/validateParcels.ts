import type { WorldMapDocument } from '@/types/world-map.ts'
import type { MapValidationIssue } from '@/types/map-validation.ts'
import {
  getFieldParcelFootprint,
  isMeadowLikeParcelType,
  isParcelBlockId,
  isParcelType,
  parseFieldParcelProperties,
} from '@/types/parcel.ts'
import { FieldWorkState, parseFieldTestState } from '@/types/field-test-state.ts'
import { parseRoadProperties } from '@/types/road.ts'
import {
  getFieldPolygonPoints,
  PARCEL_ROAD_ACCESS_MAX_DISTANCE,
  polygonSelfIntersects,
  distancePointToPolyline,
  polygonCentroid,
} from '@/studio/parcel/ParcelPolygon.ts'
import { isParcelLayoutIdTaken } from '@/studio/parcel/allocateParcelLayoutId.ts'
import { isFootprintInsideTerrainBounds } from '@/studio/validation/terrainBounds.ts'
import type { getTerrainBounds } from '@/studio/validation/terrainBounds.ts'

export function validateParcelSemantics(
  map: WorldMapDocument,
  bounds: ReturnType<typeof getTerrainBounds>,
  pushIssue: (issue: Omit<MapValidationIssue, 'id'>) => void,
): void {
  const parcelIds = new Map<string, string[]>()
  const roadPolylines = map.objects
    .filter((object) => object.layer === 'roads' && object.kind === 'road')
    .map((road) => parseRoadProperties(road.properties)?.points ?? [])
    .filter((points) => points.length >= 2)
    .map((points) => points.map((point) => ({ x: point.x, z: point.z })))

  for (const field of map.objects) {
    if (field.layer !== 'fields' || field.kind !== 'field') {
      continue
    }

    const props = parseFieldParcelProperties(field.properties)
    if (!props) {
      continue
    }

    if (!props.parcelId?.trim()) {
      pushIssue({
        ruleId: 'parcel-missing-id',
        severity: 'error',
        objectId: field.id,
        message: `Field "${field.name ?? field.id}" is missing parcel layout id (e.g. A-01).`,
        layer: 'fields',
        position: field.transform.position,
      })
    } else {
      const owners = parcelIds.get(props.parcelId) ?? []
      owners.push(field.id)
      parcelIds.set(props.parcelId, owners)
    }

    if (!isParcelBlockId(props.parcelBlock)) {
      pushIssue({
        ruleId: 'parcel-invalid-block',
        severity: 'error',
        objectId: field.id,
        message: `Field "${field.name ?? field.id}" has invalid blockId "${props.parcelBlock}".`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    const parcelType = props.parcelType
    if (parcelType && !isParcelType(parcelType)) {
      pushIssue({
        ruleId: 'parcel-invalid-type',
        severity: 'error',
        objectId: field.id,
        message: `Field "${field.name ?? field.id}" has invalid parcelType.`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    const state = props.fieldTestState ?? parseFieldTestState(field.properties)
    if (
      isMeadowLikeParcelType(parcelType) &&
      state.cropEnabled &&
      state.cropId
    ) {
      pushIssue({
        ruleId: 'parcel-meadow-crop',
        severity: 'error',
        objectId: field.id,
        message: `${props.parcelId ?? field.id}: meadow/protected parcels cannot carry arable crops.`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    if (
      state.workState === FieldWorkState.ReadyToHarvest &&
      (!state.cropEnabled || !state.cropId)
    ) {
      pushIssue({
        ruleId: 'parcel-ready-without-crop',
        severity: 'error',
        objectId: field.id,
        message: `${props.parcelId ?? field.id}: readyToHarvest requires cropType.`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    if (state.cropEnabled && state.cropId && !state.cropEnabled) {
      pushIssue({
        ruleId: 'parcel-crop-disabled-with-type',
        severity: 'error',
        objectId: field.id,
        message: `${props.parcelId ?? field.id}: cropType set while cropEnabled is false.`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    if (!state.cropEnabled && state.cropId) {
      pushIssue({
        ruleId: 'parcel-crop-type-when-disabled',
        severity: 'error',
        objectId: field.id,
        message: `${props.parcelId ?? field.id}: cropType must be empty when cropEnabled is false.`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    const polygon = getFieldPolygonPoints(field)
    if (polygon && polygon.length >= 4 && polygonSelfIntersects(polygon)) {
      pushIssue({
        ruleId: 'parcel-self-intersect',
        severity: 'error',
        objectId: field.id,
        message: `${props.parcelId ?? field.id}: polygon self-intersects.`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    const footprint = getFieldParcelFootprint(field)
    if (footprint && bounds && !isFootprintInsideTerrainBounds(bounds, footprint)) {
      pushIssue({
        ruleId: 'parcel-out-of-bounds',
        severity: 'error',
        objectId: field.id,
        message: `${props.parcelId ?? field.id}: parcel extends outside map bounds.`,
        layer: 'fields',
        position: field.transform.position,
      })
    }

    if (roadPolylines.length > 0 && polygon && polygon.length >= 3) {
      const centroid = polygonCentroid(polygon)
      const nearest = Math.min(
        ...roadPolylines.map((polyline) =>
          distancePointToPolyline(centroid, polyline),
        ),
      )
      if (nearest > PARCEL_ROAD_ACCESS_MAX_DISTANCE && !props.roadAccess) {
        pushIssue({
          ruleId: 'parcel-road-access',
          severity: 'warn',
          objectId: field.id,
          message: `${props.parcelId ?? field.id}: no road access within ${PARCEL_ROAD_ACCESS_MAX_DISTANCE} m.`,
          layer: 'fields',
          position: field.transform.position,
        })
      }
    }
  }

  for (const [parcelId, objectIds] of parcelIds) {
    if (objectIds.length > 1) {
      pushIssue({
        ruleId: 'parcel-duplicate-id',
        severity: 'error',
        message: `Duplicate parcel id "${parcelId}" on ${objectIds.join(', ')}.`,
        objectId: objectIds[1],
        layer: 'fields',
      })
    }
    if (isParcelLayoutIdTaken(map, parcelId) && objectIds.length > 1) {
      continue
    }
  }
}
