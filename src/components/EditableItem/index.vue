<template>
  <div class="editable-item">
    <template v-if="currentEditing">
      <ElInput
        v-if="mode === 'input'"
        v-model="inputDraftValue"
        v-bind="editorBindings"
        @keydown.enter.prevent="submitOnEnter && submitEdit()"
      />
      <ElSelect v-else v-model="selectDraftValue" v-bind="editorBindings">
        <ElOption
          v-for="option in options"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <button class="editable-item__action" type="button" @click="submitEdit">
        Save
      </button>
      <button class="editable-item__action" type="button" @click="cancelEdit">
        Cancel
      </button>
    </template>
    <template v-else>
      <ElTooltip v-if="showTooltip" :content="displayText" placement="top">
        <span class="editable-item__text">{{ truncatedText }}</span>
      </ElTooltip>
      <span v-else class="editable-item__text">{{ displayText }}</span>
      <button
        v-if="editable"
        class="editable-item__action"
        type="button"
        @click="startEdit"
      >
        Edit
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElInput, ElMessage, ElOption, ElSelect, ElTooltip } from 'element-plus'

type EditableValue = string | number | Array<string | number> | null

const props = withDefaults(
  defineProps<{
    modelValue: EditableValue
    mode?: 'input' | 'select'
    editable?: boolean
    editing?: boolean
    maxLength?: number
    placeholder?: string
    options?: Array<{ label: string; value: string | number }>
    editorProps?: Record<string, unknown>
    emptyText?: string
    submitOnEnter?: boolean
  }>(),
  {
    mode: 'input',
    editable: true,
    editing: undefined,
    maxLength: 35,
    placeholder: '',
    options: () => [],
    editorProps: () => ({}),
    emptyText: '--',
    submitOnEnter: true
  }
)

const emit = defineEmits<{
  'update:modelValue': [EditableValue]
  'update:editing': [boolean]
  'edit-start': []
  cancel: []
  submit: [EditableValue]
}>()

const localEditing = ref(false)
const draftValue = ref<EditableValue>(props.modelValue)

const currentEditing = computed(() =>
  props.editing === undefined ? localEditing.value : props.editing
)

const editorBindings = computed(() => ({
  placeholder: props.placeholder,
  ...props.editorProps
}))

const inputDraftValue = computed({
  get: () => {
    if (typeof draftValue.value === 'number') {
      return String(draftValue.value)
    }

    if (Array.isArray(draftValue.value)) {
      return draftValue.value.join(', ')
    }

    return draftValue.value ?? ''
  },
  set: (value: string) => {
    draftValue.value = value
  }
})

const selectDraftValue = computed({
  get: () =>
    draftValue.value as string | number | Array<string | number> | undefined,
  set: (value: string | number | Array<string | number> | undefined) => {
    draftValue.value = value ?? null
  }
})

const displayText = computed(() => {
  if (Array.isArray(props.modelValue)) {
    if (props.mode === 'select') {
      const selectedValues = props.modelValue
      const labels = props.options
        .filter((option) => selectedValues.includes(option.value))
        .map((option) => option.label)

      return labels.join(', ') || props.emptyText
    }

    return props.modelValue.join(', ') || props.emptyText
  }

  if (props.modelValue === null || props.modelValue === '') {
    return props.emptyText
  }

  if (props.mode === 'select') {
    const match = props.options.find((option) => option.value === props.modelValue)
    return match?.label ?? props.emptyText
  }

  return String(props.modelValue)
})

const showTooltip = computed(() => displayText.value.length > props.maxLength)
const truncatedText = computed(() =>
  showTooltip.value
    ? `${displayText.value.slice(0, props.maxLength)}...`
    : displayText.value
)

watch(
  () => props.modelValue,
  (value) => {
    if (!currentEditing.value) {
      draftValue.value = value
    }
  },
  { immediate: true }
)

watch(
  () => currentEditing.value,
  (value) => {
    if (value) {
      draftValue.value = props.modelValue
    }
  }
)

function setEditing(next: boolean) {
  if (props.editing === undefined) {
    localEditing.value = next
  }

  emit('update:editing', next)
}

function startEdit() {
  draftValue.value = props.modelValue
  setEditing(true)
  emit('edit-start')
}

function cancelEdit() {
  draftValue.value = props.modelValue
  setEditing(false)
  emit('cancel')
}

function submitEdit() {
  if (props.mode === 'input' && String(draftValue.value ?? '').trim() === '') {
    ElMessage.warning('Value cannot be empty')
    return
  }

  emit('update:modelValue', draftValue.value)
  emit('submit', draftValue.value)
  setEditing(false)
}
</script>

<style scoped>
.editable-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.editable-item__text {
  min-height: 24px;
  line-height: 24px;
}

.editable-item__action {
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  padding: 0;
}
</style>
