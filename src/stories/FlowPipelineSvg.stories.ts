import type { Meta, StoryObj } from '@storybook/vue3-vite'

import FlowPipelineSvg from '../components/FlowPipelineSvg/index.vue'
import type {
  EndpointConfig,
  NodeConfig,
  Path,
  ParticleConfig,
  TrackConfig
} from '../components/FlowPipelineCore/types'

const baseTrack: TrackConfig = {
  width: 2,
  color: 'rgba(123, 130, 142, 0.55)',
  coreWidth: 0,
  glowWidth: 0,
  outerGlowWidth: 0
}

const defaultEndpoint: EndpointConfig = {
  radius: 3,
  activeColor: '#f8fbff',
  glowColor: '#5bd6ff',
  ringColor: 'rgba(91, 214, 255, 0.28)',
  glowBlur: 10
}

const tealParticle: ParticleConfig = {
  count: 3,
  speed: 120,
  length: 92,
  width: 3,
  spacing: 156,
  color: '#52f2d5',
  gradientColors: ['#1f72ff', '#52f2d5', '#f8fbff'],
  opacity: 0.94,
  glowBlur: 8,
  glowColor: '#52f2d5'
}

const blueParticle: ParticleConfig = {
  count: 4,
  speed: 130,
  length: 100,
  width: 3,
  spacing: 144,
  color: '#58b8ff',
  gradientColors: ['#3458ff', '#58b8ff', '#f8fbff'],
  opacity: 0.94,
  glowBlur: 9,
  glowColor: '#58b8ff'
}

const warmParticle: ParticleConfig = {
  count: 3,
  speed: 108,
  length: 88,
  width: 3,
  spacing: 162,
  color: '#ff9f66',
  gradientColors: ['#ff5e7a', '#ff9f66', '#fff4da'],
  opacity: 0.95,
  glowBlur: 8,
  glowColor: '#ff9f66'
}

const compactEndpoint: EndpointConfig = {
  radius: 2.5,
  activeColor: '#ffffff',
  glowColor: '#ff9f66',
  ringColor: 'rgba(255, 159, 102, 0.24)',
  glowBlur: 8
}

const horizontalLine: Path[] = [{ points: [[32, 60], [328, 60]] }]

const multiTurnPath: Path[] = [
  {
    points: [
      [38, 182],
      [138, 182],
      [138, 54],
      [252, 54],
      [252, 164],
      [324, 164]
    ]
  }
]

const parallelPath: Path[] = [{ points: [[32, 74], [328, 74]] }]

const warmPath: Path[] = [
  {
    points: [
      [44, 118],
      [132, 118],
      [132, 46],
      [316, 46]
    ]
  }
]

const convergingPaths: Path[] = [
  { points: [[46, 54], [314, 54]] },
  {
    points: [
      [46, 110],
      [182, 110],
      [182, 176],
      [314, 176]
    ]
  },
  {
    points: [
      [46, 166],
      [118, 166],
      [118, 110],
      [314, 110]
    ]
  }
]

const nodesPath: Path[] = [
  {
    points: [
      [40, 132],
      [140, 132],
      [140, 54],
      [320, 54]
    ]
  }
]

const nodes: NodeConfig[] = [
  {
    pathIndex: 0,
    position: 0.28,
    radius: 3,
    pulse: true,
    color: '#f8fbff',
    glowColor: '#52f2d5'
  },
  {
    pathIndex: 0,
    position: 0.56,
    radius: 3,
    pulse: false,
    color: '#9ee9ff',
    glowColor: '#58b8ff'
  },
  {
    pathIndex: 0,
    position: 0.82,
    radius: 3,
    pulse: true,
    color: '#f8fbff',
    glowColor: '#52f2d5'
  }
]

const verticalPath: Path[] = [
  {
    points: [
      [180, 32],
      [180, 110],
      [90, 110],
      [90, 200],
      [180, 200],
      [180, 308]
    ]
  }
]

