import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const cache = new Map()
function load(file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file)
  const exports = {}; cache.set(file, exports)
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  vm.runInNewContext(js, { exports, require: name => load(path.resolve(path.dirname(file), name + '.ts')) })
  return exports
}
const research = load(path.join(root, 'src/mock/job-research.ts'))
const center = load(path.join(root, 'src/mock/job-center.ts'))
const jobs = [...research.PORTRAIT_JOB_DETAILS, ...center.JOB_CARDS.map(j => research.getPortraitJobDetail(j.id))]
const unique = [...new Map(jobs.map(j => [j.name, j])).values()]
fs.writeFileSync(process.argv[2], JSON.stringify(unique, null, 2))
console.log('Portrait profiles', unique.length)
