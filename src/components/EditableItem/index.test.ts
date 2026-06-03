import { describe, expect, it } from 'vitest'

import { mountWithElementPlus } from '../../test/mountWithElementPlus'
import EditableItem from './index.vue'

describe('EditableItem', () => {
  it('enters edit mode and submits a new input value', async () => {
    const wrapper = mountWithElementPlus(EditableItem, {
      props: {
        modelValue: 'Alpha'
      }
    })

    await wrapper.get('button').trigger('click')

    const input = wrapper.get('input')
    await input.setValue('Beta')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('Beta')
    expect(wrapper.emitted('submit')?.at(-1)?.[0]).toBe('Beta')
  })

  it('blocks empty submit in input mode', async () => {
    const wrapper = mountWithElementPlus(EditableItem, {
      props: {
        modelValue: 'Alpha'
      }
    })

    await wrapper.get('button').trigger('click')

    const input = wrapper.get('input')
    await input.setValue('   ')
    await input.trigger('keydown.enter')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits update:editing when canceling in controlled mode', async () => {
    const wrapper = mountWithElementPlus(EditableItem, {
      props: {
        modelValue: 'Alpha',
        editing: true
      }
    })

    await wrapper.findAll('button')[1].trigger('click')

    expect(wrapper.emitted('update:editing')?.at(-1)?.[0]).toBe(false)
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
