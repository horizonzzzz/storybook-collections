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
import { gsap } from 'gsap'
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import {
  getParticleGradientStops,
  getTrailLayerConfigs
} from '../../utils/flowParticleUtils'
import {
  createDefaultCapConfig,
  createDefaultEndpointConfig,
  createDefaultParticleConfig,
  createDefaultTrackConfig
} from '../FlowPipelineCore/defaults'
import {
  advanceParticleStates,
  buildFlowPipelineScene,
  createParticleStates,
  createRenderableParticles,
  getNodeRenderRadius,
  type FlowPipelineScene,
  type ParticleSlice,
  type ParticleState,
  type PathItem
} from '../FlowPipelineCore/flowPipelineModel'
import type {
  CapConfig,
  EndpointConfig,
  NodeConfig,
  Path,
  ParticleConfig,
  TrackConfig
} from '../FlowPipelineCore/types'

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
let tickerActive = false
let frameTime = 0
let dpr = 1
let scene: FlowPipelineScene = buildFlowPipelineScene({})
let particleStates: ParticleState[][] = []

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
  scene = buildFlowPipelineScene({
    paths: props.paths,
    nodes: props.nodes,
    particle: props.particle,
    track: props.track,
    cap: props.cap,
    endpoint: props.endpoint,
    frameTime
  })

  particleStates = scene.pathItems.map((item) =>
    createParticleStates(scene.particle, item.totalLength)
  )

  renderTrackToBuffer()
}

function renderTrackToBuffer() {
  if (!bufferCtx) {
    return
  }

  bufferCtx.clearRect(0, 0, props.width, props.height)
  scene.pathItems.forEach((item) => {
    drawTrackPath(bufferCtx as CanvasRenderingContext2D, item)
    drawTrackCaps(bufferCtx as CanvasRenderingContext2D, item)
  })
}

function startAnimation() {
  if (!tickerActive) {
    gsap.ticker.add(tick)
    tickerActive = true
  }
}

function stopAnimation() {
  if (tickerActive) {
    gsap.ticker.remove(tick)
    tickerActive = false
  }
}

function tick(time: number, deltaTime: number) {
  const deltaSeconds = Math.max(0, (Number(deltaTime) || 0) / 1000)
  frameTime = time * 1000
  update(deltaSeconds)
  draw()
}

function update(deltaSeconds: number) {
  particleStates = scene.pathItems.map((item, pathIdx) =>
    advanceParticleStates(
      particleStates[pathIdx] ?? [],
      deltaSeconds,
      scene.particle.speed ?? 120,
      item.totalLength
    )
  )
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
  item: PathItem
) {
  targetCtx.save()
  targetCtx.lineCap = 'round'
  targetCtx.lineJoin = 'round'

  drawLineGlow(targetCtx, item)
  targetCtx.restore()
}

function drawLineGlow(
  targetCtx: CanvasRenderingContext2D,
  item: PathItem
) {
  const layers = [
    {
      width: scene.track.outerGlowWidth,
      color: scene.track.outerGlowColor,
      blur: 0
    },
    {
      width: scene.track.glowWidth,
      color: scene.track.glowColor,
      blur: 5
    },
    {
      width: scene.track.width,
      color: scene.track.color,
      blur: 0
    },
    {
      width: scene.track.coreWidth,
      color: scene.track.coreColor,
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
    strokePathItem(targetCtx, item)
    targetCtx.restore()
  })
}

function strokePathItem(
  targetCtx: CanvasRenderingContext2D,
  item: PathItem
) {
  if (!item.points.length) {
    return
  }

  targetCtx.beginPath()
  item.points.forEach((point, index) => {
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
  item: PathItem
) {
  if (
    !scene.endpoint.show ||
    !scene.cap.drawPathEnds ||
    !item.endpoints.length
  ) {
    return
  }

  item.endpoints.forEach((point) => drawTrackCap(targetCtx, point))
}

function drawTrackCap(
  targetCtx: CanvasRenderingContext2D,
  point: { x: number; y: number }
) {
  const radius = Math.max(1, Number(scene.endpoint.radius) || 3)
  const ringRadius = Math.max(radius, Number(scene.endpoint.ringRadius) || 0)

  targetCtx.save()
  targetCtx.fillStyle =
    scene.endpoint.activeColor || scene.endpoint.color || '#ffffff'
  targetCtx.shadowColor = scene.endpoint.glowColor ?? 'transparent'
  targetCtx.shadowBlur = Math.max(0, Number(scene.endpoint.glowBlur) || 0)
  targetCtx.beginPath()
  targetCtx.arc(point.x, point.y, radius, 0, Math.PI * 2)
  targetCtx.fill()

  if (ringRadius > radius) {
    targetCtx.shadowBlur = 0
    targetCtx.strokeStyle = scene.endpoint.ringColor ?? 'transparent'
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

  scene.pathItems.forEach((item) => {
    item.nodes.forEach((node) => {
      const radius = getNodeRenderRadius(
        node.radius,
        Boolean(node.pulse),
        frameTime,
        node.absoluteLength
      )
      const color = node.color || '#6fffe9'
      const glowColor = node.glowColor || '#00d8ff'
      const glowBlur = Math.max(0, Number(node.glowBlur) || 12)
      const target = ctx as CanvasRenderingContext2D

      target.save()
      target.fillStyle = color
      target.shadowColor = glowColor
      target.shadowBlur = glowBlur
      target.beginPath()
      target.arc(node.x, node.y, radius, 0, Math.PI * 2)
      target.fill()
      target.restore()
    })
  })
}

function drawParticles() {
  if (!ctx) {
    return
  }

  const trailLayers = getTrailLayerConfigs(scene.particle)

  scene.pathItems.forEach((item, pathIdx) => {
    createRenderableParticles(
      item.segments,
      particleStates[pathIdx] ?? [],
      scene.particle
    ).forEach((particle) => {
      particle.slices.forEach((slice) => {
        trailLayers.forEach((layer) => {
          drawMeteorTrail(slice, scene.particle, layer.width, layer.opacity)
        })
      })
    })
  })
}

function drawMeteorTrail(
  slice: ParticleSlice,
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
  slice: ParticleSlice,
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
