import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import '../src/employment/data.js'
import '../src/employment/model.js'
const D = globalThis.EmploymentData, M = globalThis.EmploymentModel

test('cohorts contain coherent, unique anonymous records', () => {
  assert.equal(D.records.length, 336)
  assert.equal(new Set(D.records.map(r => r.id)).size, 336)
  for (const year of ['2021','2022','2023']) {
    const s = M.summarize({year})
    assert.equal(s.status.reduce((n,r) => n+r.count,0), s.responses)
    assert.equal(s.regions.reduce((n,r) => n+r.count,0), s.employed)
    assert.equal(s.cities.reduce((n,r) => n+r.count,0), s.localCount)
    assert.ok(s.responses <= s.invited)
  }
})
test('default cohort has explicit denominators and known counts', () => {
  const s=M.summarize({year:'2023'})
  assert.equal(s.responses,120); assert.equal(s.employed,96)
  assert.equal(s.studying,16); assert.equal(s.localCount,52)
  assert.equal(s.settled.value,93.3); assert.equal(s.localRate.value,54.2)
  assert.equal(s.localRate.denominator,96)
  assert.equal(s.settled.denominator,120)
})
test('region filters narrow the employed population without changing questionnaire coverage', () => {
  const a=M.summarize({year:'2023',region:'inner'}), b=M.summarize({year:'2023',region:'outside'})
  assert.equal(a.employed,52); assert.equal(b.employed,44)
  assert.equal(a.responses,120); assert.equal(b.responses,120)
  assert.equal(a.localRate.value,54.2)
  assert.equal(a.jobs.reduce((n,r)=>n+r.count,0),52)
  assert.notEqual(a.income.value,b.income.value)
})
test('unsupported filters normalize and all-cohort rollup is additive', () => {
  assert.deepEqual(M.filters({year:'bad',region:'bad',page:'bad'}),{year:'2023',region:'all',page:'overview',city:''})
  const s=M.summarize({year:'all'}); assert.equal(s.responses,336); assert.equal(s.employed,276)
})
test('privacy suppression treats missing values and small samples honestly', () => {
  assert.equal(M.metric(3,5).value,null)
  assert.equal(M.metric(0,0).value,null)
  assert.equal(M.median([100,200,300,400]),250)
  assert.equal(M.median([]),null)
  assert.equal(M.summarize({year:'2023',city:'巴彦淖尔'}).cityIncome.value,null)
  assert.equal(M.summarize({year:'2023'}).cities.find(r=>r.name==='巴彦淖尔').value,null)
  assert.equal(M.summarize({year:'2023'}).cities.find(r=>r.name==='呼和浩特').value,48.1)
})
test('exports preserve provenance, active filters and denominators', () => {
  const archive=M.archive({year:'2023',region:'inner',page:'overview'})
  assert.equal(archive.provenance.kind,'synthetic')
  assert.equal(archive.provenance.verified,false)
  assert.equal(archive.filters.region,'inner')
  assert.equal(archive.records.length,120)
  assert.equal(archive.selectedRecordIds.length,52)
  assert.equal(archive.indicators.find(r=>r.key==='income').denominator,50)
  const csv=M.csv({year:'2023',page:'overview'})
  assert.ok(csv.startsWith('\uFEFF')); assert.match(csv,/分母/); assert.match(csv,/待核验/)
  assert.doesNotMatch(csv,/模拟数据|演示|demo/i)
})
test('page exports include the visible statistics and preserve city suppression', () => {
  const overview=M.csv({year:'2023',page:'overview'})
  assert.doesNotMatch(overview,/创业盈利比例/)
  const education=M.csv({year:'2023',page:'education'})
  for(const name of ['目标合理性','目标达成度','知识基础匹配','个人素质匹配','毕业生能力自评'])assert.ok(education.includes(name),name)
  const region=M.csv({year:'2023',page:'region',city:'巴彦淖尔',region:'outside'})
  assert.match(region,/区内月收入中位数/);assert.match(region,/区外月收入中位数/)
  assert.match(region,/巴彦淖尔.*月收入中位数/)
  assert.doesNotMatch(region,/1\.9%/)
  assert.equal(M.filters({page:'region',region:'outside'}).region,'all')
})
test('generated promotion counts agree with whether promotion happened', () => {
  for(const r of D.records.filter(r=>r.status==='在职'))assert.equal(r.promoted,r.promotionCount>0)
})
test('Vue, static entry and build assets share the employment module', () => {
  const app=readFileSync(new URL('../src/App.vue',import.meta.url),'utf8'),html=readFileSync(new URL('../index.html',import.meta.url),'utf8')
  for(const source of [app,html]){assert.match(source,/就业分析/);assert.match(source,/employment-analysis/);assert.match(source,/employment-page/)}
  for (const filename of ['data.js','model.js','views.js','element.js']) assert.ok(html.includes('./src/employment/'+filename))
  assert.match(readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8'),/employment/)
})
