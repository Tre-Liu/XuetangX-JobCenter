import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outDir = decodeURIComponent(new URL('.', import.meta.url).pathname);
const read = async (name) => (await fs.readFile(`${outDir}${name}`, 'utf8')).replace(/^\uFEFF/, '');
const note = JSON.parse(await read('matching_note.json'));
const workbook = await Workbook.fromCSV(await read('park_chain_node_match_summary.csv'), { sheetName: '匹配汇总' });
await workbook.fromCSV(await read('park_category_match_rules.csv'), { sheetName: '分类映射规则' });
const summary = workbook.worksheets.getItem('匹配汇总');
const rules = workbook.worksheets.getItem('分类映射规则');
const notes = workbook.worksheets.add('结果索引');
const header = { fill: '#1F4E78', font: { bold: true, color: '#FFFFFF' }, wrapText: true, horizontalAlignment: 'center', verticalAlignment: 'center' };
const sub = { fill: '#D9EAF7', font: { bold: true }, wrapText: true };

for (const [sheet, lastCol, widths] of [
  [summary, 'G', { A: 14, B: 32, C: 10, D: 12, E: 28, F: 20, G: 14 }],
  [rules, 'E', { A: 16, B: 18, C: 62, D: 14, E: 64 }],
]) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const rows = (await sheet.getUsedRange().values).length;
  sheet.getRange(`A1:${lastCol}1`).format = header;
  sheet.getRange(`A1:${lastCol}1`).format.rowHeight = 32;
  for (const [col, width] of Object.entries(widths)) sheet.getRange(`${col}1:${col}${rows}`).format.columnWidth = width;
}
const summaryRows = (await summary.getUsedRange().values).length;
summary.getRange(`G2:G${summaryRows}`).format.numberFormat = '#,##0';
summary.tables.add(`A1:G${summaryRows}`, true, 'ParkMatchSummaryTable');
const ruleRows = (await rules.getUsedRange().values).length;
rules.getRange(`D2:D${ruleRows}`).format.numberFormat = '#,##0';
rules.getRange(`C2:E${ruleRows}`).format.wrapText = true;
rules.tables.add(`A1:E${ruleRows}`, true, 'ParkCategoryRuleTable');

notes.showGridLines = false;
notes.getRange('A1:F1').merge();
notes.getRange('A1').values = [['产业园区—产业链/产业节点关联匹配结果索引']];
notes.getRange('A1:F1').format = { fill: '#1F4E78', font: { bold: true, color: '#FFFFFF', size: 14 }, horizontalAlignment: 'center', verticalAlignment: 'center' };
notes.getRange('A1:F1').format.rowHeight = 28;
notes.getRange('A3:B12').values = [
  ['项目', '内容'], ['源文件（XLSX）', note.source_xlsx], ['源文件（DTA）', note.source_dta], ['源记录数', note.source_row_count],
  ['完整主表记录数', note.master_row_count], ['节点明细记录数', note.detail_row_count], ['已匹配主表记录数', note.matched_master_rows],
  ['待人工研判记录数', note.unmatched_master_rows], ['覆盖标准产业链数', note.distinct_standard_chains_in_details], ['覆盖节点数', note.distinct_nodes_in_details],
];
notes.getRange('A3:B3').format = sub;
notes.getRange('A3:B12').format.borders = { preset: 'all', style: 'thin', color: '#D9D9D9' };
notes.getRange('A14:F14').merge();
notes.getRange('A14').values = [['完整结果文件']];
notes.getRange('A14:F14').format = sub;
notes.getRange('A15:F17').values = [
  ['完整主表 CSV', 'park_master_with_chain_match.csv：104,127 条园区记录，含源简介字段与匹配字段。', '', '', '', ''],
  ['紧凑主表 CSV', 'park_master_mapping_compact.csv：104,127 条园区记录，适合直接筛选关联链/节点。', '', '', '', ''],
  ['节点明细 CSV', 'park_chain_node_match_details.csv：183,321 条园区—节点关系，含未匹配记录占位行。', '', '', '', ''],
];
notes.getRange('A15:F17').format.wrapText = true;
notes.getRange('A15:F17').format.rowHeight = 34;
notes.getRange('A19:F19').merge();
notes.getRange('A19').values = [['匹配口径']];
notes.getRange('A19:F19').format = sub;
notes.getRange('A20:F23').merge(true);
notes.getRange('A20:F23').values = note.matching_logic.map((x) => [x, '', '', '', '', '']);
notes.getRange('A20:F23').format.wrapText = true;
notes.getRange('A20:F23').format.rowHeight = 28;
notes.getRange('A3:A23').format.columnWidth = 22;
notes.getRange('B3:B23').format.columnWidth = 82;
notes.getRange('C1:F23').format.columnWidth = 16;
notes.freezePanes.freezeRows(3);

console.log((await workbook.inspect({ kind: 'table', sheetId: '匹配汇总', range: 'A1:G15', include: 'values', tableMaxRows: 15, tableMaxCols: 7, maxChars: 5000 })).ndjson);
console.log((await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 100 }, summary: 'final formula error scan' })).ndjson);
for (const [sheetName, range, filename] of [['结果索引', 'A1:F23', 'preview_result_index.png'], ['匹配汇总', 'A1:G20', 'preview_summary_only.png'], ['分类映射规则', 'A1:E30', 'preview_rules_only.png']]) {
  const blob = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(`${outDir}${filename}`, new Uint8Array(await blob.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outDir}产业园区-产业链节点关联匹配结果-汇总索引.xlsx`);
console.log(`saved ${outDir}产业园区-产业链节点关联匹配结果-汇总索引.xlsx`);
