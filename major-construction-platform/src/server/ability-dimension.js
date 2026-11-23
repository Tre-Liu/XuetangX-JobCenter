import {json, readGraphJson, generateGraphResponse} from './structured-graph-api.js'
import '../ability-dimension/model.js'
const {instructions, format} = globalThis.AbilityDimensionModel
const text = (value, max) => typeof value === 'string' && value.length <= max
const labels = value => Array.isArray(value) && value.length <= 250 && value.every(item => text(item, 240))
export async function handleAbilityDimensionRequest(request, env = {}, fetchImpl = globalThis.fetch) {
  if (request.method !== 'POST') return json({error:'method-not-allowed'},405,{allow:'POST'})
  const parsed = await readGraphJson(request, 96 * 1024)
  if (parsed.response) return parsed.response
  const input = parsed.data
  if (!text(input?.major,180) || !input.major.trim() || !text(input.focus,3000) ||
      !labels(input.skills) || !labels(input.courses)) return json({error:'invalid-input'},400)
  const {major, focus, skills, courses} = input
  const model = env.ABILITY_DIMENSION_MODEL || env.AI_SUMMARY_MODEL || 'gpt-5.4-mini'
  return generateGraphResponse({
    request, env, fetchImpl, model, instructions, format, data:{major, focus, skills, courses},
    prepare(output) {
      const paths = output?.paths
      if (!Array.isArray(paths) || !paths.length || paths.length > 300 ||
          !paths.every(path => Array.isArray(path) && path.length >= 1 && path.length <= 5 &&
            path.every(label => text(label,160) && label.trim()))) return null
      return {major, paths, model}
    },
  })
}
