import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [app, html, panel, bridge] = await Promise.all(['src/App.vue','index.html','src/industry-domain/business-panels.js','src/components/IndustryBusinessPanel.vue'].map(read))
test('both original portrait lists expose native sorting and group filters, with no independent workspace',()=>{
 for(const source of [app,html]) {
  assert.match(source,/岗位排序/); assert.match(source,/kind: 'group-overview'/); assert.match(source,/需求量从高到低/); assert.match(source,/专业匹配度从高到低/)
  assert.doesNotMatch(source,/industry-domain-explorer|IndustryDomainExplorer|industry-domain-jump/)
 }
 assert.match(panel,/按岗位群筛选/)
 assert.match(app,/IndustryDomain.filterJobs\(portraitBusinessJobs.value/)
 assert.match(html,/IndustryDomain.filterJobs\(staticPortraitBusinessJobs\(\)/)
})
test('job cards retain original portrait dialogs without the course calibration section',()=>{
 assert.match(app,/@click="openPortraitJobDialog\(job.id\)"/)
 assert.match(html,/data-static-portrait-job="\$\{job.id\}"/)
 assert.doesNotMatch(app,/kind: 'courses'/)
 assert.doesNotMatch(html,/kind: 'courses'/)
 assert.match(app,/group.label, group.items/)
 assert.match(html,/abilities: detail.abilities/)
})
test('requirements live in existing chain, region, forecast and recruitment flows',()=>{
 for(const kind of ['trends','applications','resource','recruitment']) for(const source of [app,html]) assert.ok(source.includes(`kind: '${kind}'`),kind)
 for(const source of [app,html]) assert.match(source,/按企业合作分类筛选/)
 assert.match(bridge,/industry-business-action/)
})
test('file entry remains syntactically valid and handlers are outside special-page branches',()=>{
 for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script)
 const handler=html.indexOf('const handleStaticBusinessAction')
 assert.ok(handler<html.indexOf("if (staticPageView === 'job-competency-map')"))
})
test('shared inline sections safely escape content and support both classic and module loading',()=>{
 assert.match(panel,/customElements.get\('industry-business'\)/)
 assert.match(panel,/window.removeEventListener\('portrait-industry-change'/)
 assert.match(panel,/M.validateRelations/)
 assert.match(panel,/URL.revokeObjectURL/)
 assert.match(panel,/esc\(r.company\)/)
 assert.doesNotMatch(panel,/<nav|role="tablist"/)
})
