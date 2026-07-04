import type { MapPolygonPoint } from '@/types/world-map.ts'

export interface PolygonDrawingSessionState {
  points: MapPolygonPoint[]
  cursor: MapPolygonPoint | null
}

export class PolygonDrawingSession {
  private points: MapPolygonPoint[] = []
  private cursor: MapPolygonPoint | null = null
  private finishing = false

  getState(): PolygonDrawingSessionState {
    return {
      points: this.points.map((point) => ({ ...point })),
      cursor: this.cursor ? { ...this.cursor } : null,
    }
  }

  get pointCount(): number {
    return this.points.length
  }

  get isActive(): boolean {
    return this.points.length > 0 || this.cursor !== null
  }

  isFinishing(): boolean {
    return this.finishing
  }

  beginFinish(): boolean {
    if (this.finishing) {
      return false
    }
    this.finishing = true
    return true
  }

  endFinish(): void {
    this.finishing = false
  }

  addPoint(x: number, z: number): void {
    this.finishing = false
    this.points.push({ x, z })
    this.cursor = { x, z }
  }

  removeLastPoint(): boolean {
    if (this.points.length === 0) {
      return false
    }
    this.points.pop()
    const last = this.points[this.points.length - 1]
    this.cursor = last ? { ...last } : null
    return true
  }

  setCursor(x: number, z: number): void {
    this.cursor = { x, z }
  }

  clear(): void {
    this.points = []
    this.cursor = null
    this.finishing = false
  }

  committedPoints(): MapPolygonPoint[] {
    return this.points.map((point) => ({ ...point }))
  }
}
