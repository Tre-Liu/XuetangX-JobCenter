import test from 'node:test'
import assert from 'node:assert/strict'
import {
  RESEARCH_SUMMARY_PAGE_KEYS,
  buildFallbackResearchSummary,
  createResearchSummaryContext,
} from '../src/app/research-summary-core.js'

const pagePayloads = {
  'industry-chain': {
    subject: '智能建造产业链',
    facts: [
      { label: '细分节点', value: 12, evidence: '覆盖上游、中游、下游' },
      { label: '企业样本', value: 12680, evidence: '当前页面样本' },
    ],
    groups: [{
      name: '产业节点',
      items: [
        { name: '建筑设计', stage: 'upstream', enterpriseCount: 186 },
        { name: 'BIM咨询与工程数字化服务', stage: 'midstream', enterpriseCount: 214 },
        { name: '智能施工', stage: 'downstream', enterpriseCount: 286 },
      ],
    }],
  },
  'industry-region': {
    subject: '智能建造产业链 / 辽宁',
    facts: [
      { label: '覆盖省份', value: 31, evidence: '当前页面省域样本' },
      { label: '重点城市', value: 18, evidence: '产业集聚城市' },
    ],
    groups: [{
      name: '区域排名',
      items: [{ name: '辽宁', count: 286 }, { name: '北京', count: 214 }, { name: '天津', count: 152 }],
    }],
  },
  'industry-policy': {
    subject: '智能建造产业链',
    facts: [
      { label: '政策数量', value: 9, evidence: '当前产业链全部政策' },
      { label: '政策层级', value: 2, evidence: '国家级、地方级' },
    ],
    groups: [{
      name: '政策条目',
      items: [
        { title: '推进智能建造与建筑工业化协同发展', level: '国家级', summary: '数字化、工业化、绿色化协同推进' },
        { title: '建筑业数字化转型行动方案', level: '地方级', summary: '推广BIM和智慧工地应用' },
      ],
    }],
  },
  'industry-company': {
    subject: '建筑数字化平台与工程服务链',
    facts: [
      { label: '企业库总量', value: 30, evidence: '当前页面企业资产数' },
      { label: '当前分类企业', value: 12, evidence: '当前分类' },
    ],
    groups: [{
      name: '代表企业',
      items: [
        { name: '甲企业', industry: 'BIM软件与工程数字化服务', products: '协同设计平台' },
        { name: '乙企业', industry: '智慧工地', products: '施工管理平台' },
        { name: '丙企业', industry: '建筑运维', products: '数字孪生运维平台' },
      ],
    }],
  },
  'professional-map': {
    subject: '智能建造工程专业',
    facts: [
      { label: '覆盖省份', value: 14, evidence: '当前专业布点排名样本' },
      { label: '布点最多省份', value: '广东', evidence: '42所' },
    ],
    groups: [
      { name: '省份布点', items: [{ province: '广东', count: 42 }, { province: '江苏', count: 35 }, { province: '山东', count: 28 }] },
      { name: '区域匹配', items: [{ region: '华南', industryShare: 28, majorShare: 18 }, { region: '东北', industryShare: 12, majorShare: 19 }] },
    ],
  },
  'professional-trend': {
    subject: '智能建造工程专业',
    facts: [
      { label: '全国开设院校', value: '356所', evidence: '较上期新增45所' },
      { label: '年度招生规模', value: '5.8万人', evidence: '同比增长8.4%' },
    ],
    groups: [{
      name: '历年开设',
      items: [{ year: 2019, count: 35 }, { year: 2021, count: 102 }, { year: 2023, count: 228 }, { year: 2025, count: 356 }],
    }],
  },
  'job-portrait': {
    subject: '智能建造工程岗位画像',
    facts: [
      { label: '岗位', value: '24个', evidence: '当前岗位画像库统计' },
      { label: '典型工作任务', value: '132项', evidence: '当前岗位画像库统计' },
      { label: '能力项', value: '1944项', evidence: '当前岗位画像库统计' },
    ],
    groups: [{
      name: '代表岗位',
      items: [
        { name: 'BIM建模工程师', level: '初级', demand: 80 },
        { name: '装配式建筑深化设计师', level: '中级', demand: 98 },
        { name: '智能建造施工技术员', level: '初级', demand: 116 },
        { name: '建筑机器人应用工程师', level: '中级', demand: 122 },
      ],
    }],
  },
  'job-demand': {
    subject: '智能建造工程岗位群',
    facts: [
      { label: '岗位样本', value: 12680, evidence: '变化 +18%' },
      { label: '平均薪资', value: '9K-16K', evidence: '变化 +12%' },
    ],
    groups: [
      { name: '热门岗位', items: [{ name: 'BIM深化设计工程师', demand: 96 }, { name: '智慧工地工程师', demand: 88 }] },
      { name: '高频技能', items: [{ name: 'BIM协同', value: 92 }, { name: '施工数据分析', value: 86 }] },
      { name: '近12月趋势', items: [{ month: '1月', value: 62 }, { month: '6月', value: 88 }, { month: '12月', value: 106 }] },
    ],
  },
  'job-forecast': {
    subject: '智能建造工程岗位群',
    facts: [
      { label: '技术方向', value: 8, evidence: '当前新技术方向总数' },
      { label: '新岗位', value: 8, evidence: '当前预测岗位总数' },
      { label: '高紧缺岗位', value: 5, evidence: '按页面紧缺度统计' },
    ],
    groups: [
      { name: '技术方向', items: [{ name: '建筑机器人', stage: '快速发展' }, { name: '数字孪生', stage: '规模应用' }] },
      { name: '新岗位', items: [{ name: '建筑机器人运维工程师', urgency: '高' }, { name: '数字孪生应用工程师', urgency: '高' }] },
      { name: '课程映射', items: [{ technology: '建筑机器人', course: '智能施工装备' }] },
    ],
  },
}

