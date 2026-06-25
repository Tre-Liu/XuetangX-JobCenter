import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distRoot = resolve(projectRoot, 'dist')
const indexPath = resolve(distRoot, 'index.html')

const readDistAsset = async (assetPath) => {
  const normalizedPath = assetPath.replace(/^\.\//, '')
  return readFile(resolve(distRoot, normalizedPath), 'utf8')
}

const escapeInlineScript = (script) => script.replaceAll('</script', '<\\/script')

const wrapScriptForParsedDom = (script) => `(() => {
  const runStudentCareerPlan = () => {
${script}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runStudentCareerPlan, { once: true });
  } else {
    runStudentCareerPlan();
  }
})();
`

const inlineStylesheet = async (html) => {
  const stylesheetPattern = /<link rel="stylesheet"[^>]+href="(\.\/assets\/[^"]+\.css)"[^>]*>/u
  const match = html.match(stylesheetPattern)
  if (!match) throw new Error('No Vite stylesheet asset found in dist/index.html')

  const css = await readDistAsset(match[1])
  return html.replace(stylesheetPattern, () => `<style>\n${css}\n</style>`)
}

const inlineScript = async (html) => {
  const scriptPattern = /<script type="module"[^>]+src="(\.\/assets\/[^"]+\.js)"[^>]*><\/script>/u
  const match = html.match(scriptPattern)
  if (!match) throw new Error('No Vite module script asset found in dist/index.html')

  const js = await readDistAsset(match[1])
  return html.replace(scriptPattern, () => `<script>\n${escapeInlineScript(wrapScriptForParsedDom(js))}\n</script>`)
}

let html = await readFile(indexPath, 'utf8')
html = await inlineStylesheet(html)
html = await inlineScript(html)

await writeFile(indexPath, html)
