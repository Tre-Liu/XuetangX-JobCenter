import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspace = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程";
const profilePath = path.join(workspace, "work/platform-source-mapping/source_profile.json");
const outputDir = path.join(workspace, "outputs/019f8903-6f61-78c3-a3c7-f64a9578a946");
const outputPath = path.join(outputDir, "平台来源映射汇总_2014-2025.xlsx");
const previewDir = path.join(outputDir, "previews");

const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
const totalRows = Object.values(profile.sources).reduce((sum, item) => sum + item.total, 0);
const years = Array.from({ length: 12 }, (_, i) => 2014 + i);

const sourceMappings = {
  "平台1": {
    platform: "智联招聘或其转载源（旧版样式）",
    confidence: "低可信推断",
    basis: "大量职位使用智联旧版常见的区间薪资（如2001-4000）和“岗位(行业)”标题格式；但与已确认的平台4并存，可能是旧抓取批次或转载源。",
    evidence: "https://www.zhaopin.com/",
    note: "不能据此与平台4视为同一原始抓取源。",
  },
  "平台2": {
    platform: "前程无忧（51job）",
    confidence: "直接确认",
    basis: "2024–2025样本稳定使用“无需经验/在校生/应届生”等51job字段口径；代表岗位与51job页面及校园招聘分类体系相符。",
    evidence: "https://xy.51job.com/",
    note: "映射可信，但早期年度可能含同平台旧版字段。",
  },
  "平台4": {
    platform: "智联招聘",
    confidence: "直接确认",
    basis: "数据发布方的单平台数据库页面明确将“招聘平台4”标注为智联招聘；且样本岗位可在智联页面逐字段对应。",
    evidence: "https://www.macrodatas.cn/article/1147473628",
    note: "发布方页面是目前最强的编号对照证据。",
  },
  "平台9": {
    platform: "58同城（推测）",
    confidence: "较高可信推断",
    basis: "岗位以本地生活服务、销售、房产、普工为主，学历多为初中/高中，经验字段长期集中为“1年以上”，与58同城历史招聘页结构高度一致。",
    evidence: "https://www.58.com/job.shtml",
    note: "未找到发布方公开编号字典，仍应保留推断标记。",
  },
  "平台10": {
    platform: "大街网（推测）",
    confidence: "较高可信推断",
    basis: "2016–2019样本大量使用“应届生/1年以内”以及“全职/实习/兼职”组合，岗位覆盖校招与初级白领，符合大街网当年的字段与定位。",
    evidence: "https://www.dajie.com/",
    note: "属于字段特征反推，未获得官方编号确认。",
  },
  "平台11": {
    platform: "看准网/职位聚合转载源（推测）",
    confidence: "低可信推断",
    basis: "标题频繁采用“岗位(公司名)”格式，经验同时出现“不限/0年以上/应届毕业生”等聚合化口径，更像职位聚合或转载页。",
    evidence: "https://www.kanzhun.com/",
    note: "无法排除职友集等其他聚合站。",
  },
  "平台13": {
    platform: "看准网或综合职位聚合源（推测）",
    confidence: "低可信推断",
    basis: "跨度2016–2024，兼有社招与实习，标题常附公司名，近年使用“在校/应届、1-3年、经验不限”和详细地址；更接近聚合/转载型来源。",
    evidence: "https://www.kanzhun.com/",
    note: "部分实习岗位能在实习僧找到，但该编号同时含大量社招，不能直接等同实习僧。",
  },
  "平台15": {
    platform: "智通直聘（原智通人才网，推测）",
    confidence: "较高可信推断",
    basis: "代表样本“广东波斯科技—项目研发总工程师”可在智通直聘找到高度一致的公司、岗位与经验学历信息。",
    evidence: "https://www.job5156.com/guangzhou/job_278294453",
    note: "单个强匹配样本加字段一致性，尚非发布方官方对照。",
  },
  "平台16": {
    platform: "赶集网（推测）",
    confidence: "较高可信推断",
    basis: "2016年大量独特字段为“不限（应届生亦可）”并在职位名后附“（全职）”，与赶集招聘历史页面措辞高度一致。",
    evidence: "https://www.senior-rm.com/detail.aspx?id=27868&nid=26&pid=317&tid=0",
    note: "赶集与58历史上存在内容交叉，需保留推断属性。",
  },
  "平台43": {
    platform: "应届生求职网（推测）",
    confidence: "较高可信推断",
    basis: "83,165条记录直接标为“应届生”，岗位标题高频出现“校园招聘”，并含大量实习和校招信息，和应届生求职网定位高度吻合。",
    evidence: "https://www.yingjiesheng.com/",
    note: "该站也会转载51job等平台岗位，因此是页面来源而不一定是最初发布源。",
  },
  "平台75": {
    platform: "BOSS直聘",
    confidence: "直接确认",
    basis: "代表样本“广东澜柏王科技有限公司—高级定制量体师/店长”可在BOSS直聘页面逐项对应公司、岗位、城市、薪资与学历。",
    evidence: "https://m.zhipin.com/zhaopin/c2684394b9c285470XF73dS5Fg~~/",
    note: "2025年该编号占主要来源，字段也与BOSS当前口径一致。",
  },
};

