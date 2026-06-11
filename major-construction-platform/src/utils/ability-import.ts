import type { JobAbility } from '../mock/job-center'

const abilityTemplateColumns = ['能力项名称', '能力类别', '能力项定义'] as const
const abilityTemplateFilename = '岗位能力项导入模板.xlsx'

export const abilityCategoryOptions = ['知识', '技能', '素养'] as const

export type AbilityCategoryOption = (typeof abilityCategoryOptions)[number]

export type ParsedAbilityImportResult = {
  abilities: JobAbility[]
  errors: string[]
}

const loadXlsx = () => import('xlsx')

const createAbilityTemplateWorkbook = (XLSX: typeof import('xlsx')) => {
  const workbook = XLSX.utils.book_new()
  const rows = [
    ['填写说明', '请保留首行表头；能力类别仅支持“知识 / 技能 / 素养”；同一个模板内能力项名称不能重复。', '导入时将按你选择的“增量添加 / 覆盖现有”方式写入当前岗位能力项。'],
    [...abilityTemplateColumns],
    ['BIM协同建模', '技能', '能够使用BIM软件完成建筑、结构、机电模型协同建模与碰撞检查。'],
    ['现场协同沟通', '素养', '能与设计、施工、监理和构件生产人员协作完成智能建造项目交付。'],
    ['智能建造施工流程', '知识', '理解BIM深化、装配式施工、智慧工地实施、检测监测和数字化运维流程。']
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 56 }]
  workbook.Workbook = {
    Views: [{ RTL: false }]
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, '岗位能力项')
  return workbook
}

export const buildAbilityTemplateWorkbook = async () => {
  const XLSX = await loadXlsx()
  return createAbilityTemplateWorkbook(XLSX)
}

export const downloadAbilityTemplateWorkbook = async () => {
  const XLSX = await loadXlsx()
  const workbook = createAbilityTemplateWorkbook(XLSX)
  XLSX.writeFile(workbook, abilityTemplateFilename)
}

export const parseAbilityImportWorkbook = async (file: File, jobName: string): Promise<ParsedAbilityImportResult> => {
  const buffer = await file.arrayBuffer()
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!worksheet) {
    return { abilities: [], errors: ['未读取到工作表，请检查上传文件。'] }
  }

  const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
    header: 1,
    raw: false,
    defval: ''
  })
  const headerIndex = rawRows.findIndex((row) =>
    abilityTemplateColumns.every((header, columnIndex) => String(row[columnIndex] ?? '').trim() === header)
  )

  if (headerIndex === -1) {
    return { abilities: [], errors: ['未找到模板表头，请使用“下载模板”生成的标准模板填写。'] }
  }

  const abilities: JobAbility[] = []
  const errors: string[] = []
  const nameSet = new Set<string>()
  const defaultDefinition = `支撑${jobName}完成典型工作任务的关键能力项。`

  rawRows.slice(headerIndex + 1).forEach((row, index) => {
    const rowNumber = headerIndex + index + 2
    const name = String(row[0] ?? '').trim()
    const category = String(row[1] ?? '').trim() as AbilityCategoryOption
    const definition = String(row[2] ?? '').trim()
    const isEmptyRow = !name && !category && !definition

    if (isEmptyRow) return

    if (!name) {
      errors.push(`第 ${rowNumber} 行缺少“能力项名称”。`)
      return
    }
    if (!abilityCategoryOptions.includes(category)) {
      errors.push(`第 ${rowNumber} 行“能力类别”无效，请填写：知识 / 技能 / 素养。`)
      return
    }
    if (nameSet.has(name)) {
      errors.push(`第 ${rowNumber} 行能力项名称“${name}”重复，请在模板中去重。`)
      return
    }

    nameSet.add(name)
    abilities.push({
      name,
      category,
      definition: definition || defaultDefinition
    })
  })

  if (abilities.length === 0 && errors.length === 0) {
    errors.push('未解析到可导入的能力项，请至少填写一行数据。')
  }

  return { abilities, errors }
}
