import {
  createDefaultCapConfig,
  createDefaultEndpointConfig,
  createDefaultParticleConfig,
  createDefaultTrackConfig
} from './defaults'
import type {
  CapConfig,
  EndpointConfig,
  NodeConfig,
  ParticleConfig,
  Path,
  TrackConfig,
  Vec2
} from './types'

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

export interface PathNodeRenderItem extends NodeConfig {
  x: number
  y: number
  radius: number
  renderRadius: number
  absoluteLength: number
}

export interface PathItem {
  d: string
  points: Array<[number, number]>
  segments: Segment[]
  totalLength: number
  endpoints: Vec2[]
  nodes: PathNodeRenderItem[]
}

export interface FlowPipelineScene {
  particle: ParticleConfig
  track: TrackConfig
  cap: CapConfig
  endpoint: EndpointConfig
  pathItems: PathItem[]
}

export interface BuildSceneConfig {
  paths?: Path[]
  nodes?: NodeConfig[]
  particle?: ParticleConfig
  track?: TrackConfig
  cap?: CapConfig
  endpoint?: EndpointConfig
  frameTime?: number
}

export function buildFlowPipelineScene({
  paths = [],
  nodes = [],
  particle,
  track,
  cap,
  endpoint,
  frameTime = 0
}: BuildSceneConfig): FlowPipelineScene {
  const mergedCap = {
    ...createDefaultCapConfig(),
    ...cap
  }
  const mergedEndpoint = {
    ...createDefaultEndpointConfig(),
    ...cap,
    ...endpoint
  }

  return {
    particle: {
      ...createDefaultParticleConfig(),
      ...particle
    },
    track: {
      ...createDefaultTrackConfig(),
      ...track
    },
    cap: mergedCap,
    endpoint: mergedEndpoint,
    pathItems: buildPathItems(paths, nodes, frameTime)
  }
}

export function buildPathItems(
  paths: Path[],
  nodes: NodeConfig[],
  frameTime = 0
): PathItem[] {
  const items: PathItem[] = []

  paths.forEach((path, pathIdx) => {
    const points = normalizePathPoints(path.points ?? [])
    const segments = buildSegments({ points })
    const totalLength = getTotalLength(segments)

    if (!points.length || !segments.length || !totalLength) {
      return
    }

    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const endpoints: Vec2[] = [{ x: firstPoint[0], y: firstPoint[1] }]

    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      endpoints.push({ x: lastPoint[0], y: lastPoint[1] })
    }

    items.push({
      d: pathToSvgD(points),
      points,
      segments,
      totalLength,
      endpoints,
      nodes: buildPathNodes(nodes, pathIdx, segments, totalLength, frameTime)
    })
  })

  return items
}

export function buildPathNodes(
  nodes: NodeConfig[],
  pathIdx: number,
  segments: Segment[],
  totalLength: number,
  frameTime = 0
): PathNodeRenderItem[] {
  return (nodes ?? [])
    .filter((node) => node.pathIndex === pathIdx)
    .map((node) => {
      const position = clamp(Number(node.position) || 0, 0, 1)
      const absoluteLength = totalLength * position
      const point = getPointAtLength(segments, absoluteLength)
      const radius = Math.max(1, Number(node.radius) || 4)

      return {
        ...node,
        x: point.x,
        y: point.y,
        radius,
        renderRadius: getNodeRenderRadius(
          radius,
          Boolean(node.pulse),
          frameTime,
          absoluteLength
        ),
        absoluteLength
      }
    })
}

export function getNodeRenderRadius(
  radius: number,
  pulse: boolean,
  frameTime: number,
  absoluteLength: number
): number {
  if (!pulse) {
    return Math.max(1, radius)
  }

  return Math.max(
    1,
    radius * (1 + Math.sin(frameTime / 400 + absoluteLength / 30) * 0.12)
  )
}

export function buildSegments(path: Path): Segment[] {
  const points = normalizePathPoints(path.points ?? [])
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

export function createParticleStates(
  particle: ParticleConfig,
  totalLength: number
): ParticleState[] {
  const count = Math.max(0, Math.floor(Number(particle.count) || 0))
  const spacing = Math.max(
    1,
    Number(particle.spacing) || Number(particle.length) || 1
  )

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

    return {
      ...state,
      tailLength: normalizeLoopLength(tailLength, totalLength),
      slices: createRenderableSlices(segments, tailLength, state.headLength, length)
    }
  })
}

export function pathToSvgD(points: Array<[number, number]>): string {
  return points
    .map(([x, y], index) => (index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
    .join(' ')
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

function findSegment(
  segments: Segment[],
  length: number,
  totalLength: number
): Segment | null {
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

function clampLength(length: number, totalLength: number): number {
  if (!totalLength) {
    return 0
  }

  return clamp(Number(length) || 0, 0, totalLength)
}

export function normalizePathPoints(
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