const meta = {
  title: 'DataV/FlowPipelineSvg',
  component: FlowPipelineSvg,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'SVG renderer for the shared FlowPipeline model. It keeps the Canvas component API, uses SVG paths/filters/gradients for rendering, and advances animation through GSAP ticker.'
      }
    }
  },
  decorators: [
    () => ({
      template: `
        <div
          style="
            background: radial-gradient(circle at 30% 20%, #0f1b2e 0%, #060b16 100%);
            padding: 48px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
          "
        >
          <story />
        </div>
      `
    })
  ],
  argTypes: {
    width: { control: { type: 'number', min: 120, max: 960, step: 10 } },
    height: { control: { type: 'number', min: 60, max: 600, step: 10 } },
    paths: { control: 'object' },
    particle: { control: 'object' },
    nodes: { control: 'object' },
    track: { control: 'object' },
    cap: { control: 'object' },
    endpoint: { control: 'object' },
    ariaLabel: { control: 'text' }
  }
} satisfies Meta<typeof FlowPipelineSvg>

export default meta
type Story = StoryObj<typeof meta>

export const BasicLine: Story = {
  name: '基础直线',
  args: {
    width: 360,
    height: 120,
    paths: horizontalLine,
    track: baseTrack,
    particle: tealParticle,
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const MultiTurn: Story = {
  name: '多拐点动线',
  args: {
    width: 360,
    height: 220,
    paths: multiTurnPath,
    track: baseTrack,
    particle: blueParticle,
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const ParallelTrails: Story = {
  name: '同线多拖尾',
  args: {
    width: 360,
    height: 140,
    paths: parallelPath,
    track: baseTrack,
    particle: {
      ...blueParticle,
      count: 5,
      spacing: 96,
      length: 74
    },
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const CustomColors: Story = {
  name: '颜色自定义',
  args: {
    width: 360,
    height: 160,
    paths: warmPath,
    track: baseTrack,
    particle: warmParticle,
    endpoint: compactEndpoint,
    nodes: []
  }
}

export const MultiPath: Story = {
  name: '多路径组合',
  args: {
    width: 360,
    height: 220,
    paths: convergingPaths,
    track: baseTrack,
    particle: {
      ...tealParticle,
      count: 2,
      spacing: 128
    },
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const NodesPulse: Story = {
  name: '附加节点',
  args: {
    width: 360,
    height: 180,
    paths: nodesPath,
    track: baseTrack,
    particle: tealParticle,
    endpoint: defaultEndpoint,
    nodes
  }
}

export const GlowingTrack: Story = {
  name: '轨道辉光',
  args: {
    width: 360,
    height: 140,
    paths: horizontalLine,
    track: {
      width: 2,
      color: 'rgba(180, 200, 230, 0.95)',
      coreWidth: 1,
      coreColor: '#ffffff',
      glowWidth: 6,
      glowColor: 'rgba(82, 242, 213, 0.65)',
      outerGlowWidth: 14,
      outerGlowColor: 'rgba(31, 114, 255, 0.32)'
    },
    particle: tealParticle,
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const HiddenEndpoints: Story = {
  name: '隐藏端点',
  args: {
    width: 360,
    height: 120,
    paths: horizontalLine,
    track: baseTrack,
    particle: tealParticle,
    endpoint: { ...defaultEndpoint, show: false },
    nodes: []
  }
}

export const VerticalPath: Story = {
  name: '垂直动线',
  args: {
    width: 360,
    height: 360,
    paths: verticalPath,
    track: baseTrack,
    particle: blueParticle,
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const HighSpeed: Story = {
  name: '高速多流光',
  args: {
    width: 360,
    height: 140,
    paths: parallelPath,
    track: baseTrack,
    particle: {
      ...tealParticle,
      count: 6,
      speed: 240,
      length: 64,
      spacing: 80
    },
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const EmptyStage: Story = {
  name: '空舞台',
  args: {
    width: 360,
    height: 120,
    paths: [],
    track: baseTrack,
    particle: tealParticle,
    endpoint: defaultEndpoint,
    nodes: []
  }
}
