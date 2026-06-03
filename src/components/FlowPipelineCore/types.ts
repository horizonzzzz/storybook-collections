export interface Path {
  points: Array<[number, number]>
}

export interface Vec2 {
  x: number
  y: number
}

export interface ParticleConfig {
  count?: number
  speed?: number
  length?: number
  width?: number
  spacing?: number
  color?: string
  gradientColors?: string[]
  opacity?: number
  glowBlur?: number
  glowColor?: string
}

export interface TrackConfig {
  width?: number
  color?: string
  coreWidth?: number
  coreColor?: string
  glowWidth?: number
  glowColor?: string
  outerGlowWidth?: number
  outerGlowColor?: string
}

export interface CapConfig {
  show?: boolean
  radius?: number
  color?: string
  glowColor?: string
  glowBlur?: number
  drawPathEnds?: boolean
}

export interface EndpointConfig {
  show?: boolean
  radius?: number
  color?: string
  activeColor?: string
  glowColor?: string
  glowBlur?: number
  ringRadius?: number
  ringColor?: string
}

export interface NodeConfig {
  pathIndex: number
  position: number
  radius?: number
  pulse?: boolean
  color?: string
  glowColor?: string
  glowBlur?: number
}

export interface NodeRenderItem extends NodeConfig {
  radius: number
  absoluteLength: number
  point: Vec2
}

export interface Slice {
  segmentIndex: number
  startLength: number
  endLength: number
  start: Vec2
  end: Vec2
  tangent: Vec2
  progressStart: number
  progressEnd: number
}

export interface RenderableParticle {
  id: number
  headLength: number
  tailLength: number
  slices: Slice[]
}
