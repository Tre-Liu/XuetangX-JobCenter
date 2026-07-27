import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('standalone dashboard builds a loadable index artifact', async () => {
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(resolve(projectRoot, 'dist/index.html'), 'utf8')
  assert.match(html, /<div id="app"><\/div>/)
  assert.match(html, /assets\/.*\.js/)
})