const numericSource = (key) => {
  const match = key.match(/平台(\d+)/);
  return match ? Number(match[1]) : 9999;
};

const ranked = Object.entries(profile.sources)
  .sort((a, b) => b[1].total - a[1].total)
  .map(([key], index) => [key, index + 1]);
const rankMap = new Map(ranked);

const orderedSources = Object.entries(profile.sources).sort((a, b) => numericSource(a[0]) - numericSource(b[0]));

const workbook = Workbook.create();
const overview = workbook.worksheets.add("结论总览");
const mappingSheet = workbook.worksheets.add("平台对照");
const yearSheet = workbook.worksheets.add("年度分布");
const sampleSheet = workbook.worksheets.add("样本明细");
const methodSheet = workbook.worksheets.add("方法与证据");

const colors = {
  navy: "#16324F",
  blue: "#2F75B5",
  teal: "#2A7F8E",
  green: "#5B8C5A",
  amber: "#D99025",
  red: "#B64B4B",
  lightBlue: "#EAF2F8",
  lightTeal: "#E7F3F4",
  lightAmber: "#FFF4DD",
  lightGray: "#F4F6F8",
  border: "#D5DCE3",
  text: "#23313F",
  white: "#FFFFFF",
};

function styleTitle(sheet, range, text) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[text]];
  r.format = {
    fill: colors.navy,
    font: { bold: true, color: colors.white, size: 18 },
    verticalAlignment: "center",
  };
  r.format.rowHeight = 34;
}

function styleHeader(range) {
  range.format = {
    fill: colors.blue,
    font: { bold: true, color: colors.white },
    wrapText: true,
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: colors.border },
  };
  range.format.rowHeight = 30;
}

function styleBody(range) {
  range.format = {
    font: { color: colors.text, size: 10 },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.border },
  };
}

// 平台对照
styleTitle(mappingSheet, "A1:Q2", "“平台X”来源映射总表（2014–2025.6）");
mappingSheet.getRange("A3:Q3").merge();
mappingSheet.getRange("A3").values = [["重要：数据商未公开98个匿名编号的官方对照字典。下表只有“直接确认”可视为明确映射；其余均为依据字段、样本与网页反查的分级推断。"]];
mappingSheet.getRange("A3:Q3").format = { fill: colors.lightAmber, font: { bold: true, color: "#7A4B00" }, wrapText: true };
mappingSheet.getRange("A3:Q3").format.rowHeight = 34;

