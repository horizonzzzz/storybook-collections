<template>
  <div
    class="flow-pipeline-svg"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="ariaLabel"
    >
      <defs>
        <filter
          v-if="mergedTrack.glowWidth! > 0"
          :id="filterIds.trackGlow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur :stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter
          :id="filterIds.endpointGlow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >
          <feGaussianBlur
            :stdDeviation="Math.max(0, mergedEndpoint.glowBlur! / 2)"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter
          :id="filterIds.particleGlow"
          x="-60%"
          y="-60%"
          width="220%"
          height="220%"
        >
          <feGaussianBlur
            :stdDeviation="Math.max(0, mergedParticle.glowBlur! / 3)"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <template v-for="(item, pathIdx) in pathItems" :key="`defs-${pathIdx}`">
          <filter
            v-for="(node, nodeIdx) in item.nodes"
            :key="`node-filter-${pathIdx}-${nodeIdx}`"
            :id="nodeFilterId(pathIdx, nodeIdx)"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur
              :stdDeviation="Math.max(0, (node.glowBlur ?? 12) / 2)"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </template>

        <template
          v-for="gradient in particleGradients"
          :key="gradient.id"
        >
          <linearGradient
            :id="gradient.id"
            gradientUnits="userSpaceOnUse"
            :x1="gradient.x1"
            :y1="gradient.y1"
            :x2="gradient.x2"
            :y2="gradient.y2"
          >
            <stop
              v-for="(stop, stopIdx) in gradient.stops"
              :key="`${gradient.id}-${stopIdx}`"
              :offset="stop.offset"
              :stop-color="stop.color"
              :stop-opacity="stop.alpha * stop.brightness"
            />
          </linearGradient>
        </template>
      </defs>

      <template v-for="(item, idx) in pathItems" :key="`track-${idx}`">
        <path
          v-if="mergedTrack.outerGlowWidth! > 0"
          :d="item.d"
          fill="none"
          :stroke="mergedTrack.outerGlowColor"
          :stroke-width="mergedTrack.outerGlowWidth"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          v-if="mergedTrack.glowWidth! > 0"
          :d="item.d"
          fill="none"
          :stroke="mergedTrack.glowColor"
          :stroke-width="mergedTrack.glowWidth"
          stroke-linecap="round"
          stroke-linejoin="round"
          :filter="`url(#${filterIds.trackGlow})`"
        />
        <path
          v-if="mergedTrack.width! > 0"
          :d="item.d"
          fill="none"
          :stroke="mergedTrack.color"
          :stroke-width="mergedTrack.width"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          v-if="mergedTrack.coreWidth! > 0"
          :d="item.d"
          fill="none"
          :stroke="mergedTrack.coreColor"
          :stroke-width="mergedTrack.coreWidth"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </template>

      <template v-for="(item, idx) in pathItems" :key="`cap-${idx}`">
        <template v-if="mergedEndpoint.show && mergedCap.drawPathEnds">
          <circle
            :cx="item.endpoints[0].x"
            :cy="item.endpoints[0].y"
            :r="mergedCap.radius"
            :fill="mergedEndpoint.activeColor"
            :filter="`url(#${filterIds.endpointGlow})`"
          />
          <circle
            v-if="mergedEndpoint.ringRadius! > mergedCap.radius!"
            :cx="item.endpoints[0].x"
            :cy="item.endpoints[0].y"
            :r="mergedEndpoint.ringRadius"
            fill="none"
            :stroke="mergedEndpoint.ringColor"
            stroke-width="1"
          />
          <template v-if="item.endpoints.length > 1">
            <circle
              :cx="item.endpoints[1].x"
              :cy="item.endpoints[1].y"
              :r="mergedCap.radius"
              :fill="mergedEndpoint.activeColor"
              :filter="`url(#${filterIds.endpointGlow})`"
            />
            <circle
              v-if="mergedEndpoint.ringRadius! > mergedCap.radius!"
              :cx="item.endpoints[1].x"
              :cy="item.endpoints[1].y"
              :r="mergedEndpoint.ringRadius"
              fill="none"
              :stroke="mergedEndpoint.ringColor"
              stroke-width="1"
            />
          </template>
        </template>
      </template>

      <template v-for="(item, pathIdx) in pathItems" :key="`nodes-${pathIdx}`">
        <circle
          v-for="(node, nodeIdx) in item.nodes"
          :key="`node-${pathIdx}-${nodeIdx}`"
          :cx="node.x"
          :cy="node.y"
          :r="node.renderRadius"
          :fill="node.color ?? '#6fffe9'"
          :filter="`url(#${nodeFilterId(pathIdx, nodeIdx)})`"
        />
      </template>

      <template
        v-for="layer in particleRenderLayers"
        :key="layer.key"
      >
        <path
          v-for="slice in layer.slices"
          :key="slice.key"
          :d="slice.d"
          fill="none"
          :stroke="`url(#${slice.gradientId})`"
          :stroke-width="layer.width"
          :opacity="layer.opacity"
          stroke-linecap="round"
          stroke-linejoin="round"
          :filter="layer.filter"
        />
      </template>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CapConfig, EndpointConfig, NodeConfig, ParticleConfig, Path, TrackConfig } from './types'
