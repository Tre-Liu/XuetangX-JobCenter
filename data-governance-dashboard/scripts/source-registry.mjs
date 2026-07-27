function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested)
    Object.freeze(value)
  }
  return value
}

export const SOURCE_REGISTRY = deepFreeze([
  {
    id: 'chainStandardization',
    assetId: 'chains',
    kind: 'csv',
    candidates: ['output/industry-chain-standardization/industry_chain_standardization_summary.csv'],
    required: true,
    requiredColumns: ['standard_chain'],
    grain: '标准产业链名称',
  },
  {
    id: 'chainCatalog',
    assetId: 'chains',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/中国产业链分类.xlsx'],
    sheet: '产业链-产业',
    required: true,
    requiredColumns: ['产业链'],
    grain: '源产业链名称',
  },
  {
    id: 'stageNodes',
    assetId: 'stages',
    kind: 'csv',
    candidates: ['output/industry-chain-stage-nodes/industry_chain_stage_nodes.csv'],
    required: true,
    requiredColumns: ['node_id', 'standard_chain', 'stage'],
    grain: '标准阶段环节ID',
  },
  {
    id: 'detailedNodes',
    assetId: 'stages',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/10个产业链节点汇总.xlsx'],
    sheet: '节点明细',
    required: true,
    requiredColumns: ['产业ID', '产业链名称', '节点编码'],
    grain: '精细产业节点编码',
  },
  {
    id: 'majorCatalog',
    assetId: 'majors',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/教育部官方专业目录-高等教育与职业教育-20260612.xlsx'],
    sheet: '全部专业',
    required: true,
    requiredColumns: ['专业名称', '专业编码'],
    grain: '专业编码',
  },
  {
    id: 'majorMatches',
    assetId: 'majors',
    kind: 'xlsx-summary',
    candidates: ['V1.0需求（2026.6.11）/官方数据/专业与产业链产业环节匹配结果.xlsx'],
    sheet: '说明与统计',
    required: true,
    grain: '专业匹配状态',
  },
  {
    id: 'industryCatalog',
    assetId: 'industries',
    kind: 'xlsx',
    candidates: ['V1.0需求（2026.6.11）/官方数据/国民经济行业分类_GBT4754-2017.xlsx'],
    sheet: '国民经济行业分类',
    required: true,
    requiredColumns: ['代码', '名称', '层级'],
    grain: '国民经济行业代码',
  },
  {
    id: 'positionMatches',
    assetId: 'positions',
    kind: 'xlsx-summary',
    candidates: ['V1.0需求（2026.6.11）/官方数据/岗位与产业节点关联表.xlsx'],
    sheet: '说明与统计',
    required: true,
    grain: '岗位编码',
  },
  {
    id: 'recruitmentManifests',
    assetId: 'recruitment',
    kind: 'manifest-directory',
    candidates: [
      'outputs/recruitment_position_matching/v1/manifests',
      '.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1/manifests',
    ],
    required: true,
    grain: '招聘记录',
  },
])
