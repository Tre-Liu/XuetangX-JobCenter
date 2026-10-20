import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

function load(records) {
  const context = { PortraitMajorMatchData: { records } }
  const path = new URL('../src/utils/portrait-major-matching.js', import.meta.url)
  if (fs.existsSync(path)) vm.runInNewContext(fs.readFileSync(path, 'utf8'), context)
  assert.ok(context.PortraitMajorMatching, '岗位专业匹配渲染器已接入')
  return context.PortraitMajorMatching
}

test('missing job never inherits another job or receives an invented percentage', () => {
  const api = load({ A: { majors: [{ name: '护理', code: '520201', level: '高职专科', score: 44 }] } })
  const html = api.render('不存在的岗位')
  assert.ok(html.includes('暂无'))
  assert.ok(!html.includes('44.0%'))
  assert.ok(!html.includes('护理'))
})

test('same-name majors retain distinct codes and scores, including leading zeroes', () => {
  const api = load({ A: { basis: '汇总结果', majors: [
    { name: '示例专业', code: '010101', level: '普通本科', score: 47.8 },
    { name: '示例专业', code: '240302', level: '职业本科', score: 39.2 }
  ] } })
  const html = api.render('A')
  assert.ok(html.includes('010101'))
  assert.ok(html.includes('240302'))
  assert.ok(html.includes('47.8%'))
  assert.ok(html.includes('39.2%'))
  assert.equal((html.match(/class="portrait-major-match-card"/g) || []).length, 2)
})

test('major names are escaped and the method tip is keyboard-operable native details', () => {
  const html = load({ A: { basis: '当前画像', majors: [{ name: '<img src=x onerror=alert(1)>', code: '010101', level: '普通本科', score: 30 }] } }).render('A')
  assert.ok(!html.includes('<img'))
  assert.ok(html.includes('&lt;img'))
  assert.match(html, /<details[^>]*>[\s\S]*<summary[\s\S]*匹配度说明/)
  assert.ok(!html.includes('portrait-major-match-source'))
})

test('major level filters separate ordinary undergraduate from vocational education without changing scores', () => {
  const api = load({ A: { majors: [
    { name: '建筑学', code: '082801', level: '普通本科', score: 40 },
    { name: '建筑工程', code: '240301', level: '职业本科', score: 35 },
    { name: '建筑工程技术', code: '440301', level: '高职专科', score: 30 },
    { name: '建筑工程施工', code: '640301', level: '中职', score: 25 }
  ] } })
  const undergraduate = api.render('A', 'undergraduate')
  assert.ok(undergraduate.includes('082801'))
  for (const code of ['240301', '440301', '640301']) assert.ok(!undergraduate.includes(code))
  const vocational = api.render('A', 'vocational')
  assert.ok(!vocational.includes('082801'))
  for (const code of ['240301', '440301', '640301']) assert.ok(vocational.includes(code))
  assert.ok(vocational.includes('35.0%'))
  assert.equal((api.render('A').match(/class="portrait-major-match-card"/g) || []).length, 4)
})

test('empty level selection shows an empty state while all restores available matches', () => {
  const api = load({ A: { majors: [{ name: '建筑工程', code: '240301', level: '职业本科', score: 35 }] } })
  const html = api.render('A', 'undergraduate')
  assert.ok(html.includes('暂无'))
  assert.ok(!html.includes('240301'))
  assert.ok(api.render('A', 'all').includes('240301'))
})

test('static portrait dialog consumes the shared calculated data instead of legacy major tags', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const code = html.slice(html.indexOf('const showStaticPortraitDialog ='), html.indexOf('const showStaticCertificateDialog ='))
  const root = {}
  vm.runInNewContext(fs.readFileSync(new URL('../src/data/portrait-major-matches.js', import.meta.url), 'utf8'), root)
  vm.runInNewContext(fs.readFileSync(new URL('../src/utils/portrait-major-matching.js', import.meta.url), 'utf8'), root)
  vm.runInNewContext(fs.readFileSync(new URL('../src/data/portrait-distribution-map.js', import.meta.url), 'utf8'), root)
  vm.runInNewContext(fs.readFileSync(new URL('../src/utils/portrait-job-distribution.js', import.meta.url), 'utf8'), root)
  let rendered = ''
  const render = vm.runInNewContext(code + '\nshowStaticPortraitDialog', {
    window: root,
    staticJobGroupsEnabled: () => true,
    staticEscapeText: value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
    getStaticPortraitDetail: () => ({ name: 'BIM建模工程师', tags: [], abilities: {}, certificates: [], companies: [], majors: ['旧示例专业'] }),
    staticBusinessPanel: () => '', staticPortraitBusinessJobs: () => [], staticCourses: [],
    staticPortraitTaskCardsHtml: () => '', appendStaticDialog: value => { rendered = value }
  })
  render('job-bim-modeler')
  assert.ok(rendered.includes('智能建造技术'))
  assert.ok(rendered.includes('440304'))
  assert.match(rendered, /匹配度[\s\S]*\d+\.\d%/)
  assert.ok(!rendered.includes('旧示例专业'))
  assert.ok(!rendered.includes('岗位画像补充测算'))
})
