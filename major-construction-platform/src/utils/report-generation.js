const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const reportKindLabel = (kind) => kind === 'industry' ? '行业报告' : '专业报告'
const creationModeLabel = (mode) => mode === 'custom' ? '自定义' : '按模板创建'

export const validateReportForm = (form) => {
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
  if (!Array.isArray(form.jobIds) || form.jobIds.length === 0) {
    return { field: 'jobIds', message: '请至少选择一个分析岗位' }
  }
  if (form.jobIds.length > 10) {
    return { field: 'jobIds', message: '最多选择 10 个分析岗位' }
  }
  if (form.creationMode === 'template' && !String(form.templateId || '').trim()) {
    return { field: 'templateId', message: '请选择报告模板' }
  }
  return null
}

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
