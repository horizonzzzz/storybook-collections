import ElementPlus from 'element-plus'
import { mount, type MountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'

export function mountWithElementPlus(
  component: Component,
  options: MountingOptions<any> = {}
) {
  const plugins = [ElementPlus, ...(options.global?.plugins ?? [])]

  return mount(component, {
    ...options,
    global: {
      ...options.global,
      plugins
    }
  })
}
