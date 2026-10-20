import { writeFile } from 'node:fs/promises'
import { JOB_CARDS, COURSE_NODES, getJobDetail } from '../src/mock/job-center.ts'
import { talentCourses, talentGoalOverview, talentGoals, graduationOverview, graduationRequirements } from '../src/app/talent-industry-data.ts'
const jobs = JOB_CARDS.map(job => {
 const detail = getJobDetail(job.id)
 return { id: job.id, name: job.name, group: job.groupName, occupation: job.occupation, occupationCode: job.occupationCode,
  source: '专业岗位库', sourceFile: 'src/mock/job-center.ts', evidence: '岗位画像测算',
  tasks: detail.tasks.map((t,i) => ({ id: `${job.id}:task-${i+1}`, ...t })),
  abilities: detail.abilities.map((a,i) => ({ id: `${job.id}:ability-${i+1}`, ...a })) }
})
const courses = talentCourses.map(c => ({ id: c[0], code: c[0], name: c[1], college: c[3], credits: Number(c[4]) || 0, type: c[5], semester: c[6], hours: null,
 jobIds: COURSE_NODES.find(n => n.name === c[1])?.jobIds || [], source: '教务课程库', sourceFile: 'src/app/talent-industry-data.ts' }))
const existing = { name: '智能建造工程2026级人才培养方案', major: '智能建造工程', code: '240302', level: '职业本科', years: 4, year: '2026',
 goals: talentGoalOverview + '\n\n' + talentGoals.map((t,i)=>`目标${i+1}：${t}`).join('\n'),
 requirements: graduationOverview + '\n\n' + graduationRequirements.map(r=>r.code+' '+r.text+'\n'+r.children.join('\n')).join('\n\n'),
 courseIds: courses.filter(c=>c.jobIds.length).map(c=>c.id) }
const data = { schemaVersion: 1, jobs, courses, existing, provenance: { generatedAt:'2026-10-15', scope:'前端交互数据档案', jobs:'复用工程岗位画像，不等于实测招聘事实', courses:'复用工程教务课程内容，未连接实时教务系统；学时未提供，保持为空', generation:'本地结构化规则起草，未连接在线大模型', relations:'原岗位—课程关系为匹配候选；能力关系经用户确认后计入覆盖' } }
await writeFile(new URL('../src/talent-plan/data.js',import.meta.url),`/** AI人培修制定。由工程岗位库和教务课程生成，保留原始ID；来源与测算边界见provenance。 */\n;(function(root){ root.TalentPlanData = ${JSON.stringify(data,null,2)}\n})(globalThis)\n`)
console.log(`人才方案数据：${jobs.length}个岗位，${courses.length}门课程`)
