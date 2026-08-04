import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const sourcePath = '/Users/liuhongzhe/Desktop/职教分享/分享礼包/【礼包2】国家及省级双高汇总.xlsx';
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const overview = await workbook.inspect({
  kind: 'workbook,sheet,table',
  maxChars: 12000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 80,
});
console.log(overview.ndjson);

const targetProvinces = ['浙江', '河南', '湖南', '四川', '广东', '江苏'];
const nationalSheet = workbook.worksheets.getItem('国家双高（第二期220所）');
const provincialSheet = workbook.worksheets.getItem('省级双高（全国汇总）');
const nationalRows = nationalSheet.getRange('A4:G223').values;
const provincialRows = provincialSheet.getRange('A4:I778').values;
const countByProvince = (rows, provinceIndex) => Object.fromEntries(
  targetProvinces.map((province) => [
    province,
    rows.filter((row) => row[provinceIndex] === province).length,
  ]),
);
const nationalCounts = countByProvince(nationalRows, 2);
const provincialCounts = countByProvince(provincialRows, 2);
console.log(JSON.stringify({ nationalCounts, provincialCounts }, null, 2));

const nationalProvinceCounts = Object.groupBy(nationalRows, (row) => row[2]);
const provincialProvinceCounts = Object.groupBy(provincialRows, (row) => row[2]);
console.log(JSON.stringify({
  nationalTotal: nationalRows.filter((row) => row[0] !== null).length,
  provincialTotal: provincialRows.filter((row) => row[0] !== null).length,
  nationalAll: Object.fromEntries(Object.entries(nationalProvinceCounts).map(([k, v]) => [k, v.length])),
  provincialAll: Object.fromEntries(Object.entries(provincialProvinceCounts).map(([k, v]) => [k, v.length])),
}, null, 2));