const mappingHeaders = ["平台编号", "推测实际平台", "确认级别", "记录数", "占全部", "数量排名", "首次年份", "末次年份", "出现年份", "主要经验口径", "主要招聘类别", "代表企业", "代表岗位", "判断依据", "证据URL", "限制/备注", "是否可直接采用"];
mappingSheet.getRange("A5:Q5").values = [mappingHeaders];
styleHeader(mappingSheet.getRange("A5:Q5"));

const mappingRows = orderedSources.map(([key, item]) => {
  const mapping = sourceMappings[key] ?? {
    platform: key === "（空白）" ? "来源字段为空" : "未能可靠识别（匿名编号）",
    confidence: key === "（空白）" ? "不适用" : "待确认",
    basis: key === "（空白）" ? "原始CSV的来源字段为空。" : `未发现发布方公开编号字典；现有随机样本与字段特征不足以唯一锁定具体平台。`,
    evidence: "https://www.macrodatas.cn/article/1147473531",
    note: key === "（空白）" ? "2025年为主。" : "不建议为回归或论文自行强行赋名。",
  };
  const itemYears = Object.keys(item.by_year).map(Number).sort((a, b) => a - b);
  const sample = item.samples[0] ?? {};
  const exp = item.experience_top.slice(0, 3).map(([name, count]) => `${name}（${count.toLocaleString("zh-CN")}）`).join("；");
  const category = item.category_top.slice(0, 2).map(([name, count]) => `${name || "空"}（${count.toLocaleString("zh-CN")}）`).join("；");
  return [
    key,
    mapping.platform,
    mapping.confidence,
    item.total,
    null,
    rankMap.get(key),
    itemYears[0],
    itemYears.at(-1),
    itemYears.join("、"),
    exp,
    category,
    sample.company ?? "",
    sample.job ?? "",
    mapping.basis,
    mapping.evidence,
    mapping.note,
    mapping.confidence === "直接确认" ? "是" : mapping.confidence === "较高可信推断" ? "需注明为推断" : "否",
  ];
});

const mappingStart = 6;
const mappingEnd = mappingStart + mappingRows.length - 1;
mappingSheet.getRange(`A${mappingStart}:Q${mappingEnd}`).values = mappingRows;
for (let row = mappingStart; row <= mappingEnd; row += 1) {
  mappingSheet.getRange(`E${row}`).formulas = [[`=D${row}/SUM($D$${mappingStart}:$D$${mappingEnd})`]];
}
mappingSheet.getRange(`E${mappingStart}:E${mappingEnd}`).format.numberFormat = "0.00%";
mappingSheet.getRange(`D${mappingStart}:D${mappingEnd}`).format.numberFormat = "#,##0";
styleBody(mappingSheet.getRange(`A${mappingStart}:Q${mappingEnd}`));
mappingSheet.getRange(`A${mappingStart}:Q${mappingEnd}`).format.rowHeight = 54;
mappingSheet.getRange(`C${mappingStart}:C${mappingEnd}`).conditionalFormats.add("containsText", { text: "直接确认", format: { fill: "#DCEFE1", font: { bold: true, color: "#25613B" } } });
mappingSheet.getRange(`C${mappingStart}:C${mappingEnd}`).conditionalFormats.add("containsText", { text: "较高可信", format: { fill: colors.lightBlue, font: { bold: true, color: colors.navy } } });
mappingSheet.getRange(`C${mappingStart}:C${mappingEnd}`).conditionalFormats.add("containsText", { text: "低可信", format: { fill: colors.lightAmber, font: { color: "#7A4B00" } } });
mappingSheet.getRange(`C${mappingStart}:C${mappingEnd}`).conditionalFormats.add("containsText", { text: "待确认", format: { fill: "#FBE8E7", font: { color: "#8E3030" } } });
mappingSheet.freezePanes.freezeRows(5);
mappingSheet.freezePanes.freezeColumns(3);
mappingSheet.showGridLines = false;
const mappingWidths = [12, 25, 15, 14, 11, 10, 10, 10, 28, 36, 40, 24, 34, 58, 42, 40, 18];
mappingWidths.forEach((width, index) => { mappingSheet.getRangeByIndexes(0, index, mappingEnd, 1).format.columnWidth = width; });
mappingSheet.tables.add(`A5:Q${mappingEnd}`, true, "PlatformMappingTable").style = "TableStyleMedium2";

