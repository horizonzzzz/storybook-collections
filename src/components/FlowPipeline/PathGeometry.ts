import type { Slice, Vec2 } from './types'

export interface PathGeometryConfig {
  points?: Array<[number, number]>
}

export interface Segment {
  index: number
  start: Vec2
  end: Vec2
  length: number
  startLength: number
  endLength: number
  tangent: Vec2
}

export default class PathGeometry {
  points: Array<[number, number]>
  segments: Segment[]
  segmentLengths: number[]
  totalLength: number

  constructor(config: PathGeometryConfig = {}) {
    this.points = normalizePoints(config.points ?? [])
    this.segments = buildSegments(this.points)
    this.segmentLengths = this.segments.map((segment) => segment.length)
    this.totalLength = this.segments.length
      ? this.segments[this.segments.length - 1].endLength
      : 0
  }

  getTotalLength(): number {
    return this.totalLength
  }

  clampLength(length: number): number {
    if (!this.totalLength) {
      return 0
    }

    return Math.min(Math.max(Number(length) || 0, 0), this.totalLength)
  }

  normalizeLoopLength(length: number): number {
    if (!this.totalLength) {
      return 0
    }

    const normalized = (Number(length) || 0) % this.totalLength
    return normalized < 0 ? normalized + this.totalLength : normalized
  }

  getPointAtLength(length: number): Vec2 {
    const safeLength = this.clampLength(length)
    const segment = this.findSegment(safeLength)

    if (!segment) {
      const lastPoint = this.points[this.points.length - 1] ?? [0, 0]
      return { x: lastPoint[0], y: lastPoint[1] }
    }

    const localLength = safeLength - segment.startLength

    return {
      x: segment.start.x + segment.tangent.x * localLength,
      y: segment.start.y + segment.tangent.y * localLength
    }
  }

  getTangentAtLength(length: number): Vec2 {
    const segment = this.findSegment(this.clampLength(length))
    return segment ? { ...segment.tangent } : { x: 0, y: 0 }
  }

  getSlices(startLength: number, endLength: number): Slice[] {
    const safeStart = this.clampLength(startLength)
    const safeEnd = this.clampLength(endLength)

    if (safeEnd <= safeStart) {
      return []
    }

    const intervalLength = safeEnd - safeStart
    const slices: Slice[] = []

    this.segments.forEach((segment) => {
      const sliceStart = Math.max(safeStart, segment.startLength)
      const sliceEnd = Math.min(safeEnd, segment.endLength)

      if (sliceEnd <= sliceStart) {
        return
      }

      slices.push({
        segmentIndex: segment.index,
        startLength: sliceStart,
        endLength: sliceEnd,
        start: this.getPointAtLength(sliceStart),
        end: this.getPointAtLength(sliceEnd),
        tangent: { ...segment.tangent },
        progressStart: (sliceStart - safeStart) / intervalLength,
        progressEnd: (sliceEnd - safeStart) / intervalLength
      })
    })

    return slices
  }

  findSegment(length: number): Segment | null {
    if (!this.segments.length) {
      return null
    }

    const safeLength = this.clampLength(length)

    return (
      this.segments.find((segment) =>
        safeLength === this.totalLength
          ? segment.endLength === this.totalLength
          : safeLength >= segment.startLength && safeLength < segment.endLength
      ) ?? this.segments[this.segments.length - 1]
    )
  }
}

function normalizePoints(
  points: Array<[number, number]>
): Array<[number, number]> {
  if (!Array.isArray(points)) {
    return []
  }

  const normalized: Array<[number, number]> = []

  points.forEach((point) => {
    if (!Array.isArray(point) || point.length < 2) {
      return
    }

    const x = Number(point[0])
    const y = Number(point[1])

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return
    }

    const previous = normalized[normalized.length - 1]

    if (!previous || previous[0] !== x || previous[1] !== y) {
      normalized.push([x, y])
    }
  })

  return normalized
}

function buildSegments(points: Array<[number, number]>): Segment[] {
  const segments: Segment[] = []
  let accumulated = 0

  for (let index = 0; index < points.length - 1; index += 1) {
    const [startX, startY] = points[index]
    const [endX, endY] = points[index + 1]
    const deltaX = endX - startX
    const deltaY = endY - startY
    const length = Math.abs(deltaX) + Math.abs(deltaY)

    if (!length) {
      continue
    }

    segments.push({
      index: segments.length,
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      length,
      startLength: accumulated,
      endLength: accumulated + length,
      tangent: {
        x: deltaX === 0 ? 0 : deltaX > 0 ? 1 : -1,
        y: deltaY === 0 ? 0 : deltaY > 0 ? 1 : -1
      }
    })

    accumulated += length
  }

  return segments
}
