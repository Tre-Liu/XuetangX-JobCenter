import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Script} from 'node:vm';
const root=new URL('../',import.meta.url);
test('direct-open entry loads classic compiled JS and CSS with all device assets available',()=>{
 const html=readFileSync(new URL('index.html',root),'utf8');
 assert.match(html,/location.protocol === 'file:'/);
 assert.match(html,/\.\/standalone\/app.js/);
 assert.match(html,/\.\/standalone\/app.css/);
 const js=readFileSync(new URL('standalone/app.js',root),'utf8');
 new Script(js);
 const assets=[...js.matchAll(/["'`](\.\/public\/assets\/[^"'`]+)["'`]/g)].map(m=>m[1]);
 assert.ok(assets.length>=7);
 for(const asset of assets)assert.ok(existsSync(new URL(asset,root)),asset);
 assert.doesNotMatch(js,/["'`]\/assets\//);
 const css=readFileSync(new URL('standalone/app.css',root),'utf8');
 assert.ok(css.length>10000);
 for(const m of css.matchAll(/url\(([^)]+)\)/g)){const url=m[1].replace(/["'`]/g,'');assert.ok(url.startsWith('data:')||existsSync(new URL(url,new URL('standalone/',root))),url)}
});
