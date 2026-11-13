import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const source = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('double-clicked root home links to runnable offline pages, while HTTP keeps online entries', () => {
  for (const [url, prefix] of [['file:///project/platform-cms/index.html', '/project/platform-cms/offline/'], ['https://school.test/platform-cms/', '/platform-cms/']]) {
    const dom = new JSDOM(source('index.html'), {url, runScripts: 'dangerously'});
    try {
      const links = [...dom.window.document.querySelectorAll('main a')];
      assert.deepEqual(links.map(a => new URL(a.href).pathname), [prefix + 'industry.html', prefix + 'course.html']);
      assert.equal(new URL(links[0].href).searchParams.get('entry'), 'industry');
    } finally { dom.window.close(); }
  }
});

for (const page of ['course', 'industry']) {
  test(`direct file ${page} entry redirects once, retaining caller and configuration`, () => {
    const dom = new JSDOM(source(`${page}.html`));
    const script = dom.window.document.querySelector('script[data-file-entry]');
    assert.ok(script, 'source entry must recover direct file opening');
    for (const protocol of ['file:', 'https:']) {
      let target = null;
      vm.runInNewContext(script.textContent, {location: {protocol, search: '?entry=industry&returnTo=caller', hash: '#state=retained', replace: value => {target = value;}}});
      assert.equal(target, protocol === 'file:' ? `./offline/${page}.html?entry=industry&returnTo=caller#state=retained` : null);
    }
    dom.window.close();
  });
}

test('offline home and both built pages form a self-contained return loop', async () => {
  const homeUrl = new URL('../offline/index.html', import.meta.url);
  const home = new JSDOM(source('offline/index.html'), {url: homeUrl.href, runScripts: 'dangerously'});
  try {
    for (const anchor of home.window.document.querySelectorAll('main a')) {
      const target = new URL(anchor.href);
      assert.equal(new URL('.', target).href, new URL('.', homeUrl).href);
      assert.ok(existsSync(new URL(target.pathname, 'file:')));
      const errors = [];
      const dom = new JSDOM(readFileSync(target, 'utf8'), {url: target.href, runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(window) {window.addEventListener('error', event => errors.push(event.message));}});
      try {
        await new Promise(resolve => setTimeout(resolve, 80));
        assert.equal(dom.window.document.querySelector('script[data-file-entry]'), null, 'built page must not redirect into a second offline directory');
        assert.equal(dom.window.document.querySelector('script[src]'), null);
        assert.ok(dom.window.document.querySelector('style')?.textContent.length > 1000);
        assert.equal(dom.window.document.querySelector('.cms-home-link')?.href, homeUrl.href);
        assert.deepEqual(errors, []);
        if (target.pathname.endsWith('/industry.html')) assert.equal(dom.window.document.querySelector('#industryPage').hidden, false);
        else assert.ok(dom.window.document.querySelector('.course-cms'));
      } finally {dom.window.close();}
    }
  } finally {home.window.close();}
});
