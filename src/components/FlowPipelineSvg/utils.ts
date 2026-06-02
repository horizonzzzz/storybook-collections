import type { Path } from './types'

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Convert a FlowPipeline Path (polyline points) to SVG path d string.
 * Deduplicates consecutive identical points.
 */
export function pathToSvgD(path: Path): string {
  if (!path.points?.length) {
    return ''
  }

  const parts: string[] = []
  let lastX: number | undefined
  let lastY: number | undefined

  for (const [x, y] of path.points) {
    if (x === lastX && y === lastY) {
      continue
    }

    parts.push(parts.length === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
    lastX = x
    lastY = y
  }

  return parts.join(' ')
}

/**
 * Parse hex color string to { r, g, b }.
 * Supports #RGB, #RRGGBB formats.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = (hex || '#36f6ff').replace('#', '')
  const expanded =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h

  return {
    r: parseInt(expanded.slice(0, 2), 16) || 0,
    g: parseInt(expanded.slice(2, 4), 16) || 0,
    b: parseInt(expanded.slice(4, 6), 16) || 0
  }
}

/**
 * Convert hex color + alpha [0..1] to rgba() string.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`
}
