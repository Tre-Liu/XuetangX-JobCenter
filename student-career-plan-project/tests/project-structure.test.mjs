import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const viteConfig = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8')
const buildStaticPreviewScript = await readFile(new URL('../scripts/build-static-preview.mjs', import.meta.url), 'utf8').catch(() => '')
const distIndexHtml = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8').catch(() => '')
const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const dataModule = await readFile(new URL('../src/data/student-career-plan-data.ts', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/styles/student-career-plan.css', import.meta.url), 'utf8')

test('standalone project exposes expected npm scripts', () => {
  assert.equal(packageJson.name, 'student-career-plan-project')
  assert.equal(packageJson.scripts.dev, 'vite --host 0.0.0.0 --port 5174 --open /')
  assert.equal(packageJson.scripts.build, 'vue-tsc -b && vite build && node scripts/build-static-preview.mjs')
  assert.equal(packageJson.scripts.test, 'node --test')
})

test('Vue app owns the student career plan shell and assistant interaction', () => {
  for (const pattern of [
    /studentCareerPlanData/,
    /activeStudentPlanTab/,
    /activeStudentNav/,
    /selectStudentAgentPrompt/,
    /student-plan-shell/,
    /career-agent-panel/,
    /v-model="studentAgentInput"/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('teaching management navigation opens the course list view', () => {
  for (const pattern of [
    /selectStudentNav/,
    /student-course-page/,
    /我听的课/,
    /我的归档/,
    /搜索课程/,
    /studentTeachingCourses/
  ]) {
    assert.match(appVue, pattern)
  }

  assert.match(dataModule, /高等数学/)
  assert.doesNotMatch(dataModule, /刘鸿喆高数/)
})

test('course page sidebar matches the teaching platform labels and icons', () => {
  for (const label of ['教学管理', '我的比赛', '培养方案', '我的成果', '更多']) {
    assert.match(appVue, new RegExp(label))
  }

  assert.doesNotMatch(appVue, /AI空间/)
  assert.match(appVue, /student-nav-icon/)
  for (const iconClass of ['icon-teaching', 'icon-competition', 'icon-plan', 'icon-achievement', 'icon-more']) {
    assert.match(appVue, new RegExp(iconClass))
    assert.match(styles, new RegExp(`\\.${iconClass}`))
  }
})

test('clicking a teaching course opens the study content page', () => {
  for (const pattern of [
    /openStudentCourseDetail/,
    /activeTeachingView/,
    /student-study-page/,
    /课程大纲/,
    /学习内容/,
    /讨论区/,
    /内容总览/,
    /仅展示学习单元/,
    /这是一个资源/,
    /这是一个视频/
  ]) {
    assert.match(appVue, pattern)
  }

  assert.match(styles, /\.student-study-page/)
  assert.match(styles, /\.student-study-content-card/)
})

test('knowledge graph opens from the course tabs and links to AI learning space', () => {
  for (const pattern of [
    /openStudentKnowledgeGraph/,
    /openAiLearningSpace/,
    /isAiLearningSpaceRoute/,
    /student-knowledge-page/,
    /student-ai-workspace/,
    /AI学习空间/,
    /知识点总量/,
    /学习路径/,
    /知识点/,
    /完成度 100\.00%/,
    /知识点答疑/,
    /更多AI应用/,
    /学习有困惑？问问你的 AI 学伴吧～/,
    /以上内容均由AI生成/
  ]) {
    assert.match(appVue, pattern)
  }

  assert.match(styles, /\.student-knowledge-page/)
  assert.match(styles, /\.student-ai-workspace/)
})

test('root index opens the built preview when double-clicked from Finder', () => {
  assert.match(indexHtml, /location\.protocol === 'file:'/)
  assert.match(indexHtml, /\/dist\//)
  assert.match(indexHtml, /new URL\('\.\/dist\/index\.html', location\.href\)/)
  assert.doesNotMatch(indexHtml, /这是 Vue\/Vite 工程源码入口/)
})

test('production build uses relative asset paths for local preview files', () => {
  assert.match(viteConfig, /base: '\.\/'/)
})

test('production preview is inlined so dist/index.html works from file protocol', () => {
  assert.match(buildStaticPreviewScript, /inlineScript/)
  assert.match(buildStaticPreviewScript, /inlineStylesheet/)
  assert.match(buildStaticPreviewScript, /DOMContentLoaded/)
  assert.match(buildStaticPreviewScript, /html\.replace\(scriptPattern, \(\) =>/)
  assert.match(buildStaticPreviewScript, /html\.replace\(stylesheetPattern, \(\) =>/)
  assert.match(distIndexHtml, /<style>/)
  assert.match(distIndexHtml, /<script>/)
  assert.match(distIndexHtml, /runStudentCareerPlan/)
  assert.match(distIndexHtml, /DOMContentLoaded/)
  assert.doesNotMatch(distIndexHtml, /type="module"/)
  assert.doesNotMatch(distIndexHtml, /src="\.\/assets\//)
  assert.doesNotMatch(distIndexHtml, /href="\.\/assets\//)
  assert.equal(distIndexHtml.includes('-./assets/'), false)
})

test('student career plan data is editable outside the component', () => {
  for (const pattern of [
    /智能建造工程（学生端培养方案）/,
    /'培养目标'/,
    /'毕业要求'/,
    /'课程体系'/,
    /建筑信息模型基础/,
    /BIM建模工程师/
  ]) {
    assert.match(dataModule, pattern)
  }
})

test('student career plan styles are local to the standalone project', () => {
  for (const pattern of [
    /\.student-plan-shell/,
    /\.student-plan-tab/,
    /\.student-course-card/,
    /\.career-agent-panel/,
    /\.career-agent-input/
  ]) {
    assert.match(styles, pattern)
  }
})
