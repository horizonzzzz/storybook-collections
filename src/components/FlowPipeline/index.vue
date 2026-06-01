<template>
  <div
    class="flow-pipeline"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <canvas
      ref="canvasRef"
      role="img"
      :width="width"
      :height="height"
      :aria-label="ariaLabel"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import ParticleGroup from './Particle'
import PathGeometry from './PathGeometry'
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
  NodeRenderItem,
  Path,
  ParticleConfig,
  Slice,
  TrackConfig
} from './types'

defineOptions({ name: 'FlowPipeline' })

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

const props = withDefaults(
  defineProps<{
    width: number
    height: number
    paths?: Path[]
    particle?: ParticleConfig
    nodes?: NodeConfig[]
    track?: TrackConfig
    cap?: CapConfig
    endpoint?: EndpointConfig
    ariaLabel?: string
  }>(),
  {
    paths: () => [],
    nodes: () => [],
    particle: () => createDefaultParticleConfig(),
    track: () => createDefaultTrackConfig(),
    cap: () => createDefaultCapConfig(),
    endpoint: () => createDefaultEndpointConfig(),
    ariaLabel: 'Flow pipeline animation'
  }
)

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

let ctx: CanvasRenderingContext2D | null = null
let bufferCanvas: HTMLCanvasElement | null = null
let bufferCtx: CanvasRenderingContext2D | null = null
let animationFrameId = 0
let lastFrameTime = 0
let dpr = 1
let geometryList: PathGeometry[] = []
let particleGroups: ParticleGroup[] = []
let nodeRenderList: NodeRenderItem[] = []

function handleConfigChange() {
  stopAnimation()
  setupCanvas()
  buildScene()
  startAnimation()
}

function setupCanvas() {
  const canvas = canvasRef.value

  if (!canvas) {
    return
  }

  dpr = window.devicePixelRatio || 1
  ctx = canvas.getContext('2d')
  canvas.width = props.width * dpr
  canvas.height = props.height * dpr
  canvas.style.width = `${props.width}px`
  canvas.style.height = `${props.height}px`
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)

  bufferCanvas = document.createElement('canvas')
  bufferCanvas.width = canvas.width
  bufferCanvas.height = canvas.height
  bufferCtx = bufferCanvas.getContext('2d')
  bufferCtx?.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function buildScene() {
  geometryList = props.paths
    .map((path) => new PathGeometry(path))
    .filter((geometry) => geometry.getTotalLength() > 0)

  particleGroups = geometryList.map(
    (geometry) =>
      new ParticleGroup({
        geometry,
        ...createDefaultParticleConfig(),
        ...props.particle
      })
  )

  nodeRenderList = props.nodes
    .map((node) => buildNode(node))
    .filter((node): node is NodeRenderItem => node !== null)

  renderTrackToBuffer()
  lastFrameTime = 0
}

function buildNode(node: NodeConfig): NodeRenderItem | null {
  const geometry = geometryList[node.pathIndex]

  if (!geometry) {
    return null
  }

  const position = clamp(Number(node.position) || 0, 0, 1)
  const absoluteLength = geometry.getTotalLength() * position

  return {
    ...node,
    radius: Math.max(1, Number(node.radius) || 4),
    absoluteLength,
    point: geometry.getPointAtLength(absoluteLength)
  }
}

function renderTrackToBuffer() {
  if (!bufferCtx) {
    return
  }

  bufferCtx.clearRect(0, 0, props.width, props.height)
  geometryList.forEach((geometry) => {
    drawTrackPath(bufferCtx as CanvasRenderingContext2D, geometry)
    drawTrackCaps(bufferCtx as CanvasRenderingContext2D, geometry)
  })
}

function startAnimation() {
  animationFrameId = requestAnimationFrame(tick)
}

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }
}

function tick(timestamp: number) {
  const deltaSeconds = lastFrameTime
    ? (timestamp - lastFrameTime) / 1000
    : 0

  lastFrameTime = timestamp
  update(deltaSeconds)
  draw()
  animationFrameId = requestAnimationFrame(tick)
}

function update(deltaSeconds: number) {
  particleGroups.forEach((group) => group.update(deltaSeconds))
}

