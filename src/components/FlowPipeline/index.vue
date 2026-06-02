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
  getParticleGradientStops,
  getTrailLayerConfigs
} from '../../utils/flowParticleUtils'
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
  const trailLayers = getTrailLayerConfigs(particleConfig)

  particleGroups.forEach((group) => {
    group.getRenderableParticles().forEach((particle) => {
      particle.slices.forEach((slice) => {
        trailLayers.forEach((layer) => {
          drawMeteorTrail(slice, particleConfig, layer.width, layer.opacity)
        })
      })
    })
  })
}

function drawMeteorTrail(
  slice: Slice,
  particleConfig: ParticleConfig,
  lineWidth: number,
  layerOpacity: number
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
  target.globalAlpha = layerOpacity
  target.lineWidth = lineWidth
  target.shadowColor = particleConfig.glowColor || particleConfig.color || '#ffffff'
  target.shadowBlur =
    layerOpacity >= 1
      ? 0
      : Math.max(0, Number(particleConfig.glowBlur) || 0) / 2
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
