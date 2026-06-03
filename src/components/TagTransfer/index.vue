<template>
  <div class="tag-transfer">
    <div class="tag-transfer__trigger" @click="openDialog">
      <slot>
        <template v-if="modelValue.length">
          <ElTag>{{ firstLabel }}</ElTag>
          <ElTag v-if="modelValue.length > 1">
            +{{ modelValue.length - 1 }}
          </ElTag>
          <button
            v-if="!triggerDisabled"
            class="tag-transfer__clear"
            type="button"
            @click.stop="clearConfirmed"
          >
            Clear
          </button>
        </template>
        <span v-else class="tag-transfer__placeholder">{{ placeholder }}</span>
      </slot>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="70%"
      @open="emit('open')"
      @close="handleClose"
    >
      <slot name="search" />
      <div class="tag-transfer__layout">
        <section class="tag-transfer__panel">
          <header class="tag-transfer__panel-head">Available</header>
          <ElTable
            ref="tableRef"
            :data="tableData.rows"
            :row-key="idKey"
            height="290"
            @select="handleSelect"
            @select-all="handleSelectAll"
          >
            <ElTableColumn type="selection" width="48" />
            <ElTableColumn
              v-for="column in columns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :min-width="column.minWidth"
            >
              <template #default="scope">
                <slot
                  :name="column.prop"
                  :row="scope.row"
                  :column="column"
                  :$index="scope.$index"
                >
                  {{ scope.row[column.prop] }}
                </slot>
              </template>
            </ElTableColumn>
          </ElTable>
          <ElPagination
            class="tag-transfer__pagination"
            layout="total, prev, pager, next, sizes"
            :current-page="pageNo"
            :page-size="pageSize"
            :page-sizes="pageSizeOptions"
            :total="totalRows"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </section>

        <section
          v-if="!hideSelectedPanel"
          class="tag-transfer__panel tag-transfer__panel--selected"
        >
          <header class="tag-transfer__panel-head">
            Selected ({{ workingSelection.length }})
          </header>
          <div class="tag-transfer__selected-list">
            <ElTag
              v-for="item in workingSelection"
              :key="item.id"
              closable
              @close="removeSelected(item.id)"
            >
              {{ item.label }}
            </ElTag>
          </div>
        </section>
      </div>

      <template #footer>
        <ElButton @click="cancelDialog">Cancel</ElButton>
        <ElButton type="primary" @click="confirmDialog">Confirm</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  ElButton,
  ElDialog,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag
} from 'element-plus'
import type { TableInstance } from 'element-plus'

import type { TransferColumn, TransferItem, TransferTableData } from './types'
import {
  appendRowsToSelection,
  buildTransferItem,
  removeRowsFromSelection,
  restoreConfirmedSelection
} from './useTagTransferSelection'

const props = withDefaults(
  defineProps<{
    modelValue: TransferItem[]
    tableData: TransferTableData
    columns: TransferColumn[]
    idKey?: string
    labelKey?: string
    dialogTitle?: string
    placeholder?: string
    hideSelectedPanel?: boolean
    pageSizeOptions?: number[]
    triggerDisabled?: boolean
  }>(),
  {
    idKey: 'id',
    labelKey: 'label',
    dialogTitle: 'Select items',
    placeholder: 'Please select',
    hideSelectedPanel: false,
    pageSizeOptions: () => [10, 20, 50],
    triggerDisabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [TransferItem[]]
  confirm: [TransferItem[]]
  cancel: []
  open: []
  close: []
  'page-change': [{ pageNo: number; pageSize: number }]
}>()

const tableRef = ref<TableInstance | null>(null)
const dialogVisible = ref(false)
const workingSelection = ref<TransferItem[]>(
  restoreConfirmedSelection(props.modelValue)
)

const pageNo = computed(() => props.tableData.pageNo ?? 1)
const pageSize = computed(() => props.tableData.pageSize ?? 10)
const totalRows = computed(() => props.tableData.totalRows ?? 0)
const firstLabel = computed(() => props.modelValue[0]?.label ?? '')

watch(
  () => props.modelValue,
  (value) => {
    if (!dialogVisible.value) {
      workingSelection.value = restoreConfirmedSelection(value)
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.tableData.rows,
  async () => {
    await nextTick()
    syncCheckedRows()
  },
  { deep: true, immediate: true }
)

function openDialog() {
  if (props.triggerDisabled) {
    return
  }

  dialogVisible.value = true
  workingSelection.value = restoreConfirmedSelection(props.modelValue)
}

function clearConfirmed() {
  workingSelection.value = []
  emit('update:modelValue', [])
}

function handleSelect(
  selection: Record<string, unknown>[],
  row: Record<string, unknown>
) {
  const item = buildTransferItem(row, props.idKey, props.labelKey)
  const exists = selection.some(
    (selectedRow) => selectedRow[props.idKey] === row[props.idKey]
  )

  workingSelection.value = exists
    ? appendRowsToSelection(
        workingSelection.value,
        [row],
        props.idKey,
        props.labelKey
      )
    : workingSelection.value.filter((current) => current.id !== item.id)
}

function handleSelectAll(selection: Record<string, unknown>[]) {
  if (selection.length) {
    workingSelection.value = appendRowsToSelection(
      workingSelection.value,
      selection,
      props.idKey,
      props.labelKey
    )
    return
  }

  workingSelection.value = removeRowsFromSelection(
    workingSelection.value,
    props.tableData.rows,
    props.idKey
  )
}

function removeSelected(id: TransferItem['id']) {
  workingSelection.value = workingSelection.value.filter(
    (item) => item.id !== id
  )
  syncCheckedRows()
}

function handlePageChange(nextPage: number) {
  emit('page-change', { pageNo: nextPage, pageSize: pageSize.value })
}

function handleSizeChange(nextSize: number) {
  emit('page-change', { pageNo: 1, pageSize: nextSize })
}

function cancelDialog() {
  workingSelection.value = restoreConfirmedSelection(props.modelValue)
  dialogVisible.value = false
  emit('cancel')
}

function confirmDialog() {
  const confirmed = restoreConfirmedSelection(workingSelection.value)

  emit('update:modelValue', confirmed)
  emit('confirm', confirmed)
  dialogVisible.value = false
}

function handleClose() {
  emit('close')
}

function syncCheckedRows() {
  tableRef.value?.clearSelection()

  props.tableData.rows.forEach((row) => {
    if (
      workingSelection.value.some((item) => item.id === row[props.idKey])
    ) {
      tableRef.value?.toggleRowSelection(row, true)
    }
  })
}
</script>

<style scoped>
.tag-transfer__trigger {
  min-height: 32px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.tag-transfer__clear {
  border: 0;
  background: transparent;
  color: var(--el-color-danger);
  cursor: pointer;
  padding: 0;
}

.tag-transfer__placeholder {
  color: var(--el-text-color-placeholder);
}

.tag-transfer__layout {
  display: flex;
  gap: 12px;
}

.tag-transfer__panel {
  flex: 1 1 auto;
  border: 1px solid var(--el-border-color);
}

.tag-transfer__panel--selected {
  width: 280px;
  flex: 0 0 280px;
}

.tag-transfer__panel-head {
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
}

.tag-transfer__pagination {
  padding: 12px;
}

.tag-transfer__selected-list {
  min-height: 290px;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}
</style>
