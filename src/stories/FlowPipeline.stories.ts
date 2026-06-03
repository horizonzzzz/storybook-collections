import type { Meta, StoryObj } from '@storybook/vue3-vite'

import FlowPipeline from '../components/FlowPipeline/index.vue'
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
  title: 'DataV/FlowPipeline',
  component: FlowPipeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '基于 Canvas 的流光管道动效组件。接收 `paths` / `particle` / `track` / `cap` / `endpoint` / `nodes` 等配置，自动在底轨上循环生成渐变流星拖尾、端点与中间节点。'
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
} satisfies Meta<typeof FlowPipeline>

export default meta
type Story = StoryObj<typeof meta>

export const BasicLine: Story = {
  name: '基础直线',
  parameters: {
    docs: {
      description: {
        story:
          '最简的水平流光。仅传入一条 `points` 长度为 2 的路径，使用默认端点 + 灰色底轨，确认拖尾长度和端点样式。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '同一路径包含多个 90 度拐点，验证折线几何和拖尾跨拐角的连续性。注意 `PathGeometry` 走的是曼哈顿距离切线计算。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '通过 `particle.count` 和 `particle.spacing` 在同一条线上分布多个流星拖尾。spacing 越大粒子越稀疏，count 越大粒子越密。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '灰色底轨保持不变，只替换 `gradientColors` 拖尾渐变和端点发光色。`gradientColors` 数组会按 0 / 中点 / 末点 采样。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '一次传入多条 `paths`，用于一组并列支线或汇聚动线。每条路径各自维护自己的几何、粒子组和端点，绘制顺序与传入顺序一致。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '除了起止端点，还可以在路径中间通过 `nodes` 增加标记节点。`position` 为 0~1 归一化位置，`pulse: true` 时节点会按正弦曲线轻微缩放。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '把 `track` 的 `glowWidth` / `outerGlowWidth` 全部打开，制造发光管道路径。所有四个图层（outerGlow → glow → width → coreWidth）会按顺序叠加。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '`endpoint.show = false` 时不会绘制路径两端的发光圆点。仅保留底轨和粒子拖尾，适合把 FlowPipeline 嵌入到已有节点标记的拓扑中。'
      }
    }
  },
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

export const NoPathEnds: Story = {
  name: '禁用端点绘制',
  parameters: {
    docs: {
      description: {
        story:
          '`cap.drawPathEnds = false` 时不会在路径起止位置补发光圆点；`endpoint.show` 仍为 true 但 `drawTrackCaps` 提前 return，等同于纯底轨 + 拖尾。'
      }
    }
  },
  args: {
    width: 360,
    height: 120,
    paths: horizontalLine,
    track: baseTrack,
    particle: tealParticle,
    cap: { drawPathEnds: false },
    endpoint: defaultEndpoint,
    nodes: []
  }
}

export const VerticalPath: Story = {
  name: '垂直动线',
  parameters: {
    docs: {
      description: {
        story:
          '动线方向与画布高度对齐、左右多次折返的典型形态。粒子头位置仍由几何总长度归一化推进，与方向无关。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '`speed` 翻倍、`count` 增加到 6 时，单条路径上会出现更密、更短的拖尾。适合在数据洪峰场景强调传输密度。'
      }
    }
  },
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
  parameters: {
    docs: {
      description: {
        story:
          '传入空 `paths`：组件仍会渲染空 Canvas 不会报错，监听器也保持挂载。后续再次注入路径即可恢复动效。'
      }
    }
  },
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

export const ReactiveControls: Story = {
  name: '响应式控制',
  parameters: {
    docs: {
      description: {
        story:
          '演示组件对 props 的深度响应：直接在 Controls 面板编辑 `paths` / `particle` / `track` / `endpoint` / `nodes` JSON，组件会重建几何并重启动画，无需重新挂载。'
      }
    }
  },
  args: {
    width: 360,
    height: 180,
    paths: multiTurnPath,
    track: baseTrack,
    particle: {
      ...tealParticle,
      count: 2,
      speed: 90,
      length: 120
    },
    endpoint: defaultEndpoint,
    nodes: [
      {
        pathIndex: 0,
        position: 0.4,
        radius: 4,
        pulse: true,
        color: '#ffe066',
        glowColor: '#ff9f66'
      }
    ]
  }
}
