/** Shared rich chapter rendering. Stored HTML is sanitized whenever it is consumed. */
;(function(root){
 const M=root.TalentPlanModel,e=M.esc
 const tags=['p','div','br','span','strong','b','em','i','u','s','strike','h2','h3','h4','ul','ol','li','blockquote','table','caption','thead','tbody','tfoot','tr','th','td','img','font','a','sub','sup']
 const imageSource=value=>/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value||'')
 const sanitize=html=>{
  if(!root.DOMPurify?.sanitize || typeof document==='undefined')return e(html)
  const clean=root.DOMPurify.sanitize(String(html||''),{ALLOWED_TAGS:tags,ALLOWED_ATTR:['style','src','alt','width','height','colspan','rowspan','size','color','href'],ALLOW_DATA_ATTR:false})
  const template=document.createElement('template');template.innerHTML=clean
  for(const el of template.content.querySelectorAll('*')){
   const style=el.style,parts=[]
   for(const key of ['font-size','font-weight','font-style','text-decoration','text-align','color','background-color']){
    const value=style.getPropertyValue(key)
    if(!value)continue
    const valid=key==='font-size'?/^(?:[89]|[1-6]\d|7[0-2])(?:px|pt)$/.test(value):key==='text-align'?/^(left|right|center|justify)$/.test(value):key==='font-weight'?/^(normal|bold|[1-9]00)$/.test(value):key==='font-style'?/^(normal|italic)$/.test(value):key==='text-decoration'?/^(none|underline|line-through)( (underline|line-through))?$/.test(value):/^(#[\da-f]{3,8}|[a-z]{1,20}|rgba?\([\d.,%\s]+\))$/i.test(value)
    if(valid)parts.push(key+':'+value)
   }
   if(parts.length)el.setAttribute('style',parts.join(';'));else el.removeAttribute('style')
   if(el.tagName==='IMG'){
    if(!imageSource(el.getAttribute('src')))el.remove()
    else {el.setAttribute('alt',el.getAttribute('alt')||'课程相关图片');for(const key of ['width','height'])if(!/^\d{1,4}$/.test(el.getAttribute(key)||''))el.removeAttribute(key)}
   }
   if(el.tagName==='A' && !/^https?:\/\//i.test(el.getAttribute('href')||''))el.removeAttribute('href')
   for(const key of ['colspan','rowspan'])if(el.hasAttribute(key)&&!/^([1-9]|[1-9]\d)$/.test(el.getAttribute(key)))el.removeAttribute(key)
  }
  return template.innerHTML
 }
 const plain=html=>{
  const input=String(html||'').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|div|h[1-6]|li|tr|blockquote)>/gi,'\n').replace(/<\/(?:td|th)>/gi,'\t')
  if(typeof DOMParser!=='undefined')return new DOMParser().parseFromString(input,'text/html').body.textContent.replace(/\n{3,}/g,'\n\n').trim()
  return input.replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim()
 }
 const paragraphs=text=>String(text||'').split(/\n\n+/).map(t=>`<p>${e(t).replace(/\n/g,'<br>')}</p>`).join('')
 const courseTable=d=>{
  const courses=M.selectedCourses(d)
  return `<table><thead><tr>${['序号','课程代码','课程名称','课程类型','学分','开课学期','开课单位'].map(t=>`<th scope="col">${t}</th>`).join('')}</tr></thead><tbody>${courses.map((c,i)=>`<tr><td>${i+1}</td><td>${e(c.code)}</td><td>${e(c.name)}</td><td>${e(c.type)}</td><td>${e(c.credits)}</td><td>${e(c.semester)}</td><td>${e(c.college)}</td></tr>`).join('')||'<tr><td colspan="7">暂无课程</td></tr>'}</tbody><tfoot><tr><th colspan="4">本次修订课程学分小计</th><td>${M.metrics(d).credits}</td><td colspan="2">${courses.length} 门课程</td></tr></tfoot></table>`
 }
 const chapter=(d,id)=>{
  if(typeof d.chapterHtml?.[id]==='string')return sanitize(d.chapterHtml[id])
  if(id!=='courses')return paragraphs(d.chapters?.[id]||'本章内容待补充')
  const codes=M.courseCatalog(d).map(c=>c.code)
  const notes=(d.chapters?.courses||'').split('\n').filter(line=>!codes.some(code=>line.trim().startsWith(code))&&!/^(原方案课程内容[：:]|本次纳入修订的教务课程[（(])/.test(line.trim())).join('\n').trim()
  return courseTable(d)+paragraphs(notes)
 }
 const setChapter=(d,id,html)=>{
  const clean=sanitize(html);d.chapterHtml={...(d.chapterHtml||{}),[id]:clean};d.chapters[id]=plain(clean)
  return clean
 }
 const toolbarIcons={
  insertUnorderedList:'<circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/><path d="M9 6h12M9 12h12M9 18h12"/>',
  insertOrderedList:'<path d="M3 3h1v6M3 9h3M3 13h2l1 1v1l-3 4h3M10 6h11M10 12h11M10 18h11"/>',
  justifyLeft:'<path d="M3 5h18M3 10h12M3 15h18M3 20h12"/>',
  justifyCenter:'<path d="M3 5h18M6 10h12M3 15h18M6 20h12"/>',
  justifyRight:'<path d="M3 5h18M9 10h12M3 15h18M9 20h12"/>',
  removeFormat:'<path d="M5 4h14M12 4l-3 12M4 20h9M15 14l6 6M21 14l-6 6"/>',
  table:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>'
 }
 const toolbarIcon=name=>`<svg class="tp-rich-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${toolbarIcons[name]}</svg>`
 const toolbar=()=>`<div class="tp-rich-toolbar" role="toolbar" aria-label="正文格式工具栏"><label>字号<select data-rich-size aria-label="字号">${[12,14,16,18,20,24,28,32].map(n=>`<option value="${n}" ${n===14?'selected':''}>${n}</option>`).join('')}</select></label>${[['bold','加粗','B'],['italic','斜体','I'],['underline','下划线','U'],['strikeThrough','删除线','S'],['insertUnorderedList','无序列表','• 列表'],['insertOrderedList','有序列表','1. 列表'],['justifyLeft','左对齐','左对齐'],['justifyCenter','居中','居中'],['justifyRight','右对齐','右对齐'],['removeFormat','清除格式','清除格式']].map(([command,label,text])=>`<button type="button" data-tp="rich-format" data-command="${command}" aria-label="${label}" title="${label}">${toolbarIcons[command]?toolbarIcon(command):text}</button>`).join('')}<button type="button" data-tp="rich-table" aria-label="插入表格" title="插入表格">${toolbarIcon('table')}</button><button type="button" data-tp="rich-image" aria-label="插入图片" title="插入图片">${toolbarIcon('image')}</button><input type="file" data-rich-image accept="image/png,image/jpeg,image/gif,image/webp" aria-label="选择正文图片" hidden></div>`
 const tableDialog=()=>`<div class="tp-overlay" data-rich-table-overlay><section class="tp-dialog tp-insert-table" role="dialog" aria-modal="true" aria-labelledby="tp-table-title" tabindex="-1"><header><h2 id="tp-table-title">插入表格</h2><button type="button" class="tp-btn icon" data-tp="close-rich-table" aria-label="关闭插入表格">×</button></header><div class="tp-course-form"><label class="tp-field"><span>行数（含表头）</span><input type="number" data-table-rows min="1" max="30" value="3" aria-label="表格行数"></label><label class="tp-field"><span>列数</span><input type="number" data-table-cols min="1" max="12" value="3" aria-label="表格列数"></label></div><p role="alert" data-table-error></p><footer><span></span><div><button type="button" class="tp-btn" data-tp="close-rich-table">取消</button><button type="button" class="tp-btn primary" data-tp="insert-rich-table">插入</button></div></footer></section></div>`
 const blankTable=(rows,cols)=>'<table><tbody>'+Array.from({length:rows},(_,i)=>'<tr>'+Array.from({length:cols},()=>i===0?'<th>表头</th>':'<td><br></td>').join('')+'</tr>').join('')+'</tbody></table><p><br></p>'
 root.TalentPlanRichText={sanitize,plain,paragraphs,chapter,setChapter,courseTable,toolbar,tableDialog,blankTable,imageSource}
})(globalThis)
