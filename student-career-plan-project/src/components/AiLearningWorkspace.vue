<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { careerCommands, learningChapters, learningCourse, professionalAbilities, resolveCareerReply, type CareerCommandId, type LearningUnit } from '../data/learning-space'
import { studentCareerPlanData } from '../data/student-career-plan-data'
import LearningIcon from './LearningIcon.vue'
import CourseVideoPlayer from './CourseVideoPlayer.vue'
import '../styles/learning-space.css'

type ReferenceView = 'information' | 'abilities'
type InfoTab = 'goals' | 'requirements' | 'outline' | 'relations'
type PlanTab = '专业介绍' | '培养目标' | '毕业要求' | '课程体系'
type Reply = ReturnType<typeof resolveCareerReply>
type ChatMessage = { id: number; role: 'user' | 'assistant'; text: string; reply?: Reply }
const allUnits = learningChapters.flatMap(chapter => chapter.units)
const requestedUnitId = new URLSearchParams(window.location.search).get('unit')
const selectedUnitId = ref(allUnits.find(unit => unit.id === requestedUnitId)?.id ?? allUnits.find(unit => unit.id === 'derivative-meaning')?.id ?? allUnits[0]!.id)
const selectedUnit = computed(() => allUnits.find(unit => unit.id === selectedUnitId.value)!)
const selectedChapter = computed(() => learningChapters.find(chapter => chapter.units.some(unit => unit.id === selectedUnitId.value))!)
const unitQuery = ref('')
const visibleChapters = computed(() => learningChapters.map(chapter => ({ ...chapter, units: chapter.units.filter(unit => `${chapter.title} ${unit.title}`.includes(unitQuery.value.trim())) })).filter(chapter => chapter.units.length))
const completion = Math.round(allUnits.filter(unit => unit.completed).length / allUnits.length * 100)
const referenceView = ref<ReferenceView>('information')
const referenceDialog = ref<HTMLDialogElement | null>(null)
const coursePlayer = ref<InstanceType<typeof CourseVideoPlayer> | null>(null)
const infoTab = ref<InfoTab>('goals')
const guideTab = ref<'guide' | 'transcript' | 'discussion'>('guide')
const guideQuery = ref('')
const visibleGuide = computed(() => selectedUnit.value.guide.map((step, index) => ({ ...step, index })).filter(step => `${step.title} ${step.description}`.includes(guideQuery.value.trim())))
const guideStep = ref(0)
const selectedAbilityId = ref(professionalAbilities[0]!.id)
const selectedAbility = computed(() => professionalAbilities.find(ability => ability.id === selectedAbilityId.value)!)
const supportingRequirements = computed(() => studentCareerPlanData.requirements.filter(requirement => learningCourse.goals.some(goal => goal.requirementCodes.includes(requirement.code))))
const assistantMode = ref<'career' | 'learning'>('learning')
const chatInput = ref('')
const messages = ref<ChatMessage[]>([])
const messageList = ref<HTMLElement | null>(null)
const activeCommand = ref<string>('')
const historyOpen = ref(false)
const sessions = ref<{ label: string; mode: 'career' | 'learning'; messages: ChatMessage[] }[]>([])
let messageId = 0
const planDialog = ref<HTMLDialogElement | null>(null)
const activePlanTab = ref<PlanTab>('专业介绍')
const planTabs: PlanTab[] = ['专业介绍', '培养目标', '毕业要求', '课程体系']
const informationTabs: { id: InfoTab; label: string }[] = [{ id: 'goals', label: '课程目标' }, { id: 'requirements', label: '毕业支撑' }, { id: 'outline', label: '教学大纲' }, { id: 'relations', label: '先后修' }]
const commandIcons: Record<CareerCommandId, string> = { goals: 'target', requirements: 'link', outline: 'file', relations: 'layers', abilities: 'briefcase', plan: 'book' }
const unitIcon = (unit: LearningUnit) => unit.type === '视频' ? 'video' : unit.type === '练习' ? 'pen' : 'file'
const selectUnit = (id: string) => { selectedUnitId.value = id; guideStep.value = 0; guideQuery.value = ''; guideTab.value = 'guide' }
const selectGuide = (index: number) => {
  guideStep.value = index
  if (selectedUnit.value.type !== '视频') return
  const parts = selectedUnit.value.guide[index]?.time.split(':').map(Number)
  if (parts?.length === 2 && parts.every(Number.isFinite)) coursePlayer.value?.seekTo(parts[0]! * 60 + parts[1]!)
}
const moveUnit = (offset: number) => {
  const next = allUnits[allUnits.findIndex(unit => unit.id === selectedUnitId.value) + offset]
  if (next) selectUnit(next.id)
}
const openPlan = () => { activePlanTab.value = '专业介绍'; planDialog.value?.showModal() }
const closePlan = () => planDialog.value?.close()
const openReference = (kind: Reply['kind']) => {
  if (kind === 'plan') { openPlan(); return }
  if (kind === 'help') return
  referenceView.value = kind === 'abilities' ? 'abilities' : 'information'
  if (kind !== 'abilities') infoTab.value = kind
  if (!referenceDialog.value?.open) referenceDialog.value?.showModal()
}
const scrollMessages = () => nextTick(() => { if (messageList.value) messageList.value.scrollTop = messageList.value.scrollHeight })
const learningReply = (question: string): Reply => {
  if (/应用|工程|专业/.test(question)) return { kind: 'abilities', title: '从数学方法到工程问题', paragraphs: [selectedUnit.value.description, professionalAbilities[0]!.description, '高等数学提供分析和计算基础；岗位中的专业软件操作、现场实施还需结合后续专业课程与实践训练。'] }
  return { kind: 'help', title: selectedUnit.value.title, paragraphs: [selectedUnit.value.description, `关键表达：${selectedUnit.value.formula}`, selectedUnit.value.guide[guideStep.value]?.description ?? selectedUnit.value.transcript[0]!, '你可以结合下方知识导引继续学习，也可以切换学涯规划助手查询本课程与专业培养的关系。'] }
}
const sendQuestion = (question = chatInput.value) => {
  const trimmed = question.trim()
  if (!trimmed) return
  const reply = assistantMode.value === 'career' ? resolveCareerReply(trimmed) : learningReply(trimmed)
  messages.value.push({ id: ++messageId, role: 'user', text: trimmed }, { id: ++messageId, role: 'assistant', text: reply.title, reply })
  activeCommand.value = reply.kind
  chatInput.value = ''
  historyOpen.value = false
  scrollMessages()
}
const onComposerEnter = (event: KeyboardEvent) => {
  if (event.isComposing || event.keyCode === 229) return
  event.preventDefault()
  sendQuestion()
}
const archiveConversation = () => {
  if (messages.value.length) sessions.value.unshift({ label: messages.value[0]!.text, mode: assistantMode.value, messages: [...messages.value] })
  messages.value = []; activeCommand.value = ''; chatInput.value = ''
}
const switchAssistant = (mode: 'career' | 'learning') => {
  if (assistantMode.value === mode) return
  archiveConversation(); assistantMode.value = mode; historyOpen.value = false
}
const restoreSession = (index: number) => {
  const session = sessions.value.splice(index, 1)[0]
  if (!session) return
  archiveConversation(); assistantMode.value = session.mode; messages.value = session.messages; historyOpen.value = false; scrollMessages()
}
const explainCurrentVideo = () => { switchAssistant('learning'); sendQuestion('解释当前视频的知识点') }
onBeforeUnmount(() => { planDialog.value?.close(); referenceDialog.value?.close() })
</script>

