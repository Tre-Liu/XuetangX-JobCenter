import test from 'node:test'
import assert from 'node:assert/strict'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/model.js')
await import('../src/talent-plan/richtext.js')
await import('../src/talent-plan/views.js')
const M=globalThis.TalentPlanModel,R=globalThis.TalentPlanRichText,V=globalThis.TalentPlanViews
const plan=()=>{const d=M.createDraft('standard');d.courseIds=[globalThis.TalentPlanData.courses[0].id];d.chapters=M.generate(d);return d}
test('course chapter displays selected curriculum as an escaped table with correct credit total',()=>{
 const d=plan();M.addCourse(d,{code:'NEW003',name:'结构<实践>',type:'专业必修',credits:'2',semester:'第3学期',college:'建筑学院'})
 const html=R.chapter(d,'courses')
 assert.match(html,/<table/);assert.match(html,/<th[^>]*>课程代码/);assert.match(html,/结构&lt;实践&gt;/);assert.match(html,/>5<\/td>/)
 const state={state:{draft:d,results:[]},queries:{},chapter:'courses',panel:'refs'}
 assert.match(V.editor(state),/<table/)
})
test('rich chapters persist independently of plain text and survive source replacement and regeneration correctly',()=>{
 const d=plan();d.chapterHtml={goals:'<p><strong>修订目标</strong></p>'};d.editedChapterIds=['goals'];d.chapters.goals='修订目标'
 const restored=M.load({getItem:()=>JSON.stringify({version:1,draft:d,results:[M.snapshot(d)]})})
 assert.equal(restored.draft.chapterHtml.goals,d.chapterHtml.goals)
 assert.equal(restored.results[0].chapterHtml.goals,d.chapterHtml.goals)
 M.regenerate(restored.draft);assert.equal(restored.draft.chapterHtml.goals,d.chapterHtml.goals)
 M.replaceSource(restored.draft,{text:'新方案'});assert.deepEqual(restored.draft.chapterHtml,{})
})
test('editor offers rich text controls instead of textarea and HTML export carries the curriculum table',()=>{
 const d=plan(),html=V.editor({state:{draft:d,results:[]},queries:{},chapter:'courses',panel:'refs',editing:true})
 assert.match(html,/contenteditable="true"/);assert.match(html,/字号/);assert.match(html,/插入表格/);assert.match(html,/插入图片/)
 assert.doesNotMatch(html,/<textarea[^>]*data-editor/)
 assert.match(M.exportHtml(d),/<table/)
})
