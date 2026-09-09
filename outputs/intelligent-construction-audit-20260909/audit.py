import json, re, zipfile, importlib.util
from pathlib import Path
from lxml import etree as E
ROOT=Path('/Users/liuhongzhe/Desktop/学堂/专业建设/Codex工程')
OUT=ROOT/'outputs/intelligent-construction-audit-20260909'
spec=importlib.util.spec_from_file_location('old',ROOT/'.tmp/enterprise-name-audit/audit_names.py'); old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
terms=['富凝','博宇','德绘','中国电建','中国电力建设','兴润建设','联强远大','山东岱圣','中国建筑','中国中铁','中建八局第四','中国铁建电气化']
result=[]
for folder in ['基础设施建设产业链企查查','房地产产业链企查查','公用事业产业链企查查']:
 p=next((old.ROOT/folder).glob('*.xlsx'))
 with zipfile.ZipFile(p) as z:
  ss=old.read_shared_strings(z); matchids={str(i) for i,s in enumerate(ss) if any(t in s for t in terms)}
  book=[]
  for sheet,path in old.workbook_sheets(z):
   header=old.identify_header(old.read_header_cells(z,path,ss))
   if not header: continue
   hr,cols=header; rows=0; found=[]
   with z.open(path) as f:
    for _,row in E.iterparse(f,events=('end',),tag='{'+old.MAIN_NS+'}row'):
     cells=list(row); namecell=next((c for c in cells if old.column_number(c.get('r',''))==cols['name']),None)
     if namecell is not None and int(row.get('r','0'))>hr:
      rows+=1; val=namecell.find('{'+old.MAIN_NS+'}v')
      maybe=(namecell.get('t')!='s' or (val is not None and val.text in matchids))
      if maybe:
       name=old.decode_cell(namecell,ss)
       if any(t in name for t in terms):
        rec={'row':int(row.get('r')), 'name':name}
        for role in ['credit','status']:
         c=next((c for c in cells if old.column_number(c.get('r',''))==cols.get(role)),None)
         rec[role]=old.decode_cell(c,ss) if c is not None else ''
        found.append(rec)
     row.clear()
     while row.getprevious() is not None: del row.getparent()[0]
   book.append({'sheet':sheet,'rows':rows,'matches':found})
  result.append({'file':str(p),'sheets':book})
  (OUT/'enterprise-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
  print(folder,[(s['sheet'],s['rows'],len(s['matches'])) for s in book],flush=True)
print('DONE',flush=True)
