import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

test('both entry points show only task names in portrait cards', async () => {
  for (const file of ['../src/App.vue', '../index.html']) {
    const source = await readFile(new URL(file, import.meta.url), 'utf8')
    const cards = file.endsWith('.vue')
      ? source.slice(source.indexOf('<div class="portrait-task-grid">'), source.indexOf('data-portrait-major-matching @click'))
      : source.slice(source.indexOf('const staticPortraitTaskCardsHtml ='), source.indexOf('const showStaticPortraitDialog ='))
    assert.match(cards, /portrait-task-card/)
    assert.doesNotMatch(cards, /portrait-task-content|portrait-task-source|案例：|暂无任务内容|getSources|getTaskWorkContent/)
  }
})

test('static name-only cards preserve names and safely escape string and object tasks', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const escape = html.match(/const staticEscapeText = .*$/m)[0]
  const render = html.slice(html.indexOf('const staticPortraitTaskCardsHtml ='), html.indexOf('const showStaticPortraitDialog ='))
  const renderCards = vm.runInNewContext(`${escape}\n${render}\nstaticPortraitTaskCardsHtml`)
  assert.equal(renderCards({ tasks: ['建筑模型创建与标准校核', { name: '<script>' }] }),
    '<article class="portrait-task-card"><span class="portrait-task-index">01 ·</span><strong>建筑模型创建与标准校核</strong></article><article class="portrait-task-card"><span class="portrait-task-index">02 ·</span><strong>&lt;script&gt;</strong></article>')
  assert.equal(renderCards({ tasks: [] }), '')
})
