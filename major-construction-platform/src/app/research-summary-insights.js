const cleanText = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()

const trimItem = (value) => cleanText(value).slice(0, 140)

const findFact = (context, ...labels) => context.facts.find((fact) => (
  labels.some((label) => fact.label === label || fact.label.includes(label))
))

const findGroup = (context, ...names) => context.groups.find((group) => (
  names.some((name) => group.name === name || group.name.includes(name))
))?.items ?? []

const itemName = (item) => cleanText(
  item?.name ?? item?.title ?? item?.province ?? item?.region ?? item?.technology ?? item?.label,
)

const itemText = (item) => cleanText(Object.values(item ?? {}).flat().join(' '))

const numericValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const match = cleanText(value).replaceAll(',', '').match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

const factEvidence = (fact) => {
  if (!fact?.label || fact.value === undefined || fact.value === '') return ''
  return `（${fact.label}${cleanText(fact.value)}）`
}

const firstEvidence = (context, ...labels) => (
  factEvidence(labels.length ? findFact(context, ...labels) : context.facts[0])
)

const rankedItems = (items) => [...items]
  .map((item, index) => ({
    item,
    index,
    value: numericValue(item?.count ?? item?.value ?? item?.enterpriseCount ?? item?.demand ?? item?.share),
  }))
  .sort((left, right) => (
    (right.value ?? Number.NEGATIVE_INFINITY) - (left.value ?? Number.NEGATIVE_INFINITY)
    || left.index - right.index
  ))
  .map(({ item }) => item)

const uniqueNames = (items, limit = 3) => [...new Set(items.map(itemName).filter(Boolean))].slice(0, limit)

