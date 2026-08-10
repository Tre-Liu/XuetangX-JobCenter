import fs from 'node:fs/promises'
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool'

const workbookPath = '/Users/liuhongzhe/Downloads/产业调研九页面AI总结提示词.xlsx'
const outputDir = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/.tmp/ai-summary-prompt-preview'

await fs.mkdir(outputDir, { recursive: true })
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(workbookPath))

const sheetOverview = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 12000,
  tableMaxRows: 30,
  tableMaxCols: 12,
  tableMaxCellChars: 1000,
})
console.log('OVERVIEW')
console.log(sheetOverview.ndjson)

const sheets = (await workbook.inspect({
  kind: 'sheet',
  include: 'id,name',
  maxChars: 8000,
})).ndjson
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))

for (const sheetInfo of sheets) {
  const sheetName = sheetInfo.name
  if (!sheetName) continue
  const sheet = workbook.worksheets.getItem(sheetName)
  const usedRange = sheet.getUsedRange(true)
  if (usedRange) {
    const preview = await workbook.render({
      sheetName,
      autoCrop: 'all',
      scale: 1.5,
      format: 'png',
    })
    const safeName = sheetName.replaceAll('/', '_')
    await fs.writeFile(`${outputDir}/${safeName}.png`, new Uint8Array(await preview.arrayBuffer()))
  }
}
