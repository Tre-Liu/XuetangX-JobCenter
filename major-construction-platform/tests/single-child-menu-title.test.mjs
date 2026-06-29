import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('single-child job menu groups do not render second-level group titles', () => {
  for (const source of [appVue, staticHtml]) {
    assert.doesNotMatch(source, /·\s*报告管理\s*·/)
    assert.doesNotMatch(source, /·\s*岗位维护\s*·/)
  }
})

test('multi-child job menu groups keep their second-level group titles', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /·\s*产业布局\s*·/)
    assert.match(source, /·\s*专业分析\s*·/)
    assert.match(source, /·\s*岗位分析\s*·/)
  }
})
