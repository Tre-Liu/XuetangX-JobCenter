import assert from 'node:assert/strict'
import test from 'node:test'
import { studentCareerPlanData } from '../src/data/student-career-plan-data.ts'

let learningModel
try {
  learningModel = await import('../src/data/learning-space.ts')
} catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error
}

function model() {
  assert.ok(learningModel, '课程学习空间应提供可导入的数据模型')
  return learningModel
}

test('course identity matches the first-semester training plan', () => {
  const { learningCourse } = model()
  const planCourse = studentCareerPlanData.semesters[0].courses.find((course) => course.code === 'B260009')
  assert.ok(planCourse)
  assert.equal(learningCourse.name, '高等数学')
  assert.equal(learningCourse.planCourseName, planCourse.name)
  assert.equal(learningCourse.code, planCourse.code)
  assert.equal(learningCourse.credits, Number(planCourse.credits))
  assert.equal(learningCourse.major, '智能建造工程')
  assert.equal(learningCourse.className, '2026级智能建造01班')
  assert.equal(learningCourse.term, '2026—2027学年 第一学期')
  assert.equal(learningCourse.hours, 48)
})

test('course goals link to existing graduation requirements without dangling references', () => {
  const { learningCourse } = model()
  const requirementCodes = new Set(studentCareerPlanData.requirements.map((requirement) => requirement.code))
  assert.equal(learningCourse.goals.length, 3)
  assert.equal(new Set(learningCourse.goals.map((goal) => goal.id)).size, 3)
  for (const goal of learningCourse.goals) {
    assert.ok(goal.title.trim())
    assert.ok(goal.description.trim())
    assert.ok(goal.requirementCodes.length > 0)
    for (const code of goal.requirementCodes) assert.ok(requirementCodes.has(code), `${goal.id} 引用了不存在的毕业要求 ${code}`)
  }
})

test('teaching outline accounts for all 48 course hours', () => {
  const { learningCourse } = model()
  assert.ok(learningCourse.outline.length >= 5 && learningCourse.outline.length <= 6)
  assert.equal(learningCourse.outline.reduce((hours, chapter) => hours + chapter.hours, 0), 48)
  for (const chapter of learningCourse.outline) {
    assert.ok(chapter.hours > 0)
    assert.ok(chapter.title.trim())
    assert.ok(chapter.topics.length > 0)
    assert.ok(chapter.topics.every((topic) => topic.trim()))
  }
})

test('learning resources have unique identities and inspectable study content', () => {
  const { learningChapters } = model()
  const units = learningChapters.flatMap((chapter) => chapter.units)
  assert.equal(learningChapters.length, 3)
  assert.ok(units.length >= 8 && units.length <= 9)
  assert.equal(new Set(units.map((unit) => unit.id)).size, units.length)
  assert.ok(learningChapters[1].units.some((unit) => unit.type === '视频'))
  for (const unit of units) {
    assert.ok(['视频', '图文', '练习'].includes(unit.type))
    assert.equal(typeof unit.completed, 'boolean')
    assert.ok(unit.duration.trim())
    assert.ok(unit.description.trim())
    assert.ok(unit.formula.trim())
    assert.ok(unit.guide.length > 0, `${unit.id} 缺少学习导引`)
    for (const item of unit.guide) {
      assert.ok(item.time.trim())
      assert.ok(item.title.trim())
      assert.ok(item.description.trim())
    }
    assert.ok(unit.transcript.length > 0, `${unit.id} 缺少课程内容`)
    assert.ok(unit.transcript.every((paragraph) => paragraph.trim()))
  }
  const completed = units.filter((unit) => unit.completed).length
  assert.ok(completed > 0 && completed < units.length, '学习进度应由部分已完成的资源计算')
})

