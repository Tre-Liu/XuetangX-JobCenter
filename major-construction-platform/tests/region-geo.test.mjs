import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const geoJson = JSON.parse(await readFile(new URL('../src/china-geo.json', import.meta.url), 'utf8'))
const regionGeo = await import('../src/utils/region-geo.js').catch(() => ({}))

test('interactive China map contains exactly the 34 named province-level regions', () => {
  assert.equal(typeof regionGeo.namedRegionFeatures, 'function', 'named-region filtering must be available')

  const features = regionGeo.namedRegionFeatures(
    geoJson.features,
    (feature) => String(feature.properties?.name || '').trim(),
  )

  assert.equal(features.length, 34)
  assert.ok(features.every((feature) => feature.properties.name.trim()))
  assert.ok(features.some((feature) => feature.properties.name === '吉林省'))
  assert.ok(features.some((feature) => feature.properties.name === '澳门特别行政区'))
})
