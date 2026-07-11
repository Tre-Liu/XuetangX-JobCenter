import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outDir = decodeURIComponent(new URL('.', import.meta.url).pathname);
const read = (name) => fs.readFile(`${outDir}${name}`, 'utf8');
const note = JSON.parse(await read('matching_note.json'));

const workbook = await Workbook.fromCSV(await read('park_master_mapping_compact.csv'), { sheetName: '园区匹配主表' });
await workbook.fromCSV(await read('park_chain_node_match_summary.csv'), { sheetName: '匹配汇总' });
await workbook.fromCSV(await read('park_category_match_rules.csv'), { sheetName: '分类映射规则' });
const master = workbook.worksheets.getItem('园区匹配主表');
const summary = workbook.worksheets.getItem('匹配汇总');
const rules = workbook.worksheets.getItem('分类映射规则');
const notes = workbook.worksheets.add('说明');

const headerStyle = { fill: '#1F4E78', font: { bold: true, color: '#FFFFFF' }, wrapText: true, horizontalAlignment: 'center', verticalAlignment: 'center' };
const subHeaderStyle = { fill: '#D9EAF7', font: { bold: true, color: '#1F1F1F' }, wrapText: true, verticalAlignment: 'center' };

master.showGridLines = false;
master.freezePanes.freezeRows(1);
master.getRange('A1:U1').format = headerStyle;
master.getRange('A1:U1').format.rowHeight = 32;
for (const [col, width] of Object.entries({ A: 12, B: 12, C: 10, D: 12, E: 28, F: 38, G: 28, H: 12, I: 12, J: 10, K: 12, L: 12, M: 18, N: 20, O: 12, P: 32, Q: 24, R: 62, S: 10, T: 28, U: 58 })) {
  master.getRange(`${col}1:${col}${note.master_row_count + 1}`).format.columnWidth = width;
}
master.getRange(`R2:R${note.master_row_count + 1}`).format.wrapText = true;
master.getRange(`U2:U${note.master_row_count + 1}`).format.wrapText = true;

summary.showGridLines = false;
summary.freezePanes.freezeRows(1);
const summaryRows = (await summary.getUsedRange().values).length;
summary.getRange(`A1:G1`).format = headerStyle;
summary.getRange(`A1:G1`).format.rowHeight = 32;
for (const [col, width] of Object.entries({ A: 14, B: 32, C: 10, D: 12, E: 28, F: 20, G: 14 })) summary.getRange(`${col}1:${col}${summaryRows}`).format.columnWidth = width;
summary.getRange(`G2:G${summaryRows}`).format.numberFormat = '#,##0';
summary.tables.add(`A1:G${summaryRows}`, true, 'ParkMatchSummaryTable');

rules.showGridLines = false;
rules.freezePanes.freezeRows(1);
const ruleRows = (await rules.getUsedRange().values).length;
rules.getRange('A1:E1').format = headerStyle;
rules.getRange('A1:E1').format.rowHeight = 32;
for (const [col, width] of Object.entries({ A: 16, B: 18, C: 62, D: 14, E: 64 })) rules.getRange(`${col}1:${col}${ruleRows}`).format.columnWidth = width;
rules.getRange(`D2:D${ruleRows}`).format.numberFormat = '#,##0';
rules.getRange(`C2:E${ruleRows}`).format.wrapText = true;
rules.tables.add(`A1:E${ruleRows}`, true, 'ParkCategoryRuleTable');

notes.showGridLines = false;
notes.getRange('A1:F1').merge();
notes.getRange('A1').values = [['产业园区—产业链/产业节点关联匹配结果']];
notes.getRange('A1:F1').format = { fill: '#1F4E78', font: { bold: true, color: '#FFFFFF', size: 14 }, horizontalAlignment: 'center', verticalAlignment: 'center' };
notes.getRange('A1:F1').format.rowHeight = 28;
notes.getRange('A3:B12').values = [
  ['项目', '内容'], ['源文件（XLSX）', note.source_xlsx], ['源文件（DTA）', note.source_dta], ['源记录数', note.source_row_count],
  ['主表记录数', note.master_row_count], ['节点明细记录数（CSV）', note.detail_row_count], ['已匹配主表记录数', note.matched_master_rows],
  ['待人工研判记录数', note.unmatched_master_rows], ['覆盖标准产业链数', note.distinct_standard_chains_in_details], ['覆盖节点数', note.distinct_nodes_in_details],
];
notes.getRange('A3:B3').format = subHeaderStyle;
notes.getRange('A3:B12').format.borders = { preset: 'all', style: 'thin', color: '#D9D9D9' };
notes.getRange('A14:F14').merge();
notes.getRange('A14').values = [['匹配口径']];
notes.getRange('A14:F14').format = subHeaderStyle;
notes.getRange('A15:F18').merge(true);
notes.getRange('A15:F18').values = note.matching_logic.map((x) => [x, '', '', '', '', '']);
notes.getRange('A15:F18').format.wrapText = true;
notes.getRange('A15:F18').format.rowHeight = 28;
notes.getRange('A20:F20').merge();
notes.getRange('A20').values = [['工作表与配套文件']];
notes.getRange('A20:F20').format = subHeaderStyle;
notes.getRange('A21:F25').values = [
  ['园区匹配主表', '一行对应源 XLSX 一条园区记录，保留 104,127 条记录和关键原始字段；简介正文仍以源 XLSX 为准。', '', '', '', ''],
  ['匹配汇总', '按产业字段、标准链、上下游阶段、节点和匹配状态统计园区数。', '', '', '', ''],
  ['分类映射规则', '展示 26 个园区产业字段的宽口径关联规则。', '', '', '', ''],
  ['节点明细 CSV', `${outDir}park_chain_node_match_details.csv；一行对应一条园区—标准链节点关系，未匹配园区也保留一行。`, '', '', '', ''],
  ['完整主表 CSV', `${outDir}park_master_with_chain_match.csv；包含源简介字段的完整 104,127 条主表。`, '', '', '', ''],
];
notes.getRange('A21:F25').format.wrapText = true;
notes.getRange('A21:F25').format.rowHeight = 34;
notes.getRange('A3:A25').format.columnWidth = 22;
notes.getRange('B3:B25').format.columnWidth = 78;
notes.getRange('C1:F25').format.columnWidth = 16;
notes.freezePanes.freezeRows(3);

console.log((await workbook.inspect({ kind: 'table', sheetId: '园区匹配主表', range: 'A1:U6', include: 'values', tableMaxRows: 6, tableMaxCols: 21, maxChars: 5000 })).ndjson);
console.log((await workbook.inspect({ kind: 'table', sheetId: '匹配汇总', range: 'A1:G15', include: 'values', tableMaxRows: 15, tableMaxCols: 7, maxChars: 5000 })).ndjson);
console.log((await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 100 }, summary: 'final formula error scan' })).ndjson);

for (const [sheetName, range, filename] of [['说明', 'A1:F25', 'preview_compact_notes.png'], ['匹配汇总', 'A1:G20', 'preview_compact_summary.png'], ['分类映射规则', 'A1:E30', 'preview_compact_rules.png']]) {
  const blob = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(`${outDir}${filename}`, new Uint8Array(await blob.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outDir}产业园区-产业链节点关联匹配结果.xlsx`);
console.log(`saved ${outDir}产业园区-产业链节点关联匹配结果.xlsx`);
