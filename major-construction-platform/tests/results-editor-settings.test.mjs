import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'
const source=await readFile(new URL('../src/results-home/editor.js',import.meta.url),'utf8')
function api(value,unavailable=false){const context=vm.createContext({localStorage:{getItem(){if(unavailable)throw new Error('unavailable');return value}}});vm.runInContext(source,context);return context.ResultsPageEditor}
const plain=v=>JSON.parse(JSON.stringify(v))
test('unavailable or corrupt storage falls back to a usable dark page',()=>{
 for(const value of ['{','null','[]','42']) {const s=api(value).read();assert.equal(s.theme,'dark');assert.equal(s.nav.length,0);assert.equal(s.questions.length,3)}
 assert.equal(api('',true).read().layout,'launch')
})
test('persisted theme, editable text, order and hidden navigation survive reload',()=>{
 const stored={theme:'light',title:'智能建造',description:'专业建设资料',nav:[{id:'岗位中心',label:'岗位成果',visible:false},{id:'首页',label:'首页',visible:true}],dataSource:'training'}
 const s=api(JSON.stringify(stored)).read();assert.equal(s.theme,'light');assert.equal(s.title,stored.title);assert.deepEqual(plain(s.nav),stored.nav);assert.equal(s.dataSource,'training')
})
test('malformed settings cannot remove required editor structures or supply unknown modules',()=>{
 const s=api(JSON.stringify({theme:'bad',layout:'bad',nav:[null,{}, {id:'首页',label:'首页'}],modules:[{id:'unknown'}],questions:[{},'核心课程？'],title:{}})).read()
 assert.equal(s.theme,'dark');assert.equal(s.nav.length,1);assert.equal(s.modules.length,2);assert.equal(s.title,'');assert.equal(s.questions[1],'核心课程？');assert.equal(typeof s.questions[0],'string')
})
test('draft changes do not mutate defaults or a subsequent load',()=>{
 const a=api('{}'),draft=a.read();draft.modules[0].visible=false;draft.questions[0]='修改';assert.equal(a.read().modules[0].visible,true);assert.notEqual(a.read().questions[0],'修改')
})
