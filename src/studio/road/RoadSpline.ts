import type { RoadControlPoint } from '@/types/road.ts'

export interface SplineSample {
  x: number
  y: number
  z: number
}

function catmullRom(
  p0: RoadControlPoint,
  p1: RoadControlPoint,
  p2: RoadControlPoint,
  p3: RoadControlPoint,
  t: number,
): SplineSample {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    z:
      0.5 *
      (2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  }
}

export function sampleRoadSpline(
  points: readonly RoadControlPoint[],
  samplesPerSegment = 8,
): SplineSample[] {
  if (points.length === 0) {
    return []
  }
  if (points.length === 1) {
    return [{ ...points[0] }]
  }

  const result: SplineSample[] = []
  for (let segment = 0; segment < points.length - 1; segment++) {
    const p0 = points[Math.max(0, segment - 1)]
    const p1 = points[segment]
    const p2 = points[segment + 1]
    const p3 = points[Math.min(points.length - 1, segment + 2)]
    const steps = segment === points.length - 2 ? samplesPerSegment + 1 : samplesPerSegment
    for (let step = 0; step < steps; step++) {
      if (segment > 0 && step === 0) {
        continue
      }
      const t = step / samplesPerSegment
      result.push(catmullRom(p0, p1, p2, p3, t))
    }
  }
  return result
}
