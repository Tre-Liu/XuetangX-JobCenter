import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workspace = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程";
const profilePath = path.join(workspace, "work/platform-source-mapping/source_profile.json");
const deepPath = path.join(workspace, "work/platform-source-mapping/deep_unknown_samples.json");
const outputDir = path.join(workspace, "outputs/019f8903-6f61-78c3-a3c7-f64a9578a946");
const outputPath = path.join(outputDir, "平台来源映射深挖版_2014-2025.xlsx");
const previewDir = path.join(outputDir, "previews_deep");

const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
const deep = JSON.parse(await fs.readFile(deepPath, "utf8")).sources;
const totalRows = Object.values(profile.sources).reduce((sum, item) => sum + item.total, 0);
const years = Array.from({ length: 12 }, (_, i) => 2014 + i);

const sourceMappings = {
  "平台1": {
    platform: "综合职位聚合/转载源（含百度招聘痕迹）",
    confidence: "低可信推断",
    basis: "扩大抽样后发现21,844条正文含zhaopin.baidu.com，同时混有58、智联、51job等转载痕迹；更像综合聚合源，不能再简单等同智联。",
    evidence: "https://zhaopin.baidu.com/",
    note: "百度域名仅覆盖约3%，因此只能确认存在百度招聘转载链路，无法唯一锁定原始站点。",
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
  "平台7": {
    platform: "智通直聘（原智通人才网）",
    confidence: "直接确认",
    basis: "扩大样本中的“东莞市意戈尔贸易有限公司—亚马逊运营/亚马逊销售”可在智通直聘找到同公司、同岗位；平台7又高度集中于东莞。",
    evidence: "https://www.job5156.com/dongguan/job_278250689",
    note: "以精确岗位页及地域结构双重确认。",
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
  "平台20": {
    platform: "斗米（原斗米兼职，推测）",
    confidence: "较高可信推断",
    basis: "职位分类高度集中为话务客服、家教助教、打包分拣、房产经纪人、送餐员等，与斗米公开分类体系高度一致；薪资还大量采用日薪。",
    evidence: "https://www.doumi.com/",
    note: "缺少发布方编号字典，仍保留“推测”。",
  },
  "平台21": {
    platform: "厦门人才网",
    confidence: "直接确认",
    basis: "62,465条中62,431条正文含xmrc.com.cn，样本还直接写明“更多详情，请浏览厦门人才网”。",
    evidence: "https://www.xmrc.com.cn/",
    note: "域名命中率99.95%，可直接采用。",
  },
  "平台31": {
    platform: "国际人才网（中山，推测）",
    confidence: "较高可信推断",
    basis: "32,078条高度集中于中山，并覆盖佛山、江门、珠海等珠江西岸城市，与国际人才网的服务区域吻合。",
    evidence: "https://www.job001.cn/",
    note: "地域结构很强，但未找到编号级证据。",
  },
  "平台32": {
    platform: "康强医疗人才网",
    confidence: "直接确认",
    basis: "16,662条中15,210条正文含kq36.com，代表样本明确写有“更多详情，请浏览康强医疗人才网”。",
    evidence: "https://www.kq36.com/",
    note: "域名与平台名称在正文同时出现，可直接采用。",
  },
  "平台43": {
    platform: "应届生求职网（推测）",
    confidence: "较高可信推断",
    basis: "83,165条记录直接标为“应届生”，岗位标题高频出现“校园招聘”，并含大量实习和校招信息，和应届生求职网定位高度吻合。",
    evidence: "https://www.yingjiesheng.com/",
    note: "该站也会转载51job等平台岗位，因此是页面来源而不一定是最初发布源。",
  },
  "平台67": {
    platform: "钢结构招聘网",
    confidence: "直接确认",
    basis: "778条记录全部含gjgzpw.com，代表样本明确注明“此职位来源于《钢结构招聘网》”。",
    evidence: "https://www.gjgzpw.com/",
    note: "100%域名命中，可直接采用。",
  },
  "平台75": {
    platform: "BOSS直聘",
    confidence: "直接确认",
    basis: "代表样本“广东澜柏王科技有限公司—高级定制量体师/店长”可在BOSS直聘页面逐项对应公司、岗位、城市、薪资与学历。",
    evidence: "https://m.zhipin.com/zhaopin/c2684394b9c285470XF73dS5Fg~~/",
    note: "2025年该编号占主要来源，字段也与BOSS当前口径一致。",
  },
  "平台94": {
    platform: "百度招聘聚合页（推测）",
    confidence: "较高可信推断",
    basis: "121,888条中27,081条正文含zhaopin.baidu.com，且主要集中于2016–2017的聚合型字段结构。",
    evidence: "https://zhaopin.baidu.com/",
    note: "域名命中约22%，可能还混有被百度收录的转载记录。",
  },
};

const candidateMappings = {
  "平台12": ["深圳地方招聘源（中国人才热线候选）", "34,351条中32,320条位于深圳，样本出现“中国人才热线”文本。", "https://www.cjol.com/", "精确岗位反查不足，仅作为候选。"],
  "平台18": ["福建地方人才站（候选）", "样本主要集中于厦门、泉州、福州，字段风格稳定。", "https://www.hxrc.com/", "可能是海峡人才网、福建招聘站或转载源。"],
  "平台24": ["山东地方招聘/职位聚合站（候选）", "标题高频采用“城市市+岗位+招聘”模板，地理上以济南、青岛为主。", "https://www.qlrc.com/", "齐鲁人才网仅为候选之一。"],
  "平台30": ["重庆本地招聘站（汇博招聘候选）", "26,101条中25,949条位于重庆，呈现明显地方站特征。", "https://www.huibo.com/", "精确岗位页未形成稳定命中。"],
  "平台34": ["山东地方招聘/职位聚合站（候选）", "39,093条主要分布在济南、青岛等山东城市。", "https://www.qlrc.com/", "可能与平台24为不同抓取批次或不同站点。"],
  "平台53": ["重庆本地招聘站（候选）", "10,468条中9,255条位于重庆，地方性很强。", "https://www.huibo.com/", "不能确认是否与平台30属于同一站点。"],
  "平台55": ["云南招聘网/昆明人才网（候选）", "14,265条主要分布在昆明及云南州市；正文中ynzp.com有69条。", "https://www.ynzp.com/", "地域证据强、域名证据弱。"],
  "平台71": ["珠三角地方人才站/聚合源（候选）", "早期样本偏佛山、汕头、江门、中山，后期混入全国职位。", "https://www.job001.cn/", "不能确认与平台31相同。"],
};
for (const [key, [platform, basis, evidence, note]] of Object.entries(candidateMappings)) {
  sourceMappings[key] = { platform, confidence: "低可信推断", basis, evidence, note };
}

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
const fingerprintSheet = workbook.worksheets.add("深挖画像");
const yearSheet = workbook.worksheets.add("年度分布");
const sampleSheet = workbook.worksheets.add("扩大样本");
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
styleTitle(mappingSheet, "A1:Q2", "“平台X”来源映射深挖总表（2014–2025.6）");
mappingSheet.getRange("A3:Q3").merge();
mappingSheet.getRange("A3").values = [["重要：本版对原“未能可靠识别”平台做了跨年份扩大抽样与域名指纹扫描。只有“直接确认”可视为明确映射；其余仍是分级推断。"]];
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

// 深挖画像：记录每个平台的域名、平台词、地域和字段指纹
styleTitle(fingerprintSheet, "A1:N2", "扩大抽样后的平台画像与识别指纹");
fingerprintSheet.getRange("A3:N3").merge();
fingerprintSheet.getRange("A3").values = [["未识别平台采用全局水库抽样40条 + 每年最多5条的分层样本，同时扫描全部记录中的平台词和域名；本表展示汇总指纹。"]];
fingerprintSheet.getRange("A3:N3").format = { fill: colors.lightAmber, font: { bold: true, color: "#7A4B00" }, wrapText: true };
const fingerprintHeaders = ["平台编号", "当前结论", "置信度", "记录数", "年份", "抽样池规模", "主要城市", "主要区域", "主要经验", "主要学历", "主要类别", "薪资组合", "域名指纹", "平台词命中"];
fingerprintSheet.getRange("A5:N5").values = [fingerprintHeaders];
styleHeader(fingerprintSheet.getRange("A5:N5"));
const fmtTop = (items, limit = 5) => (items ?? []).slice(0, limit).map(([v, n]) => `${v || "空"}（${Number(n).toLocaleString("zh-CN")}）`).join("；");
const fingerprintRows = orderedSources.map(([key, item]) => {
  const d = deep[key];
  const mapping = sourceMappings[key];
  const ys = Object.keys(item.by_year).map(Number).sort((a, b) => a - b);
  const domainItems = (d?.domains_top ?? []).filter(([v]) => /[a-z]/i.test(v) && v.includes("."));
  const yearSampleCount = d ? Object.values(d.year_samples ?? {}).reduce((n, rows) => n + rows.length, 0) : 0;
  return [
    key,
    mapping?.platform ?? (key === "（空白）" ? "来源字段为空" : "未能可靠识别"),
    mapping?.confidence ?? (key === "（空白）" ? "不适用" : "待确认"),
    item.total,
    ys.length ? `${ys[0]}–${ys.at(-1)}` : "",
    d ? `${d.global_samples.length}全局 + ${yearSampleCount}年度` : `${item.samples.length}基础样本`,
    fmtTop(item.city_top, 5),
    fmtTop(item.region_top, 5),
    fmtTop(d?.experience_top ?? item.experience_top, 5),
    fmtTop(d?.education_top ?? item.education_top, 5),
    fmtTop(d?.category_top ?? item.category_top, 5),
    fmtTop(d?.salary_pairs_top, 5),
    fmtTop(domainItems, 7),
    fmtTop(d?.marker_hits, 7),
  ];
});
const fingerprintStart = 6;
const fingerprintEnd = fingerprintStart + fingerprintRows.length - 1;
fingerprintSheet.getRange(`A${fingerprintStart}:N${fingerprintEnd}`).values = fingerprintRows;
styleBody(fingerprintSheet.getRange(`A${fingerprintStart}:N${fingerprintEnd}`));
fingerprintSheet.getRange(`D${fingerprintStart}:D${fingerprintEnd}`).format.numberFormat = "#,##0";
fingerprintSheet.getRange(`A${fingerprintStart}:N${fingerprintEnd}`).format.rowHeight = 62;
fingerprintSheet.getRange(`C${fingerprintStart}:C${fingerprintEnd}`).conditionalFormats.add("containsText", { text: "直接确认", format: { fill: "#DCEFE1", font: { bold: true, color: "#25613B" } } });
fingerprintSheet.getRange(`C${fingerprintStart}:C${fingerprintEnd}`).conditionalFormats.add("containsText", { text: "待确认", format: { fill: "#FBE8E7", font: { color: "#8E3030" } } });
fingerprintSheet.freezePanes.freezeRows(5);
fingerprintSheet.freezePanes.freezeColumns(3);
fingerprintSheet.showGridLines = false;
const fingerprintWidths = [12, 30, 15, 14, 12, 18, 38, 38, 42, 38, 45, 42, 58, 48];
fingerprintWidths.forEach((width, index) => { fingerprintSheet.getRangeByIndexes(0, index, fingerprintEnd, 1).format.columnWidth = width; });
fingerprintSheet.tables.add(`A5:N${fingerprintEnd}`, true, "PlatformFingerprintTable").style = "TableStyleMedium2";

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

// 扩大样本：优先覆盖不同年份，每个平台最多15条
styleTitle(sampleSheet, "A1:Q2", "扩大抽样明细（跨年份、跨岗位，每个平台最多15条）");
sampleSheet.getRange("A3:Q3").merge();
sampleSheet.getRange("A3").values = [["抽样用于识别平台结构，不代表总体比例。原“未识别”平台的候选池由40条全局水库样本和逐年样本构成，再按年份去重选取。"]];
sampleSheet.getRange("A3:Q3").format = { fill: colors.lightAmber, font: { bold: true, color: "#7A4B00" }, wrapText: true };
const sampleHeaders = ["平台编号", "当前结论", "确认级别", "年份", "原CSV行号", "企业名称", "招聘岗位", "城市", "区域", "最低月薪", "最高月薪", "学历", "经验", "招聘类别", "发布日期", "样本来源", "职位描述摘录"];
sampleSheet.getRange("A5:Q5").values = [sampleHeaders];
styleHeader(sampleSheet.getRange("A5:Q5"));

function chooseDeepSamples(key, item, cap = 15) {
  const d = deep[key];
  if (!d) return item.samples.slice(0, cap).map((s) => ({ ...s, sample_origin: "基础随机样本" }));
  const candidates = [];
  for (const year of Object.keys(d.year_samples ?? {}).sort()) {
    for (const s of d.year_samples[year]) candidates.push({ ...s, sample_origin: `年度分层-${year}` });
  }
  for (const s of d.global_samples ?? []) candidates.push({ ...s, sample_origin: "全局水库" });
  const seen = new Set();
  const unique = [];
  for (const s of candidates) {
    const id = `${s.year}|${s.row}|${s.company}|${s.job}`;
    if (!seen.has(id)) { seen.add(id); unique.push(s); }
  }
  if (unique.length <= cap) return unique;
  const selected = [];
  const byYear = new Map();
  for (const s of unique) {
    if (!byYear.has(s.year)) byYear.set(s.year, []);
    byYear.get(s.year).push(s);
  }
  for (const year of Array.from(byYear.keys()).sort()) {
    if (selected.length < cap) selected.push(byYear.get(year)[0]);
  }
  for (const s of unique) {
    if (selected.length >= cap) break;
    if (!selected.includes(s)) selected.push(s);
  }
  return selected;
}

const sampleRows = [];
for (const [key, item] of orderedSources) {
  const mapping = sourceMappings[key];
  for (const sample of chooseDeepSamples(key, item)) {
    sampleRows.push([
      key,
      mapping?.platform ?? (key === "（空白）" ? "来源字段为空" : "未能可靠识别"),
      mapping?.confidence ?? (key === "（空白）" ? "不适用" : "待确认"),
      sample.year,
      sample.row ?? "",
      sample.company ?? "",
      sample.job ?? "",
      sample.city ?? "",
      sample.region ?? "",
      Number(sample.salary_min) || null,
      Number(sample.salary_max) || null,
      sample.education ?? "",
      sample.experience ?? "",
      sample.category ?? "",
      sample.publish_date ?? "",
      sample.sample_origin,
      String(sample.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").slice(0, 260),
    ]);
  }
}
const sampleStart = 6;
const sampleEnd = sampleStart + sampleRows.length - 1;
sampleSheet.getRange(`A${sampleStart}:Q${sampleEnd}`).values = sampleRows;
styleBody(sampleSheet.getRange(`A${sampleStart}:Q${sampleEnd}`));
sampleSheet.getRange(`J${sampleStart}:K${sampleEnd}`).format.numberFormat = "¥#,##0";
sampleSheet.getRange(`A${sampleStart}:Q${sampleEnd}`).format.rowHeight = 58;
sampleSheet.freezePanes.freezeRows(5);
sampleSheet.freezePanes.freezeColumns(3);
sampleSheet.showGridLines = false;
const sampleWidths = [12, 30, 14, 9, 12, 30, 42, 12, 14, 12, 12, 12, 18, 20, 14, 16, 75];
sampleWidths.forEach((width, index) => { sampleSheet.getRangeByIndexes(0, index, sampleEnd, 1).format.columnWidth = width; });
sampleSheet.tables.add(`A5:Q${sampleEnd}`, true, "PlatformDeepSamplesTable").style = "TableStyleMedium2";

// 方法与证据
styleTitle(methodSheet, "A1:F2", "方法、置信度与公开证据");
const methodRows = [
  ["项目", "说明", "URL", "证据性质", "适用范围", "备注"],
  ["数据范围", "流式扫描文件夹内2014–2025全部12个CSV，共9,652,967条；识别到平台1–平台98及来源空白。", "", "本地数据统计", "全量", "未修改原始CSV"],
  ["扩大抽样", "对原未识别的90个平台建立40条全局水库样本，并按年份各抽最多5条；同步统计经验、学历、类别、薪资组合、平台词和域名。", "", "本地全量扫描+分层抽样", "90个平台", "扩大样本页最多展示15条/平台"],
  ["发布方数据说明", "发布方说明来源包含前程无忧、BOSS、智联、猎聘、拉勾、看准网等，但未公布98个编号字典。", "https://www.macrodatas.cn/article/1147473531", "发布方说明", "总体", "不能据此推出每个编号"],
  ["平台4", "发布方单平台数据库页面的图片与正文把招聘平台4对应到智联招聘。", "https://www.macrodatas.cn/article/1147473628", "直接编号证据", "平台4", "强证据"],
  ["平台4样本", "智联招聘岗位页可逐字段对应数据样本。", "https://www.zhaopin.com/jobdetail/CCL1434163800J40656432903.htm", "原始岗位页", "平台4", "强证据"],
  ["平台2", "51job校园招聘分类与样本使用的字段口径相符。", "https://xy.51job.com/", "平台字段与样本", "平台2", "强证据，仍非发布方编号表"],
  ["平台75", "BOSS直聘页面逐项对应“广东澜柏王科技—高级定制量体师/店长”样本。", "https://m.zhipin.com/zhaopin/c2684394b9c285470XF73dS5Fg~~/", "原始岗位页", "平台75", "强证据"],
  ["平台15", "智通直聘可找到“广东波斯科技—项目研发总工程师”高度一致岗位。", "https://www.job5156.com/guangzhou/job_278294453", "原始岗位页", "平台15", "较强样本证据"],
  ["平台7", "扩大样本中的“东莞市意戈尔贸易有限公司—亚马逊运营/亚马逊销售”可在智通直聘找到精确岗位页。", "https://www.job5156.com/dongguan/job_278250689", "原始岗位页", "平台7", "强证据"],
  ["平台20", "斗米首页公开的岗位分类与平台20高频分类高度一致，包括话务客服、打包分拣、家教助教、房产经纪人等。", "https://www.doumi.com/", "分类体系旁证", "平台20", "较高可信推断"],
  ["平台21", "62,431条正文命中xmrc.com.cn，样本明确写“浏览厦门人才网”。", "https://www.xmrc.com.cn/", "正文域名+平台名称", "平台21", "强证据"],
  ["平台31", "平台31高度集中在中山及珠江西岸城市，与国际人才网的区域覆盖吻合。", "https://www.job001.cn/", "地域结构旁证", "平台31", "较高可信推断"],
  ["平台32", "15,210条正文命中kq36.com，样本明确写“康强医疗人才网”。", "https://www.kq36.com/", "正文域名+平台名称", "平台32", "强证据"],
  ["平台67", "全部778条均命中gjgzpw.com，代表样本明确注明来源为钢结构招聘网。", "https://www.gjgzpw.com/", "正文域名+平台名称", "平台67", "强证据"],
  ["平台94", "27,081条正文命中zhaopin.baidu.com，且记录集中于2016–2017的聚合型字段。", "https://zhaopin.baidu.com/", "域名指纹", "平台94", "较高可信推断"],
  ["平台1边界", "平台1虽有21,844条百度招聘域名，但仅占约3%，并混有多个站点转载痕迹，因此改判为综合聚合/转载源。", "https://zhaopin.baidu.com/", "反例/边界证据", "平台1", "用于避免误判为智联"],
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
styleTitle(overview, "A1:N2", "应届生招聘大数据：匿名来源平台深挖汇总");
overview.getRange("A3:N3").merge();
overview.getRange("A3").values = [["结论先行：扩大抽样后，直接确认增至7个平台，并新增3个较高可信推断；其余候选仍不能当成官方映射。"]];
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
overview.getRange("A9").values = [["已识别 / 推测 / 候选的平台"]];
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

const adviceTitleRow = overviewDataEnd + 2;
const adviceEndRow = adviceTitleRow + 5;
overview.getRange(`A${adviceTitleRow}:H${adviceTitleRow}`).merge();
overview.getRange(`A${adviceTitleRow}`).values = [["建议怎么用"]];
overview.getRange(`A${adviceTitleRow}:H${adviceTitleRow}`).format = { fill: colors.navy, font: { bold: true, color: colors.white, size: 12 } };
overview.getRange(`A${adviceTitleRow + 1}:H${adviceEndRow}`).merge();
overview.getRange(`A${adviceTitleRow + 1}`).values = [["1. 可直接采用：平台2、4、7、21、32、67、75。\n2. 必须注明“推测”：平台9、10、15、16、20、31、43、94。\n3. 低可信候选和待确认编号：研究建模时继续保留“平台X”，不要强制替换名称。\n4. 如需100%官方映射，仍需向数据商索取编号字典。"]];
overview.getRange(`A${adviceTitleRow + 1}:H${adviceEndRow}`).format = { fill: colors.lightGray, font: { color: colors.text, size: 11 }, wrapText: true, verticalAlignment: "top", borders: { preset: "all", style: "thin", color: colors.border } };
overview.showGridLines = false;
overview.freezePanes.freezeRows(3);
const overviewWidths = [12, 28, 15, 14, 11, 12, 58, 22, 4, 14, 16, 4, 4, 4];
overviewWidths.forEach((width, index) => { overview.getRangeByIndexes(0, index, Math.max(48, adviceEndRow), 1).format.columnWidth = width; });

await fs.mkdir(previewDir, { recursive: true });
const previewRanges = {
  "结论总览": `A1:N${adviceEndRow}`,
  "平台对照": "A1:Q32",
  "深挖画像": "A1:N30",
  "年度分布": "A1:O30",
  "扩大样本": "A1:Q32",
  "方法与证据": `A1:F${3 + methodRows.length}`,
};
for (const sheetName of Object.keys(previewRanges)) {
  const preview = await workbook.render({ sheetName, range: previewRanges[sheetName], scale: 0.85, format: "png" });
  await fs.writeFile(path.join(previewDir, `${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const errorCheck = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  maxChars: 5000,
});
await fs.writeFile(path.join(outputDir, "formula_error_check_deep.txt"), errorCheck.ndjson ?? String(errorCheck), "utf8");

const summaryInspect = await workbook.inspect({
  kind: "region",
  sheetId: "结论总览",
  range: `A1:N${adviceEndRow}`,
  maxChars: 10000,
});
await fs.writeFile(path.join(outputDir, "summary_inspect_deep.txt"), summaryInspect.ndjson ?? String(summaryInspect), "utf8");

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(JSON.stringify({ outputPath, previewDir, totalRows, platformCodes: orderedSources.length - 1, mappingEnd, sampleEnd }, null, 2));
