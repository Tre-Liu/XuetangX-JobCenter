<script setup lang="ts">
import { computed, ref } from 'vue'
import AiLearningWorkspace from './components/AiLearningWorkspace.vue'
import { learningChapters, learningCourse } from './data/learning-space'
import { studentCareerPlanData, type StudentPlanCourse } from './data/student-career-plan-data'

type StudentPlanTab = (typeof studentCareerPlanData.tabs)[number]
type StudentPrompt = (typeof studentCareerPlanData.prompts)[number]
type StudentNavId = 'teaching' | 'competition' | 'plan' | 'achievement' | 'plan-secondary' | 'more'

type StudentCourseCard = StudentPlanCourse & {
  semester: string
  tone: 'active' | 'cyan' | 'muted'
}
type TeachingView = 'list' | 'detail' | 'graph'
const studentNavItems: { id: StudentNavId; label: string; iconClass: string }[] = [
  { id: 'teaching', label: '教学管理', iconClass: 'icon-teaching' },
  { id: 'competition', label: '我的比赛', iconClass: 'icon-competition' },
  { id: 'plan', label: '培养方案', iconClass: 'icon-plan' },
  { id: 'achievement', label: '我的成果', iconClass: 'icon-achievement' },
  { id: 'plan-secondary', label: '培养方案', iconClass: 'icon-plan' },
  { id: 'more', label: '更多', iconClass: 'icon-more' }
]

const activeStudentNav = ref<StudentNavId>(new URLSearchParams(window.location.search).get('view') === 'teaching' ? 'teaching' : 'plan')
const activeTeachingView = ref<TeachingView>('list')
const activeStudentPlanTab = ref<StudentPlanTab>(studentCareerPlanData.tabs[0])
const activeStudentPrompt = ref<StudentPrompt>(studentCareerPlanData.prompts[0])
const studentAgentInput = ref('')
const isAiLearningSpaceRoute = ref(new URLSearchParams(window.location.search).get('view') === 'ai-learning-space')

const getSemesterSortValue = (semester: string) => {
  const match = semester.match(/\d+/)
  return match ? Number(match[0]) : 99
}

const createStudentCourseCard = (course: StudentPlanCourse, semester: string, index: number): StudentCourseCard => ({
  ...course,
  semester,
  tone: course.agent ? 'active' : index % 3 === 0 ? 'cyan' : 'muted'
})

const studentCurrentCourse = computed(() =>
  studentCareerPlanData.semesters.flatMap((semester) => semester.courses).find((course) => course.agent)
    ?? studentCareerPlanData.semesters[0]?.courses[0]
)

const studentSemesterCourseGroups = computed(() =>
  studentCareerPlanData.semesters
    .slice()
    .sort((first, second) => getSemesterSortValue(first.name) - getSemesterSortValue(second.name))
    .map((semester) => ({
      semester: semester.name,
      courses: semester.courses.map((course, index) => createStudentCourseCard(course, semester.name, index))
    }))
)

const studentTeachingCourses = computed(() => studentCareerPlanData.teachingCourses)
const activeTeachingCourse = computed(() => studentTeachingCourses.value[0])

const selectStudentNav = (item: StudentNavId) => {
  activeStudentNav.value = item
  if (item === 'teaching') {
    activeTeachingView.value = 'list'
  }
}

const openStudentCourseDetail = () => {
  activeTeachingView.value = 'detail'
}

const openStudentKnowledgeGraph = () => {
  activeTeachingView.value = 'graph'
}

const createAiLearningSpaceUrl = (unitId?: string) => {
  const url = new URL(window.location.href)
  url.searchParams.set('view', 'ai-learning-space')
  if (unitId) url.searchParams.set('unit', unitId)
  else url.searchParams.delete('unit')
  url.hash = ''
  return url.toString()
}

const openAiLearningSpace = (unitId?: string) => createAiLearningSpaceUrl(unitId)

const selectStudentPlanTab = (tab: StudentPlanTab) => {
  activeStudentPlanTab.value = tab
}

const selectStudentAgentPrompt = (prompt: StudentPrompt) => {
  activeStudentPrompt.value = prompt
  const courseName = studentCurrentCourse.value?.name ?? '当前课程'
  studentAgentInput.value = `${prompt}：${courseName}`
}
</script>