// 年度分布
styleTitle(yearSheet, "A1:O2", "各平台年度记录数分布");
const yearHeaders = ["平台编号", "推测实际平台", ...years.map(String), "合计"];
yearSheet.getRange("A4:O4").values = [yearHeaders];
styleHeader(yearSheet.getRange("A4:O4"));
const yearRows = orderedSources.map(([key, item]) => [
  key,
  sourceMappings[key]?.platform ?? (key === "（空白）" ? "来源字段为空" : "未能可靠识别"),
  ...years.map((year) => item.by_year[String(year)] ?? 0),
  item.total,
]);
const yearStart = 5;
const yearEnd = yearStart + yearRows.length - 1;
yearSheet.getRange(`A${yearStart}:O${yearEnd}`).values = yearRows;
styleBody(yearSheet.getRange(`A${yearStart}:O${yearEnd}`));
yearSheet.getRange(`C${yearStart}:O${yearEnd}`).format.numberFormat = "#,##0";
yearSheet.getRange(`C${yearStart}:N${yearEnd}`).conditionalFormats.add("colorScale", {
  criteria: [
    { type: "lowestValue", color: "#FFFFFF" },
    { type: "percentile", value: 70, color: "#BBD7EE" },
    { type: "highestValue", color: "#2F75B5" },
  ],
});
yearSheet.freezePanes.freezeRows(4);
yearSheet.freezePanes.freezeColumns(2);
yearSheet.showGridLines = false;
yearSheet.getRange(`A1:A${yearEnd}`).format.columnWidth = 12;
yearSheet.getRange(`B1:B${yearEnd}`).format.columnWidth = 30;
yearSheet.getRange(`C1:O${yearEnd}`).format.columnWidth = 13;
yearSheet.tables.add(`A4:O${yearEnd}`, true, "PlatformYearTable").style = "TableStyleMedium2";

// 样本明细
styleTitle(sampleSheet, "A1:M2", "平台代表样本（每个平台最多3条随机样本）");
const sampleHeaders = ["平台编号", "推测实际平台", "确认级别", "年份", "企业名称", "招聘岗位", "城市", "最低月薪", "最高月薪", "学历", "经验", "招聘类别", "发布日期"];
sampleSheet.getRange("A4:M4").values = [sampleHeaders];
styleHeader(sampleSheet.getRange("A4:M4"));
const sampleRows = [];
for (const [key, item] of orderedSources) {
  const mapping = sourceMappings[key];
  for (const sample of item.samples.slice(0, 3)) {
    sampleRows.push([
      key,
      mapping?.platform ?? (key === "（空白）" ? "来源字段为空" : "未能可靠识别"),
      mapping?.confidence ?? (key === "（空白）" ? "不适用" : "待确认"),
      sample.year,
      sample.company,
      sample.job,
      sample.city,
      Number(sample.salary_min) || null,
      Number(sample.salary_max) || null,
      sample.education,
      sample.experience,
      sample.category,
      sample.publish_date,
    ]);
  }
}
const sampleStart = 5;
const sampleEnd = sampleStart + sampleRows.length - 1;
sampleSheet.getRange(`A${sampleStart}:M${sampleEnd}`).values = sampleRows;
styleBody(sampleSheet.getRange(`A${sampleStart}:M${sampleEnd}`));
sampleSheet.getRange(`H${sampleStart}:I${sampleEnd}`).format.numberFormat = "¥#,##0";
sampleSheet.getRange(`A${sampleStart}:M${sampleEnd}`).format.rowHeight = 42;
sampleSheet.freezePanes.freezeRows(4);
sampleSheet.freezePanes.freezeColumns(3);
sampleSheet.showGridLines = false;
const sampleWidths = [12, 28, 14, 9, 30, 42, 12, 12, 12, 12, 18, 18, 14];
sampleWidths.forEach((width, index) => { sampleSheet.getRangeByIndexes(0, index, sampleEnd, 1).format.columnWidth = width; });
sampleSheet.tables.add(`A4:M${sampleEnd}`, true, "PlatformSamplesTable").style = "TableStyleMedium2";

