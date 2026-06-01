import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')

function getSegment(source, startToken, endToken) {
  const start = source.indexOf(startToken)
  assert.notEqual(start, -1, `Missing start token: ${startToken}`)
  const end = endToken ? source.indexOf(endToken, start) : source.length
  assert.notEqual(end, -1, `Missing end token: ${endToken}`)
  return source.slice(start, end)
}

test('app imports the decision center mock and tracks module + page state', () => {
  for (const pattern of [
    /from '\.\/mock\/decision-center'/,
    /const activeDecision\w+\s*=\s*ref\(/,
    /const decisionPlanStatus\s*=\s*ref(?:<[^>]+>)?\(/,
    /const decisionCourseStatus\s*=\s*ref(?:<[^>]+>)?\(/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('app renders the approved decision-center navigation and flow actions', () => {
  for (const pattern of [
    /decisionCenterMenuGroups/,
    /activeDecisionPage === 'overview'/,
    /activeDecisionPage === 'plan-analysis'/,
    /activeDecisionPage === 'course-diagnosis'/,
    /startDecisionPlanAnalysis|startDecisionCourseAnalysis/,
    /重新方案分析/,
    /课程交叉分析|courseDiagnosisStates\.(?:pending\.modeTabs|result\.topTabs)/,
    /v-for="tab in courseDiagnosisStates\.(?:pending\.modeTabs|result\.topTabs)"[\s\S]{0,220}@click="activeDecisionCourseTab = tab"/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('app includes persistence-related decision-center wiring tokens', () => {
  for (const pattern of [
    /localStorage/,
    /decision-center-state/,
    /active:\s*currentModule\.value === '决策中心'/,
    /improvementState:\s*decisionImprovementState\.value/,
    /improvementState\?:\s*'default' \| 'refreshing' \| 'empty' \| 'warning'/,
    /decisionImprovementState\.value\s*=\s*saved\.improvementState/,
    /restoredPlanStatus === 'loading' \? 'pending' : restoredPlanStatus/,
    /restoredCourseStatus === 'loading' \? 'pending' : restoredCourseStatus/,
    /planModeTab/,
    /setItem|getItem/,
    /JSON\.stringify|JSON\.parse/
  ]) {
    assert.match(appVue, pattern)
  }
})

test('app persists improvement-state changes and narrows default improvement data for the dedicated branch', () => {
  const persistenceWatch = getSegment(
    appVue,
    'watch(\n  [currentModule, activeDecisionGroup, activeDecisionPage, activeDecisionPlanModeTab, activeDecisionPlanTab, activeDecisionCourseTab',
    'watch(filteredCourseJobAbilityOptions'
  )
  const improvementBranch = getSegment(
    appVue,
    '<template v-else-if="activeDecisionPage === \'improvement\'">',
    '          </section>\n        </template>'
  )

  assert.match(appVue, /const decisionImprovementDefaultState = computed\(\(\) => decisionImprovementPage\.states\.default\)/)
  assert.match(persistenceWatch, /decisionImprovementState/)
  assert.match(improvementBranch, /decisionImprovementDefaultState\.heroSignals/)
  assert.match(improvementBranch, /decisionImprovementDefaultState\.headlineSummary/)
  assert.match(improvementBranch, /decisionImprovementDefaultState\.evidenceMatrix/)
  assert.match(improvementBranch, /decisionImprovementDefaultState\.courseAdjustments/)
  assert.match(improvementBranch, /decisionImprovementDefaultState\.trainingAdditions/)
  assert.match(improvementBranch, /decisionImprovementDefaultState\.resourceRecommendations/)
  assert.match(improvementBranch, /decisionImprovementDefaultState\.deliveryTimeline/)
  assert.doesNotMatch(improvementBranch, /activeDecisionImprovementState\.heroSignals/)
})

test('app renders a dedicated improvement report layout instead of the generic placeholder page', () => {
  const placeholderComputed = getSegment(
    appVue,
    'const activeDecisionPlaceholderPage = computed(() => {',
    'const activeDecisionImprovementState = computed(() =>'
  )
  const placeholderBranchIndex = appVue.indexOf('<template v-else-if="activeDecisionPlaceholderPage">')
  const improvementBranchIndex = appVue.indexOf('<template v-else-if="activeDecisionPage === \'improvement\'">')
  const improvementBranch = getSegment(
    appVue,
    '<template v-else-if="activeDecisionPage === \'improvement\'">',
    '          </section>\n        </template>'
  )
  const switcherBlock = getSegment(
    improvementBranch,
    'class="decision-improvement-state-switcher"',
    '                <section v-if="decisionImprovementState === \'default\'"'
  )

  assert.match(placeholderComputed, /if \(activeDecisionPage\.value === 'improvement'\) return null/)
  assert.match(placeholderComputed, /governancePlaceholderPages/)
  assert.ok(placeholderBranchIndex < improvementBranchIndex, 'placeholder branch should stay before improvement branch')
  assert.match(improvementBranch, /decision-improvement-page/)
  assert.doesNotMatch(improvementBranch, /activeDecisionPlaceholderPage/)

  assert.match(switcherBlock, /:aria-label="decisionImprovementPage\.stateSwitcher\.ariaLabel"/)
  assert.match(switcherBlock, /v-for="option in decisionImprovementPage\.stateSwitcher\.options"/)
  assert.match(switcherBlock, /:aria-pressed="decisionImprovementState === option\.value"/)
  assert.match(switcherBlock, /@click="decisionImprovementState = option\.value"/)
  assert.match(switcherBlock, /option\.label/)
  assert.match(switcherBlock, /option\.note/)

  const stateConditions = Array.from(
    improvementBranch.matchAll(/decisionImprovementState === '(default|refreshing|empty|warning)'/g),
    (match) => match[1]
  )
  assert.deepEqual(stateConditions, ['default', 'refreshing', 'empty', 'warning'])
  assert.match(improvementBranch, /decisionImprovementPage\.states\.refreshing\.title/)
  assert.match(improvementBranch, /decisionImprovementPage\.states\.refreshing\.message/)
  assert.match(improvementBranch, /decisionImprovementPage\.states\.empty\.description/)
  assert.match(improvementBranch, /decisionImprovementPage\.states\.warning\.title/)
  assert.match(improvementBranch, /decisionImprovementPage\.states\.warning\.warningFlags/)
  assert.match(improvementBranch, /decision-improvement-hero/)
  assert.match(improvementBranch, /decision-improvement-matrix/)
  assert.match(improvementBranch, /decision-improvement-actions/)
  assert.match(improvementBranch, /decision-improvement-timeline/)
})