<template>
  <main class="learning-workspace">
    <header class="learning-topbar">
      <a class="learning-brand-mark" href="?view=teaching" aria-label="返回课程中心"><LearningIcon name="book" :size="22" /></a>
      <div class="learning-course-title"><h1>{{ learningCourse.name }}</h1><span>{{ learningCourse.major }}<i> / </i>{{ learningCourse.className }}</span></div>
      <span class="learning-term">{{ learningCourse.term }}</span>
      <button class="learning-plan-button" @click="openPlan"><LearningIcon name="book" :size="17" />专业培养方案<LearningIcon name="chevron" :size="14" /></button>
    </header>

    <section class="learning-layout">
      <aside class="learning-directory" aria-label="课程目录">
        <header><h2>课程目录</h2><span>{{ allUnits.length }} 个学习资源</span></header>
        <div class="learning-progress"><div><span>学习进度</span><strong>{{ completion }}<small>%</small></strong></div><div class="learning-progress-track"><i :style="{ width: completion + '%' }"></i></div><p>已完成 {{ allUnits.filter(unit => unit.completed).length }} / {{ allUnits.length }} 个资源</p></div>
        <label class="learning-search"><LearningIcon name="search" :size="16" /><input v-model="unitQuery" type="search" aria-label="搜索知识点或资源" placeholder="搜索知识点或资源" /></label>
        <div class="learning-directory-scroll">
          <section v-for="chapter in visibleChapters" :key="chapter.id" class="learning-chapter">
            <h3><span>{{ chapter.title }}</span><small>{{ chapter.units.length }}</small></h3>
            <button v-for="unit in chapter.units" :key="unit.id" class="learning-unit" :class="{ active: unit.id === selectedUnitId }" :aria-current="unit.id === selectedUnitId ? 'true' : undefined" @click="selectUnit(unit.id)">
              <LearningIcon :name="unitIcon(unit)" :size="17" /><span><strong>{{ unit.title }}</strong><small>{{ unit.type }}<i>·</i>{{ unit.duration }}</small></span><LearningIcon v-if="unit.completed" class="learning-done" name="check" :size="14" /><i v-else class="learning-unit-dot"></i>
            </button>
          </section>
          <p v-if="!visibleChapters.length" class="learning-empty">未找到相关知识点或资源</p>
        </div>
        <footer><LearningIcon name="book" :size="16" /><span>{{ learningCourse.credits }} 学分<i>·</i>{{ learningCourse.hours }} 学时</span><button @click="openReference('outline')">查看大纲</button></footer>
      </aside>

      <section class="learning-main learning-video-first">
        <header class="learning-main-heading">
          <h2>{{ selectedChapter.title }}</h2>
          <button class="learning-helper-button" @click="switchAssistant('career')"><span>AI</span>学涯助手</button>
        </header>
        <div class="learning-main-scroll">
          <article class="learning-resource-card learning-video-card">
            <header class="learning-video-card-head">
              <span class="learning-type-tag"><LearningIcon :name="unitIcon(selectedUnit)" :size="14" />{{ selectedUnit.type }}</span>
              <h3>{{ selectedUnit.title }}</h3>
              <span class="learning-video-deadline">学习截止：2027-01-10</span>
              <span class="learning-resource-status" :class="{ done: selectedUnit.completed }">{{ selectedUnit.completed ? '已完成' : '待学习' }}</span>
              <button @click="openReference('goals')">课程详情</button>
            </header>
            <CourseVideoPlayer v-if="selectedUnit.type === '视频'" :key="selectedUnit.id" ref="coursePlayer" :unit="selectedUnit" @confused="explainCurrentVideo" />
            <section v-else class="learning-reading-content">
              <h4>{{ selectedUnit.title }}</h4><div class="learning-formula">{{ selectedUnit.formula }}</div>
              <p v-for="(paragraph, index) in selectedUnit.transcript" :key="index">{{ paragraph }}</p>
            </section>
          </article>
          <section class="learning-guide-section">
            <nav class="learning-video-support-tabs" aria-label="资源内容">
              <button :class="{ active: guideTab === 'guide' }" @click="guideTab = 'guide'">知识导引<span>{{ selectedUnit.guide.length }}</span></button>
              <button :class="{ active: guideTab === 'transcript' }" @click="guideTab = 'transcript'">{{ selectedUnit.type === '视频' ? '讲稿' : '学习内容' }}</button>
              <button :class="{ active: guideTab === 'discussion' }" @click="guideTab = 'discussion'">讨论区 (0)</button>
              <label v-if="guideTab === 'guide'" class="learning-guide-search"><LearningIcon name="search" :size="15" /><input v-model="guideQuery" type="search" aria-label="搜索知识导引" placeholder="搜索知识导引" /></label>
            </nav>
            <div v-if="guideTab === 'guide'" class="learning-guide-list">
              <button v-for="step in visibleGuide" :key="step.time" :class="{ active: guideStep === step.index }" @click="selectGuide(step.index)"><span class="learning-guide-number">{{ String(step.index + 1).padStart(2, '0') }}</span><span><strong>{{ step.title }}</strong><small>{{ step.description }}</small></span><time>{{ step.time }}</time></button>
              <p v-if="!visibleGuide.length" class="learning-empty">未找到相关知识导引</p>
            </div>
            <div v-else-if="guideTab === 'transcript'" class="learning-transcript"><p v-for="(paragraph, index) in selectedUnit.transcript" :key="index">{{ paragraph }}</p></div>
            <div v-else class="learning-discussion-empty"><LearningIcon name="file" :size="28" /><p>暂无讨论</p></div>
          </section>
          <footer class="learning-pager"><button :disabled="selectedUnitId === allUnits[0]?.id" @click="moveUnit(-1)"><LearningIcon name="back" :size="16" />上一资源</button><span>{{ allUnits.findIndex(unit => unit.id === selectedUnitId) + 1 }} / {{ allUnits.length }}</span><button :disabled="selectedUnitId === allUnits[allUnits.length - 1]?.id" @click="moveUnit(1)">下一资源<LearningIcon name="arrow" :size="16" /></button></footer>
        </div>
      </section>

      <aside class="learning-assistant" aria-label="课程助手">
        <header class="learning-assistant-header"><nav aria-label="助手类型"><button :class="{ active: assistantMode === 'learning' }" :aria-pressed="assistantMode === 'learning'" @click="switchAssistant('learning')">AI 学伴</button><button :class="{ active: assistantMode === 'career' }" :aria-pressed="assistantMode === 'career'" @click="switchAssistant('career')">学涯规划助手</button></nav><button class="learning-icon-button" aria-label="历史会话" :aria-expanded="historyOpen" @click="historyOpen = !historyOpen"><LearningIcon name="history" :size="17" /></button><button class="learning-icon-button" aria-label="新会话" @click="archiveConversation(); historyOpen = false"><LearningIcon name="plus" :size="18" /></button></header>
        <div v-if="historyOpen" class="learning-session-list"><h3>历史会话</h3><p v-if="!sessions.length">暂无历史会话，新会话开始后可在这里找回之前的对话。</p><button v-for="(session, index) in sessions" :key="index" @click="restoreSession(index)">{{ session.label }}<LearningIcon name="chevron" :size="14" /></button></div>
        <div class="learning-assistant-context"><span></span>{{ learningCourse.major }}<i>·</i>{{ learningCourse.name }}</div>
        <div ref="messageList" class="learning-messages" role="log" aria-label="助手会话" aria-live="polite">
          <div v-if="!messages.length" class="learning-assistant-welcome"><span class="learning-assistant-symbol"><LearningIcon name="spark" :size="28" /></span><small>你的课程与专业学习伙伴</small><h3>{{ assistantMode === 'career' ? '了解课程与专业的关系' : '一起理解每一个知识点' }}</h3><p v-if="assistantMode === 'career'">你好，我是你的学涯规划助手。<br />从课程目标到专业能力，帮你了解为什么学、学什么，以及与未来岗位的关系。</p><p v-else>围绕当前知识点梳理概念和方法，也可以结合智能建造中的工程问题理解应用。</p><p class="learning-welcome-tip">选择下方快捷指令，或输入你关心的问题</p></div>
          <article v-for="message in messages" :key="message.id" class="learning-chat-message" :class="message.role"><template v-if="message.role === 'user'">{{ message.text }}</template><template v-else><div class="learning-reply-title"><LearningIcon name="spark" :size="16" /><strong>{{ message.reply?.title }}</strong></div><p v-for="(paragraph, index) in message.reply?.paragraphs" :key="index">{{ paragraph }}</p><button v-if="message.reply && message.reply.kind !== 'help'" class="learning-reply-reference" @click="openReference(message.reply.kind)">查看{{ careerCommands.find(command => command.id === message.reply?.kind)?.label }}<LearningIcon name="arrow" :size="14" /></button></template></article>
        </div>
        <footer class="learning-assistant-footer"><div v-if="assistantMode === 'career'" class="learning-command-grid"><button v-for="command in careerCommands" :key="command.id" :class="{ active: activeCommand === command.id }" @click="sendQuestion(command.question)"><LearningIcon :name="commandIcons[command.id]" :size="15" />{{ command.label }}</button></div><div v-else class="learning-study-commands"><button @click="sendQuestion('解释当前知识点')">解释当前知识点</button><button @click="sendQuestion('如何用于工程问题？')">联系工程应用</button></div><form class="learning-composer" @submit.prevent="sendQuestion()"><textarea v-model="chatInput" rows="2" aria-label="向课程助手提问" :placeholder="assistantMode === 'career' ? '这门课与我的专业有什么关系？' : '对这个知识点有什么疑问？'" @keydown.enter.exact="onComposerEnter"></textarea><div><span>基于课程与专业资料解读</span><button :disabled="!chatInput.trim()" type="submit" aria-label="发送问题"><LearningIcon name="send" :size="17" /></button></div></form><p class="learning-assistant-note">AI 内容仅供学习参考，请以学校发布文件为准</p></footer>
      </aside>
    </section>

    <dialog ref="referenceDialog" class="learning-plan-dialog learning-reference-dialog" aria-labelledby="learning-reference-title" @cancel.prevent="referenceDialog?.close()" @click="event => { if (event.target === referenceDialog) referenceDialog?.close() }">
      <header class="learning-plan-dialog-head"><div><span class="learning-eyebrow">{{ learningCourse.major }} · {{ learningCourse.name }}</span><h2 id="learning-reference-title">{{ referenceView === 'information' ? '课程信息' : '专业能力与岗位需求' }}</h2></div><button class="learning-icon-button" aria-label="关闭课程资料" @click="referenceDialog?.close()"><LearningIcon name="close" :size="21" /></button></header>
      <div class="learning-plan-dialog-body">
          <section v-if="referenceView === 'information'" class="learning-information">
            <div class="learning-section-heading"><div><small>课程基本信息</small><h3>{{ learningCourse.planCourseName }}</h3></div><span>{{ learningCourse.code }} · {{ learningCourse.credits }} 学分 · {{ learningCourse.hours }} 学时</span></div>
            <nav class="learning-segmented" aria-label="课程信息类型"><button v-for="tab in informationTabs" :key="tab.id" :class="{ active: infoTab === tab.id }" :aria-pressed="infoTab === tab.id" @click="infoTab = tab.id">{{ tab.label }}</button></nav>
            <template v-if="infoTab === 'goals'"><p class="learning-section-intro">理解数学概念，掌握基本方法，为智能建造中的工程计算与问题分析打好基础。</p><article v-for="goal in learningCourse.goals" :key="goal.id" class="learning-goal-card"><span>{{ goal.id }}</span><div><h4>{{ goal.title }}</h4><p>{{ goal.description }}</p><small>关联毕业要求：{{ goal.requirementCodes.join('、') }}</small></div></article></template>
            <template v-else-if="infoTab === 'requirements'"><p class="learning-section-intro">从课程目标查看对毕业要求的支撑关系。</p><article v-for="requirement in supportingRequirements" :key="requirement.code" class="learning-requirement-card"><h4><span>{{ requirement.code }}</span>{{ requirement.title }}</h4><p>{{ requirement.children.join('') }}</p><div class="learning-relation-tags"><span v-for="goal in learningCourse.goals.filter(item => item.requirementCodes.includes(requirement.code))" :key="goal.id">{{ goal.id }} {{ goal.title }}</span></div></article></template>
            <template v-else-if="infoTab === 'outline'"><p class="learning-section-intro">教学内容按 {{ learningCourse.hours }} 学时安排，学习从基础概念逐步过渡到工程应用。</p><article v-for="(chapter, index) in learningCourse.outline" :key="chapter.title" class="learning-outline-row"><span>{{ String(index + 1).padStart(2, '0') }}</span><div><h4>{{ chapter.title }}</h4><p>{{ chapter.topics.join(' · ') }}</p></div><strong>{{ chapter.hours }}<small>学时</small></strong></article></template>
            <template v-else><p class="learning-section-intro">先修知识帮助理解当前课程，后续课程将继续使用这些数学方法。</p><div class="learning-course-relations"><h4>先修基础</h4><article v-for="course in learningCourse.prerequisites" :key="course.name"><LearningIcon name="book" :size="18" /><div><strong>{{ course.name }}</strong><p>{{ course.description }}</p></div></article><div class="learning-current-course"><LearningIcon name="layers" :size="20" /><strong>{{ learningCourse.planCourseName }}</strong><span>当前课程</span></div><h4>后续课程</h4><article v-for="course in learningCourse.followUps" :key="course.name"><LearningIcon name="book" :size="18" /><div><strong>{{ course.name }}</strong><p>{{ course.description }}</p></div></article></div></template>
          </section>

          <section v-else class="learning-abilities"><div class="learning-section-heading"><div><small>课程与岗位关联</small><h3>这门课支撑哪些专业能力</h3></div><span>{{ professionalAbilities.length }} 项能力</span></div><p class="learning-section-intro">从数学基础延伸到专业应用，查看能力对应的岗位任务与要求。</p><div class="learning-ability-options"><button v-for="(ability, index) in professionalAbilities" :key="ability.id" :class="{ active: selectedAbilityId === ability.id }" :aria-pressed="selectedAbilityId === ability.id" @click="selectedAbilityId = ability.id"><span>0{{ index + 1 }}</span><strong>{{ ability.title }}</strong><LearningIcon name="chevron" :size="16" /></button></div><article class="learning-ability-detail"><span class="learning-eyebrow">课程能力支撑</span><h4>{{ selectedAbility.title }}</h4><p>{{ selectedAbility.description }}</p><div class="learning-relation-tags"><span v-for="goalId in selectedAbility.goalIds" :key="goalId">{{ goalId }} {{ learningCourse.goals.find(goal => goal.id === goalId)?.title }}</span></div></article><h4 class="learning-demand-heading"><LearningIcon name="briefcase" :size="19" />对应岗位需求</h4><article v-for="demand in selectedAbility.demands" :key="demand.job + demand.task" class="learning-demand-card"><h5>{{ demand.job }}</h5><div><span>典型任务</span><p>{{ demand.task }}</p></div><div><span>能力要求</span><p>{{ demand.requirement }}</p></div></article><p class="learning-evidence-note">岗位要求依据专业岗位画像整理；本课程提供基础支撑，需结合专业课程与实践形成岗位能力。</p></section>
      </div>
      <footer class="learning-plan-dialog-footer"><span>课程资料与当前学习内容关联</span><button @click="referenceDialog?.close()">返回课程学习<LearningIcon name="arrow" :size="15" /></button></footer>
    </dialog>

    <dialog ref="planDialog" class="learning-plan-dialog" aria-labelledby="learning-plan-title" @cancel.prevent="closePlan" @click="(event) => { if (event.target === planDialog) closePlan() }"><div class="learning-plan-dialog-head"><div><span class="learning-eyebrow">{{ studentCareerPlanData.cohort }} · 本科 · 四年</span><h2 id="learning-plan-title">{{ learningCourse.major }}专业培养方案</h2></div><button class="learning-icon-button" aria-label="关闭培养方案" @click="closePlan"><LearningIcon name="close" :size="21" /></button></div><nav class="learning-plan-tabs" aria-label="培养方案内容"><button v-for="tab in planTabs" :key="tab" :class="{ active: activePlanTab === tab }" :aria-pressed="activePlanTab === tab" @click="activePlanTab = tab">{{ tab }}</button></nav><div class="learning-plan-dialog-body"><template v-if="activePlanTab === '专业介绍'"><div class="learning-major-banner"><span><LearningIcon name="layers" :size="28" /></span><div><h3>{{ learningCourse.major }}</h3><p>数字技术与建筑工程交叉融合</p></div></div><h4>专业介绍</h4><p>面向建筑行业数字化与智能化发展，学习工程基础、建筑信息模型、智能施工与工程数据分析等知识，培养解决工程现场实际问题的能力。</p><h4>培养定位</h4><p>{{ studentCareerPlanData.overview }}</p><h4>职业发展方向</h4><div class="learning-major-jobs"><span v-for="job in studentCareerPlanData.jobs" :key="job.name">{{ job.name }}</span></div></template><template v-else-if="activePlanTab === '培养目标'"><p class="learning-section-intro">围绕职业素养、专业基础、技术应用与协同创新，形成以下培养目标。</p><article v-for="(goal, index) in studentCareerPlanData.goals" :key="index" class="learning-plan-goal"><span>0{{ index + 1 }}</span><p>{{ goal }}</p></article></template><template v-else-if="activePlanTab === '毕业要求'"><p class="learning-section-intro">{{ studentCareerPlanData.graduationOverview }}</p><article v-for="requirement in studentCareerPlanData.requirements" :key="requirement.code" class="learning-requirement-card"><h4><span>{{ requirement.code }}</span>{{ requirement.title }}</h4><ul><li v-for="child in requirement.children" :key="child">{{ child }}</li></ul></article></template><template v-else><p class="learning-section-intro">按学期查看主要课程，当前课程标注于第 1 学期。</p><section v-for="semester in studentCareerPlanData.semesters" :key="semester.name" class="learning-plan-semester"><h4>{{ semester.name }}</h4><div><article v-for="course in semester.courses" :key="course.code" :class="{ current: course.code === learningCourse.code }"><span>{{ course.name }}<small v-if="course.code === learningCourse.code">当前课程</small></span><em>{{ course.type }}</em><strong>{{ course.credits }} 学分</strong></article></div></section></template></div><footer class="learning-plan-dialog-footer"><span>专业学习有疑问，可回到课程向学涯规划助手提问</span><button @click="closePlan">返回课程学习<LearningIcon name="arrow" :size="15" /></button></footer></dialog>
  </main>
</template>
