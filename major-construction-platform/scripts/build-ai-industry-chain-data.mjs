import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const resultsDir = process.env.AI_CHAIN_RESULTS_DIR
  ?? '/Users/liuhongzhe/Desktop/产业链整理结果'
const enterpriseDir = process.env.AI_CHAIN_ENTERPRISE_DIR
  ?? '/Users/liuhongzhe/Desktop/2025年最新产业链企业相关数据'

const clean = (value) => {
  const text = String(value ?? '').replace(/^\uFEFF/, '').trim()
  return ['-', '--', '暂无', 'None', '#N/A', '#VALUE!', '#REF!', '#DIV/0!', '#NAME?', '#NUM!', '#NULL!'].includes(text)
    ? ''
    : text
}

const identityName = (value) => {
  const text = clean(value)
  if (!/^[+-]?\d+(?:\.\d+)?E[+-]?\d+$/i.test(text)) return text
  const numericValue = Number(text)
  return Number.isFinite(numericValue) ? String(numericValue) : text
}

const sourceSpecs = [
  {
    name: '人工智能',
    prefix: 'ai',
    workbook: path.join(enterpriseDir, '人工智能产业链企查查', '人工智能产业链.xlsx'),
    hierarchySheet: '人工智能',
    informationSheet: '基础信息',
    hierarchyName: '公司名称',
    hierarchyCode: 'ID',
    informationName: '原文件导入名称',
    informationCode: '统一社会信用代码',
  },
  {
    name: '智能视觉',
    prefix: 'vision',
    workbook: path.join(enterpriseDir, '智能视觉', '智能视觉产业链汇总.xlsx'),
    hierarchySheet: '智能视觉产业链',
    informationSheet: '匹配信息',
    hierarchyName: '公司名称',
    hierarchyCode: 'ID',
    informationName: '公司名称',
    informationCode: '统一社会信用代码',
  },
  {
    name: '智能语音识别',
    prefix: 'speech',
    workbook: path.join(enterpriseDir, '智能语音识别', '智能语音识别产业链汇总.xlsx'),
    hierarchySheet: '智能语音识别产业链',
    informationSheet: '匹配信息',
    hierarchyName: '公司名称',
    hierarchyCode: 'ID',
    informationName: '公司名称',
    informationCode: '统一社会信用代码',
  },
]

const stageKeyByLabel = {
  上游: 'upstream',
  中游: 'midstream',
  下游: 'downstream',
}

const stageForRecord = (source, row) => {
  if (source === '人工智能') return clean(row['产业位置'])
  if (source === '智能视觉') {
    return clean(row['二级分类']) === '智能视觉终端设备' ? '下游' : '中游'
  }
  return ['语音识别相关产品', '语音识别解决方案'].includes(clean(row['二级分类']))
    ? '下游'
    : '中游'
}

const rowsFromSheet = (workbook, sheetName) => {
  const worksheet = workbook.Sheets[sheetName]
  if (!worksheet) throw new Error(`缺少工作表：${sheetName}`)
  const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false })
  const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true })
  const headers = (matrix[0] ?? []).map(clean)

  return matrix.slice(1)
    .filter((row) => row.some((value) => clean(value)))
    .map((row, rowIndex) => {
      const rawRow = rawMatrix[rowIndex + 1] ?? []
      const record = {}
      headers.forEach((header, index) => {
        if (!header || header in record) return
        const formattedValue = row[index] ?? ''
        const rawValue = rawRow[index] ?? ''
        record[header] = typeof rawValue === 'number' && /^[+-]?\d+(?:\.\d+)?E[+-]?\d+$/i.test(String(formattedValue))
          ? String(rawValue)
          : formattedValue
      })
      return record
    })
}

const sourceData = sourceSpecs.map((spec) => {
  const workbook = XLSX.readFile(spec.workbook, { cellDates: false })
  return {
    ...spec,
    hierarchyRows: rowsFromSheet(workbook, spec.hierarchySheet),
    informationRows: rowsFromSheet(workbook, spec.informationSheet),
  }
})

const allIdentityRecords = sourceData.flatMap((source) => [
  ...source.hierarchyRows.map((row) => ({
    creditCode: clean(row[source.hierarchyCode]),
    name: identityName(row[source.hierarchyName]),
  })),
  ...source.informationRows.map((row) => ({
    creditCode: clean(row[source.informationCode]),
    name: identityName(row[source.informationName]),
  })),
])