function draw() {
  if (!ctx) {
    return
  }

  ctx.clearRect(0, 0, props.width, props.height)
  drawTrack()
  drawNodes()
  drawParticles()
}

function drawTrack() {
  if (!ctx || !bufferCanvas) {
    return
  }

  ctx.drawImage(bufferCanvas, 0, 0, props.width, props.height)
}

function drawTrackPath(
  targetCtx: CanvasRenderingContext2D,
  geometry: PathGeometry
) {
  const trackConfig = { ...createDefaultTrackConfig(), ...props.track }

  targetCtx.save()
  targetCtx.lineCap = 'round'
  targetCtx.lineJoin = 'round'

  drawLineGlow(targetCtx, geometry, trackConfig)
  targetCtx.restore()
}

function drawLineGlow(
  targetCtx: CanvasRenderingContext2D,
  geometry: PathGeometry,
  trackConfig: TrackConfig
) {
  const layers = [
    {
      width: trackConfig.outerGlowWidth,
      color: trackConfig.outerGlowColor,
      blur: 0
    },
    {
      width: trackConfig.glowWidth,
      color: trackConfig.glowColor,
      blur: 5
    },
    {
      width: trackConfig.width,
      color: trackConfig.color,
      blur: 0
    },
    {
      width: trackConfig.coreWidth,
      color: trackConfig.coreColor,
      blur: 0
    }
  ]

  layers.forEach((layer) => {
    if (!layer.width || layer.width <= 0) {
      return
    }

    targetCtx.save()
    targetCtx.strokeStyle = layer.color ?? 'transparent'
    targetCtx.lineWidth = layer.width
    targetCtx.shadowColor = layer.color ?? 'transparent'
    targetCtx.shadowBlur = layer.blur
    strokeGeometry(targetCtx, geometry)
    targetCtx.restore()
  })
}

function strokeGeometry(
  targetCtx: CanvasRenderingContext2D,
  geometry: PathGeometry
) {
  if (!geometry.points.length) {
    return
  }

  targetCtx.beginPath()
  geometry.points.forEach((point, index) => {
    if (index === 0) {
      targetCtx.moveTo(point[0], point[1])
    } else {
      targetCtx.lineTo(point[0], point[1])
    }
  })
  targetCtx.stroke()
}

function drawTrackCaps(
  targetCtx: CanvasRenderingContext2D,
  geometry: PathGeometry
) {
  const endpointConfig = {
    ...createDefaultEndpointConfig(),
    ...props.cap,
    ...props.endpoint
  }
  const capConfig = { ...createDefaultCapConfig(), ...endpointConfig }

  if (
    !endpointConfig.show ||
    !capConfig.drawPathEnds ||
    !geometry.points.length
  ) {
    return
  }

  const firstPoint = geometry.points[0]
  const lastPoint = geometry.points[geometry.points.length - 1]
  drawTrackCap(
    targetCtx,
    { x: firstPoint[0], y: firstPoint[1] },
    endpointConfig
  )

  if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
    drawTrackCap(
      targetCtx,
      { x: lastPoint[0], y: lastPoint[1] },
      endpointConfig
    )
  }
}

function drawTrackCap(
  targetCtx: CanvasRenderingContext2D,
  point: { x: number; y: number },
  capConfig: EndpointConfig
) {
  const radius = Math.max(1, Number(capConfig.radius) || 3)
  const ringRadius = Math.max(radius, Number(capConfig.ringRadius) || 0)

  targetCtx.save()
  targetCtx.fillStyle = capConfig.activeColor || capConfig.color || '#ffffff'
  targetCtx.shadowColor = capConfig.glowColor ?? 'transparent'
  targetCtx.shadowBlur = Math.max(0, Number(capConfig.glowBlur) || 0)
  targetCtx.beginPath()
  targetCtx.arc(point.x, point.y, radius, 0, Math.PI * 2)
  targetCtx.fill()

  if (ringRadius > radius) {
    targetCtx.shadowBlur = 0
    targetCtx.strokeStyle = capConfig.ringColor ?? 'transparent'
    targetCtx.lineWidth = 1
    targetCtx.beginPath()
    targetCtx.arc(point.x, point.y, ringRadius, 0, Math.PI * 2)
    targetCtx.stroke()
  }
  targetCtx.restore()
}

