import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import assert from 'node:assert/strict'

const source = await readFile(new URL('../industry-major-chain-data.js', import.meta.url), 'utf8')
const context = { globalThis: {} }
vm.runInNewContext(source, context)
const auditedData = context.globalThis.INDUSTRY_MAJOR_CHAIN_DATA

const validate = async (data) => {
  const module = await import('../scripts/validate-industry-major-chain-data.mjs')
  return module.validateIndustryMajorChainDataset(data)
}
const clone = () => structuredClone(auditedData)
const rejectsClass = async (data, failingClass) => {
  await assert.rejects(() => validate(data), new RegExp(`\\[${failingClass}\\]`))
}

test('generator contract accepts the audited runtime dataset', async () => {
  await validate(clone())
})

test('generator contract rejects duplicate major keys', async () => {
  const data = clone()
  data.majors[1].key = data.majors[0].key
  await rejectsClass(data, '重复专业主键')
})

test('generator contract rejects unsupported source levels', async () => {
  const data = clone()
  data.majors[0].sourceLevel = '未知教育层次'
  await rejectsClass(data, '不支持的专业来源层次')
})

test('generator contract rejects unsupported UI levels', async () => {
  const data = clone()
  data.majors[0].uiLevel = 'postgraduate'
  await rejectsClass(data, '不支持的界面层次')
})

test('generator contract rejects unsupported match statuses', async () => {
  const data = clone()
  data.majors[0].matchStatus = '可能匹配'
  await rejectsClass(data, '不支持的匹配状态')
})

test('generator contract rejects unsupported dictionary stages', async () => {
  const data = clone()
  data.chains[0].stages[0].stage = '核心'
  await rejectsClass(data, '不支持的产业阶段')
})

test('generator contract rejects unsupported relation stages', async () => {
  const data = clone()
  data.relations[0].stage = '核心'
  await rejectsClass(data, '不支持的产业阶段')
})

test('generator contract rejects relations assigned to non-matched majors', async () => {
  const data = clone()
  const unmatchedMajor = data.majors.find((major) => major.matchStatus !== '已匹配')
  data.relations[0].majorKey = unmatchedMajor.key
  await rejectsClass(data, '未匹配专业关系')
})

test('generator contract rejects duplicate major and chain relations', async () => {
  const data = clone()
  data.relations[data.relations.length - 1] = structuredClone(data.relations[0])
  await rejectsClass(data, '重复专业产业链关系')
})

test('generator contract rejects non-finite relation order', async () => {
  const data = clone()
  data.relations[0].order = Number.NaN
  await rejectsClass(data, '无效关联序号')
})

test('generator contract rejects non-positive or fractional relation order', async () => {
  for (const order of [0, -1, 1.5]) {
    const data = clone()
    data.relations[0].order = order
    await rejectsClass(data, '无效关联序号')
  }
})

test('generator contract rejects non-finite relation score', async () => {
  const data = clone()
  data.relations[0].score = Number.POSITIVE_INFINITY
  await rejectsClass(data, '无效规则得分')
})

test('generator contract rejects negative relation score', async () => {
  const data = clone()
  data.relations[0].score = -1
  await rejectsClass(data, '无效规则得分')
})

test('generator contract rejects broken major references', async () => {
  const data = clone()
  data.relations[0].majorKey = '普通本科:999999'
  await rejectsClass(data, '未知专业引用')
})

test('generator contract rejects broken chain references', async () => {
  const data = clone()
  data.relations[0].chainId = 'chain-missing'
  await rejectsClass(data, '未知产业链引用')
})

test('generator contract rejects relation nodes absent from the referenced chain', async () => {
  const data = clone()
  data.relations[0].node = '不存在的产业环节'
  await rejectsClass(data, '不存在的产业环节')
})

test('generator contract rejects incorrect audited totals', async () => {
  const data = clone()
  data.majors.push({
    ...data.majors[0],
    key: '普通本科:999999',
    code: '999999',
    name: '审计外专业',
  })
  await rejectsClass(data, '审计总量')
})

test('generator contract rejects inconsistent generated statistics', async () => {
  const data = clone()
  data.stats.majorCount = 1
  await rejectsClass(data, '审计总量')
})
