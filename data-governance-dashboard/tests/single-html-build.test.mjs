import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('single HTML build produces one offline dashboard without sidecar resources', async () => {
  const result = spawnSync('npm', ['run', 'build:single'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  assert.deepEqual(await readdir(resolve(projectRoot, 'dist-single')), ['index.html'])

  const html = await readFile(resolve(projectRoot, 'dist-single/index.html'), 'utf8')
  assert.match(html, /<div id="app"><\/div>/)
  assert.match(html, /<style>/)
  assert.match(html, /<script type="module">/)
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=/i)
  assert.doesNotMatch(html, /<link\b[^>]*\brel=["'](?:stylesheet|modulepreload|preload)["']/i)
  assert.doesNotMatch(html, /<(?:img|source|video|audio)\b[^>]*\bsrc(?:set)?\s*=/i)
  assert.doesNotMatch(html, /\b(?:src|href)=["']https?:\/\//i)
})
