import { spawnSync } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const viteBin = resolve(projectRoot, 'node_modules/vite/bin/vite.js')
const outputDir = resolve(projectRoot, 'dist-single')

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))
  return match?.[1]
}

function localAssetPath(buildDir, reference) {
  if (!reference || /^(?:[a-z]+:)?\/\//i.test(reference) || reference.startsWith('data:')) {
    throw new Error(`单 HTML 构建不支持资源引用: ${String(reference)}`)
  }

  const cleanReference = reference.split(/[?#]/, 1)[0].replace(/^\/+/, '')
  const resolved = resolve(buildDir, cleanReference)
  if (!resolved.startsWith(`${resolve(buildDir)}/`)) {
    throw new Error(`单 HTML 构建拒绝越界资源引用: ${reference}`)
  }
  return resolved
}

async function inlineStyles(html, buildDir) {
  const tags = [...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi)]
    .map((match) => match[0])

  for (const tag of tags) {
    const css = await readFile(localAssetPath(buildDir, attribute(tag, 'href')), 'utf8')
    html = html.replace(tag, `<style>${css}</style>`)
  }
  return html
}

async function inlineScripts(html, buildDir) {
  const tags = [...html.matchAll(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*><\/script>/gi)]
    .map((match) => match[0])

  for (const tag of tags) {
    if (attribute(tag, 'type') !== 'module') {
      throw new Error(`单 HTML 构建只支持 Vite 模块脚本: ${tag}`)
    }
    const script = await readFile(localAssetPath(buildDir, attribute(tag, 'src')), 'utf8')
    html = html.replace(
      tag,
      `<script type="module">${script.replace(/<\/script/gi, '<\\/script')}</script>`,
    )
  }
  return html
}

function assertSelfContained(html) {
  const forbidden = [
    [/<script\b[^>]*\bsrc\s*=/i, '外部脚本'],
    [/<link\b[^>]*\brel=["'](?:stylesheet|modulepreload|preload)["']/i, '外部样式或预加载'],
    [/<(?:img|source|video|audio)\b[^>]*\bsrc(?:set)?\s*=/i, '媒体资源'],
    [/\b(?:src|href)=["']https?:\/\//i, '网络资源'],
    [/url\(\s*["']?(?!data:|#)[^)]+/i, 'CSS 附属资源'],
  ]
  for (const [pattern, label] of forbidden) {
    if (pattern.test(html)) throw new Error(`单 HTML 仍包含${label}`)
  }
}

async function main() {
  const temporaryBuildDir = await mkdtemp(join(tmpdir(), 'data-dashboard-single-html-'))
  try {
    const build = spawnSync(process.execPath, [
      viteBin,
      'build',
      '--outDir',
      temporaryBuildDir,
      '--emptyOutDir',
    ], {
      cwd: projectRoot,
      encoding: 'utf8',
    })
    if (build.status !== 0) {
      throw new Error(`${build.stdout}\n${build.stderr}`.trim())
    }

    let html = await readFile(join(temporaryBuildDir, 'index.html'), 'utf8')
    html = await inlineStyles(html, temporaryBuildDir)
    html = await inlineScripts(html, temporaryBuildDir)
    assertSelfContained(html)

    await rm(outputDir, { recursive: true, force: true })
    await mkdir(outputDir, { recursive: true })
    await writeFile(join(outputDir, 'index.html'), `${html.trim()}\n`, 'utf8')

    const files = await readdir(outputDir)
    if (files.length !== 1 || files[0] !== 'index.html') {
      throw new Error(`单 HTML 输出目录包含意外文件: ${files.join(', ')}`)
    }
    console.log(`单 HTML 已生成: ${join(outputDir, 'index.html')}`)
  } finally {
    await rm(temporaryBuildDir, { recursive: true, force: true })
  }
}

await main()
