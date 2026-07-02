import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const jobResearchMock = await readFile(new URL('../src/mock/job-research.ts', import.meta.url), 'utf8')

test('policy keyword widget uses a word cloud in both entries', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /policy-word-cloud/)
    assert.match(source, /word-cloud-stage/)
    assert.match(source, /word-cloud-node/)
    assert.doesNotMatch(source, /keyword-heat-panel policy-keyword-panel/)
  }
})

test('job keyword widget uses a word cloud in both entries', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /job-skill-word-cloud/)
    assert.match(source, /aria-label="岗位技能词云"/)
    assert.doesNotMatch(source, /job-skill-heat-panel/)
  }
})

test('policy and job word clouds keep readable labels in both entries', () => {
  for (const source of [appVue, staticHtml]) {
    assert.match(source, /智能建造/)
    assert.match(source, /智慧工地/)
    assert.match(source, /装配式建筑/)
  }
  for (const source of [staticHtml, jobResearchMock]) {
    assert.match(source, /BIM建模与深化设计/)
    assert.match(source, /智能测量与三维扫描/)
    assert.match(source, /建筑机器人与设备联调/)
  }
})
