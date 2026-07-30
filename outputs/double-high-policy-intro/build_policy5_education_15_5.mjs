import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const inputPptx = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/学堂在线智慧专业解决方案2604版_双高计划政策页_3至7页重绘版.pptx";
const outputPptx = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/学堂在线智慧专业解决方案2604版_政策5_十五五教育规划.pptx";
const outDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/policy5-preview";

const C = { navy: "#253E74", ink: "#23324A", text: "#526276", blue: "#2B7CC6", green: "#1FAD66", orange: "#F3A438", red: "#E95343", violet: "#8146B2", teal: "#1DAE8F", white: "#FFFFFF", pale: "#F7F9FC" };
async function writeBlob(path, blob) { await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer())); }
function textBox(slide, text, position, style = {}, name = "") {
  const s = slide.shapes.add({ geometry: "textbox", ...(name ? { name } : {}), position, fill: "none", line: { style: "solid", fill: "#FFFFFF/0", width: 0 } });
  s.text = text; s.text.style = { fontFace: "微软雅黑", fontSize: 14, color: C.ink, ...style }; return s;
}
function rect(slide, position, fill, line = fill, radius = 0, name = "") {
  return slide.shapes.add({ geometry: radius ? "roundRect" : "rect", ...(name ? { name } : {}), position, fill, line: { style: "solid", fill: line, width: line === "none" ? 0 : 1.2 }, ...(radius ? { borderRadius: radius } : {}) });
}
function badge(slide, left, top, n, color, size = 25) {
  const b = slide.shapes.add({ geometry: "ellipse", position: { left, top, width: size, height: size }, fill: color, line: { style: "solid", fill: color, width: 0 } });
  b.text = String(n); b.text.style = { fontFace: "微软雅黑", fontSize: 12, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };
}
function heading(slide, title, top, color = C.navy, left = 63, width = 780) { textBox(slide, title, { left, top, width, height: 25 }, { fontSize: 17.5, bold: true, color }, `heading-${title}`); }
function card(slide, { left, top, width, height, color, title, body, n, tint = C.white, titleSize = 13.5, bodySize = 9.8 }) {
  rect(slide, { left, top, width, height }, tint, color, 7);
  if (n !== undefined) badge(slide, left + 14, top + 12, n, color);
  const titleLeft = n === undefined ? left + 15 : left + 49;
  textBox(slide, title, { left: titleLeft, top: top + 13, width: width - (titleLeft - left) - 15, height: 22 }, { fontSize: titleSize, bold: true, color }, `title-${title}`);
  textBox(slide, body, { left: left + 16, top: top + 44, width: width - 32, height: Math.max(18, height - 55) }, { fontSize: bodySize, color: C.text }, `body-${title}`);
}
function signal(slide, left, top, color, title, body) {
  rect(slide, { left, top: top + 2, width: 5, height: 27 }, color, color);
  textBox(slide, title, { left: left + 17, top, width: 302, height: 18 }, { fontSize: 11.5, bold: true, color });
  textBox(slide, body, { left: left + 17, top: top + 17, width: 302, height: 24 }, { fontSize: 8.7, color: C.text });
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const deck = await PresentationFile.importPptx(await FileBlob.load(inputPptx));
  const slide = deck.resolve("sl/fu1gfa1s");
  deck.resolve("sh/xwvelwj2").text = "政策5:《教育发展“十五五”规划》（国务院）";
  deck.resolve("sh/xwvelwj2").text.style = { fontFace: "微软雅黑", fontSize: 24, bold: true, color: C.white, verticalAlignment: "middle" };

  textBox(slide, "教育发展“十五五”规划｜职业教育的新任务与新机会", { left: 63, top: 94, width: 1154, height: 32 }, { fontSize: 21, bold: true, color: C.navy, alignment: "center" }, "policy5-title");
  const banner = rect(slide, { left: 63, top: 132, width: 1154, height: 43 }, C.navy, C.navy, 5, "policy5-banner");
  banner.text = "教育强国建设进入关键阶段：到2030年高质量教育体系基本建成，职业教育承担高技能人才培养与现代产业体系支撑使命";
  banner.text.style = { fontFace: "微软雅黑", fontSize: 13, bold: true, color: C.white, alignment: "center", verticalAlignment: "middle" };

  heading(slide, "“新双高”引领职业教育体系升级", 193, C.red);
  card(slide, { left: 63, top: 224, width: 362, height: 103, color: C.red, tint: "#FFF4F2", title: "加快职业教育“新双高”建设", body: "以办学能力高水平、产教融合高质量为目标，加快建设现代职业教育体系。", n: 1, titleSize: 14.2, bodySize: 10.3 });
  card(slide, { left: 443, top: 224, width: 362, height: 103, color: C.blue, tint: "#F0F7FF", title: "贯通中职、高职与职业本科", body: "推进衔接培养，稳步增加职业本科学校数量、扩大招生规模，促进职业本科与专业学位教育融通。", n: 2, titleSize: 13.8, bodySize: 9.8 });
  card(slide, { left: 823, top: 224, width: 394, height: 103, color: C.green, tint: "#F1FBF5", title: "推动产业深度参与办学", body: "鼓励行业龙头企业举办或参与举办职业学校，强化企业参与人才培养与资源供给。", n: 3, titleSize: 13.8, bodySize: 9.8 });

  heading(slide, "职教改革四项政策抓手", 354, C.blue);
  const pillars = [
    ["职普融通", "办好综合高中与少而精中职，拓宽学生成长成才通道。", C.violet],
    ["专业动态适配", "健全人才供需对接大数据平台；加强高职专业协同联动。", C.blue],
    ["省域职教改革", "深化省域现代职业教育体系改革，打造产教融合新形态。", C.green],
    ["资源下沉与均衡", "推动有条件地区将高等职业教育资源下沉至市县。", C.orange],
  ];
  pillars.forEach(([title, body, color], i) => card(slide, { left: 63 + (i % 2) * 373, top: 385 + Math.floor(i / 2) * 87, width: 354, height: 71, color, tint: i % 2 ? "#FAFCFF" : C.white, title, body, n: i + 1, titleSize: 12.8, bodySize: 9.1 }));

  heading(slide, "数智化变革：从政策要求到建设场景", 354, C.green, 823, 394);
  const digital = rect(slide, { left: 823, top: 385, width: 394, height: 158 }, "#F1FBF5", C.green, 7);
  textBox(slide, "“人工智能+教育”行动", { left: 843, top: 399, width: 340, height: 20 }, { fontSize: 14, bold: true, color: C.green });
  textBox(slide, "推动教育理念、培养模式、考试考核、科研范式和治理机制深层次变革", { left: 843, top: 425, width: 340, height: 34 }, { fontSize: 10.2, color: C.text });
  [["智慧教育公共服务平台", "扩大优质教育资源受益面"], ["教育AI应用中试基地", "促进应用验证与开源创新"], ["数字教育标准与安全", "强化标准规范、伦理与安全监管"]].forEach(([title, body], i) => { badge(slide, 843, 470 + i * 24, i + 1, C.green, 17); textBox(slide, title, { left: 867, top: 469 + i * 24, width: 170, height: 17 }, { fontSize: 9.4, bold: true, color: C.ink }); textBox(slide, body, { left: 1038, top: 469 + i * 24, width: 154, height: 17 }, { fontSize: 8.4, color: C.text }); });

  const bottom = rect(slide, { left: 63, top: 568, width: 1154, height: 94 }, C.navy, C.navy, 7);
  textBox(slide, "面向职教推广的三类切入场景", { left: 84, top: 582, width: 290, height: 20 }, { fontSize: 14.5, bold: true, color: C.white });
  const opps = [["专业规划", "产业-专业匹配、人才供需分析、专业动态调整", C.red], ["产教融合", "校企协同育人、产业资源转化、实训基地建设", C.orange], ["AI+职教", "智能课程、学习与评价、治理数据底座", C.green]];
  opps.forEach(([title, body, color], i) => { const left = 402 + i * 258; rect(slide, { left, top: 581, width: 238, height: 66 }, C.white, C.white, 5); badge(slide, left + 13, 594, i + 1, color, 23); textBox(slide, title, { left: left + 46, top: 591, width: 170, height: 19 }, { fontSize: 12.5, bold: true, color }); textBox(slide, body, { left: left + 15, top: 617, width: 207, height: 20 }, { fontSize: 8.6, color: C.text, alignment: "center" }); });

  slide.speakerNotes.textFrame.setText("[Sources]\n- 用户提供：国务院关于印发《教育发展“十五五”规划》的通知（国发〔2026〕19号）-中国政府网公开版.pdf，第1、4、7、11-12页。\n- 模板：学堂在线智慧专业解决方案2604版.pptx。\n[/Sources]");
  slide.speakerNotes.setVisible(true);
  await writeBlob(`${outDir}/slide-08.png`, await deck.export({ slide, format: "png", scale: 1 }));
  await fs.writeFile(`${outDir}/slide-08.layout.json`, await (await slide.export({ format: "layout" })).text());
  const pptx = await PresentationFile.exportPptx(deck); await pptx.save(outputPptx);
}
await main();
