import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outDir = decodeURIComponent(new URL('.', import.meta.url).pathname);
const read = (name) => fs.readFile(`${outDir}${name}`, 'utf8');
const note = JSON.parse(await read('matching_note.json'));

const workbook = await Workbook.fromCSV(await read('park_master_with_chain_match.csv'), { sheetName: '园区匹配主表' });
await workbook.fromCSV(await read('park_chain_node_match_details.csv'), { sheetName: '链节点匹配明细' });
await workbook.fromCSV(await read('park_chain_node_match_summary.csv'), { sheetName: '匹配汇总' });
await workbook.fromCSV(await read('park_category_match_rules.csv'), { sheetName: '分类映射规则' });

const master = workbook.worksheets.getItem('园区匹配主表');
const details = workbook.worksheets.getItem('链节点匹配明细');
const summary = workbook.worksheets.getItem('匹配汇总');
const rules = workbook.worksheets.getItem('分类映射规则');
const notes = workbook.worksheets.add('说明');

const headerStyle = {
  fill: '#1F4E78',
  font: { bold: true, color: '#FFFFFF' },
  wrapText: true,
  horizontalAlignment: 'center',
  verticalAlignment: 'center',
};
const subHeaderStyle = {
  fill: '#D9EAF7',
  font: { bold: true, color: '#1F1F1F' },
  wrapText: true,
  verticalAlignment: 'center',
};

function styleDataSheet(sheet, lastRow, lastCol, columnWidths = {}) {
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const header = sheet.getRange(`A1:${lastCol}1`);
  header.format = headerStyle;
  header.format.rowHeight = 32;
  for (const [col, width] of Object.entries(columnWidths)) {
    sheet.getRange(`${col}1:${col}${lastRow}`).format.columnWidth = width;
  }
  sheet.getRange(`A1:${lastCol}${lastRow}`).format.verticalAlignment = 'top';
  sheet.getRange(`A1:${lastCol}${lastRow}`).format.wrapText = false;
}

styleDataSheet(master, note.master_row_count + 1, 'V', {
  A: 12, B: 12, C: 10, D: 12, E: 28, F: 38, G: 50, H: 28, I: 12, J: 12, K: 10, L: 12, M: 12,
  N: 18, O: 20, P: 12, Q: 32, R: 24, S: 62, T: 10, U: 28, V: 58,
});
master.getRange(`G2:G${note.master_row_count + 1}`).format.wrapText = true;
master.getRange(`S2:S${note.master_row_count + 1}`).format.wrapText = true;
master.getRange(`V2:V${note.master_row_count + 1}`).format.wrapText = true;

styleDataSheet(details, note.detail_row_count + 1, 'R', {
  A: 12, B: 12, C: 28, D: 12, E: 10, F: 12, G: 12, H: 18, I: 12, J: 22, K: 28, L: 30, M: 10, N: 12, O: 24, P: 40, Q: 24, R: 58,
});
details.getRange(`P2:P${note.detail_row_count + 1}`).format.wrapText = true;
details.getRange(`R2:R${note.detail_row_count + 1}`).format.wrapText = true;

styleDataSheet(summary, 1 + (await summary.getUsedRange().values).length, 'G', { A: 14, B: 32, C: 10, D: 12, E: 28, F: 20, G: 14 });
summary.getRange('G2:G200').format.numberFormat = '#,##0';

styleDataSheet(rules, 1 + (await rules.getUsedRange().values).length, 'E', { A: 16, B: 18, C: 62, D: 14, E: 64 });
rules.getRange('D2:D100').format.numberFormat = '#,##0';

// Tables make the four data sheets filterable in Excel. Names are ASCII and unique.
master.tables.add(`A1:V${note.master_row_count + 1}`, true, 'ParkMatchTable');
details.tables.add(`A1:R${note.detail_row_count + 1}`, true, 'ParkNodeDetailTable');
summary.tables.add(`A1:G${1 + (await summary.getUsedRange().values).length}`, true, 'ParkMatchSummaryTable');
rules.tables.add(`A1:E${1 + (await rules.getUsedRange().values).length}`, true, 'ParkCategoryRuleTable');

notes.showGridLines = false;
notes.getRange('A1:F1').merge();
notes.getRange('A1').values = [['产业园区—产业链/产业节点关联匹配说明']];
notes.getRange('A1:F1').format = { fill: '#1F4E78', font: { bold: true, color: '#FFFFFF', size: 14 }, horizontalAlignment: 'center', verticalAlignment: 'center' };
notes.getRange('A1:F1').format.rowHeight = 28;
notes.getRange('A3:B12').values = [
  ['项目', '内容'],
  ['源文件（XLSX）', note.source_xlsx],
  ['源文件（DTA）', note.source_dta],
  ['源记录数', note.source_row_count],
  ['主表记录数', note.master_row_count],
  ['节点明细记录数', note.detail_row_count],
  ['已匹配主表记录数', note.matched_master_rows],
  ['待人工研判记录数', note.unmatched_master_rows],
  ['覆盖标准产业链数', note.distinct_standard_chains_in_details],
  ['覆盖节点数', note.distinct_nodes_in_details],
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
notes.getRange('A20').values = [['工作表说明']];
notes.getRange('A20:F20').format = subHeaderStyle;
notes.getRange('A21:F24').values = [
  ['园区匹配主表', '一行对应源 XLSX 一条园区记录，保留原始 11 个字段，并新增匹配状态、标准链、节点和依据。', '', '', '', ''],
  ['链节点匹配明细', '一行对应一条园区—标准链节点关系；未匹配园区也保留一行，standard_chain/node_id 为空。', '', '', '', ''],
  ['匹配汇总', '按产业字段、标准链、上下游阶段、节点和匹配状态统计园区数。', '', '', '', ''],
  ['分类映射规则', '展示 26 个园区产业字段的宽口径关联规则；园区名称命中时会叠加精确原始方向映射。', '', '', '', ''],
];
notes.getRange('A21:F24').format.wrapText = true;
notes.getRange('A21:F24').format.rowHeight = 32;
notes.getRange('A3:A24').format.columnWidth = 22;
notes.getRange('B3:B24').format.columnWidth = 75;
notes.getRange('C1:F24').format.columnWidth = 16;
notes.freezePanes.freezeRows(3);

// Compact inspections before export.
console.log((await workbook.inspect({ kind: 'table', sheetId: '园区匹配主表', range: 'A1:V6', include: 'values', tableMaxRows: 6, tableMaxCols: 22, maxChars: 6000 })).ndjson);
console.log((await workbook.inspect({ kind: 'table', sheetId: '链节点匹配明细', range: 'A1:R6', include: 'values', tableMaxRows: 6, tableMaxCols: 18, maxChars: 5000 })).ndjson);
console.log((await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A', options: { useRegex: true, maxResults: 100 }, summary: 'final formula error scan' })).ndjson);

for (const [sheetName, range, filename] of [
  ['说明', 'A1:F24', 'preview_notes.png'],
  ['园区匹配主表', 'A1:V8', 'preview_master.png'],
  ['链节点匹配明细', 'A1:R8', 'preview_details.png'],
  ['匹配汇总', 'A1:G20', 'preview_summary.png'],
  ['分类映射规则', 'A1:E30', 'preview_rules.png'],
]) {
  const blob = await workbook.render({ sheetName, range, scale: 1, format: 'png' });
  await fs.writeFile(`${outDir}${filename}`, new Uint8Array(await blob.arrayBuffer()));
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outDir}产业园区-产业链节点关联匹配结果.xlsx`);
console.log(`saved ${outDir}产业园区-产业链节点关联匹配结果.xlsx`);
