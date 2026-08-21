import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool'

const projectRoot = resolve(import.meta.dirname, '../..')
const inputPath = resolve(projectRoot, 'outputs/01a018f8-24d8-7651-b292-e4dc705bf026/19条产业链岗位与职业匹配表.xlsx')
const outputDir = resolve(projectRoot, 'assets/job-occupation-task-er/source-captures')

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath))
await fs.mkdir(outputDir, { recursive: true })

const captures = [
  { sheetName: '岗位-职业匹配表', range: 'A532:E533', fileName: 'excel-job-occupation-532-533.png' },
  { sheetName: '匹配明细（不合并）', range: 'A693:I696', fileName: 'excel-match-detail-693-696.png' },
  { sheetName: '职业字典（本表使用）', range: 'A48:E48', fileName: 'excel-occupation-dictionary-48.png' },
  { sheetName: '职业字典（本表使用）', range: 'A166:E166', fileName: 'excel-occupation-dictionary-166.png' },
]

for (const capture of captures) {
  const inspection = await workbook.inspect({
    kind: 'table',
    sheetId: capture.sheetName,
    range: capture.range,
    include: 'values,formulas',
    tableMaxRows: 6,
    tableMaxCols: 10,
    maxChars: 3000,
  })
  console.log(inspection.ndjson)

  const preview = await workbook.render({
    sheetName: capture.sheetName,
    range: capture.range,
    scale: 2,
    format: 'png',
  })
  await fs.writeFile(resolve(outputDir, capture.fileName), new Uint8Array(await preview.arrayBuffer()))
  console.log(`Rendered ${capture.sheetName}!${capture.range} -> ${capture.fileName}`)
}
