import { readFile } from 'node:fs/promises'

export async function readCssWithImports(url) {
  const source = await readFile(url, 'utf8')
  const importPattern = /^@import\s+['"](.+?)['"];\s*$/gm
  const chunks = []
  let lastIndex = 0

  for (const match of source.matchAll(importPattern)) {
    chunks.push(source.slice(lastIndex, match.index))
    chunks.push(await readCssWithImports(new URL(match[1], url)))
    lastIndex = match.index + match[0].length
  }

  chunks.push(source.slice(lastIndex))
  return chunks.join('\n')
}
