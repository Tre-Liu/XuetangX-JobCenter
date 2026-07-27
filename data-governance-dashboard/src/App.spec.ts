import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import App from './App.vue'

test('renders the data-governance dashboard heading', () => {
  const wrapper = mount(App)

  const heading = wrapper.get('h1')
  expect(heading.isVisible()).toBe(true)
  expect(heading.text()).toBe('专业建设数据治理驾驶舱')
})
