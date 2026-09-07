import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
test('knowledge demo switch persists the empty state and restores saved graph edits', async () => {
 const errors = [], vc = new VirtualConsole();
 vc.on('jsdomError', e => errors.push(e.message));
 const stored = new Map();
 const mount = () => new JSDOM(html, { url: new URL('../index.html', import.meta.url).href, runScripts: 'dangerously', virtualConsole: vc, beforeParse(w) {
  w.structuredClone = structuredClone;
  // File origin storage is browser-dependent; keep the same storage across reloads.
  Object.defineProperty(w, 'localStorage', {value: {getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, String(value))}});
  w.ResizeObserver = class { observe() {} disconnect() {} };
  w.HTMLCanvasElement.prototype.getContext = () => ({font: '', measureText: text => ({width: String(text).length * 7})});
 }});
 let dom = mount();
 const wait = async f => {for (let i=0;i<150;i++) {if(f()) return; await new Promise(r=>setTimeout(r,10));} assert.fail('Knowledge toggle UI did not reach expected state: '+errors.join('; '));};
 const graph = async () => {await wait(()=>dom.window.document.querySelector('.nav-item')); [...dom.window.document.querySelectorAll('.nav-item')].find(b=>b.textContent.includes('知识图谱')).click(); await wait(()=>dom.window.document.querySelector('.kg-total'));};
 const toggle = async value => {const d=dom.window.document; d.querySelector('[aria-label="知识点演示设置"]').click(); await wait(()=>d.querySelector('[role="dialog"][aria-label="知识点演示设置"]')); d.querySelector(`[data-knowledge-enabled="${value}"]`).click(); await wait(()=>!d.querySelector('[role="dialog"][aria-label="知识点演示设置"]'));};
 try {
  await graph();
  assert.equal(dom.window.document.querySelector('.kg-total').textContent,'121');
  assert.ok(dom.window.document.querySelector('[aria-label="知识点演示设置"]'), 'hidden demo switch must be available');
  // A saved teacher edit must survive both switching and remounting.
  stored.set('ai-course-knowledge-v1', JSON.stringify({nodes:[{id:'root',name:'教师修订知识点',level:1}],links:[]}));
  await toggle(false);
  assert.equal(dom.window.document.querySelector('.kg-total').textContent,'0');
  assert.ok(dom.window.document.querySelector('.kg-empty-state'));
  assert.equal(dom.window.document.querySelector('.kg-echart'),null);
  assert.equal(stored.get('ai-course-knowledge-enabled-v1'),'false');
  dom.window.close(); dom=mount(); await graph();
  assert.equal(dom.window.document.querySelector('.kg-total').textContent,'0');
  await toggle(true);
  await wait(()=>dom.window.document.querySelector('.kg-echart'));
  assert.equal(dom.window.document.querySelector('.kg-total').textContent,'1');
  assert.match(stored.get('ai-course-knowledge-v1'),/教师修订知识点/);
  assert.deepEqual(errors,[]);
 } finally {dom.window.close();}
});
