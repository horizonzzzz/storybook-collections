import type { ParticleConfig, Path, Vec2 } from './types'

export interface Segment {
  index: number
  start: Vec2
  end: Vec2
  length: number
  startLength: number
  endLength: number
  tangent: Vec2
}

export interface ParticleSlice {
  segmentIndex: number
  startLength: number
  endLength: number
  start: Vec2
  end: Vec2
  tangent: Vec2
  progressStart: number
  progressEnd: number
}

export interface ParticleState {
  id: number
  headLength: number
}

export interface RenderableParticle extends ParticleState {
  tailLength: number
  slices: ParticleSlice[]
}

function normalizePoints(points: Array<[number, number]>): Array<[number, number]> {
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

export function buildSegments(path: Path): Segment[] {
  const points = normalizePoints(path.points ?? [])
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

export function getTotalLength(segments: Segment[]): number {
  return segments.length ? segments[segments.length - 1].endLength : 0
}

export function normalizeLoopLength(length: number, totalLength: number): number {
  if (!totalLength) {
    return 0
  }

  const normalized = (Number(length) || 0) % totalLength
  return normalized < 0 ? normalized + totalLength : normalized
}

function clampLength(length: number, totalLength: number): number {
  if (!totalLength) {
    return 0
  }

  return Math.min(Math.max(Number(length) || 0, 0), totalLength)
}

function findSegment(segments: Segment[], length: number, totalLength: number): Segment | null {
  if (!segments.length) {
    return null
  }

  const safeLength = clampLength(length, totalLength)

  return (
    segments.find((segment) =>
      safeLength === totalLength
        ? segment.endLength === totalLength
        : safeLength >= segment.startLength && safeLength < segment.endLength
    ) ?? segments[segments.length - 1]
  )
}

export function getPointAtLength(segments: Segment[], length: number): Vec2 {
  const totalLength = getTotalLength(segments)
  const safeLength = clampLength(length, totalLength)
  const segment = findSegment(segments, safeLength, totalLength)

  if (!segment) {
    const fallback = segments[segments.length - 1]?.end ?? { x: 0, y: 0 }
    return { ...fallback }
  }

  const localLength = safeLength - segment.startLength
  return {
    x: segment.start.x + segment.tangent.x * localLength,
    y: segment.start.y + segment.tangent.y * localLength
  }
}

function getSlices(
  segments: Segment[],
  startLength: number,
  endLength: number,
  totalLength: number
): ParticleSlice[] {
  const safeStart = clampLength(startLength, totalLength)
  const safeEnd = clampLength(endLength, totalLength)

  if (safeEnd <= safeStart) {
    return []
  }

  const intervalLength = safeEnd - safeStart
  const slices: ParticleSlice[] = []

  segments.forEach((segment) => {
    const sliceStart = Math.max(safeStart, segment.startLength)
    const sliceEnd = Math.min(safeEnd, segment.endLength)

    if (sliceEnd <= sliceStart) {
      return
    }

    slices.push({
      segmentIndex: segment.index,
      startLength: sliceStart,
      endLength: sliceEnd,
      start: getPointAtLength(segments, sliceStart),
      end: getPointAtLength(segments, sliceEnd),
      tangent: { ...segment.tangent },
      progressStart: (sliceStart - safeStart) / intervalLength,
      progressEnd: (sliceEnd - safeStart) / intervalLength
    })
  })

  return slices
}

export function createParticleStates(
  particle: ParticleConfig,
  totalLength: number
): ParticleState[] {
  const count = Math.max(0, Math.floor(Number(particle.count) || 0))
  const spacing = Math.max(1, Number(particle.spacing) || Number(particle.length) || 1)

  if (!count || !totalLength) {
    return []
  }

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    headLength: normalizeLoopLength(-index * spacing, totalLength)
  }))
}

export function advanceParticleStates(
  states: ParticleState[],
  deltaSeconds: number,
  speed: number,
  totalLength: number
): ParticleState[] {
  const delta = Math.max(0, Number(deltaSeconds) || 0)

  return states.map((particle) => ({
    ...particle,
    headLength: normalizeLoopLength(
      particle.headLength + speed * delta,
      totalLength
    )
  }))
}

export function createRenderableParticles(
  segments: Segment[],
  states: ParticleState[],
  particle: ParticleConfig
): RenderableParticle[] {
  const totalLength = getTotalLength(segments)
  const length = Math.max(1, Number(particle.length) || 1)

  return states.map((state) => {
    const tailLength = state.headLength - length
    const normalizedTail = normalizeLoopLength(tailLength, totalLength)

    return {
      ...state,
      tailLength: normalizedTail,
      slices: createRenderableSlices(segments, tailLength, state.headLength, length)
    }
  })
}

function createRenderableSlices(
  segments: Segment[],
  rawTailLength: number,
  headLength: number,
  particleLength: number
): ParticleSlice[] {
  const totalLength = getTotalLength(segments)

  if (rawTailLength >= 0) {
    return getSlices(segments, rawTailLength, headLength, totalLength)
  }

  const firstSlices = getSlices(
    segments,
    totalLength + rawTailLength,
    totalLength,
    totalLength
  )
  const secondSlices = getSlices(segments, 0, headLength, totalLength)
  const slices = [...firstSlices, ...secondSlices]
  let cursor = 0

  return slices.map((slice) => {
    const sliceLength = slice.endLength - slice.startLength
    const progressStart = cursor / particleLength
    const progressEnd = (cursor + sliceLength) / particleLength
    cursor += sliceLength

    return {
      ...slice,
      progressStart,
      progressEnd
    }
  })
}
