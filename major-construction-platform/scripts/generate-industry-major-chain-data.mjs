import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workbookPath = path.resolve(
  projectRoot,
  '../V1.0需求（2026.6.11）/官方数据/专业与产业链产业环节匹配结果.xlsx'
)
const clean = (value) => String(value ?? '').replace(/^\uFEFF/, '').trim()
const normalizeCode = (value) => {
  const text = clean(value).toUpperCase()
  const match = text.match(/^(\d+)([A-Z]*)$/)
  return match ? `${match[1].padStart(6, '0')}${match[2]}` : text
}
const majorKey = (sourceLevel, code) => `${sourceLevel}:${normalizeCode(code)}`
const chainId = (name) => `chain-${createHash('sha1').update(name).digest('hex').slice(0, 10)}`
const uiLevelFor = (sourceLevel) => sourceLevel === '普通本科' ? 'undergraduate' : 'vocational'

const workbook = XLSX.readFile(workbookPath, { cellDates: false })
const rows = (sheetName) => {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new Error(`缺少工作表：${sheetName}`)
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
}
const requireColumns = (sheetName, records, columns) => {
  const available = new Set(Object.keys(records[0] ?? {}))
  const missing = columns.filter((column) => !available.has(column))
  if (missing.length) throw new Error(`${sheetName}缺少字段：${missing.join('、')}`)
}

const majorSheetNames = ['本科专业匹配', '职业教育专业匹配']
const majorColumns = [
  '专业代码',
  '专业名称',
  '层次',
  '学科门类/专业大类',
  '专业类',
  '匹配状态',
  '未匹配/待研判原因',
]
const majorRows = majorSheetNames.flatMap((sheetName) => {
  const records = rows(sheetName)
  requireColumns(sheetName, records, majorColumns)
  return records
})
const majors = majorRows.map((record) => {
  const sourceLevel = clean(record['层次'])
  const code = normalizeCode(record['专业代码'])
  return {
    key: majorKey(sourceLevel, code),
    uiLevel: uiLevelFor(sourceLevel),
    sourceLevel,
    code,
    name: clean(record['专业名称']),
    category: clean(record['学科门类/专业大类']),
    majorCategory: clean(record['专业类']),
    matchStatus: clean(record['匹配状态']),
    noMatchReason: clean(record['未匹配/待研判原因']),
  }
})

const chainSheetName = '产业链环节字典'
const chainRows = rows(chainSheetName)
requireColumns(chainSheetName, chainRows, [
  '产业链',
  '阶段',
  '产业环节',
  '原始方向证据',
  '节点形成口径',
])
const chainsByName = new Map()
for (const record of chainRows) {
  const name = clean(record['产业链'])
  let chain = chainsByName.get(name)
  if (!chain) {
    chain = { id: chainId(name), name, stages: [] }
    chainsByName.set(name, chain)
  }
  chain.stages.push({
    stage: clean(record['阶段']),
    node: clean(record['产业环节']),
    sourceEvidence: clean(record['原始方向证据']),
    formationBasis: clean(record['节点形成口径']),
  })
}
const chains = [...chainsByName.values()]

const relationSheetName = '专业-产业链关系明细'
const relationRows = rows(relationSheetName)
requireColumns(relationSheetName, relationRows, [
  '专业代码',
  '层次',
  '关联序号',
  '关联类型',
  '产业链',
  '阶段',
  '产业环节',
  '置信度',
  '规则得分',
  '匹配依据',
  '关系说明',
])
const importedMajorsByKey = new Map(majors.map((major) => [major.key, major]))
const relations = relationRows.map((record) => {
  const sourceLevel = clean(record['层次'])
  const key = majorKey(sourceLevel, record['专业代码'])
  const importedMajor = importedMajorsByKey.get(key)
  const chainName = clean(record['产业链'])
  return {
    majorKey: importedMajor?.key ?? key,
    order: Number(clean(record['关联序号'])),
    relationType: clean(record['关联类型']),
    chainId: chainId(chainName),
    stage: clean(record['阶段']),
    node: clean(record['产业环节']),
    confidence: clean(record['置信度']),
    score: Number(clean(record['规则得分'])),
    evidence: clean(record['匹配依据']),
    description: clean(record['关系说明']),
  }
}).sort((left, right) => left.majorKey.localeCompare(right.majorKey) || left.order - right.order)

const assertCount = (label, actual, expected) => {
  if (actual !== expected) throw new Error(`${label}数量异常：期望${expected}，实际${actual}`)
}
assertCount('专业', majors.length, 2142)
assertCount('本科专业', majors.filter((major) => major.uiLevel === 'undergraduate').length, 840)
assertCount('职教专业', majors.filter((major) => major.uiLevel === 'vocational').length, 1302)
assertCount('产业链', chains.length, 19)
assertCount('产业环节', chains.reduce((sum, chain) => sum + chain.stages.length, 0), 57)
assertCount('确定关系', relations.length, 791)

const majorKeys = new Set(majors.map((major) => major.key))
const chainIds = new Set(chains.map((chain) => chain.id))
for (const relation of relations) {
  if (!majorKeys.has(relation.majorKey)) throw new Error(`关系引用未知专业：${relation.majorKey}`)
  if (!chainIds.has(relation.chainId)) throw new Error(`关系引用未知产业链：${relation.chainId}`)
}

const dataset = {
  stats: {
    majorCount: majors.length,
    undergraduateCount: majors.filter((major) => major.uiLevel === 'undergraduate').length,
    vocationalCount: majors.filter((major) => major.uiLevel === 'vocational').length,
    chainCount: chains.length,
    stageCount: chains.reduce((sum, chain) => sum + chain.stages.length, 0),
    relationCount: relations.length,
  },
  majors,
  chains,
  relations,
}

const serialized = JSON.stringify(dataset)
writeFileSync(
  path.join(projectRoot, 'src/data/industry-major-chain-data.ts'),
  `import type { IndustryMajorChainDataset } from '../app/industry-major-chain-types'\n\nexport const INDUSTRY_MAJOR_CHAIN_DATA: IndustryMajorChainDataset = ${serialized}\n`
)
const browserSource = `globalThis.INDUSTRY_MAJOR_CHAIN_DATA = ${serialized};\n`
writeFileSync(path.join(projectRoot, 'industry-major-chain-data.js'), browserSource)
mkdirSync(path.join(projectRoot, 'outputs'), { recursive: true })
writeFileSync(path.join(projectRoot, 'outputs/industry-major-chain-data.js'), browserSource)
