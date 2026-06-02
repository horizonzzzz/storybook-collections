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
