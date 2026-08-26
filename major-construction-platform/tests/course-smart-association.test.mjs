import test from 'node:test'
import assert from 'node:assert/strict'
const appConfig = await import('../src/app/course-smart-association.ts').catch(() => ({}))

const jobs = [
  {
    id: 'job-bim',
    name: 'BIM建模工程师',
    chain: '智能建造产业链',
    node: 'BIM数据服务',
    tasks: [
      {
        name: '创建并校核建筑信息模型',
        description: '按照项目标准完成模型创建、碰撞检查与成果交付。',
        abilities: ['BIM模型创建']
      }
    ]
  },
  {
    id: 'job-monitor',
    name: '结构健康监测工程师',
    chain: '智能建造产业链',
    node: '智能检测监测',
    tasks: [
      {
        name: '分析结构监测统计数据',
        description: '运用统计方法识别监测数据异常并形成分析结论。',
        abilities: ['监测数据统计分析']
      },
      {
        name: '编制监测报告',
        description: '整理监测结果并形成可追溯报告。',
        abilities: ['技术文档编制']
      }
    ]
  }
]

test('smart association ranks jobs whose real tasks match the course context', () => {
  assert.equal(typeof appConfig.buildCourseSmartAssociationCandidates, 'function')

  const result = appConfig.buildCourseSmartAssociationCandidates({
    courseName: '概率论与数理统计',
    majorName: '智能建造工程专业',
    knowledgeNodeName: '假设检验原理',
    jobs
  })

  assert.deepEqual(result.map((job) => job.id), ['job-monitor', 'job-bim'])
  assert.deepEqual(
    result[0].tasks.map((task) => task.name),
    ['分析结构监测统计数据', '编制监测报告']
  )
  assert.equal(result[0].reason, '课程或知识点关键词：统计')
  assert.doesNotMatch(JSON.stringify(result), /\d+%/)
})

test('smart association keeps professional job order when no task keyword matches', () => {
  assert.equal(typeof appConfig.buildCourseSmartAssociationCandidates, 'function')

  const result = appConfig.buildCourseSmartAssociationCandidates({
    courseName: '大学英语',
    majorName: '智能建造工程专业',
    knowledgeNodeName: '阅读理解',
    jobs
  }, 1)

  assert.deepEqual(result.map((job) => job.id), ['job-bim'])
  assert.equal(result[0].reason, '来源于智能建造工程专业岗位库')
  assert.equal(result[0].tasks[0].name, '创建并校核建筑信息模型')
})

test('smart association does not treat a connector-crossing bigram as matching evidence', () => {
  assert.equal(typeof appConfig.buildCourseSmartAssociationCandidates, 'function')

  const result = appConfig.buildCourseSmartAssociationCandidates({
    courseName: '概率论与数理统计',
    majorName: '智能建造工程专业',
    knowledgeNodeName: '假设检验原理',
    jobs: [{
      id: 'job-generic',
      name: '工程数字化管理员',
      chain: '智能建造产业链',
      node: '工程数据服务',
      tasks: [{
        name: '模型与数据处理',
        description: '整理工程现场数据并维护交付记录。',
        abilities: ['工程数据维护']
      }]
    }]
  })

  assert.equal(result[0].reason, '来源于智能建造工程专业岗位库')
})

test('smart association does not use a cross-job generic term as matching evidence', () => {
  assert.equal(typeof appConfig.buildCourseSmartAssociationCandidates, 'function')

  const result = appConfig.buildCourseSmartAssociationCandidates({
    courseName: '概率论与数理统计',
    majorName: '智能建造工程专业',
    knowledgeNodeName: '假设检验原理',
    jobs: [{
      id: 'job-generic-principle',
      name: '工程平台实施顾问',
      chain: '智能建造产业链',
      node: '平台实施服务',
      tasks: [{
        name: '说明工程平台运行原理',
        description: '向项目团队说明平台配置与运行机制。',
        abilities: ['工程平台基础原理']
      }]
    }]
  })

  assert.equal(result[0].reason, '来源于智能建造工程专业岗位库')
})

test('smart association exposes three visible loading stages in order', () => {
  assert.deepEqual(appConfig.courseSmartAssociationLoadingSteps, [
    '正在识别当前课程与所属专业',
    '正在检索本专业岗位库',
    '正在匹配岗位典型工作任务'
  ])
})

test('smart association automatically relates every maintained task from every returned job', () => {
  assert.equal(typeof appConfig.buildCourseSmartAssociationRelations, 'function')

  const relations = appConfig.buildCourseSmartAssociationRelations([
    {
      id: 'job-monitor',
      name: '结构健康监测工程师',
      chain: '智能建造产业链',
      node: '智能检测监测',
      reason: '课程或知识点关键词：统计',
      tasks: [
        { name: '分析结构监测统计数据', description: '识别异常。' },
        { name: '编制监测报告', description: '形成结论。' }
      ]
    },
    {
      id: 'job-bim',
      name: 'BIM建模工程师',
      chain: '智能建造产业链',
      node: 'BIM数据服务',
      reason: '来源于智能建造工程专业岗位库',
      tasks: [
        { name: '创建并校核建筑信息模型', description: '完成模型交付。' }
      ]
    },
    {
      id: 'job-empty',
      name: '待维护岗位',
      chain: '智能建造产业链',
      node: '待维护节点',
      reason: '来源于智能建造工程专业岗位库',
      tasks: []
    }
  ])

  assert.deepEqual(relations, [
    {
      jobId: 'job-monitor',
      jobName: '结构健康监测工程师',
      chain: '智能建造产业链',
      node: '智能检测监测',
      tasks: ['分析结构监测统计数据', '编制监测报告']
    },
    {
      jobId: 'job-bim',
      jobName: 'BIM建模工程师',
      chain: '智能建造产业链',
      node: 'BIM数据服务',
      tasks: ['创建并校核建筑信息模型']
    }
  ])
})

test('rerunning smart association replaces this knowledge node and preserves other nodes', () => {
  assert.equal(typeof appConfig.replaceCourseSmartAssociationRelations, 'function')

  const current = {
    假设检验原理: [{
      jobId: 'job-old',
      jobName: '旧岗位',
      chain: '旧产业链',
      node: '旧节点',
      tasks: ['旧任务']
    }],
    方差分析: [{
      jobId: 'job-variance',
      jobName: '数据分析工程师',
      chain: '智能建造产业链',
      node: '数据服务',
      tasks: ['分析方差数据']
    }]
  }

  const next = appConfig.replaceCourseSmartAssociationRelations(current, '假设检验原理', [{
    id: 'job-monitor',
    name: '结构健康监测工程师',
    chain: '智能建造产业链',
    node: '智能检测监测',
    reason: '课程或知识点关键词：统计',
    tasks: [{ name: '分析结构监测统计数据' }]
  }])

  assert.deepEqual(next, {
    假设检验原理: [{
      jobId: 'job-monitor',
      jobName: '结构健康监测工程师',
      chain: '智能建造产业链',
      node: '智能检测监测',
      tasks: ['分析结构监测统计数据']
    }],
    方差分析: current.方差分析
  })
})
