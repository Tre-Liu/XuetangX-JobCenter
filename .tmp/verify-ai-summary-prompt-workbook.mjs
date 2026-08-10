import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool'

const path = '/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/019fd4d9-976f-7970-8ae0-1e99774a400f/产业调研八页面AI总结提示词-业务版.xlsx'
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(path))

console.log((await workbook.inspect({
  kind: 'sheet',
  include: 'id,name',
  maxChars: 4000,
})).ndjson)

console.log((await workbook.inspect({
  kind: 'table',
  sheetId: '输入提示词',
  range: 'A5:C14',
  tableMaxRows: 10,
  tableMaxCols: 3,
  tableMaxCellChars: 240,
  maxChars: 12000,
})).ndjson)

console.log((await workbook.inspect({
  kind: 'table',
  sheetId: '业务信息说明',
  range: 'A12:D21',
  tableMaxRows: 10,
  tableMaxCols: 4,
  tableMaxCellChars: 240,
  maxChars: 8000,
})).ndjson)

console.log((await workbook.inspect({
  kind: 'table',
  sheetId: '输出样例',
  range: 'A5:F13',
  tableMaxRows: 9,
  tableMaxCols: 6,
  tableMaxCellChars: 180,
  maxChars: 20000,
})).ndjson)

console.log((await workbook.inspect({
  kind: 'match',
  searchTerm: 'pageKey|JSON\\.stringify|modelRequest|facts\\[|groups\\[|items\\[|dataVersion',
  options: { useRegex: true, maxResults: 100 },
  summary: 'technical input term scan',
})).ndjson)

console.log((await workbook.inspect({
  kind: 'match',
  searchTerm: '专业布点分析|专业开设趋势',
  options: { useRegex: true, maxResults: 100 },
  summary: 'excluded page scan',
})).ndjson)

console.log((await workbook.inspect({
  kind: 'match',
  searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',
  options: { useRegex: true, maxResults: 100 },
  summary: 'final formula error scan',
})).ndjson)
