import type { ParticleConfig } from '../components/FlowPipelineCore/types'

export interface GradientStop {
  offset: number
  color: string
  alpha: number
  brightness: number
}

export interface TrailLayerConfig {
  key: string
  width: number
  opacity: number
  filter?: string
}

interface GradientEdgeStop extends GradientStop {
  progress?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
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

function mixHexColors(startColor: string, endColor: string, ratio: number) {
  const start = hexToRgb(startColor)
  const end = hexToRgb(endColor)
  const progress = clamp(Number(ratio) || 0, 0, 1)
  const red = Math.round(start.red + (end.red - start.red) * progress)
  const green = Math.round(start.green + (end.green - start.green) * progress)
  const blue = Math.round(start.blue + (end.blue - start.blue) * progress)

  return rgbToHex(red, green, blue)
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

function resolveGradientEdgeStop(
  globalStops: GradientEdgeStop[],
  progress: number,
  offset: number
): GradientStop {
  const safeProgress = clamp(Number(progress) || 0, 0, 1)

  for (let index = 0; index < globalStops.length - 1; index += 1) {
    const current = globalStops[index]
    const next = globalStops[index + 1]

    if (safeProgress >= current.progress! && safeProgress <= next.progress!) {
      const range = Math.max(next.progress! - current.progress!, 0.0001)
      const ratio = (safeProgress - current.progress!) / range

      return {
        offset,
        color: mixHexColors(current.color, next.color, ratio),
        alpha: current.alpha + (next.alpha - current.alpha) * ratio,
        brightness:
          current.brightness + (next.brightness - current.brightness) * ratio
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

export function getParticleGradientStops(
  slice: { progressStart: number; progressEnd: number },
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

export function getTrailLayerConfigs(
  particleConfig: ParticleConfig,
  glowFilter?: string
): TrailLayerConfig[] {
  const baseWidth = Math.max(1, Number(particleConfig.width) || 1)

  return [
    {
      key: 'outer',
      width: baseWidth * 2.2,
      opacity: 0.18,
      filter: glowFilter
    },
    {
      key: 'mid',
      width: baseWidth * 1.35,
      opacity: 0.42,
      filter: glowFilter
    },
    {
      key: 'core',
      width: baseWidth,
      opacity: 1
    }
  ]
}