const nameToCode = new Map()
allIdentityRecords.forEach(({ creditCode, name }) => {
  if (!creditCode || !name) return
  if (!nameToCode.has(name)) nameToCode.set(name, new Set())
  nameToCode.get(name).add(creditCode)
})

const entityKey = ({ creditCode, name }) => {
  if (creditCode) return `id:${creditCode}`
  const codes = nameToCode.get(name)
  return codes?.size === 1 ? `id:${[...codes][0]}` : `name:${name}`
}

const entities = new Map()
const sourceEntityKeys = new Map(sourceSpecs.map((source) => [source.name, new Set()]))
const hierarchyEntityKeys = new Map(sourceSpecs.map((source) => [source.name, new Set()]))
const informationEntityKeys = new Map(sourceSpecs.map((source) => [source.name, new Set()]))
const nodeMap = new Map()

const ensureEntity = (key, creditCode, name) => {
  if (!entities.has(key)) {
    entities.set(key, {
      key,
      name: '',
      creditCode: '',
      province: '',
      city: '',
      district: '',
      address: '',
      scale: '',
      status: '',
      finance: '',
      sources: new Set(),
      stages: new Set(),
      nodeIds: new Set(),
      nodeNames: new Set(),
      classificationPaths: new Set(),
    })
  }
  const entity = entities.get(key)
  if (!entity.creditCode && creditCode) entity.creditCode = creditCode
  if (!entity.name && name) entity.name = name
  return entity
}

const assignFirst = (entity, field, ...values) => {
  if (entity[field]) return
  entity[field] = values.map(clean).find(Boolean) ?? ''
}

const classificationPath = (row) => [
  '一级分类',
  '二级分类',
  '三级分类',
  '四级分类',
  '五级分类',
  '六级分类',
  '七级分类',
  '八级分类',
].map((field) => clean(row[field])).filter(Boolean)

for (const source of sourceData) {
  for (const row of source.informationRows) {
    const creditCode = clean(row[source.informationCode])
    const name = identityName(row[source.informationName])
    if (!creditCode && !name) continue
    const key = entityKey({ creditCode, name })
    const entity = ensureEntity(key, creditCode, name)
    entity.sources.add(source.name)
    sourceEntityKeys.get(source.name).add(key)
    informationEntityKeys.get(source.name).add(key)
    assignFirst(entity, 'province', row['所属省份'])
    assignFirst(entity, 'city', row['所属城市'])
    assignFirst(entity, 'district', row['所属区县'])
    assignFirst(entity, 'address', row['企业地址'], row['注册地址'], row['最新年报地址'], row['通信地址'])
    assignFirst(entity, 'scale', row['企业规模'])
    assignFirst(entity, 'status', row['登记状态'])
  }

  for (const row of source.hierarchyRows) {
    const creditCode = clean(row[source.hierarchyCode])
    const name = identityName(row[source.hierarchyName])
    const pathParts = classificationPath(row)
    const nodeName = source.name === '人工智能'
      ? clean(row['产业链节点'])
      : pathParts.at(-1) ?? ''
    const stageLabel = stageForRecord(source.name, row)
    const stage = stageKeyByLabel[stageLabel]
    const nodeId = nodeName && stage ? `${source.prefix}:${nodeName}` : ''

    if (nodeId && !nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, {
        id: nodeId,
        name: nodeName,
        source: source.name,
        stage,
        standardNodeId: stage === 'upstream' ? 'node-043' : stage === 'midstream' ? 'node-044' : 'node-045',
        companies: new Set(),
      })
    }
    if (!creditCode && !name) continue

    const key = entityKey({ creditCode, name })
    const entity = ensureEntity(key, creditCode, name)

    entity.sources.add(source.name)
    sourceEntityKeys.get(source.name).add(key)
    hierarchyEntityKeys.get(source.name).add(key)
    assignFirst(entity, 'finance', row['融资上市'], row['资质'])

    if (stage) entity.stages.add(stage)
    if (pathParts.length) entity.classificationPaths.add(pathParts.join(' > '))
    if (!nodeId) continue

    entity.nodeIds.add(nodeId)
    entity.nodeNames.add(nodeName)
    nodeMap.get(nodeId).companies.add(key)
  }
}

