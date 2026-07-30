import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const staticHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('file-mode report job picker renders job names without group labels', () => {
  const pickerStart = staticHtml.indexOf('const jobPicker =')
  const pickerEnd = staticHtml.indexOf('const chainPicker =', pickerStart)
  const pickerSource = staticHtml.slice(pickerStart, pickerEnd)

  assert.ok(pickerStart >= 0)
  assert.ok(pickerEnd > pickerStart)
  assert.match(pickerSource, /<strong>\$\{escapeText\(job\.name\)\}<\/strong>/)
  assert.doesNotMatch(pickerSource, /<em>\$\{escapeText\(job\.groupName\)\}<\/em>/)
})
