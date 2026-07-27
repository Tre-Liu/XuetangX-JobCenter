const asset = ({
  id,
  primaryValue,
  totalValue,
  status = id === 'recruitment' ? 'in_progress' : 'partial',
  sourceIds,
  supportingMetrics = [],
  details,
}) => ({
  id,
  label: id,
  primaryValue,
  ...(totalValue === undefined ? {} : {
    totalValue,
    ...(totalValue > 0 ? { coverageRate: primaryValue / totalValue } : {}),
  }),
  status,
  definition: `${id} test definition`,
  grain: `${id} test grain`,
  sourceIds,
  supportingMetrics,
  ...(details === undefined ? {} : { details }),
})

const source = (id, assetId, overrides = {}) => ({
  id,
  assetId,
  relativePath: `fixtures/${id}.${id === 'recruitmentManifests' ? 'json' : 'xlsx'}`,
  selectedCandidate: true,
  modifiedAt: '2026-07-26T00:00:00.000Z',
  grain: `${id} test grain`,
  status: id === 'recruitmentManifests' ? 'in_progress' : 'validated',
  notes: [],
  ...overrides,
})

export const validSnapshotFixture = {
  schemaVersion: 1,
  generatedAt: '2026-07-27T00:00:00.000Z',
  workspaceRootLabel: 'fixture',
  overallStatus: 'partial',
  assets: [
    asset({
      id: 'chains',
      primaryValue: 2,
      totalValue: 3,
      sourceIds: ['chainStandardization', 'chainCatalog'],
      details: {
        kind: 'name-list',
        label: '完整标准产业链名称',
        items: ['链A', '链B'],
      },
    }),
    asset({
      id: 'stages',
      primaryValue: 1,
      status: 'validated',
      sourceIds: ['stageNodes', 'detailedNodes'],
      supportingMetrics: [{ label: '10链精细节点', value: 3 }],
    }),
    asset({
      id: 'undergraduateMajors',
      primaryValue: 1,
      totalValue: 2,
      sourceIds: ['undergraduateMajorCatalog', 'undergraduateMajorMatches'],
      supportingMetrics: [
        { label: '待人工研判', value: 0 },
        { label: '未匹配', value: 1 },
        { label: '多产业链专业', value: 0 },
        { label: '产业链关系', value: 1 },
      ],
    }),
    asset({
      id: 'vocationalMajors',
      primaryValue: 2,
      totalValue: 3,
      sourceIds: ['vocationalMajorCatalog', 'vocationalMajorMatches'],
      supportingMetrics: [
        { label: '待人工研判', value: 1 },
        { label: '未匹配', value: 0 },
        { label: '多产业链专业', value: 1 },
        { label: '产业链关系', value: 3 },
      ],
    }),
    asset({
      id: 'industries',
      primaryValue: 2,
      totalValue: 3,
      status: 'validated',
      sourceIds: ['industryCatalog'],
      supportingMetrics: [{ label: '重复代码行', value: 1 }],
    }),
    asset({
      id: 'positions',
      primaryValue: 3,
      totalValue: 4,
      sourceIds: ['positionMatches'],
      supportingMetrics: [
        { label: '未匹配岗位', value: 1 },
        { label: '岗位—节点关系', value: 3 },
        { label: '高置信关系', value: 2 },
        { label: '建议复核关系', value: 1 },
      ],
    }),
    asset({
      id: 'recruitment',
      primaryValue: 8,
      totalValue: 10,
      sourceIds: ['recruitmentManifests'],
      supportingMetrics: [
        { label: '正式匹配招聘', value: 2 },
        { label: '中置信待复核', value: 3 },
        { label: '未匹配', value: 3 },
        { label: '当前批次', value: '2014, 2016' },
      ],
    }),
  ],
  recruitmentPipeline: {
    inputRows: 10,
    validUniqueRows: 8,
    duplicateRows: 1,
    invalidRows: 1,
    formallyMatchedJobs: 2,
    mediumReviewJobs: 3,
    unmatchedRows: 3,
    formalRelationCount: 2,
    completedYears: [2014, 2016],
  },
  sources: [
    source('chainStandardization', 'chains'),
    source('chainCatalog', 'chains'),
    source('stageNodes', 'stages'),
    source('detailedNodes', 'stages'),
    source('undergraduateMajorCatalog', 'undergraduateMajors'),
    source('undergraduateMajorMatches', 'undergraduateMajors'),
    source('vocationalMajorCatalog', 'vocationalMajors'),
    source('vocationalMajorMatches', 'vocationalMajors'),
    source('industryCatalog', 'industries'),
    source('positionMatches', 'positions'),
    source('recruitmentManifests', 'recruitment'),
  ],
  warnings: ['fixture warning'],
}

function invalidCase(name, mutate, error) {
  const snapshot = structuredClone(validSnapshotFixture)
  mutate(snapshot)
  return { name, snapshot, error }
}

