import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { industryDataset, industryMajorSelection } from '../../packages/industry-core/index.mjs';
import * as state from '../src/industry/state.mjs';
import { managementHomeHref } from '../src/home-link.mjs';
import { createIndustryBrowserBridge } from '../../packages/data-access/industry-browser.mjs';

async function openEntry(saved, options = {}) {
  const html = await readFile(new URL('../industry.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../src/industry/main.js', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: options.url || 'https://cms.example.com/industry.html?entry=industry', runScripts: 'outside-only' });
  const context = dom.getInternalVMContext();
  Object.assign(context, { industryDataset, IndustryMajorSelection: industryMajorSelection, createIndustryBrowserBridge, managementHomeHref, ...state });
  if (saved) dom.window.localStorage.setItem(state.INDUSTRY_STATE_KEY, JSON.stringify(saved));
  if (options.noStorage) Object.defineProperty(dom.window, 'localStorage', { get() { throw new Error('storage blocked'); } });
  vm.runInContext(script.replace(/^import .*;\n/gm, ''), context);
  return dom;
}
const click = (dom, selector) => dom.window.document.querySelector(selector).click();
const identity = major => ({ level: major.uiLevel, sourceLevel: major.sourceLevel, code: major.code, name: major.name });

test('extracted CMS restores multi-major choices and preserves independent chain toggles after refresh', async () => {
  const firstRelation = industryDataset.relations[0];
  const secondRelation = industryDataset.relations.find(r => r.majorKey !== firstRelation.majorKey && r.chainId !== firstRelation.chainId);
  const majors = [firstRelation, secondRelation].map(r => industryDataset.majors.find(m => m.key === r.majorKey));
  const dom = await openEntry({ officialMajors: majors.map(identity), selectedChainIds: [firstRelation.chainId, secondRelation.chainId] });
  try {
    const document = dom.window.document;
    assert.equal(document.querySelector('#industryPage').hidden, false);
    assert.equal(document.querySelector('#associatedMajorCount').textContent, '2');
    assert.equal(document.querySelector('#associatedChainCount').textContent, '2 条');
    click(dom, `.select[data-id="${firstRelation.chainId}"]`);
    const saved = JSON.parse(dom.window.localStorage.getItem(state.INDUSTRY_STATE_KEY));
    assert.equal(saved.officialMajors.length, 2);
    assert.equal(saved.selectedChainIds.includes(firstRelation.chainId), false);
    assert.equal(saved.selectedChainIds.includes(secondRelation.chainId), true);
    const refreshed = await openEntry(saved);
    assert.equal(refreshed.window.document.querySelector('#associatedChainCount').textContent, '1 条');
    refreshed.window.close();
  } finally { dom.window.close(); }
});

test('picker selection persists across searches and cancellation leaves confirmed majors intact', async () => {
  const major = industryDataset.majors.find(m => m.uiLevel === 'undergraduate');
  const dom = await openEntry({ officialMajor: identity(major), selectedChainIds: [] });
  try {
    click(dom, '#topInit');
    const document = dom.window.document;
    const search = document.querySelector('#initMajorSearch');
    search.value = '不存在的专业';
    search.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.match(document.querySelector('#initMajorSelected').textContent, new RegExp(major.code));
    assert.match(document.querySelector('#initMajorList').textContent, /未找到/);
    click(dom, '#clearInitMajors');
    assert.equal(document.querySelector('#confirmInitMajorPicker').disabled, true);
    click(dom, '#cancelInitMajorPicker');
    click(dom, '#topInit');
    assert.match(document.querySelector('#initMajorSelected').textContent, new RegExp(major.code));
  } finally { dom.window.close(); }
});

test('file bridge initializes without storage and exposes valid return action', async () => {
  const major = industryDataset.majors.find(m => m.uiLevel === 'undergraduate');
  const url = state.createIndustryCmsUrl('file:///tmp/cms/industry.html', { state: { officialMajor: identity(major), selectedChainIds: [] }, returnTo: 'file:///tmp/major/index.html', baseUrl: 'file:///tmp/major/index.html' });
  const dom = await openEntry(null, { url, noStorage: true });
  try {
    assert.equal(dom.window.document.querySelector('#associatedMajorCount').textContent, '1');
    assert.equal(dom.window.document.querySelector('#returnToPlatform').hidden, false);
    click(dom, '#topInit');
    assert.equal(dom.window.document.querySelector('#confirmInitMajorPicker').disabled, false);
  } finally { dom.window.close(); }
});

test('malformed persisted fields do not crash entry and creation requires school, type and college', async () => {
  const major = industryDataset.majors[0];
  const dom = await openEntry({ officialMajor: identity(major), selectedChainIds: {} });
  try {
    click(dom, '#backToCourseList');
    click(dom, '#openCreateCourse');
    dom.window.HTMLElement.prototype.scrollIntoView = () => {};
    click(dom, '#confirmCreateCourse');
    const document = dom.window.document;
    assert.equal(document.querySelector('#courseSchoolError').hidden, false);
    assert.equal(document.querySelector('#createCourseOverlay').hidden, false);
    assert.equal(dom.window.localStorage.getItem('major-construction-platform:cms-ai-course-creation'), null);
  } finally { dom.window.close(); }
});

for (const noStorage of [false, true]) {
  test(`CMS bridge reload retains an edited chain selection with ${noStorage ? 'unavailable' : 'available'} storage`, async () => {
    const relation = industryDataset.relations[0];
    const major = industryDataset.majors.find(m => m.key === relation.majorKey);
    const url = state.createIndustryCmsUrl(noStorage ? 'file:///tmp/cms/industry.html#panel=associations' : 'https://cms.example.com/industry.html#panel=associations', {
      state: { officialMajor: identity(major), selectedChainIds: [relation.chainId] },
      baseUrl: 'https://cms.example.com/index.html',
    });
    const dom = await openEntry(null, { url, noStorage });
    try {
      assert.equal(dom.window.document.querySelector('#associatedChainCount').textContent, '1 条');
      click(dom, `.select[data-id="${relation.chainId}"]`);
      assert.equal(dom.window.document.querySelector('#associatedChainCount').textContent, '0 条');
      const saved = noStorage ? null : JSON.parse(dom.window.localStorage.getItem(state.INDUSTRY_STATE_KEY));
      const refreshed = await openEntry(saved, { url: dom.window.location.href, noStorage });
      try {
        assert.equal(refreshed.window.document.querySelector('#associatedChainCount').textContent, '0 条');
        assert.equal(new URLSearchParams(refreshed.window.location.hash.slice(1)).get('panel'), 'associations');
      } finally { refreshed.window.close(); }
    } finally { dom.window.close(); }
  });
}
