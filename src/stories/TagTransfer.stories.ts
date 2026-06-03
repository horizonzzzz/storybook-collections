import { computed, ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

import TagTransfer from '../components/TagTransfer/index.vue'
import type { TransferItem } from '../components/TagTransfer/types'

const rows = Array.from({ length: 18 }, (_, index) => ({
  id: index + 1,
  name: `Tag ${index + 1}`,
  group: index % 2 === 0 ? 'core' : 'edge'
}))

const meta = {
  title: 'Forms/TagTransfer',
  component: TagTransfer,
  tags: ['autodocs']
} satisfies Meta<typeof TagTransfer>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    modelValue: [],
    tableData: {
      rows: [],
      totalRows: rows.length,
      pageNo: 1,
      pageSize: 10
    },
    columns: []
  },
  render: () => ({
    components: { TagTransfer },
    setup() {
      const value = ref<TransferItem[]>([{ id: 2, label: 'Tag 2' }])
      const pageNo = ref(1)
      const pageSize = ref(10)
      const tableData = computed(() => {
        const start = (pageNo.value - 1) * pageSize.value

        return {
          rows: rows.slice(start, start + pageSize.value),
          totalRows: rows.length,
          pageNo: pageNo.value,
          pageSize: pageSize.value
        }
      })

      function handlePageChange(payload: { pageNo: number; pageSize: number }) {
        pageNo.value = payload.pageNo
        pageSize.value = payload.pageSize
      }

      return { value, tableData, handlePageChange }
    },
    template: `
      <TagTransfer
        v-model="value"
        :table-data="tableData"
        :columns="[
          { prop: 'name', label: 'Name', minWidth: 160 },
          { prop: 'group', label: 'Group', minWidth: 120 }
        ]"
        label-key="name"
        @page-change="handlePageChange"
      />
    `
  })
}

export const HiddenSelectedPanel: Story = {
  args: {
    modelValue: [],
    tableData: {
      rows: rows.slice(0, 10),
      totalRows: rows.length,
      pageNo: 1,
      pageSize: 10
    },
    columns: [{ prop: 'name', label: 'Name', minWidth: 160 }],
    labelKey: 'name',
    hideSelectedPanel: true
  }
}
