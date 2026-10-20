/** Local-only file readers and real Word document export. */
;(function(root){
 const scriptUrl=typeof document==='undefined'?'':document.currentScript?.src || ''
 const base=typeof document==='undefined'?'':location.protocol==='file:'&&scriptUrl?new URL('../../vendor/talent-plan/',scriptUrl).href:new URL('./document-readers/',document.baseURI).href
 const loads=new Map()
 const loadScript=(name,globalName)=>{
  if(root[globalName])return Promise.resolve(root[globalName])
  if(!loads.has(name))loads.set(name,new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=base+name
   script.onload=()=>{if(root[globalName])resolve(root[globalName]);else{loads.delete(name);script.remove();reject(new Error('文档处理组件未就绪，请刷新后重试'))}}
   script.onerror=()=>{loads.delete(name);script.remove();reject(new Error('本地文档处理组件加载失败，请重新打开页面后重试'))}
   document.head.append(script)
  }))
  return loads.get(name)
 }
 const readDocx=async buffer=>{
  const Zip=await loadScript('jszip.min.js','JSZip')
  const zip=await Zip.loadAsync(buffer), file=zip.file('word/document.xml')
  if(!file)throw new Error('不是有效的 Word 文档，请另存为 DOCX 后重试')
  if(file._data?.uncompressedSize>20*1024*1024)throw new Error('文档正文过大，请拆分后导入')
  const xml=await file.async('string'),doc=new DOMParser().parseFromString(xml,'application/xml')
  if(doc.querySelector('parsererror'))throw new Error('Word 正文损坏，无法读取')
  return [...doc.getElementsByTagNameNS('*','p')].map(p=>[...p.getElementsByTagNameNS('*','t')].map(t=>t.textContent).join('')).join('\n')
 }
 const readPdf=async(buffer,onProgress)=>{
  const pdf=await loadScript('pdf-reader.js','TalentPlanPDF')
  const task=pdf.getDocument({data:new Uint8Array(buffer),useWorkerFetch:false,isEvalSupported:false,disableFontFace:true,useSystemFonts:true})
  let doc
  try {
   doc=await task.promise
   if(doc.numPages>180)throw new Error('文件超过 180 页，请按专业拆分后导入')
   const pages=[]
   for(let i=1;i<=doc.numPages;i++){
    const page=await doc.getPage(i),content=await page.getTextContent()
    let previousY=null,text=''
    for(const item of content.items){
     if(!('str' in item))continue
     const y=item.transform?.[5]
     if(previousY!==null && y!==undefined && Math.abs(previousY-y)>3)text+='\n'
     text+=item.str+(item.hasEOL?'\n':' ');previousY=y
    }
    pages.push(text);onProgress?.(`正在读取第 ${i} / ${doc.numPages} 页`);page.cleanup()
   }
   return pages.join('\n\n')
  } finally {if(doc)await doc.destroy();else await task.destroy()}
 }
 const read=async(file,onProgress)=>{
  const err=root.TalentPlanModel.validateFile(file);if(err)throw new Error(err)
  let text=''
  try{
   const buffer=await file.arrayBuffer()
   if(/\.docx$/i.test(file.name))text=await readDocx(buffer)
   else if(/\.pdf$/i.test(file.name))text=await readPdf(buffer,onProgress)
   else text=new TextDecoder('utf-8',{fatal:true}).decode(buffer)
  }catch(e){throw new Error(/password/i.test(e.message)?'文件已加密，请解密后重试':e.message||'文件无法读取，请检查格式与正文')}
  if(text.replace(/\s/g,'').length<15)throw new Error('未读取到足够正文。扫描版 PDF 请先识别文字，再上传可检索 PDF 或 DOCX')
  return {...root.TalentPlanModel.parseText(text),fileName:file.name,bytes:file.size,parsedAt:new Date().toISOString()}
 }
 const download=(blob,name)=>{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
 const exportDocx=async d=>{
  const Zip=await loadScript('jszip.min.js','JSZip'),zip=new Zip(),M=root.TalentPlanModel
  const x=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))
  const p=(text,bold=false)=>`<w:p><w:pPr><w:spacing w:after="160"/></w:pPr><w:r>${bold?'<w:rPr><w:b/><w:sz w:val="28"/></w:rPr>':''}<w:t xml:space="preserve">${x(text)}</w:t></w:r></w:p>`
  const imageTypes=new Set(),relationships=[],media=[]
  let drawingId=0
  const richXml=html=>{
   const doc=new DOMParser().parseFromString(root.TalentPlanRichText.sanitize(html),'text/html')
   const run=(node,format={})=>{
    if(node.nodeType===3){const properties=(format.bold?'<w:b/>':'')+(format.italic?'<w:i/>':'')+(format.underline?'<w:u w:val="single"/>':'')+(format.strike?'<w:strike/>':'')+(format.size?`<w:sz w:val="${format.size}"/>`:'')+(format.color?`<w:color w:val="${format.color}"/>`:'');return `<w:r><w:rPr>${properties}</w:rPr><w:t xml:space="preserve">${x(node.textContent)}</w:t></w:r>`}
    if(node.nodeType!==1)return ''
    const tag=node.tagName,style=node.style,next={...format}
    if(['B','STRONG','TH'].includes(tag)||style.fontWeight==='bold'||Number(style.fontWeight)>=600)next.bold=true
    if(['I','EM'].includes(tag)||style.fontStyle==='italic')next.italic=true
    if(tag==='U'||style.textDecoration.includes('underline'))next.underline=true
    if(['S','STRIKE'].includes(tag)||style.textDecoration.includes('line-through'))next.strike=true
    if(style.fontSize)next.size=Math.round(parseFloat(style.fontSize)*(style.fontSize.endsWith('px')?1.5:2))
    if(tag==='FONT'&&node.getAttribute('size'))next.size=[0,16,20,24,28,36,48,72][Number(node.getAttribute('size'))]||28
    if(/^#[a-f0-9]{6}$/i.test(style.color))next.color=style.color.slice(1)
    if(tag==='BR')return '<w:r><w:br/></w:r>'
    if(tag==='IMG'){
     const match=node.getAttribute('src')?.match(/^data:image\/(png|jpeg|gif|webp);base64,([\s\S]+)$/i);if(!match)return ''
     const id=++drawingId,ext=match[1].toLowerCase()==='jpeg'?'jpg':match[1].toLowerCase(),file=`image${id}.${ext}`,rel=`image${id}`
     imageTypes.add(ext);media.push({file,base64:match[2]});relationships.push(`<Relationship Id="${rel}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${file}"/>`)
     const width=Math.min(560,Number(node.getAttribute('width'))||480),height=Number(node.getAttribute('height'))||280,cx=Math.round(width*9525),cy=Math.round(height*9525)
     return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${x(node.getAttribute('alt')||file)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${file}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rel}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
    }
    return [...node.childNodes].map(n=>run(n,next)).join('')
   }
   const paragraph=(node,num=null)=>`<w:p><w:pPr><w:spacing w:after="160"/>${node.style?.textAlign?`<w:jc w:val="${node.style.textAlign==='justify'?'both':node.style.textAlign}"/>`:''}${num?`<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${num}"/></w:numPr>`:''}</w:pPr>${run(node)}</w:p>`
   const blocks=parent=>{
    let output='',inline=[]
    const flush=()=>{if(inline.length){output+='<w:p>'+inline.join('')+'</w:p>';inline=[]}}
    for(const node of parent.childNodes){
     if(node.nodeType===3){if(node.textContent.trim())inline.push(run(node));continue}
     if(node.nodeType!==1)continue
     const tag=node.tagName
     if(tag==='TABLE'){
      flush();const rows=[...node.querySelectorAll('tr')].filter(row=>row.closest('table')===node)
      const columns=Math.max(1,...rows.map(row=>[...row.children].reduce((n,cell)=>n+(Number(cell.getAttribute('colspan'))||1),0)))
      output+=`<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(side=>`<w:${side} w:val="single" w:sz="4" w:color="CCD4DF"/>`).join('')}</w:tblBorders></w:tblPr><w:tblGrid>${Array.from({length:columns},()=>`<w:gridCol w:w="${Math.floor(9000/columns)}"/>`).join('')}</w:tblGrid>${rows.map(row=>'<w:tr>'+[...row.children].map(cell=>`<w:tc><w:tcPr><w:tcW w:w="${Math.floor(9000/columns)}" w:type="dxa"/>${Number(cell.getAttribute('colspan'))>1?`<w:gridSpan w:val="${Number(cell.getAttribute('colspan'))}"/>`:''}${cell.tagName==='TH'?'<w:shd w:fill="F2F5FA"/>':''}</w:tcPr>${blocks(cell)||'<w:p/>'}<w:p/></w:tc>`).join('')+'</w:tr>').join('')}</w:tbl>`
     }else if(tag==='UL'||tag==='OL'){flush();output+=[...node.children].map(li=>paragraph(li,tag==='OL'?2:1)).join('')}
     else if(['P','H2','H3','H4','BLOCKQUOTE'].includes(tag)){flush();output+=paragraph(node)}
     else if(tag==='DIV'){flush();output+=blocks(node)}
     else inline.push(run(node))
    }
    flush();return output
   }
   return blocks(doc.body)
  }
  const body=p(d.name,true)+p(`${d.major} · ${d.code} · ${d.level} · ${d.year}级`)+M.chapterDefs(d).map((c,i)=>p(`${i+1}. ${c.title}`,true)+(root.TalentPlanRichText?richXml(root.TalentPlanRichText.chapter(d,c.id)):(d.chapters[c.id]||'待补充').split('\n').map(t=>p(t)).join(''))).join('')+p('参考依据',true)+(d.citations||[]).map(c=>p(`${c.source} · ${c.section} · ${c.level}`)+p(c.url)).join('')+p('本文件为培养方案建议稿，具体要求以学校审定版本为准。')
  for(const item of media)zip.file('word/media/'+item.file,item.base64,{base64:true})
  relationships.push('<Relationship Id="numbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>')
  zip.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+relationships.join('')+'</Relationships>')
  zip.file('word/numbering.xml','<?xml version="1.0" encoding="UTF-8"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+[[1,'bullet','•'],[2,'decimal','%1.']].map(([id,format,text])=>`<w:abstractNum w:abstractNumId="${id}"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${format}"/><w:lvlText w:val="${text}"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="${id}"><w:abstractNumId w:val="${id}"/></w:num>`).join('')+'</w:numbering>')
  zip.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${[...imageTypes].map(ext=>`<Default Extension="${ext}" ContentType="image/${ext==='jpg'?'jpeg':ext}"/>`).join('')}<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`)
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
  zip.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`)
  return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})
 }
 root.TalentPlanFiles={read,readDocx,readPdf,exportDocx,download}
})(globalThis)