const findAsset = (snapshot, id) =>
  snapshot.assets.find((candidate) => candidate.id === id)

export function snapshotContractViolationFixtures() {
  return [
    invalidCase(
      'non-canonical generation timestamp',
      (snapshot) => { snapshot.generatedAt = '2026-7-27' },
      /生成时间.*规范 ISO/,
    ),
    invalidCase(
      'blank workspace label',
      (snapshot) => { snapshot.workspaceRootLabel = '   ' },
      /工作区标签.*非空/,
    ),
    invalidCase(
      'unknown overall status',
      (snapshot) => { snapshot.overallStatus = 'unknown' },
      /总体状态.*unknown/,
    ),
    invalidCase(
      'non-integer primary count',
      (snapshot) => { findAsset(snapshot, 'stages').primaryValue = 1.5 },
      /产业环节.*主指标.*1\.5.*有限非负整数/,
    ),
    invalidCase(
      'missing required total',
      (snapshot) => {
        delete findAsset(snapshot, 'chains').totalValue
        delete findAsset(snapshot, 'chains').coverageRate
      },
      /产业链.*必须提供总数/,
    ),
    invalidCase(
      'unexpected total on denominator-free asset',
      (snapshot) => { findAsset(snapshot, 'stages').totalValue = 1 },
      /产业环节.*不得提供总数/,
    ),
    invalidCase(
      'coverage mismatch',
      (snapshot) => { findAsset(snapshot, 'undergraduateMajors').coverageRate = 0.75 },
      /高教（本科）.*覆盖率 0\.75.*主指标 1.*总数 2/,
    ),
    invalidCase(
      'non-canonical asset order',
      (snapshot) => { snapshot.assets.reverse() },
      /资产类型必须恰好为.*按此顺序/,
    ),
    invalidCase(
      'blank asset definition',
      (snapshot) => { findAsset(snapshot, 'chains').definition = ' ' },
      /产业链.*定义.*非空/,
    ),
    invalidCase(
      'unknown asset status',
      (snapshot) => { findAsset(snapshot, 'chains').status = 'unknown' },
      /产业链.*状态.*unknown/,
    ),
    invalidCase(
      'empty asset source IDs',
      (snapshot) => { findAsset(snapshot, 'chains').sourceIds = [] },
      /产业链.*来源 ID.*至少一个/,
    ),
    invalidCase(
      'wrong supporting metric label',
      (snapshot) => {
        findAsset(snapshot, 'industries').supportingMetrics[0].label = '其他'
      },
      /国标行业.*补充指标.*重复代码行/,
    ),
    invalidCase(
      'wrong supporting metric type',
      (snapshot) => {
        findAsset(snapshot, 'positions').supportingMetrics[1].value = '3'
      },
      /岗位.*岗位—节点关系.*"3".*有限非负整数/,
    ),
    invalidCase(
      'industry duplicate rows do not reconcile',
      (snapshot) => {
        findAsset(snapshot, 'industries').supportingMetrics[0].value = 0
      },
      /国标行业.*唯一代码 2.*重复代码行 0.*有效行 3/,
    ),
    invalidCase(
      'major categories do not reconcile',
      (snapshot) => {
        findAsset(snapshot, 'vocationalMajors').supportingMetrics[0].value = 0
      },
      /职教.*确定关联 2.*待人工研判 0.*未匹配 0.*总数 3/,
    ),
    invalidCase(
      'chain detail list length differs from the chain count',
      (snapshot) => { findAsset(snapshot, 'chains').details.items.pop() },
      /产业链.*完整名称数量 1.*标准产业链数量 2/,
    ),
    invalidCase(
      'chain detail list contains duplicate names',
      (snapshot) => { findAsset(snapshot, 'chains').details.items[1] = '链A' },
      /产业链.*完整名称.*唯一非空字符串/,
    ),
    invalidCase(
      'position relation classes exceed relations',
      (snapshot) => {
        findAsset(snapshot, 'positions').supportingMetrics[1].value = 2
      },
      /岗位.*高置信关系 2.*建议复核关系 1.*关系 2/,
    ),
    invalidCase(
      'recruitment formal relations trail matches',
      (snapshot) => { snapshot.recruitmentPipeline.formalRelationCount = 1 },
      /招聘.*正式关系 1.*正式匹配 2/,
    ),
    invalidCase(
      'recruitment asset diverges from pipeline',
      (snapshot) => { findAsset(snapshot, 'recruitment').primaryValue = 7 },
      /招聘资产.*有效唯一 7.*流水线 8/,
    ),
    invalidCase(
      'recruitment supporting metric diverges from pipeline',
      (snapshot) => {
        findAsset(snapshot, 'recruitment').supportingMetrics[1].value = 2
      },
      /招聘资产.*中置信待复核 2.*流水线 3/,
    ),
    invalidCase(
      'recruitment batch label diverges from completed years',
      (snapshot) => {
        findAsset(snapshot, 'recruitment').supportingMetrics[3].value = '2014—2016'
      },
      /招聘资产.*当前批次.*2014, 2016/,
    ),
    invalidCase(
      'recruitment completed year below four-digit bounds',
      (snapshot) => {
        snapshot.recruitmentPipeline.completedYears = [999]
        findAsset(snapshot, 'recruitment').supportingMetrics[3].value = '999'
      },
      /招聘完成年份.*1000.*9999/,
    ),
    invalidCase(
      'recruitment completed year above four-digit bounds',
      (snapshot) => {
        snapshot.recruitmentPipeline.completedYears = [10000]
        findAsset(snapshot, 'recruitment').supportingMetrics[3].value = '10000'
      },
      /招聘完成年份.*1000.*9999/,
    ),
    invalidCase(
      'duplicate source ID',
      (snapshot) => { snapshot.sources.push(structuredClone(snapshot.sources[0])) },
      /来源 ID.*唯一/,
    ),
    invalidCase(
      'absolute source path',
      (snapshot) => { snapshot.sources[0].relativePath = '/tmp/source.xlsx' },
      /来源.*相对规范路径/,
    ),
    invalidCase(
      'unselected source status row',
      (snapshot) => { snapshot.sources[0].selectedCandidate = false },
      /来源.*selectedCandidate.*true/,
    ),
    invalidCase(
      'invalid source modification timestamp',
      (snapshot) => { snapshot.sources[0].modifiedAt = 'yesterday' },
      /来源.*更新时间.*规范 ISO/,
    ),
    invalidCase(
      'asset source refers to a different asset',
      (snapshot) => {
        findAsset(snapshot, 'chains').sourceIds = ['stageNodes']
      },
      /产业链.*来源 stageNodes.*同资产来源/,
    ),
    invalidCase(
      'blank warning',
      (snapshot) => { snapshot.warnings = [''] },
      /警告.*非空字符串/,
    ),
  ]
}

