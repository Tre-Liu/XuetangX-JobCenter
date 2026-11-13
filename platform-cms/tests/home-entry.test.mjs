import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
test('industry management card opens the industry workflow directly',()=>{
 const dom=new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'),{url:'http://localhost:5198/'});
 try{
  const link=[...dom.window.document.querySelectorAll('a')].find(a=>a.textContent.includes('专业与产业管理'));
  assert.equal(new URL(link.href).searchParams.get('entry'),'industry');
 }finally{dom.window.close();}
});
