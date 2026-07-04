export const MIN_WATER_AREA_RADIUS = 2

export interface WaterEllipse {
  centerX: number
  centerZ: number
  radiusX: number
  radiusZ: number
}

export function waterEllipseFromCorners(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  minRadius = MIN_WATER_AREA_RADIUS,
): WaterEllipse {
  const minX = Math.min(ax, bx)
  const maxX = Math.max(ax, bx)
  const minZ = Math.min(az, bz)
  const maxZ = Math.max(az, bz)
  const radiusX = Math.max(minRadius, (maxX - minX) * 0.5)
  const radiusZ = Math.max(minRadius, (maxZ - minZ) * 0.5)
  return {
    centerX: (minX + maxX) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
    radiusX,
    radiusZ,
  }
}

export function waterEllipseFromDefaults(
  centerX: number,
  centerZ: number,
  radiusX: number,
  radiusZ: number,
): WaterEllipse {
  return {
    centerX,
    centerZ,
    radiusX: Math.max(MIN_WATER_AREA_RADIUS, radiusX),
    radiusZ: Math.max(MIN_WATER_AREA_RADIUS, radiusZ),
  }
}