import { pathToSvgD } from './utils'
import {
  getParticleGradientStops,
  getTrailLayerConfigs,
  type GradientStop
} from '../../utils/flowParticleUtils'
import {
  advanceParticleStates,
  buildSegments,
  createParticleStates,
  createRenderableParticles,
  getPointAtLength,
  getTotalLength,
  type ParticleState,
  type RenderableParticle,
  type Segment
} from './particleMath'
import {
  createDefaultCapConfig,
  createDefaultEndpointConfig,
  createDefaultParticleConfig,
  createDefaultTrackConfig
} from '../FlowPipeline/defaults'

defineOptions({ name: 'FlowPipelineSvg' })

let uidCounter = 0
const uid = `fpsvg-${++uidCounter}`
const frameNow = ref(0)
const particleStates = ref<ParticleState[][]>([])
let animationFrameId = 0
let lastFrameTime = 0

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

const mergedParticle = computed(() => ({
  ...createDefaultParticleConfig(),
  ...props.particle
}))
const mergedTrack = computed(() => ({
  ...createDefaultTrackConfig(),
  ...props.track
}))
const mergedCap = computed(() => ({
  ...createDefaultCapConfig(),
  ...props.cap
}))
const mergedEndpoint = computed(() => ({
  ...createDefaultEndpointConfig(),
  ...props.cap,
  ...props.endpoint
}))

const filterIds = {
  trackGlow: `${uid}-trk-glow`,
  endpointGlow: `${uid}-ep-glow`,
  particleGlow: `${uid}-ptc-glow`
}

function nodeFilterId(pathIdx: number, nodeIdx: number) {
  return `${uid}-node-${pathIdx}-${nodeIdx}`
}

interface PathItem {
  d: string
  segments: Segment[]
  totalLength: number
  endpoints: Array<{ x: number; y: number }>
  nodes: Array<{
    x: number
    y: number
    radius: number
    renderRadius: number
    absoluteLength: number
    color?: string
    glowColor?: string
    glowBlur?: number
    pulse?: boolean
  }>
}

