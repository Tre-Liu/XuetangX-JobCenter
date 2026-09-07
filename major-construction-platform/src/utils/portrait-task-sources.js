;(function registerPortraitTaskSources(root) {
  // Fictional training plans for the BIM demo. Keep separate from the audited index.
  const demoPlans = {
    modeling: { file: '2025级智能建造工程专业人才培养方案.pdf', school: '示例建筑职业技术大学', major: '智能建造工程' },
    construction: { file: '2025级建筑工程技术专业人才培养方案.pdf', school: '示例建设职业技术学院', major: '建筑工程技术' },
    costing: { file: '2025级工程造价专业人才培养方案.pdf', school: '示例建设职业技术学院', major: '工程造价' }
  }
  const demoTasks = {
    '建筑模型创建与标准校核': [['modeling', 'PDF第18页 · 岗位典型工作任务分析']],
    '施工图深化与碰撞检查': [['construction', 'PDF第22页 · 职业能力分析'], ['modeling', 'PDF第19页 · BIM协同设计']],
    '工程量提取与变更协同': [['costing', 'PDF第16页 · 工程计量与计价']],
    '模型交付与过程复核': [['modeling', 'PDF第20页 · 数字化成果交付']],
    '设计协同问题闭环': [['construction', 'PDF第24页 · 项目协同管理']],
    '成果归档与交付汇报': [['modeling', 'PDF第21页 · 项目成果归档']]
  }
  // Real sources require both job and task to match. Demo fixtures are opt-in.
  const getSources = (jobName, task, { allowDemo = false } = {}) => {
    const name = typeof task === 'string' ? task : task?.name
    if (!jobName || !name) return []
    const sources = root.PortraitTaskSourceIndex?.[JSON.stringify([jobName, name])] ?? []
    if (sources.length || !allowDemo || !/BIM/i.test(jobName)) return sources
    return (demoTasks[name] ?? []).map(([plan, locator], index) => ({
      ...demoPlans[plan], locator, isDemo: true, taskId: `demo-bim-${name}-${index}`, sha256: ''
    }))
  }
  root.PortraitTaskSources = { getSources }
})(typeof window === 'undefined' ? globalThis : window)