const browserCompanies = [...entities.values()]
  .map((entity) => ({
    id: entity.key,
    name: entity.name,
    creditCode: entity.creditCode,
    province: entity.province,
    city: entity.city,
    district: entity.district,
    address: entity.address,
    scale: entity.scale,
    status: entity.status,
    finance: entity.finance,
    sources: [...entity.sources].sort((left, right) => left.localeCompare(right, 'zh-CN')),
    stages: [...entity.stages].sort(),
    nodeIds: [...entity.nodeIds].sort(),
    nodeNames: [...entity.nodeNames].sort((left, right) => left.localeCompare(right, 'zh-CN')),
    classificationPaths: [...entity.classificationPaths].sort((left, right) => left.localeCompare(right, 'zh-CN')),
    mappingStatus: entity.nodeIds.size ? 'mapped' : 'pending',
  }))
  .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN') || left.id.localeCompare(right.id))

const stageOrder = ['upstream', 'midstream', 'downstream']
const nodes = [...nodeMap.values()]
  .map((node) => ({
    id: node.id,
    name: node.name,
    source: node.source,
    stage: node.stage,
    standardNodeId: node.standardNodeId,
    companyCount: node.companies.size,
  }))
  .sort((left, right) => (
    stageOrder.indexOf(left.stage) - stageOrder.indexOf(right.stage)
    || right.companyCount - left.companyCount
    || left.name.localeCompare(right.name, 'zh-CN')
  ))

const buildSankey = ({ companies, detailNodes, limitPerStage = 8 }) => {
  const nodeById = new Map(detailNodes.map((node) => [node.id, node]))
  const nodeToBucket = new Map()
  const bucketMeta = new Map()

  stageOrder.forEach((stage) => {
    const stageNodes = detailNodes.filter((node) => node.stage === stage)
    const leadingNodes = stageNodes.slice(0, limitPerStage)
    const leadingIds = new Set(leadingNodes.map((node) => node.id))

    leadingNodes.forEach((node) => {
      nodeToBucket.set(node.id, node.id)
      bucketMeta.set(node.id, {
        id: node.id,
        name: node.name,
        stage,
        companyIds: new Set(),
      })
    })

    if (stageNodes.length > leadingNodes.length) {
      const otherId = `${stage}:other`
      bucketMeta.set(otherId, {
        id: otherId,
        name: `其他${stageNodes.length - leadingNodes.length}个节点`,
        stage,
        companyIds: new Set(),
      })
      stageNodes.forEach((node) => {
        if (!leadingIds.has(node.id)) nodeToBucket.set(node.id, otherId)
      })
    }
  })

  const linkCounts = new Map()
  const adjacentStages = [
    ['upstream', 'midstream'],
    ['midstream', 'downstream'],
  ]

  companies.forEach((company) => {
    const bucketsByStage = new Map(stageOrder.map((stage) => [stage, new Set()]))
    company.nodeIds.forEach((nodeId) => {
      const detailNode = nodeById.get(nodeId)
      const bucketId = nodeToBucket.get(nodeId)
      if (!detailNode || !bucketId) return
      bucketsByStage.get(detailNode.stage).add(bucketId)
      bucketMeta.get(bucketId).companyIds.add(company.id)
    })

    adjacentStages.forEach(([sourceStage, targetStage]) => {
      bucketsByStage.get(sourceStage).forEach((source) => {
        bucketsByStage.get(targetStage).forEach((target) => {
          const key = `${source}\u0000${target}`
          linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1)
        })
      })
    })
  })

  const sankeyNodes = [...bucketMeta.values()]
    .map((node) => ({
      id: node.id,
      name: node.name,
      stage: node.stage,
      value: node.companyIds.size,
    }))
    .filter((node) => node.value > 0)
    .sort((left, right) => (
      stageOrder.indexOf(left.stage) - stageOrder.indexOf(right.stage)
      || right.value - left.value
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
  const sankeyNodeIds = new Set(sankeyNodes.map((node) => node.id))
  const sankeyLinks = [...linkCounts.entries()]
    .map(([key, value]) => {
      const [source, target] = key.split('\u0000')
      return { source, target, value }
    })
    .filter((link) => link.value > 0 && sankeyNodeIds.has(link.source) && sankeyNodeIds.has(link.target))
    .sort((left, right) => right.value - left.value || left.source.localeCompare(right.source))

  return { nodes: sankeyNodes, links: sankeyLinks }
}

const sankey = buildSankey({ companies: browserCompanies, detailNodes: nodes })

const bundle = JSON.parse(readFileSync(path.join(resultsDir, 'industry_chain_stage_node_bundle.json'), 'utf8'))
const standardNodes = bundle.nodes.filter((item) => item.standard_chain === '人工智能产业链')
const standardByStage = new Map(standardNodes.map((item) => [stageKeyByLabel[item.stage], item]))
const stageCompanies = new Map(stageOrder.map((stage) => [
  stage,
  new Set(browserCompanies.filter((company) => company.stages.includes(stage)).map((company) => company.id)),
]))
const stages = stageOrder.map((stage) => {
  const standard = standardByStage.get(stage)
  return {
    id: standard.node_id,
    key: stage,
    label: standard.stage,
    name: standard.node_name,
    description: standard.node_description,
    companyCount: stageCompanies.get(stage).size,
    nodeCount: nodes.filter((node) => node.stage === stage).length,
  }
})

const provinceCounts = new Map()
browserCompanies.forEach((company) => {
  if (!company.province) return
  provinceCounts.set(company.province, (provinceCounts.get(company.province) ?? 0) + 1)
})
const provinces = [...provinceCounts.entries()]
  .map(([name, count]) => ({ name, count }))
  .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, 'zh-CN'))