const joinNames = (names) => {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join('、')}与${names.at(-1)}`
}

const seriesSignal = (items) => {
  const points = items
    .map((item) => ({
      label: cleanText(item?.year ?? item?.month ?? item?.date ?? item?.label),
      value: numericValue(item?.count ?? item?.value ?? item?.total ?? item?.amount),
    }))
    .filter((item) => item.value !== null)
  if (points.length < 2) return { direction: 'unknown', points }

  const first = points[0]
  const last = points.at(-1)
  const delta = last.value - first.value
  const tolerance = Math.max(Math.abs(first.value) * 0.03, 1)
  return {
    direction: delta > tolerance ? 'up' : delta < -tolerance ? 'down' : 'stable',
    first,
    last,
    points,
  }
}

const seriesEvidence = (signal, unit = '') => {
  if (!signal.first || !signal.last) return ''
  const firstLabel = signal.first.label ? `${signal.first.label}` : '期初'
  const lastLabel = signal.last.label ? `${signal.last.label}` : '当前'
  return `（${firstLabel}${signal.first.value}${unit}至${lastLabel}${signal.last.value}${unit}）`
}

const countBy = (values) => values.reduce((counts, value) => {
  if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  return counts
}, new Map())

const topCountName = (counts) => [...counts.entries()]
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-CN'))[0]?.[0] ?? ''

const keywordThemes = (items) => {
  const text = items.map(itemText).join(' ')
  const taxonomy = [
    ['数字化与BIM', /数字化|BIM|数据|平台|孪生/i],
    ['智能施工', /智能建造|智慧工地|智能施工|机器人|无人机/i],
    ['装配式与工业化', /装配|工业化|构件/i],
    ['绿色低碳', /绿色|低碳|节能|碳/i],
    ['标准与人才', /标准|规范|人才|教育|技能/i],
  ]
  return taxonomy.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
}

const roleDomains = (items) => {
  const text = items.map(itemText).join(' ')
  const taxonomy = [
    ['数字设计与BIM', /BIM|建模|参数化|深化设计/i],
    ['装配建造', /装配|构件|工业化/i],
    ['智能施工与现场管理', /施工|工地|测量|检测|质量|安全/i],
    ['智能装备与物联', /机器人|无人机|物联|IoT|设备集成/i],
    ['智慧运维与绿色低碳', /运维|能耗|碳|监测|绿色/i],
    ['工程数据与平台服务', /数据|平台|数字化|孪生/i],
  ]
  return taxonomy.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
}

const stageName = (value) => ({
  upstream: '上游',
  midstream: '中游',
  downstream: '下游',
  上游: '上游',
  中游: '中游',
  下游: '下游',
}[cleanText(value)] ?? cleanText(value))

const buildIndustryChainInsights = (context) => {
  const nodes = findGroup(context, '产业节点')
  const stages = [...new Set(nodes.map((item) => stageName(item.stage)).filter(Boolean))]
  const topNode = rankedItems(nodes)[0]
  const stageCounts = countBy(nodes.map((item) => stageName(item.stage)))
  const dominantStage = topCountName(stageCounts)
  const pending = findFact(context, '待映射')
  const fallbackEvidence = firstEvidence(context, '细分节点', '样本量')

  return {
    overall: stages.length >= 3
      ? `产业链已形成上游供给、中游服务与下游应用贯通的链条结构，发展重点正由单点能力走向跨环节协同${fallbackEvidence}。`
      : stages.length >= 2
        ? `产业链已覆盖多个关键环节，正在由局部集聚向上下游协同延伸${fallbackEvidence}。`
        : `产业链当前呈现重点环节集聚的发展特征，完整协同关系仍需结合更多节点数据判断${fallbackEvidence}。`,
    structure: topNode
      ? `产业资源更集中于${itemName(topNode)}${dominantStage ? `所在的${dominantStage}环节` : '等关键节点'}，关键服务节点承担连接供给与工程应用的枢纽作用。`
      : '现有数据能够识别产业重点方向，但关键节点之间的强弱关系仍需继续完善。',
    opportunity: numericValue(pending?.value) > 0
      ? `产业链主体框架已经形成，但仍有企业与细分节点关系待映射，后续需优先补齐薄弱环节${factEvidence(pending)}。`
      : '产业进一步升级的机会在于把设计、工程服务、施工交付与运维场景连成可复用的协同链路。',
  }
}

const buildIndustryRegionInsights = (context) => {
  const ranking = rankedItems(findGroup(context, '区域排名'))
  const names = uniqueNames(ranking, 3)
  const top = names[0]
  const coverage = firstEvidence(context, '覆盖省份', '重点区域')
  return {
    overall: top
      ? `产业空间布局呈现以${top}为核心、向其他区域梯度扩散的集聚格局${coverage}。`
      : `当前页面已呈现区域集聚与梯度分布特征，但核心区域仍需更多排名数据确认${coverage}。`,
    structure: names.length > 1
      ? `${joinNames(names)}构成当前产业承载的主要区域层级，头部地区在企业、项目和服务资源上具有更强集聚效应。`
      : '区域资源目前主要集中于少数承载地，产业协作网络仍有向周边城市扩展的空间。',
    opportunity: names.length > 1
      ? `头部区域适合深化产教协同，次级区域更适合围绕特色工程场景形成差异化合作入口。`
      : '当前机会在于围绕产业承载地建立稳定合作节点，并逐步补足区域间资源联动。',
  }
}

const buildIndustryPolicyInsights = (context) => {
  const policies = findGroup(context, '政策条目')
  const themes = keywordThemes(policies)
  const levels = [...new Set(policies.map((item) => cleanText(item.level)).filter(Boolean))]
  const latest = findFact(context, '最新发布日期')
  const implementation = policies.some((item) => /标准|示范|应用|推广|行动|试点/.test(itemText(item)))
  return {
    overall: themes.length >= 2
      ? `政策导向正由单项技术推广转向${joinNames(themes.slice(0, 3))}协同推进${factEvidence(latest)}。`
      : themes.length === 1
        ? `政策重点持续聚焦${themes[0]}，行业发展进入方向强化与应用转化并行阶段${factEvidence(latest)}。`
        : `政策体系已形成持续引导，但当前页面信息不足以判断更具体的主题演进${factEvidence(latest)}。`,
    structure: levels.length >= 2
      ? `国家与地方政策形成上下联动，既明确产业发展方向，也通过行动方案推动区域和项目落地。`
      : '现有政策主要由单一层级持续推动，跨层级配套和执行衔接仍是后续观察重点。',
    opportunity: implementation
      ? '政策重点已从方向倡导延伸到标准、示范和应用落地，课程标准与真实项目对接进入较明确的转化窗口。'
      : '政策要求仍以方向引导为主，专业建设需要持续跟踪后续标准、试点和应用任务。',
  }
}

const buildIndustryCompanyInsights = (context) => {
  const companies = findGroup(context, '代表企业')
  const domains = roleDomains(companies)
  const currentCount = findFact(context, '当前分类企业', '企业库总量')
  return {
    overall: domains.length >= 3
      ? `企业生态已由单一产品供给延伸至${joinNames(domains.slice(0, 3))}等多类工程场景，产业服务呈现平台化与协同化趋势${factEvidence(currentCount)}。`
      : domains.length > 0
        ? `企业资源当前主要围绕${joinNames(domains)}形成专业化集聚，并开始向相邻工程场景延伸${factEvidence(currentCount)}。`
        : `企业库已形成一定资源基础，但现有字段不足以判断技术场景之间的协同程度${factEvidence(currentCount)}。`,
    structure: companies.length >= 2
      ? '代表企业同时覆盖工具平台、工程实施与场景服务，产业竞争力更多取决于跨环节交付能力。'
      : '当前企业样本偏少，暂时只能识别主要业务方向，企业类型和产业环节分布仍需补充。',
    opportunity: domains.length >= 2
      ? '企业场景多样为校企合作提供了分层入口，但需要优先筛选岗位任务清晰、数据可教学和项目可复用的合作对象。'
      : '企业合作应先从可验证的岗位任务和项目成果切入，再逐步扩展到平台、师资和实训资源共建。',
  }
}

const buildProfessionalMapInsights = (context) => {
  const provinces = rankedItems(findGroup(context, '省份布点'))
  const matches = findGroup(context, '区域匹配')
  const top = provinces[0]
  const gaps = matches.map((item) => ({
    name: itemName(item),
    gap: (numericValue(item.industryShare ?? item.industry) ?? 0) - (numericValue(item.majorShare ?? item.major) ?? 0),
  })).sort((left, right) => right.gap - left.gap)
  const shortage = gaps.find((item) => item.gap > 0)
  const oversupply = [...gaps].reverse().find((item) => item.gap < 0)
  return {
    overall: top
      ? `专业布点呈现明显的区域集聚特征，头部省份正在形成专业供给高地（${itemName(top)}${numericValue(top.count ?? top.value) ?? ''}所）。`
      : `专业布点已覆盖多个区域，但现有排名数据不足以判断头部集聚程度${firstEvidence(context, '覆盖省份')}。`,
    structure: shortage && oversupply
      ? `${shortage.name}的产业需求相对专业供给更强，而${oversupply.name}的专业供给相对更集中，区域间存在结构性错位。`
      : '专业供给与产业承载并非完全同步，布点规模不能单独代表区域产教匹配质量。',
    opportunity: shortage
      ? `${shortage.name}等产业份额较高区域存在专业增量或合作办学机会，但需同步评估师资和实训承载能力。`
      : '后续优化重点不是简单增加布点，而是提升专业方向与当地产业场景、企业资源和岗位需求的匹配度。',
  }
}

const buildProfessionalTrendInsights = (context) => {
  const signal = seriesSignal(findGroup(context, '历年开设'))
  const evidence = seriesEvidence(signal, '所') || firstEvidence(context, '全国开设院校')
  const directionCopy = {
    up: `专业开设规模处于持续扩张阶段，人才培养供给正在加快形成${evidence}。`,
    down: `专业开设规模进入收缩与结构调整阶段，新增布局需要转向质量和适配度评估${evidence}。`,
    stable: `专业开设规模整体趋于稳定，发展重点正从数量扩张转向内涵建设${evidence}。`,
    unknown: `现有数据显示专业供给正在调整，但暂不足以确认扩张或收缩方向${evidence}。`,
  }
  return {
    overall: directionCopy[signal.direction],
    structure: signal.direction === 'up'
      ? '院校布点、招生和毕业供给同步进入增长通道，专业竞争将逐步从“是否开设”转向“培养质量与特色方向”。'
      : signal.direction === 'down'
        ? '专业供给开始分化，缺少产业支撑和办学条件的布点面临更高调整压力。'
        : '专业供给节奏趋稳，区域特色、课程更新和就业质量将成为后续分化的主要因素。',
    opportunity: signal.direction === 'up'
      ? '快速扩张带来人才增量，也可能放大师资、实训条件和区域产业承载之间的错位。'
      : '调整期为优化专业方向和淘汰低匹配课程提供窗口，应重点保留产业支撑明确的培养模块。',
  }
}

const buildJobPortraitInsights = (context) => {
  const jobs = findGroup(context, '代表岗位')
  const domains = roleDomains(jobs)
  const levels = countBy(jobs.map((item) => cleanText(item.level)).filter(Boolean))
  const dominantLevel = topCountName(levels)
  const abilities = findFact(context, '能力项')
  const firstDomain = domains[0]
  const expandedDomains = domains.slice(1, 4)
  return {
    overall: domains.length >= 3
      ? `岗位需求已由${firstDomain}延伸至${joinNames(expandedDomains)}等工程场景，呈现跨环节复合化发展。`
      : domains.length >= 2
        ? `岗位需求正在从${firstDomain}向${domains[1]}延伸，岗位边界由单一工具操作转向工程协同。`
        : `岗位画像显示岗位任务与数字技术结合持续加深，复合能力正成为岗位发展的主要方向${firstEvidence(context, '岗位')}。`,
    structure: dominantLevel
      ? `${dominantLevel}岗位构成当前主要就业入口，能力结构则由软件操作扩展到工程知识、数字工具与现场协同。`
      : '岗位能力已不再局限于单一软件操作，而是强调工程知识、数字工具、现场实施和跨专业协同。',
    opportunity: domains.length >= 3
      ? `智能装备、工程数据和全过程协同正在形成新的岗位增长点，人才培养需补足跨场景迁移能力${factEvidence(abilities)}。`
      : `岗位复合化提升了就业适配面，也暴露出课程内容与真实工作任务之间的衔接压力${factEvidence(abilities)}。`,
  }
}

const buildJobDemandInsights = (context) => {
  const trend = seriesSignal(findGroup(context, '近12月趋势'))
  const jobs = rankedItems(findGroup(context, '热门岗位'))
  const skills = rankedItems(findGroup(context, '高频技能'))
  const topJobs = uniqueNames(jobs, 2)
  const topSkills = uniqueNames(skills, 2)
  const trendEvidence = seriesEvidence(trend) || firstEvidence(context, '岗位样本')
  const directionCopy = {
    up: `招聘需求整体保持增长，市场正在持续释放数字化工程岗位机会${trendEvidence}。`,
    down: `招聘需求出现回落，岗位市场正从普遍扩张转向更强调经验和交付质量的结构性选择${trendEvidence}。`,
    stable: `招聘需求总体保持稳定，岗位竞争重点由数量变化转向技能匹配和场景经验${trendEvidence}。`,
    unknown: `当前招聘数据已呈现岗位需求分化，但趋势方向仍需结合连续时间序列判断${trendEvidence}。`,
  }
  return {
    overall: directionCopy[trend.direction],
    structure: topJobs.length || topSkills.length
      ? `${joinNames(topJobs)}构成需求较强的岗位入口，${joinNames(topSkills)}等能力成为招聘筛选的关键条件。`
      : '招聘需求正在从通用岗位转向任务和技能要求更清晰的专业化岗位。',
    opportunity: trend.direction === 'up'
      ? '需求增长为专业扩容提供依据，但岗位之间增长速度不同，应避免按总体增幅平均配置课程资源。'
      : '岗位需求分化要求培养方案提高更新频率，优先保障可迁移能力和高频技能训练。',
  }
}

const buildJobForecastInsights = (context) => {
  const directions = findGroup(context, '技术方向')
  const jobs = findGroup(context, '新岗位')
  const courses = findGroup(context, '课程映射')
  const directionNames = uniqueNames(directions, 3)
  const jobNames = uniqueNames(jobs, 2)
  const highUrgency = jobs.filter((item) => cleanText(item.urgency).includes('高'))
  const scaleEvidence = firstEvidence(context, '高紧缺岗位', '新岗位')
  const hasScalingStage = directions.some((item) => /规模|快速|成熟|增长/.test(itemText(item)))
  return {
    overall: hasScalingStage
      ? `新技术正由试点探索走向加速应用，并持续衍生新的工程岗位${scaleEvidence}。`
      : `技术演进正在催生新的岗位分工，产业能力边界由传统工程任务向数字化和智能化场景延伸${scaleEvidence}。`,
    structure: directionNames.length && jobNames.length
      ? `${joinNames(directionNames)}等技术方向正在对应形成${joinNames(jobNames)}等岗位，技术、任务与岗位分工的映射更加清晰。`
      : '新技术与岗位分工已经出现关联，但当前映射数据仍不足以判断主要技术路线。',
    opportunity: highUrgency.length > 0 || directions.length > courses.length
      ? '紧缺岗位增长快于课程承接速度，当前主要缺口在于师资更新、设备条件和跨技术综合实训。'
      : '现有课程已开始承接新技术方向，后续重点是用真实项目验证课程与岗位任务的匹配度。',
  }
}

const PAGE_STRATEGIES = {
  'industry-chain': buildIndustryChainInsights,
  'industry-region': buildIndustryRegionInsights,
  'industry-policy': buildIndustryPolicyInsights,
  'industry-company': buildIndustryCompanyInsights,
  'professional-map': buildProfessionalMapInsights,
  'professional-trend': buildProfessionalTrendInsights,
  'job-portrait': buildJobPortraitInsights,
  'job-demand': buildJobDemandInsights,
  'job-forecast': buildJobForecastInsights,
}

export const buildInterpretiveResearchSummary = (context, config) => {
  const strategy = PAGE_STRATEGIES[context.pageKey]
  if (!strategy) throw new Error(`Unsupported summary page: ${context.pageKey}`)
  const judgments = strategy(context)
  return {
    title: `${context.subject}${config.title}`.slice(0, 40),
    items: [
      judgments.overall,
      judgments.structure,
      judgments.opportunity,
      config.recommendation,
    ].map(trimItem),
  }
}

