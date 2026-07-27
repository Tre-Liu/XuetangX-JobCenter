const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const reportKindLabel = (kind) => kind === 'industry' ? '行业报告' : '专业报告'
const creationModeLabel = (mode) => mode === 'custom' ? '自定义' : '按模板创建'

const cloneReportToc = (items = []) =>
  items.map((item) => {
    const clone = { ...item }
    if (Array.isArray(item.children)) {
      clone.children = cloneReportToc(item.children)
    } else {
      delete clone.children
    }
    return clone
  })

const cloneReportRecord = (report) => ({
  ...report,
  jobIds: [...(report.jobIds || [])],
  toc: cloneReportToc(report.toc || []),
})

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

export const normalizeReportForm = (form) => ({
  ...form,
  jobIds: [...(form.jobIds || [])],
  templateId: form.creationMode === 'custom' ? '' : String(form.templateId || ''),
})

export const createReportTocSource = (form) => {
  const normalized = normalizeReportForm(form)
  return {
    reportKind: normalized.reportKind,
    creationMode: normalized.creationMode,
    templateId: normalized.templateId,
  }
}

export const restoreReportTocSelection = (form, source) =>
  normalizeReportForm({
    ...form,
    reportKind: source.reportKind,
    creationMode: source.creationMode,
    templateId: source.templateId,
  })

export const isReportTemplateSelectionValid = (form, templates = []) => {
  if (form.creationMode === 'custom') return true
  return templates.some((template) =>
    template.id === form.templateId
    && template.reportKind === form.reportKind
  )
}

export const validateReportForm = (
  form,
  { regionOptions = [], templates = [] } = {},
) => {
  if (!String(form.title || '').trim()) {
    return { field: 'title', message: '请输入报告名称' }
  }
  if (form.reportKind === 'professional' && !String(form.major || '').trim()) {
    return { field: 'major', message: '请选择专业' }
  }
  if (!String(form.relatedIndustry || '').trim()) {
    return { field: 'relatedIndustry', message: '请输入相关行业' }
  }
  if (!String(form.region || '').trim()) {
    return { field: 'region', message: '请选择指定区域' }
  }
  if (regionOptions.length > 0 && !regionOptions.includes(form.region)) {
    return { field: 'region', message: '请选择指定区域' }
  }
  if (!Array.isArray(form.jobIds) || form.jobIds.length === 0) {
    return { field: 'jobIds', message: '请至少选择一个分析岗位' }
  }
  if (form.jobIds.length > 10) {
    return { field: 'jobIds', message: '最多选择 10 个分析岗位' }
  }
  if (form.creationMode === 'template' && !String(form.templateId || '').trim()) {
    return { field: 'templateId', message: '请选择报告模板' }
  }
  if (templates.length > 0 && !isReportTemplateSelectionValid(form, templates)) {
    return { field: 'templateId', message: '请选择报告模板' }
  }
  return null
}

export const createReportConfigurationState = (report) => {
  const form = normalizeReportForm(report)
  return {
    form,
    tocSource: createReportTocSource(form),
    referenceFiles: [],
    referenceFileCount: Number.isFinite(Number(report.referenceFileCount))
      ? Math.max(0, Number(report.referenceFileCount))
      : 0,
  }
}

export const resolveReportJobNames = (jobIds = [], jobOptions = []) =>
  jobIds
    .map((jobId) => jobOptions.find((job) => job.id === jobId)?.name)
    .filter((name) => typeof name === 'string')

export const createReportAdsMetadata = (report, jobOptions = []) => {
  const normalized = normalizeReportForm(report)
  return {
    reportTitle: normalized.title,
    reportType: normalized.type,
    industry: normalized.industry,
    region: normalized.region,
    majorGroup: normalized.major,
    reportKind: normalized.reportKind,
    major: normalized.major,
    relatedIndustry: normalized.relatedIndustry,
    jobIds: [...normalized.jobIds],
    jobNames: resolveReportJobNames(normalized.jobIds, jobOptions),
    creationMode: normalized.creationMode,
    templateId: normalized.templateId,
    referenceFileCount: Number(report.referenceFileCount) || 0,
    date: report.date,
  }
}