const sourceMembershipCount = [...sourceEntityKeys.values()]
  .reduce((sum, keys) => sum + keys.size, 0)
const sourceReportedCount = bundle.original_direction_evidence
  .filter((item) => item.standard_chain === '人工智能产业链')
  .reduce((sum, item) => sum + Number(item.main_company_count_original || 0), 0)
const pendingCompanyCount = browserCompanies.filter((company) => company.mappingStatus === 'pending').length
const hierarchyOnlyCount = sourceSpecs.reduce((sum, source) => {
  const hierarchy = hierarchyEntityKeys.get(source.name)
  const information = informationEntityKeys.get(source.name)
  return sum + [...hierarchy].filter((key) => !information.has(key)).length
}, 0)
const informationOnlyCount = sourceSpecs.reduce((sum, source) => {
  const hierarchy = hierarchyEntityKeys.get(source.name)
  const information = informationEntityKeys.get(source.name)
  return sum + [...information].filter((key) => !hierarchy.has(key)).length
}, 0)

const result = {
  version: 1,
  meta: {
    chainName: '人工智能产业链',
    stageCount: stages.length,
    nodeCount: nodes.length,
    sourceCount: sourceSpecs.length,
    sourceReportedCount,
    sourceMembershipCount,
    companyCount: browserCompanies.length,
  },
  stages,
  nodes,
  sankey,
  companies: browserCompanies,
  provinces,
  quality: {
    pendingCompanyCount,
    missingProvinceCount: browserCompanies.filter((company) => !company.province).length,
    hierarchyOnlyCount,
    informationOnlyCount,
  },
}

const expected = {
  stageCount: 3,
  nodeCount: 109,
  sourceReportedCount: 33975,
  sourceMembershipCount: 33961,
  companyCount: 32403,
}
if (process.env.AI_CHAIN_DEBUG === '1') {
  console.log(JSON.stringify({
    sources: sourceSpecs.map((source) => ({
      name: source.name,
      hierarchy: hierarchyEntityKeys.get(source.name).size,
      information: informationEntityKeys.get(source.name).size,
      combined: sourceEntityKeys.get(source.name).size,
    })),
    nodeCount: result.meta.nodeCount,
    sourceMembershipCount: result.meta.sourceMembershipCount,
    companyCount: result.meta.companyCount,
  }, null, 2))
}
if (process.env.AI_CHAIN_DEBUG_KEYS) {
  writeFileSync(
    process.env.AI_CHAIN_DEBUG_KEYS,
    JSON.stringify(Object.fromEntries(sourceSpecs.map((source) => [source.name, {
      hierarchy: [...hierarchyEntityKeys.get(source.name)].sort(),
      information: [...informationEntityKeys.get(source.name)].sort(),
      combined: [...sourceEntityKeys.get(source.name)].sort(),
    }]))),
    'utf8',
  )
}
for (const [field, value] of Object.entries(expected)) {
  if (result.meta[field] !== value) {
    throw new Error(`数据完整性校验失败：${field} 期望 ${value}，实际 ${result.meta[field]}`)
  }
}

const outputFlagIndex = process.argv.indexOf('--output')
const outputPath = outputFlagIndex >= 0
  ? path.resolve(process.argv[outputFlagIndex + 1])
  : path.join(projectRoot, 'public', 'data', 'ai-industry-chain-data.js')
mkdirSync(path.dirname(outputPath), { recursive: true })
writeFileSync(
  outputPath,
  `window.__AI_INDUSTRY_CHAIN_DATA__ = Object.freeze(${JSON.stringify(result)});\n`,
  'utf8',
)

console.log(`${result.meta.stageCount} stages, ${result.meta.nodeCount} nodes, ${result.meta.companyCount} companies`)