export function currentBaselineFixture() {
  const snapshot = structuredClone(validSnapshotFixture)
  const assets = Object.fromEntries(snapshot.assets.map((item) => [item.id, item]))

  Object.assign(assets.chains, {
    primaryValue: 19,
    totalValue: 129,
    coverageRate: 19 / 129,
    details: {
      kind: 'name-list',
      label: '完整标准产业链名称',
      items: Array.from({ length: 19 }, (_, index) => `标准产业链${index + 1}`),
    },
  })
  assets.stages.primaryValue = 57
  assets.stages.supportingMetrics = [{ label: '10链精细节点', value: 1133 }]
  Object.assign(assets.undergraduateMajors, {
    primaryValue: 190,
    totalValue: 840,
    coverageRate: 190 / 840,
    supportingMetrics: [
      { label: '待人工研判', value: 161 },
      { label: '未匹配', value: 489 },
      { label: '多产业链专业', value: 21 },
      { label: '产业链关系', value: 216 },
    ],
  })
  Object.assign(assets.vocationalMajors, {
    primaryValue: 492,
    totalValue: 1302,
    coverageRate: 492 / 1302,
    supportingMetrics: [
      { label: '待人工研判', value: 282 },
      { label: '未匹配', value: 528 },
      { label: '多产业链专业', value: 68 },
      { label: '产业链关系', value: 575 },
    ],
  })
  Object.assign(assets.industries, {
    primaryValue: 1955,
    totalValue: 1956,
    coverageRate: 1955 / 1956,
    supportingMetrics: [{ label: '重复代码行', value: 1 }],
  })
  Object.assign(assets.positions, {
    primaryValue: 645,
    totalValue: 1356,
    coverageRate: 645 / 1356,
    supportingMetrics: [
      { label: '未匹配岗位', value: 711 },
      { label: '岗位—节点关系', value: 706 },
      { label: '高置信关系', value: 157 },
      { label: '建议复核关系', value: 175 },
    ],
  })
  Object.assign(assets.recruitment, {
    primaryValue: 239149,
    totalValue: 240034,
    coverageRate: 239149 / 240034,
    supportingMetrics: [
      { label: '正式匹配招聘', value: 19297 },
      { label: '中置信待复核', value: 55378 },
      { label: '未匹配', value: 164474 },
      { label: '当前批次', value: '2014—2016' },
    ],
  })
  Object.assign(snapshot.recruitmentPipeline, {
    inputRows: 240034,
    validUniqueRows: 239149,
    duplicateRows: 53,
    invalidRows: 832,
    formallyMatchedJobs: 19297,
    mediumReviewJobs: 55378,
    unmatchedRows: 164474,
    formalRelationCount: 19297,
    completedYears: [2014, 2015, 2016],
  })

  return snapshot
}