<template>
  <AiLearningWorkspace v-if="isAiLearningSpaceRoute" />

  <main v-else class="student-plan-shell">
    <aside class="student-app-dock" aria-label="学生端导航">
      <div class="student-school-mark">{{ studentCareerPlanData.schoolMark }}</div>
      <nav>
        <button
          v-for="item in studentNavItems"
          :key="item.id"
          class="student-dock-item"
          :class="{ active: activeStudentNav === item.id }"
          type="button"
          @click="selectStudentNav(item.id)"
        >
          <span class="student-nav-icon" :class="item.iconClass" aria-hidden="true"></span>
          {{ item.label }}
        </button>
      </nav>
      <div class="student-dock-bottom">
        <button type="button" aria-label="下载">⇩</button>
        <span></span>
      </div>
    </aside>

    <section
      v-if="activeStudentNav === 'teaching' && activeTeachingView === 'list'"
      class="student-plan-workspace student-course-workspace"
    >
      <header class="student-course-page-head">
        <button class="student-course-page-tab active" type="button">我听的课</button>
        <button class="student-course-archive" type="button">我的归档</button>
      </header>

      <section class="student-course-page">
        <label class="student-course-search">
          <span>⌕</span>
          <input type="search" placeholder="搜索课程" />
        </label>

        <div class="student-teaching-course-grid">
          <article
            v-for="course in studentTeachingCourses"
            :key="course.id"
            class="student-teaching-course-card"
            role="button"
            tabindex="0"
            @click="openStudentCourseDetail"
            @keydown.enter.prevent="openStudentCourseDetail"
            @keydown.space.prevent="openStudentCourseDetail"
          >
            <div class="student-teaching-course-badge">
              <span>{{ course.badge }}</span>
              <i>✣</i>
            </div>
            <button class="student-teaching-course-menu" type="button" aria-label="课程菜单" @click.stop>•••</button>
            <strong>{{ course.name }}</strong>
            <p>{{ course.className }}</p>
          </article>
        </div>
      </section>
    </section>

    <section
      v-else-if="activeStudentNav === 'teaching' && activeTeachingView === 'graph'"
      class="student-plan-workspace student-knowledge-page"
    >
      <header class="student-knowledge-topbar">
        <button type="button" @click="openStudentCourseDetail">‹ {{ activeTeachingCourse?.name }}</button>
        <strong>知识图谱</strong>
      </header>

      <section class="student-knowledge-canvas">
        <aside class="student-knowledge-summary">
          <h2>章节总量（章）</h2>
          <strong>{{ learningChapters.length }}</strong>
          <div class="student-knowledge-ring">
            <span>{{ Math.round(learningChapters.flatMap(chapter => chapter.units).filter(unit => unit.completed).length / learningChapters.flatMap(chapter => chapter.units).length * 100) }}%<em>资源完成度</em></span>
          </div>
          <label>
            <span>⌕</span>
            <input type="search" placeholder="搜索" />
          </label>
          <ul>
            <li><i class="state-unlearned"></i>待学习章节({{ learningChapters.filter(chapter => chapter.units.every(unit => !unit.completed)).length }})</li>
            <li><i class="state-learning"></i>学习中章节({{ learningChapters.filter(chapter => chapter.units.some(unit => unit.completed) && chapter.units.some(unit => !unit.completed)).length }})</li>
            <li><i class="state-done"></i>已完成章节({{ learningChapters.filter(chapter => chapter.units.every(unit => unit.completed)).length }})</li>
            <li><i class="state-thinking"></i>思政点(0)</li>
            <li><i class="state-prereq"></i>先后修</li>
            <li><i class="state-related"></i>相关</li>
            <li><i class="state-content"></i>关联学习内容({{ learningChapters.flatMap(chapter => chapter.units).length }}个)</li>
          </ul>
          <button class="student-knowledge-directory" type="button">目录</button>
        </aside>

        <section class="student-knowledge-graph">
          <div class="student-knowledge-mode">
            <button type="button" aria-label="图谱模式"></button>
            <button type="button" aria-label="关系模式"></button>
            <span></span>
            <button type="button">学习路径</button>
          </div>
          <div class="student-knowledge-focus">
            <a v-for="chapter in learningChapters" :key="chapter.id" class="student-knowledge-node" :href="openAiLearningSpace(chapter.units[0]?.id)">{{ chapter.title }}</a>
          </div>
          <a class="student-knowledge-ai" :href="openAiLearningSpace()" target="_blank" rel="noopener">AI学习空间</a>
          <div class="student-knowledge-zoom">
            <button type="button">⌖</button>
            <button type="button">−</button>
            <span></span>
            <button type="button">＋</button>
            <strong>100%</strong>
          </div>
        </section>
      </section>
    </section>

    <section v-else-if="activeStudentNav === 'teaching'" class="student-plan-workspace student-study-page">
      <header class="student-study-hero">
        <div class="student-study-info">
          <h1>{{ activeTeachingCourse?.name }}</h1>
          <div class="student-study-meta">
            <span><i class="study-meta-dot"></i>{{ learningCourse.teacher }}</span>
            <span><i class="study-meta-home"></i>{{ learningCourse.className }}</span>
            <span><i class="study-meta-calendar"></i>开课时间：2026-09-07 至 2027-01-10</span>
            <span><i class="study-meta-doc"></i>学习承诺书</span>
          </div>
        </div>
        <div class="student-study-illustration" aria-hidden="true">
          <span class="study-window"></span>
          <span class="study-door"></span>
          <span class="study-orbit"></span>
        </div>
        <a class="student-study-ai" :href="openAiLearningSpace()">
          <span>AI</span>
          AI 学伴
        </a>
      </header>

      <nav class="student-study-tabs" aria-label="课程内容导航">
        <button type="button">课程大纲</button>
        <button class="active" type="button">学习内容</button>
        <button type="button">讨论区</button>
        <button type="button">公告</button>
        <button type="button">分组</button>
        <button type="button">错题集</button>
        <button type="button">成绩单</button>
        <button type="button">成果展示</button>
        <button type="button" @click="openStudentKnowledgeGraph">知识图谱</button>
      </nav>

      <section class="student-study-body">
        <aside class="student-study-filter">
          <header>
            <strong>全部</strong>
            <span>{{ learningChapters.flatMap(chapter => chapter.units).length }}</span>
          </header>
        </aside>

        <section class="student-study-content">
          <div class="student-study-content-head">
            <h2>内容总览</h2>
            <button class="student-study-tree" type="button" aria-label="切换树形视图"></button>
            <button class="student-study-caret" type="button" aria-label="展开内容筛选"></button>
            <label>
              <input type="checkbox" />
              <span>仅展示学习单元</span>
            </label>
            <button class="student-study-filter-button" type="button">全部</button>
          </div>

          <article v-for="chapter in learningChapters" :key="chapter.id" class="student-study-content-card">
            <h3>{{ chapter.title }}</h3>
            <ul>
              <li v-for="unit in chapter.units" :key="unit.id">
                <span class="student-resource-tag" :class="unit.type === '视频' ? 'tag-video' : 'tag-image'">{{ unit.type }}</span>
                <a :href="openAiLearningSpace(unit.id)">{{ unit.title }}</a>
                <em>{{ unit.duration }}</em>
                <small>{{ unit.completed ? '已完成' : '待学习' }}</small>
              </li>
            </ul>
          </article>
        </section>
      </section>
    </section>

    <section v-else class="student-plan-workspace">
      <header class="student-plan-topbar">
        <div>
          <h1>{{ studentCareerPlanData.title }}</h1>
          <p>{{ studentCareerPlanData.subtitle }}</p>
        </div>
        <button class="student-year-switch" type="button">{{ studentCareerPlanData.cohort }}</button>
      </header>

      <nav class="student-plan-tabs" aria-label="培养方案内容">
        <button
          v-for="tab in studentCareerPlanData.tabs"
          :key="tab"
          class="student-plan-tab"
          :class="{ active: activeStudentPlanTab === tab }"
          type="button"
          @click="selectStudentPlanTab(tab)"
        >
          {{ tab }}
        </button>
      </nav>

      <section class="student-plan-body">
        <section class="student-plan-content">
          <template v-if="activeStudentPlanTab === '培养目标'">
            <article class="student-goal-overview">
              <span>培养目标概述</span>
              <p>{{ studentCareerPlanData.overview }}</p>
            </article>
            <div class="student-goal-list">
              <article v-for="(goal, index) in studentCareerPlanData.goals" :key="goal" class="student-goal-card">
                <div class="student-goal-icon">◎</div>
                <div>
                  <strong>目标{{ index + 1 }}</strong>
                  <p>{{ goal }}</p>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="activeStudentPlanTab === '毕业要求'">
            <article class="student-section-note">
              <strong>毕业要求</strong>
              <p>{{ studentCareerPlanData.graduationOverview }}</p>
            </article>
            <div class="student-requirement-list">
              <article v-for="item in studentCareerPlanData.requirements" :key="item.code" class="student-requirement-card">
                <div class="student-requirement-code">{{ item.code }}</div>
                <div class="student-requirement-content">
                  <strong>{{ item.title }}</strong>
                  <p v-for="(child, childIndex) in item.children" :key="`${item.code}-${childIndex}`">
                    {{ child }}
                  </p>
                </div>
              </article>
            </div>
          </template>

          <template v-else>
            <div class="student-course-toolbar">
              <button class="student-year-switch" type="button">{{ studentCareerPlanData.courseYear }}</button>
              <span>颜色说明</span>
              <em>蓝色表示已接入课程智能体，灰色表示基础课程或待完善课程资料。</em>
            </div>
            <section
              v-for="group in studentSemesterCourseGroups"
              :key="group.semester"
              class="student-semester-section"
            >
              <h2>{{ group.semester }}</h2>
              <div class="student-course-grid">
                <article
                  v-for="course in group.courses"
                  :key="`${group.semester}-${course.code}`"
                  class="student-course-card"
                  :class="`tone-${course.tone}`"
                >
                  <div class="student-course-card-head">
                    <span>{{ course.type.includes('必修') ? '必修' : '选修' }}</span>
                    <strong>{{ course.name }}</strong>
                  </div>
                  <dl>
                    <div><dt>课程代码</dt><dd>{{ course.code }}</dd></div>
                    <div><dt>课程学分</dt><dd>{{ course.credits }}</dd></div>
                    <div><dt>课程目标</dt><dd>{{ course.target }}</dd></div>
                    <div><dt>先后修</dt><dd>{{ course.prerequisite }}</dd></div>
                  </dl>
                  <p>{{ course.agent || '暂未开通课程智能体' }}</p>
                </article>
              </div>
            </section>
          </template>
        </section>

        <aside class="career-agent-panel" aria-label="学涯规划助手">
          <header>
            <div class="career-agent-avatar">AI</div>
            <h2>学涯规划助手</h2>
            <button type="button" aria-label="关闭助手">×</button>
          </header>

          <section class="career-agent-body">
            <article class="career-agent-opening">
              <p>我是你的学涯规划助手，会结合本专业培养目标、毕业要求、课程体系和岗位方向，帮你看清每门课为什么学、支撑什么能力、未来能对接哪些岗位。</p>
            </article>

            <section class="career-agent-jobs">
              <h3>该专业涉及的岗位</h3>
              <div>
                <article v-for="job in studentCareerPlanData.jobs" :key="job.name">
                  <strong>{{ job.name }}</strong>
                  <span>{{ job.meta }}</span>
                  <p>{{ job.skills }}</p>
                </article>
              </div>
            </section>
          </section>

          <footer class="career-agent-input">
            <section class="career-agent-prompts">
              <h3>快捷指令</h3>
              <button
                v-for="prompt in studentCareerPlanData.prompts"
                :key="prompt"
                type="button"
                :class="{ active: activeStudentPrompt === prompt }"
                @click="selectStudentAgentPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </section>
            <textarea
              v-model="studentAgentInput"
              placeholder="培养方案有困惑？问问学涯规划助手"
              rows="2"
            ></textarea>
            <button class="career-agent-send" type="button" aria-label="发送">➤</button>
          </footer>
        </aside>
      </section>
    </section>
  </main>
</template>
