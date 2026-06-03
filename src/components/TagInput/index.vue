<template>
  <div class="tag-input" :class="{ 'is-disabled': disabled }" @click="focusInput">
    <div class="tag-input__tags">
      <ElTag
        v-for="(tag, index) in modelValue"
        :key="`${tag}-${index}`"
        :closable="canRemove(index)"
        size="default"
        @close="removeTag(index)"
      >
        {{ tag }}
      </ElTag>
      <ElInput
        ref="inputRef"
        v-model="draft"
        class="tag-input__editor"
        :disabled="disabled || reachedMaxTags"
        :placeholder="modelValue.length ? '' : placeholder"
        @input="handleInput"
        @keydown.enter.prevent="commitDraft()"
        @keydown="handleCommaSeparator"
        @keydown.space="handleSpaceSeparator"
        @blur="handleBlur"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElInput, ElTag } from 'element-plus'

type Separator = 'enter' | 'comma' | 'space' | 'custom'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    placeholder?: string
    disabled?: boolean
    closable?: boolean
    maxTags?: number
    addOnBlur?: boolean
    separator?: Separator
    customSeparators?: string[]
  }>(),
  {
    placeholder: '',
    disabled: false,
    closable: true,
    maxTags: undefined,
    addOnBlur: false,
    separator: 'enter',
    customSeparators: () => []
  }
)

const emit = defineEmits<{
  'update:modelValue': [string[]]
  change: [string[]]
  add: [string]
  remove: [string]
}>()

const draft = ref('')
const inputRef = ref<InstanceType<typeof ElInput>>()

const reachedMaxTags = computed(
  () => props.maxTags !== undefined && props.modelValue.length >= props.maxTags
)

function normalize(value: string) {
  return value.trim()
}

function commitDraft() {
  if (props.disabled || reachedMaxTags.value) {
    draft.value = ''
    return
  }

  const nextTag = normalize(draft.value)
  draft.value = ''

  if (!nextTag || props.modelValue.includes(nextTag)) {
    return
  }

  const nextValue = [...props.modelValue, nextTag]
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
  emit('add', nextTag)
}

function removeTag(index: number) {
  if (props.disabled || !canRemove(index)) {
    return
  }

  const removed = props.modelValue[index]
  const nextValue = props.modelValue.filter(
    (_, currentIndex) => currentIndex !== index
  )

  emit('update:modelValue', nextValue)
  emit('change', nextValue)
  emit('remove', removed)
}

function canRemove(index: number) {
  return props.closable && !props.disabled && index >= 0
}

function focusInput() {
  inputRef.value?.focus()
}

function handleBlur() {
  if (props.addOnBlur) {
    commitDraft()
  }
}

function handleCommaSeparator(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent)) {
    return
  }

  if (props.separator !== 'comma' || event.key !== ',') {
    return
  }

  event.preventDefault()
  commitDraft()
}

function handleSpaceSeparator(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent)) {
    return
  }

  if (props.separator !== 'space') {
    return
  }

  event.preventDefault()
  commitDraft()
}

function handleInput(value: string) {
  if (props.separator !== 'custom' || !props.customSeparators.length) {
    return
  }

  const matched = props.customSeparators.find((separator) =>
    value.endsWith(separator)
  )

  if (!matched) {
    return
  }

  draft.value = value.slice(0, -matched.length)
  commitDraft()
}
</script>

<style scoped>
.tag-input {
  width: 100%;
  min-height: 32px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-bg-color);
  cursor: text;
}

.tag-input__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 8px;
}

.tag-input__editor {
  min-width: 120px;
  flex: 1 1 120px;
}

.tag-input__editor :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0;
}

.tag-input.is-disabled {
  cursor: not-allowed;
  background: var(--el-disabled-bg-color);
}
</style>
