import test from 'node:test';
import assert from 'node:assert/strict';

const apiUrl = new URL('../src/industry/state.mjs', import.meta.url);
const load = async () => {
  const api = await import(apiUrl).catch(() => ({}));
  assert.equal(typeof api.normalizeIndustryState, 'function', 'CMS owns validated industry state bridge');
  return api;
};
const majors = [
  { key: '本科:123456', uiLevel: 'undergraduate', sourceLevel: '本科', code: '123456', name: '专业甲' },
  { key: '专科:123456', uiLevel: 'vocational', sourceLevel: '专科', code: '123456', name: '专业乙' },
];
const data = { majors, chains: [{ id: 'chain-a' }, { id: 'chain-b' }], relations: [{ majorKey: majors[0].key, chainId: 'chain-a' }, { majorKey: majors[1].key, chainId: 'chain-b' }] };
const first = { level: 'undergraduate', sourceLevel: '本科', code: '123456' };
const second = { level: 'vocational', sourceLevel: '专科', code: '123456' };

test('bridge preserves legacy and multiple majors while pruning unknown or duplicate identities and chains', async () => {
  const { normalizeIndustryState } = await load();
  const legacy = normalizeIndustryState({ officialMajor: first, selectedChainIds: ['chain-a', 'chain-b', 'unknown'] }, data);
  assert.deepEqual(legacy.officialMajors.map(m => m.name), ['专业甲']);
  assert.deepEqual(legacy.selectedChainIds, ['chain-a']);
  const multiple = normalizeIndustryState({ officialMajors: [first, second, first, { ...first, code: 'unknown' }], selectedChainIds: ['chain-b', 'chain-a', 'chain-a'] }, data);
  assert.deepEqual(multiple.officialMajors.map(m => m.sourceLevel), ['本科', '专科']);
  assert.deepEqual(multiple.selectedChainIds, ['chain-b', 'chain-a']);
  assert.equal(multiple.initialized, true);
  assert.equal(normalizeIndustryState({ officialMajors: [], officialMajor: first }, data).officialMajor, null);
});

test('invalid state cannot overwrite browser state and non-array fields do not crash restoration', async () => {
  const { normalizeIndustryState, readIndustryCmsState } = await load();
  for (const invalid of [null, 'text', [], 4]) assert.equal(normalizeIndustryState(invalid, data), null);
  assert.deepEqual(normalizeIndustryState({ officialMajor: first, selectedChainIds: {}, disabledJobIds: 'x' }, data).selectedChainIds, []);
  for (const hash of ['#industryState=%', '#industryState=null', '#industryState=%7B%22version%22%3A99%7D']) assert.equal(readIndustryCmsState(hash, data), null);
});

test('independent and file CMS roundtrip keeps names, major levels and choices without browser storage', async () => {
  const { createIndustryCmsUrl, readIndustryCmsState, createIndustryReturnUrl } = await load();
  const state = { officialMajors: [first, second], selectedChainIds: ['chain-a', 'chain-b'] };
  const url = createIndustryCmsUrl('http://localhost:5175/industry.html', { state, returnTo: 'http://localhost:5173/index.html?tab=industry', majorName: '智能建造工程专业', baseUrl: 'http://localhost:5173/index.html', data });
  assert.equal(new URL(url).searchParams.get('entry'), 'industry');
  assert.equal(new URL(url).searchParams.get('majorName'), '智能建造工程专业');
  assert.equal(readIndustryCmsState(new URL(url).hash, data).officialMajors.length, 2);
  const returned = createIndustryReturnUrl('file:///tmp/专业/index.html', state, 'file:///tmp/cms/industry.html', data);
  assert.equal(new URL(returned).protocol, 'file:');
  assert.deepEqual(readIndustryCmsState(new URL(returned).hash, data).selectedChainIds, ['chain-a', 'chain-b']);
});

test('return navigation rejects executable schemes, remote file hosts and credential URLs', async () => {
  const { safeIndustryReturnUrl } = await load();
  for (const url of ['javascript:alert(1)', 'data:text/html,<h1>x</h1>', 'https://user:pass@example.com/index.html', 'file://remote/path/index.html', 'file:///tmp/a.html', 'https://evil.example/index.html', 'http://example.com/index.html']) assert.equal(safeIndustryReturnUrl(url, 'https://example.com/cms/industry.html'), null);
  assert.equal(safeIndustryReturnUrl('../index.html', 'https://example.com/cms/industry.html'), 'https://example.com/index.html');
  assert.equal(safeIndustryReturnUrl('file:///tmp/a.html', 'file:///tmp/cms.html'), 'file:///tmp/a.html');
  assert.equal(safeIndustryReturnUrl('file://remote/a.html', 'file:///tmp/cms.html'), null);
  assert.equal(safeIndustryReturnUrl('file:///tmp/program.sh', 'file:///tmp/cms.html'), null);
  assert.equal(safeIndustryReturnUrl('http://localhost:5173/index.html', 'http://localhost:5188/industry.html'), 'http://localhost:5173/index.html');
});

test('job matching bridge recomputes trusted jobs but does not mark an in-progress match initialized', async () => {
  const { normalizeIndustryState } = await load();
  const major = { key: '本科:080902', uiLevel: 'undergraduate', sourceLevel: '本科', code: '080902', name: '软件工程' };
  const catalogue = { majors: [major], chains: [], relations: [] };
  const input = { officialMajor: { ...major, level: major.uiLevel }, matchingMode: 'job-name', initialized: false, matchedJobs: [{ id: 'fake', name: '外部注入岗位' }], disabledJobIds: ['fake'] };
  const pending = normalizeIndustryState(input, catalogue);
  assert.equal(pending.initialized, false);
  assert.deepEqual(pending.matchedJobs, []);
  const ready = normalizeIndustryState({ ...input, initialized: true }, catalogue);
  assert.equal(ready.initialized, true);
  assert.ok(ready.matchedJobs.length > 0);
  assert.ok(ready.matchedJobs.every(job => job.id !== 'fake'));
  assert.deepEqual(ready.disabledJobIds, []);
});
