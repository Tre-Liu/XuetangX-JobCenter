import test from 'node:test';
import assert from 'node:assert/strict';
const config=await import('../index.mjs').catch(()=>({}));
test('independent CMS returns to original course with validated config and query context',()=>{
 assert.equal(typeof config.cmsHref,'function');
 globalThis.location=new URL('http://localhost:5186/index.html?class=version-2');
 const link=new URL(config.cmsHref({tier:'培育课'},'http://localhost:5188/course.html'));
 assert.equal(link.pathname,'/course.html');
 assert.equal(link.searchParams.get('returnTo'),'http://localhost:5186/index.html?class=version-2');
 globalThis.location=link;
 const back=new URL(config.courseHref({tier:'精品课'}));
 assert.equal(back.origin,'http://localhost:5186');
 assert.equal(back.searchParams.get('class'),'version-2');
 assert.equal(config.fromHash(back.hash).tier,'精品课');
 delete globalThis.location;
});
test('legacy CMS URLs still return to the course and unsafe return parameters are discarded',()=>{
 assert.equal(typeof config.courseHref,'function');
 globalThis.location=new URL('http://localhost/cms/index.html?returnTo=javascript%3Aalert(1)');
 assert.equal(new URL(config.courseHref({})).pathname,'/index.html');
 globalThis.location=new URL('file:///project/platform-cms/course.html');
 assert.equal(new URL(config.courseHref({})).pathname,'/project/ai-course/index.html');
 delete globalThis.location;
});
test('course hash routes survive CMS roundtrip and saved config is consumed before app routing',()=>{
 globalThis.location=new URL('http://localhost:5186/index.html#workspace?class=version-2');
 const link=config.cmsHref({tier:'培育课'},'http://localhost:5198/course.html');
 globalThis.location=new URL(link);
 const back=new URL(config.courseHref({tier:'精品课'}));
 assert.equal(back.hash,'#workspace?class=version-2');
 globalThis.location=back;
 const saved=new Map();globalThis.localStorage={getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)};
 globalThis.window={dispatchEvent(){}};
 globalThis.history={replaceState(_a,_b,url){globalThis.location=new URL(url,globalThis.location);}};
 assert.equal(config.initialConfig().tier,'精品课');
 assert.equal(globalThis.location.hash,'#workspace?class=version-2');
 assert.equal(globalThis.location.searchParams.has('courseConfig'),false);
 for(const key of ['location','localStorage','window','history'])delete globalThis[key];
});
test('standalone CMS can target an explicitly configured course origin',()=>{
 globalThis.location=new URL('http://localhost:5198/course.html');
 assert.equal(new URL(config.courseHref({},'http://localhost:5186/index.html')).origin,'http://localhost:5186');
 delete globalThis.location;
});
