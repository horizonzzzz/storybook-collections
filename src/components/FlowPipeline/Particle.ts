import PathGeometry from './PathGeometry'
import type { RenderableParticle, Slice } from './types'

export interface ParticleGroupConfig {
  geometry?: PathGeometry
  count?: number
  speed?: number
  length?: number
  spacing?: number
}

interface InternalParticle {
  id: number
  headLength: number
}

function clampPositiveNumber(value: unknown, fallback: number): number {
  const normalized = Number(value)
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback
}

export default class ParticleGroup {
  geometry: PathGeometry | undefined
  count: number
  speed: number
  length: number
  spacing: number
  totalLength: number
  particles: InternalParticle[]

  constructor({
    geometry,
    count = 1,
    speed = 120,
    length = 80,
    spacing = 200
  }: ParticleGroupConfig = {}) {
    this.geometry = geometry
    this.count = Math.max(0, Math.floor(Number(count) || 0))
    this.speed = clampPositiveNumber(speed, 120)
    this.length = clampPositiveNumber(length, 80)
    this.spacing = clampPositiveNumber(spacing, this.length)
    this.totalLength = geometry ? geometry.getTotalLength() : 0
    this.particles = this.createParticles()
  }

  private createParticles(): InternalParticle[] {
    if (!this.geometry || !this.totalLength || !this.count) {
      return []
    }

    const geometry = this.geometry
    return Array.from({ length: this.count }, (_, index) => ({
      id: index,
      headLength: geometry.normalizeLoopLength(-index * this.spacing)
    }))
  }

  getParticles(): InternalParticle[] {
    return this.particles.map((particle) => ({ ...particle }))
  }

  update(deltaSeconds: number): void {
    const delta = Math.max(0, Number(deltaSeconds) || 0)
    const geometry = this.geometry

    if (!geometry) {
      return
    }

    this.particles = this.particles.map((particle) => ({
      ...particle,
      headLength: geometry.normalizeLoopLength(
        particle.headLength + this.speed * delta
      )
    }))
  }

  getRenderableParticles(): RenderableParticle[] {
    const geometry = this.geometry

    if (!geometry) {
      return []
    }

    return this.particles.map((particle) => {
      const tailLength = particle.headLength - this.length

      return {
        ...particle,
        tailLength: geometry.normalizeLoopLength(tailLength),
        slices: this.createRenderableSlices(tailLength, particle.headLength)
      }
    })
  }

  private createRenderableSlices(
    rawTailLength: number,
    headLength: number
  ): Slice[] {
    const geometry = this.geometry

    if (!geometry) {
      return []
    }

    if (rawTailLength >= 0) {
      return geometry.getSlices(rawTailLength, headLength)
    }

    const firstSlices = geometry.getSlices(
      this.totalLength + rawTailLength,
      this.totalLength
    )
    const secondSlices = geometry.getSlices(0, headLength)
    const slices = [...firstSlices, ...secondSlices]
    let cursor = 0

    return slices.map((slice) => {
      const sliceLength = slice.endLength - slice.startLength
      const progressStart = cursor / this.length
      const progressEnd = (cursor + sliceLength) / this.length
      cursor += sliceLength

      return {
        ...slice,
        progressStart,
        progressEnd
      }
    })
  }
}
