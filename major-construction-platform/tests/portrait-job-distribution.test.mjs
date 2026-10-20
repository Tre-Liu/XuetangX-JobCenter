import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
await import('../src/data/portrait-distribution-map.js')
await import('../src/utils/portrait-job-distribution.js')
const distribution = globalThis.PortraitJobDistribution

test('province totals derive from cities and rankings descend by recruitment count', () => {
  const result = distribution.aggregateCities([
    { province: '广东', city: '深圳', count: 12 },
    { province: '广东', city: '广州', count: 8 },
    { province: '北京', city: '北京', count: 15 },
    { province: '广东', city: '深圳', count: 3 },
  ])
  assert.deepEqual(result.provinces, [{ name: '广东', count: 23 }, { name: '北京', count: 15 }])
  assert.deepEqual(result.cities, [{ name: '北京', count: 15 }, { name: '深圳', count: 15 }, { name: '广州', count: 8 }])
  assert.equal(result.total, 38)
  assert.throws(() => distribution.aggregateCities([{ province: '广东', city: '广州', count: -1 }]))
})

test('reference maps and rankings remain consistent without the removed note', () => {
  for (const job of ['BIM建模工程师', 'AI模型部署工程师', '工业视觉检测工程师']) {
    const data = distribution.getDemo(job)
    assert.equal(data.provinces.reduce((s, r) => s + r.count, 0), data.total)
    assert.equal(data.cities.reduce((s, r) => s + r.count, 0), data.total)
    const html = distribution.render(job)
    assert.doesNotMatch(html, /portrait-distribution-note|尚未接入逐条招聘记录/)
    assert.match(html, /岗位分布情况/)
    assert.match(html, /省级分布排名 TOP10/)
    assert.match(html, /市级分布排名 TOP10/)
    assert.equal((html.match(/<th scope="col">区域名称<\/th><th scope="col">招聘占比<\/th>/g) || []).length, 2)
    assert.doesNotMatch(html, /<button|<a |<title|tabindex|onclick|data-province/)
    assert.match(html, /role="img"/)
    assert.equal((html.match(/<path /g) || []).length, 35)
    assert.equal((html.match(/<tbody>/g) || []).length, 2)
    for (const body of html.matchAll(/<tbody>(.*?)<\/tbody>/g)) {
      assert.equal((body[1].match(/<tr>/g) || []).length, 10)
    }
    for (const row of [...data.provinces.slice(0, 10), ...data.cities.slice(0, 10)]) {
      assert.ok(html.includes(`<td>${row.name}</td><td>${(row.count / data.total * 100).toFixed(1)}%</td>`))
    }
    assert.match(html, /颜色深浅表示招聘占比/)
    assert.doesNotMatch(html, /<th scope="col">招聘数/)
    assert.match(html, /岗位画像测算/)
  }
})

test('both entries end the portrait with distribution after major matching', async () => {
  const vue = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  assert.match(vue, /data-portrait-major-matching[\s\S]*data-portrait-job-distribution[^\n]*<\/section>\s*<\/div>\s*<\/section>/)
  assert.match(html, /data-portrait-major-matching[\s\S]*PortraitJobDistribution\.render\(job.name\)[^\n]*<\/section><\/div><\/section>/)
})
