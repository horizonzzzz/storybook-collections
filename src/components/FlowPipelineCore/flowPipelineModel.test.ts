import { describe, expect, it } from 'vitest'
import {
  advanceParticleStates,
  buildFlowPipelineScene,
  createParticleStates,
  createRenderableParticles
} from './flowPipelineModel'

describe('FlowPipeline shared model', () => {
  it('derives valid paths, endpoints, and node positions once for all renderers', () => {
    const scene = buildFlowPipelineScene({
      paths: [
        {
          points: [
            [0, 0],
            [100, 0],
            [100, 50]
          ]
        },
        { points: [[10, 10]] }
      ],
      nodes: [
        { pathIndex: 0, position: 0.5, radius: 3, pulse: false },
        { pathIndex: 1, position: 0.5, radius: 3 }
      ],
      frameTime: 0
    })

    expect(scene.pathItems).toHaveLength(1)
    expect(scene.pathItems[0].d).toBe('M 0 0 L 100 0 L 100 50')
    expect(scene.pathItems[0].totalLength).toBe(150)
    expect(scene.pathItems[0].endpoints).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 50 }
    ])
    expect(scene.pathItems[0].nodes[0]).toMatchObject({
      x: 75,
      y: 0,
      radius: 3,
      renderRadius: 3,
      absoluteLength: 75
    })
  })

  it('uses configured particle spacing and advances with elapsed seconds', () => {
    const states = createParticleStates(
      {
        count: 3,
        spacing: 60,
        length: 40
      },
      200
    )

    expect(states.map((state) => state.headLength)).toEqual([0, 140, 80])

    expect(
      advanceParticleStates(states, 0.5, 120, 200).map(
        (state) => state.headLength
      )
    ).toEqual([60, 0, 140])
  })

  it('splits wrapped particles into multiple renderable slices', () => {
    const scene = buildFlowPipelineScene({
      paths: [
        {
          points: [
            [0, 0],
            [100, 0],
            [100, 100]
          ]
        }
      ]
    })

    const particles = createRenderableParticles(
      scene.pathItems[0].segments,
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
})
