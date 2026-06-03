import { describe, expect, it } from 'vitest'

import { mountWithElementPlus } from '../../test/mountWithElementPlus'
import TagInput from './index.vue'

describe('TagInput', () => {
  it('adds a trimmed tag on enter and emits update:modelValue', async () => {
    const wrapper = mountWithElementPlus(TagInput, {
      props: {
        modelValue: ['alpha']
      }
    })

    const input = wrapper.find('input')
    await input.setValue('  beta  ')
    await input.trigger('keydown.enter')

    const updates = wrapper.emitted('update:modelValue')
    expect(updates?.at(-1)?.[0]).toEqual(['alpha', 'beta'])
  })

  it('ignores empty and duplicate values', async () => {
    const wrapper = mountWithElementPlus(TagInput, {
      props: {
        modelValue: ['alpha']
      }
    })

    const input = wrapper.find('input')
    await input.setValue('alpha')
    await input.trigger('keydown.enter')
    await input.setValue('   ')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('removes a tag when closable', async () => {
    const wrapper = mountWithElementPlus(TagInput, {
      props: {
        modelValue: ['alpha', 'beta']
      }
    })

    await wrapper.findAllComponents({ name: 'ElTag' })[1].vm.$emit('close')

    const updates = wrapper.emitted('update:modelValue')
    expect(updates?.at(-1)?.[0]).toEqual(['alpha'])
  })

  it('blocks input and removal when disabled', async () => {
    const wrapper = mountWithElementPlus(TagInput, {
      props: {
        modelValue: ['alpha'],
        disabled: true
      }
    })

    const input = wrapper.find('input')
    expect(input.attributes('disabled')).toBeDefined()

    await wrapper.findComponent({ name: 'ElTag' }).vm.$emit('close')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
