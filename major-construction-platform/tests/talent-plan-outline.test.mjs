import test from 'node:test'
import assert from 'node:assert/strict'
await import('../src/talent-plan/data.js')
await import('../src/talent-plan/model.js')
await import('../src/talent-plan/views.js')
const M=globalThis.TalentPlanModel,V=globalThis.TalentPlanViews
 test('built-in frameworks provide distinct editable structures',()=>{
 assert.equal(M.templates.length,10)
 const signatures=new Set(M.templates.map(t=>{const d=M.createDraft();d.templateId=t.id;d.level=t.level==='本科'?'职业本科':'高职专科';return JSON.stringify(M.chapterDefs(d))}))
 assert.equal(signatures.size,10)
 })
test('chapter edits survive reload, regeneration and export without losing removed content',()=>{
 const d=M.createDraft();d.chapters=M.generate(d);const original=d.chapters.goals
 const id=M.addChapter(d,'校企协同机制');d.chapters[id]='校企协同正文';d.editedChapterIds=[id]
 M.renameChapter(d,id,'协同育人');M.moveChapter(d,id,-1);M.removeChapter(d,'goals')
 assert.equal(d.chapters.goals,original)
 const saved=M.sanitize({version:1,draft:d,results:[]}).draft
 assert.ok(!M.chapterDefs(saved).some(c=>c.id==='goals'))
 assert.equal(M.chapterDefs(saved).at(-2).title,'协同育人')
 M.regenerate(saved);assert.equal(saved.chapters[id],'校企协同正文')
 const html=M.exportHtml(saved);assert.match(html,/协同育人/);assert.match(html,/校企协同正文/);assert.doesNotMatch(html,/<h2>\d+\. 培养目标<\/h2>/)
})
test('setup and editable document expose chapter management while archived documents do not',()=>{
 const d=M.createDraft();d.chapters=M.generate(d)
 const s={state:{draft:d,results:[]},queries:{},chapter:'goals',panel:'refs'}
 assert.match(V.setup(s),/data-tp="manage-chapters"/)
 assert.match(V.editor(s),/data-tp="manage-chapters"/)
 assert.doesNotMatch(V.editor({...s,viewResult:d}),/data-tp="manage-chapters"/)
})
