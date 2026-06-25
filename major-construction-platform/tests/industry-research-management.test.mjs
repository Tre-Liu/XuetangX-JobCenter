import { readFile } from 'node:fs/promises'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readCssWithImports } from './helpers/read-css.mjs'

const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const industryResearchData = await readFile(new URL('../src/app/industry-research-management.ts', import.meta.url), 'utf8')
const jobResearchMock = await readFile(new URL('../src/mock/job-research.ts', import.meta.url), 'utf8')
const stylesCss = await readCssWithImports(new URL('../src/styles.css', import.meta.url))
const localHtml = await readFile(new URL('../outputs/industry-research-admin.html', import.meta.url), 'utf8')
const rootLocalHtml = await readFile(new URL('../industry-research-admin.html', import.meta.url), 'utf8')
const styleBlock = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = stylesCss.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`))
  assert.ok(match, `${selector} style block should exist`)
  return match[1]
}

test('industry research management renders as a standalone CMS admin page', () => {
  assert.match(appVue, /currentViewParam === 'industry-research-admin'/)
  assert.match(appVue, /class="cms-admin-shell"/)
  assert.match(appVue, /class="cms-sidebar"/)
  assert.match(appVue, /平台管理 \/ AI 课程管理/)
  assert.match(appVue, /class="cms-management-card"/)
})

test('CMS professional construction tabs expose industry research management', () => {
  assert.match(appVue, /label: '产业调研'/)
  assert.match(appVue, /cmsProfessionalTabs/)
  assert.doesNotMatch(appVue, /topModulesWithIndustryResearch/)
})

test('industry research management supports initialization progress before recommendations', () => {
  assert.match(appVue, /industryResearchStatus = ref<'idle' \| 'initializing' \| 'ready'>\('idle'\)/)
  assert.match(appVue, /startIndustryResearchInitialization/)
  assert.match(appVue, /setTimeout\(\(\) => \{[\s\S]*industryResearchStatus\.value = 'ready'/)
  assert.match(appVue, /初始化中/)
  assert.match(appVue, /正在根据\{\{ confirmedCmsIndustryMajor\?\.name \|\| '专业名称' \}\}、培养方向、岗位资料和已有专业数据生成产业链推荐/)
})

test('industry research initialization requires selecting an official ministry-filed major first', () => {
  assert.match(appVue, /type CmsIndustryOfficialMajorLevel = 'undergraduate' \| 'vocational'/)
  assert.match(appVue, /cmsIndustryMajorPickerOpen = ref\(false\)/)
  assert.match(appVue, /openIndustryResearchMajorPicker/)
  assert.match(appVue, /confirmIndustryResearchMajorSelection/)
  assert.match(appVue, /教育部备案专业/)
  assert.match(appVue, /匹配产业链数据/)
  assert.match(appVue, /placeholder="搜索专业名称或专业代码"/)
  assert.match(appVue, /industryMajorPageSize = 8/)
  assert.match(appVue, /filteredCmsIndustryOfficialMajors = computed/)
  assert.match(appVue, /paginatedCmsIndustryOfficialMajors = computed/)
  assert.match(appVue, /setCmsIndustryMajorPage\(page\)/)
  assert.match(appVue, /cms-industry-major-dialog/)
  assert.match(appVue, /cms-industry-major-pagination/)
  assert.match(appVue, /input\s+type="radio"/)
  assert.match(appVue, /080717T/)
  assert.match(appVue, /人工智能/)
  assert.match(appVue, /510209/)
  assert.match(appVue, /人工智能技术应用/)
  assert.match(appVue, /@click="openIndustryResearchMajorPicker"/)
  assert.doesNotMatch(appVue, /自定义专业/)
  assert.doesNotMatch(appVue, /cmsCustomMajorName/)
})

test('standalone CMS initialization mirrors official major selection without custom input', () => {
  for (const [label, source] of [
    ['outputs static html', localHtml],
    ['root static html', rootLocalHtml],
  ]) {
    assert.match(source, /id="initMajorPickerOverlay"/, `${label} should include initialization major picker`)
    assert.match(source, /选择教育部备案专业/, `${label} should name the ministry-filed major selection`)
    assert.match(source, /选择一个教育部备案专业，系统将据此匹配产业链数据/, `${label} should explain why the major is required`)
    assert.match(source, /id="initMajorSearch"/, `${label} should support major search`)
    assert.match(source, /placeholder="搜索专业名称或专业代码"/, `${label} should search by name or code`)
    assert.match(source, /data-init-major-level="undergraduate"/, `${label} should support undergraduate majors`)
    assert.match(source, /data-init-major-level="vocational"/, `${label} should support vocational majors`)
    assert.match(source, /id="initMajorPagination"/, `${label} should paginate major options`)
    assert.match(source, /const initMajorPageSize = 8/, `${label} should show more majors per page`)
    assert.match(source, /confirmInitMajorPicker/, `${label} should confirm the selected official major`)
    assert.match(source, /openInitMajorPicker/, `${label} should open the picker before initialization`)
    assert.match(source, /officialIndustryMajors/, `${label} should define official major options`)
    assert.match(source, /080717T/, `${label} should include undergraduate official major data`)
    assert.match(source, /510209/, `${label} should include vocational official major data`)
    assert.doesNotMatch(source, /自定义专业/, `${label} should not restore custom major input`)
    assert.doesNotMatch(source, /customMajor/, `${label} should not keep custom major state`)
  }
})

test('industry research idle state uses only the header initialization action', () => {
  const appIdleSection = appVue.match(/<section v-if="industryResearchStatus === 'idle'" class="cms-init-empty">[\s\S]*?<\/section>/)?.[0] ?? ''
  assert.doesNotMatch(appIdleSection, /<button/)

  for (const source of [localHtml, rootLocalHtml]) {
    const htmlIdleSection = source.match(/<section class="init-empty" id="empty">[\s\S]*?<\/section>/)?.[0] ?? ''
    assert.doesNotMatch(htmlIdleSection, /<button/)
    assert.doesNotMatch(source, /id="init"/)
    assert.doesNotMatch(source, /querySelector\('#init'\)/)
  }
})

test('industry chain recommendations are shown as selectable list with manual add entry', () => {
  assert.match(industryResearchData, /INDUSTRY_RESEARCH_CHAIN_RECOMMENDATIONS/)
  for (const chain of ['智能建造产业链', '建筑工业化产业链', '智慧城市基础设施产业链']) {
    assert.match(industryResearchData, new RegExp(chain))
  }
  assert.match(appVue, /自主添加产业链/)
  assert.match(appVue, /v-for="chain in paginatedIndustryResearchChains"/)
  assert.match(appVue, /toggleIndustryResearchChain\(chain\.id\)/)
  assert.match(appVue, /selectedIndustryResearchChainIds\.includes\(chain\.id\)/)
})

test('industry chain recommendations support multi-select and pagination', () => {
  assert.match(industryResearchData, /id: 'green-building-materials'/)
  assert.match(industryResearchData, /id: 'engineering-digital-services'/)
  assert.match(appVue, /selectedIndustryResearchChainIds = ref<string\[\]>\(\[\]\)/)
  assert.match(appVue, /industryResearchPageSize = 3/)
  assert.match(appVue, /paginatedIndustryResearchChains = computed/)
  assert.match(appVue, /industryResearchTotalPages = computed/)
  assert.match(appVue, /setIndustryResearchPage\(page\)/)
  assert.match(appVue, /class="cms-pagination"/)
  assert.match(appVue, /已选 \{\{ selectedIndustryResearchChainIds\.length \}\} 条产业链/)
})

test('industry research management has dedicated operational styling', () => {
  assert.match(stylesCss, /\.cms-admin-shell\s*\{/)
  assert.match(stylesCss, /\.cms-sidebar\s*\{/)
  assert.match(stylesCss, /\.cms-management-card\s*\{/)
  assert.match(stylesCss, /\.industry-chain-row\.selected\s*\{/)
  assert.match(stylesCss, /\.industry-initialization-progress\s*\{/)
  assert.match(stylesCss, /\.cms-pagination\s*\{/)
})

test('local standalone html file can be opened directly', () => {
  assert.match(localHtml, /产业调研管理/)
  assert.match(localHtml, /cms-admin-shell/)
  assert.match(localHtml, /数据初始化/)
  assert.match(localHtml, /自主添加产业链/)
  assert.match(localHtml, /分页/)
})

test('industry research CMS persists selected chains for demo handoff', () => {
  assert.match(appVue, /industryResearchStateKey/)
  assert.match(appVue, /persistIndustryResearchSelection/)
  assert.match(appVue, /localStorage\.setItem\(industryResearchStateKey/)
  assert.match(appVue, /initialized:\s*selectedIndustryResearchChainIds\.value\.length > 0/)

  for (const source of [localHtml, rootLocalHtml]) {
    assert.match(source, /const industryResearchStateKey = 'major-construction-platform:industry-research'/)
    assert.match(source, /const persistSelection = \(\) =>/)
    assert.match(source, /localStorage\.setItem\(industryResearchStateKey/)
    assert.match(source, /initialized:\s*selected\.size > 0/)
    assert.match(source, /selectedChainIds:\s*\[\.\.\.selected\]/)
  }
})

test('CMS AI course list is the upper-level entry before industry research management', () => {
  assert.match(appVue, /cmsAiCoursePageMode = ref<'list' \| 'industry'>\('list'\)/)
  assert.match(appVue, /class="cms-ai-course-list-page"/)
  assert.match(appVue, /AI课管理/)
  assert.match(appVue, /AI课使用/)
  assert.match(appVue, /AI课运营管理/)
  assert.match(appVue, /创建AI课/)
  assert.match(appVue, /课程名称或课程id/)
  assert.match(appVue, /共查询到 91 条结果/)
  assert.match(appVue, /萧瑟专业建设520/)
})

test('CMS AI course creation modal exposes the staged long form', () => {
  assert.match(appVue, /openCmsAiCourseCreateDialog/)
  assert.match(appVue, /class="cms-ai-course-modal"/)
  assert.match(appVue, /class="cms-ai-course-modal-body"/)
  assert.match(appVue, /class="cms-ai-course-modal-footer"/)
  assert.match(appVue, /创建AI课/)
  for (const label of ['名称', '名称英文', '介绍', '所属学校', '是否开放', '课程封面', '工作室', '是否为学分AI课', '合同管理']) {
    assert.match(appVue, new RegExp(label))
  }
})

test('school selection reveals platform source model type and college controls without major picker flow', () => {
  assert.match(appVue, /selectCmsAiCourseSchool/)
  assert.match(appVue, /清华大学（envning）（uvid = 91）/)
  assert.match(appVue, /平台类型/)
  assert.match(appVue, /教学平台/)
  assert.match(appVue, /培训平台/)
  assert.match(appVue, /来源/)
  assert.match(appVue, /学堂自研/)
  assert.match(appVue, /可选基座模型/)
  assert.match(appVue, /智谱GLM-4-Plus/)
  assert.match(appVue, /DeepSeek-V3/)
  assert.match(appVue, /类型/)
  assert.match(appVue, /学科共建/)
  assert.match(appVue, /专业建设/)
  assert.match(appVue, /所属学院/)
  assert.match(appVue, /placeholder="输入专业名称"/)
  assert.doesNotMatch(appVue, /data-cms-error-target="major"/)
  assert.doesNotMatch(appVue, /openCmsOfficialMajorPicker/)
  assert.doesNotMatch(appVue, /cmsOfficialMajorPickerOpen/)
  assert.doesNotMatch(appVue, /class="cms-official-major-picker"/)
  assert.doesNotMatch(appVue, /添加专业/)
  assert.doesNotMatch(appVue, /请选择所属专业/)
})

test('AI course creation omits the major picker and preserves future initialization note', () => {
  assert.match(appVue, /专业管理初始化预留/)
  assert.match(appVue, /先让用户选择专业，再 loading 出产业链推荐，最后让用户选择产业链/)
  assert.doesNotMatch(appVue, /CmsOfficialMajorLevel/)
  assert.doesNotMatch(appVue, /cmsOfficialMajorLevel/)
  assert.doesNotMatch(appVue, /filteredCmsOfficialMajors/)
  assert.doesNotMatch(appVue, /selectedCmsOfficialMajor/)
  assert.doesNotMatch(appVue, /confirmCmsOfficialMajorSelection/)
  assert.doesNotMatch(appVue, /class="cms-official-major-picker"/)
  assert.doesNotMatch(appVue, /选择官方专业/)
  assert.doesNotMatch(appVue, /自定义专业/)
  assert.doesNotMatch(appVue, /cmsCustomMajorName/)
  assert.doesNotMatch(appVue, /value="custom"/)
  assert.doesNotMatch(appVue, /majorCode = `custom:\$\{customMajorName\}`/)
  assert.doesNotMatch(appVue, /majorEducationLevel = 'custom'/)
})

test('CMS AI course creation persists handoff state and switches into industry research', () => {
  assert.match(appVue, /const cmsAiCourseCreationStateKey = 'major-construction-platform:cms-ai-course-creation'/)
  assert.match(appVue, /name:\s*''/)
  assert.match(appVue, /confirmCmsAiCourseCreation/)
  assert.match(appVue, /localStorage\.setItem\(cmsAiCourseCreationStateKey/)
  assert.match(appVue, /cmsAiCoursePageMode\.value = 'industry'/)
  assert.match(appVue, /validateCmsAiCourseCreation/)
  assert.match(appVue, /cmsFirstValidationErrorKey/)
  assert.match(appVue, /scrollCmsAiCourseModalToError/)
  assert.match(appVue, /ref="cmsAiCourseModalBody"/)
  assert.match(appVue, /class="cms-validation-summary"/)
  assert.match(appVue, /请完善必填项/)
  assert.match(appVue, /请选择所属学校/)
  assert.doesNotMatch(appVue, /请选择所属专业/)
})

test('standalone CMS html mirrors AI course creation loop', () => {
  for (const source of [localHtml, rootLocalHtml]) {
    assert.match(source, /cms-ai-course-list-page/)
    assert.match(source, /创建AI课/)
    assert.match(source, /cms-ai-course-modal/)
    assert.match(source, /清华大学（envning）（uvid = 91）/)
    assert.match(source, /学科共建/)
    assert.match(source, /专业管理初始化预留/)
    assert.match(source, /先让用户选择专业，再 loading 出产业链推荐，最后让用户选择产业链/)
    assert.doesNotMatch(source, /添加专业/)
    assert.doesNotMatch(source, /cms-official-major-picker/)
    assert.doesNotMatch(source, /majorPickerOverlay/)
    assert.doesNotMatch(source, /courseMajorRow/)
    assert.doesNotMatch(source, /courseMajorError/)
    assert.doesNotMatch(source, /请选择所属专业/)
    assert.doesNotMatch(source, /data-major-level="custom"/)
    assert.doesNotMatch(source, /id="customMajorName"/)
    assert.doesNotMatch(source, /currentMajorLevel === 'custom'/)
    assert.doesNotMatch(source, /courseForm\.majorEducationLevel = 'custom'/)
    assert.doesNotMatch(source, /courseForm\.majorCode = `custom:\$\{customMajorName\}`/)
    assert.match(source, /major-construction-platform:cms-ai-course-creation/)
    assert.match(source, /showIndustryResearchPage/)
    assert.match(source, /validateStaticCourseCreation/)
    assert.match(source, /courseStaticErrors/)
    assert.match(source, /courseForm = \{ name: ''/)
    assert.match(source, /#courseName'\)\.value = ''/)
    assert.match(source, /请选择所属学校/)
    assert.match(source, /scrollStaticCourseModalToError/)
    assert.match(source, /if \(!validateStaticCourseCreation\(\)\) \{[\s\S]*scrollStaticCourseModalToError\(\)[\s\S]*return[\s\S]*\}/)
  }
})

test('standalone CMS html does not keep stale major picker wiring', () => {
  for (const [label, source] of [
    ['outputs static html', localHtml],
    ['root static html', rootLocalHtml],
  ]) {
    assert.doesNotMatch(source, /selectedStaticMajor/, `${label} should not retain major confirmation code`)
    assert.doesNotMatch(source, /selectedMajorCode/, `${label} should not retain stale selected major state`)
    assert.doesNotMatch(source, /currentMajorLevel/, `${label} should not retain major education-level state`)
    assert.match(
      source,
      /#openCreateCourse'\)\.addEventListener\('click', \(\) => \{[\s\S]*resetStaticCourseForm\(\)[\s\S]*#createCourseOverlay'\)\.hidden = false/s,
      `${label} should reset the static course form before opening the create modal`,
    )
  }
})

test('CMS AI course creation has dedicated list modal styling without stale major picker styles', () => {
  assert.match(stylesCss, /\.cms-ai-course-list-page\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-filter-grid\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-table\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-modal\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-modal-body\s*\{/)
  assert.match(stylesCss, /\.cms-ai-course-modal-footer\s*\{/)
  assert.doesNotMatch(stylesCss, /\.cms-official-major-picker\s*\{/)
  assert.doesNotMatch(stylesCss, /\.cms-major-picker-toolbar\s*\{/)
  assert.doesNotMatch(stylesCss, /\.cms-major-option-list\s*\{/)
  assert.match(stylesCss, /\.cms-field-error\s*\{/)
  assert.match(stylesCss, /\.cms-validation-summary\s*\{/)
  assert.match(stylesCss, /\.cms-modal-section\s*\{/)
  assert.match(stylesCss, /\.cms-contract-grid\s*\{/)
  assert.match(styleBlock('.cms-ai-course-modal'), /width:\s*min\(820px,\s*calc\(100vw - 96px\)\)/)
  assert.match(styleBlock('.cms-form-row'), /grid-template-columns:\s*112px minmax\(0,\s*1fr\)/)
  assert.match(styleBlock('.cms-form-row'), /font-size:\s*14px/)
  assert.match(styleBlock('.cms-form-row'), /white-space:\s*nowrap/)
  assert.match(styleBlock('.cms-ai-course-modal-body'), /gap:\s*14px/)
  assert.match(styleBlock('.cms-ai-course-modal-body'), /padding:\s*14px 32px 28px/)
  assert.match(styleBlock('.cms-cover-upload'), /grid-template-columns:\s*112px minmax\(0,\s*330px\)/)
  assert.match(styleBlock('.cms-cover-upload'), /gap:\s*16px 18px/)
  assert.match(styleBlock('.cms-cover-upload'), /line-height:\s*1\.5/)
  assert.match(styleBlock('.cms-model-panel'), /gap:\s*16px 28px/)
  assert.match(styleBlock('.cms-model-panel'), /padding:\s*18px 28px/)

  for (const [label, source] of [
    ['outputs static html', localHtml],
    ['root static html', rootLocalHtml],
  ]) {
    assert.match(source, /placeholder="输入专业名称"/, `${label} should ask for the professional construction major name`)
    assert.match(source, /\.cms-form-row \{[^}]*grid-template-columns: 112px minmax\(0, 1fr\)[^}]*font-size: 14px[^}]*white-space: nowrap/s, `${label} should keep modal labels at the 14px CMS scale without wrapping`)
    assert.match(source, /\.cms-ai-course-modal \{[^}]*width: min\(820px, calc\(100vw - 96px\)\)/s, `${label} should use a roomier CMS modal proportion`)
    assert.match(source, /\.cms-ai-course-modal-body \{[^}]*gap: 14px[^}]*padding: 14px 32px 28px/s, `${label} should loosen modal body spacing`)
    assert.match(source, /\.cms-cover-upload \{[^}]*grid-template-columns: 112px minmax\(0, 330px\)[^}]*gap: 16px 18px[^}]*line-height: 1\.5/s, `${label} should keep the cover row breathable without label wrapping`)
    assert.match(source, /\.cms-model-panel \{[^}]*gap: 16px 28px[^}]*padding: 18px 28px/s, `${label} should loosen the model panel spacing`)
  }
})

test('main demo dock can reset CMS initialization state for rehearsals', () => {
  assert.match(appVue, /resetIndustryResearchDemoInitialization/)
  assert.match(appVue, /localStorage\.removeItem\(industryResearchStateKey\)/)
  assert.match(appVue, /aria-label="重置演示初始化状态"/)
  assert.match(appVue, /title="重置演示初始化状态"/)
  assert.match(appVue, /class="dock-icon demo-reset"/)
  assert.match(appVue, /@click="resetIndustryResearchDemoInitialization"/)
})

test('industry chain graph defaults to treemap and keeps sankey summary as switchable view', () => {
  assert.match(appVue, /industryChainViewMode = ref<'treemap' \| 'sankey'>\('treemap'\)/)
  assert.match(appVue, /industryTreemapStagesForView = computed/)
  assert.match(appVue, /class="industry-chain-view-switch"/)
  assert.match(appVue, /industryChainViewMode === 'treemap'/)
  assert.match(appVue, /industryChainViewMode === 'sankey'/)
  assert.match(appVue, /class="industry-treemap-board"/)
  assert.match(appVue, /class="industry-sankey-summary"/)
  assert.match(appVue, /class="industry-sankey-board"/)
  assert.match(appVue, /class="industry-sankey-svg"/)
  assert.match(appVue, /<h3>产业链结构图谱<\/h3>/)
  assert.match(appVue, /具体产品\/技术\/服务节点/)
  assert.doesNotMatch(appVue, /<p>具体产品\/技术\/服务节点<\/p>/)
  assert.doesNotMatch(appVue, /industry-treemap-footnote/)
  assert.doesNotMatch(appVue, /矩形面积按代表企业/)
  assert.doesNotMatch(appVue, /industryTreemapHover/)
  assert.doesNotMatch(appVue, /industry-treemap-hover-card/)
  assert.match(stylesCss, /\.industry-chain-view-switch\s*\{/)
  assert.match(stylesCss, /\.industry-treemap-board\s*\{/)
  assert.match(styleBlock('.industry-treemap-board'), /--treemap-gap:\s*clamp/)
  assert.match(styleBlock('.industry-treemap-board'), /align-items:\s*start/)
  assert.match(stylesCss, /\.industry-treemap-node\s*\{/)
  assert.match(styleBlock('.industry-treemap-node'), /min-height:\s*var\(--node-size,\s*92px\)/)
  assert.match(styleBlock('.industry-treemap-node'), /justify-content:\s*flex-start/)
  assert.doesNotMatch(styleBlock('.industry-treemap-node'), /justify-content:\s*space-between/)
  assert.doesNotMatch(styleBlock('.industry-treemap-grid'), /min-height:\s*392px/)
  assert.match(stylesCss, /\.industry-treemap-node strong\s*\{[\s\S]*-webkit-line-clamp:\s*2/)
  assert.doesNotMatch(styleBlock('.industry-treemap-node strong'), /white-space:\s*nowrap/)
  assert.doesNotMatch(stylesCss, /\.industry-treemap-node p\s*\{/)
  assert.doesNotMatch(stylesCss, /\.industry-treemap-footnote\s*\{/)
  assert.doesNotMatch(stylesCss, /\.industry-treemap-hover-card/)
  assert.match(stylesCss, /\.industry-sankey-summary\s*\{/)
})

test('industry chain national industry metrics mock follows GB/T 4754 display contract', () => {
  assert.match(jobResearchMock, /export const NATIONAL_INDUSTRY_CHAIN_METRICS/)
  assert.match(jobResearchMock, /关联国标行业/)
  assert.match(jobResearchMock, /覆盖门类/)
  assert.match(jobResearchMock, /核心关联行业/)
  assert.match(jobResearchMock, /增长行业/)
  assert.match(jobResearchMock, /E 建筑业/)
  assert.match(jobResearchMock, /I 信息传输、软件和信息技术服务业/)
  assert.match(jobResearchMock, /C 制造业/)
  assert.match(jobResearchMock, /N 水利、环境和公共设施管理业/)
  assert.match(jobResearchMock, /recruitmentHeat/)
  assert.match(jobResearchMock, /policyHeat/)
  assert.match(jobResearchMock, /enterpriseActivity/)
  assert.match(jobResearchMock, /detail:\s*\{/)
  assert.match(jobResearchMock, /统计范围包含上游设计勘察/)
  assert.match(jobResearchMock, /用于判断专业课程/)
})

test('industry chain graph renders national industry metrics in the Vue page', () => {
  assert.match(appVue, /NATIONAL_INDUSTRY_CHAIN_METRICS/)
  assert.match(appVue, /class="industry-national-kpis"/)
  assert.match(appVue, /class="industry-national-kpi-card"/)
  assert.match(appVue, /v-for="metric in NATIONAL_INDUSTRY_CHAIN_METRICS\.summaryMetrics"/)
  assert.match(appVue, /@click="openNationalIndustryMetricDialog\(metric\.label\)"/)
  assert.match(appVue, /selectedNationalIndustryMetric/)
  assert.match(appVue, /industry-national-detail-dialog/)
  assert.match(appVue, /formatIndustryStageNationalIndustries\(stage\.key\)/)
  assert.doesNotMatch(appVue, /国标行业关联分析/)
  assert.doesNotMatch(appVue, /代表企业行业覆盖/)
  assert.doesNotMatch(appVue, /行业增长信号/)
  assert.doesNotMatch(appVue, /v-for="item in NATIONAL_INDUSTRY_CHAIN_METRICS\.enterpriseCoverage"/)
  assert.doesNotMatch(appVue, /v-for="item in NATIONAL_INDUSTRY_CHAIN_METRICS\.growthSignals"/)
})

test('national industry metrics have compact responsive styles', () => {
  assert.match(stylesCss, /\.industry-national-kpis\s*\{/)
  assert.match(stylesCss, /\.industry-national-kpi-card\s*\{/)
  assert.match(stylesCss, /\.industry-national-detail-dialog\s*\{/)
  assert.match(stylesCss, /\.industry-national-detail-grid\s*\{/)
  assert.match(styleBlock('.industry-national-detail-hero'), /grid-template-columns:\s*minmax\(0, 1fr\);/)
  assert.doesNotMatch(styleBlock('.industry-national-detail-hero'), /154px minmax\(0, 1fr\)/)
  assert.doesNotMatch(stylesCss, /\.industry-national-analysis\s*\{/)
  assert.doesNotMatch(stylesCss, /\.industry-national-columns\s*\{/)
  assert.doesNotMatch(stylesCss, /\.industry-national-coverage-row\s*\{/)
  assert.doesNotMatch(stylesCss, /\.industry-national-bar i\s*\{/)
  assert.doesNotMatch(stylesCss, /width:\s*var\(--industry-share\);/)
  assert.doesNotMatch(stylesCss, /\.industry-national-growth article\s*\{/)
  assert.doesNotMatch(stylesCss, /@media \(max-width: 1180px\)[\s\S]*\.industry-national-columns/)
})