const pathItems = computed(() => {
  const items: PathItem[] = []

  props.paths.forEach((path, pathIdx) => {
    const d = pathToSvgD(path)
    const segments = buildSegments(path)
    const totalLength = getTotalLength(segments)

    if (!d || !segments.length || !totalLength) {
      return
    }

    const firstPoint = path.points[0]
    const lastPoint = path.points[path.points.length - 1]
    const endpoints = [{ x: firstPoint[0], y: firstPoint[1] }]

    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      endpoints.push({ x: lastPoint[0], y: lastPoint[1] })
    }

    const nodes: PathItem['nodes'] = (props.nodes ?? [])
      .filter((node) => node.pathIndex === pathIdx)
      .map((node) => {
        const position = Math.min(Math.max(Number(node.position) || 0, 0), 1)
        const absoluteLength = totalLength * position
        const point = getPointAtLength(segments, absoluteLength)
        const phase = node.pulse
          ? Math.sin(frameNow.value / 400 + absoluteLength / 30) * 0.12
          : 0

        return {
          x: point.x,
          y: point.y,
          radius: Math.max(1, Number(node.radius) || 4),
          renderRadius: Math.max(1, (Number(node.radius) || 4) * (1 + phase)),
          absoluteLength,
          color: node.color,
          glowColor: node.glowColor,
          glowBlur: node.glowBlur,
          pulse: node.pulse
        }
      })

    items.push({
      d,
      segments,
      totalLength,
      endpoints,
      nodes
    })
  })

  return items
})

const renderableParticles = computed<RenderableParticle[][]>(() =>
  pathItems.value.map((item, pathIdx) =>
    createRenderableParticles(
      item.segments,
      particleStates.value[pathIdx] ?? [],
      mergedParticle.value
    )
  )
)

const particleGradients = computed(() => {
  const gradients: Array<{
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    stops: GradientStop[]
  }> = []

  renderableParticles.value.forEach((particles, pathIdx) => {
    particles.forEach((particle) => {
      particle.slices.forEach((slice, sliceIdx) => {
        gradients.push({
          id: `${uid}-grad-${pathIdx}-${particle.id}-${sliceIdx}`,
          x1: slice.start.x,
          y1: slice.start.y,
          x2: slice.end.x,
          y2: slice.end.y,
          stops: getParticleGradientStops(slice, mergedParticle.value)
        })
      })
    })
  })

  return gradients
})

const particleRenderLayers = computed(() => {
  const layers = getTrailLayerConfigs(
    mergedParticle.value,
    `url(#${filterIds.particleGlow})`
  ).map((layer) => ({
    ...layer,
    slices: [] as Array<{ key: string; d: string; gradientId: string }>
  }))

  renderableParticles.value.forEach((particles, pathIdx) => {
    particles.forEach((particle) => {
      particle.slices.forEach((slice, sliceIdx) => {
        const d = `M ${slice.start.x} ${slice.start.y} L ${slice.end.x} ${slice.end.y}`
        const gradientId = `${uid}-grad-${pathIdx}-${particle.id}-${sliceIdx}`
        const key = `${pathIdx}-${particle.id}-${sliceIdx}`

        layers.forEach((layer) => {
          layer.slices.push({
            key: `${layer.key}-${key}`,
            d,
            gradientId
          })
        })
      })
    })
  })

  return layers
})

function rebuildParticleStates() {
  particleStates.value = pathItems.value.map((item) =>
    createParticleStates(mergedParticle.value, item.totalLength)
  )
  lastFrameTime = 0
}

function tick(timestamp: number) {
  const deltaSeconds = lastFrameTime ? (timestamp - lastFrameTime) / 1000 : 0
  lastFrameTime = timestamp
  frameNow.value = timestamp

  particleStates.value = pathItems.value.map((item, pathIdx) =>
    advanceParticleStates(
      particleStates.value[pathIdx] ?? [],
      deltaSeconds,
      mergedParticle.value.speed ?? 120,
      item.totalLength
    )
  )

  animationFrameId = requestAnimationFrame(tick)
}

function startAnimation() {
  stopAnimation()
  animationFrameId = requestAnimationFrame(tick)
}

function stopAnimation() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }
}

onMounted(() => {
  rebuildParticleStates()
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
    rebuildParticleStates()
  },
  { deep: true }
)
</script>

<style scoped>
.flow-pipeline-svg {
  position: relative;
  overflow: hidden;
}

svg {
  display: block;
}
</style>