export const createReportGenerationController = ({
  setTimer = (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimer = (timerId) => globalThis.clearTimeout(timerId),
} = {}) => {
  let generationToken = 0
  let timerId = null

  const invalidate = () => {
    generationToken += 1
    if (timerId !== null) clearTimer(timerId)
    timerId = null
    return generationToken
  }

  const schedule = (callback, delay) => {
    const token = invalidate()
    let firedSynchronously = false
    const scheduledId = setTimer(() => {
      firedSynchronously = true
      if (token !== generationToken) return
      timerId = null
      callback(token)
    }, delay)
    if (!firedSynchronously) timerId = scheduledId
    return token
  }

  return {
    invalidate,
    schedule,
    isCurrent: (token) => token === generationToken,
  }
}

export const createReportGenerationSnapshot = ({
  rows,
  activeReportId,
  form,
  toc,
  referenceFileCount,
  generatedDate,
  jobOptions = [],
}) => {
  const isNew = activeReportId === 0
  const previousReport = isNew
    ? null
    : rows.find((report) => report.id === activeReportId)
  if (!isNew && !previousReport) {
    throw new Error('Report generation target no longer exists')
  }
  const reportId = isNew
    ? Math.max(...rows.map((report) => report.id), 0) + 1
    : activeReportId
  const normalizedForm = normalizeReportForm(form)
  const report = {
    id: reportId,
    ...normalizedForm,
    jobIds: [...normalizedForm.jobIds],
    date: generatedDate,
    status: previousReport?.status ?? 'draft',
    referenceFileCount: Math.max(0, Number(referenceFileCount) || 0),
    toc: cloneReportToc(toc),
  }

  return deepFreeze({
    isNew,
    previousReport: previousReport ? cloneReportRecord(previousReport) : null,
    report,
    jobNames: resolveReportJobNames(report.jobIds, jobOptions),
  })
}

export const applyReportGeneration = (rows, snapshot) => {
  const generatedReport = cloneReportRecord(snapshot.report)
  if (snapshot.isNew) {
    if (rows.some((report) => report.id === generatedReport.id)) {
      throw new Error('Report generation id already exists')
    }
    return [generatedReport, ...rows]
  }
  if (!rows.some((report) => report.id === generatedReport.id)) {
    throw new Error('Report generation target no longer exists')
  }
  return rows.map((report) =>
    report.id === generatedReport.id ? generatedReport : report
  )
}

export const rollbackReportGeneration = (rows, snapshot) => {
  if (snapshot.isNew) {
    return rows.filter((report) => report.id !== snapshot.report.id)
  }
  if (!snapshot.previousReport) return rows
  return rows.map((report) =>
    report.id === snapshot.report.id
      ? cloneReportRecord(snapshot.previousReport)
      : report
  )
}

const removeReportTocNode = (rows, targetId, protectOnlyRoot) => {
  const rootIndex = rows.findIndex((row) => row.id === targetId)
  if (rootIndex >= 0) {
    if (protectOnlyRoot && rows.length <= 1) return rows
    return rows.filter((row) => row.id !== targetId)
  }

  let changed = false
  const nextRows = rows.map((row) => {
    if (!Array.isArray(row.children) || row.children.length === 0) return row
    const nextChildren = removeReportTocNode(row.children, targetId, false)
    if (nextChildren === row.children) return row
    changed = true
    return { ...row, children: nextChildren }
  })
  return changed ? nextRows : rows
}

export const removeReportTocNodeById = (rows, targetId) =>
  removeReportTocNode(rows, targetId, true)

const buildTocRows = (items, createId) =>
  items.map((item) => ({
    id: createId(),
    title: item.title,
    children: buildTocRows(item.children || [], createId),
  }))

export const createReportTocForMode = ({
  creationMode,
  templateId,
  templates,
  createId,
}) => {
  if (creationMode === 'custom') {
    return [{ id: createId(), title: '新增章节', children: [] }]
  }
  const template = templates.find((item) => item.id === templateId)
  if (!template) return []
  return buildTocRows(template.toc || [], createId)
}

export const findEmptyReportTocTitle = (rows) => {
  for (const row of rows) {
    if (!String(row.title || '').trim()) return row.id
    const childId = findEmptyReportTocTitle(row.children || [])
    if (childId) return childId
  }
  return null
}

export const buildDynamicReportContent = ({
  baseHtml,
  form,
  jobNames,
  referenceFileCount,
  generatedDate,
}) => {
  const title = escapeHtml(form.title)
  const major = escapeHtml(form.major || '未指定专业')
  const industry = escapeHtml(form.relatedIndustry)
  const region = escapeHtml(form.region)
  const jobs = escapeHtml(jobNames.join('、'))
  const subtitle = `报告类型：${reportKindLabel(form.reportKind)} ｜ 专业：${major} ｜ 相关行业：${industry} ｜ 分析区域：${region} ｜ 生成日期：${escapeHtml(generatedDate)}`
  const scope = `<section class="report-scope-summary"><h2>报告生成范围</h2><p>本报告采用${creationModeLabel(form.creationMode)}方式生成，重点分析岗位包括：${jobs}。</p><p>本次生成使用参考文件 ${Number(referenceFileCount) || 0} 个。</p></section>`

  let html = String(baseHtml || '')
    .replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${title}</h1>`)
    .replace(
      /<p class="report-doc-subtitle">[\s\S]*?<\/p>/,
      `<p class="report-doc-subtitle">${subtitle}</p>`,
    )

  const firstH2Index = html.indexOf('<h2>')
  if (firstH2Index >= 0) {
    html = `${html.slice(0, firstH2Index)}${scope}${html.slice(firstH2Index)}`
  } else {
    html += scope
  }
  return html
}
