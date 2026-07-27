import test from 'node:test'
import assert from 'node:assert/strict'
import { SOURCE_REGISTRY } from '../scripts/source-registry.mjs'

test('registry defines every required source with relative candidates', () => {
  assert.deepEqual(
    new Set(SOURCE_REGISTRY.map((source) => source.assetId)),
    new Set(['chains', 'stages', 'majors', 'industries', 'positions', 'recruitment']),
  )
  assert.ok(SOURCE_REGISTRY.every((source) => source.required === true))
  assert.ok(SOURCE_REGISTRY.flatMap((source) => source.candidates).every((path) => !path.startsWith('/')))
})

test('recruitment source keeps stable output ahead of worktree fallback', () => {
  const source = SOURCE_REGISTRY.find((item) => item.id === 'recruitmentManifests')
  assert.deepEqual(source.candidates, [
    'outputs/recruitment_position_matching/v1/manifests',
    '.worktrees/recruitment-position-matching/outputs/recruitment_position_matching/v1/manifests',
  ])
})

test('registry definitions and candidate lists cannot be mutated at runtime', () => {
  const source = SOURCE_REGISTRY.find((item) => item.id === 'recruitmentManifests')
  const originalCandidate = source.candidates[0]

  assert.throws(() => source.candidates.push('unexpected/manifests'), TypeError)
  assert.throws(() => {
    source.candidates[0] = 'unexpected/manifests'
  }, TypeError)
  assert.throws(() => {
    source.id = 'unexpected'
  }, TypeError)
  assert.equal(source.candidates[0], originalCandidate)
})
