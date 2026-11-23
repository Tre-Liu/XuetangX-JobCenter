import test from 'node:test'
import assert from 'node:assert/strict'
import '../src/talent-plan/data.js'
import '../src/knowledge-domain/context.js'
import '../src/ability-dimension/model.js'
const model = globalThis.AbilityDimensionModel
const levels = ['核心能力','支撑能力','专项技能','操作要点','评价标准']
test('导入合并共享路径，保留同名异父节点和提前结束的分支', () => {
  assert.ok(model)
  const tree = model.fromSheet([levels,['识图','核对','标注'],['识图','核对','定位'],['建模','核对'],['建模'],['识图','核对','标注']])
  assert.deepEqual(model.paths(tree), [['识图','核对','标注'],['识图','核对','定位'],['建模','核对']])
  assert.equal(model.stats(tree).nodes,6)
})
test('导入逐行报告跨层、越界、错表头和空内容', () => {
  assert.ok(model)
  for (const row of [['A','','C'],['','B'],['A','B','C','D','E','F']]) {
    assert.throws(() => model.fromSheet([levels,[],row]), /第 3 行/)
  }
  assert.throws(() => model.fromSheet([['名称'],['A']]), /表头/)
  assert.throws(() => model.fromSheet([levels]), /至少/)
})
test('本地专业资料生成可分支的五层草稿，其他学校和专业不串用', () => {
  assert.ok(model)
  const ctx = model.context(new URL('file:///workspace/index.html'))
  const graph = model.localTree(ctx)
  assert.ok(graph.length >= 3)
  assert.equal(model.stats(graph).depth,5)
  assert.ok(model.paths(graph).some(p=>p.includes('BIM模型创建与校核')))
  for (const query of ['?majorName=护理','?schoolId=another','?workspaceId=another','?majorId=another']) {
    const other = model.context(new URL('file:///workspace/index.html'+query))
    assert.equal(model.localTree(other).length,0)
    assert.notEqual(ctx.scope,other.scope)
  }
})

test('AI 服务校验各层路径，拒绝不完整或越界的模型结果', async () => {
  const {handleAbilityDimensionRequest} = await import('../src/server/ability-dimension.js')
  const request = () => new Request('http://localhost/api/ability-dimension',{method:'POST',body:JSON.stringify({major:'护理',focus:'关注安全',skills:[],courses:[]})})
  const env = {OPENAI_API_KEY:'unit-test'}
  const provider = result => async (_url, config) => {
    assert.match(JSON.parse(config.body).input,/护理/)
    return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({paths:result})}]}]})
  }
  const paths = [['临床护理','病情观察'],['临床护理','护理操作']]
  const response = await handleAbilityDimensionRequest(request(),env,provider(paths))
  assert.equal(response.status,200)
  assert.deepEqual((await response.json()).paths,paths)
  for (const rows of [[],[['A','','B']],[['1','2','3','4','5','6']]]) {
    assert.equal((await handleAbilityDimensionRequest(request(),env,provider(rows))).status,502)
  }
  assert.equal((await handleAbilityDimensionRequest(request(),{})).status,503)
})

test('本机中文模型可用时按编制重点生成，结束后释放会话', async () => {
  const options = []
  let destroyed = false
  const runtime = {
    availability: async config => {options.push(config); return 'available'},
    create: async config => {
      options.push(config)
      return {
        prompt: async (input, settings) => {
          assert.equal(JSON.parse(input).focus,'重点覆盖临床沟通')
          assert.equal(settings.responseConstraint.properties.paths.type,'array')
          return JSON.stringify({paths:[['临床沟通','沟通记录']]})
        },
        destroy() {destroyed = true},
      }
    },
  }
  assert.ok(model.browserAvailable)
  assert.equal(await model.browserAvailable(runtime),true)
  assert.equal(await model.browserAvailable({availability:async()=>'downloadable'}),false)
  const tree = await model.browserTree(runtime,{major:'护理',focus:'重点覆盖临床沟通',courses:[],skills:[]},new AbortController().signal)
  assert.deepEqual(model.paths(tree),[['临床沟通','沟通记录']])
  assert.deepEqual(options[0].expectedOutputs,options[1].expectedOutputs)
  assert.ok(destroyed)
})