const makePageContext = (pageKey) => createResearchSummaryContext({
  pageKey,
  pageName: pageKey,
  ...pagePayloads[pageKey],
})

test('job portrait fallback interprets role evolution instead of restating KPIs', () => {
  const summary = buildFallbackResearchSummary(makePageContext('job-portrait'))
  assert.equal(summary.items.length, 4)
  assert.match(summary.items[0], /延伸|复合|协同/)
  assert.doesNotMatch(summary.items.slice(0, 3).join(''), /岗位为24|典型工作任务为132|能力项为1944/)
  assert.match(summary.items[3], /课程|实训|能力/)
})

test('all nine fallback summaries follow the conclusion-first four-part contract', () => {
  const judgmentMarkers = {
    'industry-chain': /贯通|协同|链条/,
    'industry-region': /集聚|梯度|核心区域/,
    'industry-policy': /导向|政策重点|转向/,
    'industry-company': /生态|协同|场景/,
    'professional-map': /匹配|集聚|布局/,
    'professional-trend': /扩张|调整|稳定/,
    'job-portrait': /延伸|复合|协同/,
    'job-demand': /增长|分化|需求/,
    'job-forecast': /催生|衍生|加速|演进/,
  }

  for (const pageKey of RESEARCH_SUMMARY_PAGE_KEYS) {
    const summary = buildFallbackResearchSummary(makePageContext(pageKey))
    assert.equal(summary.items.length, 4, pageKey)
    assert.match(summary.items[0], judgmentMarkers[pageKey], pageKey)
    assert.equal(summary.items.some((item) => /^(数量为|共有|统计显示|[^，。]{1,20}为\d)/.test(item)), false, pageKey)
    assert.doesNotMatch(summary.items.join(''), /[（(][^）)]*\d[^）)]*[）)]/, pageKey)
    assert.ok(summary.items.every((item) => item.length <= 140), pageKey)
  }
})

test('fallback title only shows the current subject', () => {
  const summary = buildFallbackResearchSummary(makePageContext('industry-chain'))
  assert.equal(summary.title, '智能建造产业链')
  assert.doesNotMatch(summary.title, /｜|结构分析/)
})

test('AI industry chain fallback gives business conclusions instead of data-governance process notes', () => {
  const context = createResearchSummaryContext({
    pageKey: 'industry-chain',
    pageName: '产业链图谱',
    subject: '人工智能产业链',
    facts: [
      { label: '去重企业', value: 32403, evidence: '按企业统一身份去重' },
      { label: '可解析来源关系', value: 34375, evidence: '关系量不等同于企业数' },
      { label: '待映射企业', value: 7, evidence: '保留在企业库' },
    ],
    groups: [
      {
        name: '产业阶段',
        items: [
          { name: '上游', stage: 'upstream', enterpriseCount: 10926 },
          { name: '中游', stage: 'midstream', enterpriseCount: 6487 },
          { name: '下游', stage: 'downstream', enterpriseCount: 16962 },
        ],
      },
      {
        name: '产业节点',
        items: [
          { name: '云计算服务', stage: 'upstream', enterpriseCount: 5302 },
          { name: '智能视觉算法', stage: 'midstream', enterpriseCount: 1473 },
          { name: '机器人', stage: 'downstream', enterpriseCount: 3435 },
        ],
      },
    ],
  })
  const summary = buildFallbackResearchSummary(context)
  const text = summary.items.slice(0, 3).join('')

  assert.match(summary.items[0], /结构完整|全链条/)
  assert.match(text, /下游.*(?:主导|主要|集中)/)
  assert.match(text, /中游.*(?:薄弱|短板|不足)/)
  assert.doesNotMatch(text, /标准化|去重|来源关系|可解析|待映射|保留口径|数据覆盖/)
  assert.doesNotMatch(text, /细分节点109|[（(][^）)]*\d[^）)]*[）)]/)
})

test('trend judgment changes when the current page series reverses direction', () => {
  const growing = makePageContext('professional-trend')
  const shrinking = createResearchSummaryContext({
    pageKey: 'professional-trend',
    pageName: '专业开设趋势',
    subject: '智能建造工程专业',
    facts: growing.facts,
    groups: [{ name: '历年开设', items: [{ year: 2022, count: 356 }, { year: 2023, count: 310 }, { year: 2024, count: 268 }] }],
  })

  assert.notEqual(
    buildFallbackResearchSummary(growing).items[0],
    buildFallbackResearchSummary(shrinking).items[0],
  )
})