test('professional abilities trace course goals and describe job tasks with scope boundaries', () => {
  const { learningCourse, professionalAbilities } = model()
  const goalIds = new Set(learningCourse.goals.map((goal) => goal.id))
  const planJobs = new Set(studentCareerPlanData.jobs.map((job) => job.name))
  assert.equal(professionalAbilities.length, 3)
  assert.equal(new Set(professionalAbilities.map((ability) => ability.id)).size, 3)
  for (const ability of professionalAbilities) {
    assert.ok(ability.goalIds.length > 0)
    for (const goalId of ability.goalIds) assert.ok(goalIds.has(goalId), `${ability.id} 引用了不存在的课程目标 ${goalId}`)
    assert.ok(ability.demands.length > 0)
    for (const demand of ability.demands) {
      assert.ok(planJobs.has(demand.job), `岗位 ${demand.job} 应来源于当前培养方案`)
      assert.ok(demand.task.trim())
      assert.ok(demand.requirement.trim())
    }
  }
  const abilitiesReply = model().resolveCareerReply('这门课对应什么岗位能力？')
  assert.match(abilitiesReply.paragraphs.join(''), /基础|支撑/)
  assert.match(abilitiesReply.paragraphs.join(''), /后续|另需|还需/)
})

test('the six course commands resolve to their corresponding answers', () => {
  const { careerCommands, resolveCareerReply } = model()
  assert.deepEqual(careerCommands.map((command) => command.id), ['goals', 'requirements', 'outline', 'relations', 'abilities', 'plan'])
  for (const command of careerCommands) {
    const reply = resolveCareerReply(command.question)
    assert.equal(reply.kind, command.id, command.question)
    assert.ok(reply.title.trim())
    assert.ok(reply.paragraphs.length > 0)
  }
})

test('natural questions resolve only within the supported course scope', () => {
  const { resolveCareerReply } = model()
  const questions = [
    ['这门课的学习目标是什么？', 'goals'],
    ['目标是什么？', 'goals'],
    ['这门课的课程目标', 'goals'],
    ['高数如何支撑毕业要求？', 'requirements'],
    ['本课程支撑哪些专业毕业要求？', 'requirements'],
    ['本学期教学大纲有哪些章节和学时？', 'outline'],
    ['先修什么，后续要学什么？', 'relations'],
    ['学了高数可以支撑哪些岗位？', 'abilities'],
    ['学完这门课会形成什么能力？', 'abilities'],
    ['这门课与我的专业有什么关系？', 'abilities'],
    ['这门课在培养方案第几学期，有几个学分？', 'plan'],
    ['查看专业培养目标', 'plan'],
    ['看看我的专业介绍及课程体系', 'plan'],
    ['专业毕业要求是什么？', 'plan']
  ]
  for (const [question, kind] of questions) assert.equal(resolveCareerReply(question).kind, kind, question)
})

test('unsupported or empty questions return a bounded help response', () => {
  const { resolveCareerReply } = model()
  for (const question of ['', '   ', '明天天气怎么样？', '帮我查一下最新招聘薪资', '预测我的期末成绩']) {
    const reply = resolveCareerReply(question)
    assert.equal(reply.kind, 'help', question)
    assert.match(reply.paragraphs.join(''), /当前|目前/)
    assert.match(reply.paragraphs.join(''), /课程目标/)
    assert.match(reply.paragraphs.join(''), /培养方案/)
    assert.match(reply.paragraphs.join(''), /快捷指令/)
    assert.doesNotMatch(reply.paragraphs.join(''), /上方指令/)
    assert.doesNotMatch(reply.paragraphs.join(''), /正在检索|已联网|实时查询/)
  }
})

test('published learning content uses formal business wording', () => {
  const { learningCourse, learningChapters, professionalAbilities, careerCommands, resolveCareerReply } = model()
  const visibleContent = JSON.stringify([
    learningCourse,
    learningChapters,
    professionalAbilities,
    careerCommands,
    ...careerCommands.map((command) => resolveCareerReply(command.question)),
    resolveCareerReply('')
  ])
  assert.doesNotMatch(visibleContent, /演示|demo|模拟数据|示例数据|测试数据/i)
})
