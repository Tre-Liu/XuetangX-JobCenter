import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const context = {}
vm.runInNewContext(await readFile(new URL('../src/results-home/industry-model.js', import.meta.url), 'utf8'), context)
const model = context.ResultsIndustryModel

test('词频统计岗位描述中的每次提及，忽略能力档案和岗位标题', () => {
  const result = model.build({ jobs: [
    { id:'a', name:'机器人', jdText:'BIM建模，bim协同；BIM交付。工程识图。', abilities:[{name:'无人机', category:'技能'}] },
    { id:'b', name:'工程师', jdText:'BIM与工程识图。' }
  ] })
  assert.equal(result.words.find(w=>w.name==='BIM')?.value, 4)
  assert.equal(result.words.find(w=>w.name==='工程识图')?.value, 2)
  assert.deepEqual(Array.from(result.words.find(w=>w.name==='BIM').jobIds), ['a','b'])
  assert.equal(result.words.some(w=>w.name==='无人机'||w.name==='机器人'), false)
})

test('缺失JD不从任务与能力推造词频，英文关键词只匹配完整词', () => {
  assert.equal(model.build({ jobs:[{id:'a',name:'BIM',tasks:[{name:'BIM'}]}] }).words.length, 0)
  const result = model.build({ jobs:[{id:'a', jdText:'BIMx xBIM bim BIM。'}] })
  assert.equal(result.words.find(w=>w.name==='BIM')?.value, 2)
})

test('词云大词优先、字号随词频递增，全部词在画布内且互不重叠', () => {
  const words = [{name:'质量安全',value:48},{name:'BIM',value:24},{name:'智慧工地',value:12},
    ...Array.from({length:21},(_,i)=>({name:`技术方向${i}`,value:1+i%7}))]
  for (const width of [198,238,288,680]) {
    const placed = model.layoutWords(words, width, 520, (text,size)=>text.length*size)
    assert.equal(placed.length, words.length)
    assert.ok(placed[0].fontSize > placed[1].fontSize)
    assert.ok(placed[0].fontSize / Math.min(...placed.map(w=>w.fontSize)) > 1.8)
    for(const w of placed) {
      assert.ok(w.x>=0 && w.y>=0 && w.x+w.width<=width+.01 && w.y+w.height<=520+.01)
      for(const other of placed.filter(o=>o!==w)) {
        assert.ok(w.x+w.width<=other.x || other.x+other.width<=w.x || w.y+w.height<=other.y || other.y+other.height<=w.y)
      }
    }
  }
})