// 方法与证据
styleTitle(methodSheet, "A1:F2", "方法、置信度与公开证据");
const methodRows = [
  ["项目", "说明", "URL", "证据性质", "适用范围", "备注"],
  ["数据范围", "流式扫描文件夹内2014–2025全部12个CSV，共9,652,967条；识别到平台1–平台98及来源空白。", "", "本地数据统计", "全量", "未修改原始CSV"],
  ["发布方数据说明", "发布方说明来源包含前程无忧、BOSS、智联、猎聘、拉勾、看准网等，但未公布98个编号字典。", "https://www.macrodatas.cn/article/1147473531", "发布方说明", "总体", "不能据此推出每个编号"],
  ["平台4", "发布方单平台数据库页面的图片与正文把招聘平台4对应到智联招聘。", "https://www.macrodatas.cn/article/1147473628", "直接编号证据", "平台4", "强证据"],
  ["平台4样本", "智联招聘岗位页可逐字段对应数据样本。", "https://www.zhaopin.com/jobdetail/CCL1434163800J40656432903.htm", "原始岗位页", "平台4", "强证据"],
  ["平台2", "51job校园招聘分类与样本使用的字段口径相符。", "https://xy.51job.com/", "平台字段与样本", "平台2", "强证据，仍非发布方编号表"],
  ["平台75", "BOSS直聘页面逐项对应“广东澜柏王科技—高级定制量体师/店长”样本。", "https://m.zhipin.com/zhaopin/c2684394b9c285470XF73dS5Fg~~/", "原始岗位页", "平台75", "强证据"],
  ["平台15", "智通直聘可找到“广东波斯科技—项目研发总工程师”高度一致岗位。", "https://www.job5156.com/guangzhou/job_278294453", "原始岗位页", "平台15", "较强样本证据"],
  ["平台16", "公开网页记录赶集招聘历史上使用“工作经验不限（应届生亦可）”措辞，与平台16独特字段吻合。", "https://www.senior-rm.com/detail.aspx?id=27868&nid=26&pid=317&tid=0", "历史字段旁证", "平台16", "推断证据"],
  ["实习僧旁证", "平台13部分实习岗位能在实习僧找到，但平台13同时含大量社招，因此不能等同实习僧。", "https://www.shixiseng.com/intern/inn_hcmh8cpzdjil", "反例/边界证据", "平台13", "用于避免误判"],
  ["置信度定义", "直接确认：有编号级或逐字段岗位证据；较高可信推断：多个字段与样本指向同一平台；低可信推断：只能指向平台家族；待确认：不能唯一识别。", "", "方法规则", "全表", "论文使用时必须保留置信度"],
  ["使用建议", "若用于论文/回归：优先使用匿名编号本身做固定效应或分组，不建议把低可信/待确认编号替换为平台名称。", "", "分析建议", "全表", "避免错误标签造成测量误差"],
];
methodSheet.getRange(`A4:F${3 + methodRows.length}`).values = methodRows;
styleHeader(methodSheet.getRange("A4:F4"));
styleBody(methodSheet.getRange(`A5:F${3 + methodRows.length}`));
methodSheet.getRange(`A4:F${3 + methodRows.length}`).format.rowHeight = 48;
methodSheet.showGridLines = false;
methodSheet.freezePanes.freezeRows(4);
const methodWidths = [18, 72, 58, 20, 18, 28];
methodWidths.forEach((width, index) => { methodSheet.getRangeByIndexes(0, index, methodRows.length + 3, 1).format.columnWidth = width; });