function drawNodes() {
  if (!ctx) {
    return
  }

  const now = performance.now()

  nodeRenderList.forEach((node) => {
    const pulseScale = node.pulse
      ? 1 + Math.sin(now / 400 + node.absoluteLength / 30) * 0.12
      : 1
    const radius = Math.max(1, node.radius * pulseScale)
    const color = node.color || '#6fffe9'
    const glowColor = node.glowColor || '#00d8ff'
    const glowBlur = Math.max(0, Number(node.glowBlur) || 12)
    const target = ctx as CanvasRenderingContext2D

    target.save()
    target.fillStyle = color
    target.shadowColor = glowColor
    target.shadowBlur = glowBlur
    target.beginPath()
    target.arc(node.point.x, node.point.y, radius, 0, Math.PI * 2)
    target.fill()
    target.restore()
  })
}

function drawParticles() {
  if (!ctx) {
    return
  }

  const particleConfig = { ...createDefaultParticleConfig(), ...props.particle }

  particleGroups.forEach((group) => {
    group.getRenderableParticles().forEach((particle) => {
      particle.slices.forEach((slice) => {
        drawMeteorTrail(slice, particleConfig)
      })
    })
  })
}

function drawMeteorTrail(
  slice: Slice,
  particleConfig: ParticleConfig
) {
  if (!ctx) {
    return
  }
  const gradient = createTrailGradient(ctx, slice, particleConfig)
  const target = ctx as CanvasRenderingContext2D

  target.save()
  target.lineCap = 'round'
  target.lineJoin = 'round'
  target.strokeStyle = gradient
  target.lineWidth = Number(particleConfig.width) || 1
  target.shadowColor = particleConfig.glowColor || particleConfig.color || '#ffffff'
  target.shadowBlur = Math.max(0, Number(particleConfig.glowBlur) || 0)
  target.beginPath()
  target.moveTo(slice.start.x, slice.start.y)
  target.lineTo(slice.end.x, slice.end.y)
  target.stroke()
  target.restore()
}

function createTrailGradient(
  targetCtx: CanvasRenderingContext2D,
  slice: Slice,
  particleConfig: ParticleConfig
) {
  const gradient = targetCtx.createLinearGradient(
    slice.start.x,
    slice.start.y,
    slice.end.x,
    slice.end.y
  )
  const stops = getParticleGradientStops(slice, particleConfig)

  stops.forEach((stop) => {
    gradient.addColorStop(
      stop.offset,
      getParticleColor(stop.color, stop.alpha, stop.brightness)
    )
  })

  return gradient
}

interface GradientStop {
  offset: number
  color: string
  alpha: number
  brightness: number
}

interface GradientEdgeStop extends GradientStop {
  progress?: number
}

function getParticleGradientStops(
  slice: Pick<Slice, 'progressStart' | 'progressEnd'>,
  particleConfig: ParticleConfig
): GradientStop[] {
  const opacity = clamp(Number(particleConfig.opacity) || 0, 0, 1)
  const gradientColors = getGradientColors(particleConfig)
  const globalStops: GradientEdgeStop[] = [
    { progress: 0, offset: 0, color: gradientColors[0], alpha: 0, brightness: 0.7 },
    {
      progress: 0.32,
      offset: 0.32,
      color: gradientColors[0],
      alpha: opacity * 0.2,
      brightness: 0.85
    },
    {
      progress: 0.68,
      offset: 0.68,
      color: gradientColors[1],
      alpha: opacity * 0.72,
      brightness: 1
    },
    {
      progress: 1,
      offset: 1,
      color: gradientColors[2],
      alpha: opacity,
      brightness: 1
    }
  ]

  const sliceStart = clamp(Number(slice.progressStart) || 0, 0, 1)
  const sliceEnd = clamp(Number(slice.progressEnd) || 0, 0, 1)
  const sliceSpan = Math.max(sliceEnd - sliceStart, 0.0001)
  const projectedStops: GradientStop[] = globalStops
    .filter((stop) => stop.progress! >= sliceStart && stop.progress! <= sliceEnd)
    .map((stop) => ({
      offset: (stop.progress! - sliceStart) / sliceSpan,
      color: stop.color,
      alpha: stop.alpha,
      brightness: stop.brightness
    }))

  const startStop = resolveGradientEdgeStop(globalStops, sliceStart, 0)
  const endStop = resolveGradientEdgeStop(globalStops, sliceEnd, 1)

  return [startStop, ...projectedStops, endStop].filter(
    (stop, index, array) =>
      index === 0 ||
      stop.offset !== array[index - 1].offset ||
      stop.color !== array[index - 1].color ||
      stop.alpha !== array[index - 1].alpha ||
      stop.brightness !== array[index - 1].brightness
  )
}

