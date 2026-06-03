import type {
  CapConfig,
  EndpointConfig,
  ParticleConfig,
  TrackConfig
} from './types'

export function createDefaultParticleConfig(): ParticleConfig {
  return {
    count: 3,
    speed: 120,
    length: 96,
    width: 3,
    spacing: 180,
    color: '#36f6ff',
    gradientColors: ['#2f7dff', '#36f6ff', '#f7fbff'],
    opacity: 0.92,
    glowBlur: 8,
    glowColor: '#26d8ff'
  }
}

export function createDefaultTrackConfig(): TrackConfig {
  return {
    width: 2,
    color: 'rgba(116, 130, 151, 0.46)',
    coreWidth: 0,
    coreColor: 'rgba(176, 187, 203, 0.34)',
    glowWidth: 0,
    glowColor: 'rgba(116, 130, 151, 0)',
    outerGlowWidth: 0,
    outerGlowColor: 'rgba(116, 130, 151, 0)'
  }
}

export function createDefaultCapConfig(): CapConfig {
  return {
    show: true,
    radius: 2.5,
    color: '#6fffe9',
    glowColor: '#00e6ff',
    glowBlur: 10,
    drawPathEnds: true
  }
}

export function createDefaultEndpointConfig(): EndpointConfig {
  return {
    show: true,
    radius: 3,
    color: '#9aa6b8',
    activeColor: '#f7fbff',
    glowColor: '#36f6ff',
    glowBlur: 10,
    ringRadius: 6,
    ringColor: 'rgba(54, 246, 255, 0.28)'
  }
}
