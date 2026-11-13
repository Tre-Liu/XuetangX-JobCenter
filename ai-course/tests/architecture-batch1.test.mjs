import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read = p => readFileSync(new URL(p, import.meta.url),'utf8');
test('course CMS compatibility artifact excludes course workspace and oversized media',()=>{
 const html=read('../cms/index.html');
 assert.ok(Buffer.byteLength(html)<2*1024*1024,'CMS artifact must be under 2 MiB');
 assert.ok(!html.includes('framework-orb.gif'),'CMS must not contain project generation animation');
 assert.ok(!html.includes('knowledge-matching-loading'),'CMS must not contain course generation UI');
});
test('online course bundle externalizes large media and CMS has its own entry',()=>{
 const html=read('../dist/client/index.html');
 const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(scripts.length);
 for(const src of scripts){
  const path=src.replace(/^\//,'');
  assert.ok(statSync(new URL('../dist/client/'+path,import.meta.url)).size<5*1024*1024,'online entry must be below 5 MiB');
 }
 const cms=read('../dist/client/cms/index.html');
 assert.ok(Buffer.byteLength(cms)<10000,'online CMS must reference external compiled assets');
 assert.match(cms,/<script[^>]+type="module"[^>]+src=/);
});
