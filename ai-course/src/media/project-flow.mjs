import {defaultExplanation} from './defaults.mjs';
const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const phases=[['明确任务与获取信息',['阅读项目要求与任务说明','收集资料，明确问题与目标'],'问题清单与资料记录'],['制定工作计划',['拆解工作步骤与小组分工','确定时间、工具和交付要求'],'实施计划与分工表'],['方案决策',['比较备选方案与实施条件','确认技术路线和验收标准'],'方案与验收清单'],['实施与过程记录',['按计划完成操作与开发','记录过程、问题和调整措施'],'项目成果与过程记录'],['检查与质量控制',['依据验收标准逐项测试','定位问题并修改完善'],'测试结果与修改记录'],['评价反馈与迁移',['展示成果，说明实施过程','复盘方法并总结改进建议'],'成果报告与复盘记录']];
export function projectFlowSVG(project={}){
 const stages=(project.stages||[]).filter(s=>s.title&&!s.title.includes('请输入'));
 const steps=stages.length?stages.map((s,i)=>[s.title,s.tasks?.filter(t=>t.title&&!t.title.includes('请输入')).map(t=>t.title)||[],(/实施|开发|制作|操作|搭建|编程/.test(s.title)?'任务成果与过程记录':/检查|测试|质量|验收/.test(s.title)?'测试与验收记录':/评价|反思|反馈|迁移|展示|交付|成果/.test(s.title)?'成果报告与复盘记录':/方案|设计|决策/.test(s.title)?'方案与验收清单':/计划|分工/.test(s.title)?'实施计划与分工表':/信息|获取|明确|认知|需求/.test(s.title)?'问题清单与资料记录':'本阶段任务成果')]):phases;
 const rows=Math.ceil(steps.length/3),height=194+rows*194+154;
 const xy=i=>{const row=Math.floor(i/3),col=row%2?2-i%3:i%3;return [58+col*452,158+row*194];};
 const label=(text,x,y,size=15,color='#536276')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${escape(text)}</text>`;
 let elements='';
 steps.forEach(([title,tasks,output],i)=>{const [x,y]=xy(i);elements+=`<rect x="${x}" y="${y}" width="418" height="158" rx="9" fill="#fffdf9" stroke="#d9d8d1"/><rect x="${x+18}" y="${y+17}" width="34" height="28" rx="7" fill="#f5ead5"/>`+label(String(i+1).padStart(2,'0'),x+25,y+37,15,'#91682f')+label(title.length>18?title.slice(0,18)+'…':title,x+64,y+37,18,'#24384c');
 (tasks.length?tasks:['阅读本阶段任务说明，按要求完成操作']).slice(0,3).forEach((task,j)=>{elements+=label('• '+(task.length>23?task.slice(0,23)+'…':task),x+20,y+67+j*25,15);});
 elements+=`<path d="M${x+18} ${y+125}H${x+400}" stroke="#e4e1d9"/>`+label('输出：'+output,x+20,y+147,14,'#35776b');
 if(i<steps.length-1){const [nx,ny]=xy(i+1);const same=ny===y;const start=same?(nx>x?x+420:x-2):x+209,end=same?(nx>x?nx-10:nx+430):nx+209;elements+=same?`<path d="M${start} ${y+80}H${end}" class="arrow"/>`:`<path d="M${start} ${y+159}V${ny-10}" class="arrow"/>`;}
 });
 const last=xy(steps.length-1),gateY=158+rows*194+7;
 elements+=`<path d="M${last[0]+209} ${last[1]+159}V${gateY-28}H670V${gateY-9}" class="arrow"/><path d="M550 ${gateY+37}L670 ${gateY-3}L790 ${gateY+37}L670 ${gateY+77}Z" fill="#233d51" stroke="#c8aa74"/>`+label('验收是否通过？',601,gateY+43,16,'#fff6e5')+`<path d="M792 ${gateY+37}H927" class="arrow"/>`+label('通过',827,gateY+25,14,'#a9d9c6')+`<rect x="934" y="${gateY+10}" width="280" height="54" rx="27" fill="#2b635b" stroke="#7bb19d"/>`+label('提交成果 · 展示与复盘',973,gateY+43,16,'#effbf5')+`<path d="M670 ${gateY+77}V${gateY+102}H28V${last[1]+80}H${last[0]-9}" class="arrow retry"/>`+label('未通过 → 返修完善 → 重新检查',140,gateY+96,14,'#e6bc80');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 ${height}" width="1440" height="${height}"><defs><linearGradient id="slide-background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#15283f"/><stop offset="1" stop-color="#2b465c"/></linearGradient><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#c8aa74"/></marker></defs><style>text{font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;font-weight:400;font-synthesis:none}.slide-title{font-weight:600}.arrow{fill:none;stroke:#c8aa74;stroke-width:2;marker-end:url(#arr)}.retry{stroke-dasharray:6 5}</style><rect width="1440" height="${height}" rx="16" fill="url(#slide-background)"/><path d="M1050 0H1440V230Z" fill="#638d9a" opacity=".08"/><path d="M1220 0H1440V130Z" fill="#e6be80" opacity=".08"/><rect x="58" y="28" width="5" height="60" rx="2" fill="#e6be80"/><text class="slide-title" x="80" y="53" font-size="27" fill="#fff7e8">项目任务实施流程</text>${label(project.title||'项目学习',80,87,17,'#d4e3ec')}${label('按箭头完成各阶段任务，每一步保留过程记录与成果。',58,120,15,'#b6c9d8')}${elements}</svg>`;
}
export function resolveExplanation(value,project={}){
 const explanation=value||defaultExplanation;const assets={...explanation.assets};
 const prepared=(asset,type)=>asset&&!asset.storageKey&&(asset.origin==='prepared-instruction-media'||asset.name===(type==='image'?'智能制造项目流程.png':'智能制造项目讲解.mp4'));
 if(prepared(assets.image,'image')){const svg=projectFlowSVG(project);assets.image={...assets.image,origin:'prepared-instruction-media',revision:3,name:'项目任务实施流程.svg',url:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),size:new TextEncoder().encode(svg).length};}
 if(prepared(assets.video,'video'))assets.video=defaultExplanation.assets.video;
 return {...explanation,assets};
}
