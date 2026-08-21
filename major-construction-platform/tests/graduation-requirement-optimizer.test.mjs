import test from 'node:test'
import assert from 'node:assert/strict'

const optimizer = await import('../src/app/graduation-requirement-optimizer.ts').catch(() => ({}))

test('graduation optimizer exposes six strong job matches and derives evidence only from selected jobs', () => {
  assert.equal(typeof optimizer.getGraduationJobPreview, 'function')
  assert.equal(optimizer.GRADUATION_JOB_MATCHES.length, 6)
  assert.equal(
    optimizer.GRADUATION_JOB_MATCHES.some((job) => Object.hasOwn(job, 'match')),
    false,
    '岗位候选数据不应包含无法证明的匹配度百分比',
  )

  const preview = optimizer.getGraduationJobPreview([
    'job-bim-deepening',
    'job-smart-site',
  ])

  assert.deepEqual(preview.jobNames, ['BIM深化设计工程师', '智慧工地实施工程师'])
  assert.deepEqual(preview.tasks, [
    '完成建筑与结构BIM模型深化、碰撞检查及问题闭环',
    '编制模型交付标准并完成多专业协同审查',
    '完成智慧工地平台配置、物联设备接入与数据联调',
    '基于现场数据开展质量安全预警和整改闭环',
  ])
  assert.deepEqual(preview.capabilities, [
    'BIM深化设计与数字化交付能力',
    '多专业模型协同与问题解决能力',
    '智慧工地平台部署与物联网集成能力',
    '现场数据分析与质量安全闭环管理能力',
  ])
  assert.doesNotMatch(preview.capabilities.join('、'), /结构检测/)
})

test('graduation job detail returns evidence for exactly the job being viewed', () => {
  assert.equal(typeof optimizer.getGraduationJobDetail, 'function')

  const detail = optimizer.getGraduationJobDetail('job-smart-construction')

  assert.deepEqual(detail, {
    id: 'job-smart-construction',
    name: '智能建造施工工程师',
    occupation: null,
    tasks: [
      '编制智能化施工方案并完成施工工艺参数优化',
      '完成建筑机器人及智能装备选型、联调与现场应用',
    ],
    capabilities: [
      '智能化施工方案设计与工艺优化能力',
      '建筑机器人及智能装备应用能力',
    ],
  })
  assert.equal(optimizer.getGraduationJobDetail('missing-job'), null)
})

test('graduation job detail exposes only maintained occupation links and uses null when no link exists', () => {
  assert.equal(
    optimizer.getGraduationJobDetail('job-bim-deepening')?.occupation,
    '建筑信息模型技术员',
  )
  assert.equal(
    optimizer.getGraduationJobDetail('job-prefabricated-design')?.occupation,
    '土木建筑工程技术人员',
  )
  assert.equal(
    optimizer.getGraduationJobDetail('job-smart-site')?.occupation,
    null,
  )
})

test('AI optimization preserves the first five foundation requirements and replaces professional abilities with polished selected-job requirements', () => {
  assert.equal(typeof optimizer.optimizeGraduationRequirements, 'function')
  const current = {
    overview: '原毕业要求概述',
    requirements: Array.from({ length: 8 }, (_, index) => ({
      code: `R${index + 1}`,
      text: `原要求${index + 1}`,
      children: [`原指标${index + 1}`],
    })),
  }

  const optimized = optimizer.optimizeGraduationRequirements(current, [
    'job-bim-deepening',
    'job-smart-site',
  ])

  assert.match(optimized.overview, /2个强相关岗位/)
  assert.match(optimized.overview, /BIM深化设计工程师、智慧工地实施工程师/)
  assert.deepEqual(optimized.requirements.map((item) => item.code), [
    'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
  ])
  assert.deepEqual(
    optimized.requirements.slice(0, 5).map((item) => item.text),
    ['原要求1', '原要求2', '原要求3', '原要求4', '原要求5'],
  )
  assert.deepEqual(optimized.requirements[5], {
    code: 'R6',
    text: 'BIM深化设计与数字化交付能力',
    children: [
      '能够依据工程图纸和项目标准完成建筑与结构BIM模型深化、碰撞检查及问题闭环，形成符合交付要求的模型成果。',
      '能够组织多专业模型协同审查，准确识别设计冲突并提出可实施的优化方案。',
    ],
  })
  assert.deepEqual(optimized.requirements[6], {
    code: 'R7',
    text: '智慧工地实施与现场闭环管理能力',
    children: [
      '能够完成智慧工地平台配置、物联设备接入和数据联调，保障现场数据稳定采集与有效应用。',
      '能够分析进度、质量与安全数据，识别工程风险并推动预警、处置、复核全过程闭环。',
    ],
  })
  assert.equal(current.overview, '原毕业要求概述')
  assert.equal(current.requirements.length, 8)
})
