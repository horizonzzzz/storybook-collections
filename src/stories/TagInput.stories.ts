import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import TagInput from '../components/TagInput/index.vue'

const meta = {
  title: 'Forms/TagInput',
  component: TagInput,
  tags: ['autodocs']
} satisfies Meta<typeof TagInput>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    modelValue: []
  },
  render: () => ({
    components: { TagInput },
    setup() {
      const value = ref(['api', 'worker'])

      return { value }
    },
    template: '<TagInput v-model="value" placeholder="Add a tag" />'
  })
}

export const Disabled: Story = {
  args: {
    modelValue: ['readonly'],
    disabled: true
  }
}

export const NonClosable: Story = {
  args: {
    modelValue: ['fixed', 'seeded'],
    closable: false
  }
}
