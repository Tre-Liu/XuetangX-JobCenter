import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const sourcePptx = "/Users/liuhongzhe/Desktop/学堂在线智慧专业解决方案2604版.pptx";
const outputPptx = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/学堂在线智慧专业解决方案2604版_双高计划政策页.pptx";
const previewPng = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/slide-01-preview.png";
const layoutJson = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/slide-01-final.layout.json";

const C = {
  purple: "#743481",
  purpleDark: "#460073",
  purpleMid: "#823F98",
  ink: "#23324A",
  text: "#455468",
  line: "#D9E1EC",
  lightPurple: "#F2ECF8",
  lightBlue: "#EEF6FF",
  navy: "#253E74",
  blue: "#2B7CC6",
  green: "#1FAD66",
  orange: "#F3A438",
  red: "#E95343",
  violet: "#8146B2",
  white: "#FFFFFF",
};

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

function textBox(slide, text, position, style = {}, name = "") {
  const shape = slide.shapes.add({
    geometry: "textbox",
    ...(name ? { name } : {}),
    position,
    fill: "none",
    line: { style: "solid", fill: "#FFFFFF/0", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFace: "微软雅黑",
    color: C.ink,
    fontSize: 16,
    ...style,
  };
  return shape;
}

function metricCard(slide, left, color, value, label) {
  const card = slide.shapes.add({
    geometry: "roundRect",
    name: `metric-${value}`,
    position: { left, top: 570, width: 124, height: 104 },
    fill: C.white,
    line: { style: "solid", fill: color, width: 2 },
    borderRadius: 10,
    shadow: "shadow-sm",
  });
  const number = textBox(slide, value, { left: left + 8, top: 584, width: 108, height: 31 }, {
    fontFace: "微软雅黑", fontSize: 24, bold: true, color, alignment: "center",
  }, `metric-number-${value}`);
  textBox(slide, label, { left: left + 8, top: 623, width: 108, height: 33 }, {
    fontFace: "微软雅黑", fontSize: 11, color: C.text, alignment: "center",
  }, `metric-label-${value}`);
  return { card, number };
}

function issueRow(slide, top, color, label, detail) {
  slide.shapes.add({
    geometry: "rect",
    position: { left: 698, top, width: 5, height: 25 },
    fill: color,
    line: { style: "solid", fill: color, width: 0 },
  });
  textBox(slide, label, { left: 714, top: top - 2, width: 118, height: 22 }, {
    fontFace: "微软雅黑", fontSize: 13, bold: true, color,
  });
  textBox(slide, detail, { left: 842, top: top - 2, width: 380, height: 25 }, {
    fontFace: "微软雅黑", fontSize: 11, color: C.text,
  });
}

function policyFrame(slide, { left, top, width, height, color, tint, number, title, body }) {
  slide.shapes.add({
    geometry: "roundRect",
    name: `policy-frame-${number}`,
    position: { left, top, width, height },
    fill: tint,
    line: { style: "solid", fill: color, width: 2 },
    borderRadius: 8,
    shadow: "shadow-sm",
  });
  const badge = slide.shapes.add({
    geometry: "ellipse",
    position: { left: left + 14, top: top + 13, width: 27, height: 27 },
    fill: color,
    line: { style: "solid", fill: color, width: 0 },
  });
  badge.text = String(number);
  badge.text.style = { fontFace: "微软雅黑", fontSize: 15, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
  textBox(slide, title, { left: left + 53, top: top + 13, width: width - 68, height: 26 }, {
    fontFace: "微软雅黑", fontSize: 18, bold: true, color,
  }, `policy-title-${number}`);
  textBox(slide, body, { left: left + 20, top: top + 48, width: width - 40, height: height - 57 }, {
    fontFace: "微软雅黑", fontSize: 9.5, color: C.ink,
  }, `policy-body-${number}`);
}

function reformTask(slide, { left, color, number, title, body }) {
  slide.shapes.add({
    geometry: "roundRect",
    name: `reform-task-${number}`,
    position: { left, top: 382, width: 123, height: 68 },
    fill: C.white,
    line: { style: "solid", fill: color, width: 2 },
    borderRadius: 6,
    shadow: "shadow-sm",
  });
  textBox(slide, `${number} ${title}`, { left: left + 8, top: 390, width: 107, height: 16 }, {
    fontFace: "微软雅黑", fontSize: 8.6, bold: true, color,
    alignment: "center",
  }, `reform-title-${number}`);
  textBox(slide, body, { left: left + 8, top: 411, width: 107, height: 29 }, {
    fontFace: "微软雅黑", fontSize: 8.1, color: C.text, alignment: "center",
  }, `reform-body-${number}`);
}

function fiveGoldCard(slide, { left, color, label, policy, product }) {
  slide.shapes.add({
    geometry: "roundRect",
    name: `gold-card-${label}`,
    position: { left, top: 493, width: 224, height: 160 },
    fill: C.white,
    line: { style: "solid", fill: color, width: 2 },
    borderRadius: 9,
    shadow: "shadow-sm",
  });
  const tag = slide.shapes.add({
    geometry: "roundRect",
    position: { left: left + 11, top: 504, width: 56, height: 25 },
    fill: color,
    line: { style: "solid", fill: color, width: 0 },
    borderRadius: 4,
  });
  tag.text = label;
  tag.text.style = { fontFace: "微软雅黑", fontSize: 12, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
  textBox(slide, "政策要求", { left: left + 78, top: 507, width: 90, height: 20 }, {
    fontFace: "微软雅黑", fontSize: 10, bold: true, color: "#6E7D91",
  }, `gold-policy-title-${label}`);
  textBox(slide, policy, { left: left + 14, top: 535, width: 196, height: 47 }, {
    fontFace: "微软雅黑", fontSize: 10, color: C.ink,
  }, `gold-policy-${label}`);
  slide.shapes.add({
    geometry: "line",
    position: { left: left + 14, top: 586, width: 196, height: 0 },
    fill: "none",
    line: { style: "solid", fill: "#C9D1DC", width: 1 },
  });
  textBox(slide, "产品机会", { left: left + 14, top: 597, width: 100, height: 18 }, {
    fontFace: "微软雅黑", fontSize: 11, bold: true, color,
  }, `gold-product-title-${label}`);
  textBox(slide, product, { left: left + 14, top: 618, width: 196, height: 20 }, {
    fontFace: "微软雅黑", fontSize: 9.3, bold: true, color: C.navy,
  }, `gold-product-${label}`);
}

async function main() {
  const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePptx));
  const slide = presentation.slides.getItem(0);
  const pageTwo = slide.duplicate();
  pageTwo.moveTo(1);

  textBox(slide, "职业教育领域的“双一流”工程", { left: 53, top: 88, width: 680, height: 28 }, {
    fontFace: "微软雅黑", fontSize: 13, bold: true, color: C.purpleMid,
  }, "policy-eyebrow");
  textBox(slide, "什么是“双高计划”？", { left: 53, top: 108, width: 520, height: 42 }, {
    fontFace: "微软雅黑", fontSize: 27, bold: true, color: C.purpleDark,
  }, "policy-title");
  textBox(slide, "以高水平学校和专业群建设，推动职业教育提质增效", { left: 578, top: 119, width: 615, height: 24 }, {
    fontFace: "微软雅黑", fontSize: 15, color: C.text, alignment: "right",
  }, "policy-subtitle");

  const intro = slide.shapes.add({
    geometry: "roundRect",
    name: "policy-definition",
    position: { left: 53, top: 156, width: 1175, height: 57 },
    fill: C.lightBlue,
    line: { style: "solid", fill: "#82B6E9", width: 1 },
    borderRadius: 7,
  });
  intro.text = "全称：中国特色高水平高职学校和专业建设计划（“双高”= 办学能力高水平 + 产教融合高质量）。\n由教育部、财政部联合实施，是职业教育领域最高级别的国家建设工程；核心载体是“高水平专业群”，强调动态管理、优胜劣汰。";
  intro.text.style = {
    fontFace: "微软雅黑",
    fontSize: 13,
    color: C.ink,
    verticalAlignment: "middle",
  };

  textBox(slide, "第一期 vs 第二期：核心对比", { left: 53, top: 226, width: 520, height: 24 }, {
    fontFace: "微软雅黑", fontSize: 20, bold: true, color: C.navy,
  }, "comparison-heading");

  const values = [
    ["对比维度", "第一期（2019-2023）", "第二期（2025-2029）"],
    ["建设规模", "197 所（56 所高水平学校 + 141 个专业群）", "220 所（60 所高水平学校 + 160 个专业群）↑ 11.68%"],
    ["办学层次", "全部专科层次", "新增 49 所职业本科院校（含 2 所民办）"],
    ["建设导向", "“强基础”——基础能力建设为核心", "“强赋能”——需求导向、产教融合、质量为本"],
    ["核心任务", "10 项改革发展任务", "9 大改革任务 + “五金”体系 + 数字化生态"],
    ["资金支持", "中央财政奖补（分档）", "每个专业群每年 1000 万元奖补，模式更清晰"],
    ["管理机制", "中期评估 + 绩效评价", "动态管理，有进有出，“差”不得进入下一期"],
    ["覆盖范围", "覆盖 29 个省份", "覆盖全部 31 省份 + 兵团，填补青海、西藏空白"],
    ["数字化要求", "未明确提出", "AI 融入全要素全过程，构建数字化教学新生态"],
  ];
  const table = slide.tables.add({
    rows: 9,
    columns: 3,
    left: 53,
    top: 263,
    width: 1175,
    height: 252,
    columnWidths: [232, 455, 488],
    values,
  });
  table.borders.assign({ style: "solid", fill: C.line, width: 0.65 });
  table.rows[0].height = 30;
  for (let r = 1; r < 9; r += 1) table.rows[r].height = 27.75;
  const headerFills = [C.navy, "#69798C", C.purpleMid];
  for (let c = 0; c < 3; c += 1) {
    const cell = table.getCell(0, c);
    cell.fill = headerFills[c];
    cell.text.style = { fontFace: "微软雅黑", fontSize: 13, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
  }
  for (let r = 1; r < 9; r += 1) {
    const shade = r % 2 === 1 ? "#F7F9FC" : C.white;
    table.cells.block({ row: r, column: 0, rowCount: 1, columnCount: 3 }).assign({
      fill: shade,
      margins: { top: 2, right: 7, bottom: 2, left: 7 },
      anchor: "middle",
    });
    table.getCell(r, 0).text.style = { fontFace: "微软雅黑", fontSize: 10, bold: true, color: C.navy, verticalAlignment: "middle" };
    table.getCell(r, 1).text.style = { fontFace: "微软雅黑", fontSize: 9.5, color: C.text, verticalAlignment: "middle" };
    table.getCell(r, 2).text.style = { fontFace: "微软雅黑", fontSize: 9.5, color: C.text, verticalAlignment: "middle" };
  }
  [4, 5, 6, 8].forEach((r) => {
    table.getCell(r, 2).text.style = { fontFace: "微软雅黑", fontSize: 9.5, bold: true, color: r === 4 || r === 5 || r === 8 ? "#D7392E" : C.ink, verticalAlignment: "middle" };
  });

  textBox(slide, "第一期建设成效", { left: 53, top: 533, width: 300, height: 22 }, {
    fontFace: "微软雅黑", fontSize: 18, bold: true, color: C.navy,
  }, "outcomes-heading");
  metricCard(slide, 53, C.red, "670项", "国家级数字化\n成果奖");
  metricCard(slide, 191, C.blue, "373个", "双高校获\n教改项目");
  metricCard(slide, 329, C.green, "85%+", "数字校园\n覆盖率");
  metricCard(slide, 467, C.violet, "278个", "服务国家级\n产业园区");

  textBox(slide, "第一期主要问题（第二期要解决的）", { left: 698, top: 533, width: 530, height: 22 }, {
    fontFace: "微软雅黑", fontSize: 18, bold: true, color: C.red,
  }, "issues-heading");
  issueRow(slide, 568, C.red, "产教融合不深", "校企合作“合而不融”，企业参与育人流于形式");
  issueRow(slide, 596, C.orange, "数字化转型不足", "数字教材等资源应用效果不佳，技术融合度不够");
  issueRow(slide, 624, C.blue, "国际化层次不高", "“职教出海”缺乏国际化专业标准和课程资源");
  issueRow(slide, 652, C.violet, "同质化竞争", "部分院校差异化定位不足，与地方产业对接不精准");

  slide.speakerNotes.textFrame.setText("[Sources]\n- 用户提供：讯飞AI职教平台V3.0 Charter立项-教育BG -V20260413_IPD修改稿.pdf，第 4 页。\n- 模板：学堂在线智慧专业解决方案2604版.pptx。\n[/Sources]");
  slide.speakerNotes.setVisible(true);

  textBox(pageTwo, "第二期“双高计划”｜政策逻辑与产品机会", { left: 53, top: 91, width: 720, height: 20 }, {
    fontFace: "微软雅黑", fontSize: 13, bold: true, color: C.purpleMid,
  }, "phase-two-eyebrow");
  textBox(pageTwo, "从顶层设计到“五金”建设", { left: 53, top: 109, width: 650, height: 34 }, {
    fontFace: "微软雅黑", fontSize: 25, bold: true, color: C.purpleDark,
  }, "phase-two-title");
  const banner = pageTwo.shapes.add({
    geometry: "roundRect",
    name: "phase-two-transition",
    position: { left: 53, top: 152, width: 1175, height: 47 },
    fill: C.navy,
    line: { style: "solid", fill: C.navy, width: 0 },
    borderRadius: 5,
    shadow: "shadow-sm",
  });
  banner.text = "第二期核心转变：从“建基础”到“强赋能” · 从“单点突破”到“五金联动”\n从“经验建设”到“AI+数据驱动” · 每个“金”都是产品切入点";
  banner.text.style = { fontFace: "微软雅黑", fontSize: 14, bold: true, color: "#FFF000", alignment: "center", verticalAlignment: "middle" };

  textBox(pageTwo, "四维政策框架：第二期的顶层设计逻辑", { left: 53, top: 212, width: 620, height: 22 }, {
    fontFace: "微软雅黑", fontSize: 18, bold: true, color: C.navy,
  }, "policy-framework-heading");
  policyFrame(pageTwo, { left: 53, top: 241, width: 282, height: 94, color: C.red, tint: "#FFF2F0", number: 1, title: "需求导向", body: "围绕国家重大战略、重点产业\n“一体两翼”、高品质民生\n边疆职教、职教出海" });
  policyFrame(pageTwo, { left: 350, top: 241, width: 282, height: 94, color: C.blue, tint: "#F0F7FF", number: 2, title: "产教融合", body: "统筹推进与市场产教联合体\n行业产教融合共同体建设\n企业技术资源开放转化" });
  policyFrame(pageTwo, { left: 647, top: 241, width: 282, height: 94, color: C.green, tint: "#F0FAF5", number: 3, title: "质量为本", body: "绩效评价倒逼质量提升\n6个一级指标体系\n动态管理，“差”不得进入下一期" });
  policyFrame(pageTwo, { left: 944, top: 241, width: 284, height: 94, color: C.violet, tint: "#F8F0FC", number: 4, title: "标准引领", body: "“五金”建设标准体系\n758项专业数字标准更新\n2027年建成先进标准体系" });

  textBox(pageTwo, "九大改革任务：围绕高水平专业群展开", { left: 53, top: 354, width: 620, height: 22 }, {
    fontFace: "微软雅黑", fontSize: 18, bold: true, color: C.navy,
  }, "reform-heading");
  [
    ["①", C.navy, "思政育人", "“大思政”格局\n课程思政深度融入"],
    ["②", C.blue, "产教融合创新", "市场产教联合体\n行业融合共同体"],
    ["③", C.red, "高水平专业群", "对接产业集群\n动态调整专业设置"],
    ["④", C.green, "一流核心课程", "模块化课程体系\n校企共建课程资源"],
    ["⑤", C.orange, "优质新形态教材", "活页式、数字化教材\n融合AI与新技术"],
    ["⑥", C.violet, "高水平双师队伍", "细化教师能力清单\n数字素养硬性要求"],
    ["⑦", "#1DAE8F", "产教融合实训基地", "智能仿真实训\n企业真实场景实训"],
    ["⑧", "#E07724", "数字化教学生态", "AI融入全要素过程\n数字校园智慧升级"],
    ["⑨", "#6E7D91", "国际交流合作", "职教出海\n国际化专业标准输出"],
  ].forEach(([number, color, title, body], index) => reformTask(pageTwo, { left: 53 + index * 131.5, color, number, title, body }));

  textBox(pageTwo, "“五金”建设体系：教学关键要素的核心载体", { left: 53, top: 462, width: 700, height: 22 }, {
    fontFace: "微软雅黑", fontSize: 18, bold: true, color: C.navy,
  }, "five-gold-heading");
  fiveGoldCard(pageTwo, { left: 53, color: C.red, label: "金专", policy: "动态调整专业设置\nAI预见人才供需\n对接产业集群布局", product: "专业规划决策平台\n产业-专业匹配分析" });
  fiveGoldCard(pageTwo, { left: 291, color: C.orange, label: "金课", policy: "科学设计课程组合\n模块化课程体系\n校企共建课程资源", product: "AI课程开发平台\n模块化课程资源库" });
  fiveGoldCard(pageTwo, { left: 529, color: C.green, label: "金师", policy: "细化教师能力清单\n数字素养硬性要求\n双师型队伍建设", product: "教师数字素养培训\n教学能力评估系统" });
  fiveGoldCard(pageTwo, { left: 767, color: C.blue, label: "金地", policy: "产教融合实习实训基地\n企业技术资源开放转化\n智能仿真实训室", product: "虚拟仿真实训平台\n数字孪生实训系统" });
  fiveGoldCard(pageTwo, { left: 1004, color: C.violet, label: "金数", policy: "优化教材呈现形式\n活页式、数字化教材\n融合新技术新工艺", product: "数字活页教材平台\nAI教材编写工具" });
  pageTwo.speakerNotes.textFrame.setText("[Sources]\n- 用户提供：讯飞AI职教平台V3.0 Charter立项-教育BG -V20260413_IPD修改稿.pdf，第 4 页。\n- 模板：学堂在线智慧专业解决方案2604版.pptx。\n[/Sources]");
  pageTwo.speakerNotes.setVisible(true);

  const preview = await presentation.export({ slide, format: "png", scale: 1 });
  await writeBlob(previewPng, preview);
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(layoutJson, await layout.text());
  const pageTwoPreview = await presentation.export({ slide: pageTwo, format: "png", scale: 1 });
  await writeBlob("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/slide-02-preview.png", pageTwoPreview);
  const pageTwoLayout = await pageTwo.export({ format: "layout" });
  await fs.writeFile("/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/slide-02-final.layout.json", await pageTwoLayout.text());
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outputPptx);
}

await main();
