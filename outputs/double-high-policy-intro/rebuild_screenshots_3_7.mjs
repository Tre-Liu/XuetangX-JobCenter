import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const inputPptx = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/学堂在线智慧专业解决方案2604版_双高计划政策页.pptx";
const outputPptx = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/学堂在线智慧专业解决方案2604版_双高计划政策页_3至7页重绘版.pptx";
const outDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/rebuild-3-7";

const C = {
  purple: "#743481", purpleDark: "#460073", navy: "#253E74", ink: "#23324A", text: "#526276",
  lightBlue: "#EEF6FF", blue: "#2B7CC6", green: "#1FAD66", orange: "#F3A438",
  red: "#E95343", violet: "#8146B2", teal: "#1DAE8F", line: "#D9E1EC", white: "#FFFFFF",
  gray: "#6E7D91", pale: "#F7F9FC",
};

async function writeBlob(path, blob) { await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer())); }
function box(slide, text, position, style = {}, name = "") {
  const s = slide.shapes.add({ geometry: "textbox", ...(name ? { name } : {}), position, fill: "none", line: { style: "solid", fill: "#FFFFFF/0", width: 0 } });
  s.text = text;
  s.text.style = { fontFace: "微软雅黑", fontSize: 14, color: C.ink, ...style };
  return s;
}
function rect(slide, position, fill, line = fill, radius = 0, name = "") {
  return slide.shapes.add({ geometry: radius ? "roundRect" : "rect", ...(name ? { name } : {}), position, fill, line: { style: "solid", fill: line, width: line === "none" ? 0 : 1.2 }, ...(radius ? { borderRadius: radius } : {}) });
}
function heading(slide, title, top, color = C.navy, left = 63, width = 780) { box(slide, title, { left, top, width, height: 25 }, { fontSize: 18, bold: true, color }, `heading-${title}`); }
function badge(slide, left, top, n, color, size = 28) {
  const b = slide.shapes.add({ geometry: "ellipse", position: { left, top, width: size, height: size }, fill: color, line: { style: "solid", fill: color, width: 0 } });
  b.text = String(n); b.text.style = { fontFace: "微软雅黑", fontSize: size * 0.52, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
}
function label(slide, text, left, top, width, color) {
  const tag = rect(slide, { left, top, width, height: 23 }, color, color, 4);
  tag.text = text; tag.text.style = { fontFace: "微软雅黑", fontSize: 11, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
}
function bulletText(slide, lines, left, top, width, fontSize = 10.3, color = C.text, height = 45) {
  box(slide, lines.map(x => `• ${x}`).join("\n"), { left, top, width, height }, { fontSize, color, breakLine: false });
}
function card(slide, { left, top, width, height, color, title, body, badgeNumber, tint = C.white, titleSize = 14, bodySize = 10.3 }) {
  rect(slide, { left, top, width, height }, tint, color, 7);
  if (badgeNumber !== undefined) badge(slide, left + 14, top + 13, badgeNumber, color, 25);
  const titleLeft = badgeNumber === undefined ? left + 14 : left + 49;
  box(slide, title, { left: titleLeft, top: top + 12, width: width - (titleLeft - left) - 14, height: 24 }, { fontSize: titleSize, bold: true, color }, `card-title-${title}`);
  box(slide, body, { left: left + 15, top: top + 43, width: width - 30, height: Math.max(8, height - 55) }, { fontSize: bodySize, color: C.text }, `card-body-${title}`);
}
function addNote(slide, pages) {
  slide.speakerNotes.textFrame.setText(`[Sources]\n- 用户提供：讯飞AI职教平台V3.0 Charter立项-教育BG -V20260413_IPD修改稿.pdf，第 ${pages} 页。\n- 模板：学堂在线智慧专业解决方案2604版.pptx。\n[/Sources]`);
  slide.speakerNotes.setVisible(true);
}

function rebuildSlide3(slide) {
  const banner = rect(slide, { left: 63, top: 92, width: 1154, height: 54 }, C.navy, C.navy, 5);
  banner.text = "✦ 国家双高220所是“灯塔客户”，省级双高600-800所是“规模市场”，“以国带省、由东向西”是最优客户覆盖路径";
  banner.text.style = { fontFace: "微软雅黑", fontSize: 15, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
  heading(slide, "“国家+省级” 双层双高体系", 157);
  card(slide, { left: 64, top: 184, width: 1153, height: 87, color: C.red, tint: "#FFF2F0", title: "国家双高", body: "教育部+财政部联合实施，220所院校，每专业群1000万/年\n• 60所高水平学校（每建2个专业群）+160个高水平专业群\n• 覆盖31省份+兵团，5年周期，动态管理、优胜劣汰", titleSize: 14, bodySize: 11 });
  label(slide, "国家双高", 79, 195, 83, C.red);
  const arrow = slide.shapes.add({ geometry: "downArrow", position: { left: 610, top: 274, width: 48, height: 24 }, fill: C.orange, line: { style: "solid", fill: C.orange, width: 0 } });
  card(slide, { left: 64, top: 302, width: 1153, height: 101, color: C.blue, tint: "#F0F7FF", title: "省级双高", body: "各省教育厅+财政厅实施，“一省一策”，规模远超国家双高\n• 各省自定建设标准和资金投入，与国家双高衔接但不重复\n• 覆盖未入选国家双高的院校，是更广泛的市场基础\n• 东部聚焦未来产业，中部强化装备制造，西部突出跨境服务", titleSize: 14, bodySize: 10.5 });
  label(slide, "省级双高", 79, 313, 83, C.blue);
  const estimate = rect(slide, { left: 64, top: 414, width: 1153, height: 34 }, C.orange, C.orange, 3);
  estimate.text = "✦ 省级双高总规模估算：全国约600-800所院校纳入省级双高建设，是国家双高的3-4倍";
  estimate.text.style = { fontFace: "微软雅黑", fontSize: 13, bold: true, color: C.white, verticalAlignment: "middle" };
  heading(slide, "重点省份“省双高”规模与政策特点", 465);
  const values = [["省份", "国家\n双高", "省级\n双高", "合计", "省级双高政策特点"], ["浙江", "15", "48", "63", "第二期省双高数量48所+100个专业群，规模最大，与数字经济深度结合"], ["河南", "8", "68", "76", "第二期“高职双高工程”68个建设单位，省级双高重磅扩围"], ["湖南", "12", "47", "59", "省级双高47所，新一轮预计扩容至59所，侧重装备制造与现代服务业"], ["四川", "9", "20", "29", "省级双高20所+133%，新一轮预计扩容29所，强化装备制造与电子信息"], ["广东", "16", "16", "32", "省级高水平高职16所，第一轮13所获“优秀”，质量靠前"], ["江苏", "20", "≈25", "≈45", "省级双高数量第一，包含4所新增职业本科院校；省双高与国家双高同步联动"]];
  const t = slide.tables.add({ rows: 7, columns: 5, left: 64, top: 495, width: 574, height: 177, columnWidths: [83, 54, 58, 56, 323], values });
  t.borders.assign({ style: "solid", fill: C.line, width: 0.65 });
  for (let r = 0; r < 7; r++) { t.rows[r].height = r === 0 ? 30 : 24.5; for (let c = 0; c < 5; c++) { const cell = t.getCell(r,c); cell.fill = r === 0 ? C.navy : (r % 2 ? C.white : C.pale); cell.text.style = { fontFace: "微软雅黑", fontSize: r === 0 ? 9.6 : (c === 4 ? 7.4 : 10.2), bold: r === 0 || c === 0 || c === 3, color: r === 0 ? C.white : (c === 0 ? C.blue : C.ink), alignment: c < 4 ? "center" : "left", verticalAlignment: "middle" }; } }
  heading(slide, "市场机会", 465, C.navy, 670, 240);
  const tierX = 670, tierW = 259;
  [["第一梯队｜国家双高220所｜优先切入", C.red], ["第二梯队｜省级双高600-800所｜快速复制", C.blue], ["第三梯队｜其他高职700+所｜SaaS覆盖", C.gray]].forEach(([title, color], i) => card(slide, { left: tierX, top: 495 + i * 61, width: tierW, height: 52, color, title, body: "", tint: i === 2 ? "#F8FAFC" : C.white, titleSize: 10.5, bodySize: 7.8 }));
  heading(slide, "关键词洞察", 465, C.navy, 951, 240);
  const insightX = 951; [["省双高是“被忽视的蓝海”", "省级双高总规模是国家双高3-4倍，多数供应商只盯国家双高，覆盖竞争较少", C.red], ["“一省一策”创造差异化机会", "东部聚焦数字经济，中部强化装备制造，西部突出边境服务和职教出海", C.blue], ["浙江和三省是省双高“大省”", "浙江48所+河南68个+湖南47所，三省合计163个建设单位，优先布局", C.green], ["“以国带省”是最佳销售策略", "在国家双高校打造标杆案例，利用省内示范效应快速复制到省级双高院校", C.violet]].forEach(([title, body, color], i) => { rect(slide, { left: insightX, top: 500 + i*43, width: 6, height: 26 }, color, color); box(slide, title, { left: insightX+16, top: 496+i*43, width: 250, height: 17 }, {fontSize:10.5,bold:true,color}); box(slide, body, { left: insightX+16, top: 512+i*43, width: 250, height: 30 }, {fontSize:7.8,color:C.text}); });
  addNote(slide, "5");
}

function rebuildSlide4(slide) {
  box(slide, "教育部《关于深化职业教育教学关键要素改革的意见》政策核心解读", { left: 64, top: 100, width: 1135, height: 30 }, { fontSize: 20, bold: true, color: C.navy, alignment: "center" });
  const left = 75, right = 665;
  heading(slide, "核心发展目标", 151, C.blue);
  card(slide, { left, top: 181, width: 535, height: 95, color: C.blue, tint: "#F0F7FF", title: "2027年：建成先进标准体系，形成可复制推广的教学改革新范式", body: "以专业、课程、教材、教师、实训基地等关键要素改革为抓手，系统提升职业教育教学质量。", badgeNumber: "短期", titleSize: 14, bodySize: 11 });
  card(slide, { left, top: 288, width: 535, height: 95, color: C.violet, tint: "#F8F0FC", title: "2035年：形成中国特色的职业教育实践模式", body: "推动职业教育办学形态、育人方式、管理模式与保障机制格局性变化，显著增强服务国家战略能力。", badgeNumber: "远期", titleSize: 14, bodySize: 11 });
  heading(slide, "四大基本原则", 407, C.blue);
  [["需求牵引", "对接产业需求，重构专业、课程与教材。", C.red], ["集群推进", "面向产业集群，整体推进改革。", C.blue], ["联动改革", "专业、课程、教材、教师、基地协同联动。", C.green], ["标准引领", "以标准体系固化改革成果、指导实践。", C.violet]].forEach(([title, body, color], i) => card(slide, {left: left+(i%2)*272, top: 438+Math.floor(i/2)*95, width: 255, height: 78, color, tint: C.white, title, body, badgeNumber:i+1, titleSize:13, bodySize:9.8}));
  heading(slide, "五大关键改革任务", 151, C.red, 665, 500);
  const tasks = [["动态调整专业设置", "专业要“实”", "建立产业需求导向的专业动态调整机制。", C.red], ["科学设计课程组合", "课程要“新”", "模块化、项目化课程，强化新技术融入。", C.orange], ["优化教材呈现形式", "教材要“活”", "开发活页式、数字化、融合新技术教材。", C.green], ["细化教师能力清单", "教师要“专”", "完善教师数字素养与双师能力要求。", C.blue], ["建设产教融合实训基地", "实训要“真”", "引入企业真实生产任务与技术资源。", C.violet]];
  tasks.forEach(([title, emph, body, color], i) => { const y=181+i*85; card(slide,{left:right,top:y,width:540,height:72,color,tint:i%2?C.white:"#FAFCFF",title,body,badgeNumber:i+1,titleSize:14,bodySize:10.1}); box(slide, emph,{left:right+404,top:y+17,width:112,height:20},{fontSize:12,bold:true,color,alignment:"right"}); });
  const bar = rect(slide,{left:665,top:615,width:540,height:42},C.navy,C.navy,5); bar.text="“五金”建设是关键要素改革的核心抓手：金专、金课、金师、金地、金数";bar.text.style={fontFace:"微软雅黑",fontSize:12.5,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};
  addNote(slide, "6");
}

function rebuildSlide5(slide) {
  box(slide,"改革实施机制与深远影响",{left:64,top:102,width:1135,height:30},{fontSize:22,bold:true,color:C.navy,alignment:"center"});
  heading(slide,"01  核心实施机制",157,C.blue);
  const mechanisms=[["集群培养计划","围绕产业链组织专业群，以专业集群服务产业集群，实现资源共享与协同育人。",C.blue],["“三组长”牵头机制","由专业、课程、教材等组长牵头，推动院校、企业、行业共同参与改革。",C.violet],["教学要素联动机制","专业、课程、教材、教师、实训基地五要素协同推进，避免单点改造。",C.green],["技术资源转化机制","将企业技术标准、生产流程和真实项目转化为教学资源与实训任务。",C.orange]];
  mechanisms.forEach(([title,body,color],i)=>card(slide,{left:64+(i%2)*572,top:190+Math.floor(i/2)*125,width:547,height:105,color,tint:i%2?"#FAFCFF":"#F5F9FF",title,body,badgeNumber:i+1,titleSize:16,bodySize:11}));
  const connector=rect(slide,{left:82,top:440,width:1118,height:2},"#BAC8DC","#BAC8DC");
  heading(slide,"02  深远影响与意义",465,C.red);
  const impacts=[["人才培养模式跃升","从知识传授转向能力培养，从单一学科转向跨学科融合，提升学生解决复杂问题的能力。",C.red],["激活企业内生动力","以企业真实需求为牵引，让企业从“参与者”转变为“共同建设者”和成果受益者。",C.orange],["服务新质生产力","通过专业与产业动态匹配、数字化升级，为战略性新兴产业和未来产业提供人才支撑。",C.blue],["构建职教新生态","形成政府统筹、行业指导、企业参与、学校主体、社会支持的协同改革生态。",C.green]];
  impacts.forEach(([title,body,color],i)=>card(slide,{left:64+i*284,top:498,width:260,height:133,color,tint:C.white,title,body,badgeNumber:i+1,titleSize:14,bodySize:10.1}));
  box(slide,"改革的本质：以教学关键要素的系统性重构，推动职业教育从规模发展走向内涵提升。",{left:140,top:654,width:1000,height:22},{fontSize:13,bold:true,color:C.purple,alignment:"center"});
  addNote(slide, "6");
}

function rebuildSlide6(slide) {
  const banner=rect(slide,{left:64,top:95,width:1153,height:48},C.navy,C.navy,5);banner.text="国务院“人工智能+”行动  →  AI+教育“全要素全过程”  →  AI+职教“备教练考评管”全链赋能";banner.text.style={fontFace:"微软雅黑",fontSize:14,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};
  const target=box(slide,"每个环节都是产品切入点",{left:64,top:142,width:1153,height:19},{fontSize:12,bold:true,color:C.orange,alignment:"center"});
  const section=(top,color,text)=>{const r=rect(slide,{left:64,top,width:1153,height:26},color,color,3);r.text=text;r.text.style={fontFace:"微软雅黑",fontSize:12.5,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};};
  section(171,C.navy,"第一层｜国务院《关于深入实施“人工智能+”行动的意见》（2025年8月）——六大重点行动");
  box(slide,"2027年普及率 >70%   →   2030年 >90%",{left:926,top:174,width:275,height:18},{fontSize:10.5,bold:true,color:"#FFF000",alignment:"right"});
  [["AI+科学技术","加速科学发现与科研范式变革",C.blue],["AI+产业发展","赋能研发、制造、服务全链条",C.violet],["AI+消费提质","创造智能消费新场景",C.orange],["AI+民生福祉","教育、医疗、养老等公共服务",C.red],["AI+治理能力","提升治理精准化与现代化",C.green],["AI+全球合作","推进人工智能国际协作",C.gray]].forEach(([title,body,color],i)=>card(slide,{left:64+i*192,top:207,width:178,height:68,color,tint:i===3?"#FFF2F0":C.white,title,body,badgeNumber:i+1,titleSize:10.5,bodySize:8.3}));
  section(293,C.red,"第二层｜AI+教育 国家级要求：“融入教育教学全要素、全过程”");
  [["AI+协同育教学","教师主导 + AI助教，提升课堂效率与学习体验"],["大规模因材施教","基于学习数据的学情诊断与个性化路径推荐"],["AI全学段通识教育","推进人工智能通识教育与实践能力培养"],["产教融合培养","企业真实场景、行业数据与职业教育深度融合"]].forEach(([title,body],i)=>card(slide,{left:122+i*261,top:329,width:239,height:61,color:C.red,tint:"#FFF8F7",title,body,badgeNumber:i+1,titleSize:11.5,bodySize:8.8}));
  section(409,C.green,"第三层｜AI+职业教育 落地分解：政策文件 + 应用现状 + 产品机会");
  card(slide,{left:64,top:445,width:407,height:200,color:C.green,tint:"#F2FBF6",title:"政策文件群",body:"• 职业院校智慧校园建设指引\n• 758项职业教育专业教学标准更新\n• 深化职业教育教学关键要素改革意见\n• 教育部生成式AI应用指引\n• 新质生产力背景下高技能人才培养",badgeNumber:1,titleSize:15,bodySize:10.5});
  card(slide,{left:487,top:445,width:329,height:200,color:C.blue,tint:"#F2F8FF",title:"应用现状数据（2026年初）",body:"50%  院校启动AI教学应用\n67%  教师使用AI工具辅助备课\n71.5% 学生期待AI个性化学习\n60%  院校规划智慧校园升级\n16%  教师具备系统AI教学能力\n-20% 教学管理重复性工作可被压缩",badgeNumber:2,titleSize:14,bodySize:10.4});
  card(slide,{left:832,top:445,width:385,height:200,color:C.orange,tint:"#FFF9EF",title:"产品机会分解",body:"1  AI课程开发与资源生成平台\n2  专业供需诊断与专业规划工具\n3  智能学伴与个性化学习系统\n4  虚拟仿真实训与数字孪生平台\n5  教师AI素养培训与能力评价",badgeNumber:3,titleSize:14,bodySize:10.8});
  addNote(slide, "7");
}

function rebuildSlide7(slide) {
  const banner=rect(slide,{left:64,top:94,width:1153,height:43},C.navy,C.navy,5);banner.text="《“人工智能+教育”行动计划》政策解读";banner.text.style={fontFace:"微软雅黑",fontSize:19,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};
  heading(slide,"政策总览｜四大重点任务",157,C.blue);
  const overview=[["人才培养与素养提升","构建全学段AI教育体系，推进通识教育、专业教育与实践能力培养。",C.blue],["AI与教育深度融合","推动智能学伴、智能教学、智能治理与科研创新。",C.violet],["基础环境建设","强化算力平台、教育大模型、优质数据与语料库建设。",C.green],["发展生态优化","加快标准制定、国际合作、安全伦理与治理机制建设。",C.orange]];
  overview.forEach(([title,body,color],i)=>card(slide,{left:64,top:190+i*78,width:365,height:67,color,tint:i%2?"#FAFCFF":"#F5F9FF",title,body,badgeNumber:i+1,titleSize:12.8,bodySize:9.2}));
  heading(slide,"职业教育核心政策内容",500,C.violet);
  card(slide,{left:64,top:530,width:365,height:124,color:C.violet,tint:"#FAF6FD",title:"深化专业智能化升级",body:"• 高技能人才集群培养计划\n• 产教融合 + 校企协同，建设真实AI应用场景\n• 促进职业教育、继续教育与终身学习衔接",badgeNumber:"职教",titleSize:14,bodySize:10.1});
  heading(slide,"职业教育领域核心机会",157,C.green,458,366);
  [["AI+专业体系重构","传统专业智能化升级 + AI新专业布局"],["高技能人才培养基地","围绕重点产业集群建设实训与培训基地"],["教育科技产品与服务","智能课程、学习平台、仿真实训、教学诊断"],["师资培训与认证","教师AI素养提升、应用能力评价与认证"],["标准与评价体系","参与专业标准、课程标准、评价标准建设"]].forEach(([title,body],i)=>card(slide,{left:458,top:190+i*86,width:366,height:72,color:C.green,tint:i%2?"#FAFEFC":"#F3FBF7",title,body,badgeNumber:i+1,titleSize:13.2,bodySize:9.4}));
  heading(slide,"关键政策信号",157,C.orange,844,330);
  [["“结构性影响”","不是微调，而是教育体系的系统性重构"],["“集群培养”","规模化、体系化推进，而非零散试点"],["“联合企业”","企业深度参与，不再由学校独立运作"],["“购买服务”","明确市场化采购路径，产品可规模化落地"],["“中国标准走出去”","形成国际合作与标准输出机会"]].forEach(([title,body],i)=>{rect(slide,{left:856,top:191+i*52,width:5,height:27},C.orange,C.orange);box(slide,title,{left:874,top:188+i*52,width:255,height:18},{fontSize:11.2,bold:true,color:C.orange});box(slide,body,{left:874,top:205+i*52,width:317,height:20},{fontSize:8.7,color:C.text});});
  const action=rect(slide,{left:844,top:466,width:373,height:188},"#F2FBF6",C.green,7); box(slide,"建议行动方向",{left:862,top:480,width:330,height:22},{fontSize:15,bold:true,color:C.green});
  [["短期（2026）","梳理重点专业与AI融合切入点；对接地方教育部门、试点项目；关注“购买服务”采购信息"],["中期（2027-2028）","参与AI+职教标准规范制定；共建产教融合实训基地；开发职教AI课程与实训平台"],["长期（2029-2030）","形成可复制的AI+职教解决方案；参与国际合作与中国标准输出"]].forEach(([time,body],i)=>{box(slide,time,{left:862,top:513+i*42,width:96,height:17},{fontSize:10.3,bold:true,color:C.green});box(slide,body,{left:963,top:510+i*42,width:224,height:32},{fontSize:8.2,color:C.text});});
  addNote(slide, "8");
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const deck = await PresentationFile.importPptx(await FileBlob.load(inputPptx));
  const screenshots = ["im/f2l4z21g", "im/gjixkbqp", "im/s7ix0vy5", "im/5sjqx0zu", "im/z6hgfmt4"];
  screenshots.forEach(id => deck.resolve(id).delete());
  rebuildSlide3(deck.slides.getItem(2)); rebuildSlide4(deck.slides.getItem(3)); rebuildSlide5(deck.slides.getItem(4)); rebuildSlide6(deck.slides.getItem(5)); rebuildSlide7(deck.slides.getItem(6));
  for (let i=2;i<=6;i++) { const slide=deck.slides.getItem(i); await writeBlob(`${outDir}/slide-${i+1}.png`, await deck.export({slide,format:"png",scale:1})); await fs.writeFile(`${outDir}/slide-${i+1}.layout.json`,await (await slide.export({format:"layout"})).text()); }
  const pptx=await PresentationFile.exportPptx(deck); await pptx.save(outputPptx);
}
await main();