// 结论总览
styleTitle(overview, "A1:N2", "应届生招聘大数据：匿名来源平台反查汇总");
overview.getRange("A3:N3").merge();
overview.getRange("A3").values = [["结论先行：官方编号字典未公开。当前可直接确认3个平台；其他编号按网页样本和字段特征分级，不应把推断结果当成官方映射。"]];
overview.getRange("A3:N3").format = { fill: colors.lightAmber, font: { bold: true, color: "#7A4B00" }, verticalAlignment: "center", wrapText: true };
overview.getRange("A3:N3").format.rowHeight = 34;

const kpiLabels = [["总记录数", "平台编号数", "直接确认数", "直接确认覆盖率", "较高可信推断数", "直接+较高覆盖率"]];
overview.getRange("A5:L5").values = [[kpiLabels[0][0], "", kpiLabels[0][1], "", kpiLabels[0][2], "", kpiLabels[0][3], "", kpiLabels[0][4], "", kpiLabels[0][5], ""]];
for (const startCol of [0, 2, 4, 6, 8, 10]) {
  overview.getRangeByIndexes(4, startCol, 1, 2).merge();
  overview.getRangeByIndexes(4, startCol, 1, 2).format = { fill: colors.teal, font: { bold: true, color: colors.white }, horizontalAlignment: "center" };
  overview.getRangeByIndexes(5, startCol, 2, 2).merge();
  overview.getRangeByIndexes(5, startCol, 2, 2).format = { fill: colors.lightTeal, font: { bold: true, color: colors.navy, size: 18 }, horizontalAlignment: "center", verticalAlignment: "center", borders: { preset: "all", style: "thin", color: colors.border } };
}
overview.getRange("A6").formulas = [[`=SUM('平台对照'!D${mappingStart}:D${mappingEnd})`]];
overview.getRange("C6").values = [[orderedSources.filter(([key]) => key !== "（空白）").length]];
overview.getRange("E6").formulas = [[`=COUNTIF('平台对照'!C${mappingStart}:C${mappingEnd},"直接确认")`]];
overview.getRange("G6").formulas = [[`=SUMIF('平台对照'!C${mappingStart}:C${mappingEnd},"直接确认",'平台对照'!D${mappingStart}:D${mappingEnd})/A6`]];
overview.getRange("I6").formulas = [[`=COUNTIF('平台对照'!C${mappingStart}:C${mappingEnd},"较高可信推断")`]];
overview.getRange("K6").formulas = [[`=(SUMIF('平台对照'!C${mappingStart}:C${mappingEnd},"直接确认",'平台对照'!D${mappingStart}:D${mappingEnd})+SUMIF('平台对照'!C${mappingStart}:C${mappingEnd},"较高可信推断",'平台对照'!D${mappingStart}:D${mappingEnd}))/A6`]];
overview.getRange("A6:B7").format.numberFormat = "#,##0";
overview.getRange("G6:H7").format.numberFormat = "0.0%";
overview.getRange("K6:L7").format.numberFormat = "0.0%";

