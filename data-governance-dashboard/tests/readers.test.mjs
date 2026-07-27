import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as XLSX from 'xlsx'
import {
  readCsvObjects,
  readJson,
  readWorksheetRows,
  resolveAllSources,
  resolveSource,
  requireColumns,
  rowsToObjects,
} from '../scripts/lib/readers.mjs'

test('CSV reader preserves quoted newlines and strips BOM', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  const path = join(dir, 'sample.csv')
  await writeFile(path, '\ufeffid,name,description\n1,节点A,"第一行\n第二行"\n', 'utf8')

  assert.deepEqual(await readCsvObjects(path), [
    { id: '1', name: '节点A', description: '第一行\n第二行' },
  ])
})

test('worksheet reader and header mapping preserve typed values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  const path = join(dir, 'sample.xlsx')
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
    ['代码', '名称', '数量'],
    ['A01', '农业', 3],
  ]), '数据')
  XLSX.writeFile(book, path)

  const rows = await readWorksheetRows(path, '数据')
  assert.deepEqual(rowsToObjects(rows, 0), [{ 代码: 'A01', 名称: '农业', 数量: 3 }])
})

test('missing required source and changed columns fail explicitly', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  await assert.rejects(
    resolveSource(dir, { id: 'majorCatalog', candidates: ['missing.xlsx'] }),
    /缺少必需数据源 majorCatalog.*missing\.xlsx/,
  )
  assert.throws(
    () => requireColumns([{ 专业名称: '人工智能' }], ['专业名称', '专业编码'], 'majorCatalog'),
    /majorCatalog 缺少字段: 专业编码/,
  )
})

test('source resolution selects the first available candidate and returns every source by ID', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  await mkdir(join(dir, 'stable'))
  await writeFile(join(dir, 'stable', 'snapshot.json'), '{}', 'utf8')

  const registry = [
    { id: 'first', candidates: ['missing.json', 'stable/snapshot.json'] },
    { id: 'second', candidates: ['stable/snapshot.json'] },
  ]
  const sources = await resolveAllSources(dir, registry)

  assert.equal(sources.first.relativePath, 'stable/snapshot.json')
  assert.equal(sources.first.absolutePath, join(dir, 'stable', 'snapshot.json'))
  assert.equal(sources.second.relativePath, 'stable/snapshot.json')
})

test('JSON reader returns parsed values and worksheet reader names a missing sheet', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dashboard-readers-'))
  const jsonPath = join(dir, 'snapshot.json')
  const workbookPath = join(dir, 'sample.xlsx')
  await writeFile(jsonPath, '{"schemaVersion":1}', 'utf8')
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['id']]), '数据')
  XLSX.writeFile(book, workbookPath)

  assert.deepEqual(await readJson(jsonPath), { schemaVersion: 1 })
  await assert.rejects(readWorksheetRows(workbookPath, '不存在'), /sample\.xlsx 缺少工作表: 不存在/)
})
