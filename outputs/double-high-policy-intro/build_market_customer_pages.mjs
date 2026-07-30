import fs from "node:fs/promises";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const inputPptx = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/学堂在线智慧专业解决方案2604版_政策5_十五五教育规划.pptx";
const outputPptx = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/学堂在线智慧专业解决方案2604版_看市场看客户页.pptx";
const outDir = "/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程/outputs/double-high-policy-intro/market-customer-preview";
const C = { navy:"#253E74", ink:"#23324A", text:"#526276", blue:"#2B7CC6", green:"#1FAD66", orange:"#F3A438", red:"#E95343", violet:"#8146B2", teal:"#1DAE8F", white:"#FFFFFF", pale:"#F7F9FC", lightBlue:"#F0F7FF", lightOrange:"#FFF8EF", lightGreen:"#F1FBF5", lightRed:"#FFF4F2" };
async function writeBlob(path, blob) { await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer())); }
function t(slide,text,position,style={},name="") { const s=slide.shapes.add({geometry:"textbox",...(name?{name}:{}),position,fill:"none",line:{style:"solid",fill:"#FFFFFF/0",width:0}});s.text=text;s.text.style={fontFace:"微软雅黑",fontSize:14,color:C.ink,...style};return s; }
function r(slide,position,fill,line=fill,radius=0,name="") { return slide.shapes.add({geometry:radius?"roundRect":"rect",...(name?{name}:{}),position,fill,line:{style:"solid",fill:line,width:line==="none"?0:1.2},...(radius?{borderRadius:radius}:{})}); }
function badge(slide,left,top,n,color,size=25) { const b=slide.shapes.add({geometry:"ellipse",position:{left,top,width:size,height:size},fill:color,line:{style:"solid",fill:color,width:0}}); b.text=String(n);b.text.style={fontFace:"微软雅黑",fontSize:size*0.48,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"}; }
function h(slide,text,top,color=C.navy,left=63,width=780) { t(slide,text,{left,top,width,height:24},{fontSize:17,bold:true,color},`h-${text}`); }
function card(slide,{left,top,width,height,color,title,body,n,tint=C.white,titleSize=13,bodySize=9.5}) { r(slide,{left,top,width,height},tint,color,7);if(n!==undefined)badge(slide,left+14,top+12,n,color);const tl=n===undefined?left+15:left+49;t(slide,title,{left:tl,top:top+13,width:width-(tl-left)-15,height:21},{fontSize:titleSize,bold:true,color},`title-${title}`);t(slide,body,{left:left+16,top:top+43,width:width-32,height:Math.max(17,height-53)},{fontSize:bodySize,color:C.text},`body-${title}`); }
function note(slide,pages) { slide.speakerNotes.textFrame.setText(`[Sources]\n- 用户提供：讯飞AI职教平台V3.0 Charter立项-教育BG -V20260413_IPD修改稿.pdf，第 ${pages} 页。\n- 模板：学堂在线智慧专业解决方案2604版.pptx。\n[/Sources]`);slide.speakerNotes.setVisible(true); }
function setTitle(deck,id,text) { const s=deck.resolve(id);s.text=text;s.text.style={fontFace:"微软雅黑",fontSize:24,bold:true,color:C.white,verticalAlignment:"middle"}; }

function marketSize(slide) {
  h(slide,"第二期“双高”市场：政策资金与可参与空间",94,C.navy,63,740);
  t(slide,"2025-2029年｜围绕专业群、课程与数字化教学，把握存量建设与增量升级",{left:63,top:122,width:1138,height:20},{fontSize:11.5,color:C.text,alignment:"center"});
  [["220所","建设单位总数","60所高水平学校 + 160个专业群",C.blue],["280个","专业群总数","高水平学校每校建设2个专业群",C.green],["28亿元/年","中央财政投入","每专业群1000万元/年",C.orange],["≈420亿元","五年总投资估算","含地方、学校、企业与社会投入",C.red]].forEach(([v,l,d,color],i)=>{const left=63+i*289; r(slide,{left,top:155,width:270,height:105},C.white,"#E1E7F0",10);r(slide,{left:left+15,top:172,width:5,height:38},color,color);t(slide,v,{left:left+31,top:166,width:220,height:30},{fontSize:23,bold:true,color});t(slide,l,{left:left+31,top:201,width:220,height:18},{fontSize:11,bold:true,color:C.ink});t(slide,d,{left:left+31,top:222,width:220,height:26},{fontSize:8.5,color:C.text});});
  h(slide,"资金构成估算（五年周期）",282,C.navy,63,540);
  r(slide,{left:63,top:311,width:555,height:230},C.pale,"#E1E7F0",8);
  const funds=[["中央财政奖补","≈140亿元（35%）",C.blue,0.93],["地方财政配套","≈140亿元（33%）",C.green,0.91],["学校自筹资金","≈80亿元（19%）",C.orange,0.57],["企业/社会投入","≈60亿元（13%）",C.red,0.43]];
  funds.forEach(([label,value,color,rate],i)=>{const top=334+i*42;t(slide,label,{left:84,top,width:120,height:18},{fontSize:11,bold:true,color:C.ink});r(slide,{left:208,top:top+4,width:250,height:17},"#E7EDF4","#E7EDF4",3);r(slide,{left:208,top:top+4,width:250*rate,height:17},color,color,3);t(slide,value,{left:470,top,width:128,height:18},{fontSize:10,bold:true,color});});
  t(slide,"合计约420亿元（年均84亿元）｜较第一期增长约40%+",{left:84,top:506,width:500,height:20},{fontSize:11,bold:true,color:C.navy});
  h(slide,"第一期 → 第二期：建设变化",282,C.navy,647,540);
  card(slide,{left:647,top:311,width:570,height:108,color:C.blue,tint:C.lightBlue,title:"规模扩大、标准更清、任务更聚焦",body:"• 建设单位：197所 → 220所（+11.7%），覆盖全部31省份+兵团\n• 资金标准：每专业群每年1000万元，按一期明确目标统一标准\n• 分类方式：新增49所职业本科院校，60所高水平学校与160个专业群并举\n• 考核机制：强化绩效导向，建立动态管理和退出机制",n:"变",titleSize:14,bodySize:9.3});
  h(slide,"细分市场机会（可参与约20%）",439,C.red,647,540);
  [["实训基地建设","智能制造、数字化实训设备采购","预估120亿元",C.blue],["信息化与数字化","管理校园、教学平台、数据中台建设","预估60亿元",C.red],["课程与教材","新形态教材、在线精品课程、教师能力","预估30亿元",C.orange],["产教培训服务","双师型教师培养、企业实践、国际交流","预估25亿元",C.violet]].forEach(([title,body,val,color],i)=>{const top=470+i*20;badge(slide,663,top,i+1,color,15);t(slide,title,{left:684,top:top-1,width:110,height:16},{fontSize:9.4,bold:true,color});t(slide,body,{left:798,top:top-1,width:230,height:16},{fontSize:8.5,color:C.text});t(slide,val,{left:1035,top:top-1,width:160,height:16},{fontSize:8.8,bold:true,color,alignment:"right"});});
  note(slide,"8");
}

function caseAnalysis(slide) {
  h(slide,"国双高、省双高案例：预算结构与可服务空间",94,C.navy,63,800);
  card(slide,{left:63,top:132,width:548,height:166,color:C.blue,tint:C.lightBlue,title:"国双高案例｜天津海运职业学院 海洋工程装备技术专业群",body:"五年总预算 1.65亿元\n资金来源：中央财政30.30%｜地方财政30.30%｜举办方0%｜行业企业9.09%｜学校自筹30.30%\n可服务内容：专业群、核心课程、新形态教材、数字化教学、职教出海 = 28.34%\n目标内容：专业群 + 核心课程 + 数字化教学 = 20.76%",n:"国",titleSize:13.5,bodySize:9.6});
  card(slide,{left:669,top:132,width:548,height:166,color:C.green,tint:C.lightGreen,title:"省双高案例｜杭州职业技术学院 电梯工程技术专业群",body:"五年总预算 1.10亿元\n资金来源：省财政18.18%｜地方财政18.18%｜举办方0%｜行业企业31.82%｜学校自筹31.82%\n可服务内容：专业群、核心课程、新形态教材、数字化教学、职教出海 = 45.09%\n目标内容：专业群 + 核心课程 + 数字化教学 = 32.27%",n:"省",titleSize:13.5,bodySize:9.6});
  h(slide,"预算来源对比",327,C.navy,63,540); h(slide,"可服务内容与产品聚焦",327,C.navy,669,548);
  const sourceNames=["中央/省财政","地方财政","举办方","行业企业","学校自筹"];
  const national=[30.3,30.3,0,9.09,30.3], provincial=[18.18,18.18,0,31.82,31.82];
  sourceNames.forEach((name,i)=>{const top=364+i*29;t(slide,name,{left:80,top,width:98,height:17},{fontSize:10,bold:true,color:C.ink});r(slide,{left:180,top:top+2,width:174,height:13},"#E7EDF4","#E7EDF4",3);r(slide,{left:180,top:top+2,width:174*national[i]/35,height:13},C.blue,C.blue,3);t(slide,`${national[i]}%`,{left:360,top,width:56,height:17},{fontSize:9,bold:true,color:C.blue});r(slide,{left:432,top:top+2,width:174,height:13},"#E7EDF4","#E7EDF4",3);r(slide,{left:432,top:top+2,width:174*provincial[i]/35,height:13},C.green,C.green,3);t(slide,`${provincial[i]}%`,{left:612,top,width:50,height:17},{fontSize:9,bold:true,color:C.green});});
  t(slide,"蓝色：国双高案例｜绿色：省双高案例",{left:80,top:520,width:500,height:18},{fontSize:9.5,color:C.text});
  [["专业群建设","专业调研、产业匹配、人才培养方案",C.red],["核心课程","任务式课程、在线精品课程、课程资源",C.orange],["数字化教学","智能教学平台、知识库、智能体应用",C.green],["服务延展","新形态教材、双师培养、职教出海",C.violet]].forEach(([title,body,color],i)=>card(slide,{left:669+(i%2)*275,top:365+Math.floor(i/2)*83,width:253,height:67,color,tint:C.white,title,body,n:i+1,titleSize:11.7,bodySize:8.5}));
  const bottom=r(slide,{left:63,top:564,width:1154,height:72},C.navy,C.navy,6);bottom.text="案例启示：国双高资金规模大、财政投入占比高；省双高企业与学校自筹占比较高，适合以专业群建设、核心课程与数字化教学形成组合式方案。";bottom.text.style={fontFace:"微软雅黑",fontSize:13,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};
  note(slide,"8-9");
}

function reachableMarket(slide) {
  h(slide,"目标可达市场｜从100亿总盘面到4.82亿年度SOM",94,C.navy,63,870);
  const premise=r(slide,{left:63,top:128,width:1154,height:48},C.lightOrange,"#F4DEC1",6);premise.text="💡 聚焦“专业建设 + 课程建设 + 数字化教学”，保守按市场份额20%测算；国双高重点校触达90%，省双高重点校触达30%，目标市场份额30%。";premise.text.style={fontFace:"微软雅黑",fontSize:12,bold:true,color:C.ink,alignment:"center",verticalAlignment:"middle"};
  const stages=[["总盘面","100亿元/年","国双高84亿 + 省双高16亿",C.navy],["可参与空间 TAM","20亿元/年","聚焦专业、课程、教学（20%）",C.orange],["可服务空间 SAM","16.08亿元/年","国双高触达90% + 省双高触达30%",C.blue],["可达市场 SOM","4.82亿元/年","考虑竞争，目标获取30%",C.green]];
  stages.forEach(([name,value,sub,color],i)=>{const left=63+i*294;r(slide,{left,top:203,width:270,height:98},C.white,color,8);t(slide,name,{left:left+16,top:218,width:238,height:18},{fontSize:12,bold:true,color});t(slide,value,{left:left+16,top:240,width:238,height:28},{fontSize:21,bold:true,color:C.ink});t(slide,sub,{left:left+16,top:271,width:238,height:17},{fontSize:8.7,color:C.text,alignment:"center"});if(i<3){const a=slide.shapes.add({geometry:"rightArrow",position:{left:left+271,top:238,width:18,height:24},fill:color,line:{style:"solid",fill:color,width:0}});}});
  h(slide,"测算逻辑：国双高与省双高分层推进",331,C.navy,63,580);
  const values=[["市场", "总盘面", "TAM（20%）", "SAM（触达）", "SOM（30%）", "关键假设"],["国双高", "84亿/年", "16.8亿/年", "15.12亿/年", "4.53亿/年", "重点校触达 202/220 ≈ 90%"],["省双高", "16亿/年", "3.2亿/年", "0.96亿/年", "0.29亿/年", "学校较多，重点校触达按 30%"],["汇总", "100亿/年", "20亿/年", "16.08亿/年", "4.82亿/年", "目标市场份额：30%"]];
  const table=slide.tables.add({rows:4,columns:6,left:63,top:365,width:790,height:190,columnWidths:[105,115,130,145,130,165],values});table.borders.assign({style:"solid",fill:"#D9E1EC",width:0.7});for(let row=0;row<4;row++){table.rows[row].height=row===0?32:52.7;for(let col=0;col<6;col++){const cell=table.getCell(row,col);cell.fill=row===0?C.navy:(row===3?"#F1FBF5":row%2?C.white:C.pale);cell.text.style={fontFace:"微软雅黑",fontSize:row===0?10.2:(col===5?8.8:10.2),bold:row===0||row===3||col===0,color:row===0?C.white:(row===3?C.green:C.ink),alignment:col<5?"center":"left",verticalAlignment:"middle"};}}
  h(slide,"当前商机进展",331,C.red,885,320);
  [["已触达","国双高207/220（94%）｜省双高131所",C.blue],["已储备","84所院校｜2.4亿元商机｜58个项目",C.orange],["纳入预测","专业、课程、教学｜预测商机7600万元",C.green]].forEach(([title,body,color],i)=>card(slide,{left:885,top:365+i*66,width:332,height:55,color,tint:i%2?C.white:"#FAFCFF",title,body,n:i+1,titleSize:11.5,bodySize:8.2}));
  const bottom=r(slide,{left:63,top:584,width:1154,height:56},C.navy,C.navy,6);bottom.text="策略重点：先以国双高标杆形成高触达与高转化，再通过省双高重点校复制，实现“国双高拉动、省双高扩面”的市场路径。";bottom.text.style={fontFace:"微软雅黑",fontSize:12.5,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};
  note(slide,"9-10");
}

function targetCustomers(slide) {
  h(slide,"目标客户画像｜国双高主攻、省双高精选",94,C.navy,63,800);
  const top=r(slide,{left:63,top:130,width:1154,height:86},C.lightOrange,"#F4DEC1",7);t(slide,"💡 目标客户：核心主打国双高校（9大任务、需求基本一致、有资金），拓展选择有资金的省双高校",{left:84,top:144,width:1110,height:20},{fontSize:12.5,bold:true,color:C.ink});t(slide,"先发策略：以人工智能、智能制造专业群为切入点；优先承接清华课题牵引下33所课题校的客户商机。220所国双高里，相关专业群院校约60-80所，是优先市场。",{left:84,top:174,width:1110,height:30},{fontSize:10.2,color:C.text});
  h(slide,"客户分层与优先级",238,C.navy,63,690);h(slide,"进入抓手与产品价值",238,C.green,795,422);
  const tiers=[["清华课题国双高校","课题强牵引｜有政策｜有资金（大）｜有验收要求","33所目标学校；专业图谱、知识库、智能体建设与展示要求","核心客户｜重点主推｜优先进入",C.red],["国双高","有政策｜有资金（大）｜有验收要求","对接区域产业链数据；专业调研与动态人培；项目任务式教学；数字化转型","核心客户｜重点主推",C.blue],["省双高","有政策｜有资金（小）｜有验收要求","匹配省双高建设要求，聚焦资金大、产业特色鲜明的学校","重要客户｜选择资金大的",C.green]];
  tiers.forEach(([title,traits,needs,level,color],i)=>{const top=273+i*104;card(slide,{left:63,top,width:690,height:92,color,tint:i===0?C.lightRed:(i===1?C.lightBlue:C.lightGreen),title,body:traits,n:i+1,titleSize:13.5,bodySize:9.5});t(slide,needs,{left:125,top:top+57,width:420,height:25},{fontSize:8.7,color:C.text});const pill=r(slide,{left:554,top:top+52,width:174,height:23},color,color,4);pill.text=level;pill.text.style={fontFace:"微软雅黑",fontSize:8.4,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};});
  [["AI+智能制造专业群","讯飞AI+产业生态与岗位数据，形成产业数据、岗位理解与专业建设的差异化背书",C.red],["区域产业链调研","产业-企业-岗位数据调研，支撑专业动态调整与人才培养方案迭代",C.blue],["任务式教学与课程","将典型工作任务转化为学习型任务，构建项目任务式教学与课程资源",C.orange],["数字化转型组合方案","专业群建设 + 核心课程 + 数字化教学，形成可验收、可复制的整体交付",C.green]].forEach(([title,body,color],i)=>card(slide,{left:795,top:273+i*85,width:422,height:72,color,tint:C.white,title,body,n:i+1,titleSize:12.3,bodySize:9.2}));
  h(slide,"代表学校示例",600,C.violet,63,690);const sample=r(slide,{left:63,top:628,width:690,height:35},"#FAF6FD",C.violet,5);sample.text="清华课题校：芜湖职业技术大学、长沙职业技术学院、武汉软件工程职业学院、广东机电职业技术学院等｜国双高：北京电子科技职业学院、深圳职业技术大学、云南机电职业技术学院等";sample.text.style={fontFace:"微软雅黑",fontSize:8.7,color:C.text,alignment:"center",verticalAlignment:"middle"};
  const result=r(slide,{left:795,top:620,width:422,height:43},C.navy,C.navy,5);result.text="客户覆盖路径：课题校快速验证 → 国双高打造标杆 → 省双高重点校复制扩面";result.text.style={fontFace:"微软雅黑",fontSize:11.5,bold:true,color:C.white,alignment:"center",verticalAlignment:"middle"};
  note(slide,"11");
}

async function main(){
  await fs.mkdir(outDir,{recursive:true});const deck=await PresentationFile.importPptx(await FileBlob.load(inputPptx));
  ["im/gzu183ep","im/c7apobep","im/zal8z6xg","im/sbq50va5","im/0bqd8fel"].forEach(id=>deck.resolve(id).delete());
  setTitle(deck,"sh/pkbep4fe","双高计划第二期（2025-2029）市场规模分析");setTitle(deck,"sh/x4vqhknm","案例分析");setTitle(deck,"sh/lkzmhwvm","目标可达市场");setTitle(deck,"sh/9gji5oru","目标客户分析");
  marketSize(deck.resolve("sl/m90b6t0r"));caseAnalysis(deck.resolve("sl/jetc3ut0"));reachableMarket(deck.resolve("sl/8f2psfyx"));targetCustomers(deck.resolve("sl/6lsnupw7"));
  for(const n of [10,11,12,14]){const s=deck.slides.getItem(n-1);await writeBlob(`${outDir}/slide-${n}.png`,await deck.export({slide:s,format:"png",scale:1}));await fs.writeFile(`${outDir}/slide-${n}.layout.json`,await (await s.export({format:"layout"})).text());}
  const pptx=await PresentationFile.exportPptx(deck);await pptx.save(outputPptx);
}
await main();
