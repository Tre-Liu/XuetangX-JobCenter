import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const civicDesign = await import('../src/app/course-civic-design.ts').catch(() => ({}))
const appVue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const courseCss = await readFile(new URL('../src/styles/70-course-engine.css', import.meta.url), 'utf8')

test('selecting a civic element applies its maintained default design method', () => {
  assert.equal(typeof civicDesign.selectCourseCivicElement, 'function')

  const result = civicDesign.selectCourseCivicElement(
    { elementId: '', designMethod: '原有设计' },
    civicDesign.defaultCourseCivicElements,
    'social-responsibility'
  )

  assert.deepEqual(result, {
    elementId: 'social-responsibility',
    designMethod: '结合知识点任务，引导学生识别专业实践中的社会责任。'
  })
})

test('clearing the civic element also clears the knowledge point design method', () => {
  const result = civicDesign.selectCourseCivicElement(
    { elementId: 'social-responsibility', designMethod: '已填写的设计方式' },
    civicDesign.defaultCourseCivicElements,
    ''
  )

  assert.deepEqual(result, { elementId: '', designMethod: '' })
})

test('adding a custom civic element trims its name and rejects duplicates', () => {
  const added = civicDesign.addCourseCivicElement(
    civicDesign.defaultCourseCivicElements,
    '  工程责任意识  '
  )

  assert.equal(added.length, civicDesign.defaultCourseCivicElements.length + 1)
  assert.equal(added.at(-1).name, '工程责任意识')
  assert.equal(added.at(-1).defaultDesignMethod, '')
  assert.deepEqual(civicDesign.addCourseCivicElement(added, '工程责任意识'), added)
})

test('editing an element updates its name and default method without changing its stable id', () => {
  const updated = civicDesign.updateCourseCivicElement(
    civicDesign.defaultCourseCivicElements,
    'moral-ethics',
    {
      name: '职业道德与工程伦理',
      defaultDesignMethod: '通过真实案例识别伦理责任边界。'
    }
  )

  assert.deepEqual(updated[0], {
    id: 'moral-ethics',
    name: '职业道德与工程伦理',
    defaultDesignMethod: '通过真实案例识别伦理责任边界。'
  })
})

test('saving civic designs replaces only the current knowledge point draft', () => {
  const current = {
    '方差分析': { elementId: 'scientific-culture', designMethod: '培养科学精神。' }
  }

  const result = civicDesign.saveCourseCivicDesign(current, '勾股定理的概念', {
    elementId: 'social-responsibility',
    designMethod: '理解工程计算结果对公共安全的影响。'
  })

  assert.deepEqual(result, {
    '方差分析': { elementId: 'scientific-culture', designMethod: '培养科学精神。' },
    '勾股定理的概念': {
      elementId: 'social-responsibility',
      designMethod: '理解工程计算结果对公共安全的影响。'
    }
  })
})

test('Vue knowledge point detail exposes the complete civic design workflow', () => {
  for (const marker of [
    '思政设计',
    '思政元素',
    '设计方式',
    '编辑思政元素',
    '默认设计方式',
    '@click="selectCourseCivicElementForNode',
    '@click.stop="openCourseCivicElementEditor',
    '@click="addCourseCivicElementFromPicker',
  ]) {
    assert.match(appVue, new RegExp(marker))
  }
  assert.match(courseCss, /\.course-civic-design/)
  assert.match(courseCss, /\.course-civic-element-menu/)
})

test('standalone knowledge point detail keeps the civic design workflow in sync', () => {
  for (const marker of [
    'data-course-civic-picker',
    'data-course-civic-select',
    'data-course-civic-edit',
    'data-course-civic-add',
    'data-course-civic-method',
    '编辑思政元素',
    '默认设计方式',
  ]) {
    assert.match(staticHtml, new RegExp(marker))
  }
})

test('civic element menu remains usable inside a short knowledge drawer viewport', () => {
  const menuBlock = courseCss.match(/\.course-civic-element-menu\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
  const optionsBlock = courseCss.match(/\.course-civic-element-options\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''

  assert.match(menuBlock, /max-height:/)
  assert.match(menuBlock, /grid-template-rows:/)
  assert.match(optionsBlock, /overflow-y:\s*auto/)
  assert.match(appVue, /class="course-civic-element-options"/)
  assert.match(staticHtml, /class=\"course-civic-element-options\"/)
})
