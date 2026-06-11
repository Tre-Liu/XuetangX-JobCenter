import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))

test('AI-assisted actions use a dedicated AI-styled button class', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /class="[^"]*ai-action-button[^"]*"[^>]*>AI建岗</)
    assert.match(source, /class="[^"]*ai-action-button[^"]*"[^>]*>AI补全</)
    assert.match(source, /class="[^"]*ai-action-button[^"]*"[^>]*>AI生成</)
  }

  assert.doesNotMatch(appVue, /class="[^"]*ai-action-button[^"]*"[^>]*>手动添加/)
  assert.doesNotMatch(staticHtml, /class="[^"]*ai-action-button[^"]*"[^>]*>手动添加/)
})

test('AI action button styling carries a distinct AI visual treatment', () => {
  assert.match(stylesCss, /\.ai-action-button\s*\{/)
  assert.match(stylesCss, /linear-gradient\(/)
  assert.match(stylesCss, /box-shadow:[^;]*(rgba\(44,\s*116,\s*255,\s*0\.32\)|rgba\(71,\s*215,\s*255,\s*0\.38\))/)
  assert.match(stylesCss, /\.ai-action-button::before\s*\{/)
  assert.match(stylesCss, /content:\s*'✦';/)
})
