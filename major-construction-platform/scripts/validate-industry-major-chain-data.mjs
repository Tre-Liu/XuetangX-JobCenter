const EXPECTED_TOTALS = Object.freeze({
  majorCount: 2142,
  undergraduateCount: 840,
  vocationalCount: 1302,
  chainCount: 19,
  stageCount: 57,
  relationCount: 791,
})

const SUPPORTED_SOURCE_LEVELS = new Set([
  '普通本科',
  '中等职业教育',
  '高等职业教育专科',
  '高等职业教育本科',
])
const SUPPORTED_UI_LEVELS = new Set(['undergraduate', 'vocational'])
const SUPPORTED_MATCH_STATUSES = new Set(['已匹配', '待人工研判', '未匹配'])
const SUPPORTED_STAGES = new Set(['上游', '中游', '下游'])

const fail = (failingClass, detail) => {
  throw new Error(`[${failingClass}] ${detail}`)
}

const actualTotals = (data) => ({
  majorCount: data.majors.length,
  undergraduateCount: data.majors.filter((major) => major.uiLevel === 'undergraduate').length,
  vocationalCount: data.majors.filter((major) => major.uiLevel === 'vocational').length,
  chainCount: data.chains.length,
  stageCount: data.chains.reduce((sum, chain) => sum + chain.stages.length, 0),
  relationCount: data.relations.length,
})

export const validateIndustryMajorChainDataset = (data) => {
  const majorsByKey = new Map()
  for (const major of data.majors) {
    if (majorsByKey.has(major.key)) fail('重复专业主键', major.key)
    if (!SUPPORTED_SOURCE_LEVELS.has(major.sourceLevel)) {
      fail('不支持的专业来源层次', `${major.key}：${major.sourceLevel}`)
    }
    if (!SUPPORTED_UI_LEVELS.has(major.uiLevel)) {
      fail('不支持的界面层次', `${major.key}：${major.uiLevel}`)
    }
    if (!SUPPORTED_MATCH_STATUSES.has(major.matchStatus)) {
      fail('不支持的匹配状态', `${major.key}：${major.matchStatus}`)
    }
    majorsByKey.set(major.key, major)
  }

  const chainsById = new Map()
  for (const chain of data.chains) {
    chainsById.set(chain.id, chain)
    for (const stage of chain.stages) {
      if (!SUPPORTED_STAGES.has(stage.stage)) {
        fail('不支持的产业阶段', `${chain.name}：${stage.stage}`)
      }
    }
  }

  const relationKeys = new Set()
  for (const relation of data.relations) {
    if (!Number.isFinite(relation.order) || !Number.isInteger(relation.order) || relation.order <= 0) {
      fail('无效关联序号', `${relation.majorKey}：${relation.order}`)
    }
    if (!Number.isFinite(relation.score) || relation.score < 0) {
      fail('无效规则得分', `${relation.majorKey}：${relation.score}`)
    }
    if (!SUPPORTED_STAGES.has(relation.stage)) {
      fail('不支持的产业阶段', `${relation.majorKey}：${relation.stage}`)
    }

    const major = majorsByKey.get(relation.majorKey)
    if (!major) fail('未知专业引用', relation.majorKey)
    const chain = chainsById.get(relation.chainId)
    if (!chain) fail('未知产业链引用', relation.chainId)
    if (major.matchStatus !== '已匹配') {
      fail('未匹配专业关系', `${relation.majorKey}：${major.matchStatus}`)
    }

    const relationKey = `${relation.majorKey}\u0000${relation.chainId}`
    if (relationKeys.has(relationKey)) {
      fail('重复专业产业链关系', `${relation.majorKey} / ${relation.chainId}`)
    }
    relationKeys.add(relationKey)

    const stageNodeExists = chain.stages.some((stage) =>
      stage.stage === relation.stage && stage.node === relation.node
    )
    if (!stageNodeExists) {
      fail('不存在的产业环节', `${relation.majorKey} / ${chain.name} / ${relation.stage} / ${relation.node}`)
    }
  }

  const totals = actualTotals(data)
  for (const [field, expected] of Object.entries(EXPECTED_TOTALS)) {
    if (totals[field] !== expected) {
      fail('审计总量', `${field} 期望 ${expected}，实际 ${totals[field]}`)
    }
    if (data.stats?.[field] !== totals[field]) {
      fail('审计总量', `${field} 统计值 ${data.stats?.[field]} 与实际 ${totals[field]} 不一致`)
    }
  }
}