function resolveGradientEdgeStop(
  globalStops: GradientEdgeStop[],
  progress: number,
  offset: number
): GradientStop {
  const safeProgress = clamp(Number(progress) || 0, 0, 1)

  for (let index = 0; index < globalStops.length - 1; index += 1) {
    const current = globalStops[index]
    const next = globalStops[index + 1]

    if (
      safeProgress >= current.progress! &&
      safeProgress <= next.progress!
    ) {
      const range = Math.max(next.progress! - current.progress!, 0.0001)
      const ratio = (safeProgress - current.progress!) / range

      return {
        offset,
        color: mixHexColors(current.color, next.color, ratio),
        alpha: current.alpha + (next.alpha - current.alpha) * ratio,
        brightness:
          current.brightness +
          (next.brightness - current.brightness) * ratio
      }
    }
  }

  const fallback = globalStops[globalStops.length - 1]
  return {
    offset,
    color: fallback.color,
    alpha: fallback.alpha,
    brightness: fallback.brightness
  }
}

function getGradientColors(particleConfig: ParticleConfig): string[] {
  const colors = Array.isArray(particleConfig.gradientColors)
    ? particleConfig.gradientColors.filter(Boolean)
    : []
  const fallback = particleConfig.color || '#36f6ff'

  if (!colors.length) {
    return [fallback, fallback, '#ffffff']
  }

  if (colors.length === 1) {
    return [colors[0], colors[0], colors[0]]
  }

  if (colors.length === 2) {
    return [colors[0], colors[0], colors[1]]
  }

  return [
    colors[0],
    colors[Math.floor(colors.length / 2)],
    colors[colors.length - 1]
  ]
}

function mixHexColors(startColor: string, endColor: string, ratio: number) {
  const start = hexToRgb(startColor)
  const end = hexToRgb(endColor)
  const progress = clamp(Number(ratio) || 0, 0, 1)
  const red = Math.round(start.red + (end.red - start.red) * progress)
  const green = Math.round(start.green + (end.green - start.green) * progress)
  const blue = Math.round(start.blue + (end.blue - start.blue) * progress)

  return rgbToHex(red, green, blue)
}

function getParticleColor(hexColor: string, opacity: number, progress: number) {
  const alpha = clamp(Number(opacity) || 0, 0, 1)
  const brightness = clamp(Number(progress) || 0, 0, 1)

  return hexToRgba(hexColor, alpha * brightness)
}

function hexToRgb(hexColor: string) {
  const normalizedHex = String(hexColor || '#36f6ff').replace('#', '')
  const hex =
    normalizedHex.length === 3
      ? normalizedHex
          .split('')
          .map((char) => char + char)
          .join('')
      : normalizedHex

  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)

  return {
    red: Number.isFinite(red) ? red : 54,
    green: Number.isFinite(green) ? green : 246,
    blue: Number.isFinite(blue) ? blue : 255
  }
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

function hexToRgba(hexColor: string, alpha: number) {
  const { red, green, blue } = hexToRgb(hexColor)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

onMounted(() => {
  setupCanvas()
  buildScene()
  startAnimation()
})

onBeforeUnmount(() => {
  stopAnimation()
})

watch(
  () => [
    props.width,
    props.height,
    props.paths,
    props.particle,
    props.nodes,
    props.track,
    props.cap,
    props.endpoint
  ],
  () => {
    handleConfigChange()
  },
  { deep: true }
)
</script>

<style scoped>
.flow-pipeline {
  position: relative;
  overflow: hidden;
}

canvas {
  display: block;
}
</style>
