import test from 'node:test';
import assert from 'node:assert/strict';
import { industryDataset } from '../../packages/industry-core/index.mjs';
import { createIndustryCmsUrl, readIndustryCmsState, INDUSTRY_STATE_KEY } from '../../packages/data-access/industry-state.mjs';

const major = industryDataset.majors.find(m => m.matchStatus === '已匹配');
const chain = industryDataset.relations.find(r => r.majorKey === major.key).chainId;
const state = { officialMajor: { level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code }, selectedChainIds: [chain] };
const load = async () => {
  const api = await import('../../packages/data-access/industry-browser.mjs').catch(() => ({}));
  assert.equal(typeof api.createIndustryBrowserBridge, 'function');
  return api.createIndustryBrowserBridge;
};
function browser(href, storageWorks = true) {
  const values = new Map();
  const host = { location: new URL(href), localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  if (!storageWorks) Object.defineProperty(host, 'localStorage', { get() { throw new Error('blocked'); } });
  return { host, values };
}

test('business page consumes CMS hash before first storage read and can send updated state back', async () => {
  const create = await load();
  const url = createIndustryCmsUrl('https://school.test/index.html?view=job-industry', { state, baseUrl: 'https://school.test/industry.html' });
  const { host, values } = browser(url);
  const bridge = create(host);
  assert.equal(bridge.consume().selectedChainIds[0], chain);
  assert.equal(JSON.parse(values.get(INDUSTRY_STATE_KEY)).officialMajor.code, major.code);
  const target = new URL(bridge.cmsUrl());
  assert.equal(target.pathname, '/industry-research-admin.html');
  assert.equal(new URL(target.searchParams.get('returnTo')).searchParams.get('view'), 'job-industry');
  assert.equal(readIndustryCmsState(target.hash).selectedChainIds[0], chain);
});

test('file state survives storage denial for read, navigation and reset', async () => {
  const create = await load();
  const url = createIndustryCmsUrl('file:///tmp/major/index.html', { state, baseUrl: 'file:///tmp/cms/industry.html' });
  const { host } = browser(url, false);
  const bridge = create(host);
  bridge.consume();
  assert.equal(bridge.read().initialized, true);
  assert.equal(readIndustryCmsState(new URL(bridge.cmsUrl()).hash).selectedChainIds[0], chain);
  bridge.reset();
  assert.equal(bridge.read(), null);
});

test('legacy view forwards once to CMS and strips the legacy view from its return target', async () => {
  const create = await load();
  const { host } = browser('https://school.test/index.html?view=industry-research-admin&entry=industry&majorName=临床医学');
  const bridge = create(host);
  const target = new URL(bridge.legacyRedirectUrl());
  assert.equal(target.pathname, '/industry-research-admin.html');
  assert.equal(target.searchParams.get('majorName'), '临床医学');
  assert.equal(new URL(target.searchParams.get('returnTo')).searchParams.has('view'), false);
  assert.equal(create(browser(target.href).host).legacyRedirectUrl(), null);
});

test('a readable but non-writable storage cannot hide the incoming return state', async () => {
  const create = await load();
  const url = createIndustryCmsUrl('https://school.test/index.html', { state, baseUrl: 'https://school.test/industry.html' });
  const { host } = browser(url);
  host.localStorage.setItem = () => { throw new Error('quota'); };
  const bridge = create(host);
  bridge.consume();
  assert.equal(bridge.read().selectedChainIds[0], chain);
});

test('reset removes return-state hash so refreshing cannot revive discarded configuration', async () => {
  const create = await load();
  const url = createIndustryCmsUrl('https://school.test/index.html', { state, baseUrl: 'https://school.test/industry.html' });
  const { host } = browser(url, false);
  host.history = { replaceState(_state, _title, href) { host.location = new URL(href); } };
  const bridge = create(host);
  bridge.consume();
  bridge.reset();
  assert.equal(create(host).consume(), null);
});

test('generated classic bridge consumes return state using the host catalog and retains other URL hash fields', async () => {
  const { readFile } = await import('node:fs/promises');
  const vm = await import('node:vm');
  const { industryMajorSelection } = await import('../../packages/industry-core/index.mjs');
  const url = createIndustryCmsUrl('https://school.test/index.html#panel=jobs', { state, baseUrl: 'https://school.test/industry.html' });
  const { host } = browser(url);
  const context = { URL, URLSearchParams, location: host.location, localStorage: host.localStorage, INDUSTRY_MAJOR_CHAIN_DATA: industryDataset, IndustryMajorSelection: industryMajorSelection };
  context.history = { replaceState(_state, _title, href) { context.location = new URL(href); } };
  vm.runInNewContext(await readFile(new URL('../../major-construction-platform/src/app/industry-cms-bridge.js', import.meta.url), 'utf8'), context);
  assert.equal(context.IndustryCmsBridge.consume().officialMajor.code, major.code);
  assert.equal(context.location.hash, '#panel=jobs');
  const target = new URL(context.IndustryCmsBridge.cmsUrl());
  assert.equal(new URL(target.searchParams.get('returnTo')).hash, '#panel=jobs');
  assert.equal(readIndustryCmsState(target.hash).selectedChainIds[0], chain);
});