overview.getRange("A9:H9").merge();
overview.getRange("A9").values = [["已识别 / 推测的平台"]];
overview.getRange("A9:H9").format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 12 } };
overview.getRange("A10:H10").values = [["编号", "平台", "置信度", "记录数", "占比", "年份", "核心证据", "建议"]];
styleHeader(overview.getRange("A10:H10"));
const identifiedKeys = Object.keys(sourceMappings).sort((a, b) => profile.sources[b].total - profile.sources[a].total);
const overviewRows = identifiedKeys.map((key) => {
  const item = profile.sources[key];
  const mapping = sourceMappings[key];
  const itemYears = Object.keys(item.by_year).map(Number).sort((a, b) => a - b);
  return [key, mapping.platform, mapping.confidence, item.total, item.total / totalRows, `${itemYears[0]}–${itemYears.at(-1)}`, mapping.basis, mapping.confidence === "直接确认" ? "可直接采用" : mapping.confidence === "较高可信推断" ? "注明“推测”" : "不建议替换匿名编号"];
});
const overviewDataStart = 11;
const overviewDataEnd = overviewDataStart + overviewRows.length - 1;
overview.getRange(`A${overviewDataStart}:H${overviewDataEnd}`).values = overviewRows;
styleBody(overview.getRange(`A${overviewDataStart}:H${overviewDataEnd}`));
overview.getRange(`D${overviewDataStart}:D${overviewDataEnd}`).format.numberFormat = "#,##0";
overview.getRange(`E${overviewDataStart}:E${overviewDataEnd}`).format.numberFormat = "0.00%";
overview.getRange(`A${overviewDataStart}:H${overviewDataEnd}`).format.rowHeight = 48;

overview.getRange("J9:N9").merge();
overview.getRange("J9").values = [["记录量前15个平台"]];
overview.getRange("J9:N9").format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 12 } };
overview.getRange("J10:K25").values = [["平台编号", "记录数"], ...ranked.slice(0, 15).map(([key]) => [key, profile.sources[key].total])];
styleHeader(overview.getRange("J10:K10"));
styleBody(overview.getRange("J11:K25"));
overview.getRange("K11:K25").format.numberFormat = "#,##0";
const topChart = overview.charts.add("bar", overview.getRange("J10:K25"));
topChart.title = "记录量前15个平台";
topChart.hasLegend = false;
topChart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 9 } };
topChart.yAxis = { numberFormatCode: "#,##0" };
topChart.setPosition("J27", "N47");

overview.getRange("A25:H25").merge();
overview.getRange("A25").values = [["建议怎么用"]];
overview.getRange("A25:H25").format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 12 } };
overview.getRange("A26:H30").merge();
overview.getRange("A26").values = [["1. 描述性统计：可直接按“平台X”编号汇总。\n2. 论文/回归：用匿名编号作为平台固定效应最稳妥。\n3. 平台名称：只建议直接采用平台2、平台4、平台75；较高可信推断必须保留“推测”字样。\n4. 如果需要100%官方映射，只能向数据商索取原始编号字典或购买协议中的字段说明。"]];
overview.getRange("A26:H30").format = { fill: colors.lightGray, font: { color: colors.text, size: 11 }, wrapText: true, verticalAlignment: "top", borders: { preset: "all", style: "thin", color: colors.border } };
overview.showGridLines = false;
overview.freezePanes.freezeRows(3);
const overviewWidths = [12, 28, 15, 14, 11, 12, 58, 22, 4, 14, 16, 4, 4, 4];
overviewWidths.forEach((width, index) => { overview.getRangeByIndexes(0, index, 48, 1).format.columnWidth = width; });

await fs.mkdir(previewDir, { recursive: true });
for (const sheetName of ["结论总览", "平台对照", "年度分布", "样本明细", "方法与证据"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 0.85, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const errorCheck = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  maxChars: 5000,
});
await fs.writeFile(path.join(outputDir, "formula_error_check.txt"), errorCheck.ndjson ?? String(errorCheck), "utf8");

const summaryInspect = await workbook.inspect({
  kind: "region",
  sheetId: "结论总览",
  range: "A1:N30",
  maxChars: 10000,
});
await fs.writeFile(path.join(outputDir, "summary_inspect.txt"), summaryInspect.ndjson ?? String(summaryInspect), "utf8");

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(JSON.stringify({ outputPath, previewDir, totalRows, platformCodes: orderedSources.length - 1, mappingEnd, sampleEnd }, null, 2));
