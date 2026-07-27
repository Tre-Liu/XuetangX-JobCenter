import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import XLSX from 'xlsx'

async function exists(path) {
  try {
    await access(path)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
}

export async function readCsvObjects(filePath) {
  const text = await readFile(filePath, 'utf8')
  const book = XLSX.read(text.replace(/^\uFEFF/, ''), { type: 'string', raw: true })
  const sheet = book.Sheets[book.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}

export async function readWorksheetRows(filePath, sheetName) {
  const book = XLSX.readFile(filePath, { cellDates: true, raw: true })
  const sheet = book.Sheets[sheetName]
  if (!sheet) throw new Error(`${filePath} 缺少工作表: ${sheetName}`)
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
}

export function rowsToObjects(rows, headerRowIndex = 0) {
  const headers = rows[headerRowIndex].map((value) => String(value ?? '').trim())
  return rows.slice(headerRowIndex + 1)
    .filter((row) => row.some((value) => value !== null && value !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])))
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

export async function resolveSource(workspaceRoot, definition) {
  for (const relativePath of definition.candidates) {
    const absolutePath = resolve(workspaceRoot, relativePath)
    if (await exists(absolutePath)) {
      return { ...definition, relativePath, absolutePath }
    }
  }
  throw new Error(`缺少必需数据源 ${definition.id}: ${definition.candidates.join(' | ')}`)
}

export async function resolveAllSources(workspaceRoot, registry) {
  const entries = await Promise.all(
    registry.map(async (definition) => [
      definition.id,
      await resolveSource(workspaceRoot, definition),
    ]),
  )
  return Object.fromEntries(entries)
}

export function requireColumns(objects, requiredColumns, sourceId) {
  const actual = new Set(Object.keys(objects[0] ?? {}))
  const missing = requiredColumns.filter((column) => !actual.has(column))
  if (missing.length) throw new Error(`${sourceId} 缺少字段: ${missing.join(', ')}`)
}
