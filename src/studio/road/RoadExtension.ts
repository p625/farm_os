import type { MapObject, WorldMapDocument } from '@/types/world-map.ts'
import type { RoadControlPoint, RoadKind } from '@/types/road.ts'
import { getRoadKind, getRoadPoints } from '@/studio/road/roadObject.ts'
import type { RoadPointJunction } from '@/types/road.ts'

export interface RoadDraft {
  roadKind: RoadKind
  points: RoadControlPoint[]
}

function stripJunction(point: RoadControlPoint): RoadControlPoint {
  const { junction: _junction, ...rest } = point
  return rest
}

function clonePoint(point: RoadControlPoint): RoadControlPoint {
  return {
    ...point,
    ...(point.junction ? { junction: { ...point.junction } } : {}),
  }
}

function isExtendableEndpointJunction(
  junction: RoadPointJunction | undefined,
  draftKind: RoadKind,
): junction is RoadPointJunction & { anchorEndpoint: 'start' | 'end' } {
  if (!junction) {
    return false
  }
  if (junction.join !== 'merge') {
    return false
  }
  if (junction.roadKind !== draftKind) {
    return false
  }
  return junction.anchorEndpoint === 'start' || junction.anchorEndpoint === 'end'
}

export function resolveDraftExtension(
  map: WorldMapDocument,
  draft: RoadDraft,
): { anchorId: string; points: RoadControlPoint[] } | null {
  const startJunction = draft.points[0]?.junction
  if (isExtendableEndpointJunction(startJunction, draft.roadKind)) {
    return buildExtendedPoints(
      map,
      startJunction.roadId,
      startJunction.anchorEndpoint,
      draft.points.slice(1),
    )
  }

  const endJunction = draft.points[draft.points.length - 1]?.junction
  if (isExtendableEndpointJunction(endJunction, draft.roadKind)) {
    return buildExtendedPoints(
      map,
      endJunction.roadId,
      endJunction.anchorEndpoint,
      draft.points.slice(0, -1),
    )
  }

  return null
}

function buildExtendedPoints(
  map: WorldMapDocument,
  anchorId: string,
  anchorEndpoint: 'start' | 'end',
  draftTail: readonly RoadControlPoint[],
): { anchorId: string; points: RoadControlPoint[] } | null {
  if (draftTail.length < 1) {
    return null
  }

  const anchor = map.objects.find((object) => object.id === anchorId)
  const anchorKind = anchor ? getRoadKind(anchor) : null
  const anchorPoints = anchor ? getRoadPoints(anchor) : null
  if (!anchor || !anchorKind || !anchorPoints || anchorPoints.length < 2) {
    return null
  }

  const extension = draftTail.map((point) => stripJunction(clonePoint(point)))
  if (extension.length < 1) {
    return null
  }

  const base = anchorPoints.map((point) => clonePoint(point))
  if (anchorEndpoint === 'end') {
    if (base.length > 0) {
      base[base.length - 1] = stripJunction(base[base.length - 1])
    }
    return { anchorId, points: [...base, ...extension] }
  }

  if (base.length > 0) {
    base[0] = stripJunction(base[0])
  }
  return { anchorId, points: [...extension, ...base] }
}

export function tryMergeDraftExtensionIntoAnchor(
  map: WorldMapDocument,
  draft: RoadDraft,
): { map: WorldMapDocument; anchorId: string; roadName: string } | null {
  const resolved = resolveDraftExtension(map, draft)
  if (!resolved) {
    return null
  }

  const anchor = map.objects.find((object) => object.id === resolved.anchorId)
  if (!anchor) {
    return null
  }

  const objects = map.objects.map((object) => {
    if (object.id !== resolved.anchorId) {
      return object
    }
    return {
      ...object,
      properties: {
        ...object.properties,
        points: resolved.points,
      },
    } satisfies MapObject
  })

  return {
    map: { ...map, objects },
    anchorId: resolved.anchorId,
    roadName: anchor.name ?? resolved.anchorId,
  }
}
