import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import EditableItem from '../components/EditableItem/index.vue'

const meta = {
  title: 'Forms/EditableItem',
  component: EditableItem,
  tags: ['autodocs']
} satisfies Meta<typeof EditableItem>

export default meta
type Story = StoryObj<typeof meta>

export const InputMode: Story = {
  args: {
    modelValue: ''
  },
  render: () => ({
    components: { EditableItem },
    setup() {
      const value = ref('Editable content')

      return { value }
    },
    template: '<EditableItem v-model="value" />'
  })
}

export const SelectMode: Story = {
  args: {
    modelValue: 'published',
    mode: 'select',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Published', value: 'published' }
    ]
  }
}

export const ControlledEditing: Story = {
  args: {
    modelValue: '',
    editing: true
  },
  render: () => ({
    components: { EditableItem },
    setup() {
      const value = ref('Controlled edit state')
      const editing = ref(true)

      return { value, editing }
    },
    template: '<EditableItem v-model="value" v-model:editing="editing" />'
  })
}
