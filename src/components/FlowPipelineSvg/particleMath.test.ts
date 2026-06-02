import { describe, expect, it } from 'vitest'
import {
  buildSegments,
  createParticleStates,
  createRenderableParticles
} from './particleMath'
import { getParticleGradientStops } from '../../utils/flowParticleUtils'

describe('FlowPipelineSvg particle math', () => {
  it('uses configured spacing instead of evenly distributing particles', () => {
    const segments = buildSegments({
      points: [
        [0, 0],
        [200, 0]
      ]
    })

    const states = createParticleStates(
      {
        count: 3,
        spacing: 60,
        length: 40
      },
      200
    )

    expect(states.map((state) => state.headLength)).toEqual([0, 140, 80])
    expect(segments).toHaveLength(1)
  })

  it('splits wrapped particles into multiple slices across the path boundary', () => {
    const segments = buildSegments({
      points: [
        [0, 0],
        [100, 0],
        [100, 100]
      ]
    })

    const particles = createRenderableParticles(
      segments,
      [{ id: 0, headLength: 30 }],
      {
        length: 80,
        count: 1
      }
    )

    expect(particles[0].slices).toHaveLength(2)
    expect(particles[0].slices[0]).toMatchObject({
      start: { x: 100, y: 50 },
      end: { x: 100, y: 100 },
      progressStart: 0,
      progressEnd: 0.625
    })
    expect(particles[0].slices[1]).toMatchObject({
      start: { x: 0, y: 0 },
      end: { x: 30, y: 0 },
      progressStart: 0.625,
      progressEnd: 1
    })
  })

  it('projects gradient stops to the current slice progress range', () => {
    const stops = getParticleGradientStops(
      {
        progressStart: 0.625,
        progressEnd: 1
      },
      {
        color: '#36f6ff',
        gradientColors: ['#2f7dff', '#36f6ff', '#f7fbff'],
        opacity: 0.92
      }
    )

    expect(stops[0]).toMatchObject({
      offset: 0,
      color: '#35e4ff'
    })
    expect(stops[1].offset).toBeCloseTo(0.14666666666666678)
    expect(stops[1]).toMatchObject({
      color: '#36f6ff',
      alpha: 0.6624
    })
    expect(stops.at(-1)).toMatchObject({
      offset: 1,
      color: '#f7fbff',
      alpha: 0.92
    })
  })
})
