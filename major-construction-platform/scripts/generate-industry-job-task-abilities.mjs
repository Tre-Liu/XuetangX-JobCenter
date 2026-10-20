import fs from 'node:fs'
import vm from 'node:vm'

const root = new URL('../', import.meta.url)
const source = fs.readFileSync(new URL('index.html', root), 'utf8')
const start = source.indexOf('        const staticChains =')
const end = source.indexOf('        const staticCertificateDetails =', start)
if (start < 0 || end < 0) throw new Error('Cannot locate existing static portrait data')
const context = { URLSearchParams, window: { location: { search: '' } } }
vm.runInNewContext(source.slice(start, end) + '\nglobalThis.details = staticPortraitDetails;', context)
const jobs = Object.fromEntries(Object.values(context.details).map(job => {
  const categories = new Map(Object.entries(job.abilities).flatMap(([category, names]) => names.map(name => [name, category])))
  return [job.id, { name: job.name, tasks: job.tasks.map(task => ({
    name: task.name,
    relationBasis: task.relationBasis,
    abilities: task.abilities.map(name => {
      if (!categories.has(name)) throw new Error(`Missing category: ${job.id}: ${name}`)
      return { name, category: categories.get(name) }
    }),
  })) }]
}))
const data = { source: 'existing-static-portrait-demo', jobs }
fs.writeFileSync(new URL('public/opendesign/industry-job-task-abilities.js', root),
  '// Generated from existing static Demo tasks and abilities.\n' +
  'globalThis.IndustryJobTaskAbilities = ' + JSON.stringify(data) + ';\n')
console.log(`Reused task and ability data for ${Object.keys(jobs).length} Demo jobs`)
