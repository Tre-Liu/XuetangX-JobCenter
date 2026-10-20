/* Shared demo domain metadata. Existing pages supply their own jobs, abilities and courses. */
;(function (root) {
  const chains = ['智能建造产业链', '人工智能产业链', '装配式建筑产业链', '建筑数字化服务链', '绿色低碳建造产业链']
  const industries = ['建筑业', '软件和信息技术服务业', '专用设备制造业']
  const definitions = [
    ['BIM深化设计与数字建模岗位群', 'BIM与数字孪生', ['上游', '中游'], ['建筑设计产业', 'BIM咨询与工程数字化服务产业'], [0, 3], 0, ['参数化构件', '模型碰撞检查'], ['模型协同', '碰撞问题闭环'], ['course-bim-basic', 'course-bim-app']],
    ['装配式设计生产岗位群', '装配式设计与制造', ['上游', '中游'], ['智能建材与部品部件产业', '装配式建筑产业'], [0, 2], 0, ['构件编码', '装配连接节点'], ['构件深化', '生产质量追溯'], ['course-prefab-design', 'course-prefab-production']],
    ['智能施工与机器人应用岗位群', '智能施工装备', ['中游', '下游'], ['建筑机器人与智能装备产业', '智能施工产业'], [0, 1, 2], 2, ['施工机器人定位', '作业路径规划'], ['设备调试', '人机协同施工'], ['course-robot', 'course-smart-construction']],
    ['智慧工地管理岗位群', '物联感知与工地协同', ['中游', '下游'], ['智慧工地平台产业', '智能施工产业'], [0, 1, 3], 1, ['物联网协议', '工地数字看板'], ['传感接入', '施工进度分析'], ['course-iot-site', 'course-smart-project']],
    ['智能检测监测岗位群', '智能检测与质量安全', ['上游', '下游'], ['质量检测与试验检测产业', '建筑质量安全监管产业'], [0, 1, 4], 2, ['结构监测指标', '机器视觉缺陷识别'], ['监测数据分析', '异常复核'], ['course-monitoring', 'course-quality-safety']],
    ['智能测绘与数据采集岗位群', '空间信息与数字测绘', ['上游'], ['工程勘察测绘产业'], [0, 3], 1, ['点云配准', '空间坐标基准'], ['三维重建', '测量成果检核'], ['course-smart-survey', 'course-bim-basic']],
    ['绿色建造与智慧运维岗位群', '建筑节能与智慧运维', ['下游'], ['绿色建筑与低碳运维产业', '城市更新与基础设施运维产业'], [0, 4], 0, ['建筑能耗指标', '碳排放边界'], ['能耗诊断', '运维优化'], ['course-green-ops', 'course-iot-site']],
    ['建筑数据治理与平台实施岗位群', '工程数据治理', ['上游', '中游'], ['工程软件与数据服务产业', '建筑装备与传感器产业', '工程总承包与项目管理产业'], [0, 1, 3], 1, ['数据质量规则', '工程数据标准'], ['数据清洗', '平台配置与交付'], ['course-bim-basic', 'course-smart-project']]
  ]
  const applications = [
    ['协同设计', 0, '二维图纸协作', '多专业模型协同与碰撞检查', '工程数字孪生设计审查', '降低跨专业信息错漏，形成可追踪的设计问题清单。'],
    ['构件智造', 1, '工厂单工序记录', '构件编码、排产与质量追溯', '设计生产施工一体化', '将设计参数传递到构件生产和现场装配。'],
    ['机器人施工', 2, '人工重复性施工', '设备辅助施工与人机协同', '多设备协同作业', '以作业质量和安全边界评价装备应用效果。'],
    ['智慧工地', 3, '人工填报台账', '现场感知与进度安全联动', '多源数据辅助项目决策', '把施工现场问题转为可验证的数据任务。'],
    ['结构健康监测', 4, '定期人工巡检', '连续监测与缺陷识别', '风险预警与维护计划联动', '培养异常识别、复核和处置记录能力。'],
    ['空间数据服务', 5, '现场测量绘图', '点云采集与三维重建', '实景与工程模型融合', '保证现场空间数据的精度与可复用性。'],
    ['低碳运维', 6, '分散抄表和设备维护', '能耗监测与运行诊断', '建筑全生命周期碳管理', '连接节能目标、运行数据和改进措施。'],
    ['工程数据服务', 7, '分散电子资料', '数据标准与平台集成', '工程数据资产治理', '提升工程数据一致性、追溯性和交付质量。']
  ].map(([name, groupIndex, history, current, future, value]) => ({ name, groupIndex, history, current, future, value }))
  const trends = [
    { id: 'trend-building', industry: industries[0], title: '从单点数字化走向设计、生产、施工协同', stage: '上游 → 中游 → 下游', groupIndexes: [0, 1, 6], summary: '以模型、构件编码和运行数据串联项目全生命周期。', evidence: '教学案例：同一构件从深化设计、生产检验到现场安装的交付记录。', impact: '岗位训练需要覆盖跨环节信息交付；课程可增加构件编码一致性检查和变更记录任务。' },
    { id: 'trend-software', industry: industries[1], title: '工程平台从信息汇总转向数据协同', stage: '上游 → 中游', groupIndexes: [3, 5, 7], summary: '将现场感知、空间数据和管理流程组织为可复用服务。', evidence: '教学案例：智慧工地传感数据经清洗后接入项目看板。', impact: '加强数据质量检查、接口配置、权限与数据安全的课程训练。' },
    { id: 'trend-equipment', industry: industries[2], title: '智能装备应用带动调试、检测和安全协同', stage: '中游 → 下游', groupIndexes: [2, 4], summary: '岗位任务覆盖设备选型、现场调试、检测复核和运维。', evidence: '教学案例：机器人试运行、施工质量检测与人工复核。', impact: '在装备课程中补充现场约束识别、异常停机与检测报告编制。' }
  ]
  const storageKey = 'portrait-industry-integration-v2'
  function number(value) {
    const text = String(value ?? '').replace(/,/g, '')
    const n = parseFloat(text) || 0
    return /万/.test(text) ? n * 10000 : n
  }
  function groupName(job, overrides = {}) { return Object.hasOwn(overrides, job.id) ? overrides[job.id] : (job.groupName || '') }
  function groups(jobs, overrides = {}) {
    return definitions.map((d, index) => {
      const members = jobs.filter(job => groupName(job, overrides) === d[0])
      return { id: String(index), name: d[0], field: d[1], stages: d[2], nodes: d[3], chains: d[4].map(i => chains[i]), industry: industries[d[5]], members,
        demand: members.reduce((sum, job) => sum + number(job.demand), 0),
        salary: members.length ? Math.round(members.reduce((sum, job) => sum + salary(job.salary), 0) / members.length * 10) / 10 : 0 }
    })
  }
  function salary(value) {
    const values = String(value || '').match(/[0-9]+(?:\.[0-9]+)?/g)?.map(Number) || []
    return values.length ? values.slice(0, 2).reduce((a, b) => a + b, 0) / Math.min(2, values.length) : 0
  }
  function abilities(job) {
    return Object.entries(job.abilities || {}).flatMap(([dimension, names]) => names.map(name => ({ key: JSON.stringify([job.id, dimension, name]), jobId: job.id, dimension, name })))
  }
  function courseIds(ability, job, courseList, edits = {}) {
    if (Object.hasOwn(edits, ability.key)) return edits[ability.key].filter(id => courseList.some(c => c.id === id))
    // Original job-to-course relations are candidates only, not evidence of ability coverage.
    return []
  }
  function portraitTags(job, overrides = {}, groupsEnabled = true) {
    if (!job) return []
    const group = groupsEnabled ? groupName(job, overrides) : ''
    return [
      ...(group ? [`岗位群：${group}`] : []),
      ...(job.node ? [`产业环节：${job.node}`] : []),
      ...(!group ? (job.skills || []).slice(0, 3) : [])
    ]
  }
  function coverage(job, courseList, edits = {}) {
    const all = abilities(job), matched = all.filter(a => courseIds(a, job, courseList, edits).length).length
    return { total: all.length, matched, percent: all.length ? Math.round(matched / all.length * 1000) / 10 : 0 }
  }
  function filterJobs(jobs, filters = {}, state = {}, courseList = []) {
    const query = (filters.query || '').trim().toLowerCase()
    const rows = jobs.filter(job => (!filters.level || filters.level === '全部' || job.level === filters.level) &&
      (filters.groupsEnabled === false || !filters.group || groupName(job, state.membership) === filters.group) &&
      (filters.groupsEnabled === false || !filters.node || definitions.some(d => d[0] === groupName(job, state.membership) && d[3].includes(filters.node))) &&
      (!filters.education || job.education === filters.education) && (!filters.experience || job.experience === filters.experience) &&
      (!filters.salary || (filters.salary === 'high' ? salary(job.salary) >= 15 : salary(job.salary) < 15)) &&
      (!query || [job.name, job.chain, job.node, job.summary, filters.groupsEnabled === false ? '' : groupName(job, state.membership), ...(job.skills || []), ...Object.values(job.abilities || {}).flat()].join(' ').toLowerCase().includes(query)))
    return rows.sort((a, b) => filters.sort === 'demand' ? number(b.demand) - number(a.demand) : filters.sort === 'match' ? coverage(b, courseList, state.relations).percent - coverage(a, courseList, state.relations).percent : filters.sort === 'salary' ? salary(b.salary) - salary(a.salary) : 0)
  }
  function load(storage) {
    try {
      const data = JSON.parse(storage.getItem(storageKey) || '{}')
      return { membership: data.membership && typeof data.membership === 'object' ? data.membership : {}, relations: data.relations && typeof data.relations === 'object' ? data.relations : {}, targets: data.targets || {}, companyCategories: data.companyCategories || {}, recruitment: Array.isArray(data.recruitment) ? data.recruitment : [] }
    } catch { return { membership: {}, relations: {}, targets: {}, companyCategories: {}, recruitment: [] } }
  }
  function validateRelations(rows, jobs, courseList) {
    if (!Array.isArray(rows) || rows.length > 10000) throw new Error('请选择能力课程关系 JSON 数组，最多 10000 条。')
    const keys = new Set(jobs.flatMap(abilities).map(a => a.key)), ids = new Set(courseList.map(c => c.id)), seen = new Set()
    const result = {}
    for (const row of rows) {
      if (!row || !keys.has(row.key) || seen.has(row.key) || !Array.isArray(row.courseIds) || row.courseIds.some(id => !ids.has(id))) throw new Error('能力或课程不存在，或能力重复；本次导入未保存。')
      seen.add(row.key); result[row.key] = [...new Set(row.courseIds)]
    }
    return result
  }
  root.IndustryDomain = { chains, industries, definitions, trends, applications, storageKey, number, salary, groupName, portraitTags, groups, abilities, courseIds, coverage, filterJobs, load, validateRelations }
})(globalThis)
